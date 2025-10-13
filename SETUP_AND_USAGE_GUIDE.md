# NISMSTUDY.COM - Complete Setup and Usage Guide

## 📋 Table of Contents
1. [Features Overview](#features-overview)
2. [Prerequisites](#prerequisites)
3. [Installation Steps](#installation-steps)
4. [MongoDB Setup](#mongodb-setup)
5. [Starting the Application](#starting-the-application)
6. [Admin Panel Guide](#admin-panel-guide)
7. [Student Portal Guide](#student-portal-guide)
8. [Payment Gateway Integration](#payment-gateway-integration)
9. [API Documentation](#api-documentation)
10. [Troubleshooting](#troubleshooting)

---

## 🎯 Features Overview

### ✅ Implemented Features

**1. Backend System**
- ✅ User authentication (Login/Register/Logout)
- ✅ Role-based access control (Admin/Student)
- ✅ JWT token-based security
- ✅ Session management

**2. Admin Capabilities**
- ✅ Upload PDF study materials easily
- ✅ Create and manage courses
- ✅ Create quizzes (50 or 100 questions)
- ✅ Add questions to quizzes
- ✅ View all users and statistics
- ✅ Dashboard with analytics

**3. Student Features**
- ✅ Personalized dashboard
- ✅ View enrolled courses
- ✅ Track study progress
- ✅ Download free study materials
- ✅ Take quizzes with timer (2hrs for 50Q, 3hrs for 100Q)
- ✅ View quiz results and performance
- ✅ 60% passing percentage

**4. Quiz System**
- ✅ 10 quizzes per course
- ✅ 8 quizzes with 50 questions (2 hour timer)
- ✅ 2 quizzes with 100 questions (3 hour timer)
- ✅ Automatic grading
- ✅ Detailed results with correct answers
- ✅ Performance tracking

**5. Payment Integration**
- ✅ Razorpay payment gateway integration
- ✅ Secure payment verification
- ✅ Payment history tracking
- ✅ Course access after purchase

---

## 📦 Prerequisites

Before you start, make sure you have:

1. **Node.js** (v14 or higher)
   - Download: https://nodejs.org/
   - Verify: `node --version`

2. **npm** (comes with Node.js)
   - Verify: `npm --version`

3. **MongoDB** (Local or Atlas account)
   - See [MongoDB Setup](#mongodb-setup) section

4. **Code Editor** (Optional but recommended)
   - VS Code: https://code.visualstudio.com/

---

## 🚀 Installation Steps

### Step 1: Open Terminal

Open Command Prompt or PowerShell in your project folder:

```bash
cd c:\Users\croma\nismstudy-website
```

### Step 2: Install Dependencies

```bash
npm install
```

This will install all required packages:
- express
- mongoose
- bcryptjs
- jsonwebtoken
- multer
- razorpay
- and more...

### Step 3: Configure Environment Variables

The `.env` file is already set up with default values. You may need to update:

```env
# MongoDB Connection (Update this!)
MONGODB_URI=mongodb://localhost:27017/nismstudy
# OR for Atlas:
# MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/nismstudy

# Razorpay Keys (Add your keys)
RAZORPAY_KEY_ID=your_razorpay_key_id_here
RAZORPAY_KEY_SECRET=your_razorpay_key_secret_here
```

---

## 🗄️ MongoDB Setup

**Choose ONE of the following options:**

### Option A: MongoDB Atlas (Recommended - Free & Easy)

Follow the detailed guide: [MONGODB_SETUP_GUIDE.md](./MONGODB_SETUP_GUIDE.md)

**Quick Steps:**
1. Create account at https://www.mongodb.com/cloud/atlas
2. Create a free cluster
3. Create database user
4. Whitelist IP address
5. Get connection string
6. Update `.env` file

### Option B: Local MongoDB

1. Download and install MongoDB from https://www.mongodb.com/try/download/community
2. Start MongoDB service: `net start MongoDB`
3. Use default connection: `mongodb://localhost:27017/nismstudy`

---

## 🏃 Starting the Application

### Step 1: Initialize Database

**IMPORTANT:** Run this only once to create admin user and sample data:

```bash
npm run init-db
```

You should see:
```
✅ Admin user created successfully!
📧 Email: admin@nismstudy.com
🔑 Password: Admin@123456
```

### Step 2: Start the Server

```bash
npm start
```

For development with auto-reload:
```bash
npm run dev
```

You should see:
```
✅ MongoDB Connected: localhost
🚀 Server running on port 5000
✨ NISMSTUDY.COM Backend is ready!
```

### Step 3: Access the Application

Open your browser:

**Main Website:**
- http://localhost:5000/

**Login Page:**
- http://localhost:5000/login.html

**Admin Panel:**
- http://localhost:5000/login.html?admin=true
- Email: admin@nismstudy.com
- Password: Admin@123456

**Student Dashboard:**
- http://localhost:5000/login.html
- Email: student@test.com
- Password: test123

---

## 👨‍💼 Admin Panel Guide

### Accessing Admin Panel

1. Go to: http://localhost:5000/login.html?admin=true
2. Login with admin credentials
3. You'll be redirected to: http://localhost:5000/public/admin-panel.html

### Dashboard Overview

The admin panel has 4 main tabs:

#### 1. **Courses Tab**

**Create New Course:**
```
1. Fill in course details:
   - Title: e.g., "NISM Series V-A"
   - Description: Course overview
   - Category: NISM/NCFM/Financial Planning
   - Price: in ₹
   - Duration: e.g., "6 months"

2. Click "Create Course"
```

**Manage Courses:**
- View all courses in a table
- See number of materials and quizzes
- Delete courses if needed

#### 2. **Study Materials Tab**

**Upload PDF Documents:**

```
1. Enter material details:
   - Title: e.g., "Chapter 1 - Introduction"
   - Description: Brief overview
   - Course: Select course (or leave empty for free material)
   - Category: Study Material/Notes/Reference
   - Check "Make this material free" for free downloads

2. Click the upload area
3. Select PDF file (max 10MB)
4. Click "Upload Material"
```

**Features:**
- Materials linked to courses are only accessible after purchase
- Free materials can be downloaded by anyone
- Automatic download tracking

#### 3. **Quizzes Tab**

**Create Quiz:**

```
1. Fill quiz details:
   - Title: e.g., "Quiz 1 - Fundamentals"
   - Description: Quiz overview
   - Course: Select the course
   - Quiz Number: 1-10
   - Total Questions: 50 or 100
      * 50 questions = 2 hour timer
      * 100 questions = 3 hour timer

2. Click "Create Quiz"
```

**Add Questions to Quiz:**

After creating a quiz, you need to add questions. Use the API or create a script:

**Via API (Postman or similar):**
```
POST http://localhost:5000/api/admin/quizzes/:quizId/questions
Authorization: Bearer YOUR_TOKEN

Body (JSON):
{
  "questions": [
    {
      "questionText": "What is the full form of NISM?",
      "options": [
        {"text": "National Institute of Securities Markets", "isCorrect": false},
        {"text": "National Institute of Stock Markets", "isCorrect": true},
        {"text": "National Indian Securities Markets", "isCorrect": false},
        {"text": "None of the above", "isCorrect": false}
      ],
      "correctAnswer": 1,
      "explanation": "NISM stands for National Institute of Stock Markets"
    }
  ]
}
```

**Best Practice:**
- Create 10 quizzes per course
- First 8 quizzes: 50 questions each
- Last 2 quizzes: 100 questions each (final exam style)

#### 4. **Users Tab**

View all registered users:
- Name and email
- Role (Admin/Student)
- Number of purchased courses
- Registration date

---

## 👨‍🎓 Student Portal Guide

### Registration

1. Go to: http://localhost:5000/register.html
2. Fill in details:
   - Full Name
   - Email
   - Phone (optional)
   - Password (min 6 characters)
3. Click "Create Account"

### Student Dashboard

After login, students see:

**Dashboard Stats:**
- Enrolled courses count
- Total quiz attempts
- Passed quizzes
- Success rate percentage

**My Courses Section:**
- All purchased courses
- Progress bar for each course
- "Continue Learning" button

**Recent Quiz Attempts:**
- Last 5 quiz attempts
- Score and pass/fail status
- View detailed results

### Purchasing a Course

1. Browse courses on main website
2. Click "Enroll Now"
3. Login/Register
4. Click "Make Payment"
5. Complete Razorpay payment
6. Course appears in dashboard

### Taking a Quiz

```
1. Go to Course Details page
2. Click on a quiz
3. Click "Start Quiz"
4. Answer questions (timer starts automatically)
5. Use navigation buttons or question palette
6. Click "Submit Quiz" when done
7. View results immediately
```

**Quiz Features:**
- Timer countdown (2 or 3 hours)
- Question palette to navigate
- Mark answers and change them
- Warning when time is running out
- Auto-submit when time expires

### Downloading Study Materials

**Free Materials:**
- Go to: http://localhost:5000/public/free-materials.html
- Click "Download PDF" on any material
- No login required

**Course Materials:**
- Available after purchasing course
- Access from Course Details page
- Click "Download PDF"
- Unlimited downloads

### Progress Tracking

Students can track:
- Overall course progress (%)
- Completed study materials
- Quiz attempts and scores
- Time spent studying

---

## 💳 Payment Gateway Integration

### Setup Razorpay

1. **Create Razorpay Account:**
   - Visit: https://razorpay.com/
   - Sign up and verify your account

2. **Get API Keys:**
   - Go to Dashboard → Settings → API Keys
   - Generate Test Keys (for development)
   - Copy Key ID and Key Secret

3. **Update .env File:**
   ```env
   RAZORPAY_KEY_ID=rzp_test_xxxxxxxxxxxxx
   RAZORPAY_KEY_SECRET=your_secret_key_here
   ```

### Testing Payments

**Test Card Details:**
```
Card Number: 4111 1111 1111 1111
CVV: Any 3 digits
Expiry: Any future date
```

### Payment Flow

1. Student selects course
2. Clicks "Make Payment"
3. Razorpay popup opens
4. Student enters payment details
5. Payment is processed
6. On success: Course is added to student's account
7. Student can immediately access course content

---

## 📚 API Documentation

### Base URL
```
http://localhost:5000/api
```

### Authentication Endpoints

**Register:**
```
POST /api/auth/register
Body: { name, email, password, phone }
```

**Login:**
```
POST /api/auth/login
Body: { email, password }
Response: { token, user }
```

**Logout:**
```
POST /api/auth/logout
Headers: Authorization: Bearer TOKEN
```

### Admin Endpoints

All admin endpoints require:
```
Headers: Authorization: Bearer TOKEN
Role: admin
```

**Create Course:**
```
POST /api/admin/courses
Body: { title, description, category, price, duration }
```

**Upload Material:**
```
POST /api/admin/materials
Content-Type: multipart/form-data
Body: { title, description, courseId, file, isFree }
```

**Create Quiz:**
```
POST /api/admin/quizzes
Body: { title, courseId, totalQuestions, quizNumber }
```

**Add Questions:**
```
POST /api/admin/quizzes/:quizId/questions
Body: { questions: [...] }
```

### Student Endpoints

**Get Dashboard:**
```
GET /api/student/dashboard
Headers: Authorization: Bearer TOKEN
```

**Start Quiz:**
```
POST /api/student/quizzes/:quizId/start
Headers: Authorization: Bearer TOKEN
```

**Submit Quiz:**
```
POST /api/student/attempts/:attemptId/submit
Body: { answers: [{questionId, selectedAnswer}] }
```

### Payment Endpoints

**Create Order:**
```
POST /api/payment/create-order
Body: { courseId }
Response: { orderId, amount, key }
```

**Verify Payment:**
```
POST /api/payment/verify
Body: { razorpay_order_id, razorpay_payment_id, razorpay_signature, courseId }
```

---

## 🔧 Troubleshooting

### Server Won't Start

**Error: "EADDRINUSE: Port 5000 is already in use"**

Solution:
```bash
# Find process using port 5000
netstat -ano | findstr :5000

# Kill the process (replace PID with actual number)
taskkill /PID <PID> /F

# Or use a different port in .env
PORT=3000
```

### MongoDB Connection Issues

**Error: "MongooseServerSelectionError"**

Solutions:
1. Check if MongoDB is running: `net start MongoDB`
2. Verify connection string in `.env`
3. For Atlas: Check IP whitelist and credentials

### Can't Upload Files

**Error: "File upload failed"**

Solutions:
1. Check file size (max 10MB)
2. Ensure uploads folder exists
3. Verify file type is PDF
4. Check disk space

### Quiz Timer Not Working

Solution:
1. Clear browser cache
2. Check browser console for errors
3. Ensure JavaScript is enabled

### Payment Integration Issues

Solutions:
1. Verify Razorpay keys in `.env`
2. Use test mode keys for development
3. Check Razorpay dashboard for error logs

---

## 📝 Best Practices

### For Admins

1. **Organize Courses:**
   - Create courses by category (NISM, NCFM, etc.)
   - Use clear, descriptive titles
   - Set appropriate prices

2. **Upload Materials:**
   - Name files clearly
   - Use consistent naming conventions
   - Test downloads after uploading

3. **Create Quizzes:**
   - Follow the 8+2 structure (8x50Q + 2x100Q)
   - Write clear questions
   - Provide explanations for answers
   - Test quizzes before releasing

4. **Monitor Performance:**
   - Check dashboard regularly
   - Review student progress
   - Update content based on feedback

### For Students

1. **Study Systematically:**
   - Complete materials before quizzes
   - Take quizzes in sequence
   - Review incorrect answers

2. **Time Management:**
   - Don't wait until timer runs out
   - Review answers before submitting
   - Practice with mock tests

3. **Track Progress:**
   - Check dashboard regularly
   - Focus on weak areas
   - Maintain study schedule

---

## 🚀 Deployment (Production)

### Preparing for Production

1. **Update Environment Variables:**
   ```env
   NODE_ENV=production
   MONGODB_URI=<your-atlas-production-url>
   JWT_SECRET=<strong-random-secret>
   SESSION_SECRET=<strong-random-secret>
   FRONTEND_URL=<your-domain>
   ```

2. **Security Checklist:**
   - [ ] Change admin password
   - [ ] Use strong JWT secrets
   - [ ] Enable HTTPS
   - [ ] Restrict MongoDB IP access
   - [ ] Set up firewall rules

3. **Hosting Options:**
   - **Backend:** Heroku, AWS, DigitalOcean, Railway
   - **Database:** MongoDB Atlas (Free tier available)
   - **Storage:** AWS S3 for PDF files (recommended for production)

---

## 📞 Support

### Documentation
- MongoDB: [MONGODB_SETUP_GUIDE.md](./MONGODB_SETUP_GUIDE.md)
- Backend: [BACKEND_DOCUMENTATION.md](./BACKEND_DOCUMENTATION.md)
- Quick Start: [QUICK_START.md](./QUICK_START.md)

### Common Commands

```bash
# Install dependencies
npm install

# Initialize database
npm run init-db

# Start server
npm start

# Development mode (auto-reload)
npm run dev

# Check health
curl http://localhost:5000/api/health
```

---

**🎉 Congratulations! Your NISM Study platform is ready to use!**

Start by:
1. ✅ Initializing the database
2. ✅ Starting the server
3. ✅ Logging in as admin
4. ✅ Uploading your first PDF
5. ✅ Creating your first quiz

Good luck! 🚀



