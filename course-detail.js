(function () {
  const { createClient } = window.supabase;
  const supabase = createClient(window.SUPABASE_URL, window.SUPABASE_ANON_KEY);
  
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
    return url.searchParams.get('slug');
  }

  function setCourseDetails(course) {
    $('courseTitle').textContent = course.title || 'Course';
    $('courseDescription').textContent = course.long_description || course.short_description || 'Course details loaded from Supabase.';
    $('coursePrice').textContent = typeof course.price_inr === 'number' ? `₹${course.price_inr}` : 'Free';
    $('courseStatus').textContent = course.status || 'draft';
    $('courseSlug').textContent = course.slug || '—';
  }

  function showMessage(id, text, type) {
    const el = $(id);
    el.textContent = text;
    el.className = `message ${type}`;
    el.classList.remove('hidden');
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

    return new Set((data || []).map((row) => row.quiz_id)).size;
  }

  async function fetchInProgressAttemptMap(userId, courseId) {
    const { data, error } = await supabase
      .from('exam_attempts')
      .select('id, quiz_id, status, submitted_at, quizzes!inner(course_id)')
      .eq('user_id', userId)
      .eq('quizzes.course_id', courseId)
      .eq('status', 'in_progress')
      .is('submitted_at', null);

    if (error) {
      console.warn('Could not fetch in-progress attempts:', error.message);
      return new Map();
    }

    const map = new Map();
    (data || []).forEach((row) => {
      if (!map.has(row.quiz_id)) map.set(row.quiz_id, row.id);
    });
    return map;
  }

  function renderQuizzes(courseSlug, quizzes, completedMockCount, session, inProgressMap) {
    const grid = $('quizGrid');
    grid.innerHTML = '';

    quizzes.forEach((quiz) => {
      const hasQuizId = Boolean(quiz.id);
      const isFullTest = quiz.exam_type === 'full';
      const fullTestLocked = isFullTest && completedMockCount < (quiz.required_completed_mocks || 0);
      const inProgressAttemptId = hasQuizId ? inProgressMap.get(quiz.id) : null;

      let actionHtml = '<button class="btn btn-disabled" disabled>Unavailable</button>';
      let note = 'This exam is not available yet.';

      if (!session) {
        actionHtml = '<a class="btn btn-secondary" href="/login.html">Login to Continue</a>';
        note = 'Login is required before you can start or resume an exam.';
      } else if (!hasQuizId) {
        actionHtml = '<button class="btn btn-disabled" disabled>Unavailable</button>';
        note = 'Quiz data could not be read from Supabase.';
      } else if (fullTestLocked) {
        actionHtml = '<button class="btn btn-disabled" disabled>Locked</button>';
        note = 'Complete all 8 mock tests to unlock this full test.';
      } else if (inProgressAttemptId) {
        actionHtml = `<a class="btn btn-primary" href="/quiz-interface.html?slug=${encodeURIComponent(courseSlug)}&quizId=${encodeURIComponent(quiz.id)}&attemptId=${encodeURIComponent(inProgressAttemptId)}">Resume Exam</a>`;
        note = 'You have an unfinished attempt for this exam.';
      } else {
        actionHtml = `<a class="btn btn-primary" href="/quiz-interface.html?slug=${encodeURIComponent(courseSlug)}&quizId=${encodeURIComponent(quiz.id)}">Start Exam</a>`;
        note = 'Ready to start.';
      }

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
            <span class="badge">${isFullTest ? 'Full Test' : 'Mock Test'}</span>
          </div>
          <div class="tiny">${note}</div>
        </div>
        <div class="quiz-action">
          ${actionHtml}
        </div>
      `;
      grid.appendChild(card);
    });
  }

  async function load() {
    const slug = getSlugFromUrl();
    if (!slug) {
      showMessage('errorBox', 'No course slug was found in the URL. Open this page using /course-detail.html?slug=your-course-slug', 'warn');
      return;
    }

      const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      showMessage('authInfo', 'You are not logged in. You can still view the exam sequence, but login is required to start exams and check full-test unlock status.', 'info');
    }

    const { data: course, error: courseError } = await supabase
      .from('courses')
      .select('*')
      .eq('slug', slug)
      .single();

    if (courseError) {
      showMessage('errorBox', `Could not load course ${slug}. Make sure the course exists and is readable for your current user.`, 'warn');
      return;
    }

    setCourseDetails(course);

    const { data: quizData, error: quizError } = await supabase
  .from('quizzes')
  .select('id,title,exam_type,exam_order,total_questions,max_marks,duration_minutes,required_completed_mocks')
  .eq('course_id', course.id)
  .order('exam_order', { ascending: true });

if (quizError) {
  showMessage('errorBox', `quizzes SELECT failed: ${quizError.message}`, 'warn');
  return;
}

if (!quizData || !quizData.length) {
  showMessage('errorBox', `No quizzes found for course_id=${course.id}`, 'warn');
  return;
}

(function () {
  const { createClient } = window.supabase;
  const supabase = createClient(window.SUPABASE_URL, window.SUPABASE_ANON_KEY);

  const $ = (id) => document.getElementById(id);

  function getSlugFromUrl() {
    const url = new URL(window.location.href);
    return url.searchParams.get('slug');
  }

  function setCourseDetails(course) {
    $('courseTitle').textContent = course.title || 'Course';
    $('courseDescription').textContent =
      course.long_description ||
      course.short_description ||
      'Course details loaded from Supabase.';
    $('coursePrice').textContent =
      typeof course.price_inr === 'number' ? `₹${course.price_inr}` : 'Free';
    $('courseStatus').textContent = course.status || 'draft';
    $('courseSlug').textContent = course.slug || '—';
  }

  function showMessage(id, text, type) {
    const el = $(id);
    el.textContent = text;
    el.className = `message ${type}`;
    el.classList.remove('hidden');
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

    return new Set((data || []).map((row) => row.quiz_id)).size;
  }

  async function fetchInProgressAttemptMap(userId, courseId) {
    const { data, error } = await supabase
      .from('exam_attempts')
      .select('id, quiz_id, status, submitted_at, quizzes!inner(course_id)')
      .eq('user_id', userId)
      .eq('quizzes.course_id', courseId)
      .eq('status', 'in_progress')
      .is('submitted_at', null);

    if (error) {
      console.warn('Could not fetch in-progress attempts:', error.message);
      return new Map();
    }

    const map = new Map();
    (data || []).forEach((row) => {
      if (!map.has(row.quiz_id)) map.set(row.quiz_id, row.id);
    });
    return map;
  }

  function renderQuizzes(courseSlug, quizzes, completedMockCount, session, inProgressMap) {
    const grid = $('quizGrid');
    grid.innerHTML = '';

    quizzes.forEach((quiz) => {
      const hasQuizId = Boolean(quiz.id);
      const isFullTest = quiz.exam_type === 'full';
      const fullTestLocked =
        isFullTest && completedMockCount < (quiz.required_completed_mocks || 0);
      const inProgressAttemptId = hasQuizId ? inProgressMap.get(quiz.id) : null;

      let actionHtml = '<button class="btn btn-disabled" disabled>Unavailable</button>';
      let note = 'This exam is not available yet.';

      if (!session) {
        actionHtml = '<a class="btn btn-secondary" href="/login.html">Login to Continue</a>';
        note = 'Login is required before you can start or resume an exam.';
      } else if (!hasQuizId) {
        actionHtml = '<button class="btn btn-disabled" disabled>Unavailable</button>';
        note = 'Quiz data could not be read from Supabase.';
      } else if (fullTestLocked) {
        actionHtml = '<button class="btn btn-disabled" disabled>Locked</button>';
        note = 'Complete all 8 mock tests to unlock this full test.';
      } else if (inProgressAttemptId) {
        actionHtml = `<a class="btn btn-primary" href="/quiz-interface.html?slug=${encodeURIComponent(courseSlug)}&quizId=${encodeURIComponent(quiz.id)}&attemptId=${encodeURIComponent(inProgressAttemptId)}">Resume Exam</a>`;
        note = 'You have an unfinished attempt for this exam.';
      } else {
        actionHtml = `<a class="btn btn-primary" href="/quiz-interface.html?slug=${encodeURIComponent(courseSlug)}&quizId=${encodeURIComponent(quiz.id)}">Start Exam</a>`;
        note = 'Ready to start.';
      }

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
            <span class="badge">${isFullTest ? 'Full Test' : 'Mock Test'}</span>
          </div>
          <div class="tiny">${note}</div>
        </div>
        <div class="quiz-action">
          ${actionHtml}
        </div>
      `;
      grid.appendChild(card);
    });
  }

  async function load() {
    const slug = getSlugFromUrl();
    if (!slug) {
      showMessage(
        'errorBox',
        'No course slug was found in the URL. Open this page using /course-detail.html?slug=your-course-slug',
        'warn'
      );
      return;
    }

    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      showMessage(
        'authInfo',
        'You are not logged in. You can still view the exam sequence, but login is required to start exams and check full-test unlock status.',
        'info'
      );
    }

    const { data: course, error: courseError } = await supabase
      .from('courses')
      .select('*')
      .eq('slug', slug)
      .single();

    if (courseError) {
      showMessage(
        'errorBox',
        `Could not load course ${slug}. Make sure the course exists and is readable for your current user.`,
        'warn'
      );
      return;
    }

    setCourseDetails(course);

    const { data: quizData, error: quizError } = await supabase
      .from('quizzes')
      .select('id,title,exam_type,exam_order,total_questions,max_marks,duration_minutes,required_completed_mocks')
      .eq('course_id', course.id)
      .order('exam_order', { ascending: true });

    if (quizError) {
      showMessage('errorBox', `quizzes SELECT failed: ${quizError.message}`, 'warn');
      return;
    }

    if (!quizData || !quizData.length) {
      showMessage('errorBox', `No quizzes found for course_id=${course.id}`, 'warn');
      return;
    }

    const quizzes = quizData;

    let completedMockCount = 0;
    let inProgressMap = new Map();

    if (session?.user?.id) {
      completedMockCount = await fetchCompletedMockCount(session.user.id, course.id);
      inProgressMap = await fetchInProgressAttemptMap(session.user.id, course.id);
    }

    renderQuizzes(course.slug, quizzes, completedMockCount, session, inProgressMap);
  }

  document.addEventListener('DOMContentLoaded', load);
})();
