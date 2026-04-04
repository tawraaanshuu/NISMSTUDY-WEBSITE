(function () {
  const { createClient } = window.supabase;
  const supabase = createClient(window.SUPABASE_URL, window.SUPABASE_ANON_KEY);

  const $ = (id) => document.getElementById(id);
  const state = {
    session: null,
    course: null,
    quiz: null,
    attempt: null,
    questions: [],
    answers: new Map(),
    currentIndex: 0,
    timerId: null,
    localViolationCount: 0,
    isSubmitting: false
  };

  function getParams() {
    const url = new URL(window.location.href);
    return {
      slug: url.searchParams.get('slug'),
      courseId: url.searchParams.get('courseId'),
      quizId: url.searchParams.get('quizId'),
      attemptId: url.searchParams.get('attemptId')
    };
  }

  function setMessage(text, type = 'info') {
    const box = $('messageBox');
    box.textContent = text;
    box.className = `message ${type}`;
    box.classList.remove('hidden');
  }

  function clearMessage() {
    $('messageBox').classList.add('hidden');
  }

  function formatDuration(seconds) {
    const s = Math.max(0, seconds);
    const hrs = String(Math.floor(s / 3600)).padStart(2, '0');
    const mins = String(Math.floor((s % 3600) / 60)).padStart(2, '0');
    const secs = String(s % 60).padStart(2, '0');
    return `${hrs}:${mins}:${secs}`;
  }

  function updateTimerUi(seconds) {
    const timer = $('timer');
    timer.textContent = formatDuration(seconds);
    timer.classList.remove('warn', 'danger');
    if (seconds <= 300) {
      timer.classList.add('danger');
    } else if (seconds <= 900) {
      timer.classList.add('warn');
    }
  }

  function getRemainingSeconds() {
    const now = Date.now();
    const end = new Date(state.attempt.expires_at).getTime();
    return Math.max(0, Math.floor((end - now) / 1000));
  }

  function updateBackLink() {
    if (state.course?.id) {
      $('backToCourse').href = `/mock-tests.html?course=${encodeURIComponent(state.course.id)}`;
      return;
    }
    if (state.course?.slug) {
      $('backToCourse').href = `/courses.html?slug=${encodeURIComponent(state.course.slug)}`;
    }
  }

  function updateStats() {
    $('answeredCount').textContent = String(state.answers.size);
    $('violationCount').textContent = String(state.localViolationCount);
  }

  function renderNavigator() {
    const nav = $('questionNav');
    nav.innerHTML = '';

    state.questions.forEach((question, index) => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'nav-btn';
      if (state.answers.has(question.id)) btn.classList.add('answered');
      if (index === state.currentIndex) btn.classList.add('current');
      btn.textContent = String(index + 1);
      btn.addEventListener('click', () => {
        state.currentIndex = index;
        renderQuestion();
      });
      nav.appendChild(btn);
    });
  }

  function renderQuestion() {
    if (!state.questions.length) return;

    const question = state.questions[state.currentIndex];
    $('questionProgress').textContent = `Question ${state.currentIndex + 1} of ${state.questions.length}`;
    $('questionText').textContent = question.question_text;

    const optionsWrap = $('options');
    optionsWrap.innerHTML = '';

    const options = [
      { key: 'A', text: question.option_a },
      { key: 'B', text: question.option_b },
      { key: 'C', text: question.option_c },
      { key: 'D', text: question.option_d }
    ];

    options.forEach((option) => {
      const label = document.createElement('label');
      label.className = 'option';
      if (state.answers.get(question.id) === option.key) {
        label.classList.add('selected');
      }

      label.innerHTML = `
        <input type="radio" name="answer" value="${option.key}" ${state.answers.get(question.id) === option.key ? 'checked' : ''} />
        <div class="option-letter">${option.key}.</div>
        <div>${option.text}</div>
      `;

      label.addEventListener('click', async () => {
        await saveAnswer(question.id, option.key);
      });

      optionsWrap.appendChild(label);
    });

    $('prevBtn').disabled = state.currentIndex === 0;
    $('nextBtn').disabled = state.currentIndex === state.questions.length - 1;
    renderNavigator();
    updateStats();
  }

  async function ensureLogin() {
    const { data: { session } } = await supabase.auth.getSession();
    state.session = session;
    if (!session) {
      window.location.href = '/login';
      throw new Error('Login required');
    }
  }

  async function loadCourseAndQuiz(params) {
    let courseQuery = supabase
      .from('courses')
      .select('*');

    if (params.slug) {
      courseQuery = courseQuery.eq('slug', params.slug);
    } else if (params.courseId) {
      courseQuery = courseQuery.eq('id', params.courseId);
    } else {
      throw new Error('Missing course reference in the URL.');
    }

    const { data: course, error: courseError } = await courseQuery.single();

    if (courseError || !course) {
      throw new Error('Could not load the selected course.');
    }
    state.course = course;
    updateBackLink();

    const { data: quiz, error: quizError } = await supabase
      .from('quizzes')
      .select('*')
      .eq('id', params.quizId)
      .eq('course_id', course.id)
      .single();

    if (quizError || !quiz) {
      throw new Error('Could not load the selected exam.');
    }
    state.quiz = quiz;

    $('quizTitle').textContent = quiz.title;
    $('courseTitle').textContent = course.title;
    $('metaQuestions').textContent = `${quiz.total_questions} questions`;
    $('metaMarks').textContent = `${quiz.max_marks} marks`;
    $('metaDuration').textContent = `${quiz.duration_minutes} mins`;
    $('metaType').textContent = quiz.exam_type === 'full' ? 'Full Test' : 'Mock Test';
  }

  async function enforceFullTestUnlock() {
    if (state.quiz.exam_type !== 'full') return;

    const { data, error } = await supabase
      .from('exam_attempts')
      .select('quiz_id,status, quizzes!inner(course_id, exam_type)')
      .eq('user_id', state.session.user.id)
      .eq('quizzes.course_id', state.course.id)
      .eq('quizzes.exam_type', 'mock')
      .in('status', ['submitted', 'auto_submitted']);

    if (error) {
      throw new Error('Could not verify full-test unlock status.');
    }

    const completedMockCount = new Set((data || []).map((row) => row.quiz_id)).size;
    if (completedMockCount < (state.quiz.required_completed_mocks || 0)) {
      throw new Error('Complete all 8 mock tests first to unlock this full test.');
    }
  }

  async function loadOrCreateAttempt(params) {
    if (params.attemptId) {
      const { data, error } = await supabase
        .from('exam_attempts')
        .select('*')
        .eq('id', params.attemptId)
        .eq('user_id', state.session.user.id)
        .single();

      if (!error && data) {
        state.attempt = data;
        state.localViolationCount = data.violation_count || 0;
        return;
      }
    }

    const { data: existing, error: existingError } = await supabase
      .from('exam_attempts')
      .select('*')
      .eq('user_id', state.session.user.id)
      .eq('quiz_id', state.quiz.id)
      .eq('status', 'in_progress')
      .is('submitted_at', null)
      .limit(1);

    if (existingError) {
      throw new Error(existingError.message || 'Could not check existing attempts.');
    }

    if (existing && existing.length) {
      state.attempt = existing[0];
      state.localViolationCount = state.attempt.violation_count || 0;
      return;
    }

    const now = new Date();
    const expiresAt = new Date(now.getTime() + state.quiz.duration_minutes * 60 * 1000);

    const { data: inserted, error: insertError } = await supabase
      .from('exam_attempts')
      .insert({
        user_id: state.session.user.id,
        quiz_id: state.quiz.id,
        started_at: now.toISOString(),
        expires_at: expiresAt.toISOString(),
        status: 'in_progress',
        violation_count: 0
      })
      .select()
      .single();

    if (insertError) {
      throw new Error(insertError.message || 'Could not create exam attempt.');
    }

    state.attempt = inserted;
    state.localViolationCount = 0;
  }

  async function loadQuestionsAndAnswers() {
    const { data: questions, error: questionError } = await supabase
      .from('questions')
      .select('*')
      .eq('quiz_id', state.quiz.id)
      .order('question_no', { ascending: true });

    if (questionError || !questions || !questions.length) {
      throw new Error('Could not load questions for this exam.');
    }

    state.questions = questions;

    const { data: answers, error: answerError } = await supabase
      .from('exam_answers')
      .select('question_id, selected_option')
      .eq('attempt_id', state.attempt.id);

    if (answerError) {
      throw new Error('Could not load saved answers.');
    }

    state.answers = new Map((answers || []).map((row) => [row.question_id, row.selected_option]));
  }

  async function saveAnswer(questionId, selectedOption) {
    const question = state.questions.find((row) => row.id === questionId);
    if (!question || state.isSubmitting) return;

    $('autosaveStatus').textContent = 'Saving answer…';
    clearMessage();

    const { error } = await supabase
      .from('exam_answers')
      .upsert({
        attempt_id: state.attempt.id,
        question_id: questionId,
        selected_option: selectedOption,
        answered_at: new Date().toISOString()
      }, { onConflict: 'attempt_id,question_id' });

    if (error) {
      $('autosaveStatus').textContent = 'Autosave failed';
      setMessage(error.message || 'Could not save your answer.', 'error');
      return;
    }

    state.answers.set(questionId, selectedOption);
    $('autosaveStatus').textContent = 'Answer saved';
    renderQuestion();
  }

  async function logViolation(type) {
    if (!state.attempt || state.isSubmitting) return;

    state.localViolationCount += 1;
    updateStats();

    await supabase.from('exam_violations').insert({
      attempt_id: state.attempt.id,
      violation_type: type,
      details: {},
      event_at: new Date().toISOString()
    });

    await supabase
      .from('exam_attempts')
      .update({ violation_count: state.localViolationCount })
      .eq('id', state.attempt.id);

    if (state.localViolationCount >= 5) {
      setMessage('You switched away from the exam 5 times. The exam is being auto-submitted.', 'warn');
      await submitExam(true);
      return;
    }

    const remaining = 5 - state.localViolationCount;
    setMessage(`Warning: you switched away from the exam. ${remaining} warning${remaining === 1 ? '' : 's'} left before auto-submit.`, 'warn');
  }

  async function submitExam(autoSubmitted) {
    if (state.isSubmitting) return;
    state.isSubmitting = true;
    $('submitBtn').disabled = true;
    $('autosaveStatus').textContent = autoSubmitted ? 'Auto-submitting…' : 'Submitting…';

    const { data: questions, error: qError } = await supabase
      .from('questions')
      .select('id, correct_option')
      .eq('quiz_id', state.quiz.id);

    if (qError) {
      state.isSubmitting = false;
      $('submitBtn').disabled = false;
      setMessage('Could not calculate score.', 'error');
      return;
    }

    const { data: answers, error: aError } = await supabase
      .from('exam_answers')
      .select('question_id, selected_option')
      .eq('attempt_id', state.attempt.id);

    if (aError) {
      state.isSubmitting = false;
      $('submitBtn').disabled = false;
      setMessage('Could not read saved answers.', 'error');
      return;
    }

    const answerMap = new Map((answers || []).map((row) => [row.question_id, row.selected_option]));
    const marksPerQuestion = Number(state.quiz.marks_per_question || 1);
    let score = 0;

    (questions || []).forEach((question) => {
      if (answerMap.get(question.id) === question.correct_option) {
        score += marksPerQuestion;
      }
    });

    const { error: updateError } = await supabase
      .from('exam_attempts')
      .update({
        status: autoSubmitted ? 'auto_submitted' : 'submitted',
        submitted_at: new Date().toISOString(),
        score
      })
      .eq('id', state.attempt.id);

    if (updateError) {
      state.isSubmitting = false;
      $('submitBtn').disabled = false;
      setMessage(updateError.message || 'Could not finish submit.', 'error');
      return;
    }

    window.location.href = `/quiz-result.html?attemptId=${encodeURIComponent(state.attempt.id)}`;
  }

  function startTimer() {
    updateTimerUi(getRemainingSeconds());
    state.timerId = window.setInterval(async () => {
      const remaining = getRemainingSeconds();
      updateTimerUi(remaining);
      if (remaining <= 0) {
        window.clearInterval(state.timerId);
        setMessage('Time is over. The exam is being auto-submitted.', 'warn');
        await submitExam(true);
      }
    }, 1000);
  }

  function attachEvents() {
    $('prevBtn').addEventListener('click', () => {
      state.currentIndex = Math.max(0, state.currentIndex - 1);
      renderQuestion();
    });

    $('nextBtn').addEventListener('click', () => {
      state.currentIndex = Math.min(state.questions.length - 1, state.currentIndex + 1);
      renderQuestion();
    });

    $('submitBtn').addEventListener('click', async () => {
      const ok = window.confirm('Are you sure you want to submit this exam?');
      if (!ok) return;
      await submitExam(false);
    });

    document.addEventListener('visibilitychange', async () => {
      if (document.hidden) {
        await logViolation('tab_switch');
      }
    });

    window.addEventListener('beforeunload', (event) => {
      if (state.attempt && !state.isSubmitting) {
        event.preventDefault();
        event.returnValue = '';
      }
    });
  }

  async function init() {
    try {
      const params = getParams();
      if ((!params.slug && !params.courseId) || !params.quizId) {
        throw new Error('Missing course reference or quizId in the URL.');
      }

      await ensureLogin();
      await loadCourseAndQuiz(params);
      await enforceFullTestUnlock();
      await loadOrCreateAttempt(params);
      await loadQuestionsAndAnswers();
      attachEvents();
      startTimer();
      clearMessage();
      renderQuestion();
      updateStats();
    } catch (error) {
      console.error(error);
      setMessage(error.message || 'Could not open the exam page.', 'error');
      $('questionText').textContent = 'Exam could not be loaded.';
      $('options').innerHTML = '';
      $('prevBtn').disabled = true;
      $('nextBtn').disabled = true;
      $('submitBtn').disabled = true;
    }
  }

  document.addEventListener('DOMContentLoaded', init);
})();
