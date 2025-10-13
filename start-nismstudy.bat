@echo off
echo ===============================================
echo    NISMSTUDY.COM - Quick Start
echo ===============================================
echo.

echo Navigating to the website directory...
cd /d "C:\Users\croma\nismstudy-website"

echo Current directory: %CD%
echo.

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
    echo Please check if the files are in the correct location.
    echo.
    echo Files in current directory:
    dir
    pause
)