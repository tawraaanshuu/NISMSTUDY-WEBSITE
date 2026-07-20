# NISMSTUDY — nismstudy.in

Static site for NISM / NCFM exam preparation: course catalogue, paid mock tests and free PDF workbooks.

- **Hosting:** Cloudflare Pages (production branch: `main`)
- **Backend:** Supabase (auth via email magic links, Postgres for courses/quizzes/access)
- **Stack:** plain HTML + CSS + JS — no build step

## Structure

| File | Purpose |
| --- | --- |
| `styles.css` | Single design system used by every page |
| `config.js` | Supabase URL + publishable key, table names (`window.NISM_APP_CONFIG`) |
| `app.js` | `window.NISM_APP` — auth, courses, access, quizzes, payments API |
| `index.html`, `courses.html`, `free-materials.html`, `faq.html`, … | Public pages |
| `login.html` | Email magic-link signup/login |
| `dashboard.html`, `mock-tests.html`, `mock-center.html`, `checkout.html`, `payment-success.html` | Logged-in student flow |
| `admin.html` | Admin portal (course/quiz management) |
| `_headers`, `_redirects` | Cloudflare Pages security headers and clean-URL rewrites |
| `materials/` | Free PDF workbooks |

## Local development

```sh
python3 -m http.server 8080
# open http://localhost:8080
```

## Configuration

All runtime config lives in `config.js`. Only the **publishable** Supabase key belongs there — never the secret key.

## Deployment

Push to `main`; Cloudflare Pages deploys automatically. Verify the Pages project's production branch is set to `main`.


## Ollama Chat Assistant

The static site includes `chat-widget.js`, which calls `https://api.nismstudy.in/api/chat` by default. The API implementation lives in `server/` and calls Ollama locally with `qwen3:14b`.

Production requirement: host the API on a VPS or server where Ollama is installed. Keep Ollama bound to `127.0.0.1`; expose only the Node API through HTTPS on `api.nismstudy.in`.

The assistant's base knowledge lives in `server/knowledge/nismstudy.md`. Add more `.md` or `.txt` files there when you want the model to answer from more provided material.
