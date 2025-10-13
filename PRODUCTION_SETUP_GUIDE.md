# 🚀 Production Setup Guide - NISMSTUDY.COM

**Complete step-by-step guide to get your website production-ready and live within 30 days**

---

## 📋 Table of Contents

1. [Prerequisites](#prerequisites)
2. [Week 1: Database & Backend Setup](#week-1-database--backend-setup)
3. [Week 2: Content & Features](#week-2-content--features)
4. [Week 3: Payment Integration](#week-3-payment-integration)
5. [Week 4: Testing & Deployment](#week-4-testing--deployment)
6. [Post-Launch](#post-launch)

---

## Prerequisites

Before starting, ensure you have:

- ✅ Node.js (v16 or higher) installed
- ✅ Git installed
- ✅ A code editor (VS Code recommended)
- ✅ MongoDB account (local or Atlas)
- ✅ Domain name purchased (optional for local testing)
- ✅ Razorpay account (for payments)

---

## Week 1: Database & Backend Setup

### Day 1-2: Install Dependencies & Setup Database

#### Step 1: Install Required Packages

```bash
cd c:\Users\croma\nismstudy-website

# Install new dependencies
npm install helmet express-rate-limit express-mongo-sanitize compression xss-clean validator
```

#### Step 2: Setup MongoDB Atlas (Production Database)

**Option A: MongoDB Atlas (Recommended for Production)**

1. Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Sign up / Login
3. Create a new cluster (Free tier is fine for starting)
4. Click "Connect" → "Connect your application"
5. Copy the connection string

**Option B: Local MongoDB (For Development)**

1. Install MongoDB Community Edition
2. Start MongoDB: `mongod`
3. Connection string: `mongodb://localhost:27017/nismstudy`

#### Step 3: Configure Environment Variables

Create `.env` file in root directory:

```env
# Copy from .env.example and update these values

# Server
NODE_ENV=production
PORT=5000
FRONTEND_URL=http://localhost:5000

# Database - UPDATE THIS!
MONGODB_URI=mongodb+srv://your_username:your_password@cluster.mongodb.net/nismstudy

# Secrets - GENERATE NEW ONES!
JWT_SECRET=your_super_strong_jwt_secret_here
SESSION_SECRET=your_super_strong_session_secret_here

# Admin Credentials - CHANGE THESE!
ADMIN_EMAIL=admin@nismstudy.com
ADMIN_PASSWORD=YourStrongPassword@123

# Razorpay - Get from Razorpay dashboard
RAZORPAY_KEY_ID=your_razorpay_key_id
RAZORPAY_KEY_SECRET=your_razorpay_key_secret
```

**Generate Strong Secrets:**
```bash
# Generate JWT Secret
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Generate Session Secret  
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### Day 3-4: Initialize Database

#### Step 1: Test Database Connection

```bash
# Start the server to test connection
npm start
```

Look for: `✅ MongoDB Connected`

#### Step 2: Seed Sample Data

```bash
# Add sample courses and materials
npm run seed
```

This will create:
- 6 sample courses (NISM, NCFM, Financial Planning)
- 3 free study materials
- 12 sample quizzes (2 per course)

#### Step 3: Create Admin User

```bash
# Create your admin account
npm run init-admin
```

Follow the prompts or it will use credentials from `.env`

#### Step 4: Verify Setup

```bash
# Run API tests
npm run test
```

All critical tests should pass ✅

### Day 5-7: Switch from Demo to Real Server

#### Update Start Scripts

Your `package.json` already has:
- `npm start` → Uses real database
- `npm run demo` → Demo mode (no database)
- `npm run start:prod` → Production server with security

#### Test Everything Works

1. Start server: `npm start`
2. Open browser: `http://localhost:5000`
3. Try to register a new account
4. Login with admin credentials
5. Check if courses appear

---

## Week 2: Content & Features

### Day 8-10: Admin Portal Setup

#### Access Admin Panel

1. Start server: `npm start`
2. Go to: `http://localhost:5000/admin`
3. Login with admin credentials

#### Upload Course Content

**Via Admin Panel:**
1. Go to "Courses" section
2. Click on a course
3. Upload PDFs, videos, materials
4. Set pricing if needed

**Via API (Postman):**

```
POST /api/admin/study-materials
Authorization: Bearer YOUR_TOKEN
Content-Type: multipart/form-data

Body:
- file: [Choose PDF file]
- title: "Course Material Name"
- description: "Description"
- course: COURSE_ID
- isFree: false
```

#### Create Quizzes

**Via API (Postman):**

1. Create Quiz:
```json
POST /api/admin/quizzes
Authorization: Bearer YOUR_TOKEN
Content-Type: application/json

{
  "course": "COURSE_ID",
  "title": "Mock Test 1",
  "description": "Comprehensive test",
  "quizNumber": 1,
  "totalQuestions": 50,
  "duration": 7200,
  "passingPercentage": 60
}
```

2. Add Questions:
```json
POST /api/admin/quizzes/QUIZ_ID/questions
Authorization: Bearer YOUR_TOKEN
Content-Type: application/json

{
  "questions": [
    {
      "questionText": "What is a mutual fund?",
      "options": [
        "A type of bank account",
        "A pooled investment vehicle",
        "A government scheme",
        "None of the above"
      ],
      "correctAnswer": 1,
      "explanation": "A mutual fund pools money from multiple investors...",
      "marks": 1
    }
  ]
}
```

### Day 11-14: Student Dashboard

#### Test Student Flow

1. **Register New Student**
   - Go to `/register`
   - Fill form and submit
   - Login with credentials

2. **Browse Courses**
   - View all courses
   - Click on course for details
   - See pricing and features

3. **Access Free Materials**
   - Go to Free Materials page
   - Download PDFs
   - No login required

4. **Dashboard Features**
   - View enrolled courses
   - See progress bars
   - Check quiz history
   - View performance

---

## Week 3: Payment Integration

### Day 15-17: Setup Razorpay

#### Step 1: Create Razorpay Account

1. Go to [Razorpay](https://razorpay.com)
2. Sign up for business account
3. Complete KYC (for production)

#### Step 2: Get API Keys

1. Login to Dashboard
2. Go to Settings → API Keys
3. Generate keys (Test and Live mode)
4. Copy both keys

#### Step 3: Configure in Application

Update `.env`:
```env
# Test Mode (for testing)
RAZORPAY_KEY_ID=rzp_test_xxxxxxxxxxxxx
RAZORPAY_KEY_SECRET=your_test_secret_key

# Later switch to Live Mode
# RAZORPAY_KEY_ID=rzp_live_xxxxxxxxxxxxx
# RAZORPAY_KEY_SECRET=your_live_secret_key
```

#### Step 4: Test Payment Flow

1. **Student logs in**
2. **Selects a course**
3. **Clicks "Make Payment"**
4. **Razorpay checkout opens**
5. **Uses test card:** 4111 1111 1111 1111, any future date, any CVV
6. **Payment succeeds**
7. **Course unlocks automatically**

#### Step 5: Setup Webhook (Important!)

1. Go to Razorpay Dashboard → Webhooks
2. Add webhook URL: `https://yourdomain.com/api/payment/webhook`
3. Select events: `payment.captured`, `payment.failed`
4. Copy webhook secret
5. Add to `.env`:
```env
RAZORPAY_WEBHOOK_SECRET=your_webhook_secret
```

### Day 18-21: Quiz System Testing

#### Test Quiz Flow

1. Student purchases course
2. Goes to course page
3. Clicks "Start Quiz"
4. Timer starts (2 or 3 hours)
5. Answer questions
6. Submit or auto-submit on timeout
7. View results immediately
8. See correct answers with explanations

#### Quiz Features to Verify

- ✅ Timer countdown works
- ✅ Question navigation works
- ✅ Mark for review works
- ✅ Auto-submit on timeout
- ✅ Score calculation correct
- ✅ Pass/fail logic (60%)
- ✅ Results show explanations

---

## Week 4: Testing & Deployment

### Day 22-24: Comprehensive Testing

#### API Testing

```bash
# Run automated tests
npm run test
```

#### Manual Testing Checklist

**Authentication:**
- [ ] Register new user
- [ ] Login with correct credentials
- [ ] Login fails with wrong credentials
- [ ] Logout works
- [ ] Session persists on refresh

**Student Features:**
- [ ] View all courses
- [ ] Course details load correctly
- [ ] Purchase flow works
- [ ] Dashboard shows data
- [ ] Quiz system works
- [ ] Results are accurate
- [ ] Progress tracking works

**Admin Features:**
- [ ] Admin login works
- [ ] Can create courses
- [ ] Can upload materials
- [ ] Can create quizzes
- [ ] Can add questions
- [ ] Can view statistics
- [ ] Can manage users

**Payment:**
- [ ] Razorpay checkout opens
- [ ] Test payment succeeds
- [ ] Course unlocks after payment
- [ ] Payment history shows
- [ ] Webhook handles events

### Day 25-27: Security Hardening

#### Enable Production Server

```bash
# Use production server with all security features
npm run start:prod
```

#### Security Checklist

- [x] Helmet.js enabled (security headers)
- [x] Rate limiting on all routes
- [x] CORS configured properly
- [x] MongoDB injection protection
- [x] XSS protection
- [x] HTTPS (add in deployment)
- [x] Strong passwords enforced
- [x] JWT tokens expire
- [x] Sessions secured
- [x] File upload restrictions

#### Update .gitignore

Ensure sensitive files are not committed:

```gitignore
# Add to .gitignore if not already
.env
.env.local
.env.production
node_modules/
uploads/pdfs/
uploads/videos/
*.log
```

### Day 28-30: Production Deployment

#### Option 1: Deploy to Render (Easiest)

1. Push code to GitHub:
```bash
git add .
git commit -m "Production ready"
git push origin main
```

2. Go to [Render](https://render.com)
3. Sign up with GitHub
4. New → Web Service
5. Connect your repository
6. Configure:
   - Build Command: `npm install`
   - Start Command: `npm run start:prod`
7. Add environment variables (copy from `.env`)
8. Deploy!

#### Option 2: Deploy to Railway

1. Go to [Railway](https://railway.app)
2. New Project → Deploy from GitHub
3. Select repository
4. Add environment variables
5. Deploy automatically

#### Option 3: Deploy to DigitalOcean

1. Create Droplet (Ubuntu 22.04)
2. SSH into server
3. Install Node.js, MongoDB, PM2
4. Clone repository
5. Configure Nginx
6. Setup SSL with Let's Encrypt
7. Start with PM2

Detailed steps in [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md)

#### Configure Domain

**If using custom domain:**

1. Go to your domain registrar (GoDaddy, Namecheap, etc.)
2. Add DNS records:
```
Type: A
Name: @
Value: YOUR_SERVER_IP

Type: A
Name: www
Value: YOUR_SERVER_IP
```
3. Wait 24-48 hours for propagation

#### Setup SSL Certificate

**If using Render/Railway:** Automatic ✅

**If using own server:**
```bash
sudo certbot --nginx -d nismstudy.com -d www.nismstudy.com
```

#### Final Production Checklist

- [ ] MongoDB Atlas configured (production cluster)
- [ ] Environment variables set
- [ ] Razorpay in LIVE mode
- [ ] Domain configured
- [ ] SSL certificate active
- [ ] Admin account created
- [ ] Sample content uploaded
- [ ] All tests passing
- [ ] Error monitoring setup (optional: Sentry)
- [ ] Backups configured
- [ ] Analytics added (optional: Google Analytics)

---

## Post-Launch

### Day 31+: Monitor & Maintain

#### Daily Tasks (Week 1 after launch)
- Check server uptime
- Monitor error logs
- Check payment status
- Respond to user queries

#### Weekly Tasks
- Review user analytics
- Check database backups
- Monitor performance
- Update content

#### Monthly Tasks
- Review and optimize
- Add new courses
- Update quiz questions
- Analyze revenue

### Monitoring Setup

**Uptime Monitoring:**
- Use [UptimeRobot](https://uptimerobot.com) (Free)
- Add URL: https://yourdomain.com/api/health
- Get alerts if down

**Error Tracking:**
- Use [Sentry](https://sentry.io) (Free tier)
- Get notified of errors in production

**Analytics:**
- Add Google Analytics to track users
- Monitor which courses are popular

### Backup Strategy

**Database Backups:**
- MongoDB Atlas: Automatic daily backups ✅
- Manual backup command:
```bash
npm run backup-db
```

**File Backups:**
- Backup `uploads/` folder weekly
- Store on cloud storage (Google Drive, AWS S3)

---

## 🆘 Troubleshooting

### Server won't start
```bash
# Check if MongoDB is connected
# Check .env file has correct values
# Check port 5000 is not in use
netstat -ano | findstr :5000
```

### Database connection error
```bash
# Verify MONGODB_URI in .env
# Check MongoDB Atlas whitelist (0.0.0.0/0 for all IPs)
# Test connection:
node -e "require('mongoose').connect(process.env.MONGODB_URI).then(() => console.log('Connected')).catch(e => console.log(e))"
```

### Payment not working
- Check Razorpay keys are correct
- Verify using test mode keys for testing
- Check webhook is configured
- Look at Razorpay dashboard for payment status

### Quiz timer not working
- Check browser console for JavaScript errors
- Verify quiz duration is set correctly in database
- Test in different browsers

---

## 📞 Support & Resources

### Documentation
- [Production Roadmap](./PRODUCTION_ROADMAP_30DAYS.md)
- [Deployment Guide](./DEPLOYMENT_GUIDE.md)
- [Backend Documentation](./BACKEND_DOCUMENTATION.md)
- [API Documentation](./SETUP_AND_USAGE_GUIDE.md)

### Useful Commands
```bash
npm start              # Start server
npm run start:prod     # Start production server
npm run demo           # Start demo mode
npm run init-admin     # Create admin user
npm run seed           # Seed sample data
npm run test           # Run API tests
```

### External Resources
- [MongoDB Atlas Docs](https://docs.atlas.mongodb.com)
- [Razorpay Documentation](https://razorpay.com/docs)
- [Express.js Guide](https://expressjs.com/en/guide/routing.html)
- [Mongoose Docs](https://mongoosejs.com/docs/guide.html)

---

## 🎉 Success Criteria

**Your website is ready for launch when:**

1. ✅ All tests pass (`npm run test`)
2. ✅ Admin can login and manage content
3. ✅ Students can register and enroll
4. ✅ Payment integration works
5. ✅ Quizzes function correctly
6. ✅ Database is properly backed up
7. ✅ SSL certificate is active
8. ✅ Domain is configured
9. ✅ Mobile responsive
10. ✅ No critical bugs

---

**🚀 Ready to launch? Let's make NISMSTUDY.COM a success!**

For questions or issues, refer to the troubleshooting section or documentation files.

**Good luck! 🎓📚**



