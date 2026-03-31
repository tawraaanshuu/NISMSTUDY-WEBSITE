(function () {
  const { createClient } = window.supabase;
  const supabase = createClient(window.SUPABASE_URL, window.SUPABASE_ANON_KEY);

  const PILOT_SLUGS = new Set([
    'nism-series-i-currency-derivatives',
    'nism-series-v-a-mutual-fund-distributors',
    'nism-series-viii-equity-derivatives'
  ]);

  const FALLBACK_SEQUENCE = [
    { title: 'Mock Test 1', exam_type: 'mock', exam_order: 1, total_questions: 50, max_marks: 50, duration_minutes: 90, required_completed_mocks: 0 },
    { title: 'Mock Test 2', exam_type: 'mock', exam_order: 2, total_questions: 50, max_marks: 50, duration_minutes: 90, required_completed_mocks: 0 },
    { title: 'Mock Test 3', exam_type: 'mock', exam_order: 3, total_questions: 50, max_marks: 50, duration_minutes: 90, required_completed_mocks: 0 },
    { title: 'Mock Test 4', exam_type: 'mock', exam_order: 4, total_questions: 50, max_marks: 50, duration_minutes: 90, required_completed_mocks: 0 },
    { title: 'Mock Test 5', exam_type: 'mock', exam_order: 5, total_questions: 50, max_marks: 50, duration_minutes: 90, required_completed_mocks: 0 },
    { title: 'Mock Test 6', exam_type: 'mock', exam_order: 6, total_questions: 50, max_marks: 50, duration_minutes: 90, required_completed_mocks: 0 },
    { title: 'Mock Test 7', exam_type: 'mock', exam_order: 7, total_questions: 50, max_marks: 50, duration_minutes: 90, required_completed_mocks: 0 },
    { title: 'Mock Test 8', exam_type: 'mock', exam_order: 8, total_questions: 50, max_marks: 50, duration_minutes: 90, required_completed_mocks: 0 },
    { title: 'Full Test 1', exam_type: 'full', exam_order: 9, total_questions: 100, max_marks: 100, duration_minutes: 180, required_completed_mocks: 8 },
    { title: 'Full Test 2', exam_type: 'full', exam_order: 10, total_questions: 100, max_marks: 100, duration_minutes: 180, required_completed_mocks: 8 }
  ];

  const $ = (id) => document.getElementById(id);

  function getSlugFromUrl() {
    const url = new URL(window.location.href);
    const directSlug = url.searchParams.get('slug');
    if (directSlug) return directSlug;

    const selectedCourse = sessionStorage.getItem('selectedCourse');
    if (!selectedCourse) return null;

    const map = window.COURSE_SLUG_MAP || {};
    return map[selectedCourse] || selectedCourse;
  }

  function setCourseDetails(course) {
    $('courseTitle').textContent = course.title || 'Course';
    $('courseDescription').textContent = course.long_description || course.short_description || 'Course details loaded from Supabase.';
    $('coursePrice').textContent = course.price_inr ? `₹${course.price_inr}` : 'Free';
    $('courseStatus').textContent = course.status || 'draft';
    $('courseSlug').textContent = course.slug || '—';
  }

  function showMessage(id, text, type) {
    const el = $(id);
    el.textContent = text;
    el.className = `message ${type}`;
    el.classList.remove('hidden');
  }

  function renderQuizzes(quizzes, completedMockCount, hasSession) {
    const grid = $('quizGrid');
    grid.innerHTML = '';

    quizzes.forEach((quiz) => {
      const fullTestLocked = quiz.exam_type === 'full' && completedMockCount < (quiz.required_completed_mocks || 0);
      const buttonLabel = !hasSession
        ? 'Login to Continue'
        : fullTestLocked
          ? 'Locked'
          : 'Phase 2: Start Exam';

      const actionClass = !hasSession || fullTestLocked ? 'btn btn-disabled' : 'btn btn-primary';
      const note = !hasSession
        ? 'Login is required before we can check your completed mocks and unlock full tests.'
        : fullTestLocked
          ? 'Complete all 8 mock tests to unlock this full test.'
          : 'Sequence is correct. Exam start flow comes in Phase 2.';

      const card = document.createElement('div');
      card.className = 'quiz-card';
      card.innerHTML = `
        <div>
          <h3 style="margin:0 0 6px 0;">${quiz.title}</h3>
          <div class="quiz-badges">
            <span class="badge">Order ${quiz.exam_order}</span>
            <span class="badge">${quiz.total_questions} questions</span>
            <span class="badge">${quiz.max_marks} marks</span>
            <span class="badge">${quiz.duration_minutes} mins</span>
            <span class="badge">${quiz.exam_type === 'full' ? 'Full Test' : 'Mock Test'}</span>
          </div>
          <div class="tiny">${note}</div>
        </div>
        <div class="quiz-action">
          <button class="${actionClass}" ${!hasSession || fullTestLocked ? 'disabled' : ''}>${buttonLabel}</button>
        </div>
      `;
      grid.appendChild(card);
    });
  }

  async function fetchCompletedMockCount(userId, courseId) {
    const { data, error } = await supabase
      .from('exam_attempts')
      .select('quiz_id,status, quizzes!inner(course_id, exam_type)')
      .eq('user_id', userId)
      .eq('quizzes.course_id', courseId)
      .eq('quizzes.exam_type', 'mock')
      .in('status', ['submitted', 'auto_submitted']);

    if (error) {
      console.warn('Could not fetch attempts:', error.message);
      return 0;
    }

    const uniqueQuizIds = new Set((data || []).map(row => row.quiz_id));
    return uniqueQuizIds.size;
  }

  async function load() {
    const slug = getSlugFromUrl();
    if (!slug) {
      showMessage('errorBox', 'No course slug was found in the URL. Open this page using /course-detail.html?slug=your-course-slug', 'warn');
      return;
    }

    if (!PILOT_SLUGS.has(slug)) {
      showMessage('authInfo', 'This Phase 1 page is currently wired for the 3 pilot courses only.', 'info');
    }

    const { data: { session } } = await supabase.auth.getSession();

    if (!session) {
      showMessage('authInfo', 'You are not logged in. We will still show the pilot exam sequence, but full unlock checks need a logged-in Supabase user.', 'info');
    }

    const { data: course, error: courseError } = await supabase
      .from('courses')
      .select('*')
      .eq('slug', slug)
      .single();

    if (courseError) {
      showMessage('errorBox', `Could not load course ${slug}. Make sure the course is published or log in as an allowed user.`, 'warn');
      return;
    }

    setCourseDetails(course);

    let quizzes = [];
    const { data: quizData, error: quizError } = await supabase
      .from('quizzes')
      .select('*')
      .eq('course_id', course.id)
      .order('exam_order', { ascending: true });

    if (quizError || !quizData || !quizData.length) {
      quizzes = FALLBACK_SEQUENCE;
      showMessage('authInfo', 'Using fallback exam sequence because your current user cannot read quizzes yet. This still matches your Supabase pilot structure.', 'info');
    } else {
      quizzes = quizData;
    }

    let completedMockCount = 0;
    if (session?.user?.id) {
      completedMockCount = await fetchCompletedMockCount(session.user.id, course.id);
    }

    renderQuizzes(quizzes, completedMockCount, Boolean(session));
  }

  document.addEventListener('DOMContentLoaded', load);
})();
