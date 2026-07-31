"""The generation loop: chunks in, validated questions out, resumable.

Resumability is not a nicety here. Measured on the target machine one course
takes hours, so the loop is built to be killed and restarted at any point:
every chunk's output is appended to disk the moment it arrives, and a restart
skips whatever is already there.
"""

from __future__ import annotations

import json
import os
import random
import time

from . import validate
from .prompts import SYSTEM, build_user_prompt


def allocate(chunks, quota: int, per_call: int,
             max_chapter_share: float = 0.20) -> dict[str, int]:
    """Spread `quota` questions across chunks in proportion to their length.

    Weighting by words rather than giving every chunk an equal share keeps the
    question paper proportional to the syllabus: a 40-page chapter should carry
    more questions than a 4-page one, which is how the real exam is weighted.

    Pure length-weighting does skew though — Series VI chapter 4 is long enough
    to claim 27% of the paper on its own. `max_chapter_share` caps any single
    chapter and redistributes the excess, so no one topic can dominate a mock.
    """
    by_chapter: dict[int, list] = {}
    for c in chunks:
        by_chapter.setdefault(c.chapter_no, []).append(c)

    total_words = sum(c.words for c in chunks) or 1
    weights = {c.chunk_id: c.words / total_words for c in chunks}

    # Cap each chapter, then hand the freed share to the uncapped chapters in
    # proportion to what they already had.
    cap = max(max_chapter_share, 1.0 / max(len(by_chapter), 1))
    freed = 0.0
    capped: set[int] = set()
    for chapter, members in by_chapter.items():
        share = sum(weights[c.chunk_id] for c in members)
        if share > cap:
            scale = cap / share
            for c in members:
                weights[c.chunk_id] *= scale
            freed += share - cap
            capped.add(chapter)

    if freed > 0:
        room = sum(w for cid, w in weights.items()
                   if next(c.chapter_no for c in chunks if c.chunk_id == cid) not in capped)
        if room > 0:
            for c in chunks:
                if c.chapter_no not in capped:
                    weights[c.chunk_id] += freed * weights[c.chunk_id] / room

    raw = {cid: quota * w for cid, w in weights.items()}

    alloc = {cid: int(v) for cid, v in raw.items()}
    # Hand out the rounding remainder to the chunks that lost the most.
    short = quota - sum(alloc.values())
    if short > 0:
        order = sorted(raw, key=lambda cid: raw[cid] - alloc[cid], reverse=True)
        for cid in order[:short]:
            alloc[cid] += 1

    # Never ask for more in one call than the model can hold together.
    return {cid: n for cid, n in alloc.items() if n > 0}


class Runner:
    def __init__(self, provider, out_dir: str, exemplars: list[dict],
                 per_call: int = 8, overshoot: float = 1.35, seed: int = 7):
        self.provider = provider
        self.out_dir = out_dir
        self.exemplars = exemplars
        self.per_call = per_call
        self.overshoot = overshoot
        self.rng = random.Random(seed)

        os.makedirs(out_dir, exist_ok=True)
        self.raw_path = os.path.join(out_dir, "raw.jsonl")
        self.clean_path = os.path.join(out_dir, "clean.jsonl")
        self.reject_path = os.path.join(out_dir, "rejected.jsonl")
        self.state_path = os.path.join(out_dir, "state.json")

        self.state = self._load_state()
        self.deduper = validate.Deduper()
        self.clean: list[dict] = []
        self._reload_clean()

    # ------------------------------------------------------------- state

    def _load_state(self) -> dict:
        if os.path.exists(self.state_path):
            with open(self.state_path) as fh:
                return json.load(fh)
        return {"done_chunks": {}, "started": time.time()}

    def _save_state(self) -> None:
        with open(self.state_path, "w") as fh:
            json.dump(self.state, fh, indent=2)

    def _reload_clean(self) -> None:
        if not os.path.exists(self.clean_path):
            return
        with open(self.clean_path) as fh:
            for line in fh:
                if not line.strip():
                    continue
                item = json.loads(line)
                self.clean.append(item)
                self.deduper.accept(item["question"])

    def seed_existing(self, questions: list[str]) -> None:
        """Teach the deduper about questions that already exist elsewhere."""
        for q in questions:
            self.deduper.add_existing(q)

    # -------------------------------------------------------------- run

    def _append(self, path: str, obj: dict) -> None:
        with open(path, "a") as fh:
            fh.write(json.dumps(obj) + "\n")

    def _recent_for_chapter(self, chapter_no: int, limit: int = 8) -> list[str]:
        out = [c["question"] for c in reversed(self.clean)
               if c.get("chapter_no") == chapter_no]
        return out[:limit]

    def run(self, chunks, quota: int, log=print) -> list[dict]:
        target = int(quota * self.overshoot)
        alloc = allocate(chunks, target, self.per_call)
        by_id = {c.chunk_id: c for c in chunks}

        pending = [cid for cid in alloc if cid not in self.state["done_chunks"]]
        log(f"  {len(self.clean)} already kept · {len(pending)} chunks to run "
            f"· asking for {target} to land {quota}")

        started = time.time()
        for n_done, cid in enumerate(pending, 1):
            if len(self.clean) >= target:
                log(f"  reached {len(self.clean)} questions — stopping early")
                break

            chunk = by_id[cid]
            want = min(alloc[cid], self.per_call)
            prompt = build_user_prompt(
                chunk, want, self.exemplars,
                self._recent_for_chapter(chunk.chapter_no), self.rng,
            )

            t0 = time.time()
            try:
                items = self.provider.generate_mcqs(
                    SYSTEM, prompt, max_tokens=200 * want + 200
                )
            except Exception as exc:
                log(f"  ! {cid}: {exc}")
                continue

            kept = 0
            for item in items:
                self._append(self.raw_path, {"chunk_id": cid, **item})

                bad = validate.check(item)
                if bad:
                    self._append(self.reject_path,
                                 {"chunk_id": cid, "reason": bad.reason,
                                  "detail": bad.detail, **item})
                    continue

                dup, against = self.deduper.is_duplicate(item["question"])
                if dup:
                    self._append(self.reject_path,
                                 {"chunk_id": cid, "reason": "duplicate",
                                  "detail": against[:120], **item})
                    continue

                record = {
                    "question": item["question"].strip(),
                    "options": [str(o).strip() for o in item["options"]],
                    "correct": item["correct"].strip().upper(),
                    "explanation": item["explanation"].strip(),
                    "chunk_id": cid,
                    "chapter_no": chunk.chapter_no,
                    "chapter_title": chunk.chapter_title,
                    "section_no": chunk.section_no,
                    "page_start": chunk.page_start,
                    "page_end": chunk.page_end,
                }
                self.deduper.accept(record["question"])
                self.clean.append(record)
                self._append(self.clean_path, record)
                kept += 1

            self.state["done_chunks"][cid] = {"asked": want, "kept": kept}
            self._save_state()

            elapsed = time.time() - started
            pace = elapsed / n_done
            left = (len(pending) - n_done) * pace
            log(f"  [{n_done:3d}/{len(pending)}] ch{chunk.chapter_no:02d} "
                f"asked {want:2d} kept {kept:2d} · total {len(self.clean):4d}/{target} "
                f"· {time.time() - t0:5.1f}s · eta {left / 60:5.1f}m")

        return self.clean
