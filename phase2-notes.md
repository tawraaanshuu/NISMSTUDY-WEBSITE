# Phase 2 patch notes

This bundle assumes your Phase 1 files already exist:
- `supabase-config.js`
- `auth.js`
- `login.html`
- `register.html`
- updated `index.html`
- updated `showCourseDetails()` in `script.js`

## Files in this bundle
- `course-detail.html` (updated)
- `course-detail.js` (updated)
- `quiz-interface.html` (new)
- `quiz-interface.js` (new)
- `quiz-result.html` (new)
- `quiz-result.js` (new)

## What Phase 2 does
- Shows Start / Resume buttons on the course detail page
- Opens a real exam page using Supabase data
- Creates or resumes `exam_attempts`
- Loads `questions`
- Saves answers with autosave into `exam_answers`
- Starts the countdown timer from `expires_at`
- Logs tab-switch violations into `exam_violations`
- Auto-submits on timeout or after 3 violations
- Saves score into `exam_attempts`
- Redirects to a result page

## Testing order
1. Log in with your Supabase user
2. Open `/course-detail.html?slug=nism-series-v-a-mutual-fund-distributors`
3. Click `Start Exam` on Mock Test 1
4. Answer 2–3 questions
5. Refresh the page and confirm it says `Resume Exam`
6. Submit the exam
7. Confirm `/quiz-result.html?attemptId=...` loads

## If exam start fails
The most likely cause is RLS on `exam_attempts`.
For pilot testing, use an admin user or a user with a paid enrollment for the course.
