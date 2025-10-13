# 🗄️ MongoDB Database Schema - NISMSTUDY.COM

**Complete database structure and relationships**

---

## 📊 Database Overview

**Database Name:** `nismstudy`

**Total Collections:** 7

```
nismstudy
├── users (Students & Admins)
├── courses (Course catalog)
├── quizzes (Quiz data with questions)
├── quizattempts (Student quiz submissions)
├── studymaterials (PDFs and documents)
├── purchases (Payment records)
└── progress (Student progress tracking)
```

---

## 📋 Collection Schemas

### 1. **users** Collection

Stores both students and admin accounts.

```javascript
{
  _id: ObjectId("6543210abcdef123456789"),
  name: "Rohit Kumar",
  email: "rohit@example.com",
  password: "$2a$10$hashed_password_here",  // bcrypt hashed
  phone: "+919876543210",
  role: "student",  // "student" or "admin"
  isActive: true,
  
  // Purchased courses (embedded array)
  purchasedCourses: [
    {
      course: ObjectId("course_id_here"),
      purchaseDate: ISODate("2025-10-11T10:00:00Z"),
      expiryDate: ISODate("2026-04-11T10:00:00Z"),  // 6 months
      paymentId: "pay_ABC123XYZ456",
      amount: 2999
    }
  ],
  
  lastLogin: ISODate("2025-10-11T15:30:00Z"),
  createdAt: ISODate("2025-10-01T10:00:00Z"),
  updatedAt: ISODate("2025-10-11T15:30:00Z")
}
```

**Indexes:**
- `email` (unique)
- `role`
- `createdAt`

**Sample Queries:**
```javascript
// Find all students
db.users.find({ role: "student" })

// Find admin
db.users.findOne({ role: "admin" })

// Find by email
db.users.findOne({ email: "admin@nismstudy.com" })
```

---

### 2. **courses** Collection

Stores all course information.

```javascript
{
  _id: ObjectId("course123abc456def"),
  title: "NISM Series V-A: Mutual Fund Distributors Certification",
  description: "Comprehensive course for NISM Series V-A certification...",
  category: "NISM",  // "NISM", "NCFM", "Financial Planning"
  price: 2999,
  duration: "2 months",
  
  // Course features (array)
  features: [
    "Complete video lectures",
    "10 comprehensive mock tests",
    "PDF study materials",
    "Expert guidance",
    "Performance analytics"
  ],
  
  // Syllabus topics (array)
  syllabus: [
    "Indian Financial System",
    "Mutual Fund Concepts",
    "Types of Mutual Funds",
    "Regulatory Framework",
    "Distribution Practices"
  ],
  
  level: "Beginner to Intermediate",
  isActive: true,
  
  // References to other collections
  studyMaterials: [
    ObjectId("material1_id"),
    ObjectId("material2_id")
  ],
  
  quizzes: [
    ObjectId("quiz1_id"),
    ObjectId("quiz2_id"),
    ObjectId("quiz3_id")
  ],
  
  // Statistics
  enrolledStudents: 0,
  totalRevenue: 0,
  
  createdAt: ISODate("2025-10-01T10:00:00Z"),
  updatedAt: ISODate("2025-10-11T12:00:00Z")
}
```

**Indexes:**
- `category`
- `isActive`
- `price`
- `createdAt`

**Sample Queries:**
```javascript
// Find all active NISM courses
db.courses.find({ category: "NISM", isActive: true })

// Find courses by price range
db.courses.find({ price: { $gte: 2000, $lte: 3000 } })

// Find course with materials and quizzes populated
db.courses.findOne({ _id: ObjectId("course_id") })
```

---

### 3. **quizzes** Collection

Stores quiz structure and questions.

```javascript
{
  _id: ObjectId("quiz123abc456def"),
  course: ObjectId("course123abc456def"),  // Reference to courses
  title: "NISM Series V-A - Mock Test 1",
  description: "First comprehensive mock test covering all topics",
  quizNumber: 1,  // 1-10
  totalQuestions: 50,  // 50 or 100
  duration: 7200,  // seconds (2 hours for 50q, 3 hours for 100q)
  passingPercentage: 60,
  isActive: true,
  
  // Questions array (embedded)
  questions: [
    {
      questionText: "What is a Mutual Fund?",
      options: [
        "A type of bank account",
        "A pooled investment vehicle that collects money from investors",
        "A government bond",
        "A stock exchange"
      ],
      correctAnswer: 1,  // 0-indexed (0,1,2,3)
      explanation: "A mutual fund is a pooled investment vehicle...",
      marks: 1
    },
    {
      questionText: "What does NAV stand for?",
      options: [
        "Net Asset Value",
        "National Asset Verification",
        "New Account Value",
        "Nominal Average Value"
      ],
      correctAnswer: 0,
      explanation: "NAV stands for Net Asset Value...",
      marks: 1
    }
    // ... 48 more questions for 50-question quiz
  ],
  
  // Statistics
  totalAttempts: 0,
  averageScore: 0,
  
  createdAt: ISODate("2025-10-05T10:00:00Z"),
  updatedAt: ISODate("2025-10-11T14:00:00Z")
}
```

**Indexes:**
- `course`
- `isActive`
- `quizNumber`

**Sample Queries:**
```javascript
// Find all quizzes for a course
db.quizzes.find({ course: ObjectId("course_id") })

// Find active quizzes
db.quizzes.find({ isActive: true })

// Get specific quiz with all questions
db.quizzes.findOne({ _id: ObjectId("quiz_id") })
```

---

### 4. **quizattempts** Collection

Records student quiz submissions and results.

```javascript
{
  _id: ObjectId("attempt123abc456"),
  student: ObjectId("student_user_id"),  // Reference to users
  quiz: ObjectId("quiz123abc456def"),     // Reference to quizzes
  course: ObjectId("course123abc456def"), // Reference to courses
  
  // Student's answers (array, same order as questions)
  answers: [
    1,  // Answer for question 1 (option index 0-3)
    0,  // Answer for question 2
    2,  // Answer for question 3
    null,  // Question 4 not answered
    3,  // Answer for question 5
    // ... continues for all questions
  ],
  
  // Results
  score: 38,  // out of 50
  percentage: 76,
  isPassed: true,  // true if >= 60%
  correctAnswers: 38,
  incorrectAnswers: 10,
  unanswered: 2,
  
  // Timing
  startTime: ISODate("2025-10-11T10:00:00Z"),
  endTime: ISODate("2025-10-11T11:45:00Z"),
  timeTaken: 6300,  // seconds
  
  status: "completed",  // "in_progress", "completed", "abandoned"
  
  createdAt: ISODate("2025-10-11T10:00:00Z"),
  updatedAt: ISODate("2025-10-11T11:45:00Z")
}
```

**Indexes:**
- `student`
- `quiz`
- `course`
- `isPassed`
- `createdAt`

**Sample Queries:**
```javascript
// Find all attempts by a student
db.quizattempts.find({ student: ObjectId("student_id") })

// Find passed attempts
db.quizattempts.find({ isPassed: true })

// Get student's best attempt for a quiz
db.quizattempts.find({ 
  student: ObjectId("student_id"), 
  quiz: ObjectId("quiz_id") 
}).sort({ score: -1 }).limit(1)
```

---

### 5. **studymaterials** Collection

Stores uploaded PDFs and study materials.

```javascript
{
  _id: ObjectId("material123abc456"),
  title: "NISM Series V-A Complete Study Guide",
  description: "Comprehensive study guide covering all topics",
  
  // File information
  fileName: "material-1696834567890-123456789.pdf",
  fileUrl: "/uploads/pdfs/material-1696834567890-123456789.pdf",
  fileSize: 2500000,  // bytes
  fileType: "application/pdf",
  
  // Course association
  course: ObjectId("course123abc456def"),  // null if free
  isFree: false,  // true for free materials
  
  // Statistics
  downloads: 45,
  views: 120,
  
  // Metadata
  uploadedBy: ObjectId("admin_user_id"),
  
  createdAt: ISODate("2025-10-05T12:00:00Z"),
  updatedAt: ISODate("2025-10-11T10:00:00Z")
}
```

**Indexes:**
- `course`
- `isFree`
- `createdAt`

**Sample Queries:**
```javascript
// Find all materials for a course
db.studymaterials.find({ course: ObjectId("course_id") })

// Find all free materials
db.studymaterials.find({ isFree: true })

// Find materials uploaded by admin
db.studymaterials.find({ uploadedBy: ObjectId("admin_id") })
```

---

### 6. **purchases** Collection

Records payment transactions.

```javascript
{
  _id: ObjectId("purchase123abc456"),
  student: ObjectId("student_user_id"),    // Reference to users
  course: ObjectId("course123abc456def"),  // Reference to courses
  
  // Payment details
  amount: 2999,
  currency: "INR",
  
  // Razorpay information
  orderId: "order_ABC123XYZ456",           // Razorpay order ID
  paymentId: "pay_DEF789GHI012",           // Razorpay payment ID
  paymentSignature: "signature_hash_here",
  
  // Status
  status: "completed",  // "pending", "completed", "failed", "refunded"
  paymentMethod: "card",  // "card", "upi", "netbanking", "wallet"
  
  // Dates
  transactionDate: ISODate("2025-10-11T14:30:00Z"),
  expiryDate: ISODate("2026-04-11T14:30:00Z"),  // 6 months access
  
  // Metadata
  remarks: "Course access granted",
  
  createdAt: ISODate("2025-10-11T14:30:00Z"),
  updatedAt: ISODate("2025-10-11T14:30:00Z")
}
```

**Indexes:**
- `student`
- `course`
- `status`
- `paymentId` (unique)
- `orderId` (unique)
- `transactionDate`

**Sample Queries:**
```javascript
// Find all purchases by a student
db.purchases.find({ student: ObjectId("student_id") })

// Find successful payments
db.purchases.find({ status: "completed" })

// Get total revenue
db.purchases.aggregate([
  { $match: { status: "completed" } },
  { $group: { _id: null, total: { $sum: "$amount" } } }
])
```

---

### 7. **progress** Collection

Tracks student learning progress.

```javascript
{
  _id: ObjectId("progress123abc456"),
  student: ObjectId("student_user_id"),    // Reference to users
  course: ObjectId("course123abc456def"),  // Reference to courses
  
  // Completed materials
  completedMaterials: [
    ObjectId("material1_id"),
    ObjectId("material2_id"),
    ObjectId("material3_id")
  ],
  
  // Quiz attempts
  quizAttempts: [
    ObjectId("attempt1_id"),
    ObjectId("attempt2_id")
  ],
  
  // Progress metrics
  overallProgress: 45,  // percentage (0-100)
  materialsProgress: 60,  // percentage of materials completed
  quizzesProgress: 30,    // percentage of quizzes completed
  
  // Last activity
  lastAccessedMaterial: ObjectId("material3_id"),
  lastAccessedDate: ISODate("2025-10-11T16:00:00Z"),
  
  // Time spent
  totalTimeSpent: 18000,  // seconds (5 hours)
  
  createdAt: ISODate("2025-10-05T10:00:00Z"),
  updatedAt: ISODate("2025-10-11T16:00:00Z")
}
```

**Indexes:**
- `student`
- `course`
- `overallProgress`
- Compound: `student + course` (unique)

**Sample Queries:**
```javascript
// Find progress for a student in a course
db.progress.findOne({ 
  student: ObjectId("student_id"), 
  course: ObjectId("course_id") 
})

// Find students with >80% progress
db.progress.find({ overallProgress: { $gte: 80 } })

// Update progress when material is completed
db.progress.updateOne(
  { student: ObjectId("student_id"), course: ObjectId("course_id") },
  { 
    $addToSet: { completedMaterials: ObjectId("material_id") },
    $inc: { materialsProgress: 10 }
  }
)
```

---

## 🔗 Relationships Diagram

```
┌─────────────────────────────────────────────────────────┐
│              DATABASE RELATIONSHIPS                     │
└─────────────────────────────────────────────────────────┘

    ┌──────────┐
    │  USERS   │
    └──────────┘
         │
         │ purchasedCourses[]
         │
         ├─────────────────────────────┐
         │                             │
         ▼                             ▼
    ┌──────────┐                 ┌──────────┐
    │ COURSES  │◄────────────────│ PURCHASES│
    └──────────┘                 └──────────┘
         │
         │ studyMaterials[]
         │ quizzes[]
         │
    ┌────┴────┐
    │         │
    ▼         ▼
┌─────────┐ ┌─────────┐
│MATERIALS│ │ QUIZZES │
└─────────┘ └─────────┘
              │
              │ quiz (ref)
              │
              ▼
         ┌──────────────┐
         │ QUIZATTEMPTS │
         └──────────────┘
              │
              │ attempts[]
              │
              ▼
         ┌──────────┐
         │ PROGRESS │
         └──────────┘
```

---

## 📊 Collection Sizes (Estimated)

**For 1000 students, 10 courses:**

| Collection | Documents | Avg Size | Total Size |
|------------|-----------|----------|------------|
| users | 1,001 | 1 KB | ~1 MB |
| courses | 10 | 5 KB | ~50 KB |
| quizzes | 100 | 50 KB | ~5 MB |
| quizattempts | 10,000 | 2 KB | ~20 MB |
| studymaterials | 100 | 1 KB | ~100 KB |
| purchases | 5,000 | 1 KB | ~5 MB |
| progress | 10,000 | 2 KB | ~20 MB |
| **TOTAL** | **26,211** | | **~51 MB** |

**MongoDB Atlas Free Tier:** 512 MB (more than enough to start!)

---

## 🔍 Common Queries

### Admin Queries

```javascript
// Total revenue
db.purchases.aggregate([
  { $match: { status: "completed" } },
  { $group: { _id: null, total: { $sum: "$amount" } } }
])

// Students enrolled per course
db.users.aggregate([
  { $unwind: "$purchasedCourses" },
  { $group: { _id: "$purchasedCourses.course", count: { $sum: 1 } } }
])

// Quiz average scores
db.quizattempts.aggregate([
  { $group: { _id: "$quiz", avgScore: { $avg: "$score" } } }
])

// Top performing students
db.quizattempts.aggregate([
  { $group: { _id: "$student", avgScore: { $avg: "$percentage" } } },
  { $sort: { avgScore: -1 } },
  { $limit: 10 }
])
```

### Student Queries

```javascript
// Student dashboard data
db.users.findOne({ _id: ObjectId("student_id") })

// Student's purchased courses with details
db.courses.find({ 
  _id: { $in: student.purchasedCourses.map(pc => pc.course) } 
})

// Student's quiz history
db.quizattempts.find({ 
  student: ObjectId("student_id") 
}).sort({ createdAt: -1 })

// Student's progress in all courses
db.progress.find({ student: ObjectId("student_id") })
```

---

## 🛠️ Database Maintenance

### Backup Commands

```bash
# Backup entire database
mongodump --uri="mongodb+srv://user:pass@cluster.mongodb.net/nismstudy"

# Restore database
mongorestore --uri="mongodb+srv://user:pass@cluster.mongodb.net/nismstudy" dump/

# Backup specific collection
mongodump --uri="mongodb+srv://..." --collection=users

# Export to JSON
mongoexport --uri="mongodb+srv://..." --collection=users --out=users.json
```

### Indexes to Create

```javascript
// Create indexes for better performance
db.users.createIndex({ email: 1 }, { unique: true })
db.users.createIndex({ role: 1 })
db.courses.createIndex({ category: 1 })
db.courses.createIndex({ isActive: 1 })
db.quizzes.createIndex({ course: 1 })
db.quizattempts.createIndex({ student: 1 })
db.quizattempts.createIndex({ quiz: 1 })
db.purchases.createIndex({ student: 1 })
db.purchases.createIndex({ status: 1 })
db.progress.createIndex({ student: 1, course: 1 }, { unique: true })
```

---

## 📈 Database Growth Projection

**Year 1:**
- Users: 5,000
- Courses: 50
- Quizzes: 500
- Attempts: 50,000
- Database Size: ~250 MB

**Year 2:**
- Users: 15,000
- Courses: 100
- Quizzes: 1,000
- Attempts: 150,000
- Database Size: ~750 MB

**MongoDB Atlas Plans:**
- Free (M0): 512 MB - Good for 0-1000 students
- Shared (M2): 2 GB - Good for 1000-5000 students
- Dedicated (M10): 10 GB+ - Good for 5000+ students

---

## 🔒 Security Best Practices

1. **User Passwords:** Always hashed with bcrypt (salt rounds: 10)
2. **Database User:** Limited to specific database only
3. **Network Access:** Whitelist specific IPs in production
4. **Backup:** Automated daily backups (Atlas does this)
5. **Indexes:** Proper indexes for query performance
6. **Validation:** Schema validation in Mongoose models

---

## 🎯 Summary

Your MongoDB database is structured with:

- ✅ 7 collections covering all functionality
- ✅ Proper relationships between collections
- ✅ Efficient indexes for fast queries
- ✅ Scalable design for growth
- ✅ Free tier ready (512 MB)
- ✅ Production-ready schema

**Ready to use with MongoDB Atlas!** 🚀

---

**For setup instructions, see:** `ADMIN_DATA_UPLOAD_GUIDE.md`

**For API usage, see:** `BACKEND_DOCUMENTATION.md`



