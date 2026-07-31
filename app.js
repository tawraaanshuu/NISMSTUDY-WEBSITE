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
    const config = cfg();
    // The advertised price and access window override the database columns —
    // see the note in config.js. Applied here so every page picks it up
    // without each one repeating the rule.
    const price = config.priceOverrideInr ?? row.price ?? row.price_inr;
    const days = config.accessDaysOverride ?? row.mock_duration_days ?? row.access_days;
    return {
      ...row,
      exam_name: row.exam_name ?? row.title,
      description: row.description ?? row.short_description ?? row.long_description,
      price,
      mock_duration_days: days
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
    // The table carries an `is_admin` boolean; `role` is only checked so that a
    // future role column keeps working.
    if (profile?.is_admin === true) return true;
    const role = profile?.role || '';
    const adminEmails = cfg().adminEmails || [];
    return ['admin', 'super_admin'].includes(role) || adminEmails.includes(user?.email || '');
  }

  // A database trigger already creates the profile row at signup, and the RLS
  // policy only permits UPDATE on your own row — an upsert is an INSERT to
  // Postgres and comes back 403, which is what used to break login. So we only
  // ever patch, only send columns that actually exist (`phone`, not `mobile`),
  // and treat a failure here as cosmetic: nobody should be locked out of their
  // dashboard because a display name could not be saved.
  async function saveProfileFields(userId, fields) {
    const client = await createClient();
    if (!client || !userId) return null;

    const payload = {};
    if (fields.full_name) payload.full_name = String(fields.full_name).trim();
    if (fields.phone) payload.phone = String(fields.phone).trim();
    if (!Object.keys(payload).length) return null;

    const { data, error } = await client
      .from(tables().profiles)
      .update(payload)
      .eq('id', userId)
      .select()
      .maybeSingle();

    if (error) {
      console.warn('Profile not saved (non-fatal):', error.message);
      return null;
    }
    return data;
  }

  async function upsertProfileFromUser(user) {
    if (!user) return null;
    const existing = await getProfile(user.id).catch(() => null);
    // Only write when the row is actually missing something we can supply.
    if (existing?.full_name && existing.full_name !== user.email) return existing;

    return saveProfileFields(user.id, {
      full_name: user.user_metadata?.full_name || existing?.full_name || user.email,
      phone: user.user_metadata?.mobile || user.user_metadata?.phone || existing?.phone
    });
  }

  async function completePendingSignup(user) {
    if (!user) return null;

    const pending = getPendingSignup();
    if (!pending) return null;
    if ((user.email || '').toLowerCase() !== (pending.email || '').toLowerCase()) return null;

    const saved = await saveProfileFields(user.id, {
      full_name: pending.full_name,
      phone: pending.mobile
    });

    clearPendingSignup();
    return saved;
  }

  /* -------------------------------------------------------------- courses */

  // A course is only sellable once its question bank is actually filled.
  // `questions` is RLS-protected, so an anonymous visitor cannot count rows to
  // find that out — readiness therefore comes from the `is_live` column, with
  // `liveCourseSlugs` in config.js as the source of truth until that column is
  // set in the database. Selling access to an empty question bank is the one
  // failure mode worth engineering against here.
  function isCourseLive(course) {
    if (!course) return false;
    if (course.is_live === true) return true;
    const allow = cfg().liveCourseSlugs || [];
    return allow.includes(course.slug);
  }

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

  // Access used to be granted from the browser, driven by a `payment_status`
  // value in the URL. That meant anyone who typed
  // `payment-success.html?course=<id>&payment_status=success` got a free exam.
  //
  // Nothing in the browser may create an enrollment. The Razorpay webhook
  // (supabase/functions/razorpay-webhook) is the only writer, it runs with the
  // service-role key, and it refuses any request whose HMAC signature does not
  // verify. The function is kept as a loud failure rather than deleted so that
  // an old cached page cannot silently fall back to the insecure path.
  async function recordPaymentAndGrantAccess() {
    throw new Error(
      'Access is granted by the payment webhook, not by the browser. ' +
      'If you reached this, reload the page.'
    );
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

  async function startAttempt({ userId, paperId, durationMinutes }) {
    const client = await createClient();
    if (!client || !userId || !paperId) return null;

    // expires_at is NOT NULL in the database — an attempt must carry its own
    // deadline, so the server can reject a submission that arrives late.
    const startedAt = new Date();
    const minutes = Number(durationMinutes) > 0 ? Number(durationMinutes) : 180;
    const expiresAt = new Date(startedAt.getTime() + minutes * 60000);

    const { data, error } = await client.from(tables().attempts).insert({
      user_id: userId,
      quiz_id: paperId,
      started_at: startedAt.toISOString(),
      expires_at: expiresAt.toISOString(),
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
        // A resumed attempt already has rows from when it was first opened, so
        // clear them before writing the final set — otherwise the answer
        // review shows each question twice.
        await client.from(tables().answers).delete().eq('attempt_id', attemptId);
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

  // Reopen an attempt the student walked away from. Returns null unless the
  // attempt is theirs, still open, and still inside its own deadline — the
  // clock keeps running while they are away, which is what makes it a timed
  // exam rather than a save file.
  async function fetchResumableAttempt(userId, attemptId) {
    const client = await createClient();
    if (!client || !userId || !attemptId) return null;

    const { data: attempt, error } = await client
      .from(tables().attempts).select('*')
      .eq('id', attemptId).eq('user_id', userId).maybeSingle();
    if (error || !attempt) return null;
    if (attempt.status !== 'in_progress') return null;
    if (attempt.expires_at && new Date(attempt.expires_at).getTime() <= Date.now()) return null;

    const { data: answers } = await client
      .from(tables().answers).select('question_id, selected_option')
      .eq('attempt_id', attemptId);

    const selections = {};
    (answers || []).forEach((a) => { selections[a.question_id] = a.selected_option; });
    return { attempt, selections };
  }

  // Everything the dashboard needs about one course in a single round trip:
  // its papers, and the student's attempts against them.
  async function fetchCourseProgress(userId, courseId) {
    const papers = await fetchPapers(courseId);
    if (!papers.length) return { papers: [], byPaper: {}, attempted: 0, bestPct: null };

    const client = await createClient();
    const ids = papers.map(p => p.id);
    const { data: attempts } = await client
      .from(tables().attempts)
      .select('*')
      .eq('user_id', userId)
      .in('quiz_id', ids)
      .order('started_at', { ascending: false });

    const byPaper = {};
    (attempts || []).forEach((a) => {
      const paper = papers.find(p => p.id === a.quiz_id);
      const max = Number(paper?.max_marks || paper?.total_questions || 0);
      const pct = max > 0 && a.score != null ? Math.round((Number(a.score) / max) * 100) : null;
      const bucket = byPaper[a.quiz_id] || (byPaper[a.quiz_id] = {
        attempts: [], count: 0, best: null, bestPct: null, inProgress: null
      });
      bucket.attempts.push(a);
      if (a.status === 'submitted') {
        bucket.count += 1;
        if (bucket.best === null || Number(a.score) > bucket.best) {
          bucket.best = Number(a.score);
          bucket.bestPct = pct;
        }
      } else if (a.status === 'in_progress' && !bucket.inProgress) {
        // Only offer to resume an attempt whose clock has not run out.
        if (!a.expires_at || new Date(a.expires_at).getTime() > Date.now()) {
          bucket.inProgress = a;
        }
      }
    });

    const pcts = Object.values(byPaper).map(b => b.bestPct).filter(v => v != null);
    return {
      papers,
      byPaper,
      attempted: Object.values(byPaper).reduce((n, b) => n + b.count, 0),
      bestPct: pcts.length ? Math.max(...pcts) : null
    };
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
    getProfile, isAdmin, saveProfileFields, upsertProfileFromUser, completePendingSignup,
    fetchHomeSupport, fetchPublishedCourses, fetchAllCourses, fetchCourse, isCourseLive,
    fetchAccessRecords, findActiveAccess, recordPaymentAndGrantAccess,
    fetchPapers, fetchPaper, fetchQuestions, fetchQuizzes,
    startAttempt, submitAttempt, fetchAttempts, saveMockAttempt, fetchCourseProgress,
    fetchResumableAttempt,
    renderAuthSummary, setStatus, friendlyError
  };
})();
