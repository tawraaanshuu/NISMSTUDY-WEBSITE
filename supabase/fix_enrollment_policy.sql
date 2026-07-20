-- ===========================================================================
-- Checkout currently fails: RLS blocks a student from creating their own
-- enrollment row, but payment-success.html grants access from the browser.
--   ERROR: new row violates row-level security policy for table "enrollments"
--
-- Pick ONE of the two options below.
-- ===========================================================================

-- ---------------------------------------------------------------------------
-- OPTION A — quick, unblocks checkout today.
-- Lets a signed-in student create/extend ONLY their own enrollment.
-- Tradeoff: someone technical could grant themselves free access from the
-- browser console. Acceptable while payment volume is low; not long-term.
-- ---------------------------------------------------------------------------
alter table public.enrollments enable row level security;

drop policy if exists enrollments_select_own on public.enrollments;
create policy enrollments_select_own on public.enrollments
  for select to authenticated
  using (user_id = auth.uid());

drop policy if exists enrollments_insert_own on public.enrollments;
create policy enrollments_insert_own on public.enrollments
  for insert to authenticated
  with check (user_id = auth.uid());

drop policy if exists enrollments_update_own on public.enrollments;
create policy enrollments_update_own on public.enrollments
  for update to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- ---------------------------------------------------------------------------
-- OPTION B — correct long-term. Keep writes server-side.
-- Leave SELECT-only for students (run just the select policy above), and grant
-- access from a payment webhook using the service-role key, which bypasses RLS.
-- Until that webhook exists, grant access by hand:
--
--   insert into public.enrollments (user_id, course_id, access_until)
--   select u.id, c.id, now() + interval '15 days'
--     from auth.users u, public.courses c
--    where u.email = 'student@example.com'
--      and c.title like 'NISM Series VIII%'
--   on conflict do nothing;
-- ---------------------------------------------------------------------------

-- ===========================================================================
-- Attempts and answers must also be writable by their owner, or submitting a
-- mock test fails after the student has already sat it.
-- ===========================================================================
alter table public.exam_attempts enable row level security;

drop policy if exists attempts_own on public.exam_attempts;
create policy attempts_own on public.exam_attempts
  for all to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

alter table public.exam_answers enable row level security;

drop policy if exists answers_own on public.exam_answers;
create policy answers_own on public.exam_answers
  for all to authenticated
  using (exists (select 1 from public.exam_attempts a
                  where a.id = exam_answers.attempt_id and a.user_id = auth.uid()))
  with check (exists (select 1 from public.exam_attempts a
                       where a.id = exam_answers.attempt_id and a.user_id = auth.uid()));
