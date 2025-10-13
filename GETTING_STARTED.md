# 🚀 Getting Started with NISMSTUDY.COM

**Welcome! This guide will help you get your platform up and running quickly.**

---

## 🎯 What You're Building

A complete online learning platform for NISM, NCFM, and Financial Planning certifications with:
- 👥 Student registration and login
- 📚 Course management
- 📝 Interactive quizzes with timers
- 💳 Payment integration (Razorpay)
- 📊 Progress tracking
- 🎓 Admin portal for content management

---

## ⚡ Quick Start (5 Minutes)

### Option 1: Automated Setup (Windows)

**Just double-click this file:**
```
quick-start-production.bat
```

It will:
1. Install all dependencies
2. Create .env file
3. Seed sample data
4. Create admin account
5. Test the API
6. Start the server

### Option 2: Manual Setup

```bash
# 1. Install dependencies
npm install

# 2. Create .env file
# Copy .env.example to .env and update values

# 3. Seed database
npm run seed

# 4. Create admin account
npm run init-admin

# 5. Start server
npm start
```

**Access your site:** `http://localhost:5000`

---

## 📋 Prerequisites

Before you begin, ensure you have:

### Required
- ✅ **Node.js** (v16 or higher) - [Download](https://nodejs.org)
- ✅ **MongoDB** - Either:
  - Local installation, OR
  - [MongoDB Atlas](https://mongodb.com/atlas) account (Free)

### Optional
- Git (for version control)
- Postman (for API testing)
- VS Code (recommended editor)

---

## 🔧 Detailed Setup

### Step 1: Install Dependencies

```bash
cd c:\Users\croma\nismstudy-website
npm install
```

**New security packages being installed:**
- helmet (security headers)
- express-rate-limit (prevent abuse)
- express-mongo-sanitize (NoSQL injection protection)
- compression (faster responses)
- xss-clean (XSS protection)

### Step 2: Configure Database

#### Option A: MongoDB Atlas (Recommended for Production)

1. **Create Account**
   - Go to [mongodb.com/atlas](https://mongodb.com/atlas)
   - Sign up for free

2. **Create Cluster**
   - Click "Build a Database"
   - Choose FREE tier
   - Select region closest to you
   - Click "Create Cluster"

3. **Setup Access**
   - Click "Database Access" → Add User
   - Username: `nismstudy`
   - Password: Generate secure password
   - Database User Privileges: Read and write to any database

4. **Whitelist IP**
   - Click "Network Access" → Add IP Address
   - Allow access from anywhere: `0.0.0.0/0`
   - (Or add specific IPs for security)

5. **Get Connection String**
   - Click "Database" → "Connect"
   - Choose "Connect your application"
   - Copy the connection string
   - Replace `<password>` with your actual password

#### Option B: Local MongoDB

1. **Install MongoDB**
   - Download from [mongodb.com/download](https://www.mongodb.com/try/download/community)
   - Install and start MongoDB service

2. **Connection String**
   ```
   mongodb://localhost:27017/nismstudy
   ```

### Step 3: Create .env File

Create `.env` in root directory:

```env
# Server Configuration
PORT=5000
NODE_ENV=development
FRONTEND_URL=http://localhost:5000

# Database Connection
# Replace with your actual MongoDB connection string
MONGODB_URI=mongodb+srv://nismstudy:YOUR_PASSWORD@cluster0.xxxxx.mongodb.net/nismstudy

# Security Secrets
# Generate these: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
JWT_SECRET=your_generated_jwt_secret_here
SESSION_SECRET=your_generated_session_secret_here

# Admin Account
ADMIN_EMAIL=admin@nismstudy.com
ADMIN_PASSWORD=YourStrongPassword@123

# Razorpay Payment Gateway
# Get from: https://dashboard.razorpay.com/app/keys
RAZORPAY_KEY_ID=rzp_test_xxxxxxxxxxxxx
RAZORPAY_KEY_SECRET=your_razorpay_secret_key

# File Upload Settings
MAX_FILE_SIZE=10485760
UPLOAD_PATH=./uploads

# Quiz Settings
QUIZ_50_QUESTIONS_TIME=7200
QUIZ_100_QUESTIONS_TIME=10800
PASSING_PERCENTAGE=60
```

**Generate Secure Secrets:**
```bash
# Run these commands to generate random secrets
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### Step 4: Initialize Database

```bash
# Add sample courses and materials
npm run seed
```

This creates:
- 6 courses (NISM Series V-A, VIII, NCFM modules, CFP, etc.)
- 3 free study materials
- 12 sample quizzes

### Step 5: Create Admin Account

```bash
npm run init-admin
```

Follow the prompts or it will use credentials from `.env`.

### Step 6: Test Everything

```bash
# Run automated API tests
npm run test
```

You should see:
```
✅ Health Check - Passed
✅ User Registration - Passed
✅ User Login - Passed
✅ Get Courses - Passed
✅ Get Dashboard - Passed
...
```

### Step 7: Start Server

```bash
# Development server
npm start

# Or production server (with enhanced security)
npm run start:prod
```

**Success!** You should see:
```
🚀 Server running on port 5000
✅ MongoDB Connected
✨ NISMSTUDY.COM Backend is ready!
```

---

## 🌐 Access Your Platform

### Main Website
```
http://localhost:5000
```

### Student Pages
- **Login:** `http://localhost:5000/login.html`
- **Register:** `http://localhost:5000/register.html`
- **Dashboard:** `http://localhost:5000/public/dashboard.html`

### Admin Panel
```
http://localhost:5000/public/admin-panel.html
```

**Login with:**
- Email: admin@nismstudy.com
- Password: [Your password from .env]

### API Endpoints
- **Health Check:** `http://localhost:5000/api/health`
- **Get Courses:** `http://localhost:5000/api/student/courses`
- **Free Materials:** `http://localhost:5000/api/student/materials/free`

---

## 🧪 Testing Your Setup

### 1. Check Server Health
Open browser: `http://localhost:5000/api/health`

Should return:
```json
{
  "success": true,
  "message": "Server is running",
  "database": "connected"
}
```

### 2. Register New Student
1. Go to `http://localhost:5000/register.html`
2. Fill in details
3. Submit form
4. Should redirect to dashboard

### 3. Login as Admin
1. Go to `http://localhost:5000/login.html`
2. Email: admin@nismstudy.com
3. Password: [Your password]
4. Should redirect to admin panel

### 4. Browse Courses
1. Go to main page: `http://localhost:5000`
2. Scroll to courses section
3. Should see 6 sample courses

---

## 💳 Setup Razorpay (For Payments)

### Get Test Keys

1. **Create Account**
   - Go to [razorpay.com](https://razorpay.com)
   - Sign up for account

2. **Get Test Keys**
   - Login to Dashboard
   - Go to Settings → API Keys
   - Generate Test Keys
   - Copy Key ID and Key Secret

3. **Update .env**
   ```env
   RAZORPAY_KEY_ID=rzp_test_xxxxxxxxxxxxx
   RAZORPAY_KEY_SECRET=your_test_secret_key
   ```

4. **Restart Server**
   ```bash
   npm start
   ```

### Test Payment

1. Login as student
2. Select a course
3. Click "Make Payment"
4. Razorpay checkout opens
5. Use test card:
   - Card: 4111 1111 1111 1111
   - Expiry: Any future date
   - CVV: Any 3 digits
6. Complete payment
7. Course should unlock automatically

---

## 📚 Next Steps

### Week 1: Learn the System
- [ ] Explore admin panel
- [ ] Create a test course
- [ ] Upload a PDF material
- [ ] Create a quiz
- [ ] Register as student and test

### Week 2: Add Your Content
- [ ] Replace sample courses with real courses
- [ ] Upload actual study materials
- [ ] Create real quiz questions
- [ ] Set proper pricing

### Week 3: Configure Payments
- [ ] Complete Razorpay KYC
- [ ] Switch to Live keys
- [ ] Test real payments (small amount)
- [ ] Setup webhook

### Week 4: Go Live
- [ ] Choose hosting (Render/Railway/DigitalOcean)
- [ ] Deploy application
- [ ] Configure domain
- [ ] Setup SSL certificate
- [ ] Launch! 🚀

---

## 📖 Documentation Guide

### For Setup & Configuration
1. **GETTING_STARTED.md** (This file) - Quick start guide
2. **PRODUCTION_SETUP_GUIDE.md** - Detailed setup instructions
3. **IMPROVEMENTS_SUMMARY.md** - What's new and improved

### For Development
4. **PRODUCTION_ROADMAP_30DAYS.md** - 30-day launch plan
5. **BACKEND_DOCUMENTATION.md** - API reference
6. **PROJECT_SUMMARY.md** - Feature overview

### For Deployment
7. **DEPLOYMENT_GUIDE.md** - Hosting options
8. **.env.production.example** - Production config template

### For Maintenance
9. **README.md** - Project overview
10. **SITE_NAVIGATION_MAP.md** - Site structure

---

## 🆘 Troubleshooting

### Server Won't Start

**Problem:** Error when running `npm start`

**Solutions:**
1. Check if MongoDB is running
2. Verify .env file exists and has correct values
3. Ensure port 5000 is not in use
4. Run `npm install` again

### Database Connection Error

**Problem:** "MongoDB connection error"

**Solutions:**
1. Check MONGODB_URI in .env
2. If using Atlas:
   - Verify IP whitelist includes 0.0.0.0/0
   - Check username/password are correct
   - Ensure network connection is working
3. If using local:
   - Start MongoDB service: `mongod`
   - Verify MongoDB is running: `mongo`

### Login Not Working

**Problem:** "Invalid credentials" when logging in

**Solutions:**
1. Run `npm run init-admin` to create admin account
2. Check admin credentials in .env
3. Try registering as new student
4. Check browser console for errors
5. Verify API is responding: `http://localhost:5000/api/health`

### Payment Not Working

**Problem:** Razorpay checkout doesn't open

**Solutions:**
1. Verify RAZORPAY_KEY_ID is set in .env
2. Check browser console for errors
3. Ensure you're using Test keys, not Live keys
4. Check Razorpay dashboard for errors

### Files Not Uploading

**Problem:** Error when uploading PDFs

**Solutions:**
1. Check file size (max 10MB by default)
2. Verify uploads folder exists
3. Check file type is allowed (.pdf, .doc, .docx, etc.)
4. See server logs for specific error

---

## 🎯 Quick Commands Reference

```bash
# Development
npm start              # Start development server
npm run dev            # Start with auto-reload (nodemon)
npm run demo           # Start demo mode (no database)

# Production
npm run start:prod     # Start production server (with security)

# Database
npm run init-db        # Initialize database (old script)
npm run seed           # Seed sample data
npm run init-admin     # Create admin account

# Testing
npm run test           # Run API tests

# Utilities
npm run backup-db      # Backup database (if implemented)
npm install            # Install/update dependencies
```

---

## 🌟 Features Ready to Use

### Student Features
✅ User registration and login  
✅ Browse all courses  
✅ Download free materials  
✅ Purchase courses with Razorpay  
✅ Access purchased course materials  
✅ Take quizzes with timer  
✅ View quiz results with explanations  
✅ Track progress  
✅ View personal dashboard  

### Admin Features
✅ Admin login  
✅ Create and manage courses  
✅ Upload study materials (PDFs)  
✅ Create quizzes (50 or 100 questions)  
✅ Add quiz questions via API  
✅ View statistics  
✅ Manage users  
✅ View payment history  

### Technical Features
✅ Secure authentication (JWT)  
✅ Role-based access control  
✅ Payment integration (Razorpay)  
✅ File upload system  
✅ Session management  
✅ Rate limiting  
✅ Security headers  
✅ MongoDB integration  

---

## 📱 Mobile Testing

Your site is responsive! Test on mobile:

1. Get your local IP: `ipconfig` (Windows) or `ifconfig` (Mac/Linux)
2. On mobile browser: `http://YOUR_IP:5000`
3. Test all features work on mobile

---

## 🔒 Security Checklist

Before going live, ensure:

- [x] Using production-ready .env
- [x] Strong JWT and session secrets
- [x] Changed default admin password
- [x] Razorpay Live keys (not test)
- [x] HTTPS enabled
- [x] Rate limiting active
- [x] CORS properly configured
- [x] File upload restrictions in place

---

## 🎉 You're Ready!

Your NISMSTUDY.COM platform is now:
- ✅ Fully functional
- ✅ Secure
- ✅ Ready for testing
- ✅ Prepared for production

**Start using it:**
1. Open `http://localhost:5000`
2. Register as a student
3. Login as admin
4. Explore all features

**Next milestone:** Deploy to production!

---

## 💬 Need Help?

1. Check troubleshooting section above
2. Review documentation files
3. Check server logs for errors
4. Test individual API endpoints
5. Review configuration in .env

---

## 📊 Progress Tracking

Keep track of your setup:

- [ ] Dependencies installed
- [ ] .env file configured
- [ ] MongoDB connected
- [ ] Database seeded
- [ ] Admin account created
- [ ] Server starts successfully
- [ ] Can login as admin
- [ ] Can register as student
- [ ] Courses visible
- [ ] Razorpay configured
- [ ] Payment flow tested
- [ ] All tests passing

---

**Ready to launch? Follow the PRODUCTION_ROADMAP_30DAYS.md for your path to going live!**

**Good luck! 🚀 Let's make NISMSTUDY.COM a success! 📚**



