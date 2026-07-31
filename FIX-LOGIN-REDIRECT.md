# The Netlify "Site not found" on login

## What is happening

Nothing in this repo causes it. The login page is fine — the redirect comes
from Supabase.

Measured 1 Aug 2026:

| URL | What it serves |
| --- | --- |
| `tawraaanshuu.github.io/NISMSTUDY-WEBSITE/` | HTTP 200 — **this is the live site** |
| `nismstudy.in` | HTTP 200 — an **old** build, via Cloudflare |
| `www.nismstudy.in` | **HTTP 000 — no DNS at all** |
| `nismstudy.netlify.app` | **HTTP 404 — the deleted Netlify site** |

Supabase Auth has a **Site URL** setting. Every confirmation, magic-link and
password-reset email is sent to that URL, and any `emailRedirectTo` the app
asks for is ignored unless it appears on the redirect allow-list. That setting
still points at the Netlify site, which no longer exists — so clicking a login
email lands on Netlify's 404. That is the "Netlify Internal ID" error.

**Password login does not go through email and is unaffected.** Only the
"email me a login link", "forgot password" and signup-confirmation flows break.

## The one change that fixes it

Supabase Dashboard → **Authentication → URL Configuration**

- **Site URL**

      https://tawraaanshuu.github.io/NISMSTUDY-WEBSITE/login.html

- **Redirect URLs** — add:

      https://tawraaanshuu.github.io/NISMSTUDY-WEBSITE/**
      http://localhost:*/**

- **Remove** any `*.netlify.app` entry.

Nothing else is required. The site is deployed and serving from GitHub Pages.

## Note on the old domain

`nismstudy.in` still serves an older build through Cloudflare. It is not
connected to this repo, so it will keep showing stale content until it is
either repointed at GitHub Pages or taken down. Every canonical, Open Graph,
`sitemap.xml` and `robots.txt` entry in this repo now points at the
`github.io` URL, so search engines will index the live site rather than the
stale one.

If you later move the domain across:

1. Remove the project from Cloudflare Pages (or delete the proxied DNS record).
2. Apex `A` records for `nismstudy.in`:

       185.199.108.153
       185.199.109.153
       185.199.110.153
       185.199.111.153

3. `CNAME` for `www` → `tawraaanshuu.github.io`.
4. GitHub repo → Settings → Pages → Custom domain → `nismstudy.in`, then
   **Enforce HTTPS**. Add a `CNAME` file at the repo root containing
   `nismstudy.in`.
5. Re-run the URL rewrite so canonicals point back at `nismstudy.in`, and add
   the new domain to the Supabase redirect list.

`_headers` and `_redirects` in this repo are Cloudflare/Netlify formats and do
nothing on GitHub Pages.
