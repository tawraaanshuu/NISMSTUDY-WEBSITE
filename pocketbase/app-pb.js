/* ==========================================================================
   NISMSTUDY — PocketBase backend adapter
   Drop-in replacement for the Supabase app.js. Exposes the SAME window.NISM_APP
   surface, so index / courses / dashboard / mock-center / mock-tests /
   checkout / payment-success need no changes.

   Two deliberate differences from the Supabase version:
     - No SDK. Plain fetch against the PocketBase REST API, so there is no CDN
       script to trust and nothing to keep in version sync.
     - Login is an emailed one-time CODE, not a magic link (PocketBase has no
       magic-link flow). sendMagicLink() sends the code; verifyOtp() completes
       the login. login.html handles the extra step.
   ========================================================================== */

window.NISM_APP_CONFIG = window.NISM_APP_CONFIG || {
  pocketbaseUrl: '',
  appName: 'NISMSTUDY',
  accessDays: 15,
  defaultPriceLabel: 'Rs 329',
  adminEmails: ['info@nismstudy.in'],
  collections: {
    users: 'users',
    courses: 'courses',
    quizzes: 'quizzes',
    examAccess: 'exam_access',
    paymentRecords: 'payment_records',
    mockAttempts: 'mock_attempts',
    homeSupport: 'home_support_content'
  }
};

window.NISM_APP = (() => {
  const AUTH_KEY = 'nism_pb_auth';
  const OTP_KEY = 'nism_pb_otp';

  const cfg = () => window.NISM_APP_CONFIG || {};
  const collections = () => (cfg().collections || {});
  const baseUrl = () => String(cfg().pocketbaseUrl || '').replace(/\/+$/, '');

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

  // PocketBase returns "2026-08-20 00:00:00.000Z" — the space is not valid ISO
  // and Date parsing of it is not portable, so normalise before constructing.
  function toDate(value) {
    if (!value) return null;
    const d = new Date(String(value).trim().replace(' ', 'T'));
    return Number.isNaN(d.getTime()) ? null : d;
  }

  function fmtDate(value) {
    const d = toDate(value);
    if (!d) return value || '—';
    return d.toLocaleString('en-IN', {
      day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
    });
  }

  function fmtShortDate(value) {
    const d = toDate(value);
    if (!d) return value || '—';
    return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  }

  function daysRemaining(value) {
    const d = toDate(value);
    if (!d) return 0;
    return Math.max(0, Math.ceil((d.getTime() - Date.now()) / (1000 * 60 * 60 * 24)));
  }

  // PocketBase filter values must be quoted and escaped.
  const lit = (v) => `"${String(v).replaceAll('"', '\\"')}"`;
  const pbNow = () => new Date().toISOString().replace('T', ' ').replace('Z', 'Z');

  /* ----------------------------------------------------------- auth state */

  function readAuth() {
    try {
      return JSON.parse(localStorage.getItem(AUTH_KEY) || 'null');
    } catch {
      return null;
    }
  }

  function writeAuth(data) {
    if (!data) localStorage.removeItem(AUTH_KEY);
    else localStorage.setItem(AUTH_KEY, JSON.stringify(data));
  }

  function getPendingSignup() {
    try {
      return JSON.parse(localStorage.getItem('nism_pending_signup') || 'null');
    } catch {
      return null;
    }
  }
  function setPendingSignup(data) {
    localStorage.setItem('nism_pending_signup', JSON.stringify(data || null));
  }
  function clearPendingSignup() {
    localStorage.removeItem('nism_pending_signup');
  }

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

  /* ------------------------------------------------------------ transport */

  async function api(path, { method = 'GET', body = null, auth = true } = {}) {
    if (!baseUrl()) throw new Error('PocketBase URL is not configured.');

    const headers = { 'Content-Type': 'application/json' };
    const session = readAuth();
    if (auth && session?.token) headers.Authorization = session.token;

    const res = await fetch(`${baseUrl()}${path}`, {
      method,
      headers,
      body: body === null ? undefined : JSON.stringify(body)
    });

    const text = await res.text();
    const data = text ? JSON.parse(text) : {};

    if (!res.ok) {
      // An expired/invalid token should log the student out rather than loop.
      if (res.status === 401 && auth) writeAuth(null);
      const err = new Error(data.message || `Request failed (${res.status})`);
      err.status = res.status;
      err.data = data.data || {};
      throw err;
    }
    return data;
  }

  function listQuery({ filter, sort, expand, perPage = 200 } = {}) {
    const p = new URLSearchParams();
    if (filter) p.set('filter', filter);
    if (sort) p.set('sort', sort);
    if (expand) p.set('expand', expand);
    p.set('perPage', String(perPage));
    return `?${p.toString()}`;
  }

  const records = (name) => `/api/collections/${name}/records`;

  /* ---------------------------------------------------------------- shape */

  // Pages written against Supabase expect `course_id` and an embedded `courses`
  // object. PocketBase gives `course` + `expand.course`. Normalise so no page
  // has to know which backend it is talking to.
  function normaliseAccess(rec) {
    const course = rec.expand?.course || null;
    return { ...rec, course_id: rec.course, courses: course };
  }

  /* ----------------------------------------------------------------- auth */

  async function createClient() {
    return baseUrl() ? { baseUrl: baseUrl() } : null;
  }

  async function getSession() {
    const client = await createClient();
    if (!client) return { client: null, session: null, user: null };

    const session = readAuth();
    if (!session?.token) return { client, session: null, user: null };

    // Confirm the stored token is still valid, and refresh the cached user.
    try {
      const res = await api('/api/collections/' + collections().users + '/auth-refresh', { method: 'POST' });
      const next = { token: res.token, user: res.record };
      writeAuth(next);
      return { client, session: next, user: res.record };
    } catch (error) {
      if (error.status === 401 || error.status === 404) {
        writeAuth(null);
        return { client, session: null, user: null };
      }
      // Network/server trouble: fall back to the cached identity rather than
      // bouncing a logged-in student to the login page.
      return { client, session, user: session.user || null };
    }
  }

  async function requireAuth(redirectTo = null) {
    const { client, session, user } = await getSession();
    if (!client || !session || !user) {
      window.location.href = redirectTo || getLoginPath();
      return null;
    }
    return { client, session, user };
  }

  // Sends the one-time login code. For signup the account is created first,
  // because PocketBase will not issue a code for an unknown address.
  async function sendMagicLink(email, mode = 'login', signupData = null) {
    if (!baseUrl()) throw new Error('PocketBase URL is not configured.');

    const normalizedEmail = String(email || '').trim().toLowerCase();
    if (!normalizedEmail) throw new Error('Email is required.');

    if (mode === 'signup') {
      setPendingSignup({
        email: normalizedEmail,
        full_name: String(signupData?.full_name || '').trim(),
        mobile: String(signupData?.mobile || '').trim()
      });

      // Random password: the student never uses it, login is code-based.
      const filler = crypto.randomUUID() + crypto.randomUUID();
      try {
        await api(records(collections().users), {
          method: 'POST',
          auth: false,
          body: {
            email: normalizedEmail,
            password: filler,
            passwordConfirm: filler,
            full_name: String(signupData?.full_name || '').trim(),
            mobile: String(signupData?.mobile || '').trim(),
            role: 'student'
          }
        });
      } catch (error) {
        // Already registered is fine — fall through and just send them a code.
        const alreadyExists = error.status === 400 && JSON.stringify(error.data || {}).includes('email');
        if (!alreadyExists) throw error;
      }
    } else {
      clearPendingSignup();
    }

    const res = await api('/api/collections/' + collections().users + '/request-otp', {
      method: 'POST',
      auth: false,
      body: { email: normalizedEmail }
    });

    localStorage.setItem(OTP_KEY, JSON.stringify({ otpId: res.otpId, email: normalizedEmail }));
    return true;
  }

  function hasPendingOtp() {
    try {
      return Boolean(JSON.parse(localStorage.getItem(OTP_KEY) || 'null')?.otpId);
    } catch {
      return false;
    }
  }

  // Completes login with the emailed code.
  async function verifyOtp(code) {
    let pending = null;
    try {
      pending = JSON.parse(localStorage.getItem(OTP_KEY) || 'null');
    } catch {
      pending = null;
    }
    if (!pending?.otpId) throw new Error('Request a new login code first.');

    const res = await api('/api/collections/' + collections().users + '/auth-with-otp', {
      method: 'POST',
      auth: false,
      body: { otpId: pending.otpId, password: String(code || '').trim() }
    });

    writeAuth({ token: res.token, user: res.record });
    localStorage.removeItem(OTP_KEY);
    return res.record;
  }

  async function signOutUser() {
    writeAuth(null);
    localStorage.removeItem(OTP_KEY);
    clearPendingSignup();
    window.location.href = getLoginPath();
  }

  /* -------------------------------------------------------------- profile */

  async function getProfile(userId) {
    if (!userId) return null;
    try {
      return await api(`${records(collections().users)}/${userId}`);
    } catch {
      return null;
    }
  }

  function isAdmin(user, profile) {
    const role = profile?.role || user?.role || '';
    const adminEmails = cfg().adminEmails || [];
    return ['admin', 'super_admin'].includes(role) || adminEmails.includes(user?.email || '');
  }

  // The account already exists by this point; keep name/mobile in step.
  async function upsertProfileFromUser(user) {
    if (!user?.id) return;
    const pending = getPendingSignup();
    const patch = {};
    if (pending?.full_name && !user.full_name) patch.full_name = pending.full_name;
    if (pending?.mobile && !user.mobile) patch.mobile = pending.mobile;
    if (!Object.keys(patch).length) return;

    try {
      await api(`${records(collections().users)}/${user.id}`, { method: 'PATCH', body: patch });
    } catch {
      /* non-fatal: the profile simply keeps its current values */
    }
  }

  async function completePendingSignup(user) {
    const pending = getPendingSignup();
    if (!pending || !user) return null;
    if ((user.email || '').toLowerCase() !== (pending.email || '').toLowerCase()) return null;

    await upsertProfileFromUser(user);
    clearPendingSignup();
    return pending;
  }

  /* -------------------------------------------------------------- content */

  async function fetchHomeSupport() {
    const res = await api(records(collections().homeSupport) +
      listQuery({ filter: 'is_active = true', sort: '-updated', perPage: 1 }), { auth: false });
    return res.items?.[0] || null;
  }

  async function fetchPublishedCourses() {
    const res = await api(records(collections().courses) +
      listQuery({ filter: 'is_published = true', sort: 'display_order,-created' }), { auth: false });
    return res.items || [];
  }

  async function fetchAllCourses() {
    const res = await api(records(collections().courses) + listQuery({ sort: 'display_order,-created' }));
    return res.items || [];
  }

  async function fetchCourse(courseId) {
    if (!courseId) return null;
    try {
      return await api(`${records(collections().courses)}/${courseId}`, { auth: false });
    } catch {
      return null;
    }
  }

  async function fetchQuizzes(courseId) {
    if (!courseId) return [];
    const res = await api(records(collections().quizzes) + listQuery({
      filter: `course = ${lit(courseId)} && is_active = true`,
      sort: 'display_order,created'
    }));
    return res.items || [];
  }

  async function fetchAllQuizzes(courseId = null) {
    const res = await api(records(collections().quizzes) + listQuery({
      filter: courseId ? `course = ${lit(courseId)}` : undefined,
      sort: 'display_order,-created'
    }));
    return res.items || [];
  }

  /* --------------------------------------------------------------- access */

  async function fetchAccessRecords(userId) {
    if (!userId) return [];
    const res = await api(records(collections().examAccess) + listQuery({
      filter: `user = ${lit(userId)}`,
      sort: '-access_until',
      expand: 'course'
    }));
    return (res.items || []).map(normaliseAccess);
  }

  function findActiveAccess(recordsList, courseId) {
    const now = Date.now();
    return (recordsList || []).find(item => {
      const until = toDate(item.access_until);
      return item.course_id === courseId && until && until.getTime() > now;
    }) || null;
  }

  async function recordPaymentAndGrantAccess({ user, course, paymentRef, rawPayload }) {
    if (!user || !course) throw new Error('Missing user or course.');

    const days = Number(course.mock_duration_days || cfg().accessDays || 15);
    const now = new Date();
    const accessUntil = new Date(now.getTime() + days * 24 * 60 * 60 * 1000);
    const ref = paymentRef || `manual-${Date.now()}`;

    try {
      await api(records(collections().paymentRecords), {
        method: 'POST',
        body: {
          user: user.id,
          course: course.id,
          payment_ref: ref,
          amount_label: money(course.price),
          status: 'paid',
          raw_payload: rawPayload || {}
        }
      });
    } catch (error) {
      // A repeated gateway callback hits the unique payment_ref index; that is
      // expected and must not stop access being granted.
      if (error.status !== 400) throw error;
    }

    const payload = {
      user: user.id,
      course: course.id,
      access_from: now.toISOString().replace('T', ' '),
      access_until: accessUntil.toISOString().replace('T', ' '),
      payment_ref: ref
    };

    // Upsert by hand: PocketBase has no onConflict, and the unique index on
    // (user, course) means a second purchase must extend the existing row.
    const existing = await api(records(collections().examAccess) + listQuery({
      filter: `user = ${lit(user.id)} && course = ${lit(course.id)}`, perPage: 1
    }));

    if (existing.items?.length) {
      await api(`${records(collections().examAccess)}/${existing.items[0].id}`, { method: 'PATCH', body: payload });
    } else {
      await api(records(collections().examAccess), { method: 'POST', body: payload });
    }

    return { ...payload, access_until: accessUntil.toISOString() };
  }

  async function saveMockAttempt({ userId, courseId, score, totalQuestions, answers }) {
    if (!userId || !courseId) return;
    await api(records(collections().mockAttempts), {
      method: 'POST',
      body: {
        user: userId,
        course: courseId,
        score,
        total_questions: totalQuestions,
        answers: answers || []
      }
    });
  }

  /* ---------------------------------------------------------------- admin */
  // Content is normally managed in the PocketBase admin UI. These remain so
  // admin.html keeps working if you choose to serve it.

  async function saveCourse(payload) {
    const body = { ...payload, mock_duration_days: Number(payload.mock_duration_days || cfg().accessDays || 15), is_published: Boolean(payload.is_published) };
    const id = body.id; delete body.id;
    return id
      ? api(`${records(collections().courses)}/${id}`, { method: 'PATCH', body })
      : api(records(collections().courses), { method: 'POST', body });
  }

  async function deleteCourse(id) {
    if (id) await api(`${records(collections().courses)}/${id}`, { method: 'DELETE' });
  }

  async function saveQuiz(payload) {
    const body = { ...payload, is_active: Boolean(payload.is_active) };
    const id = body.id; delete body.id;
    if (body.course_id) { body.course = body.course_id; delete body.course_id; }
    return id
      ? api(`${records(collections().quizzes)}/${id}`, { method: 'PATCH', body })
      : api(records(collections().quizzes), { method: 'POST', body });
  }

  async function deleteQuiz(id) {
    if (id) await api(`${records(collections().quizzes)}/${id}`, { method: 'DELETE' });
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
    if (/failed to fetch|networkerror|name_not_resolved|load failed|not configured/i.test(msg)) {
      return 'Our servers are temporarily unavailable for maintenance. Please try again shortly, or email <a href="mailto:info@nismstudy.in">info@nismstudy.in</a> for help.';
    }
    return fallback;
  }

  return {
    cfg, tables: collections, qs, money, fmtDate, fmtShortDate, daysRemaining, escapeHtml,
    getLoginPath, getLoginUrl,
    getPendingSignup, setPendingSignup, clearPendingSignup,
    createClient, getSession, requireAuth,
    sendMagicLink, verifyOtp, hasPendingOtp, signOutUser,
    getProfile, isAdmin, upsertProfileFromUser, completePendingSignup,
    fetchHomeSupport, fetchPublishedCourses, fetchAllCourses, fetchCourse,
    fetchAccessRecords, findActiveAccess, recordPaymentAndGrantAccess,
    fetchQuizzes, fetchAllQuizzes, saveMockAttempt,
    saveCourse, deleteCourse, saveQuiz, deleteQuiz,
    renderAuthSummary, setStatus, friendlyError
  };
})();
