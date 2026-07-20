window.NISM_APP_CONFIG = window.NISM_APP_CONFIG || {
  supabaseUrl: '',
  supabaseAnonKey: '',
  appName: 'NISMSTUDY',
  accessDays: 15,
  defaultPriceLabel: 'Rs 329',
  adminEmails: ['info@nismstudy.in'],
  tables: {
    profiles: 'profiles',
    courses: 'courses',
    papers: 'quizzes',          // a row in `quizzes` is a mock test PAPER
    questions: 'questions',     // the actual questions, keyed by quiz_id
    enrollments: 'enrollments', // course access
    attempts: 'exam_attempts',
    answers: 'exam_answers',
    payments: 'payments'
  }
};

window.NISM_APP = (() => {
  let _client = null;

  const cfg = () => window.NISM_APP_CONFIG || {};
  const tables = () => (cfg().tables || {});

  /* ---------------------------------------------------------------- utils */

  function escapeHtml(value) {
    return String(value ?? '')
      .replaceAll('&', '&amp;')
      .replaceAll('<', '&lt;')
      .replaceAll('>', '&gt;')
      .replaceAll('"', '&quot;')
      .replaceAll("'", '&#39;');
  }

  function qs(name) {
    return new URL(window.location.href).searchParams.get(name);
  }

  function money(value) {
    if (value === null || value === undefined || value === '') return cfg().defaultPriceLabel || 'Rs 329';
    return String(value).trim().startsWith('Rs') ? String(value) : `Rs ${value}`;
  }

  function fmtDate(value) {
    if (!value) return '—';
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return value;
    return d.toLocaleString('en-IN', {
      day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
    });
  }

  function fmtShortDate(value) {
    if (!value) return '—';
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return value;
    return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  }

  function daysRemaining(value) {
    if (!value) return 0;
    return Math.max(0, Math.ceil((new Date(value).getTime() - Date.now()) / (1000 * 60 * 60 * 24)));
  }

  function fmtDuration(totalSeconds) {
    const s = Math.max(0, Math.floor(totalSeconds));
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    const sec = s % 60;
    const pad = (n) => String(n).padStart(2, '0');
    return h > 0 ? `${h}:${pad(m)}:${pad(sec)}` : `${pad(m)}:${pad(sec)}`;
  }

  /* ------------------------------------------------------------ normalise */

  // The database uses title / short_description / price_inr / access_days.
  // Pages were written against exam_name / description / price /
  // mock_duration_days, so expose both rather than editing every page.
  function normaliseCourse(row) {
    if (!row) return null;
    return {
      ...row,
      exam_name: row.exam_name ?? row.title,
      description: row.description ?? row.short_description ?? row.long_description,
      price: row.price ?? row.price_inr,
      mock_duration_days: row.mock_duration_days ?? row.access_days
    };
  }

  function normaliseEnrollment(row) {
    if (!row) return null;
    return { ...row, courses: normaliseCourse(row.courses) };
  }

  /* -------------------------------------------------------------- session */

  function getLoginPath() {
    const configured = String(cfg().loginPath || '').trim();
    if (configured) return configured;
    const path = window.location.pathname || '';
    if (/\/login(?:\.html)?$/.test(path)) return path;
    return 'login.html';
  }

  function getLoginUrl() {
    return new URL(getLoginPath(), window.location.href).href;
  }

  function getPendingSignup() {
    try { return JSON.parse(localStorage.getItem('nism_pending_signup') || 'null'); }
    catch { return null; }
  }
  function setPendingSignup(data) {
    localStorage.setItem('nism_pending_signup', JSON.stringify(data || null));
  }
  function clearPendingSignup() {
    localStorage.removeItem('nism_pending_signup');
  }

  async function createClient() {
    if (_client) return _client;
    if (!window.supabase || !window.supabase.createClient) return null;

    const config = cfg();
    if (!config.supabaseUrl || !config.supabaseAnonKey) return null;

    _client = window.supabase.createClient(config.supabaseUrl, config.supabaseAnonKey, {
      auth: { autoRefreshToken: true, persistSession: true, detectSessionInUrl: true }
    });
    return _client;
  }

  async function getSession() {
    const client = await createClient();
    if (!client) return { client: null, session: null, user: null };

    const { data } = await client.auth.getSession();
    return { client, session: data.session || null, user: data.session?.user || null };
  }

  async function requireAuth(redirectTo = null) {
    const { client, session, user } = await getSession();
    if (!client || !session || !user) {
      window.location.href = redirectTo || getLoginPath();
      return null;
    }
    return { client, session, user };
  }

  async function sendMagicLink(email, mode = 'login', signupData = null) {
    const client = await createClient();
    if (!client) throw new Error('Supabase config missing.');

    const normalizedEmail = String(email || '').trim().toLowerCase();
    if (!normalizedEmail) throw new Error('Email is required.');

    if (mode === 'signup') {
      setPendingSignup({
        email: normalizedEmail,
        full_name: String(signupData?.full_name || '').trim(),
        mobile: String(signupData?.mobile || '').trim()
      });
    } else {
      clearPendingSignup();
    }

    const { error } = await client.auth.signInWithOtp({
      email: normalizedEmail,
      options: { emailRedirectTo: getLoginUrl() }
    });
    if (error) throw error;
    return true;
  }

  // Password auth. Magic links depend on an email actually being delivered,
  // which the mail provider throttles; passwords remove that dependency.
  async function signUpWithPassword(email, password, profile = {}) {
    const client = await createClient();
    if (!client) throw new Error('Supabase config missing.');

    const normalizedEmail = String(email || '').trim().toLowerCase();
    if (!normalizedEmail) throw new Error('Email is required.');
    if (String(password || '').length < 8) throw new Error('Password must be at least 8 characters.');

    const { data, error } = await client.auth.signUp({
      email: normalizedEmail,
      password,
      options: {
        data: {
          full_name: String(profile.full_name || '').trim(),
          mobile: String(profile.mobile || '').trim()
        },
        emailRedirectTo: getLoginUrl()
      }
    });
    if (error) throw error;

    // With "Confirm email" off, Supabase returns a session immediately.
    // With it on, there is no session until the student clicks the email.
    if (data?.session && data?.user) {
      setPendingSignup({
        email: normalizedEmail,
        full_name: String(profile.full_name || '').trim(),
        mobile: String(profile.mobile || '').trim()
      });
      await completePendingSignup(data.user).catch(() => {});
      return { user: data.user, session: data.session, needsConfirmation: false };
    }
    return { user: data?.user || null, session: null, needsConfirmation: true };
  }

  async function signInWithPassword(email, password) {
    const client = await createClient();
    if (!client) throw new Error('Supabase config missing.');

    const { data, error } = await client.auth.signInWithPassword({
      email: String(email || '').trim().toLowerCase(),
      password
    });
    if (error) throw error;

    if (data?.user) await upsertProfileFromUser(data.user).catch(() => {});
    return data?.user || null;
  }

  async function sendPasswordReset(email) {
    const client = await createClient();
    if (!client) throw new Error('Supabase config missing.');
    const { error } = await client.auth.resetPasswordForEmail(
      String(email || '').trim().toLowerCase(),
      { redirectTo: getLoginUrl() }
    );
    if (error) throw error;
    return true;
  }

  async function signOutUser() {
    const client = await createClient();
    if (client) await client.auth.signOut();
    clearPendingSignup();
    window.location.href = getLoginPath();
  }

  /* -------------------------------------------------------------- profile */

  async function getProfile(userId) {
    const client = await createClient();
    if (!client || !userId) return null;
    const { data } = await client.from(tables().profiles).select('*').eq('id', userId).maybeSingle();
    return data || null;
  }

  function isAdmin(user, profile) {
    const role = profile?.role || '';
    const adminEmails = cfg().adminEmails || [];
    return ['admin', 'super_admin'].includes(role) || adminEmails.includes(user?.email || '');
  }

  async function upsertProfileFromUser(user) {
    const client = await createClient();
    if (!client || !user) return;

    const existing = await getProfile(user.id);
    const payload = {
      id: user.id,
      email: user.email,
      full_name: existing?.full_name || user.user_metadata?.full_name || user.email
    };
    // Only send optional columns when we actually have a value, so a missing
    // column in the table cannot break signup.
    const mobile = existing?.mobile || user.user_metadata?.mobile;
    if (mobile) payload.mobile = mobile;

    const { error } = await client.from(tables().profiles).upsert(payload);
    if (error) throw error;
  }

  async function completePendingSignup(user) {
    const client = await createClient();
    if (!client || !user) return null;

    const pending = getPendingSignup();
    if (!pending) return null;
    if ((user.email || '').toLowerCase() !== (pending.email || '').toLowerCase()) return null;

    const existing = await getProfile(user.id);
    const payload = {
      id: user.id,
      email: user.email,
      full_name: pending.full_name || existing?.full_name || user.email
    };
    if (pending.mobile || existing?.mobile) payload.mobile = pending.mobile || existing.mobile;

    const { error } = await client.from(tables().profiles).upsert(payload);
    if (error) throw error;

    clearPendingSignup();
    return payload;
  }

  /* -------------------------------------------------------------- courses */

  async function fetchPublishedCourses() {
    const client = await createClient();
    if (!client) throw new Error('Supabase config missing.');

    const { data, error } = await client
      .from(tables().courses)
      .select('*')
      .eq('is_published', true)
      .order('title', { ascending: true });

    if (error) throw error;
    return (data || []).map(normaliseCourse);
  }

  async function fetchAllCourses() {
    const client = await createClient();
    if (!client) throw new Error('Supabase config missing.');
    const { data, error } = await client.from(tables().courses).select('*').order('title');
    if (error) throw error;
    return (data || []).map(normaliseCourse);
  }

  async function fetchCourse(courseId) {
    const client = await createClient();
    if (!client || !courseId) return null;
    const { data, error } = await client.from(tables().courses).select('*').eq('id', courseId).maybeSingle();
    if (error) throw error;
    return normaliseCourse(data);
  }

  /* --------------------------------------------------------------- access */

  async function fetchAccessRecords(userId) {
    const client = await createClient();
    if (!client || !userId) return [];

    const { data, error } = await client
      .from(tables().enrollments)
      .select('*, courses(*)')
      .eq('user_id', userId)
      .order('access_until', { ascending: false });

    if (error) throw error;
    return (data || []).map(normaliseEnrollment);
  }

  function findActiveAccess(recordsList, courseId) {
    const now = Date.now();
    return (recordsList || []).find(item =>
      item.course_id === courseId && new Date(item.access_until).getTime() > now
    ) || null;
  }

  async function recordPaymentAndGrantAccess({ user, course, paymentRef, rawPayload }) {
    const client = await createClient();
    if (!client) throw new Error('Supabase config missing.');
    if (!user || !course) throw new Error('Missing user or course.');

    const days = Number(course.mock_duration_days || cfg().accessDays || 15);
    const now = new Date();
    const accessUntil = new Date(now.getTime() + days * 24 * 60 * 60 * 1000).toISOString();
    const ref = paymentRef || `manual-${Date.now()}`;

    const { error: paymentError } = await client.from(tables().payments).insert({
      user_id: user.id,
      course_id: course.id,
      amount_inr: Number(course.price_inr ?? course.price ?? 329),
      status: 'paid',
      order_id: ref,
      provider: 'web',
      raw_payload: rawPayload || {}
    });
    // A duplicate callback must not stop access being granted.
    if (paymentError && !String(paymentError.message || '').toLowerCase().includes('duplicate')) {
      throw paymentError;
    }

    // enrollments has no onConflict target we can rely on, so read-then-write.
    const { data: existing } = await client
      .from(tables().enrollments)
      .select('id')
      .eq('user_id', user.id)
      .eq('course_id', course.id)
      .maybeSingle();

    if (existing?.id) {
      const { error } = await client.from(tables().enrollments)
        .update({ access_until: accessUntil }).eq('id', existing.id);
      if (error) throw error;
    } else {
      const { error } = await client.from(tables().enrollments)
        .insert({ user_id: user.id, course_id: course.id, access_until: accessUntil });
      if (error) throw error;
    }

    return { user_id: user.id, course_id: course.id, access_until: accessUntil, payment_ref: ref };
  }

  /* ------------------------------------------------- papers and questions */

  // A "paper" is a row in `quizzes` — one mock test with its own timer,
  // marking scheme and question set.
  async function fetchPapers(courseId) {
    const client = await createClient();
    if (!client || !courseId) return [];

    const { data, error } = await client
      .from(tables().papers)
      .select('*')
      .eq('course_id', courseId)
      .eq('is_active', true)
      .order('exam_order', { ascending: true });

    if (error) throw error;
    return data || [];
  }

  async function fetchPaper(paperId) {
    const client = await createClient();
    if (!client || !paperId) return null;
    const { data, error } = await client.from(tables().papers).select('*, courses(*)').eq('id', paperId).maybeSingle();
    if (error) throw error;
    if (data && data.courses) data.courses = normaliseCourse(data.courses);
    return data || null;
  }

  async function fetchQuestions(paperId) {
    const client = await createClient();
    if (!client || !paperId) return [];

    const { data, error } = await client
      .from(tables().questions)
      .select('*')
      .eq('quiz_id', paperId)
      .order('id', { ascending: true });

    if (error) throw error;
    return data || [];
  }

  // Kept so older callers still work: returns the questions of a course's
  // first paper rather than throwing.
  async function fetchQuizzes(courseId) {
    const papers = await fetchPapers(courseId);
    if (!papers.length) return [];
    return fetchQuestions(papers[0].id);
  }

  /* -------------------------------------------------------------- attempts */

  async function startAttempt({ userId, paperId }) {
    const client = await createClient();
    if (!client || !userId || !paperId) return null;

    const { data, error } = await client.from(tables().attempts).insert({
      user_id: userId,
      quiz_id: paperId,
      started_at: new Date().toISOString(),
      status: 'in_progress'
    }).select('id').maybeSingle();

    if (error) throw error;
    return data?.id || null;
  }

  // Marks a paper using its own scheme, saves the attempt and the per-question
  // answers, and returns the breakdown for the results screen.
  async function submitAttempt({ attemptId, paper, questions, selections }) {
    const client = await createClient();
    if (!client) throw new Error('Supabase config missing.');

    const perCorrect = Number(paper?.marks_per_question ?? 1) || 1;
    const perWrong = Number(paper?.negative_marks_per_wrong ?? 0) || 0;

    let correct = 0, wrong = 0, skipped = 0;
    const answerRows = [];

    (questions || []).forEach((q) => {
      const chosen = selections?.[q.id] || '';
      if (!chosen) {
        skipped += 1;
      } else if (String(chosen).toUpperCase() === String(q.correct_option || '').toUpperCase()) {
        correct += 1;
      } else {
        wrong += 1;
      }
      if (attemptId && chosen) {
        answerRows.push({ attempt_id: attemptId, question_id: q.id, selected_option: chosen });
      }
    });

    const score = Math.max(0, (correct * perCorrect) - (wrong * perWrong));
    const maxMarks = Number(paper?.max_marks ?? (questions || []).length * perCorrect) || (questions || []).length;
    const percentage = maxMarks > 0 ? Math.round((score / maxMarks) * 100) : 0;

    if (attemptId) {
      if (answerRows.length) {
        const { error: ansError } = await client.from(tables().answers).insert(answerRows);
        if (ansError) console.error('Could not save individual answers:', ansError);
      }
      const { error } = await client.from(tables().attempts).update({
        score, submitted_at: new Date().toISOString(), status: 'submitted'
      }).eq('id', attemptId);
      if (error) throw error;
    }

    return { score, maxMarks, percentage, correct, wrong, skipped, total: (questions || []).length };
  }

  async function fetchAttempts(userId, paperId = null) {
    const client = await createClient();
    if (!client || !userId) return [];

    let query = client.from(tables().attempts).select('*').eq('user_id', userId)
      .order('started_at', { ascending: false });
    if (paperId) query = query.eq('quiz_id', paperId);

    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  }

  // Legacy shim for any page still calling the old name.
  async function saveMockAttempt({ userId, courseId, score, totalQuestions }) {
    const papers = await fetchPapers(courseId);
    if (!papers.length) return;
    const attemptId = await startAttempt({ userId, paperId: papers[0].id });
    const client = await createClient();
    if (client && attemptId) {
      await client.from(tables().attempts).update({
        score, submitted_at: new Date().toISOString(), status: 'submitted'
      }).eq('id', attemptId);
    }
  }

  /* ------------------------------------------------------------------- ui */

  function renderAuthSummary(target, user, profile) {
    if (!target) return;
    const role = profile?.role && profile.role !== 'student'
      ? `<span class="pill info">${escapeHtml(profile.role)}</span>` : '';
    target.innerHTML = `
      <div class="badge-row">
        <span class="pill info">Logged in as ${escapeHtml(user?.email || '')}</span>
        ${role}
      </div>`;
  }

  function setStatus(target, message, type = 'info') {
    if (!target) return;
    target.className = `notice ${type}`;
    target.innerHTML = message;
  }

  function friendlyError(error, fallback = 'Something went wrong. Please try again.') {
    const msg = String(error?.message || error || '');
    const code = String(error?.code || error?.status || '');

    if (/failed to fetch|networkerror|name_not_resolved|load failed/i.test(msg)) {
      return 'Our servers are temporarily unavailable for maintenance. Please try again shortly, or email <a href="mailto:info@nismstudy.in">info@nismstudy.in</a> for help.';
    }
    // The mail provider throttles login emails; without this the student just
    // sees a generic failure and retries, which makes the throttling worse.
    if (/rate limit|too many requests/i.test(msg) || code === '429') {
      return 'Too many login emails have been requested just now. Please wait a few minutes and try again, or email <a href="mailto:info@nismstudy.in">info@nismstudy.in</a> and we will help you in.';
    }
    if (/redirect|not allowed/i.test(msg)) {
      return 'This login link could not be completed. Please email <a href="mailto:info@nismstudy.in">info@nismstudy.in</a> and we will sort it out.';
    }
    return fallback;
  }

  async function fetchHomeSupport() {
    return null; // no such table in this database
  }

  return {
    cfg, tables, qs, money, fmtDate, fmtShortDate, daysRemaining, fmtDuration, escapeHtml,
    getLoginPath, getLoginUrl,
    getPendingSignup, setPendingSignup, clearPendingSignup,
    createClient, getSession, requireAuth, sendMagicLink, signOutUser,
    signUpWithPassword, signInWithPassword, sendPasswordReset,
    getProfile, isAdmin, upsertProfileFromUser, completePendingSignup,
    fetchHomeSupport, fetchPublishedCourses, fetchAllCourses, fetchCourse,
    fetchAccessRecords, findActiveAccess, recordPaymentAndGrantAccess,
    fetchPapers, fetchPaper, fetchQuestions, fetchQuizzes,
    startAttempt, submitAttempt, fetchAttempts, saveMockAttempt,
    renderAuthSummary, setStatus, friendlyError
  };
})();
