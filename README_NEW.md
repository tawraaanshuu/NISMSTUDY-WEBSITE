# 🎓 NISMSTUDY.COM - Complete Learning Platform

> **Production-Ready Platform for NISM, NCFM & Financial Planning Certifications**

[![Node.js](https://img.shields.io/badge/Node.js-16+-green.svg)](https://nodejs.org)
[![MongoDB](https://img.shields.io/badge/MongoDB-4.4+-green.svg)](https://www.mongodb.com)
[![License](https://img.shields.io/badge/License-ISC-blue.svg)](LICENSE)

A comprehensive online learning management system with payment integration, quiz system, progress tracking, and admin panel.

---

## ✨ Features

### 👨‍🎓 For Students
- ✅ **User Registration & Login** - Secure authentication with JWT
- ✅ **Course Catalog** - Browse NISM, NCFM, and Financial Planning courses
- ✅ **Free Materials** - Download study materials without registration
- ✅ **Secure Payments** - Integrated Razorpay payment gateway
- ✅ **Interactive Quizzes** - Timed quizzes with instant results
- ✅ **Progress Tracking** - Monitor your learning progress
- ✅ **Personalized Dashboard** - View enrolled courses and performance

### 👨‍💼 For Admins
- ✅ **Content Management** - Upload courses, PDFs, and study materials
- ✅ **Quiz Creation** - Create 50 or 100 question quizzes
- ✅ **User Management** - View and manage registered students
- ✅ **Analytics Dashboard** - Track enrollments, revenue, and performance
- ✅ **Payment Tracking** - Monitor all transactions

### 🔒 Security Features
- ✅ **Helmet.js** - Security headers
- ✅ **Rate Limiting** - Protection against abuse
- ✅ **CORS** - Proper cross-origin configuration
- ✅ **Input Sanitization** - NoSQL injection protection
- ✅ **XSS Protection** - Cross-site scripting prevention
- ✅ **Secure Sessions** - HTTP-only cookies with expiry

---

## 🚀 Quick Start

### Prerequisites
- Node.js (v16 or higher)
- MongoDB (local or Atlas)
- npm or yarn

### Installation

**Option 1: Automated (Windows)**
```bash
# Just run the quick start script
quick-start-production.bat
```

**Option 2: Manual**
```bash
# 1. Install dependencies
npm install

# 2. Configure environment
# Copy .env.example to .env and update values

# 3. Initialize database
npm run seed
npm run init-admin

# 4. Start server
npm start
```

**Access:** http://localhost:5000

---

## 📋 Environment Setup

Create `.env` file:

```env
# Server
PORT=5000
NODE_ENV=development
MONGODB_URI=your_mongodb_connection_string

# Security
JWT_SECRET=your_jwt_secret_32_chars_minimum
SESSION_SECRET=your_session_secret_32_chars_minimum

# Admin
ADMIN_EMAIL=admin@nismstudy.com
ADMIN_PASSWORD=YourStrongPassword

# Razorpay
RAZORPAY_KEY_ID=your_razorpay_key
RAZORPAY_KEY_SECRET=your_razorpay_secret
```

Generate secrets:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

---

## 🎯 Available Scripts

```bash
# Development
npm start              # Start server
npm run dev            # Start with nodemon (auto-reload)
npm run demo           # Demo mode (no database)

# Production
npm run start:prod     # Production server (enhanced security)

# Setup
npm run seed           # Add sample courses and data
npm run init-admin     # Create admin account

# Testing
npm run test           # Run API tests
```

---

## 📂 Project Structure

```
nismstudy-website/
├── config/           # Database configuration
├── models/           # Mongoose models (User, Course, Quiz, etc.)
├── controllers/      # Business logic
│   ├── authController.js
│   ├── adminController.js
│   ├── studentController.js
│   └── paymentController.js
├── routes/           # API routes
├── middleware/       # Auth, validation, upload
├── scripts/          # Utility scripts
│   ├── createAdmin.js
│   ├── seedData.js
│   └── testAPI.js
├── public/           # Frontend files
│   ├── dashboard.html
│   ├── admin-panel.html
│   └── ...
├── uploads/          # Uploaded files
├── server.js         # Development server
├── server.production.js  # Production server
└── package.json
```

---

## 🔌 API Endpoints

### Authentication
```
POST /api/auth/register     # Register new user
POST /api/auth/login        # Login user
POST /api/auth/logout       # Logout user
GET  /api/auth/me           # Get current user
PUT  /api/auth/profile      # Update profile
PUT  /api/auth/change-password  # Change password
```

### Courses (Public)
```
GET /api/student/courses              # Get all courses
GET /api/student/courses/:id          # Get course details
GET /api/student/materials/free       # Get free materials
```

### Student Dashboard (Protected)
```
GET /api/student/dashboard            # Get dashboard data
GET /api/student/courses/:id/materials  # Get course materials
POST /api/student/quizzes/:id/start   # Start quiz
POST /api/student/attempts/:id/submit # Submit quiz
GET /api/student/progress/:courseId   # Get progress
```

### Admin (Protected)
```
POST /api/admin/courses               # Create course
POST /api/admin/study-materials       # Upload material
POST /api/admin/quizzes               # Create quiz
POST /api/admin/quizzes/:id/questions # Add questions
GET  /api/admin/stats                 # Get statistics
GET  /api/admin/users                 # Get all users
```

### Payment
```
POST /api/payment/create-order        # Create Razorpay order
POST /api/payment/verify              # Verify payment
GET  /api/payment/history             # Payment history
POST /api/payment/webhook             # Razorpay webhook
```

---

## 💳 Payment Integration

### Setup Razorpay

1. Create account at [razorpay.com](https://razorpay.com)
2. Get API keys from Dashboard → Settings → API Keys
3. Add to `.env`:
   ```env
   RAZORPAY_KEY_ID=rzp_test_xxxxx
   RAZORPAY_KEY_SECRET=your_secret
   ```
4. Test with card: 4111 1111 1111 1111

### Payment Flow
1. Student selects course
2. Click "Make Payment"
3. Razorpay checkout opens
4. Payment processed
5. Course unlocks automatically
6. Confirmation email sent

---

## 🗄️ Database Models

- **User** - Student/Admin accounts
- **Course** - Course information
- **Quiz** - Quiz details and questions
- **QuizAttempt** - Student quiz submissions
- **StudyMaterial** - PDFs and documents
- **Purchase** - Payment records
- **Progress** - Student progress tracking

---

## 🧪 Testing

### Automated Tests
```bash
npm run test
```

Tests:
- ✅ Health check
- ✅ User registration
- ✅ User login
- ✅ Course retrieval
- ✅ Dashboard loading
- ✅ Payment order creation
- ✅ Admin statistics

### Manual Testing
1. Register as student
2. Browse courses
3. Make test payment
4. Take a quiz
5. Check dashboard

---

## 🚀 Deployment

### Option 1: Render (Easiest)
1. Push to GitHub
2. Connect to [Render](https://render.com)
3. Add environment variables
4. Deploy automatically

### Option 2: Railway
1. Connect [Railway](https://railway.app) to GitHub
2. Configure environment
3. Deploy with one click

### Option 3: DigitalOcean / AWS
See [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md) for details.

### Pre-Deployment Checklist
- [ ] MongoDB Atlas configured
- [ ] Environment variables set
- [ ] Razorpay in Live mode
- [ ] Admin account created
- [ ] SSL certificate ready
- [ ] Domain configured
- [ ] All tests passing

---

## 📚 Documentation

### Getting Started
- **[GETTING_STARTED.md](./GETTING_STARTED.md)** - Quick start guide
- **[IMPROVEMENTS_SUMMARY.md](./IMPROVEMENTS_SUMMARY.md)** - What's new

### Setup & Configuration
- **[PRODUCTION_SETUP_GUIDE.md](./PRODUCTION_SETUP_GUIDE.md)** - Complete setup
- **[.env.production.example](./.env.production.example)** - Configuration template

### Development
- **[PRODUCTION_ROADMAP_30DAYS.md](./PRODUCTION_ROADMAP_30DAYS.md)** - 30-day launch plan
- **[BACKEND_DOCUMENTATION.md](./BACKEND_DOCUMENTATION.md)** - API reference

### Deployment
- **[DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md)** - Hosting options
- **[PROJECT_SUMMARY.md](./PROJECT_SUMMARY.md)** - Feature overview

---

## 🛠️ Technology Stack

### Backend
- **Node.js** - Runtime environment
- **Express.js** - Web framework
- **MongoDB** - Database
- **Mongoose** - ODM

### Authentication & Security
- **JWT** - Token-based authentication
- **bcrypt** - Password hashing
- **Helmet** - Security headers
- **express-rate-limit** - Rate limiting
- **express-mongo-sanitize** - Injection protection

### Payment
- **Razorpay** - Payment gateway

### File Upload
- **Multer** - File handling

### Frontend
- **HTML5, CSS3, JavaScript**
- **Responsive design**

---

## 📊 System Requirements

### Development
- Node.js 16+
- MongoDB 4.4+
- 2GB RAM
- 1GB disk space

### Production
- Node.js 16+
- MongoDB Atlas or equivalent
- 4GB RAM (recommended)
- 10GB disk space
- SSL certificate
- Domain name

---

## 🔧 Configuration

### Quiz Settings
```env
QUIZ_50_QUESTIONS_TIME=7200    # 2 hours
QUIZ_100_QUESTIONS_TIME=10800  # 3 hours
PASSING_PERCENTAGE=60          # 60% pass mark
```

### File Upload
```env
MAX_FILE_SIZE=10485760  # 10MB
UPLOAD_PATH=./uploads
```

### Rate Limiting
```env
RATE_LIMIT_WINDOW=15      # 15 minutes
RATE_LIMIT_MAX_REQUESTS=100  # 100 requests
```

---

## 🆘 Troubleshooting

### Server won't start
- Check MongoDB is running
- Verify .env configuration
- Ensure port 5000 is free

### Database connection error
- Verify MONGODB_URI
- Check network/firewall
- Ensure MongoDB is accessible

### Payment not working
- Check Razorpay keys
- Verify test/live mode
- Check browser console

See [GETTING_STARTED.md](./GETTING_STARTED.md#troubleshooting) for more solutions.

---

## 📈 Roadmap

### Current Version (v1.0)
- ✅ Complete authentication system
- ✅ Course management
- ✅ Quiz system
- ✅ Payment integration
- ✅ Admin panel
- ✅ Student dashboard

### Future Enhancements (v1.1+)
- ⏳ Email notifications
- ⏳ Video lectures
- ⏳ Discussion forums
- ⏳ Mobile app
- ⏳ Live classes
- ⏳ Certificate generation
- ⏳ Advanced analytics

---

## 🤝 Contributing

This is a private project. For internal use only.

---

## 📄 License

Copyright © 2025 NISMSTUDY.COM. All rights reserved.

---

## 📞 Support

- **Documentation:** See docs folder
- **Setup Issues:** Check GETTING_STARTED.md
- **API Issues:** See BACKEND_DOCUMENTATION.md

---

## 🎉 Success Metrics

- **Students:** Support 10,000+ concurrent users
- **Uptime:** 99.9% availability target
- **Performance:** API response < 200ms
- **Security:** Zero vulnerabilities

---

## 🌟 Key Highlights

- 🚀 **Production Ready** - Secure, scalable, tested
- 💳 **Payment Integrated** - Razorpay fully configured
- 📚 **Content Management** - Easy admin panel
- 🎯 **Performance** - Optimized and fast
- 🔒 **Secure** - Industry-standard security
- 📱 **Responsive** - Works on all devices

---

## 🎯 Quick Links

- **Website:** http://localhost:5000
- **Admin:** http://localhost:5000/public/admin-panel.html
- **API Health:** http://localhost:5000/api/health
- **Documentation:** [docs/](./docs/)

---

**Ready to launch your online learning platform? Let's go! 🚀**

For detailed instructions, start with [GETTING_STARTED.md](./GETTING_STARTED.md)



