"""Quality gates.

A 3B model on a laptop will produce some bad questions. Everything a machine
can check without another model call is checked here, because on this hardware
a rejection is nearly free and a regeneration costs minutes.

The subtle one is `correct_option_is_a_giveaway`. Small models write the right
answer carefully and the distractors lazily, so the correct option ends up
noticeably longer and more specific. A student notices that within two
questions and the whole mock stops testing anything. Length balance is the
single most valuable check in this file.
"""

from __future__ import annotations

import re
import unicodedata
from dataclasses import dataclass

BANNED_PHRASES = [
    "the passage", "the text", "this chapter", "the chapter", "the document",
    "according to the above", "as stated above", "mentioned above",
    "the following passage", "in the given", "as per the passage",
]
BANNED_OPTIONS = [
    "all of the above", "none of the above", "both a and b", "all the above",
    "none of these", "all of these", "both of the above",
]

MIN_Q_CHARS, MAX_Q_CHARS = 18, 320
MIN_OPT_CHARS, MAX_OPT_CHARS = 1, 190
MAX_EXPL_CHARS = 400
GIVEAWAY_RATIO = 1.85
DUP_THRESHOLD = 0.82


@dataclass
class Rejection:
    reason: str
    detail: str = ""


def _norm(text: str) -> str:
    text = unicodedata.normalize("NFKD", str(text or "")).lower()
    text = re.sub(r"[^a-z0-9 ]+", " ", text)
    return re.sub(r"\s+", " ", text).strip()


def _tokens(text: str) -> set[str]:
    stop = {"the", "a", "an", "of", "is", "are", "to", "in", "for", "and", "or",
            "which", "what", "on", "by", "be", "as", "at", "from", "with", "that"}
    return {t for t in _norm(text).split() if t not in stop and len(t) > 2}


def similarity(a: str, b: str) -> float:
    ta, tb = _tokens(a), _tokens(b)
    if not ta or not tb:
        return 0.0
    return len(ta & tb) / len(ta | tb)


def check(item: dict) -> Rejection | None:
    """Structural and quality checks on one generated MCQ."""
    q = str(item.get("question") or "").strip()
    opts = item.get("options") or []
    correct = str(item.get("correct") or "").strip().upper()
    expl = str(item.get("explanation") or "").strip()

    if not q:
        return Rejection("empty_question")
    if not (MIN_Q_CHARS <= len(q) <= MAX_Q_CHARS):
        return Rejection("question_length", f"{len(q)} chars")
    if not isinstance(opts, list) or len(opts) != 4:
        return Rejection("option_count", str(len(opts) if isinstance(opts, list) else "n/a"))

    opts = [str(o).strip() for o in opts]
    if any(not o for o in opts):
        return Rejection("empty_option")
    if any(len(o) > MAX_OPT_CHARS for o in opts):
        return Rejection("option_too_long")
    if len({_norm(o) for o in opts}) != 4:
        return Rejection("duplicate_options")
    if correct not in {"A", "B", "C", "D"}:
        return Rejection("bad_correct_letter", correct)

    low_q = q.lower()
    for phrase in BANNED_PHRASES:
        if phrase in low_q:
            return Rejection("refers_to_source", phrase)
    for o in opts:
        if _norm(o) in {_norm(b) for b in BANNED_OPTIONS}:
            return Rejection("banned_option", o)

    # The stem must actually ask something.
    if "?" not in q and not re.search(r"\b(is|are|means|refers to|includes|must|should|can)\b:?\s*$", low_q):
        if not low_q.rstrip().endswith(":"):
            return Rejection("not_a_question")

    if not expl:
        return Rejection("no_explanation")
    if len(expl) > MAX_EXPL_CHARS:
        return Rejection("explanation_too_long", f"{len(expl)} chars")

    # The explanation is shown to the student in the answer review, so it leaks
    # just as badly as the stem. Observed output: "The passage mentions that
    # one major issue was..." — correct, but it tells the student they were
    # reading a comprehension test. Rewrite rather than reject: the phrasing is
    # a wrapper around an otherwise sound explanation.
    cleaned = re.sub(
        r"^(?:as\s+)?(?:the\s+)?(?:passage|text|chapter|document)\s+"
        r"(?:states?|says?|mentions?|notes?|explains?|indicates?)\s+that\s+",
        "", expl, flags=re.I).strip()
    cleaned = re.sub(
        r"^according\s+to\s+the\s+(?:passage|text|chapter|document)\s*,?\s*",
        "", cleaned, flags=re.I).strip()
    if cleaned != expl:
        expl = cleaned[:1].upper() + cleaned[1:] if cleaned else expl
        item["explanation"] = expl
    low_e = expl.lower()
    for phrase in BANNED_PHRASES:
        if phrase in low_e:
            return Rejection("explanation_refers_to_source", phrase)

    # Giveaway check: the right answer must not stand out by length.
    idx = "ABCD".index(correct)
    others = [len(o) for i, o in enumerate(opts) if i != idx]
    mean_other = sum(others) / len(others)
    if mean_other > 0 and len(opts[idx]) / mean_other > GIVEAWAY_RATIO:
        return Rejection("correct_option_is_a_giveaway",
                         f"{len(opts[idx])} vs mean {mean_other:.0f}")

    # The answer must not simply be quoted back in the stem.
    if _norm(opts[idx]) and _norm(opts[idx]) in _norm(q):
        return Rejection("answer_in_question")

    return None


class Deduper:
    """Rejects near-duplicates against everything accepted so far."""

    def __init__(self, threshold: float = DUP_THRESHOLD):
        self.threshold = threshold
        self._seen: list[tuple[set[str], str]] = []

    def add_existing(self, question_text: str) -> None:
        self._seen.append((_tokens(question_text), question_text))

    def is_duplicate(self, question_text: str) -> tuple[bool, str]:
        toks = _tokens(question_text)
        if not toks:
            return True, "empty"
        for seen_toks, original in self._seen:
            if not seen_toks:
                continue
            score = len(toks & seen_toks) / len(toks | seen_toks)
            if score >= self.threshold:
                return True, original
        return False, ""

    def accept(self, question_text: str) -> None:
        self._seen.append((_tokens(question_text), question_text))

    def __len__(self) -> int:
        return len(self._seen)


def rebalance_answers(items: list[dict], rng) -> list[dict]:
    """Even out the spread of correct letters.

    Small models favour A and B heavily. A student who notices that can score
    well above their real ability, which makes the mock useless as a signal.
    Options are permuted (never rewritten) so the question is untouched.
    """
    letters = "ABCD"
    target = len(items) // 4
    counts = {c: 0 for c in letters}

    order = list(range(len(items)))
    rng.shuffle(order)

    for i in order:
        item = items[i]
        opts = list(item["options"])
        cur = letters.index(item["correct"])
        # Prefer the least-used letter that still needs filling.
        wanted = min(letters, key=lambda c: (counts[c], rng.random()))
        w = letters.index(wanted)
        if w != cur:
            opts[cur], opts[w] = opts[w], opts[cur]
            item["options"] = opts
            item["correct"] = wanted
        counts[item["correct"]] += 1

    return items


def answer_spread(items: list[dict]) -> dict:
    out = {c: 0 for c in "ABCD"}
    for i in items:
        c = str(i.get("correct", "")).upper()
        if c in out:
            out[c] += 1
    return out
