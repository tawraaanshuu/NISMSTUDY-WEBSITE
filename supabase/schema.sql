-- ===========================================================================
-- NISMSTUDY — full database schema
-- Run once in the Supabase SQL editor on a fresh project.
-- Every table/column here is required by app.js or admin.html; nothing is spare.
-- ===========================================================================

-- ---------------------------------------------------------------------------
-- Tables
-- ---------------------------------------------------------------------------

create table if not exists public.profiles (
  id         uuid primary key references auth.users (id) on delete cascade,
  email      text,
  full_name  text,
  mobile     text,
  role       text not null default 'student',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.courses (
  id                 uuid primary key default gen_random_uuid(),
  title              text,
  exam_name          text,
  description        text,
  price              text default '329',
  payment_url        text,
  mock_duration_days integer not null default 15,
  display_order      integer not null default 0,
  is_published       boolean not null default false,
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now()
);

create table if not exists public.quizzes (
  id             uuid primary key default gen_random_uuid(),
  course_id      uuid not null references public.courses (id) on delete cascade,
  question_text  text not null,
  option_a       text,
  option_b       text,
  option_c       text,
  option_d       text,
  correct_option text check (correct_option in ('A', 'B', 'C', 'D')),
  explanation    text,
  is_active      boolean not null default true,
  display_order  integer not null default 0,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

-- One row per (student, course). The unique constraint is required:
-- app.js upserts with onConflict 'user_id,course_id'.
create table if not exists public.exam_access (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references auth.users (id) on delete cascade,
  course_id    uuid not null references public.courses (id) on delete cascade,
  access_from  timestamptz not null default now(),
  access_until timestamptz not null,
  payment_ref  text,
  updated_at   timestamptz not null default now(),
  unique (user_id, course_id)
);

-- payment_ref is unique so a repeated gateway callback is rejected as a
-- duplicate rather than recorded twice (app.js tolerates that error).
create table if not exists public.payment_records (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references auth.users (id) on delete cascade,
  course_id    uuid not null references public.courses (id) on delete cascade,
  payment_ref  text unique,
  amount_label text,
  status       text not null default 'paid',
  raw_payload  jsonb not null default '{}'::jsonb,
  created_at   timestamptz not null default now()
);

create table if not exists public.mock_attempts (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null references auth.users (id) on delete cascade,
  course_id       uuid not null references public.courses (id) on delete cascade,
  score           integer not null default 0,
  total_questions integer not null default 0,
  answers         jsonb not null default '[]'::jsonb,
  created_at      timestamptz not null default now()
);

create table if not exists public.home_support_content (
  id         uuid primary key default gen_random_uuid(),
  title      text,
  body       text,
  is_active  boolean not null default true,
  updated_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Indexes for the queries the app actually runs
-- ---------------------------------------------------------------------------
create index if not exists idx_courses_published   on public.courses (is_published, display_order);
create index if not exists idx_quizzes_course      on public.quizzes (course_id, is_active, display_order);

-- Makes seed.sql idempotent: without a unique constraint, ON CONFLICT DO NOTHING
-- has nothing to conflict on and a re-run would duplicate every question.
create unique index if not exists uq_quizzes_course_question
  on public.quizzes (course_id, question_text);
create index if not exists idx_exam_access_user    on public.exam_access (user_id, access_until desc);
create index if not exists idx_mock_attempts_user  on public.mock_attempts (user_id, created_at desc);

-- ---------------------------------------------------------------------------
-- Admin helper. SECURITY DEFINER so the profiles lookup does not re-trigger
-- the profiles RLS policy (which would recurse).
-- ---------------------------------------------------------------------------
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role in ('admin', 'super_admin')
  );
$$;

-- Create the profile row automatically on signup, so a student always has one
-- even if the client-side upsert never runs.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name)
  values (new.id, new.email, coalesce(new.raw_user_meta_data ->> 'full_name', new.email))
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------------
alter table public.profiles             enable row level security;
alter table public.courses              enable row level security;
alter table public.quizzes              enable row level security;
alter table public.exam_access          enable row level security;
alter table public.payment_records      enable row level security;
alter table public.mock_attempts        enable row level security;
alter table public.home_support_content enable row level security;

-- profiles: a student sees and edits only their own row.
drop policy if exists profiles_select on public.profiles;
create policy profiles_select on public.profiles
  for select to authenticated
  using (id = auth.uid() or public.is_admin());

drop policy if exists profiles_insert on public.profiles;
create policy profiles_insert on public.profiles
  for insert to authenticated
  with check (id = auth.uid());

drop policy if exists profiles_update on public.profiles;
create policy profiles_update on public.profiles
  for update to authenticated
  using (id = auth.uid() or public.is_admin())
  with check (id = auth.uid() or public.is_admin());

-- courses: published courses are readable by the public (the catalogue and
-- home page load them while logged out). Only admins can write.
drop policy if exists courses_select on public.courses;
create policy courses_select on public.courses
  for select to anon, authenticated
  using (is_published or public.is_admin());

drop policy if exists courses_write on public.courses;
create policy courses_write on public.courses
  for all to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- quizzes: readable ONLY by a student with unexpired access to that course.
-- This is what stops the question bank being scraped by anyone with the anon key.
drop policy if exists quizzes_select on public.quizzes;
create policy quizzes_select on public.quizzes
  for select to authenticated
  using (
    public.is_admin()
    or (
      is_active
      and exists (
        select 1 from public.exam_access ea
        where ea.course_id = quizzes.course_id
          and ea.user_id = auth.uid()
          and ea.access_until > now()
      )
    )
  );

drop policy if exists quizzes_write on public.quizzes;
create policy quizzes_write on public.quizzes
  for all to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- exam_access: a student reads only their own access rows.
drop policy if exists exam_access_select on public.exam_access;
create policy exam_access_select on public.exam_access
  for select to authenticated
  using (user_id = auth.uid() or public.is_admin());

-- NOTE (read this): the current payment flow grants access from the BROWSER
-- (payment-success.html calls recordPaymentAndGrantAccess with the anon key),
-- so these write policies must allow a student to insert their own access row.
-- That means a technically capable visitor could self-grant free access from
-- the devtools console. See supabase/README.md for the webhook fix.
drop policy if exists exam_access_insert on public.exam_access;
create policy exam_access_insert on public.exam_access
  for insert to authenticated
  with check (user_id = auth.uid() or public.is_admin());

drop policy if exists exam_access_update on public.exam_access;
create policy exam_access_update on public.exam_access
  for update to authenticated
  using (user_id = auth.uid() or public.is_admin())
  with check (user_id = auth.uid() or public.is_admin());

-- payment_records: a student writes and reads only their own payments.
drop policy if exists payment_records_select on public.payment_records;
create policy payment_records_select on public.payment_records
  for select to authenticated
  using (user_id = auth.uid() or public.is_admin());

drop policy if exists payment_records_insert on public.payment_records;
create policy payment_records_insert on public.payment_records
  for insert to authenticated
  with check (user_id = auth.uid() or public.is_admin());

-- mock_attempts: a student writes and reads only their own attempts.
drop policy if exists mock_attempts_select on public.mock_attempts;
create policy mock_attempts_select on public.mock_attempts
  for select to authenticated
  using (user_id = auth.uid() or public.is_admin());

drop policy if exists mock_attempts_insert on public.mock_attempts;
create policy mock_attempts_insert on public.mock_attempts
  for insert to authenticated
  with check (user_id = auth.uid() or public.is_admin());

-- home_support_content: public read of the active row; admin writes.
drop policy if exists home_support_select on public.home_support_content;
create policy home_support_select on public.home_support_content
  for select to anon, authenticated
  using (is_active or public.is_admin());

drop policy if exists home_support_write on public.home_support_content;
create policy home_support_write on public.home_support_content
  for all to authenticated
  using (public.is_admin())
  with check (public.is_admin());
