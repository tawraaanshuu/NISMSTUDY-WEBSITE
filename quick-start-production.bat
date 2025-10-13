@echo off
:: ========================================
:: NISMSTUDY.COM - Production Quick Start
:: ========================================

cls
echo.
echo ============================================================
echo    NISMSTUDY.COM - Production Quick Start Setup
echo ============================================================
echo.

:: Check if Node.js is installed
node --version >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Node.js is not installed!
    echo.
    echo Please install Node.js from: https://nodejs.org
    echo.
    pause
    exit /b 1
)

echo [INFO] Node.js is installed
node --version
echo.

:: Check if npm is available
npm --version >nul 2>&1
if errorlevel 1 (
    echo [ERROR] npm is not available!
    pause
    exit /b 1
)

echo [INFO] npm is installed
npm --version
echo.

echo ============================================================
echo Step 1: Installing Dependencies
echo ============================================================
echo.

echo [INFO] Installing npm packages...
call npm install

if errorlevel 1 (
    echo.
    echo [ERROR] Failed to install dependencies!
    pause
    exit /b 1
)

echo.
echo [SUCCESS] Dependencies installed successfully!
echo.

:: Check if .env exists
if not exist .env (
    echo ============================================================
    echo Step 2: Setting up Environment Variables
    echo ============================================================
    echo.
    echo [WARNING] .env file not found!
    echo.
    echo Please create a .env file with your configuration.
    echo You can copy .env.example and update the values.
    echo.
    echo Required variables:
    echo   - MONGODB_URI
    echo   - JWT_SECRET
    echo   - SESSION_SECRET
    echo   - ADMIN_EMAIL
    echo   - ADMIN_PASSWORD
    echo   - RAZORPAY_KEY_ID
    echo   - RAZORPAY_KEY_SECRET
    echo.
    
    set /p CREATE_ENV="Do you want to create a basic .env file now? (y/n): "
    if /i "%CREATE_ENV%"=="y" (
        echo Creating basic .env file...
        (
            echo # Server Configuration
            echo PORT=5000
            echo NODE_ENV=development
            echo FRONTEND_URL=http://localhost:5000
            echo.
            echo # Database - UPDATE THIS!
            echo MONGODB_URI=mongodb://localhost:27017/nismstudy
            echo.
            echo # Security - GENERATE NEW ONES!
            echo JWT_SECRET=change_this_to_random_string_min_32_chars
            echo SESSION_SECRET=change_this_to_random_string_min_32_chars
            echo.
            echo # Admin Credentials - CHANGE THESE!
            echo ADMIN_EMAIL=admin@nismstudy.com
            echo ADMIN_PASSWORD=Admin@123456
            echo.
            echo # Razorpay - Add your keys
            echo RAZORPAY_KEY_ID=your_razorpay_key_id
            echo RAZORPAY_KEY_SECRET=your_razorpay_key_secret
            echo.
            echo # File Upload
            echo MAX_FILE_SIZE=10485760
            echo UPLOAD_PATH=./uploads
            echo.
            echo # Quiz Configuration
            echo QUIZ_50_QUESTIONS_TIME=7200
            echo QUIZ_100_QUESTIONS_TIME=10800
            echo PASSING_PERCENTAGE=60
        ) > .env
        
        echo.
        echo [SUCCESS] Basic .env file created!
        echo.
        echo [IMPORTANT] Please edit .env file and update:
        echo   1. MONGODB_URI with your MongoDB connection string
        echo   2. JWT_SECRET and SESSION_SECRET with random strings
        echo   3. RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET with your keys
        echo.
    )
) else (
    echo.
    echo [SUCCESS] .env file found!
    echo.
)

:: Ask about database seeding
echo ============================================================
echo Step 3: Database Setup
echo ============================================================
echo.

set /p SEED_DB="Do you want to seed sample data (courses, materials)? (y/n): "
if /i "%SEED_DB%"=="y" (
    echo.
    echo [INFO] Seeding database with sample data...
    call npm run seed
    
    if errorlevel 1 (
        echo.
        echo [WARNING] Database seeding failed!
        echo This might be because MongoDB is not running or not configured.
        echo.
    ) else (
        echo.
        echo [SUCCESS] Database seeded successfully!
        echo.
    )
)

:: Ask about admin creation
echo ============================================================
echo Step 4: Admin Account
echo ============================================================
echo.

set /p CREATE_ADMIN="Do you want to create an admin account? (y/n): "
if /i "%CREATE_ADMIN%"=="y" (
    echo.
    echo [INFO] Creating admin account...
    call npm run init-admin
    
    if errorlevel 1 (
        echo.
        echo [WARNING] Admin creation failed!
        echo You can create it later by running: npm run init-admin
        echo.
    )
)

:: Run tests
echo ============================================================
echo Step 5: Testing API Endpoints
echo ============================================================
echo.

set /p RUN_TESTS="Do you want to run API tests? (y/n): "
if /i "%RUN_TESTS%"=="y" (
    echo.
    echo [INFO] Running API tests...
    call npm run test
    echo.
)

:: Final instructions
echo.
echo ============================================================
echo Setup Complete!
echo ============================================================
echo.
echo Your NISMSTUDY.COM platform is ready!
echo.
echo To start the server:
echo   - Development mode:  npm start
echo   - Production mode:   npm run start:prod
echo   - Demo mode:         npm run demo
echo.
echo Access your website at:
echo   http://localhost:5000
echo.
echo Admin Panel:
echo   http://localhost:5000/public/admin-panel.html
echo.
echo Student Dashboard:
echo   http://localhost:5000/public/dashboard.html
echo.
echo API Health Check:
echo   http://localhost:5000/api/health
echo.
echo ============================================================
echo Next Steps:
echo ============================================================
echo.
echo 1. Edit .env file with your MongoDB and Razorpay credentials
echo 2. Start the server: npm start
echo 3. Open browser: http://localhost:5000
echo 4. Login as admin and upload course content
echo 5. Review PRODUCTION_SETUP_GUIDE.md for detailed instructions
echo.
echo ============================================================
echo Documentation:
echo ============================================================
echo.
echo   IMPROVEMENTS_SUMMARY.md       - What's new
echo   PRODUCTION_SETUP_GUIDE.md     - Complete setup guide
echo   PRODUCTION_ROADMAP_30DAYS.md  - 30-day launch plan
echo   DEPLOYMENT_GUIDE.md           - Hosting options
echo.
echo ============================================================
echo.

set /p START_SERVER="Do you want to start the server now? (y/n): "
if /i "%START_SERVER%"=="y" (
    echo.
    echo [INFO] Starting server...
    echo.
    echo Press Ctrl+C to stop the server
    echo.
    call npm start
) else (
    echo.
    echo To start later, run: npm start
    echo.
)

pause



