"""Turn a NISM workbook PDF into syllabus-aware chunks.

Question quality is decided here, not in the prompt. A chunk that spans two
unrelated sections, or that is mostly a flattened payoff table, produces a bad
question no matter how good the model is. So this module:

  * finds real chapter boundaries (`CHAPTER 7: ...`) and section boundaries
    (`7.3 Some heading`) from the page text, since these PDFs carry no TOC;
  * drops front matter, the table of contents and the syllabus appendix;
  * pulls the workbook's own "Chapter N: Sample Questions" out as exemplars
    rather than feeding them back in as source prose;
  * scores each chunk for prose density so table dumps can be skipped.
"""

from __future__ import annotations

import json
import os
import re
from dataclasses import dataclass, asdict

import fitz

# Handles both "CHAPTER 8: TAXATION" and the "CHAPTER :8 TAXATION" typo that
# appears in the Series V-A workbook — without the second form, chapter 8 of
# that book is silently dropped from the syllabus.
CHAPTER_RE = re.compile(
    r"^\s*CHAPTER\s*(?::\s*(\d{1,2})|(\d{1,2}))\s*[:.\-—]?\s+(.+?)\s*$", re.M)
SAMPLE_RE = re.compile(r"^\s*Chapter\s+(\d{1,2})\s*:\s*Sample\s+Questions?\s*:?\s*$", re.M | re.I)
SECTION_RE = re.compile(r"^\s*(\d{1,2}\.\d{1,2}(?:\.\d{1,2})?)\s+([A-Z][^\n]{3,90}?)\s*$", re.M)

# A page that is mostly digits, currency and punctuation is a payoff table or a
# fee schedule; prose questions built from it come out garbled.
PROSE_MIN_RATIO = 0.62
PROSE_MIN_WORDS = 90

TARGET_WORDS = 900
MAX_WORDS = 1400
MIN_WORDS = 160


@dataclass
class Chunk:
    chunk_id: str
    chapter_no: int
    chapter_title: str
    section_no: str
    section_title: str
    page_start: int
    page_end: int
    words: int
    prose_ratio: float
    text: str


def _clean_page(text: str, page_no: int) -> str:
    lines = []
    for raw in text.splitlines():
        line = raw.rstrip()
        stripped = line.strip()
        if not stripped:
            lines.append("")
            continue
        # Bare page numbers and running headers/footers.
        if stripped.isdigit() and len(stripped) <= 4:
            continue
        if stripped == str(page_no):
            continue
        if re.fullmatch(r"(?i)(NISM[- ].{0,60}|Page\s+\d+\s*(of\s*\d+)?)", stripped):
            continue
        lines.append(line)

    out = "\n".join(lines)
    # These PDFs break sentences across lines; rejoin so the model sees prose.
    out = re.sub(r"(?<![.!?:;])\n(?![\n•\-\d])", " ", out)
    out = re.sub(r"[ \t]{2,}", " ", out)
    out = re.sub(r"\n{3,}", "\n\n", out)
    return out.strip()


def _prose_ratio(text: str) -> float:
    """Share of alphabetic characters — low means a table or a number dump."""
    if not text:
        return 0.0
    alpha = sum(ch.isalpha() or ch.isspace() for ch in text)
    return alpha / len(text)


def _find_chapter_starts(pages: list[str]) -> list[tuple[int, int, str]]:
    """(page_index, chapter_no, chapter_title), de-duplicated and monotonic."""
    found: list[tuple[int, int, str]] = []
    for idx, text in enumerate(pages):
        for m in CHAPTER_RE.finditer(text):
            no = int(m.group(1) or m.group(2))
            title = m.group(3).strip()
            title = re.sub(r"\s{2,}", " ", title).strip(" .:-")
            # Contents-page entries drag the page number along with them
            # ("PLEDGE & HYPOTHECATION43"), and dot leaders come too.
            title = re.sub(r"[.\s]*\d{1,4}$", "", title).strip(" .:-")
            if len(title) < 3 or len(title) > 120:
                continue
            found.append((idx, no, title))

    # The contents page lists every chapter on one page; the real chapter start
    # is the LAST occurrence that still keeps the sequence increasing.
    by_no: dict[int, tuple[int, int, str]] = {}
    counts: dict[int, int] = {}
    for item in found:
        counts[item[1]] = counts.get(item[1], 0) + 1
    for item in found:
        idx, no, title = item
        prev = by_no.get(no)
        if prev is None or idx > prev[0]:
            by_no[no] = item

    ordered = [by_no[k] for k in sorted(by_no)]
    # Enforce increasing page order; drop anything that jumps backwards.
    result: list[tuple[int, int, str]] = []
    for item in ordered:
        if not result or item[0] > result[-1][0]:
            result.append(item)
    return result


def _sample_question_pages(pages: list[str]) -> set[int]:
    """Pages holding the workbook's own sample questions."""
    marked: set[int] = set()
    for idx, text in enumerate(pages):
        if SAMPLE_RE.search(text):
            marked.add(idx)
            # Sample-question blocks usually run onto the next page.
            if idx + 1 < len(pages) and not CHAPTER_RE.search(pages[idx + 1]):
                marked.add(idx + 1)
    return marked


def harvest_exemplars(pages: list[str], sample_pages: set[int], limit: int = 12) -> list[dict]:
    """Pull real NISM sample questions out for use as few-shot examples.

    These are the exam board's own phrasing, so they are worth far more as a
    style anchor than anything we could write by hand.
    """
    blob = "\n".join(pages[i] for i in sorted(sample_pages))
    out: list[dict] = []
    # "1. Question text ... (a) opt (b) opt (c) opt (d) opt"
    pattern = re.compile(
        r"(?:^|\n)\s*\d{1,2}[.)]\s*(?P<q>[^\n]{20,240}?)\s*\n"
        r"\s*\(?a\)?[.\s]\s*(?P<a>[^\n]{1,120})\n"
        r"\s*\(?b\)?[.\s]\s*(?P<b>[^\n]{1,120})\n"
        r"\s*\(?c\)?[.\s]\s*(?P<c>[^\n]{1,120})\n"
        r"\s*\(?d\)?[.\s]\s*(?P<d>[^\n]{1,120})",
        re.I,
    )
    for m in pattern.finditer(blob):
        out.append({
            "question": m.group("q").strip(),
            "options": [m.group(k).strip() for k in ("a", "b", "c", "d")],
        })
        if len(out) >= limit:
            break
    return out


def _split_sections(text: str) -> list[tuple[str, str, str]]:
    """Break chapter text at `N.M Heading` markers -> (no, title, body)."""
    marks = list(SECTION_RE.finditer(text))
    if not marks:
        return [("", "", text)]

    out = []
    if marks[0].start() > 400:  # keep the chapter intro that precedes 'N.1'
        out.append(("", "", text[: marks[0].start()]))
    for i, m in enumerate(marks):
        end = marks[i + 1].start() if i + 1 < len(marks) else len(text)
        body = text[m.end(): end].strip()
        if body:
            out.append((m.group(1), m.group(2).strip(), body))
    return out


def _pack(words: list[str], target: int, hard_max: int) -> list[list[str]]:
    """Split a long section into roughly `target`-word pieces."""
    if len(words) <= hard_max:
        return [words]
    n = max(1, round(len(words) / target))
    size = -(-len(words) // n)
    return [words[i: i + size] for i in range(0, len(words), size)]


def extract(pdf_path: str, slug: str, out_dir: str) -> tuple[list[Chunk], list[dict]]:
    doc = fitz.open(pdf_path)
    raw_pages = [doc[i].get_text() for i in range(len(doc))]
    pages = [_clean_page(raw_pages[i], i + 1) for i in range(len(raw_pages))]

    sample_pages = _sample_question_pages(raw_pages)
    exemplars = harvest_exemplars(raw_pages, sample_pages)

    starts = _find_chapter_starts(raw_pages)
    if not starts:
        raise SystemExit(f"No chapter headings found in {os.path.basename(pdf_path)}")

    chunks: list[Chunk] = []
    for i, (page_idx, chap_no, chap_title) in enumerate(starts):
        end_idx = starts[i + 1][0] if i + 1 < len(starts) else len(pages)
        body_pages = [
            (p, pages[p]) for p in range(page_idx, end_idx) if p not in sample_pages
        ]
        if not body_pages:
            continue

        chapter_text = "\n\n".join(t for _, t in body_pages)
        first_page, last_page = body_pages[0][0], body_pages[-1][0]

        seq = 0
        for sec_no, sec_title, body in _split_sections(chapter_text):
            words = body.split()
            if len(words) < MIN_WORDS:
                continue
            for piece in _pack(words, TARGET_WORDS, MAX_WORDS):
                text = " ".join(piece)
                ratio = _prose_ratio(text)
                if len(piece) < MIN_WORDS or ratio < PROSE_MIN_RATIO:
                    continue
                seq += 1
                chunks.append(Chunk(
                    chunk_id=f"{slug}:c{chap_no:02d}:{seq:03d}",
                    chapter_no=chap_no,
                    chapter_title=chap_title,
                    section_no=sec_no,
                    section_title=sec_title,
                    page_start=first_page + 1,
                    page_end=last_page + 1,
                    words=len(piece),
                    prose_ratio=round(ratio, 3),
                    text=text,
                ))

    os.makedirs(out_dir, exist_ok=True)
    with open(os.path.join(out_dir, "chunks.jsonl"), "w") as fh:
        for c in chunks:
            fh.write(json.dumps(asdict(c)) + "\n")
    with open(os.path.join(out_dir, "exemplars.json"), "w") as fh:
        json.dump(exemplars, fh, indent=2)

    return chunks, exemplars


def load_chunks(out_dir: str) -> list[Chunk]:
    path = os.path.join(out_dir, "chunks.jsonl")
    with open(path) as fh:
        return [Chunk(**json.loads(line)) for line in fh if line.strip()]
