-- ===========================================================================
-- 1. Bring the database in line with what the website advertises.
--    The site says Rs 329 / 15 days everywhere; the data says Rs 499-799 / 30.
-- ===========================================================================
update public.courses
   set price_inr   = 329,
       access_days = 15,
       updated_at  = now();

-- ===========================================================================
-- 2. The question that decides everything: do questions actually exist?
--    Anonymous reads return 0, which could mean "empty" OR "correctly
--    protected by RLS". Run this while logged in to find out for certain.
-- ===========================================================================
select count(*) as questions_total from public.questions;

-- Per-paper breakdown. Each paper advertises 50 questions.
select q.title,
       q.total_questions as expected,
       count(qs.id)      as actually_loaded
  from public.quizzes q
  left join public.questions qs on qs.quiz_id = q.id
 group by q.id, q.title, q.total_questions
 order by actually_loaded desc, q.title
 limit 20;

-- ===========================================================================
-- 3. If questions_total is 0, the 80 papers are empty shells and no amount of
--    front-end work will make mock tests work — loading content is the job.
--    If it is non-zero, check that enrolled students can read them:
-- ===========================================================================
select tablename, policyname, cmd, roles
  from pg_policies
 where schemaname = 'public'
   and tablename in ('questions', 'quizzes', 'enrollments', 'exam_attempts', 'exam_answers')
 order by tablename, policyname;
