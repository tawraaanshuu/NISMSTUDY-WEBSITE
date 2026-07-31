# MCQ agent

Turns a NISM workbook PDF into the 600 questions a course needs, using a local
model. Nothing leaves the machine and nothing is written to the database — the
agent produces a `.sql` file, a `.csv` and a review page for a person to read.

## Why 600

Not a round number someone picked. Every course in the database owns ten
`quizzes` rows — eight 50-question mocks and two 100-question full papers:

    8 × 50  +  2 × 100  =  600

So 600 is the quota the schema already declares, and the questions deal exactly
into the papers that are waiting for them.

## Where things stand (measured 2026-08-01)

| Course | Questions |
| --- | --- |
| Series I — Currency Derivatives | 600 ✅ |
| Series V-A — Mutual Fund Distributors | 600 ✅ |
| Series VIII — Equity Derivatives | 600 ✅ |
| Series VI — Depository Operations | 0 |
| Series VII — Securities Operations & Risk Management | 0 |
| Series X-A — Investment Adviser Level 1 | 0 |
| Series X-B — Investment Adviser Level 2 | 0 |
| Series XVI — Commodity Derivatives | 0 |

Five courses × 600 = **3,000 questions to generate**. The 1,800 that already
exist are pulled in as few-shot examples, so new questions match the house
style rather than inventing one.

Two workbooks — Series III-A (Compliance) and Series XV (Research Analyst) —
are published as free material but have no course row, so they are skipped.

## Setup

```bash
ollama serve &
ollama pull qwen2.5:3b-instruct
pip install pymupdf
```

To read live question counts and use the existing questions as style examples,
give it a session (the `questions` table is RLS-protected from anonymous reads):

```bash
export NISM_EMAIL=you@example.com
export NISM_PASSWORD=...
# or: export NISM_ACCESS_TOKEN=<jwt>
```

Without a token the agent still runs — it falls back to built-in examples and
cannot tell you what is already loaded.

## Use

```bash
python3 mcq_agent.py status                    # what each course has and needs
python3 mcq_agent.py plan --course series-xvi  # syllabus spread, no model calls
python3 mcq_agent.py run  --course series-xvi  # generate, validate, export
python3 mcq_agent.py run  --course all         # every course that needs questions
```

Run `plan` first. It is instant, it needs no model, and it shows how the 600
would be spread across chapters — which is where a mis-parsed workbook shows
up, before you spend hours generating from it.

`run` is **resumable**. Every chunk's output is written the moment it arrives
and a restart skips what is already done, so Ctrl-C is safe.

## Performance, honestly

Measured on the target machine (Intel Core Ultra 5 125U, 14 threads, **no GPU**):

| Configuration | Generation | Prompt | JSON | Verdict |
| --- | --- | --- | --- | --- |
| qwen3:4b | 3.0 tok/s | — | invalid — emits reasoning prose | unusable |
| qwen3:4b, `think:false` | 3.0 tok/s | — | still invalid | unusable |
| qwen2.5:3b + schema, default threads | 4.2 tok/s | 7.9 tok/s | valid | 2 cores idle-locked |
| qwen2.5:3b + schema, `num_thread=12` | **6.2 tok/s** | **29 tok/s** | valid | **use this** |

Three findings drove the design:

1. **Thinking models are the wrong tool on a CPU.** qwen3:4b spent 600 tokens
   reasoning about `{"ok":true}` — three minutes of wall clock for a two-word
   answer. Every reasoning token is paid for in minutes here.
2. **Constrain decoding with a schema.** Ollama's `format` field makes invalid
   JSON structurally impossible, which removes the parse-and-retry loop. A
   retry costs minutes on this hardware, so not needing one is worth more than
   any prompt engineering.
3. **Set `num_thread` explicitly.** This is the big one. Ollama's default sized
   itself to the 2 performance cores of this hybrid Intel part and ran at
   **191% CPU out of a possible 1400%**. Forcing 12 threads took it to 1358%
   and made *prompt* processing 3.6× faster — which mattered more than
   generation speed, because each ~1,100-token chunk has to be read before a
   single question can be written.

Real cost after all three: **24 seconds per question**, so

    3,000 questions × 24s ≈ 20 hours

Run it overnight, or a course at a time. That is the honest price of
local-only generation on a laptop with no GPU.

## How quality is defended

A 3B model writes some bad questions. Everything checkable without a second
model call is checked, because rejection is nearly free and regeneration is not:

- four distinct non-empty options, correct letter in A–D, explanation present
- no "All/None of the above", no "according to the passage"
- **length balance** — rejected if the correct option is much longer than the
  others. Small models write the right answer carefully and the distractors
  lazily, and a student spots that within two questions. This is the single
  most valuable check in `validate.py`.
- the answer must not be quoted back in the question stem
- near-duplicate detection across everything accepted so far
- **answer-letter rebalancing** — options are permuted (never rewritten) so the
  correct answer is spread evenly over A/B/C/D. Small models favour A and B
  heavily, which lets a student score above their real ability.

Generation asks for 1.35× the quota so rejections do not leave a course short.

Every question carries its source chapter and page numbers through to the CSV
and the review page, so any claim can be checked against the workbook.

## Layout

    mcq_agent.py        CLI: status / plan / run
    nismmcq/
      catalog.py        courses, papers, quotas, workbook mapping
      extract.py        PDF -> chapter/section chunks (+ harvests the
                        workbook's own sample questions as examples)
      prompts.py        system prompt and few-shot construction
      provider.py       Ollama, schema-constrained
      generate.py       allocation across the syllabus, resumable loop
      validate.py       quality gates, dedup, answer rebalancing
      assemble.py       deals questions into the ten papers
      export.py         .sql / .csv / review .html
    work/<slug>/        chunks, raw, clean, rejected, resume state
    out/                the files you actually use

## After a run

1. Open `out/review_<slug>.html` and read the questions.
2. Run `out/questions_<slug>.sql` in the Supabase SQL editor.
3. Mark the course live — `supabase/fix_2026-08-01.sql` section 3 does this
   from the data, so re-running it flips the course live automatically.
