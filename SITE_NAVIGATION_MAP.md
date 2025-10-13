# NISMSTUDY.COM - Site Navigation Map

```
┌─────────────────────────────────────────────────────────────────────┐
│                         INDEX.HTML (Main Site)                       │
│                     http://localhost:5000/                           │
└─────────────────────────────────────────────────────────────────────┘
                                  │
                    ┌─────────────┼─────────────┐
                    │             │             │
                    ▼             ▼             ▼
        ┌───────────────┐ ┌─────────────┐ ┌──────────────┐
        │  NAVIGATION   │ │   PORTAL    │ │   BUTTONS    │
        │     BAR       │ │   SECTION   │ │   & LINKS    │
        └───────────────┘ └─────────────┘ └──────────────┘
                │             │                 │
        ┌───────┴─────────┐   │         ┌───────┴────────┐
        │                 │   │         │                │
        ▼                 ▼   │         ▼                ▼
┌─────────────┐   ┌─────────────┐   ┌──────────┐  ┌─────────────┐
│   LOGIN     │   │    FREE     │   │  ENROLL  │  │   COURSE    │
│  BUTTON     │   │  MATERIALS  │   │  BUTTON  │  │   DETAILS   │
│             │   │    LINK     │   │          │  │   BUTTONS   │
└─────────────┘   └─────────────┘   └──────────┘  └─────────────┘
        │                 │               │              │
        ▼                 ▼               ▼              ▼
╔═══════════════════════════════════════════════════════════════════╗
║                     PUBLIC FOLDER PAGES                            ║
╚═══════════════════════════════════════════════════════════════════╝

┌──────────────────────────────────────────────────────────────────┐
│  1. LOGIN PAGE            →  /login.html                          │
│     • Student login                                               │
│     • Admin login                                                 │
│     • Registration form                                           │
└──────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────┐
│  2. STUDENT DASHBOARD     →  /dashboard.html                      │
│     • My courses                                                  │
│     • Progress tracking                                           │
│     • Performance analytics                                       │
└──────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────┐
│  3. COURSE DETAILS        →  /course-detail.html?course=X         │
│     • Course information                                          │
│     • Syllabus                                                    │
│     • Enrollment options                                          │
└──────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────┐
│  4. QUIZ INTERFACE        →  /quiz-interface.html                 │
│     • Take mock tests                                             │
│     • Timer & questions                                           │
│     • Submit answers                                              │
└──────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────┐
│  5. QUIZ RESULTS          →  /quiz-result.html                    │
│     • Score display                                               │
│     • Correct/Wrong answers                                       │
│     • Performance analysis                                        │
└──────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────┐
│  6. FREE MATERIALS        →  /free-materials.html                 │
│     • Download PDFs                                               │
│     • Study notes                                                 │
│     • Sample materials                                            │
└──────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────┐
│  7. ADMIN PANEL           →  /admin.html                          │
│     • Manage students                                             │
│     • Upload content                                              │
│     • View analytics                                              │
└──────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────┐
│  8. ADMIN PANEL (ALT)     →  /admin-panel.html                    │
│     • Alternative admin UI                                        │
│     • Content management                                          │
└──────────────────────────────────────────────────────────────────┘

═══════════════════════════════════════════════════════════════════

           QUICK ACCESS PORTAL SECTION (NEW!)
           
┌────────────────────────────────────────────────────────────────┐
│                                                                 │
│   🔐 Student Login    📊 My Dashboard    ✍️ Take Quiz         │
│                                                                 │
│   📚 Free Materials   🎓 Course Details  ⚙️ Admin Panel       │
│                                                                 │
└────────────────────────────────────────────────────────────────┘

═══════════════════════════════════════════════════════════════════

           JAVASCRIPT FUNCTIONS IN script.js

┌─────────────────────────┬──────────────────────────────────────┐
│  FUNCTION               │  REDIRECTS TO                         │
├─────────────────────────┼──────────────────────────────────────┤
│  showLogin()            │  /login.html                          │
│  showEnroll()           │  /login.html                          │
│  showDashboard()        │  /dashboard.html                      │
│  showCourseDetails(id)  │  /course-detail.html?course={id}      │
│  showMockTests()        │  /quiz-interface.html                 │
│  showFreeMaterials()    │  /free-materials.html                 │
│  showAdmin()            │  /admin.html                          │
└─────────────────────────┴──────────────────────────────────────┘

═══════════════════════════════════════════════════════════════════

           SERVER.JS CONFIGURATION

app.use(express.static(path.join(__dirname, 'public')));
                        ↓
        ALL FILES IN public/ FOLDER ARE ACCESSIBLE
                        ↓
        public/login.html → http://localhost:5000/login.html
        public/dashboard.html → http://localhost:5000/dashboard.html
        public/admin.html → http://localhost:5000/admin.html
        ... and so on ...

═══════════════════════════════════════════════════════════════════

           USER FLOW EXAMPLES

EXAMPLE 1: Student wants to login
    1. Visit homepage (index.html)
    2. Click "Login" button in navbar
       OR
    3. Click "Student Login" card in Portal section
    4. → Redirects to /login.html
    5. Enter credentials
    6. → Redirects to /dashboard.html

EXAMPLE 2: Student wants to take a quiz
    1. Visit homepage (index.html)
    2. Click "Take Quiz" card in Portal section
       OR
    3. Click "Access Mock Tests" in Mock Tests section
    4. → Redirects to /quiz-interface.html
    5. Complete quiz
    6. → Redirects to /quiz-result.html

EXAMPLE 3: Admin wants to manage content
    1. Visit homepage (index.html)
    2. Click "Admin Panel" card in Portal section
    3. → Redirects to /admin.html
    4. Login as admin
    5. Manage students, courses, content

EXAMPLE 4: User wants free materials
    1. Visit homepage (index.html)
    2. Click "Free Materials" in navbar
       OR
    3. Click "Free Materials" card in Portal section
    4. → Redirects to /free-materials.html
    5. Browse and download materials

═══════════════════════════════════════════════════════════════════

           STYLING & DESIGN

┌────────────────────────────────────────────────────────────────┐
│  Portal Cards Feature:                                          │
│  • Hover effects with elevation                                 │
│  • Animated icons that scale and rotate                         │
│  • Gradient background shimmer on hover                         │
│  • Responsive grid (3 → 2 → 1 columns)                         │
│  • Beautiful color scheme matching site theme                   │
│  • Arrow links that slide on hover                              │
└────────────────────────────────────────────────────────────────┘

═══════════════════════════════════════════════════════════════════

           MOBILE RESPONSIVE

Desktop (>968px):      Tablet (640-968px):    Mobile (<640px):
┌───┬───┬───┐          ┌───┬───┐              ┌───┐
│ 1 │ 2 │ 3 │          │ 1 │ 2 │              │ 1 │
├───┼───┼───┤          ├───┼───┤              ├───┤
│ 4 │ 5 │ 6 │          │ 3 │ 4 │              │ 2 │
└───┴───┴───┘          ├───┼───┤              ├───┤
                       │ 5 │ 6 │              │ 3 │
                       └───┴───┘              ├───┤
                                              │ 4 │
                                              ├───┤
                                              │ 5 │
                                              ├───┤
                                              │ 6 │
                                              └───┘

═══════════════════════════════════════════════════════════════════
```

## Quick Reference

**Start Server:**
```bash
npm start          # Full version with MongoDB
npm run demo       # Demo version without MongoDB
```

**Access Site:**
```
http://localhost:5000
```

**Direct Access to Any Page:**
```
http://localhost:5000/login.html
http://localhost:5000/dashboard.html
http://localhost:5000/admin.html
http://localhost:5000/free-materials.html
http://localhost:5000/quiz-interface.html
http://localhost:5000/course-detail.html
http://localhost:5000/quiz-result.html
http://localhost:5000/admin-panel.html
```

**All Navigation Works From:**
- ✅ Navigation bar
- ✅ Quick Access Portal cards
- ✅ Course detail buttons
- ✅ Mock test buttons
- ✅ Direct URL access

---

**📚 For detailed documentation, see:** `PUBLIC_FOLDER_INTEGRATION_GUIDE.md`

