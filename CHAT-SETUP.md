# The AI assistant

A chat widget on the site, answered by a model running on your own machine.
No API bills, no student data leaving your hardware.

## What makes it agentic rather than a FAQ bot

A retrieval bot asked *"how many days do I have left?"* answers **fifteen** —
the policy, not the student's answer. This one calls a tool and looks it up.

| Tool | Answers | Needs sign-in |
| --- | --- | --- |
| `list_courses` | what is sold, the price, whether an exam is actually on sale | no |
| `search_workbook` | any syllabus topic, from the 1,319 indexed workbook sections | no |
| `get_my_access` | which exams *you* own and days remaining | yes |
| `get_my_progress` | papers completed, best score | yes |

Two safeguards worth knowing:

- **Personal tools run as the student**, using the Supabase token their browser
  sent. Row-level security does the authorisation, so a confused model *cannot*
  read another student's enrolment — it is not a matter of the prompt being
  well written.
- **A signed-out visitor has no personal tools at all.** They are absent from
  the tool list, not offered and then refused.

The loop is capped at two tool rounds. On a CPU an unbounded loop is a hung
request, and a 3B model will occasionally ask for the same tool forever.

## The constraint you need to decide about

**A model on your laptop is not reachable from the internet.** The site is on
GitHub Pages; your Ollama is on `127.0.0.1`. Visitors cannot reach it, and the
chat will only work while your machine is on, awake, and running Ollama.

The widget handles this honestly — it probes the API before rendering, so when
your machine is off, **no chat button appears at all** rather than a button that
errors on every question.

To expose it, Cloudflare Tunnel is free and needs no public IP or port
forwarding:

```bash
# once
curl -L -o cloudflared https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64
chmod +x cloudflared && sudo mv cloudflared /usr/local/bin/
cloudflared tunnel login
cloudflared tunnel create nismstudy-chat
# route it at a hostname you control, then:
cloudflared tunnel run nismstudy-chat
```

Then set `chatApiUrl` in `config.js` to that hostname and flip
`chatWidget.enabled` to `true`.

If you would rather not run a public tunnel from your laptop, the honest
alternatives are a small always-on VPS running the same server, or a hosted
model behind the Supabase Edge Function you already use for payments.

## Running it

```bash
ollama serve &
ollama pull qwen2.5:3b-instruct

python3 server/build-workbook-index.py     # once, and after changing materials/
cd server && npm start
curl localhost:8787/health
```

`workbooks.jsonl` is ~7 MB and git-ignored — rebuild it rather than committing it.

## Model choice, measured

On this machine (Intel Ultra 5 125U, 14 threads, no GPU):

| Model | Speed | Notes |
| --- | --- | --- |
| `qwen3:14b` (the old default) | 2.3 tok/s | ~4.5 min per answer. Unusable. |
| `qwen3:4b` | 3.0 tok/s | Emits reasoning prose instead of answering. |
| **`qwen2.5:3b-instruct`** | **6.2 tok/s** | Doesn't think out loud, supports tool calling. |

The single biggest win was not the model. **Ollama sized its own thread count
from performance cores** — 2 out of 14 on this hybrid Intel part, measured at
191% CPU out of a possible 1400%. Setting `num_thread` explicitly took it to
1358% and made prompt processing 3.6× faster. That is now the default here
(`os.cpus().length - 2`), overridable with `OLLAMA_NUM_THREAD`.

Expect roughly 10–25 seconds per answer. Answers are capped short
(`num_predict` 260) because every token is real wall-clock time.

## Configuration

| Variable | Default | Why change it |
| --- | --- | --- |
| `OLLAMA_MODEL` | `qwen2.5:3b-instruct` | A bigger model if you get a GPU |
| `OLLAMA_NUM_THREAD` | cores − 2 | Lower it if the machine is doing other work |
| `MAX_TOOL_ROUNDS` | 2 | Raise only if you have the speed to spare |
| `ALLOWED_ORIGINS` | github.io + nismstudy.in + localhost | Any new domain must be added or CORS blocks it |
| `RATE_LIMIT_MAX` | 20/min per IP | A public tunnel is worth rate limiting |

## Grounding

The system prompt forbids inventing prices, availability, exam rules, passing
marks, dates or regulatory facts, and forbids claiming affiliation with NISM,
SEBI, NSE or BSE. When it explains a syllabus topic it names the exam and
chapter it came from, so a student can check it against the free workbook.
Anything it cannot resolve goes to `info@nismstudy.in`.

The workbook index is built by `server/build-workbook-index.py` from the same
chapter/section chunks the MCQ agent uses — one parser, so a fix to either
benefits both.
