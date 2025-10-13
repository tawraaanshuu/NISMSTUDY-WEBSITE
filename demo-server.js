// Demo server that works without MongoDB for testing
const express = require('express');
const path = require('path');
const app = express();

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(__dirname)); // Serve files from root directory
app.use(express.static(path.join(__dirname, 'public')));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Serve the main website
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Serve admin panel
app.get('/admin.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'admin.html'));
});

// Demo API endpoints
app.get('/api/health', (req, res) => {
    res.json({
        success: true,
        message: 'Demo server is running!',
        note: 'This is a demo version. Install MongoDB to use full features.',
        timestamp: new Date()
    });
});

// Demo admin login
app.post('/api/auth/login', (req, res) => {
    const { email, password } = req.body;
    
    if (email === 'admin@nismstudy.com' && password === 'Admin@123456') {
        res.json({
            success: true,
            message: 'Demo login successful',
            data: {
                user: {
                    id: 'demo-admin',
                    name: 'Demo Admin',
                    email: 'admin@nismstudy.com',
                    role: 'admin'
                },
                token: 'demo-token-123'
            }
        });
    } else {
        res.status(401).json({
            success: false,
            message: 'Invalid credentials'
        });
    }
});

// Demo stats endpoint
app.get('/api/admin/stats', (req, res) => {
    res.json({
        success: true,
        data: {
            totalStudents: 1250,
            totalCourses: 8,
            totalQuizzes: 45,
            totalMaterials: 120
        }
    });
});

// Demo courses endpoint
app.get('/api/student/courses', (req, res) => {
    res.json({
        success: true,
        data: {
            courses: [
                {
                    _id: 'demo1',
                    title: 'NISM Series V-A: Mutual Fund Distributors',
                    description: 'Complete preparation for Mutual Fund Distributors certification',
                    category: 'NISM',
                    price: 2999,
                    duration: '2 months',
                    features: ['100+ Video Lectures', '10 Mock Tests', 'PDF Materials'],
                    thumbnail: ''
                },
                {
                    _id: 'demo2',
                    title: 'NCFM Financial Markets: Beginner Module',
                    description: 'Perfect starting point for your financial markets journey',
                    category: 'NCFM',
                    price: 1999,
                    duration: '1.5 months',
                    features: ['60+ Video Lectures', '10 Mock Tests', 'Interactive Content'],
                    thumbnail: ''
                }
            ]
        }
    });
});

// Demo free materials
app.get('/api/student/materials/free', (req, res) => {
    res.json({
        success: true,
        data: {
            materials: [
                {
                    _id: 'free1',
                    title: 'Introduction to Financial Markets',
                    description: 'Free study material for beginners',
                    course: { title: 'NCFM Beginner', category: 'NCFM' },
                    downloads: 1250
                }
            ]
        }
    });
});

// Demo upload endpoint
app.post('/api/admin/study-materials', (req, res) => {
    res.json({
        success: true,
        message: 'Demo: File upload would work here with MongoDB setup',
        data: {
            studyMaterial: {
                _id: 'demo-material',
                title: req.body.title || 'Demo Material',
                fileName: 'demo.pdf'
            }
        }
    });
});

// Demo quiz creation
app.post('/api/admin/quizzes', (req, res) => {
    res.json({
        success: true,
        message: 'Demo: Quiz creation would work here with MongoDB setup',
        data: {
            quiz: {
                _id: 'demo-quiz',
                title: req.body.title || 'Demo Quiz',
                quizNumber: req.body.quizNumber || 1
            }
        }
    });
});

// Demo chatbot endpoint
app.post('/api/chat', (req, res) => {
    const { message } = req.body;
    
    // Simple demo responses
    const responses = {
        'course': 'We offer comprehensive NISM, NCFM, and Financial Planning courses. Each includes study materials, video lectures, and mock tests. Check our Courses section for details!',
        'register': 'Registration is easy! Click the "Login" button at the top, then select "Create Account". Fill in your details and you can start learning immediately.',
        'payment': 'We accept all payment methods through Razorpay including Credit/Debit Cards, UPI, Net Banking, and digital wallets. All transactions are secure and encrypted.',
        'mock': 'Yes! Each course includes multiple comprehensive mock tests that simulate actual NISM exams with the same format, difficulty, and time limits.',
        'price': 'Our courses are very competitively priced, ranging from ₹999 to ₹2,999 depending on the certification. We also offer combo packages at discounted rates.',
        'nism': 'NISM (National Institute of Securities Markets) is an educational initiative by SEBI offering certification exams for financial services professionals.',
        'help': 'I can help you with information about courses, registration, payments, mock tests, NISM certifications, and more! What would you like to know?',
        'contact': 'You can reach us at support@nismstudy.com or call +91-XXXXXXXXXX (Mon-Fri, 10 AM - 6 PM IST). We typically respond within 24 hours.',
        'material': 'Each course includes comprehensive PDF study guides, video lectures, chapter-wise notes, formula sheets, important questions, and previous year papers.',
        'duration': 'Course access is lifetime! Once you purchase, you can study at your own pace and access all future updates at no additional cost.'
    };
    
    // Find matching response
    const messageLower = message.toLowerCase();
    let response = 'I\'m here to help! You can ask me about our courses, registration process, payment methods, mock tests, study materials, or general NISM information.';
    
    for (const [key, value] of Object.entries(responses)) {
        if (messageLower.includes(key)) {
            response = value;
            break;
        }
    }
    
    // Add some helpful suggestions
    if (messageLower.includes('how') || messageLower.includes('what') || messageLower.includes('?')) {
        // User is asking a question, provide more helpful response
        if (!Object.keys(responses).some(key => messageLower.includes(key))) {
            response = 'That\'s a great question! While I can provide general information, for specific details please:\n\n• Browse our Courses section\n• Check the FAQ page\n• Contact support@nismstudy.com\n\nI can help with: courses, pricing, registration, payments, mock tests, and study materials.';
        }
    }
    
    res.json({
        success: true,
        data: {
            message: response,
            timestamp: new Date()
        }
    });
});

// Get quick questions
app.get('/api/chat/quick-questions', (req, res) => {
    res.json({
        success: true,
        data: {
            questions: [
                "What courses do you offer?",
                "How do I register?",
                "What payment methods do you accept?",
                "Do you provide mock tests?",
                "What are your course prices?"
            ]
        }
    });
});

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`\n🚀 Demo Server running on port ${PORT}`);
    console.log(`📊 Environment: Demo mode (no database required)`);
    console.log(`🌐 Website: http://localhost:${PORT}`);
    console.log(`🎯 Admin Panel: http://localhost:${PORT}/admin.html`);
    console.log(`🔌 API Health: http://localhost:${PORT}/api/health`);
    console.log(`\n✨ NISMSTUDY.COM Demo is ready!`);
    console.log(`\n📝 Demo Credentials:`);
    console.log(`   Email: admin@nismstudy.com`);
    console.log(`   Password: Admin@123456`);
    console.log(`\n💡 To use full features, set up MongoDB and run: npm start`);
});

module.exports = app;
