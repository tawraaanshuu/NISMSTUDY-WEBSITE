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
    quizzes: 'quizzes',
    examAccess: 'exam_access',
    paymentRecords: 'payment_records',
    mockAttempts: 'mock_attempts',
    homeSupport: 'home_support_content'
  }
};

window.NISM_APP = (() => {
  let _client = null;

  const cfg = () => window.NISM_APP_CONFIG || {};
  const tables = () => (cfg().tables || {});

  function escapeHtml(value) {
    return String(value ?? '')
      .replaceAll('&', '&amp;')
      .replaceAll('<', '&lt;')
      .replaceAll('>', '&gt;')
      .replaceAll('"', '&quot;')
      .replaceAll("'", '&#39;');
  }

  function qs(name) {
    const url = new URL(window.location.href);
    return url.searchParams.get(name);
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
    const end = new Date(value).getTime();
    const now = Date.now();
    return Math.max(0, Math.ceil((end - now) / (1000 * 60 * 60 * 24)));
  }

  async function createClient() {
    if (_client) return _client;
    if (!window.supabase || !window.supabase.createClient) return null;
    const config = cfg();
    if (!config.supabaseUrl || !config.supabaseAnonKey) return null;
    _client = window.supabase.createClient(config.supabaseUrl, config.supabaseAnonKey, {
      auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true
      }
    });
    return _client;
  }

  async function getSession() {
    const client = await createClient();
    if (!client) return { client: null, session: null, user: null };
    const { data } = await client.auth.getSession();
    return { client, session: data.session || null, user: data.session?.user || null };
  }

  async function requireAuth(redirectTo = 'login.html') {
    const { client, session, user } = await getSession();
    if (!client || !session || !user) {
      window.location.href = redirectTo;
      return null;
    }
    return { client, session, user };
  }

  async function sendMagicLink(email) {
    const client = await createClient();
    if (!client) throw new Error('Supabase config missing.');
    const redirectTo = `${window.location.origin}${window.location.pathname.includes('/site/') ? '/site/' : '/'}login.html`;
    const { error } = await client.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: redirectTo }
    });
    if (error) throw error;
    return true;
  }

  async function signOutUser() {
    const client = await createClient();
    if (!client) return;
    await client.auth.signOut();
    window.location.href = 'login.html';
  }

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
    const payload = {
      id: user.id,
      email: user.email,
      full_name: user.user_metadata?.full_name || user.email,
      updated_at: new Date().toISOString()
    };
    await client.from(tables().profiles).upsert(payload);
  }

  

  async function fetchHomeSupport() {
    const client = await createClient();
    if (!client) return null;
    const tableName = (cfg().tables || {}).homeSupport || 'home_support_content';
    const { data, error } = await client
      .from(tableName)
      .select('*')
      .eq('is_active', true)
      .order('updated_at', { ascending: false })
      .limit(1)
      .maybeSingle();
    if (error) throw error;
    return data || null;
  }

  async function fetchPublishedCourses() {
    const client = await createClient();
    if (!client) throw new Error('Supabase config missing.');
    const { data, error } = await client
      .from(tables().courses)
      .select('*')
      .eq('is_published', true)
      .order('display_order', { ascending: true })
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data || [];
  }

  async function fetchAllCourses() {
    const client = await createClient();
    if (!client) throw new Error('Supabase config missing.');
    const { data, error } = await client
      .from(tables().courses)
      .select('*')
      .order('display_order', { ascending: true })
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data || [];
  }

  async function fetchCourse(courseId) {
    const client = await createClient();
    if (!client || !courseId) return null;
    const { data, error } = await client.from(tables().courses).select('*').eq('id', courseId).maybeSingle();
    if (error) throw error;
    return data || null;
  }

  async function fetchAccessRecords(userId) {
    const client = await createClient();
    if (!client || !userId) return [];
    const { data, error } = await client
      .from(tables().examAccess)
      .select('*, courses(*)')
      .eq('user_id', userId)
      .order('access_until', { ascending: false });
    if (error) throw error;
    return data || [];
  }

  function findActiveAccess(records, courseId) {
    const now = Date.now();
    return (records || []).find(item => item.course_id === courseId && new Date(item.access_until).getTime() > now) || null;
  }

  async function recordPaymentAndGrantAccess({ user, course, paymentRef, rawPayload }) {
    const client = await createClient();
    if (!client) throw new Error('Supabase config missing.');
    if (!user || !course) throw new Error('Missing user or course.');
    const days = Number(course.mock_duration_days || cfg().accessDays || 15);
    const now = new Date();
    const accessUntil = new Date(now.getTime() + days * 24 * 60 * 60 * 1000).toISOString();
    const paymentPayload = {
      user_id: user.id,
      course_id: course.id,
      payment_ref: paymentRef || `manual-${Date.now()}`,
      amount_label: money(course.price),
      status: 'paid',
      raw_payload: rawPayload || {},
      created_at: now.toISOString()
    };

    const { error: paymentError } = await client.from(tables().paymentRecords).insert(paymentPayload);
    if (paymentError && !String(paymentError.message || '').toLowerCase().includes('duplicate')) {
      throw paymentError;
    }

    const accessPayload = {
      user_id: user.id,
      course_id: course.id,
      access_from: now.toISOString(),
      access_until: accessUntil,
      payment_ref: paymentPayload.payment_ref,
      updated_at: now.toISOString()
    };

    const { error: accessError } = await client.from(tables().examAccess).upsert(accessPayload, { onConflict: 'user_id,course_id' });
    if (accessError) throw accessError;

    return accessPayload;
  }

  async function fetchQuizzes(courseId) {
    const client = await createClient();
    if (!client || !courseId) return [];
    const { data, error } = await client
      .from(tables().quizzes)
      .select('*')
      .eq('course_id', courseId)
      .eq('is_active', true)
      .order('display_order', { ascending: true })
      .order('created_at', { ascending: true });
    if (error) throw error;
    return data || [];
  }

  async function saveMockAttempt({ userId, courseId, score, totalQuestions, answers }) {
    const client = await createClient();
    if (!client || !userId || !courseId) return;
    await client.from(tables().mockAttempts).insert({
      user_id: userId,
      course_id: courseId,
      score,
      total_questions: totalQuestions,
      answers,
      created_at: new Date().toISOString()
    });
  }

  async function saveCourse(payload) {
    const client = await createClient();
    if (!client) throw new Error('Supabase config missing.');
    const record = {
      ...payload,
      updated_at: new Date().toISOString(),
      mock_duration_days: Number(payload.mock_duration_days || cfg().accessDays || 15),
      is_published: Boolean(payload.is_published)
    };
    const { error } = await client.from(tables().courses).upsert(record);
    if (error) throw error;
  }

  async function deleteCourse(id) {
    const client = await createClient();
    if (!client || !id) return;
    const { error } = await client.from(tables().courses).delete().eq('id', id);
    if (error) throw error;
  }

  async function fetchAllQuizzes(courseId = null) {
    const client = await createClient();
    if (!client) throw new Error('Supabase config missing.');
    let query = client.from(tables().quizzes).select('*').order('display_order', { ascending: true }).order('created_at', { ascending: false });
    if (courseId) query = query.eq('course_id', courseId);
    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  }

  async function saveQuiz(payload) {
    const client = await createClient();
    if (!client) throw new Error('Supabase config missing.');
    const record = {
      ...payload,
      updated_at: new Date().toISOString(),
      is_active: Boolean(payload.is_active)
    };
    const { error } = await client.from(tables().quizzes).upsert(record);
    if (error) throw error;
  }

  async function deleteQuiz(id) {
    const client = await createClient();
    if (!client || !id) return;
    const { error } = await client.from(tables().quizzes).delete().eq('id', id);
    if (error) throw error;
  }

  function renderAuthSummary(target, user, profile) {
    if (!target) return;
    const role = profile?.role ? `<span class="pill info">${escapeHtml(profile.role)}</span>` : '';
    target.innerHTML = `
      <div class="badge-row">
        <span class="pill info">Logged in as ${escapeHtml(user?.email || '')}</span>
        ${role}
      </div>
    `;
  }

  function setStatus(target, message, type = 'info') {
    if (!target) return;
    target.className = `notice ${type}`;
    target.innerHTML = message;
  }

  return {
    cfg,
    tables,
    qs,
    money,
    fmtDate,
    fmtShortDate,
    daysRemaining,
    escapeHtml,
    createClient,
    getSession,
    requireAuth,
    sendMagicLink,
    signOutUser,
    getProfile,
    isAdmin,
    upsertProfileFromUser,
    fetchHomeSupport,
    fetchPublishedCourses,
    fetchAllCourses,
    fetchCourse,
    fetchAccessRecords,
    findActiveAccess,
    recordPaymentAndGrantAccess,
    fetchQuizzes,
    saveMockAttempt,
    saveCourse,
    deleteCourse,
    fetchAllQuizzes,
    saveQuiz,
    deleteQuiz,
    renderAuthSummary,
    setStatus
  };
})();
