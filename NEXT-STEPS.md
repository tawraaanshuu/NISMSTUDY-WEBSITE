# Where this was left — 1 Aug 2026

The site is live and healthy at
<https://tawraaanshuu.github.io/NISMSTUDY-WEBSITE/>. Everything below is
written, committed and pushed. What remains is deployment, and it is blocked
only on credentials.

Last commit: `28118b7`.

## Pick this up in one command

Three things go live together — payments, correct pricing, and the ready
courses. All three are one script; it just needs a credentials file that does
not exist yet.

```bash
cd ~/nismstudy
cp tools/secrets.env.example tools/secrets.env
chmod 600 tools/secrets.env
$EDITOR tools/secrets.env          # replace all four placeholder values
bash tools/deploy.sh
```

The four values, and where each comes from:

| Value | Where to get it |
| --- | --- |
| `SUPABASE_ACCESS_TOKEN` | supabase.com/dashboard/account/tokens → Generate new token |
| `RAZORPAY_KEY_ID` | Razorpay → Account & Settings → API Keys |
| `RAZORPAY_KEY_SECRET` | same screen, shown exactly once |
| `RAZORPAY_WEBHOOK_SECRET` | invent one — `openssl rand -hex 24` |

`tools/secrets.env` is git-ignored and `deploy.sh` never prints its values.

`deploy.sh` then: deploys both Edge Functions (the webhook with
`--no-verify-jwt`, since Razorpay sends no Supabase token), sets the three
secrets, runs `supabase/fix_2026-08-01.sql`, and flips `functionsUrl` back on
in `config.js`. Re-running it is safe.

**Then one manual step Razorpay does not allow to be automated.** Without it,
payments succeed and access is never granted:

    Razorpay → Settings → Webhooks → Add
    URL:    https://yzmctktxzpzdfhdubwjs.supabase.co/functions/v1/razorpay-webhook
    Secret: the same RAZORPAY_WEBHOOK_SECRET
    Events: payment.captured, order.paid, payment.failed

## State when work stopped

Verified live, not remembered:

| | |
| --- | --- |
| Site | 200, all 18 pages and 8 assets |
| Edge Functions | **404 — not deployed** |
| `fix_2026-08-01.sql` | **not run** — 0/8 courses at Rs 329/15d, 0/8 `is_live` |
| Questions | 1,800 — Series I, V-A and VIII complete; five courses empty |
| Buy button | deliberately disabled (`functionsUrl: ''`) |
| Working tree | clean, everything pushed |

The buy button is off on purpose. With `functionsUrl` set but the functions
returning 404, checkout read "Pay securely" and threw on click — worse than an
honest disabled button. `deploy.sh` turns it back on as its last step.

Pricing and course liveness currently come from `config.js` overrides, so the
**site shows the right thing** (Rs 329, 15 days, three courses purchasable)
even though the database still disagrees. The SQL is what makes the database
agree; delete `priceOverrideInr` and `accessDaysOverride` from `config.js`
once it has run.

## Still open, in rough priority order

1. **Deploy payments** — the script above.
2. **Supabase Site URL.** Login *emails* (magic link, password reset, signup
   confirmation) still land on the deleted `nismstudy.netlify.app`, which is
   the "Netlify Internal ID" 404. Password login is unaffected. Fix in
   Supabase → Authentication → URL Configuration; values in
   `FIX-LOGIN-REDIRECT.md`. This was reported as done but cannot be verified
   from outside — check by clicking "Forgot password" and reading the link
   domain in the email.
3. **Generate the missing questions.** Five courses have none.
   `python3 tools/mcq-agent/mcq_agent.py run --course nism-series-vi-depository-operations`
   is ~4 hours for 600; all five is ~20. Resumable, writes nothing to
   production, produces a review page to read before any SQL. Not started —
   it pins all 12 threads.
4. **`admin.html` is entirely non-functional.** It calls five functions that
   do not exist in `app.js`: `saveCourse`, `deleteCourse`, `saveQuiz`,
   `deleteQuiz`, `fetchAllQuizzes`. Pre-existing, from before the schema
   rewrite. Never fixed — rebuilding it was out of scope.
5. **The AI assistant is built but switched off.** It works (verified: it
   calls tools and answers from real data), but a model on a laptop is not
   reachable from the internet. Needs a Cloudflare Tunnel or a small VPS —
   see `CHAT-SETUP.md`. Until then the widget probes the API and hides itself,
   so no broken button appears.

## Loose end

A diagnostic account is still in production:
`claude-diag-1785529551@nismstudy.in`. Deleting it needs a service-role key.

## The documents

| File | Covers |
| --- | --- |
| `RAZORPAY-SETUP.md` | payments in full, test cards, going live |
| `FIX-LOGIN-REDIRECT.md` | the Netlify 404 and the domain situation |
| `CHAT-SETUP.md` | the AI assistant, its tools, tunnelling it |
| `tools/mcq-agent/README.md` | the question generator, and the measurements behind it |
| `supabase/fix_2026-08-01.sql` | every database change, and why enrollments stay unwriteable |
