-- ===========================================================================
-- nismstudy — fixes for the three things measured as broken on 2026-08-01.
--
-- Everything below was verified live against the project with an authenticated
-- student token, not assumed. What ALREADY WORKS and is deliberately not
-- touched here:
--   profiles  SELECT own            200
--   profiles  UPDATE own            200   <- the app now uses UPDATE, not upsert
--   enrollments SELECT              200
--   exam_attempts INSERT/UPDATE     201/204
--   exam_answers  INSERT            201
--
-- What is broken:
--   profiles    INSERT/upsert       403   <- fixed in app.js, no SQL needed
--   enrollments INSERT              403   <- section 1
--   payments    INSERT              403   <- section 1
--   prices/access_days disagree with the site   <- section 2
--   is_live is false on every course            <- section 3
--
-- Safe to run more than once.
-- ===========================================================================


-- ---------------------------------------------------------------------------
-- 1. Let a student create their own enrollment and payment rows.
--
-- Without this, checkout takes the money and then fails to grant access:
--   ERROR: new row violates row-level security policy for table "enrollments"
--
-- Tradeoff, stated plainly: a student who opens the browser console can insert
-- an enrollment row for themselves and get free access. That is acceptable
-- only while payment volume is low. The correct long-term fix is to grant
-- access from a payment webhook using the service-role key (which bypasses
-- RLS) and to drop the two INSERT policies below.
-- ---------------------------------------------------------------------------
alter table public.enrollments enable row level security;

drop policy if exists enrollments_insert_own on public.enrollments;
create policy enrollments_insert_own on public.enrollments
  for insert to authenticated
  with check (user_id = auth.uid());

drop policy if exists enrollments_update_own on public.enrollments;
create policy enrollments_update_own on public.enrollments
  for update to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

alter table public.payments enable row level security;

drop policy if exists payments_insert_own on public.payments;
create policy payments_insert_own on public.payments
  for insert to authenticated
  with check (user_id = auth.uid());

drop policy if exists payments_select_own on public.payments;
create policy payments_select_own on public.payments
  for select to authenticated
  using (user_id = auth.uid());


-- ---------------------------------------------------------------------------
-- 2. Make the database agree with what the site advertises.
--
-- The site says Rs 329 for 15 days on every page. The database still carries
-- the old launch pricing, so course cards were rendering "Rs 699 · 30 days"
-- straight underneath a hero banner promising Rs 329.
--
-- app.js currently overrides this for display (config.js -> priceOverrideInr).
-- Once this has run, delete `priceOverrideInr` and `accessDaysOverride` from
-- config.js so the database is the single source of truth again.
-- ---------------------------------------------------------------------------
update public.courses
   set price_inr   = 329,
       access_days = 15
 where price_inr <> 329
    or access_days <> 15;


-- ---------------------------------------------------------------------------
-- 3. Mark as live only the courses whose question bank is actually filled.
--
-- Measured on 2026-08-01: 1,800 questions exist, covering exactly three
-- courses at 600 each. The other five have zero and must not be sellable.
-- This statement derives liveness from the data rather than hardcoding slugs,
-- so re-running it after the MCQ agent loads a course flips that course live
-- automatically.
-- ---------------------------------------------------------------------------
update public.courses c
   set is_live = (
     select count(*) >= 600
       from public.questions q
       join public.quizzes z on z.id = q.quiz_id
      where z.course_id = c.id
   );

-- What the result should look like:
--   3 rows true  (Series I, Series V-A, Series VIII)
--   5 rows false (Series VI, VII, X-A, X-B, XVI)
select c.title,
       c.is_live,
       c.price_inr,
       c.access_days,
       (select count(*) from public.questions q
          join public.quizzes z on z.id = q.quiz_id
         where z.course_id = c.id) as questions
  from public.courses c
 order by c.title;
