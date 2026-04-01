(function () {
  const { createClient } = window.supabase;
  const supabase = createClient(window.SUPABASE_URL, window.SUPABASE_ANON_KEY);

  const $ = (id) => document.getElementById(id);

  function getAttemptId() {
    const url = new URL(window.location.href);
    return url.searchParams.get('attemptId');
  }

  function showError(text) {
    const box = $('messageBox');
    box.textContent = text;
    box.style.display = 'block';
  }

  async function load() {
    const attemptId = getAttemptId();
    if (!attemptId) {
      showError('Missing attemptId in the URL.');
      return;
    }

    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      window.location.href = '/login.html';
      return;
    }

    const { data: attempt, error: attemptError } = await supabase
      .from('exam_attempts')
      .select(`
        id,
        user_id,
        score,
        status,
        violation_count,
        quiz_id,
        quizzes (
          id,
          title,
          total_questions,
          max_marks,
          course_id,
          courses (
            slug,
            title
          )
        )
      `)
      .eq('id', attemptId)
      .eq('user_id', session.user.id)
      .single();

    if (attemptError || !attempt) {
      showError('Could not load this result.');
      return;
    }

    const { count: answeredCount } = await supabase
      .from('exam_answers')
      .select('*', { count: 'exact', head: true })
      .eq('attempt_id', attempt.id);

    const quiz = attempt.quizzes;
    const course = quiz?.courses;

    $('quizTitle').textContent = quiz?.title || 'Exam Result';
    $('courseTitle').textContent = course?.title || 'Course';
    $('scoreValue').textContent = String(attempt.score ?? 0);
    $('answeredValue').textContent = String(answeredCount ?? 0);
    $('statusValue').textContent = attempt.status || '—';
    $('questionCountValue').textContent = String(quiz?.total_questions ?? '—');
    $('maxMarksValue').textContent = String(quiz?.max_marks ?? '—');
    $('violationValue').textContent = String(attempt.violation_count ?? 0);

    if (course?.slug) {
      $('backToCourse').href = `/course-detail.html?slug=${encodeURIComponent(course.slug)}`;
    }
    if (course?.slug && quiz?.id) {
      $('retakeLink').href = `/quiz-interface.html?slug=${encodeURIComponent(course.slug)}&quizId=${encodeURIComponent(quiz.id)}`;
    }
  }

  document.addEventListener('DOMContentLoaded', load);
})();
