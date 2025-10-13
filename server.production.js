require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const session = require('express-session');
const MongoStore = require('connect-mongo');
const path = require('path');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const mongoSanitize = require('express-mongo-sanitize');
const compression = require('compression');

// Import middleware
const { errorHandler, notFound } = require('./middleware/validation');

// Import routes
const authRoutes = require('./routes/authRoutes');
const adminRoutes = require('./routes/adminRoutes');
const studentRoutes = require('./routes/studentRoutes');
const paymentRoutes = require('./routes/paymentRoutes');

// Import database connection
const connectDB = require('./config/database');

// Initialize Express app
const app = express();

// ============ SECURITY MIDDLEWARE ============

// Set security headers
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
            fontSrc: ["'self'", "https://fonts.gstatic.com"],
            scriptSrc: ["'self'", "'unsafe-inline'", "https://checkout.razorpay.com"],
            imgSrc: ["'self'", "data:", "https:"],
            connectSrc: ["'self'", "https://api.razorpay.com"]
        }
    }
}));

// Enable CORS with specific origin
const allowedOrigins = process.env.ALLOWED_ORIGINS 
    ? process.env.ALLOWED_ORIGINS.split(',') 
    : ['http://localhost:3000', 'http://localhost:5000'];

app.use(cors({
    origin: function(origin, callback) {
        // Allow requests with no origin (mobile apps, Postman, etc.)
        if (!origin) return callback(null, true);
        
        if (allowedOrigins.indexOf(origin) !== -1) {
            callback(null, true);
        } else {
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true,
    optionsSuccessStatus: 200
}));

// Rate limiting - General
const generalLimiter = rateLimit({
    windowMs: (parseInt(process.env.RATE_LIMIT_WINDOW) || 15) * 60 * 1000,
    max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
    message: {
        success: false,
        message: 'Too many requests from this IP, please try again later.'
    },
    standardHeaders: true,
    legacyHeaders: false
});

// Rate limiting - Strict for auth routes
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // 5 attempts
    skipSuccessfulRequests: true,
    message: {
        success: false,
        message: 'Too many login attempts, please try again after 15 minutes.'
    }
});

// Rate limiting - Payment routes
const paymentLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 10,
    message: {
        success: false,
        message: 'Too many payment requests, please try again later.'
    }
});

// Apply rate limiters
app.use('/api/', generalLimiter);
app.use('/api/auth/login', authLimiter);
app.use('/api/auth/register', authLimiter);
app.use('/api/payment/', paymentLimiter);

// Data sanitization against NoSQL injection
app.use(mongoSanitize());

// Enable gzip compression
app.use(compression());

// ============ BODY PARSERS ============

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ============ SESSION CONFIGURATION ============

app.use(session({
    secret: process.env.SESSION_SECRET || 'your-secret-key',
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({
        mongoUrl: process.env.MONGODB_URI,
        touchAfter: 24 * 3600,
        crypto: {
            secret: process.env.SESSION_SECRET
        }
    }),
    cookie: {
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production', // HTTPS only in production
        sameSite: 'lax'
    },
    name: 'sessionId' // Don't use default name
}));

// ============ STATIC FILES ============

// Serve uploaded files with caching
app.use('/uploads', express.static(path.join(__dirname, 'uploads'), {
    maxAge: '1d',
    etag: true
}));

// Serve public files
app.use(express.static(path.join(__dirname, 'public'), {
    maxAge: process.env.NODE_ENV === 'production' ? '1d' : 0
}));

// Serve main frontend files
app.use(express.static(__dirname, {
    index: false,
    maxAge: process.env.NODE_ENV === 'production' ? '1h' : 0
}));

// ============ CONNECT TO DATABASE ============

connectDB();

// ============ API ROUTES ============

// Health check route (no rate limit)
app.get('/api/health', (req, res) => {
    res.json({
        success: true,
        message: 'Server is running',
        timestamp: new Date(),
        environment: process.env.NODE_ENV || 'development',
        status: 'healthy',
        database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected'
    });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/student', studentRoutes);
app.use('/api/payment', paymentRoutes);

// ============ SERVE FRONTEND PAGES ============

// Main page
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Login page
app.get('/login', (req, res) => {
    res.sendFile(path.join(__dirname, 'login.html'));
});

// Register page
app.get('/register', (req, res) => {
    res.sendFile(path.join(__dirname, 'register.html'));
});

// Admin panel
app.get('/admin', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'admin-panel.html'));
});

// Student dashboard
app.get('/dashboard', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'dashboard.html'));
});

// ============ ERROR HANDLERS ============

// 404 handler
app.use(notFound);

// Global error handler (must be last)
app.use(errorHandler);

// ============ START SERVER ============

const PORT = process.env.PORT || 5000;
const server = app.listen(PORT, () => {
    console.log('\n' + '='.repeat(60));
    console.log('🚀 NISMSTUDY.COM - Production Server Started');
    console.log('='.repeat(60));
    console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`🌐 Server: http://localhost:${PORT}`);
    console.log(`🔌 API Base: http://localhost:${PORT}/api`);
    console.log(`🎯 Health Check: http://localhost:${PORT}/api/health`);
    console.log(`🔒 Security: Helmet, Rate Limiting, CORS enabled`);
    console.log(`💳 Payment: Razorpay ${process.env.RAZORPAY_KEY_ID ? 'configured' : 'not configured'}`);
    console.log('='.repeat(60));
    console.log('✨ Ready to serve students!');
    console.log('='.repeat(60) + '\n');
});

// ============ ERROR HANDLING ============

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
    console.error('❌ UNHANDLED REJECTION! Shutting down...');
    console.error(err.name, err.message);
    server.close(() => {
        process.exit(1);
    });
});

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
    console.error('❌ UNCAUGHT EXCEPTION! Shutting down...');
    console.error(err.name, err.message);
    process.exit(1);
});

// Graceful shutdown
process.on('SIGTERM', () => {
    console.log('👋 SIGTERM signal received: closing HTTP server');
    server.close(() => {
        console.log('💤 HTTP server closed');
        mongoose.connection.close(false, () => {
            console.log('💾 MongoDB connection closed');
            process.exit(0);
        });
    });
});

process.on('SIGINT', () => {
    console.log('\n👋 SIGINT signal received: closing HTTP server');
    server.close(() => {
        console.log('💤 HTTP server closed');
        mongoose.connection.close(false, () => {
            console.log('💾 MongoDB connection closed');
            process.exit(0);
        });
    });
});

module.exports = app;



