window.NISM_APP_CONFIG = {
  supabaseUrl: 'https://yzmctktxzpzdfhdubwjs.supabase.co',
  supabaseAnonKey: 'sb_publishable_BT1BJ5IKC7OArjTBdUBjkA_CjBZiFVf',

  accessDays: 15,
  defaultPriceLabel: 'Rs 329',

  // The database still carries the old launch pricing (Rs 499–799, 30 days)
  // while every page of the site advertises Rs 329 for 15 days. Until
  // supabase/fix_prices_and_check_questions.sql is run, these two values are
  // what the student is actually charged and promised, so they win over the
  // `price_inr` / `access_days` columns. Delete both lines once the SQL has
  // been applied and the database agrees.
  priceOverrideInr: 329,
  accessDaysOverride: 15,

  // Courses whose question bank is fully populated (600 questions each) and
  // which may therefore be sold. Everything else renders as "Coming soon".
  // Verified against the database on 2026-08-01. Keep in step with the
  // `is_live` column — either being true makes a course purchasable.
  liveCourseSlugs: [
    'nism-series-i-currency-derivatives',
    'nism-series-v-a-mutual-fund-distributors',
    'nism-series-viii-equity-derivatives'
  ],

  // Supabase Edge Functions. Payments run through these because the Razorpay
  // key secret and the decision about how much to charge must never be in the
  // browser. Set to '' to disable the buy button everywhere.
  functionsUrl: 'https://yzmctktxzpzdfhdubwjs.supabase.co/functions/v1',

  chatApiUrl: 'https://api.nismstudy.in/api/chat',
  chatWidget: {
    // api.nismstudy.in does not resolve, so every visitor who opened the
    // widget got an error. It stays off until the API is actually deployed;
    // the widget also probes the endpoint before showing itself.
    enabled: false
  },

  adminEmails: ['tawra.anshu@gmail.com', 'info@nismstudy.in'],

  tables: {
    profiles: 'profiles',
    courses: 'courses',
    papers: 'quizzes',
    questions: 'questions',
    enrollments: 'enrollments',
    attempts: 'exam_attempts',
    answers: 'exam_answers',
    payments: 'payments'
  }
};
