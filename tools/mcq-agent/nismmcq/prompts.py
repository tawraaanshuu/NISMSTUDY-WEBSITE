"""Prompt construction.

The style target is not "a good MCQ in general" — it is the 1,800 questions
already sitting in this database, which set the house style: a short factual
stem, four terse parallel options, and a one-sentence explanation. Those rows
are pulled live and used as few-shot examples, so generated questions are
indistinguishable in shape from the ones a student already sees.
"""

from __future__ import annotations

import random
import textwrap

SYSTEM = textwrap.dedent("""\
    You write multiple-choice questions for India's NISM certification exams,
    which are set by SEBI's National Institute of Securities Markets.

    Rules you must not break:
    - Every question must be answerable from the PASSAGE alone. Never use
      outside knowledge, and never contradict the passage.
    - Never refer to "the passage", "the text", "the chapter", "above" or
      "according to the document". The student sits an exam, not a reading test.
    - Exactly four options. Exactly one is correct. The other three must be
      plausible to someone who has not studied — not obviously silly.
    - Keep all four options the same kind of thing and roughly the same length.
      Do not let the correct one be the longest or the most detailed.
    - Prefer specifics the exam actually tests: durations, limits, percentages,
      who does what, definitions, and the order of a process.
    - Do not write "All of the above" or "None of the above".
    - The explanation is one sentence saying why the answer is right.
    - Output JSON only.
    """)

_FALLBACK_EXEMPLARS = [
    {
        "question": "What percentage of AMC directors must be independent?",
        "options": ["At least 25%", "At least 33%", "At least 50%", "At least 75%"],
        "correct": "C",
        "explanation": "At least 50% of the directors should be independent of the sponsor.",
    },
    {
        "question": "Investment for a minor must be made through:",
        "options": ["The minor directly", "A guardian", "Any adult", "A bank"],
        "correct": "B",
        "explanation": "Minors need to invest through their guardian (natural parent or court-appointed).",
    },
]


def _render(example: dict) -> str:
    letters = "ABCD"
    opts = "\n".join(f"  {letters[i]}. {o}" for i, o in enumerate(example["options"]))
    return (f"Q: {example['question']}\n{opts}\n"
            f"  Answer: {example['correct']} — {example.get('explanation', '')}".rstrip(" —"))


def build_user_prompt(chunk, n: int, exemplars: list[dict], avoid: list[str],
                      rng: random.Random) -> str:
    shots = exemplars[:] or _FALLBACK_EXEMPLARS[:]
    rng.shuffle(shots)
    shots = shots[:3]

    parts = [
        "Here is the house style. Match this length and tone exactly:",
        "\n\n".join(_render(s) for s in shots),
        "",
        f"SYLLABUS AREA: Chapter {chunk.chapter_no} — {chunk.chapter_title.title()}",
    ]
    if chunk.section_title:
        parts.append(f"SECTION: {chunk.section_no} {chunk.section_title}")

    if avoid:
        # Showing what already exists is the cheapest duplicate control there
        # is — far cheaper than generating a near-copy and rejecting it later.
        listed = "\n".join(f"- {q}" for q in avoid[:8])
        parts += ["", "Questions already written for this chapter. Ask about "
                        "something different:", listed]

    parts += [
        "",
        f"Write {n} NISM exam MCQs using only the passage below.",
        "",
        "PASSAGE:",
        chunk.text,
    ]
    return "\n".join(parts)


def load_db_exemplars(limit: int = 24) -> list[dict]:
    """Few-shot examples taken from the questions already in the database."""
    import json
    import urllib.request
    from .catalog import SUPABASE_URL, SUPABASE_KEY

    # `questions` is RLS-protected from anonymous reads, so this needs a token.
    # Without one we fall back to the built-in pair, which is the same style.
    token = _service_token()
    if not token:
        return _FALLBACK_EXEMPLARS[:]

    req = urllib.request.Request(
        f"{SUPABASE_URL}/rest/v1/questions?select=question_text,option_a,option_b,"
        f"option_c,option_d,correct_option,explanation&limit={limit}",
        headers={"apikey": SUPABASE_KEY, "Authorization": f"Bearer {token}"},
    )
    try:
        rows = json.loads(urllib.request.urlopen(req, timeout=30).read())
    except Exception:
        return _FALLBACK_EXEMPLARS[:]

    out = []
    for r in rows:
        opts = [r.get(f"option_{c}") for c in "abcd"]
        if not all(opts) or not r.get("question_text"):
            continue
        out.append({
            "question": r["question_text"],
            "options": opts,
            "correct": (r.get("correct_option") or "A").upper(),
            "explanation": r.get("explanation") or "",
        })
    return out or _FALLBACK_EXEMPLARS[:]


def _service_token() -> str | None:
    """A token that can read `questions`. Set NISM_ACCESS_TOKEN, or sign in
    with NISM_EMAIL / NISM_PASSWORD."""
    import json
    import os
    import urllib.request
    from .catalog import SUPABASE_URL, SUPABASE_KEY

    token = os.environ.get("NISM_ACCESS_TOKEN")
    if token:
        return token

    email = os.environ.get("NISM_EMAIL")
    password = os.environ.get("NISM_PASSWORD")
    if not (email and password):
        return None

    req = urllib.request.Request(
        f"{SUPABASE_URL}/auth/v1/token?grant_type=password",
        data=json.dumps({"email": email, "password": password}).encode(),
        headers={"apikey": SUPABASE_KEY, "Content-Type": "application/json"},
    )
    try:
        return json.loads(urllib.request.urlopen(req, timeout=30).read()).get("access_token")
    except Exception:
        return None
