# 📊 Complete Admin Portal Data Upload Guide

**Step-by-step guide with flowcharts to upload and manage data on NISMSTUDY.COM**

---

## 📋 Table of Contents

1. [Database Setup (MongoDB)](#1-database-setup-mongodb)
2. [Initial Setup & Admin Creation](#2-initial-setup--admin-creation)
3. [Admin Portal Access](#3-admin-portal-access)
4. [Upload Course Data](#4-upload-course-data)
5. [Upload Study Materials (PDFs)](#5-upload-study-materials-pdfs)
6. [Create Quizzes](#6-create-quizzes)
7. [Add Quiz Questions](#7-add-quiz-questions)
8. [Complete Data Flow Diagram](#8-complete-data-flow-diagram)

---

## 1. Database Setup (MongoDB)

### 📊 FLOWCHART: MongoDB Setup

```
┌─────────────────────────────────────────────────────────┐
│           MONGODB SETUP PROCESS                         │
└─────────────────────────────────────────────────────────┘
                        │
                        ▼
        ┌───────────────────────────────┐
        │ Choose MongoDB Option         │
        └───────────────────────────────┘
                        │
            ┌───────────┴───────────┐
            │                       │
            ▼                       ▼
    ┌─────────────┐         ┌─────────────┐
    │ Option A:   │         │ Option B:   │
    │ MongoDB     │         │ Local       │
    │ Atlas       │         │ MongoDB     │
    │ (Cloud)     │         │             │
    │ RECOMMENDED │         │             │
    └─────────────┘         └─────────────┘
            │                       │
            ▼                       ▼
    ┌─────────────────┐    ┌──────────────────┐
    │ 1. Create       │    │ 1. Download      │
    │    Account      │    │    MongoDB       │
    │                 │    │    Community     │
    └─────────────────┘    └──────────────────┘
            │                       │
            ▼                       ▼
    ┌─────────────────┐    ┌──────────────────┐
    │ 2. Create Free  │    │ 2. Install       │
    │    Cluster      │    │    MongoDB       │
    │                 │    │                  │
    └─────────────────┘    └──────────────────┘
            │                       │
            ▼                       ▼
    ┌─────────────────┐    ┌──────────────────┐
    │ 3. Setup User   │    │ 3. Start         │
    │    & Password   │    │    MongoDB       │
    │                 │    │    Service       │
    └─────────────────┘    └──────────────────┘
            │                       │
            ▼                       ▼
    ┌─────────────────┐    ┌──────────────────┐
    │ 4. Whitelist    │    │ Connection:      │
    │    IP Address   │    │ mongodb://       │
    │    (0.0.0.0/0)  │    │ localhost:27017/ │
    └─────────────────┘    │ nismstudy        │
            │               └──────────────────┘
            ▼
    ┌─────────────────┐
    │ 5. Get          │
    │    Connection   │
    │    String       │
    └─────────────────┘
            │
            ▼
    ┌─────────────────────────────────────────┐
    │ mongodb+srv://username:password@        │
    │ cluster.mongodb.net/nismstudy           │
    └─────────────────────────────────────────┘
            │
            ▼
    ┌─────────────────────────────────────────┐
    │ Add to .env file:                       │
    │ MONGODB_URI=connection_string           │
    └─────────────────────────────────────────┘
            │
            ▼
        ┌───────┐
        │ DONE  │
        └───────┘
```

### 🔧 Detailed MongoDB Atlas Setup (RECOMMENDED)

#### Step 1: Create MongoDB Atlas Account

1. **Go to MongoDB Atlas**
   - URL: https://www.mongodb.com/cloud/atlas
   - Click "Try Free" or "Sign Up"

2. **Sign Up**
   ```
   Option 1: Sign up with Google
   Option 2: Sign up with Email
   
   Fill in:
   - First Name
   - Last Name
   - Email Address
   - Password
   - Country
   ```

3. **Verify Email**
   - Check your email
   - Click verification link

#### Step 2: Create Database Cluster

1. **Choose Plan**
   ```
   ✅ Select: Shared (FREE)
   - 512 MB Storage
   - Perfect for development and small production
   ```

2. **Select Provider & Region**
   ```
   Provider: AWS (recommended) or Google Cloud or Azure
   Region: Choose closest to your location
   
   For India:
   ✅ AWS Mumbai (ap-south-1)
   ✅ Google Cloud Mumbai (asia-south1)
   ```

3. **Cluster Name**
   ```
   Default: Cluster0 (you can keep this)
   Or rename to: NISMStudyCluster
   ```

4. **Click "Create Cluster"**
   - Wait 3-5 minutes for cluster creation
   - You'll see "Cluster0 is being created..."

#### Step 3: Setup Database Access

1. **Click "Database Access" (left menu)**

2. **Click "Add New Database User"**

3. **Create User**
   ```
   Authentication Method: Password
   
   Username: nismstudy_admin
   Password: Generate secure password
   
   ✅ Click "Autogenerate Secure Password"
   ⚠️ IMPORTANT: Copy and save this password!
   
   Database User Privileges:
   ✅ Select: "Read and write to any database"
   ```

4. **Click "Add User"**

#### Step 4: Setup Network Access

1. **Click "Network Access" (left menu)**

2. **Click "Add IP Address"**

3. **Allow Access from Anywhere**
   ```
   ✅ Click: "Allow Access from Anywhere"
   
   This adds: 0.0.0.0/0
   
   ⚠️ For production, you can restrict to specific IPs later
   ```

4. **Click "Confirm"**

#### Step 5: Get Connection String

1. **Click "Database" (left menu)**

2. **Click "Connect" button on your cluster**

3. **Choose Connection Method**
   ```
   ✅ Select: "Connect your application"
   ```

4. **Copy Connection String**
   ```
   Driver: Node.js
   Version: 4.1 or later
   
   Connection String:
   mongodb+srv://nismstudy_admin:<password>@cluster0.xxxxx.mongodb.net/nismstudy?retryWrites=true&w=majority
   
   ⚠️ Replace <password> with your actual password!
   ```

5. **Example Connection String**
   ```
   Original:
   mongodb+srv://nismstudy_admin:<password>@cluster0.xxxxx.mongodb.net/nismstudy
   
   After replacing password (example):
   mongodb+srv://nismstudy_admin:Abc123XYZ789@cluster0.xxxxx.mongodb.net/nismstudy
   ```

#### Step 6: Add to .env File

1. **Open your `.env` file**

2. **Update MONGODB_URI**
   ```env
   # Replace this line:
   MONGODB_URI=mongodb://localhost:27017/nismstudy
   
   # With your Atlas connection string:
   MONGODB_URI=mongodb+srv://nismstudy_admin:YourPassword@cluster0.xxxxx.mongodb.net/nismstudy?retryWrites=true&w=majority
   ```

3. **Save the file**

#### Step 7: Test Connection

```bash
# Start your server
npm start

# You should see:
✅ MongoDB Connected: cluster0-xxxxx.mongodb.net
📊 Database Name: nismstudy
```

### 🎯 Database Schema

Your MongoDB database will have these collections:

```
nismstudy (database)
├── users
│   ├── _id
│   ├── name
│   ├── email
│   ├── password (hashed)
│   ├── role (student/admin)
│   ├── purchasedCourses []
│   └── timestamps
│
├── courses
│   ├── _id
│   ├── title
│   ├── description
│   ├── category (NISM/NCFM/Financial Planning)
│   ├── price
│   ├── duration
│   ├── features []
│   ├── studyMaterials []
│   ├── quizzes []
│   └── timestamps
│
├── quizzes
│   ├── _id
│   ├── course (reference)
│   ├── title
│   ├── totalQuestions
│   ├── duration (seconds)
│   ├── passingPercentage
│   ├── questions []
│   │   ├── questionText
│   │   ├── options [4 choices]
│   │   ├── correctAnswer (0-3)
│   │   └── explanation
│   └── timestamps
│
├── studymaterials
│   ├── _id
│   ├── title
│   ├── description
│   ├── course (reference)
│   ├── fileUrl
│   ├── fileName
│   ├── fileSize
│   ├── fileType
│   ├── isFree (boolean)
│   ├── downloads (counter)
│   └── timestamps
│
├── quizattempts
│   ├── _id
│   ├── student (reference)
│   ├── quiz (reference)
│   ├── course (reference)
│   ├── answers []
│   ├── score
│   ├── isPassed
│   ├── startTime
│   ├── endTime
│   └── timestamps
│
├── purchases
│   ├── _id
│   ├── student (reference)
│   ├── course (reference)
│   ├── amount
│   ├── paymentId (Razorpay)
│   ├── orderId (Razorpay)
│   ├── status
│   └── timestamps
│
└── progress
    ├── _id
    ├── student (reference)
    ├── course (reference)
    ├── completedMaterials []
    ├── quizAttempts []
    ├── overallProgress (percentage)
    └── timestamps
```

---

## 2. Initial Setup & Admin Creation

### 📊 FLOWCHART: Initial Setup

```
┌─────────────────────────────────────────────────────────┐
│           INITIAL SETUP PROCESS                         │
└─────────────────────────────────────────────────────────┘
                        │
                        ▼
        ┌───────────────────────────────┐
        │ Install Dependencies          │
        │ Command: npm install          │
        └───────────────────────────────┘
                        │
                        ▼
        ┌───────────────────────────────┐
        │ Create .env File              │
        │ (Add MongoDB URI, secrets)    │
        └───────────────────────────────┘
                        │
                        ▼
        ┌───────────────────────────────┐
        │ Seed Sample Data (Optional)   │
        │ Command: npm run seed         │
        └───────────────────────────────┘
                        │
                        ▼
        ┌───────────────────────────────┐
        │ Create Admin Account          │
        │ Command: npm run init-admin   │
        └───────────────────────────────┘
                        │
                        ▼
            ┌───────────────────┐
            │ Enter Admin Info  │
            │ - Name            │
            │ - Email           │
            │ - Password        │
            └───────────────────┘
                        │
                        ▼
        ┌───────────────────────────────┐
        │ Admin Account Created ✅      │
        │ Saved to Database             │
        └───────────────────────────────┘
                        │
                        ▼
        ┌───────────────────────────────┐
        │ Start Server                  │
        │ Command: npm start            │
        └───────────────────────────────┘
                        │
                        ▼
        ┌───────────────────────────────┐
        │ Server Running on Port 5000   │
        │ http://localhost:5000         │
        └───────────────────────────────┘
                        │
                        ▼
                ┌───────────┐
                │   DONE    │
                └───────────┘
```

### 🔧 Commands

```bash
# Step 1: Install dependencies
npm install

# Step 2: Create .env file
# (Copy .env.example and update values)

# Step 3: Seed sample data (optional)
npm run seed

# Step 4: Create admin account
npm run init-admin

# Step 5: Start server
npm start
```

### 📝 Admin Account Creation Details

When you run `npm run init-admin`, you'll see:

```
============================================================
📋 NISMSTUDY.COM - Create Admin User
============================================================

Enter admin name: Rohit Kumar
Enter admin email: admin@nismstudy.com
Enter admin password (min 6 characters): YourStrongPassword123!

✅ Admin user created successfully!
📋 Details:
   Name: Rohit Kumar
   Email: admin@nismstudy.com
   Role: admin
   ID: 6543210abcdef123456789

============================================================
🎉 You can now login with these credentials!
============================================================
```

---

## 3. Admin Portal Access

### 📊 FLOWCHART: Admin Login Process

```
┌─────────────────────────────────────────────────────────┐
│           ADMIN LOGIN PROCESS                           │
└─────────────────────────────────────────────────────────┘
                        │
                        ▼
        ┌───────────────────────────────┐
        │ Ensure Server is Running      │
        │ Command: npm start            │
        └───────────────────────────────┘
                        │
                        ▼
        ┌───────────────────────────────┐
        │ Open Browser                  │
        │ URL: http://localhost:5000    │
        │      /login.html              │
        └───────────────────────────────┘
                        │
                        ▼
        ┌───────────────────────────────┐
        │ Enter Credentials             │
        │ - Email                       │
        │ - Password                    │
        └───────────────────────────────┘
                        │
                        ▼
        ┌───────────────────────────────┐
        │ Click "Sign In"               │
        └───────────────────────────────┘
                        │
                        ▼
            ┌──────────┴──────────┐
            │                     │
            ▼                     ▼
    ┌──────────────┐      ┌──────────────┐
    │ Valid Admin  │      │ Invalid or   │
    │ Credentials  │      │ Student      │
    └──────────────┘      │ Credentials  │
            │             └──────────────┘
            │                     │
            ▼                     ▼
    ┌──────────────┐      ┌──────────────┐
    │ Redirect to  │      │ Show Error   │
    │ Admin Panel  │      │ Message      │
    └──────────────┘      └──────────────┘
            │                     │
            ▼                     │
    ┌──────────────────────┐     │
    │ /public/admin-panel  │     │
    │      .html           │     │
    └──────────────────────┘     │
            │                     │
            ▼                     │
    ┌──────────────┐              │
    │ Admin        │              │
    │ Dashboard    │              │
    │ Loaded       │              │
    └──────────────┘              │
            │                     │
            ▼                     │
        ┌───────┐                 │
        │ READY │                 │
        └───────┘                 │
                                  ▼
                          ┌──────────────┐
                          │ Try Again    │
                          └──────────────┘
```

### 🔐 Admin Login Steps

1. **Start Server**
   ```bash
   npm start
   ```

2. **Open Browser**
   ```
   http://localhost:5000/login.html
   ```

3. **Enter Admin Credentials**
   ```
   Email: admin@nismstudy.com
   Password: [Your admin password]
   ```

4. **Access Admin Panel**
   - After successful login, you'll be redirected to:
   ```
   http://localhost:5000/public/admin-panel.html
   ```

---

## 4. Upload Course Data

### 📊 FLOWCHART: Course Creation Process

```
┌─────────────────────────────────────────────────────────┐
│           COURSE CREATION PROCESS                       │
└─────────────────────────────────────────────────────────┘
                        │
                        ▼
        ┌───────────────────────────────┐
        │ Login to Admin Panel          │
        └───────────────────────────────┘
                        │
                        ▼
        ┌───────────────────────────────┐
        │ Navigate to "Courses" Section │
        └───────────────────────────────┘
                        │
                        ▼
        ┌───────────────────────────────┐
        │ Click "Create New Course"     │
        └───────────────────────────────┘
                        │
                        ▼
        ┌───────────────────────────────┐
        │ Fill Course Details:          │
        │ ┌───────────────────────────┐ │
        │ │ Title                     │ │
        │ │ Description               │ │
        │ │ Category (NISM/NCFM/FP)   │ │
        │ │ Price                     │ │
        │ │ Duration                  │ │
        │ │ Features (list)           │ │
        │ │ Syllabus (list)           │ │
        │ │ Level                     │ │
        │ └───────────────────────────┘ │
        └───────────────────────────────┘
                        │
                        ▼
        ┌───────────────────────────────┐
        │ Click "Submit"                │
        └───────────────────────────────┘
                        │
                        ▼
        ┌───────────────────────────────┐
        │ API Call to Backend           │
        │ POST /api/admin/courses       │
        └───────────────────────────────┘
                        │
                        ▼
        ┌───────────────────────────────┐
        │ Course Saved to MongoDB       │
        │ courses collection            │
        └───────────────────────────────┘
                        │
                        ▼
        ┌───────────────────────────────┐
        │ Success Message Displayed     │
        │ "Course created successfully" │
        └───────────────────────────────┘
                        │
                        ▼
        ┌───────────────────────────────┐
        │ Course appears in list        │
        │ with unique _id               │
        └───────────────────────────────┘
                        │
                        ▼
                ┌───────────┐
                │   DONE    │
                └───────────┘
```

### 🔧 Course Creation - API Method (Postman/Insomnia)

If admin UI form is not ready, use API directly:

**Endpoint:** `POST /api/admin/courses`

**Headers:**
```
Content-Type: application/json
Authorization: Bearer YOUR_JWT_TOKEN
```

**Body (JSON):**
```json
{
  "title": "NISM Series V-A: Mutual Fund Distributors Certification",
  "description": "Comprehensive course for NISM Series V-A certification covering mutual fund concepts, regulations, and distribution practices.",
  "category": "NISM",
  "price": 2999,
  "duration": "2 months",
  "features": [
    "Complete video lectures",
    "10 comprehensive mock tests",
    "PDF study materials",
    "Expert guidance",
    "Performance analytics"
  ],
  "syllabus": [
    "Indian Financial System",
    "Mutual Fund Concepts",
    "Types of Mutual Funds",
    "Regulatory Framework",
    "Distribution Practices"
  ],
  "level": "Beginner to Intermediate",
  "isActive": true
}
```

**Response:**
```json
{
  "success": true,
  "message": "Course created successfully",
  "data": {
    "course": {
      "_id": "6543210abcdef123456789",
      "title": "NISM Series V-A: Mutual Fund Distributors Certification",
      "category": "NISM",
      "price": 2999,
      "createdAt": "2025-10-11T10:30:00.000Z"
    }
  }
}
```

**Save the `_id`** - You'll need it for uploading materials and quizzes!

---

## 5. Upload Study Materials (PDFs)

### 📊 FLOWCHART: PDF Upload Process

```
┌─────────────────────────────────────────────────────────┐
│           PDF UPLOAD PROCESS                            │
└─────────────────────────────────────────────────────────┘
                        │
                        ▼
        ┌───────────────────────────────┐
        │ Login to Admin Panel          │
        └───────────────────────────────┘
                        │
                        ▼
        ┌───────────────────────────────┐
        │ Go to "Study Materials"       │
        └───────────────────────────────┘
                        │
                        ▼
        ┌───────────────────────────────┐
        │ Click "Upload Material"       │
        └───────────────────────────────┘
                        │
                        ▼
        ┌───────────────────────────────┐
        │ Fill Upload Form:             │
        │ ┌───────────────────────────┐ │
        │ │ Title                     │ │
        │ │ Description               │ │
        │ │ Select Course (dropdown)  │ │
        │ │ OR Mark as Free          │ │
        │ │ Choose File (PDF)         │ │
        │ └───────────────────────────┘ │
        └───────────────────────────────┘
                        │
                        ▼
        ┌───────────────────────────────┐
        │ Validate File:                │
        │ - File type: PDF              │
        │ - File size: < 10MB           │
        └───────────────────────────────┘
                        │
            ┌───────────┴────────────┐
            │                        │
            ▼                        ▼
    ┌──────────────┐        ┌──────────────┐
    │ Valid File   │        │ Invalid File │
    └──────────────┘        └──────────────┘
            │                        │
            ▼                        ▼
    ┌──────────────┐        ┌──────────────┐
    │ Upload File  │        │ Show Error   │
    │ to Server    │        │ Message      │
    └──────────────┘        └──────────────┘
            │                        
            ▼                        
    ┌──────────────────────┐        
    │ File saved to:       │        
    │ /uploads/pdfs/       │        
    │ filename.pdf         │        
    └──────────────────────┘        
            │
            ▼
    ┌──────────────────────┐
    │ Create DB Record     │
    │ in studymaterials    │
    │ collection           │
    └──────────────────────┘
            │
            ▼
    ┌──────────────────────┐
    │ Link to Course       │
    │ (if not free)        │
    └──────────────────────┘
            │
            ▼
    ┌──────────────────────┐
    │ Success Message      │
    │ "Material uploaded"  │
    └──────────────────────┘
            │
            ▼
    ┌──────────────────────┐
    │ Material visible in  │
    │ admin panel & course │
    └──────────────────────┘
            │
            ▼
        ┌───────┐
        │ DONE  │
        └───────┘
```

### 🔧 PDF Upload - API Method (Postman)

**Endpoint:** `POST /api/admin/study-materials`

**Headers:**
```
Authorization: Bearer YOUR_JWT_TOKEN
Content-Type: multipart/form-data
```

**Body (form-data):**
```
Key: file          | Value: [Select PDF file]
Key: title         | Value: "NISM Series V-A Study Guide"
Key: description   | Value: "Complete study guide covering all topics"
Key: course        | Value: "6543210abcdef123456789" (course _id)
Key: isFree        | Value: false
```

**For Free Material:**
```
Key: file          | Value: [Select PDF file]
Key: title         | Value: "Introduction to Financial Markets"
Key: description   | Value: "Free study material for beginners"
Key: isFree        | Value: true
```

**Response:**
```json
{
  "success": true,
  "message": "Study material uploaded successfully",
  "data": {
    "studyMaterial": {
      "_id": "abc123def456",
      "title": "NISM Series V-A Study Guide",
      "fileName": "material-1696834567890-123456789.pdf",
      "fileUrl": "/uploads/pdfs/material-1696834567890-123456789.pdf",
      "fileSize": 2500000,
      "fileType": "application/pdf",
      "course": "6543210abcdef123456789",
      "isFree": false,
      "downloads": 0
    }
  }
}
```

---

## 6. Create Quizzes

### 📊 FLOWCHART: Quiz Creation Process

```
┌─────────────────────────────────────────────────────────┐
│           QUIZ CREATION PROCESS                         │
└─────────────────────────────────────────────────────────┘
                        │
                        ▼
        ┌───────────────────────────────┐
        │ Login to Admin Panel          │
        └───────────────────────────────┘
                        │
                        ▼
        ┌───────────────────────────────┐
        │ Navigate to "Quizzes"         │
        └───────────────────────────────┘
                        │
                        ▼
        ┌───────────────────────────────┐
        │ Click "Create New Quiz"       │
        └───────────────────────────────┘
                        │
                        ▼
        ┌───────────────────────────────┐
        │ Select Quiz Type:             │
        │ ○ 50 Questions (2 hours)      │
        │ ○ 100 Questions (3 hours)     │
        └───────────────────────────────┘
                        │
            ┌───────────┴────────────┐
            │                        │
            ▼                        ▼
    ┌──────────────┐        ┌──────────────┐
    │ 50 Question  │        │ 100 Question │
    │ Quiz         │        │ Quiz         │
    │ Duration:    │        │ Duration:    │
    │ 7200 sec     │        │ 10800 sec    │
    └──────────────┘        └──────────────┘
            │                        │
            └────────────┬───────────┘
                        │
                        ▼
        ┌───────────────────────────────┐
        │ Fill Quiz Details:            │
        │ ┌───────────────────────────┐ │
        │ │ Quiz Title                │ │
        │ │ Description               │ │
        │ │ Select Course             │ │
        │ │ Quiz Number (1-10)        │ │
        │ │ Total Questions           │ │
        │ │ Duration (auto-set)       │ │
        │ │ Passing %: 60%            │ │
        │ └───────────────────────────┘ │
        └───────────────────────────────┘
                        │
                        ▼
        ┌───────────────────────────────┐
        │ Submit Quiz                   │
        │ API: POST /api/admin/quizzes  │
        └───────────────────────────────┘
                        │
                        ▼
        ┌───────────────────────────────┐
        │ Quiz Created in MongoDB       │
        │ (without questions yet)       │
        └───────────────────────────────┘
                        │
                        ▼
        ┌───────────────────────────────┐
        │ Quiz ID Generated             │
        │ Save this ID!                 │
        └───────────────────────────────┘
                        │
                        ▼
        ┌───────────────────────────────┐
        │ Next: Add Questions           │
        │ (See Section 7)               │
        └───────────────────────────────┘
                        │
                        ▼
                ┌───────────┐
                │   DONE    │
                └───────────┘
```

### 🔧 Quiz Creation - API Method

**Endpoint:** `POST /api/admin/quizzes`

**Headers:**
```
Content-Type: application/json
Authorization: Bearer YOUR_JWT_TOKEN
```

**Body for 50-Question Quiz:**
```json
{
  "course": "6543210abcdef123456789",
  "title": "NISM Series V-A - Mock Test 1",
  "description": "First comprehensive mock test covering all topics",
  "quizNumber": 1,
  "totalQuestions": 50,
  "duration": 7200,
  "passingPercentage": 60,
  "isActive": true
}
```

**Body for 100-Question Quiz:**
```json
{
  "course": "6543210abcdef123456789",
  "title": "NISM Series V-A - Final Mock Test",
  "description": "Final comprehensive exam simulation",
  "quizNumber": 9,
  "totalQuestions": 100,
  "duration": 10800,
  "passingPercentage": 60,
  "isActive": true
}
```

**Response:**
```json
{
  "success": true,
  "message": "Quiz created successfully",
  "data": {
    "quiz": {
      "_id": "quiz123abc456def",
      "course": "6543210abcdef123456789",
      "title": "NISM Series V-A - Mock Test 1",
      "totalQuestions": 50,
      "duration": 7200,
      "questions": []
    }
  }
}
```

**⚠️ IMPORTANT:** Save the quiz `_id` - you'll need it to add questions!

---

## 7. Add Quiz Questions

### 📊 FLOWCHART: Add Questions Process

```
┌─────────────────────────────────────────────────────────┐
│           ADD QUIZ QUESTIONS PROCESS                    │
└─────────────────────────────────────────────────────────┘
                        │
                        ▼
        ┌───────────────────────────────┐
        │ Have Quiz ID from Step 6      │
        └───────────────────────────────┘
                        │
                        ▼
        ┌───────────────────────────────┐
        │ Prepare Questions in Format   │
        │ (see format below)            │
        └───────────────────────────────┘
                        │
                        ▼
        ┌───────────────────────────────┐
        │ Use API to Add Questions      │
        │ POST /api/admin/quizzes/      │
        │      {quizId}/questions       │
        └───────────────────────────────┘
                        │
                        ▼
        ┌───────────────────────────────┐
        │ For Each Question:            │
        │ ┌───────────────────────────┐ │
        │ │ Question Text             │ │
        │ │ Option 1                  │ │
        │ │ Option 2                  │ │
        │ │ Option 3                  │ │
        │ │ Option 4                  │ │
        │ │ Correct Answer (0-3)      │ │
        │ │ Explanation               │ │
        │ │ Marks (default: 1)        │ │
        │ └───────────────────────────┘ │
        └───────────────────────────────┘
                        │
                        ▼
        ┌───────────────────────────────┐
        │ Validate:                     │
        │ - 4 options present           │
        │ - Correct answer (0-3)        │
        │ - All fields filled           │
        └───────────────────────────────┘
                        │
            ┌───────────┴────────────┐
            │                        │
            ▼                        ▼
    ┌──────────────┐        ┌──────────────┐
    │ Valid        │        │ Invalid      │
    │ Questions    │        │ Format       │
    └──────────────┘        └──────────────┘
            │                        │
            ▼                        ▼
    ┌──────────────┐        ┌──────────────┐
    │ Add to Quiz  │        │ Show Error   │
    └──────────────┘        └──────────────┘
            │
            ▼
    ┌──────────────────────┐
    │ Questions Saved to   │
    │ MongoDB quiz record  │
    └──────────────────────┘
            │
            ▼
    ┌──────────────────────┐
    │ Update Question      │
    │ Count                │
    └──────────────────────┘
            │
            ▼
    ┌──────────────────────┐
    │ Quiz Ready for       │
    │ Students             │
    └──────────────────────┘
            │
            ▼
        ┌───────┐
        │ DONE  │
        └───────┘
```

### 🔧 Add Questions - API Method

**Endpoint:** `POST /api/admin/quizzes/:quizId/questions`

**Headers:**
```
Content-Type: application/json
Authorization: Bearer YOUR_JWT_TOKEN
```

**Body (Add Multiple Questions):**
```json
{
  "questions": [
    {
      "questionText": "What is a Mutual Fund?",
      "options": [
        "A type of bank account",
        "A pooled investment vehicle that collects money from investors",
        "A government bond",
        "A stock exchange"
      ],
      "correctAnswer": 1,
      "explanation": "A mutual fund is a pooled investment vehicle that collects money from multiple investors to invest in securities like stocks, bonds, and other assets.",
      "marks": 1
    },
    {
      "questionText": "What does NAV stand for in mutual funds?",
      "options": [
        "Net Asset Value",
        "National Asset Verification",
        "New Account Value",
        "Nominal Average Value"
      ],
      "correctAnswer": 0,
      "explanation": "NAV stands for Net Asset Value, which is the per-unit value of the mutual fund calculated by dividing the total value of assets minus liabilities by the number of outstanding units.",
      "marks": 1
    },
    {
      "questionText": "Which regulatory body regulates mutual funds in India?",
      "options": [
        "RBI",
        "SEBI",
        "IRDAI",
        "PFRDA"
      ],
      "correctAnswer": 1,
      "explanation": "SEBI (Securities and Exchange Board of India) is the regulatory body that regulates mutual funds in India under the SEBI (Mutual Funds) Regulations, 1996.",
      "marks": 1
    }
  ]
}
```

**Important Notes:**
- `correctAnswer` is 0-indexed (0 = first option, 1 = second option, etc.)
- Add 50 questions for 50-question quiz
- Add 100 questions for 100-question quiz
- Each question must have exactly 4 options

**Response:**
```json
{
  "success": true,
  "message": "Questions added successfully",
  "data": {
    "quiz": {
      "_id": "quiz123abc456def",
      "title": "NISM Series V-A - Mock Test 1",
      "totalQuestions": 50,
      "questionsAdded": 3
    }
  }
}
```

---

## 8. Complete Data Flow Diagram

### 📊 MASTER FLOWCHART: Complete System

```
┌─────────────────────────────────────────────────────────────────────┐
│                   NISMSTUDY.COM - COMPLETE DATA FLOW                │
└─────────────────────────────────────────────────────────────────────┘

                            START
                              │
                              ▼
                ┌─────────────────────────────┐
                │  PHASE 1: DATABASE SETUP    │
                └─────────────────────────────┘
                              │
            ┌─────────────────┼─────────────────┐
            │                 │                 │
            ▼                 ▼                 ▼
    ┌──────────────┐  ┌──────────────┐  ┌──────────────┐
    │ Create       │  │ Setup User   │  │ Whitelist    │
    │ MongoDB      │  │ & Password   │  │ IP Address   │
    │ Atlas        │  │              │  │ 0.0.0.0/0    │
    │ Account      │  │              │  │              │
    └──────────────┘  └──────────────┘  └──────────────┘
            │                 │                 │
            └─────────────────┼─────────────────┘
                              │
                              ▼
                ┌─────────────────────────────┐
                │ Get Connection String       │
                │ Add to .env                 │
                └─────────────────────────────┘
                              │
                              ▼
                ┌─────────────────────────────┐
                │  PHASE 2: INITIAL SETUP     │
                └─────────────────────────────┘
                              │
            ┌─────────────────┼─────────────────┐
            │                 │                 │
            ▼                 ▼                 ▼
    ┌──────────────┐  ┌──────────────┐  ┌──────────────┐
    │ npm install  │  │ npm run seed │  │ npm run      │
    │              │  │ (optional)   │  │ init-admin   │
    └──────────────┘  └──────────────┘  └──────────────┘
            │                 │                 │
            └─────────────────┼─────────────────┘
                              │
                              ▼
                ┌─────────────────────────────┐
                │ npm start                   │
                │ Server Running ✅           │
                └─────────────────────────────┘
                              │
                              ▼
                ┌─────────────────────────────┐
                │  PHASE 3: ADMIN LOGIN       │
                └─────────────────────────────┘
                              │
                              ▼
                ┌─────────────────────────────┐
                │ http://localhost:5000/      │
                │ login.html                  │
                └─────────────────────────────┘
                              │
                              ▼
                ┌─────────────────────────────┐
                │ Enter Admin Credentials     │
                └─────────────────────────────┘
                              │
                              ▼
                ┌─────────────────────────────┐
                │ Redirected to Admin Panel   │
                └─────────────────────────────┘
                              │
                              ▼
                ┌─────────────────────────────┐
                │  PHASE 4: CREATE COURSES    │
                └─────────────────────────────┘
                              │
            ┌─────────────────┼─────────────────┐
            │                 │                 │
            ▼                 ▼                 ▼
    ┌──────────────┐  ┌──────────────┐  ┌──────────────┐
    │ Course 1     │  │ Course 2     │  │ Course 3     │
    │ NISM V-A     │  │ NCFM FM      │  │ CFP          │
    └──────────────┘  └──────────────┘  └──────────────┘
            │                 │                 │
            └─────────────────┼─────────────────┘
                              │
                              ▼
                ┌─────────────────────────────┐
                │ Courses saved to MongoDB    │
                │ Collection: courses         │
                └─────────────────────────────┘
                              │
                              ▼
                ┌─────────────────────────────┐
                │  PHASE 5: UPLOAD MATERIALS  │
                └─────────────────────────────┘
                              │
            ┌─────────────────┼─────────────────┐
            │                 │                 │
            ▼                 ▼                 ▼
    ┌──────────────┐  ┌──────────────┐  ┌──────────────┐
    │ Upload PDF 1 │  │ Upload PDF 2 │  │ Upload PDF 3 │
    │ (Course 1)   │  │ (Course 2)   │  │ (Free)       │
    └──────────────┘  └──────────────┘  └──────────────┘
            │                 │                 │
            ▼                 ▼                 ▼
    ┌──────────────────────────────────────────────────┐
    │ Files saved to: /uploads/pdfs/                   │
    │ Records in: studymaterials collection            │
    └──────────────────────────────────────────────────┘
                              │
                              ▼
                ┌─────────────────────────────┐
                │  PHASE 6: CREATE QUIZZES    │
                └─────────────────────────────┘
                              │
            ┌─────────────────┼─────────────────┐
            │                 │                 │
            ▼                 ▼                 ▼
    ┌──────────────┐  ┌──────────────┐  ┌──────────────┐
    │ Quiz 1       │  │ Quiz 2       │  │ Quiz 3       │
    │ 50 Questions │  │ 50 Questions │  │ 100 Qs       │
    │ 2 hours      │  │ 2 hours      │  │ 3 hours      │
    └──────────────┘  └──────────────┘  └──────────────┘
            │                 │                 │
            └─────────────────┼─────────────────┘
                              │
                              ▼
                ┌─────────────────────────────┐
                │ Quizzes saved to MongoDB    │
                │ Collection: quizzes         │
                └─────────────────────────────┘
                              │
                              ▼
                ┌─────────────────────────────┐
                │  PHASE 7: ADD QUESTIONS     │
                └─────────────────────────────┘
                              │
            ┌─────────────────┼─────────────────┐
            │                 │                 │
            ▼                 ▼                 ▼
    ┌──────────────┐  ┌──────────────┐  ┌──────────────┐
    │ Add 50 Qs    │  │ Add 50 Qs    │  │ Add 100 Qs   │
    │ to Quiz 1    │  │ to Quiz 2    │  │ to Quiz 3    │
    └──────────────┘  └──────────────┘  └──────────────┘
            │                 │                 │
            └─────────────────┼─────────────────┘
                              │
                              ▼
                ┌─────────────────────────────┐
                │ Questions added to quizzes  │
                │ in MongoDB                  │
                └─────────────────────────────┘
                              │
                              ▼
                ┌─────────────────────────────┐
                │  PHASE 8: CONFIGURE PAYMENT │
                └─────────────────────────────┘
                              │
            ┌─────────────────┼─────────────────┐
            │                 │                 │
            ▼                 ▼                 ▼
    ┌──────────────┐  ┌──────────────┐  ┌──────────────┐
    │ Get Razorpay │  │ Add Keys to  │  │ Test Payment │
    │ Test Keys    │  │ .env File    │  │ Flow         │
    └──────────────┘  └──────────────┘  └──────────────┘
            │                 │                 │
            └─────────────────┼─────────────────┘
                              │
                              ▼
                ┌─────────────────────────────┐
                │  SYSTEM READY FOR STUDENTS  │
                └─────────────────────────────┘
                              │
            ┌─────────────────┼─────────────────┐
            │                 │                 │
            ▼                 ▼                 ▼
    ┌──────────────┐  ┌──────────────┐  ┌──────────────┐
    │ Students     │  │ Purchase     │  │ Take Quizzes │
    │ Register     │  │ Courses      │  │ & Learn      │
    └──────────────┘  └──────────────┘  └──────────────┘
            │                 │                 │
            └─────────────────┼─────────────────┘
                              │
                              ▼
                        ┌───────────┐
                        │  SUCCESS  │
                        │     🎉    │
                        └───────────┘
```

---

## 📝 Quick Reference Commands

### Database Setup
```bash
# No commands needed for MongoDB Atlas
# Just get connection string and add to .env
```

### Initial Setup
```bash
npm install
npm run seed
npm run init-admin
npm start
```

### Testing
```bash
npm run test
```

### Access URLs
```
Main Site:        http://localhost:5000
Admin Login:      http://localhost:5000/login.html
Admin Panel:      http://localhost:5000/public/admin-panel.html
API Health:       http://localhost:5000/api/health
```

---

## 🎯 Summary Checklist

Use this checklist to track your progress:

### Database Setup
- [ ] MongoDB Atlas account created
- [ ] Cluster created
- [ ] Database user added
- [ ] IP address whitelisted
- [ ] Connection string obtained
- [ ] Added to .env file
- [ ] Connection tested successfully

### Initial Setup
- [ ] npm install completed
- [ ] .env file configured
- [ ] Sample data seeded (optional)
- [ ] Admin account created
- [ ] Server starts without errors

### Course Creation
- [ ] At least 1 course created
- [ ] Course details filled
- [ ] Course visible in admin panel
- [ ] Course ID saved

### Materials Upload
- [ ] At least 1 PDF uploaded
- [ ] File saved successfully
- [ ] Linked to course
- [ ] Visible in course materials

### Quiz Creation
- [ ] At least 1 quiz created
- [ ] Quiz type selected (50 or 100 questions)
- [ ] Quiz details filled
- [ ] Quiz ID saved

### Questions Added
- [ ] Questions prepared
- [ ] Questions added via API
- [ ] All questions have 4 options
- [ ] Correct answers marked
- [ ] Explanations provided

### Payment Setup
- [ ] Razorpay account created
- [ ] Test keys obtained
- [ ] Added to .env
- [ ] Payment flow tested

### Final Testing
- [ ] Admin can login
- [ ] Student can register
- [ ] Courses visible
- [ ] Materials downloadable
- [ ] Quizzes work
- [ ] Payment creates order

---

## 🎉 Congratulations!

Once you complete all steps, your NISMSTUDY.COM platform will be fully operational with:

✅ Complete course catalog  
✅ Study materials (PDFs)  
✅ Interactive quizzes  
✅ Payment integration  
✅ Student portal  
✅ Admin management  

**You're ready to launch! 🚀**

---

**Need help?** Check the troubleshooting sections in:
- `GETTING_STARTED.md`
- `PRODUCTION_SETUP_GUIDE.md`
- `START_HERE.md`



