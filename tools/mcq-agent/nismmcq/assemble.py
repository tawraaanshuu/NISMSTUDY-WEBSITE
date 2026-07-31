"""Deal validated questions into the ten papers each course already owns.

Each paper must stand on its own as a mock of the whole syllabus, so questions
are dealt round-robin from a chapter-interleaved pool rather than sliced in
order. Slicing in order would give paper 1 the whole of chapter 1 and paper 10
the whole of chapter 10, which is useless as exam practice.
"""

from __future__ import annotations

import random
from collections import defaultdict

from . import validate


def _interleave_by_chapter(items: list[dict], rng: random.Random) -> list[dict]:
    """Order questions so consecutive picks come from different chapters."""
    buckets: dict[int, list[dict]] = defaultdict(list)
    for item in items:
        buckets[item.get("chapter_no", 0)].append(item)
    for bucket in buckets.values():
        rng.shuffle(bucket)

    # Draw from whichever chapter still has the most left, so the big chapters
    # stay represented right to the end of the deal instead of running out early.
    out: list[dict] = []
    while any(buckets.values()):
        chapters = [c for c, v in buckets.items() if v]
        chapters.sort(key=lambda c: len(buckets[c]), reverse=True)
        for c in chapters:
            if buckets[c]:
                out.append(buckets[c].pop())
    return out


def deal(questions: list[dict], papers: list, seed: int = 11) -> dict[str, list[dict]]:
    """Return {paper_id: [questions]} honouring each paper's total_questions."""
    rng = random.Random(seed)
    pool = _interleave_by_chapter(questions, rng)

    capacity = sum(p.total_questions for p in papers)
    if len(pool) < capacity:
        raise SystemExit(
            f"Only {len(pool)} usable questions for {capacity} slots across "
            f"{len(papers)} papers. Re-run generation before exporting."
        )

    # Fill the full-length papers first: they are the ones a student sits last
    # and judges themselves on, so they get the first pick of the pool.
    order = sorted(papers, key=lambda p: (p.exam_type != "full", p.exam_order))

    out: dict[str, list[dict]] = {p.id: [] for p in papers}
    cursor = 0
    for paper in order:
        take = pool[cursor: cursor + paper.total_questions]
        cursor += paper.total_questions
        take = validate.rebalance_answers(take, rng)
        rng.shuffle(take)
        out[paper.id] = take

    return out


def report(dealt: dict[str, list[dict]], papers: list) -> str:
    lines = []
    by_id = {p.id: p for p in papers}
    for pid, items in sorted(dealt.items(), key=lambda kv: by_id[kv[0]].exam_order):
        paper = by_id[pid]
        spread = validate.answer_spread(items)
        chapters = sorted({i.get("chapter_no", 0) for i in items})
        lines.append(
            f"  {paper.title:16} {len(items):3d}q  "
            f"answers A{spread['A']:2d} B{spread['B']:2d} C{spread['C']:2d} D{spread['D']:2d}  "
            f"chapters {min(chapters)}–{max(chapters)} ({len(chapters)} of them)"
        )
    return "\n".join(lines)
