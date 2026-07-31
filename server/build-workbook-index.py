#!/usr/bin/env python3
"""Build the workbook search index the chat assistant answers syllabus questions from.

Reuses the MCQ agent's extractor, so the assistant is reading exactly the same
chapter-and-section chunks the question generator does — one parser, one set of
quirks, and a fix to either benefits both.

    python3 server/build-workbook-index.py

Writes server/knowledge/workbooks.jsonl (git-ignored; rebuild rather than commit).
"""

from __future__ import annotations

import json
import os
import re
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
REPO = os.path.dirname(HERE)
sys.path.insert(0, os.path.join(REPO, "tools", "mcq-agent"))

from nismmcq.extract import extract  # noqa: E402

MATERIALS = os.path.join(REPO, "materials")
OUT = os.path.join(HERE, "knowledge", "workbooks.jsonl")

# Filename -> the name a student would actually say.
EXAM_NAMES = {
    "NISM-SERIES-I--CURRENCY-DERIVATIVE": "Series I — Currency Derivatives",
    "NISM III-A Securities Intermediaries": "Series III-A — Securities Intermediaries Compliance",
    "NISM Series V-A Mutual Fund": "Series V-A — Mutual Fund Distributors",
    "NISM-SERIES-VI--DEPOSITORY": "Series VI — Depository Operations",
    "NISM-SERIES-VII--SECURITIES-OPERATIONS": "Series VII — Securities Operations & Risk Management",
    "NISM-SERIES-VIII--EQUITY-DERIVATIVES": "Series VIII — Equity Derivatives",
    "NISM-SERIES-X-A--INVESTMENT-ADVISER": "Series X-A — Investment Adviser Level 1",
    "NISM-SERIES-X-B--INVESTMENT-ADVISER": "Series X-B — Investment Adviser Level 2",
    "NISM-SERIES-XV--RESEARCH-ANALYST": "Series XV — Research Analyst",
    "NISM Series-XVI Commodity": "Series XVI — Commodity Derivatives",
}


def exam_name(filename: str) -> str:
    for prefix, name in EXAM_NAMES.items():
        if filename.startswith(prefix):
            return name
    return re.sub(r"[-_]+", " ", os.path.splitext(filename)[0])[:60]


def main() -> int:
    pdfs = sorted(f for f in os.listdir(MATERIALS) if f.lower().endswith(".pdf"))
    if not pdfs:
        print(f"No PDFs in {MATERIALS}")
        return 1

    os.makedirs(os.path.dirname(OUT), exist_ok=True)
    total = 0

    with open(OUT, "w") as fh:
        for pdf in pdfs:
            name = exam_name(pdf)
            slug = re.sub(r"[^a-z0-9]+", "-", name.lower()).strip("-")
            work = os.path.join(HERE, ".build", slug)
            try:
                chunks, _ = extract(os.path.join(MATERIALS, pdf), slug, work)
            except SystemExit as exc:
                print(f"  ! {name}: {exc}")
                continue

            for c in chunks:
                fh.write(json.dumps({
                    "exam": name,
                    "chapter": c.chapter_no,
                    "chapter_title": c.chapter_title.title(),
                    "section": f"{c.section_no} {c.section_title}".strip(),
                    "pages": f"{c.page_start}-{c.page_end}",
                    "text": c.text,
                }) + "\n")
            total += len(chunks)
            print(f"  {name:52} {len(chunks):4d} chunks")

    size = os.path.getsize(OUT) / 1e6
    print(f"\n{total} chunks from {len(pdfs)} workbooks -> "
          f"{os.path.relpath(OUT, REPO)} ({size:.1f} MB)")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
