window.NISMApp = (() => {
  const config = window.NISM_APP_CONFIG || {};

  if (!window.supabase) {
    throw new Error('Supabase JS is not loaded before app.js');
  }

  const supabase = window.supabase.createClient(
    config.supabaseUrl,
    config.supabaseAnonKey,
    {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true
      }
    }
  );

  const tables = {
    profiles: config.tables?.profiles || 'profiles',
    courses: config.tables?.courses || 'courses',
    quizzes: config.tables?.quizzes || 'quizzes',
    enrollments: config.tables?.examAccess || 'enrollments',
    payments: config.tables?.paymentRecords || 'payments',
    examAttempts: config.tables?.mockAttempts || 'exam_attempts'
  };

  const ACTIVE_PAYMENT_STATUSES = new Set(['paid', 'captured', 'success', 'active']);
  const LIVE_STATUSES = new Set(['live', 'published', 'active']);

  function text(v) {
    return v == null ? '' : String(v).trim();
  }

  function nowIso() {
    return new Date().toISOString();
  }

  function addDays(days) {
    const d = new Date();
    d.setDate(d.getDate() + Number(days || config.accessDays || 15));
    return d.toISOString();
  }

  function formatDate(value) {
    if (!value) return '';
    return new Date(value).toLocaleString('en-IN', {
      dateStyle: 'medium',
      timeStyle: 'short'
    });
  }

  function getNextUrl(fallback = '/mock-tests.html') {
    const params = new URLSearchParams(window.location.search);
    return params.get('next') || fallback;
  }

  function getLoginRedirectUrl() {
    return `${window.location.origin}/login.html`;
  }

  function normalizeCourse(row = {}) {
    return {
      ...row,
      title: row.title || row.name || 'Untitled Course',
      slug: row.slug || row.course_slug || String(row.id),
      short_description: row.short_description || row.subtitle || row.description || '',
      price_label: row.price_label || row.price_display || config.defaultPriceLabel
    };
  }

  function normalizeQuiz(row = {}) {
    return {
      ...row,
      title: row.title || row.name || row.quiz_title || 'Mock Test',
      duration_minutes: Number(row.duration_minutes || row.duration || 0),
      question_count: Number(row.question_count || row.total_questions || 0)
    };
  }

  function courseIsLive(row = {}) {
    const checks = [];

    if ('is_live' in row) checks.push(row.is_live === true);
    if ('is_published' in row) checks.push(row.is_published === true);
    if ('published' in row) checks.push(row.published === true);
    if ('status' in row) checks.push(LIVE_STATUSES.has(text(row.status).toLowerCase()));

    return checks.length === 0 ? true : checks.some(Boolean);
  }

  function quizIsLive(row = {}) {
    const checks = [];

    if ('is_live' in row) checks.push(row.is_live === true);
    if ('is_published' in row) checks.push(row.is_published === true);
    if ('published' in row) checks.push(row.published === true);
    if ('status' in row) checks.push(LIVE_STATUSES.has(text(row.status).toLowerCase()));

    return checks.length === 0 ? true : checks.some(Boolean);
  }

  function sortCourses(a, b) {
    const aOrder = Number.isFinite(Number(a.sort_order)) ? Number(a.sort_order) : Number.MAX_SAFE_INTEGER;
    const bOrder = Number.isFinite(Number(b.sort_order)) ? Number(b.sort_order) : Number.MAX_SAFE_INTEGER;

    if (aOrder !== bOrder) return aOrder - bOrder;
    return text(a.title).localeCompare(text(b.title));
  }

  function extractQuizRank(row = {}) {
    const source = text(row.title || row.name || row.slug).toLowerCase();
    const match = source.match(/(\d+)/);
    return match ? Number(match[1]) : Number.MAX_SAFE_INTEGER;
  }

  function sortQuizzes(a, b) {
    const aOrder = Number.isFinite(Number(a.sort_order)) ? Number(a.sort_order) : extractQuizRank(a);
    const bOrder = Number.isFinite(Number(b.sort_order)) ? Number(b.sort_order) : extractQuizRank(b);

    if (aOrder !== bOrder) return aOrder - bOrder;
    return text(a.title).localeCompare(text(b.title));
  }

  function isEnrollmentActive(row = {}) {
    const status = text(row.payment_status).toLowerCase();

    if (status && !ACTIVE_PAYMENT_STATUSES.has(status)) {
      return false;
    }

    if (!row.access_until) {
      return true;
    }

    return new Date(row.access_until).getTime() > Date.now();
  }

  async function getSession() {
    const { data, error } = await supabase.auth.getSession();
    if (error) throw error;
    return data.session || null;
  }

  async function getCurrentUser() {
    const session = await getSession();
    return session?.user || null;
  }

  async function requireAuth() {
    const user = await getCurrentUser();
    if (user) return user;

    const next = encodeURIComponent(window.location.pathname + window.location.search);
    window.location.href = `/login.html?next=${next}`;
    return null;
  }

  async function signOut() {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
    window.location.href = '/';
  }

  async function sendMagicLink({ email, fullName = '', mobile = '' }) {
    const cleanedEmail = text(email);
    if (!cleanedEmail) {
      throw new Error('Email is required');
    }

    localStorage.setItem(
      'nism_pending_profile',
      JSON.stringify({
        full_name: text(fullName),
        mobile: text(mobile)
      })
    );

    const { error } = await supabase.auth.signInWithOtp({
      email: cleanedEmail,
      options: {
        shouldCreateUser: true,
        emailRedirectTo: getLoginRedirectUrl(),
        data: {
          full_name: text(fullName),
          mobile: text(mobile)
        }
      }
    });

    if (error) throw error;
    return true;
  }

  async function sendPhoneOtp({ phone, fullName = '', mobile = '' }) {
    const cleanedPhone = text(phone);
    if (!cleanedPhone) {
      throw new Error('Phone is required');
    }

    localStorage.setItem(
      'nism_pending_profile',
      JSON.stringify({
        full_name: text(fullName),
        mobile: text(mobile || phone)
      })
    );

    const { error } = await supabase.auth.signInWithOtp({
      phone: cleanedPhone,
      options: {
        data: {
          full_name: text(fullName),
          mobile: text(mobile || phone)
        }
      }
    });

    if (error) throw error;
    return true;
  }

  // Assumes profiles.id = auth.users.id (standard Supabase pattern)
  async function upsertProfile(profile = {}) {
    const user = await getCurrentUser();
    if (!user) throw new Error('No authenticated user');

    const pending = JSON.parse(localStorage.getItem('nism_pending_profile') || '{}');

    const fullName =
      text(profile.full_name) ||
      text(profile.fullName) ||
      text(user.user_metadata?.full_name) ||
      text(pending.full_name);

    const mobile =
      text(profile.mobile) ||
      text(user.user_metadata?.mobile) ||
      text(user.phone) ||
      text(pending.mobile);

    const payload = {
      id: user.id,
      full_name: fullName || null,
      mobile: mobile || null
    };

    const { error } = await supabase
      .from(tables.profiles)
      .upsert(payload, { onConflict: 'id' });

    if (error) throw error;

    localStorage.removeItem('nism_pending_profile');
    return payload;
  }

  async function getLiveCourses() {
    const { data, error } = await supabase
      .from(tables.courses)
      .select('*');

    if (error) throw error;

    return (data || [])
      .filter(courseIsLive)
      .map(normalizeCourse)
      .sort(sortCourses);
  }

  async function getCourseBySlug(slug) {
    if (!slug) return null;

    const { data, error } = await supabase
      .from(tables.courses)
      .select('*')
      .eq('slug', slug)
      .maybeSingle();

    if (error && error.code !== 'PGRST116') {
      throw error;
    }

    if (data) {
      return normalizeCourse(data);
    }

    const allCourses = await getLiveCourses();
    return allCourses.find((course) => course.slug === slug) || null;
  }

  async function getCourseQuizzes(courseId) {
    if (!courseId) return [];

    const { data, error } = await supabase
      .from(tables.quizzes)
      .select('*')
      .eq('course_id', courseId);

    if (error) throw error;

    return (data || [])
      .filter(quizIsLive)
      .map(normalizeQuiz)
      .sort(sortQuizzes);
  }

  async function getUserEnrollments(userId) {
    const uid = userId || (await getCurrentUser())?.id;
    if (!uid) return [];

    const { data, error } = await supabase
      .from(tables.enrollments)
      .select('*')
      .eq('user_id', uid);

    if (error) throw error;
    return data || [];
  }

  async function getActiveEnrollments(userId) {
    const rows = await getUserEnrollments(userId);
    return rows.filter(isEnrollmentActive);
  }

  async function hasCourseAccess(courseId, userId) {
    const rows = await getActiveEnrollments(userId);
    return rows.some((row) => String(row.course_id) === String(courseId));
  }

  async function getAccessibleCourses(userId) {
    const activeEnrollments = await getActiveEnrollments(userId);
    const courseIds = [...new Set(activeEnrollments.map((x) => x.course_id).filter(Boolean))];

    if (!courseIds.length) return [];

    const { data, error } = await supabase
      .from(tables.courses)
      .select('*')
      .in('id', courseIds);

    if (error) throw error;

    const enrollmentMap = new Map(
      activeEnrollments.map((item) => [String(item.course_id), item])
    );

    return (data || [])
      .filter(courseIsLive)
      .map(normalizeCourse)
      .sort(sortCourses)
      .map((course) => ({
        ...course,
        enrollment: enrollmentMap.get(String(course.id)) || null
      }));
  }

  async function upsertEnrollment({
    userId,
    courseId,
    paymentStatus = 'paid',
    purchasedAt = nowIso(),
    accessUntil = addDays(config.accessDays || 15)
  }) {
    const uid = userId || (await getCurrentUser())?.id;
    if (!uid) throw new Error('No authenticated user');
    if (!courseId) throw new Error('courseId is required');

    const payload = {
      user_id: uid,
      course_id: courseId,
      payment_status: paymentStatus,
      purchased_at: purchasedAt,
      access_until: accessUntil
    };

    const { data, error } = await supabase
      .from(tables.enrollments)
      .upsert(payload, { onConflict: 'user_id,course_id' })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async function createPaymentLog({
    userId,
    courseId,
    provider = 'razorpay',
    orderId = null,
    paymentId = null,
    signature = null,
    amountInr = null,
    status = 'paid',
    rawPayload = null
  }) {
    const uid = userId || (await getCurrentUser())?.id;
    if (!uid) throw new Error('No authenticated user');
    if (!courseId) throw new Error('courseId is required');

    const payload = {
      user_id: uid,
      course_id: courseId,
      provider,
      order_id: orderId,
      payment_id: paymentId,
      signature,
      amount_inr: amountInr == null ? null : Number(amountInr),
      status,
      raw_payload: rawPayload || {}
    };

    const { data, error } = await supabase
      .from(tables.payments)
      .insert(payload)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async function grantPaidAccess({
    courseId,
    provider = 'razorpay',
    orderId = null,
    paymentId = null,
    signature = null,
    amountInr = null,
    status = 'paid',
    rawPayload = null
  }) {
    const user = await requireAuth();
    if (!user) return null;

    await createPaymentLog({
      userId: user.id,
      courseId,
      provider,
      orderId,
      paymentId,
      signature,
      amountInr,
      status,
      rawPayload
    });

    await upsertEnrollment({
      userId: user.id,
      courseId,
      paymentStatus: 'paid',
      purchasedAt: nowIso(),
      accessUntil: addDays(config.accessDays || 15)
    });

    return true;
  }

  return {
    config,
    tables,
    supabase,

    getSession,
    getCurrentUser,
    requireAuth,
    getNextUrl,
    signOut,

    sendMagicLink,
    sendPhoneOtp,
    upsertProfile,
    ensureProfileFromAuthUser: upsertProfile,

    getLiveCourses,
    getCourseBySlug,
    getCourseQuizzes,

    getUserEnrollments,
    getActiveEnrollments,
    getAccessibleCourses,
    hasCourseAccess,
    isEnrollmentActive,

    upsertEnrollment,
    createPaymentLog,
    grantPaidAccess,

    addDays,
    formatDate,

    // compatibility aliases for older code
    hasExamAccess: hasCourseAccess,
    getExamAccess: getActiveEnrollments,
    savePaymentRecord: createPaymentLog,
    grantExamAccess: upsertEnrollment
  };
})();

window.App = window.NISMApp;
window.app = window.NISMApp;
