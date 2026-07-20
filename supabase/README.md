# Supabase setup — getting mock tests live

The original project (`yzmctktxzpzdfhdubwjs`) no longer resolves in DNS: it was
deleted or purged after being paused, so it cannot be restored from the code side.
These files rebuild the backend from scratch.

## 1. Create the project

supabase.com → **New project**. Note the **Project URL** and the **publishable
(anon) key** from Settings → API.

## 2. Run the SQL

Supabase → **SQL Editor** → paste and run, in this order:

1. `schema.sql` — tables, indexes, RLS policies, admin helper, signup trigger
2. `seed.sql` — 3 published courses + 20 working sample questions

Re-running either file is safe; both are idempotent.

## 3. Point the site at the new project

Edit **`config.js`** in the repo root (and `supabase-config.js`, which is only a
legacy shim) with the new URL and publishable key:

```js
supabaseUrl: 'https://<new-ref>.supabase.co',
supabaseAnonKey: 'sb_publishable_...',
```

Never put the **secret** key in either file — they are served publicly.
The old secret key leaked this way and must be treated as compromised.

## 4. Turn on email login

Auth → **Providers → Email**: enable it, and enable **magic links** (the site
never uses passwords). Under Auth → **URL Configuration**, set the Site URL and
add the deployed origin to redirect URLs, e.g.
`https://nismstudy.in` and `https://tawraaanshuu.github.io/NISMSTUDY-WEBSITE`.
Without this, login emails will refuse to redirect back.

## 5. Make yourself an admin

Sign up once through the site so the row exists, then in the SQL editor:

```sql
update public.profiles set role = 'admin' where email = 'you@example.com';
```

`admin.html` then unlocks, and you can add the real question bank there.

## 6. Verify end to end

1. Log in via magic link → dashboard lists the 3 seeded courses
2. Grant yourself access without paying, to test the mock flow:
   ```sql
   insert into public.exam_access (user_id, course_id, access_until)
   select p.id, c.id, now() + interval '15 days'
   from public.profiles p, public.courses c
   where p.email = 'you@example.com'
     and c.exam_name like 'NISM Series VIII%'
   on conflict (user_id, course_id) do update set access_until = excluded.access_until;
   ```
3. Open **Mock Tests** → start the mock → submit → a row lands in `mock_attempts`

---

## Two security issues you should know about

**1. Students can self-grant access.** `payment-success.html` grants exam access
from the browser using the anon key, so the RLS policy has to let a user insert
their own `exam_access` row. Anyone who opens devtools can therefore give
themselves free access. Keeping this permissive is the only way the current
payment flow works at all.

The proper fix is to move granting server-side: a Supabase **Edge Function** that
receives the payment gateway's webhook, verifies its signature, and writes
`exam_access` with the service-role key. Then tighten the policies to:

```sql
drop policy if exists exam_access_insert on public.exam_access;
drop policy if exists exam_access_update on public.exam_access;
-- students keep SELECT only; writes come from the webhook's service-role key,
-- which bypasses RLS.
```

**2. Quiz answers are visible to anyone with access.** Scoring happens in the
browser, so `correct_option` must be sent to the client — a student with access
can read the answer key from devtools. RLS already limits reads to students with
unexpired access for that course, which stops anonymous scraping of the question
bank. Hiding answers from enrolled students would require server-side scoring
(submit answers to an Edge Function, return only the score).

Neither issue blocks launch; both are worth fixing before you rely on paid
revenue.
