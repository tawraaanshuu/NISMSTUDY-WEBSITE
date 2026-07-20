// PocketBase configuration. Copy to the site root as config.js when switching
// backends. Nothing secret belongs here — this file is served publicly.
window.NISM_APP_CONFIG = {
  pocketbaseUrl: 'https://api.nismstudy.in',   // <- your PocketBase origin
  accessDays: 15,
  defaultPriceLabel: 'Rs 329',
  adminEmails: ['tawra.anshu@gmail.com', 'info@nismstudy.in'],
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
