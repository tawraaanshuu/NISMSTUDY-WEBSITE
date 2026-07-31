#!/usr/bin/env python3
"""nismstudy MCQ agent — turn a NISM workbook into the 600 questions a course needs.

    python3 mcq_agent.py status
    python3 mcq_agent.py plan  --course series-vi
    python3 mcq_agent.py run   --course series-vi
    python3 mcq_agent.py run   --course all

`status` needs no model. `plan` extracts the workbook and shows how the 600
would be spread over the syllabus without calling the model once — run it
first, because it is instant and it catches a mis-parsed workbook before you
spend hours generating from one.

The agent never writes to the database. It produces a .sql file, a .csv and a
review page; a person reads them and decides.
"""

from __future__ import annotations

import argparse
import os
import sys
import time

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)

from nismmcq import assemble, export, extract, generate, prompts  # noqa: E402
from nismmcq.catalog import UNMAPPED_WORKBOOKS, load_catalog, resolve  # noqa: E402
from nismmcq.provider import DEFAULT_MODEL, Ollama  # noqa: E402

WORK_DIR = os.path.join(HERE, "work")
OUT_DIR = os.path.join(HERE, "out")
CACHE = os.path.join(WORK_DIR, "catalog.json")


def _counts_by_course(token: str | None) -> dict[str, int]:
    """How many questions each course already has. Needs an authenticated
    token because `questions` is RLS-protected from anonymous reads."""
    import json
    import urllib.request
    from nismmcq.catalog import SUPABASE_KEY, SUPABASE_URL

    if not token:
        return {}

    def get(path):
        req = urllib.request.Request(
            f"{SUPABASE_URL}/rest/v1/{path}",
            headers={"apikey": SUPABASE_KEY, "Authorization": f"Bearer {token}"},
        )
        return json.loads(urllib.request.urlopen(req, timeout=30).read())

    rows, offset = [], 0
    while True:
        page = get(f"questions?select=quiz_id&limit=1000&offset={offset}")
        rows += page
        if len(page) < 1000:
            break
        offset += 1000

    papers = get("quizzes?select=id,course_id")
    paper_to_course = {p["id"]: p["course_id"] for p in papers}
    counts: dict[str, int] = {}
    for r in rows:
        cid = paper_to_course.get(r["quiz_id"])
        if cid:
            counts[cid] = counts.get(cid, 0) + 1
    return counts


def cmd_status(args) -> int:
    courses = load_catalog(CACHE)
    token = prompts._service_token()
    counts = _counts_by_course(token)

    if not token:
        print("No token — set NISM_ACCESS_TOKEN, or NISM_EMAIL and NISM_PASSWORD,")
        print("to read live question counts. Showing quotas only.\n")

    print(f"{'course':58} {'have':>5} {'need':>5}  state")
    print("-" * 84)
    todo = []
    for c in courses:
        # With a token, a course missing from `counts` genuinely has zero
        # questions; without one we cannot tell zero from unknown.
        have = counts.get(c.id, 0) if token else None
        need = c.quota
        if have is None:
            state = "unknown"
        elif have >= need:
            state = "COMPLETE — publish it"
        elif have == 0:
            state = "empty — generate"
            todo.append(c)
        else:
            state = f"partial ({need - have} short)"
            todo.append(c)
        book = "ok" if (c.workbook and os.path.exists(c.workbook)) else "NO WORKBOOK"
        print(f"{c.title[:56]:58} {str(have if have is not None else '?'):>5} "
              f"{need:>5}  {state} [{book}]")

    if UNMAPPED_WORKBOOKS:
        print("\nWorkbooks published as free material with no course row:")
        for name, why in UNMAPPED_WORKBOOKS.items():
            print(f"  - {name[:64]} ({why})")

    if todo:
        print(f"\n{len(todo)} course(s) need questions: "
              + ", ".join(c.slug for c in todo))
    return 0


def _prepare(course, force: bool):
    work = os.path.join(WORK_DIR, course.slug)
    chunks_file = os.path.join(work, "chunks.jsonl")

    if force or not os.path.exists(chunks_file):
        chunks, exemplars = extract.extract(course.workbook, course.slug, work)
    else:
        chunks = extract.load_chunks(work)
        import json
        with open(os.path.join(work, "exemplars.json")) as fh:
            exemplars = json.load(fh)
    return work, chunks, exemplars


def cmd_plan(args) -> int:
    courses = resolve(load_catalog(CACHE), args.course)
    for course in courses:
        if not course.workbook or not os.path.exists(course.workbook):
            print(f"! {course.slug}: workbook missing")
            continue

        print(f"\n=== {course.title}")
        work, chunks, exemplars = _prepare(course, args.force_extract)
        target = int(course.quota * args.overshoot)
        alloc = generate.allocate(chunks, target, args.per_call)

        by_chapter: dict[int, list[int]] = {}
        for c in chunks:
            by_chapter.setdefault(c.chapter_no, []).append(alloc.get(c.chunk_id, 0))

        print(f"  workbook   {os.path.basename(course.workbook)}")
        print(f"  chunks     {len(chunks)} ({sum(c.words for c in chunks):,} words)")
        print(f"  exemplars  {len(exemplars)} harvested from the workbook itself")
        print(f"  quota      {course.quota} across {len(course.papers)} papers "
              f"(asking for {target} to survive validation)")
        print("  spread by chapter:")
        for ch in sorted(by_chapter):
            title = next(c.chapter_title for c in chunks if c.chapter_no == ch)
            print(f"    ch{ch:02d} {title[:44]:46} {sum(by_chapter[ch]):3d} questions")
    return 0


def cmd_run(args) -> int:
    courses = resolve(load_catalog(CACHE), args.course)

    llm = Ollama(model=args.model, temperature=args.temperature)
    ok, message = llm.available()
    print(f"model: {message}")
    if not ok:
        return 2

    token = prompts._service_token()
    counts = _counts_by_course(token)
    db_exemplars = prompts.load_db_exemplars()
    print(f"style examples: {len(db_exemplars)} "
          f"({'from the live question bank' if token else 'built-in fallback'})")

    for course in courses:
        have = counts.get(course.id, 0)
        if have >= course.quota and not args.force:
            print(f"\n=== {course.title}\n  already has {have} questions — skipping. "
                  f"Use --force to regenerate.")
            continue
        if not course.workbook or not os.path.exists(course.workbook):
            print(f"\n=== {course.title}\n  ! workbook missing — skipping")
            continue

        print(f"\n=== {course.title}  ({have} existing, needs {course.quota})")
        work, chunks, book_exemplars = _prepare(course, args.force_extract)
        print(f"  {len(chunks)} chunks from {os.path.basename(course.workbook)}")

        runner = generate.Runner(
            llm, work,
            exemplars=(book_exemplars + db_exemplars),
            per_call=args.per_call, overshoot=args.overshoot,
        )

        started = time.time()
        clean = runner.run(chunks, course.quota)
        mins = (time.time() - started) / 60

        print(f"  kept {len(clean)} questions in {mins:.1f} min "
              f"({llm.rate:.1f} tok/s over {llm.calls} calls)")

        if len(clean) < course.quota:
            print(f"  ! only {len(clean)} of {course.quota} — re-run to continue "
                  f"(progress is saved; nothing is regenerated).")
            continue

        dealt = assemble.deal(clean, course.papers)
        print(assemble.report(dealt, course.papers))

        paths = export.write_all(dealt, course.papers, course, OUT_DIR)
        print("  wrote:")
        for kind, path in paths.items():
            print(f"    {kind:5} {os.path.relpath(path, HERE)}")
        print(f"  Review {os.path.basename(paths['html'])} before running the SQL.")

    return 0


def main() -> int:
    ap = argparse.ArgumentParser(description=__doc__,
                                 formatter_class=argparse.RawDescriptionHelpFormatter)
    sub = ap.add_subparsers(dest="cmd", required=True)

    sub.add_parser("status", help="what each course has and needs")

    common = argparse.ArgumentParser(add_help=False)
    common.add_argument("--course", required=True,
                        help="course slug, a unique substring of one, or 'all'")
    common.add_argument("--per-call", type=int, default=8,
                        help="questions per model call (default 8)")
    common.add_argument("--overshoot", type=float, default=1.35,
                        help="generate this multiple of the quota to survive validation")
    common.add_argument("--force-extract", action="store_true",
                        help="re-parse the PDF even if chunks are cached")

    p = sub.add_parser("plan", parents=[common], help="show the spread without calling the model")
    p.set_defaults(func=cmd_plan)

    r = sub.add_parser("run", parents=[common], help="generate, validate and export")
    r.add_argument("--model", default=DEFAULT_MODEL)
    r.add_argument("--temperature", type=float, default=0.55)
    r.add_argument("--force", action="store_true",
                   help="generate even for a course that already has its questions")
    r.set_defaults(func=cmd_run)

    args = ap.parse_args()
    if args.cmd == "status":
        return cmd_status(args)
    return args.func(args)


if __name__ == "__main__":
    raise SystemExit(main())
