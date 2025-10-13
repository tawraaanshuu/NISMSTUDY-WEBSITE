# 🚀 NISMSTUDY.COM - Quick Start Guide

## Prerequisites Check
- ✅ Node.js installed? (Check: `node --version`)
- ✅ MongoDB installed or MongoDB Atlas account ready?
- ✅ Code editor (VS Code recommended)

## Step-by-Step Setup (5 Minutes)

### 1. Install Dependencies (1 min)
```bash
npm install
```

### 2. Configure Environment (2 min)
```bash
# Copy the example file
copy .env.example .env

# Edit .env file and update:
```
**Minimum required changes:**
```env
MONGODB_URI=mongodb://localhost:27017/nismstudy
JWT_SECRET=change_this_to_random_string_abc123xyz
SESSION_SECRET=another_random_string_def456uvw
ADMIN_PASSWORD=YourSecurePassword123

# For payment testing (get from razorpay.com):
RAZORPAY_KEY_ID=your_key_here
RAZORPAY_KEY_SECRET=your_secret_here
```

### 3. Initialize Database (1 min)
```bash
npm run init-db
```
**Output will show:**
- ✅ Admin email and password
- ✅ Sample courses created

### 4. Start Server (1 min)
```bash
npm start
```
**You should see:**
```
✅ MongoDB Connected
🚀 Server running on port 5000
✨ NISMSTUDY.COM Backend is ready!
```

## 🎯 Access Your Application

### Frontend Website
```
http://localhost:5000/
```
- Green-themed NISMSTUDY.COM website
- Browse courses
- View free materials

### Admin Panel
```
http://localhost:5000/admin.html
```
**Login with:**
- Email: `admin@nismstudy.com`
- Password: (from Step 3 output or your .env)

**What you can do:**
- ✅ Upload PDF study materials
- ✅ Create quizzes (50 or 100 questions)
- ✅ Manage courses
- ✅ View statistics

### API Endpoints
```
http://localhost:5000/api/health
```
Test API is working

## 📝 Quick Tasks to Try

### Task 1: Upload Your First PDF (2 minutes)
1. Open admin panel: `http://localhost:5000/admin.html`
2. Login with admin credentials
3. Go to "Upload PDF" tab
4. Select a course
5. Enter title: "Sample Study Material"
6. Upload any PDF file
7. Click "Upload Material"
8. ✅ Success message appears!

### Task 2: Create Your First Quiz (5 minutes)
1. Stay in admin panel
2. Go to "Create Quiz" tab
3. Select a course
4. Choose "Quiz 1" (50 questions)
5. Enter title: "Practice Test 1"
6. Fill in questions:
   - Question text
   - 4 options
   - Select correct answer
   - (Repeat for all 50 questions)
7. Click "Create Quiz"
8. ✅ Quiz created!

### Task 3: Test Student Registration (1 minute)
**Using Postman or curl:**
```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Student",
    "email": "student@test.com",
    "password": "test123",
    "phone": "9876543210"
  }'
```

## 🔧 Troubleshooting

### MongoDB Connection Error
```
Error: connect ECONNREFUSED 127.0.0.1:27017
```
**Solution:** 
- Start MongoDB: `mongod` (or start MongoDB service)
- Or use MongoDB Atlas cloud database

### Port Already in Use
```
Error: Port 5000 is already in use
```
**Solution:**
- Change PORT in .env file to 3000 or 8000
- Or kill process using port 5000

### Admin Login Not Working
**Check:**
1. Did you run `npm run init-db`?
2. Is MongoDB running?
3. Check .env file has correct ADMIN_PASSWORD

### File Upload Fails
**Check:**
1. File size < 10MB?
2. Is it a PDF file?
3. `uploads` folder exists?

## 📚 What's Included?

### ✅ All 8 Requirements Implemented:

1. **PDF Upload System**
   - Easy-to-use admin interface
   - Drag & drop support
   - File validation
   - Storage management

2. **Personalized Student Login**
   - JWT authentication
   - Session management
   - Secure password hashing
   - User profile management

3. **10 Quizzes per Course**
   - 8 quizzes: 50 questions each
   - 2 quizzes: 100 questions each
   - All MCQ format
   - Admin can add questions easily

4. **Automatic Quiz Timer**
   - 50 questions: 2 hours (7200 seconds)
   - 100 questions: 3 hours (10800 seconds)
   - Auto-submit on timeout
   - Timer display on frontend

5. **60% Passing Percentage**
   - Automatic calculation
   - Pass/Fail status
   - Score percentage displayed

6. **Free Study Materials Tab**
   - Public access (no login needed)
   - Download tracking
   - Admin can mark materials as free

7. **Payment Gateway Integration**
   - Razorpay setup complete
   - Secure payment verification
   - Automatic course enrollment
   - Transaction tracking

8. **Logout Functionality**
   - Secure session destruction
   - Token invalidation
   - Redirect to homepage

## 📖 Next Steps

### For Development:
1. Read `BACKEND_DOCUMENTATION.md` for full API details
2. Customize course content
3. Upload your study materials
4. Create actual quiz questions
5. Test payment flow with Razorpay test mode

### For Production:
1. Get production MongoDB URL
2. Set `NODE_ENV=production` in .env
3. Get Razorpay live keys
4. Configure email service
5. Set up domain and SSL
6. Deploy to server (Heroku, AWS, DigitalOcean)

## 📞 Need Help?

### Common Questions:

**Q: How do I add more courses?**
A: Use POST `/api/admin/courses` endpoint or create via database directly

**Q: Can students attempt quiz multiple times?**
A: Yes! System tracks all attempts and shows best score

**Q: How to make a material free?**
A: Check "Make this material free" when uploading in admin panel

**Q: Where are uploaded files stored?**
A: In `uploads/` folder (automatically created)

**Q: How to change passing percentage?**
A: Edit `Quiz.js` model, default is 60%

### Check These Files:
- `BACKEND_DOCUMENTATION.md` - Complete API docs
- `package.json` - All dependencies
- `server.js` - Main server file
- `.env.example` - Configuration template

## 🎉 You're All Set!

Your NISMSTUDY.COM backend is ready with:
- ✅ Green-themed website
- ✅ Admin panel for content management
- ✅ Student authentication
- ✅ Quiz system with timers
- ✅ Payment integration
- ✅ Complete API

**Start building your content and launch your platform!** 🚀

---

**Questions or Issues?**
- Check documentation files
- Review server logs
- Test API endpoints
- Contact: support@nismstudy.com




