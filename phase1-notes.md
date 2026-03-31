# Phase 1 patch notes

## Add these new files to the repo root
- supabase-config.js (copy from supabase-config.example.js and fill your real values)
- auth.js
- course-detail.html
- course-detail.js

## Replace these existing files if you want Supabase auth now
- login.html
- register.html

## Small edit in existing script.js
Replace only showCourseDetails() with the code from script-showCourseDetails-replacement.txt

## Important pilot constraints
1. This page is wired for your 3 pilot courses first:
   - nism-series-i-currency-derivatives
   - nism-series-v-a-mutual-fund-distributors
   - nism-series-viii-equity-derivatives
2. If quizzes are hidden by your current RLS, the page falls back to the expected 10-exam sequence so the UI is still testable.
3. Accurate full-test unlocking needs a logged-in Supabase user and matching exam_attempts rows.
4. Phase 2 will add the actual exam page, timer, autosave, answer saving, and submit flow.

## Very likely SQL/data checks before testing
- The 3 pilot courses should be published if you want to view them anonymously.
- You should have a real Supabase auth user for login testing.
- Your quizzes must already have exam_order and required_completed_mocks set correctly.
