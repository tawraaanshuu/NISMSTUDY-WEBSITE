@echo off
echo ===============================================
echo    NISMSTUDY.COM - Website Starter
echo ===============================================
echo.

REM Navigate to the correct directory
cd /d "%~dp0"

echo Current directory: %CD%
echo.

REM Check if demo-server.js exists
if exist "demo-server.js" (
    echo ✅ Found demo-server.js
    echo.
    echo Starting NISMSTUDY.COM website...
    echo.
    echo 🌐 Website: http://localhost:5000
    echo 🎯 Admin Panel: http://localhost:5000/admin.html
    echo.
    echo 📝 Demo Login:
    echo    Email: admin@nismstudy.com
    echo    Password: Admin@123456
    echo.
    echo Press Ctrl+C to stop the server
    echo.
    node demo-server.js
) else (
    echo ❌ demo-server.js not found!
    echo Please make sure you are in the correct directory.
    echo.
    echo Files in current directory:
    dir
    pause
)