# PocketBase backend (open-source alternative to Supabase)

A complete, tested replacement for the Supabase backend. **Nothing here is live
yet** — the site still runs on Supabase. Adopt it by copying three files (below).

Why PocketBase: one Go binary, one SQLite file, MIT licensed, with auth, an admin
UI and file storage built in. It runs on a €5 VPS and backing it up is copying a
file. There is no free tier to lapse, which is what took the Supabase project down.

## What is here

| File | Purpose |
| --- | --- |
| `setup.py` | Creates every collection with its access rules, then seeds from `seed.json` |
| `seed.json` | 3 published courses + 20 sample questions |
| `app-pb.js` | Drop-in replacement for `app.js` — same `window.NISM_APP` interface |
| `config-pb.js` | Config template (PocketBase URL + collection names) |
| `login.html` | Login page adapted for one-time codes |

## Install

```sh
# on the server
wget https://github.com/pocketbase/pocketbase/releases/download/v0.39.8/pocketbase_0.39.8_linux_amd64.zip
unzip pocketbase_0.39.8_linux_amd64.zip
./pocketbase superuser upsert you@example.com 'a-long-password'
./pocketbase serve --http=0.0.0.0:8090
```

Put it behind nginx/Caddy on `https://api.nismstudy.in` with a TLS certificate,
then create the schema:

```sh
export PB_URL=https://api.nismstudy.in
export PB_EMAIL=you@example.com
export PB_PASSWORD='a-long-password'
python3 setup.py
```

Run it as a systemd service so it restarts on reboot.

## Switch the site over

Copy three files to the site root, replacing the Supabase versions:

```sh
cp pocketbase/app-pb.js    app.js
cp pocketbase/config-pb.js config.js   # then edit pocketbaseUrl
cp pocketbase/login.html   login.html
```

Everything else — `index`, `courses`, `dashboard`, `mock-tests`, `mock-center`,
`checkout`, `payment-success` — is **unchanged**. `app-pb.js` exposes the same
`NISM_APP` interface and normalises PocketBase's response shape (`course` +
`expand.course`) into the `course_id` + `courses` shape those pages expect.

Two further steps:
- **CORS**: in the PocketBase admin UI, allow your site origin.
- **SMTP**: Settings → Mail. Login codes are emailed, so without a mail provider
  (Brevo, Resend, Postmark…) **nobody can log in**. This is the one part not
  verified locally, because no SMTP server was available.
- `admin.html` is no longer needed — PocketBase's own admin UI manages courses
  and questions, and does it better.

## What changes for students

Login becomes an emailed **8-digit code** instead of a magic link, because
PocketBase has no magic-link flow. The user enters the code on the page rather
than leaving to click a link — arguably better on mobile. Codes last 15 minutes.

## Verification status

Tested against a real PocketBase 0.39.8 instance, driven through a headless
browser: **20/20 assertions passed** on a clean student — public catalogue reads,
access gating, purchase, quiz retrieval, attempt saving, re-purchase extending
rather than duplicating, and date/format helpers. `setup.py` was then run against
a completely fresh instance and re-verified from zero.

Not verified: the OTP email round-trip (needs SMTP) and behaviour under real
concurrent load.

Two PocketBase behaviours worth knowing, both already handled:
- **`created`/`updated` are not automatic** in 0.23+. They must be declared as
  `autodate` fields or every sorted query fails with a generic 400.
- **Quiz access rules need `?=` / `?>` (any-of)**. With plain `=`, joined access
  rows are matched all-of, so a student owning two courses sees *nothing*. The
  any-of form was checked for correlation leaks: a student with valid access to
  course A and expired access to course B sees only A.

## Known security tradeoffs (same as the Supabase build)

1. **Students can self-grant access.** `payment-success.html` writes the access
   row from the browser, so `exam_access.createRule` must permit it. Anyone with
   devtools can unlock a course free. The fix is to grant access from a payment
   webhook instead — with PocketBase that is a Go hook or a small server route
   using the superuser token — then set `createRule`/`updateRule` to `null`.
2. **The answer key reaches the browser**, because scoring is client-side. The
   access rule stops anonymous scraping, but an enrolled student can read
   `correct_option`. Server-side scoring would be needed to close it.
