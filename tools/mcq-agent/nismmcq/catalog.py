"""Which workbook belongs to which course, and how many questions each needs.

The database is the authority on the quota: every course owns ten `quizzes`
rows (eight 50-question mocks and two 100-question full papers), so a course
needs exactly 600 questions. Nothing here invents that number.
"""

from __future__ import annotations

import json
import os
import urllib.request
from dataclasses import dataclass, field

SUPABASE_URL = os.environ.get("NISM_SUPABASE_URL", "https://yzmctktxzpzdfhdubwjs.supabase.co")
SUPABASE_KEY = os.environ.get(
    "NISM_SUPABASE_KEY", "sb_publishable_BT1BJ5IKC7OArjTBdUBjkA_CjBZiFVf"
)

# nismmcq/ -> mcq-agent/ -> tools/ -> repo root
_REPO_ROOT = os.path.dirname(os.path.dirname(os.path.dirname(
    os.path.dirname(os.path.abspath(__file__)))))
MATERIALS_DIR = os.environ.get("NISM_MATERIALS_DIR",
                               os.path.join(_REPO_ROOT, "materials"))

# course slug -> workbook filename. Two workbooks (Series III-A Compliance and
# Series XV Research Analyst) are published as free material but have no course
# row, so they are deliberately absent; `--course all` skips them.
WORKBOOK_BY_SLUG = {
    "nism-series-i-currency-derivatives":
        "NISM-SERIES-I--CURRENCY-DERIVATIVE-EXAM-WORKBOOK-IN-PDF.pdf",
    "nism-series-v-a-mutual-fund-distributors":
        "NISM Series V-A Mutual Fund Distributors Certification Examination_August 2025 Final - 15092025.pdf",
    "nism-series-vi-depository-operations":
        "NISM-SERIES-VI--DEPOSITORY-OPERATION-EXAM-WORKBOOK-IN-PDF.pdf",
    "nism-series-vii-securities-operations-risk-management":
        "NISM-SERIES-VII--SECURITIES-OPERATIONS-AND-RISK-MANAGEMENT-EXAM-WORKBOOK-IN-PDF.pdf",
    "nism-series-viii-equity-derivatives":
        "NISM-SERIES-VIII--EQUITY-DERIVATIVES-EXAM-WORKBOOK-IN-PDF.pdf",
    "nism-series-x-a-investment-adviser-level-1":
        "NISM-SERIES-X-A--INVESTMENT-ADVISER-LEVEL-1-EXAM-WORKBOOK-IN-PDF.pdf",
    "nism-series-x-b-investment-adviser-level-2":
        "NISM-SERIES-X-B--INVESTMENT-ADVISER-LEVEL-2-EXAM-WORKBOOK-IN-PDF.pdf",
    "nism-series-xvi-commodity-derivatives":
        "NISM Series-XVI Commodity Derivatives Certification Examination_September 2025.pdf",
}

# Workbooks with no course row. Kept explicit so "why is this one skipped?"
# has an answer in the code rather than in someone's memory.
UNMAPPED_WORKBOOKS = {
    "NISM III-A Securities Intermediaries Compliance (Non-Fund).pdf":
        "free material only — no course row in the database",
    "NISM-SERIES-XV--RESEARCH-ANALYST-EXAM-WORKBOOK-IN-PDF.pdf":
        "free material only — no course row in the database",
}


@dataclass
class Paper:
    id: str
    title: str
    total_questions: int
    exam_type: str
    exam_order: int
    duration_minutes: int


@dataclass
class Course:
    id: str
    slug: str
    title: str
    papers: list = field(default_factory=list)

    @property
    def workbook(self) -> str | None:
        name = WORKBOOK_BY_SLUG.get(self.slug)
        return os.path.join(MATERIALS_DIR, name) if name else None

    @property
    def quota(self) -> int:
        """Questions this course needs = the sum its papers declare."""
        return sum(p.total_questions for p in self.papers)


def _get(path: str) -> list:
    req = urllib.request.Request(
        f"{SUPABASE_URL}/rest/v1/{path}",
        headers={"apikey": SUPABASE_KEY, "Authorization": f"Bearer {SUPABASE_KEY}"},
    )
    with urllib.request.urlopen(req, timeout=30) as resp:
        return json.loads(resp.read().decode())


def load_catalog(cache_path: str | None = None) -> list[Course]:
    """Read courses and their papers from Supabase, falling back to a cache."""
    try:
        rows = _get("courses?select=id,slug,title&order=title")
        papers = _get(
            "quizzes?select=id,course_id,title,total_questions,exam_type,"
            "exam_order,duration_minutes&order=course_id,exam_order"
        )
        if cache_path:
            os.makedirs(os.path.dirname(cache_path), exist_ok=True)
            with open(cache_path, "w") as fh:
                json.dump({"courses": rows, "papers": papers}, fh, indent=2)
    except Exception:
        if not (cache_path and os.path.exists(cache_path)):
            raise
        with open(cache_path) as fh:
            cached = json.load(fh)
        rows, papers = cached["courses"], cached["papers"]

    by_course: dict[str, list] = {}
    for p in papers:
        by_course.setdefault(p["course_id"], []).append(
            Paper(
                id=p["id"],
                title=p["title"],
                total_questions=int(p.get("total_questions") or 0),
                exam_type=p.get("exam_type") or "mock",
                exam_order=int(p.get("exam_order") or 0),
                duration_minutes=int(p.get("duration_minutes") or 90),
            )
        )

    return [
        Course(id=r["id"], slug=r["slug"], title=r["title"],
               papers=sorted(by_course.get(r["id"], []), key=lambda p: p.exam_order))
        for r in rows
    ]


def resolve(courses: list[Course], selector: str) -> list[Course]:
    """`all`, a slug, or a unique substring of a slug/title."""
    if selector == "all":
        return [c for c in courses if c.workbook and os.path.exists(c.workbook)]
    needle = selector.lower()
    exact = [c for c in courses if c.slug == needle]
    if exact:
        return exact
    hits = [c for c in courses if needle in c.slug.lower() or needle in c.title.lower()]
    if not hits:
        raise SystemExit(
            f"No course matches {selector!r}. Known slugs:\n  "
            + "\n  ".join(c.slug for c in courses)
        )
    if len(hits) > 1:
        raise SystemExit(
            f"{selector!r} is ambiguous:\n  " + "\n  ".join(c.slug for c in hits)
        )
    return hits
