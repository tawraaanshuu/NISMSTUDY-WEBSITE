# NISMSTUDY.COM - Complete Backend Documentation

## 📋 Table of Contents
1. [System Overview](#system-overview)
2. [Features Implemented](#features-implemented)
3. [Installation Guide](#installation-guide)
4. [API Documentation](#api-documentation)
5. [Admin Panel Guide](#admin-panel-guide)
6. [Student Dashboard Guide](#student-dashboard-guide)
7. [Quiz System](#quiz-system)
8. [Payment Integration](#payment-integration)
9. [Database Schema](#database-schema)
10. [Testing](#testing)

---

## 🎯 System Overview

This is a complete full-stack application for NISMSTUDY.COM with the following architecture:

**Technology Stack:**
- **Backend:** Node.js + Express.js
- **Database:** MongoDB with Mongoose ODM
- **Authentication:** JWT + Session-based
- **File Upload:** Multer
- **Payment:** Razorpay Integration
- **Frontend:** HTML, CSS, JavaScript (Vanilla)

---

## ✅ Features Implemented

### 1. **Admin Panel Features**
- ✅ Easy PDF document upload interface
- ✅ Course management (Create, Read, Update, Delete)
- ✅ Study material management with file uploads
- ✅ Quiz creation with 50/100 question support
- ✅ User management and statistics
- ✅ Dashboard with analytics

### 2. **Student Features**
- ✅ Personalized login system
- ✅ Customized dashboard showing:
  - Purchased courses
  - Study progress tracking
  - Quiz attempts and scores
- ✅ 10 quizzes per course:
  - Quizzes 1-8: 50 questions (2 hours)
  - Quizzes 9-10: 100 questions (3 hours)
- ✅ Quiz timer (automatic countdown)
- ✅ 60% passing percentage
- ✅ Free study materials download section
- ✅ Course purchase with payment gateway
- ✅ Logout functionality

### 3. **Quiz System**
- ✅ Multiple choice questions (MCQ)
- ✅ Automatic time limit enforcement
- ✅ Real-time score calculation
- ✅ Pass/Fail status based on 60%
- ✅ Detailed attempt history
- ✅ Performance analytics

### 4. **Payment Integration**
- ✅ Razorpay payment gateway setup
- ✅ Secure payment verification
- ✅ Automatic course enrollment after payment
- ✅ Transaction tracking

---

## 🚀 Installation Guide

### Prerequisites
- Node.js (v14 or higher)
- MongoDB (Local or MongoDB Atlas)
- npm or yarn package manager

### Step 1: Install Dependencies
```bash
cd nismstudy-website
npm install
```

### Step 2: Environment Configuration
1. Copy `.env.example` to `.env`:
```bash
copy .env.example .env
```

2. Update `.env` file with your configuration:
```env
# Server Configuration
PORT=5000
NODE_ENV=development

# Database (Choose one):
# Option 1: Local MongoDB
MONGODB_URI=mongodb://localhost:27017/nismstudy

# Option 2: MongoDB Atlas (Cloud)
# MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/nismstudy

# JWT Secret (Generate a random string)
JWT_SECRET=your_random_jwt_secret_key_here

# Session Secret
SESSION_SECRET=your_random_session_secret_here

# Admin Credentials
ADMIN_EMAIL=admin@nismstudy.com
ADMIN_PASSWORD=Admin@123456

# Razorpay (Get from https://dashboard.razorpay.com/)
RAZORPAY_KEY_ID=your_razorpay_key_id
RAZORPAY_KEY_SECRET=your_razorpay_key_secret

# Email Configuration (Optional)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your_email@gmail.com
EMAIL_PASSWORD=your_app_password

# Frontend URL
FRONTEND_URL=http://localhost:5000
```

### Step 3: Initialize Database
```bash
npm run init-db
```

This will:
- Create admin user
- Create sample courses
- Display admin credentials

### Step 4: Start the Server
```bash
# Development mode (with auto-restart)
npm run dev

# Production mode
npm start
```

Server will start at: `http://localhost:5000`

---

## 📡 API Documentation

### Base URL
```
http://localhost:5000/api
```

### Authentication Endpoints

#### 1. Register Student
```http
POST /api/auth/register
Content-Type: application/json

{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "password123",
  "phone": "9876543210"
}
```

#### 2. Login (Student/Admin)
```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "john@example.com",
  "password": "password123"
}
```

#### 3. Logout
```http
POST /api/auth/logout
Authorization: Bearer <token>
```

#### 4. Get Current User
```http
GET /api/auth/me
Authorization: Bearer <token>
```

### Admin Endpoints

#### 1. Upload Study Material
```http
POST /api/admin/study-materials
Authorization: Bearer <admin_token>
Content-Type: multipart/form-data

{
  "course": "<course_id>",
  "title": "Chapter 1: Introduction",
  "description": "Introduction to Mutual Funds",
  "isFree": "false",
  "file": <PDF_FILE>
}
```

#### 2. Create Quiz
```http
POST /api/admin/quizzes
Authorization: Bearer <admin_token>
Content-Type: application/json

{
  "course": "<course_id>",
  "title": "Mid-term Assessment",
  "description": "Quiz covering chapters 1-5",
  "quizNumber": 1,
  "questions": [
    {
      "questionText": "What is a mutual fund?",
      "options": [
        { "optionText": "Option A", "isCorrect": false },
        { "optionText": "Option B", "isCorrect": true },
        { "optionText": "Option C", "isCorrect": false },
        { "optionText": "Option D", "isCorrect": false }
      ],
      "correctAnswer": 1,
      "explanation": "Explanation here"
    }
    // ... 49 more questions for quizzes 1-8
    // ... 99 more questions for quizzes 9-10
  ]
}
```

#### 3. Get Dashboard Statistics
```http
GET /api/admin/stats
Authorization: Bearer <admin_token>
```

### Student Endpoints

#### 1. Get All Courses
```http
GET /api/student/courses
```

#### 2. Get My Purchased Courses
```http
GET /api/student/my-courses
Authorization: Bearer <token>
```

#### 3. Get Course Materials
```http
GET /api/student/courses/:courseId/materials
Authorization: Bearer <token>
```

#### 4. Download Study Material
```http
GET /api/student/materials/:materialId/download
Authorization: Bearer <token>
```

#### 5. Get Free Materials
```http
GET /api/student/materials/free
```

#### 6. Get Course Quizzes
```http
GET /api/student/courses/:courseId/quizzes
Authorization: Bearer <token>
```

#### 7. Start Quiz
```http
GET /api/student/quizzes/:quizId/start
Authorization: Bearer <token>
```

#### 8. Submit Quiz
```http
POST /api/student/quizzes/:quizId/submit
Authorization: Bearer <token>
Content-Type: application/json

{
  "startTime": "2025-10-10T12:00:00Z",
  "answers": [
    {
      "questionId": "<question_id>",
      "selectedAnswer": 1,
      "timeTaken": 45
    }
    // ... more answers
  ]
}
```

#### 9. Create Payment Order
```http
POST /api/student/payment/create-order
Authorization: Bearer <token>
Content-Type: application/json

{
  "courseId": "<course_id>"
}
```

#### 10. Verify Payment
```http
POST /api/student/payment/verify
Authorization: Bearer <token>
Content-Type: application/json

{
  "orderId": "<razorpay_order_id>",
  "paymentId": "<razorpay_payment_id>",
  "signature": "<razorpay_signature>",
  "courseId": "<course_id>"
}
```

#### 11. Get Student Dashboard
```http
GET /api/student/dashboard
Authorization: Bearer <token>
```

---

## 🎨 Admin Panel Guide

### Accessing Admin Panel
1. Navigate to: `http://localhost:5000/admin.html`
2. Login with admin credentials (from initialization step)

### Uploading PDF Documents

1. Go to "Upload PDF" tab
2. Select the course from dropdown
3. Enter material title
4. Add description (optional)
5. Check "Make this material free" if you want it available to all users
6. Click on upload area to select PDF file
7. Click "Upload Material"

**Notes:**
- Maximum file size: 10MB
- Only PDF files are supported for study materials
- Free materials are accessible without purchase

### Creating Quizzes

1. Go to "Create Quiz" tab
2. Select the course
3. Choose quiz number (1-10)
   - **Quizzes 1-8:** Automatically set to 50 questions, 2 hours
   - **Quizzes 9-10:** Automatically set to 100 questions, 3 hours
4. Enter quiz title and description
5. Fill in all questions:
   - Question text
   - 4 options (A, B, C, D)
   - Select correct answer
   - Add explanation (optional)
6. Click "Create Quiz"

**Important:**
- You must provide exactly 50 or 100 questions based on quiz number
- Each question requires 4 options
- Only one correct answer per question
- Quiz duration is automatic (2h for 50q, 3h for 100q)

---

## 👨‍🎓 Student Dashboard Guide

### Registration and Login
1. Register new account via API or registration page
2. Login with email and password
3. Receive JWT token for authentication

### Dashboard Features

**Statistics Display:**
- Total courses purchased
- Total quizzes attempted
- Quizzes passed
- Average score across all attempts

**My Courses Section:**
- View all purchased courses
- See study progress percentage
- Access course materials
- Start quizzes

**Study Progress Tracking:**
- Automatically tracked when you download materials
- Progress percentage calculated based on completed materials
- Last accessed date for each course

---

## 📝 Quiz System

### Quiz Configuration
- **Quizzes 1-8:** 50 questions, 2 hours (7200 seconds)
- **Quizzes 9-10:** 100 questions, 3 hours (10800 seconds)
- **Passing Percentage:** 60%
- **Question Type:** Multiple Choice (4 options)

### Taking a Quiz

1. **Start Quiz:**
   - Click on quiz from course page
   - Timer starts automatically
   - Questions are displayed

2. **During Quiz:**
   - Answer all questions
   - Timer countdown is shown
   - Can skip and come back to questions

3. **Submit Quiz:**
   - Click submit when done
   - Or auto-submit when time expires
   - Immediate results displayed

4. **Results:**
   - Total score (percentage)
   - Correct/Incorrect/Unanswered count
   - Pass/Fail status
   - Detailed answers with explanations

### Quiz Attempt History
- View all past attempts
- See scores and pass status
- Review answers and explanations
- Track improvement over time

---

## 💳 Payment Integration

### Setup Razorpay

1. **Create Razorpay Account:**
   - Visit: https://dashboard.razorpay.com/
   - Sign up for an account

2. **Get API Keys:**
   - Go to Settings → API Keys
   - Generate Test/Live keys
   - Copy Key ID and Key Secret

3. **Configure in .env:**
```env
RAZORPAY_KEY_ID=rzp_test_xxxxxxxxxxxx
RAZORPAY_KEY_SECRET=xxxxxxxxxxxxxxxxxxxx
```

### Payment Flow

1. **Student selects course**
2. **Click "Buy Now"** → Creates Razorpay order
3. **Razorpay Checkout opens** → Student enters payment details
4. **Payment processed** → Razorpay sends confirmation
5. **Backend verifies signature** → Ensures payment is legit
6. **Course enrolled** → Student gets immediate access
7. **Confirmation email** (optional) → Send receipt

### Testing Payments

**Test Card Details:**
- Card Number: 4111 1111 1111 1111
- CVV: Any 3 digits
- Expiry: Any future date
- Name: Any name

---

## 💾 Database Schema

### User Model
```javascript
{
  name: String,
  email: String (unique),
  password: String (hashed),
  phone: String,
  role: ['student', 'admin'],
  purchasedCourses: [{
    course: ObjectId (ref: Course),
    purchaseDate: Date,
    paymentId: String,
    amount: Number,
    status: ['pending', 'completed', 'failed']
  }],
  studyProgress: [{
    course: ObjectId,
    completedMaterials: [ObjectId],
    progressPercentage: Number,
    lastAccessed: Date
  }],
  quizAttempts: [ObjectId (ref: QuizAttempt)],
  isActive: Boolean,
  lastLogin: Date
}
```

### Course Model
```javascript
{
  title: String,
  description: String,
  category: ['NISM', 'NCFM', 'Financial Planning'],
  subcategory: String,
  price: Number,
  duration: String,
  features: [String],
  studyMaterials: [ObjectId],
  quizzes: [ObjectId],
  totalQuizzes: Number (default: 10),
  isActive: Boolean,
  enrolledStudents: Number
}
```

### Quiz Model
```javascript
{
  course: ObjectId,
  title: String,
  quizNumber: Number (1-10),
  questionCount: Number (50 or 100),
  duration: Number (seconds),
  passingPercentage: Number (60),
  questions: [{
    questionText: String,
    options: [{
      optionText: String,
      isCorrect: Boolean
    }],
    correctAnswer: Number (0-3),
    explanation: String
  }],
  isActive: Boolean
}
```

### QuizAttempt Model
```javascript
{
  user: ObjectId,
  quiz: ObjectId,
  course: ObjectId,
  answers: [{
    questionId: ObjectId,
    selectedAnswer: Number,
    isCorrect: Boolean,
    timeTaken: Number
  }],
  score: Number,
  correctAnswers: Number,
  incorrectAnswers: Number,
  unanswered: Number,
  passed: Boolean,
  startTime: Date,
  endTime: Date,
  timeTaken: Number (seconds)
}
```

### StudyMaterial Model
```javascript
{
  course: ObjectId,
  title: String,
  description: String,
  type: ['pdf', 'video', 'document'],
  fileName: String,
  filePath: String,
  fileSize: Number,
  isFree: Boolean,
  order: Number,
  downloads: Number,
  isActive: Boolean,
  uploadedBy: ObjectId
}
```

---

## 🧪 Testing

### Manual Testing

1. **Test Admin Functions:**
```bash
# Login as admin
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@nismstudy.com","password":"Admin@123456"}'

# Upload PDF (use Postman or admin panel)
# Create quiz (use admin panel)
```

2. **Test Student Functions:**
```bash
# Register student
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Test Student","email":"student@test.com","password":"test123","phone":"9876543210"}'

# Login
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"student@test.com","password":"test123"}'
```

---

## 🔒 Security Features

1. **Password Hashing:** bcrypt with salt rounds
2. **JWT Authentication:** Secure token-based auth
3. **Session Management:** MongoDB session store
4. **Input Validation:** Express-validator
5. **File Upload Validation:** File type and size restrictions
6. **Payment Verification:** Razorpay signature verification
7. **CORS Configuration:** Controlled cross-origin requests

---

## 📞 Support

For issues or questions:
- Email: support@nismstudy.com
- Check server logs for debugging
- Review API responses for error messages

---

## 📝 Summary

You now have a complete backend system with:
- ✅ Admin panel for easy PDF uploads and quiz management
- ✅ Student authentication and personalized dashboards
- ✅ 10 quizzes per course (8×50q + 2×100q) with timers
- ✅ 60% passing percentage
- ✅ Free study materials section
- ✅ Payment gateway integration
- ✅ Logout functionality
- ✅ Complete API documentation

**Next Steps:**
1. Set up MongoDB database
2. Configure environment variables
3. Initialize database with sample data
4. Start the server
5. Access admin panel and begin uploading content

Good luck with NISMSTUDY.COM! 🚀




