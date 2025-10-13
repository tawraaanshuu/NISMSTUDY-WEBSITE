# NISMSTUDY.COM - Complete Backend System

## 🎉 Congratulations! Your Backend is Ready

This folder contains a **complete full-stack application** for NISMSTUDY.COM with all the features you requested.

## ✅ All Requirements Implemented

### 1. ✅ Easy PDF Upload for Admin
- Beautiful admin panel with drag-and-drop interface
- Upload PDFs up to 10MB
- Organize by course
- Mark materials as free or paid

### 2. ✅ Personalized Student Login
- Secure JWT authentication
- Session management
- User profile
- Password encryption with bcrypt

### 3. ✅ 10 Quizzes per Course
- **Quizzes 1-8:** Exactly 50 MCQ questions each
- **Quizzes 9-10:** Exactly 100 MCQ questions each
- Admin can easily create and manage all quizzes

### 4. ✅ Automatic Quiz Timer
- **50 questions:** 2 hours (7200 seconds)
- **100 questions:** 3 hours (10800 seconds)
- Timer starts when quiz begins
- Auto-submit when time expires

### 5. ✅ 60% Passing Percentage
- Automatic score calculation
- Pass/Fail status based on 60%
- Detailed results shown after quiz

### 6. ✅ Free Study Materials Download
- Public section for free materials
- No login required for free content
- Download tracking

### 7. ✅ Payment Gateway Integration
- Razorpay integration complete
- Secure payment verification
- Automatic course enrollment after payment
- Transaction tracking

### 8. ✅ Logout Functionality
- Secure logout from student dashboard
- Session destruction
- Token invalidation

## 📁 Project Structure

```
nismstudy-website/
├── models/              # Database models
│   ├── User.js          # User model (students & admin)
│   ├── Course.js        # Course model
│   ├── Quiz.js          # Quiz model
│   ├── QuizAttempt.js   # Quiz attempt tracking
│   └── StudyMaterial.js # Study materials model
├── controllers/         # Business logic
│   ├── authController.js    # Authentication
│   ├── adminController.js   # Admin functions
│   └── studentController.js # Student functions
├── routes/              # API routes
│   ├── authRoutes.js    # Auth endpoints
│   ├── adminRoutes.js   # Admin endpoints
│   └── studentRoutes.js # Student endpoints
├── middleware/          # Custom middleware
│   ├── auth.js          # Authentication middleware
│   ├── upload.js        # File upload middleware
│   └── validation.js    # Validation & error handling
├── config/              # Configuration
│   └── database.js      # MongoDB connection
├── public/              # Frontend files
│   ├── admin.html       # Admin panel UI
│   └── admin-script.js  # Admin panel JS
├── scripts/             # Utility scripts
│   └── initDatabase.js  # Database initialization
├── uploads/             # Uploaded files (created automatically)
├── server.js            # Main server file
├── package.json         # Dependencies
├── .env                 # Environment variables
├── .env.example         # Environment template
├── QUICK_START.md       # Quick setup guide
└── BACKEND_DOCUMENTATION.md  # Complete API docs
```

## 🚀 Quick Start (Under 5 Minutes)

### Step 1: Install Dependencies
```bash
npm install
```

### Step 2: Setup MongoDB
**Option A - Local MongoDB:**
```bash
# Make sure MongoDB is running
mongod
```

**Option B - MongoDB Atlas (Cloud):**
1. Create free account at mongodb.com
2. Get connection string
3. Update `.env` file with your MongoDB URI

### Step 3: Initialize Database
```bash
npm run init-db
```
This creates:
- Admin user (login credentials will be shown)
- Sample courses

### Step 4: Start Server
```bash
npm start
```

Server starts at: **http://localhost:5000**

### Step 5: Open Admin Panel
```
http://localhost:5000/admin.html
```
Login with the admin credentials from Step 3

## 🎯 What You Can Do Now

### As Admin:
1. **Upload PDFs:**
   - Go to admin panel
   - Click "Upload PDF" tab
   - Select course, add title, upload file
   - Mark as free if you want public access

2. **Create Quizzes:**
   - Click "Create Quiz" tab
   - Select course and quiz number (1-10)
   - Add 50 or 100 questions (automatic based on quiz number)
   - Each question: text + 4 options + correct answer
   - Submit to create

3. **Manage Content:**
   - View statistics dashboard
   - See enrolled students
   - Track quiz attempts
   - Monitor downloads

### As Student (via API):
1. **Register:** POST `/api/auth/register`
2. **Login:** POST `/api/auth/login`
3. **Browse Courses:** GET `/api/student/courses`
4. **Purchase Course:** POST `/api/student/payment/create-order`
5. **Access Materials:** GET `/api/student/courses/:id/materials`
6. **Take Quiz:** GET `/api/student/quizzes/:id/start`
7. **View Dashboard:** GET `/api/student/dashboard`

## 📡 API Base URL
```
http://localhost:5000/api
```

### Key Endpoints:

**Authentication:**
- POST `/api/auth/register` - Register student
- POST `/api/auth/login` - Login
- POST `/api/auth/logout` - Logout
- GET `/api/auth/me` - Get current user

**Admin:**
- POST `/api/admin/study-materials` - Upload PDF
- POST `/api/admin/quizzes` - Create quiz
- GET `/api/admin/stats` - Dashboard statistics

**Student:**
- GET `/api/student/courses` - All courses
- GET `/api/student/my-courses` - Purchased courses
- GET `/api/student/materials/free` - Free materials
- POST `/api/student/quizzes/:id/submit` - Submit quiz
- GET `/api/student/dashboard` - Student dashboard

## 💳 Payment Setup (Razorpay)

1. **Get Razorpay Account:**
   - Visit: https://dashboard.razorpay.com/
   - Sign up (free for testing)

2. **Get API Keys:**
   - Go to Settings → API Keys
   - Generate test keys (for development)
   - Copy Key ID and Secret

3. **Update .env:**
```env
RAZORPAY_KEY_ID=rzp_test_xxxxxxxxxxxxx
RAZORPAY_KEY_SECRET=xxxxxxxxxxxxxxxxxxxxxxx
```

4. **Test Payments:**
   - Use test card: 4111 1111 1111 1111
   - Any CVV and future expiry date

## 🔐 Security Features

- ✅ Password hashing with bcrypt
- ✅ JWT token authentication
- ✅ Session management
- ✅ Input validation
- ✅ File upload restrictions
- ✅ Payment signature verification
- ✅ CORS configuration

## 📚 Documentation Files

1. **QUICK_START.md** - 5-minute setup guide
2. **BACKEND_DOCUMENTATION.md** - Complete API documentation
3. **README_BACKEND.md** - This file (overview)

## 🎨 Frontend Integration

The backend works with:
- The green-themed website (index.html)
- Admin panel (public/admin.html)
- Any React/Vue/Angular frontend
- Mobile apps (via API)

## 🧪 Testing

### Test with Postman:
1. Import endpoints from documentation
2. Test authentication flow
3. Test file upload
4. Test quiz creation
5. Test payment flow

### Test with curl:
```bash
# Register
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Test","email":"test@test.com","password":"test123","phone":"9876543210"}'

# Login
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"test123"}'
```

## 🛠️ Customization

### Change Quiz Settings:
Edit `models/Quiz.js`:
```javascript
passingPercentage: 60  // Change this
```

### Change File Size Limit:
Edit `.env`:
```env
MAX_FILE_SIZE=10485760  # 10MB in bytes
```

### Add More Quiz Time:
Edit `.env`:
```env
QUIZ_50_QUESTIONS_TIME=7200   # 2 hours
QUIZ_100_QUESTIONS_TIME=10800 # 3 hours
```

## 📊 Database Models

- **User:** Students and admins
- **Course:** Course details and content
- **Quiz:** Quiz configuration and questions
- **QuizAttempt:** Student quiz attempts and scores
- **StudyMaterial:** PDF files and documents

## 🚀 Deployment

### For Production:

1. **Update .env:**
```env
NODE_ENV=production
MONGODB_URI=<your-production-mongodb-url>
RAZORPAY_KEY_ID=<live-key>
RAZORPAY_KEY_SECRET=<live-secret>
```

2. **Deploy to:**
- Heroku
- AWS EC2
- DigitalOcean
- Railway
- Render

3. **Set up:**
- Domain name
- SSL certificate
- Email service
- Backup strategy

## 💡 Pro Tips

1. **Backup Database Regularly:**
```bash
mongodump --db nismstudy --out backup/
```

2. **Monitor Server Logs:**
```bash
npm start > logs/server.log 2>&1
```

3. **Use Environment-specific configs:**
- Development: `.env.development`
- Production: `.env.production`

4. **Secure Your Admin:**
- Change default admin password
- Use strong JWT secrets
- Enable rate limiting

## 🐛 Troubleshooting

### MongoDB Connection Issues:
- Check if MongoDB is running
- Verify MONGODB_URI in .env
- Check network/firewall settings

### File Upload Fails:
- Check file size (< 10MB)
- Verify file type (PDF only)
- Ensure uploads folder exists

### Payment Integration Issues:
- Verify Razorpay keys
- Check test mode vs live mode
- Review Razorpay dashboard logs

## 📈 Next Steps

1. ✅ Setup complete - Server running
2. 📝 Upload your course content
3. 📋 Create quiz questions
4. 🎨 Customize frontend if needed
5. 💳 Configure payment gateway
6. 🧪 Test entire flow
7. 🚀 Deploy to production
8. 📢 Launch your platform!

## 🎉 You're Ready!

Your NISMSTUDY.COM backend is **production-ready** with all features implemented:
- Admin can easily upload PDFs ✅
- Students have personalized accounts ✅
- 10 quizzes per course (8×50q + 2×100q) ✅
- Automatic timers (2h/3h) ✅
- 60% passing percentage ✅
- Free materials section ✅
- Payment gateway ready ✅
- Logout works perfectly ✅

**Start uploading content and grow your platform!** 🚀

---

**Need Help?**
- Read BACKEND_DOCUMENTATION.md for detailed API docs
- Check QUICK_START.md for setup instructions
- Review code comments for implementation details

**Contact:** support@nismstudy.com




