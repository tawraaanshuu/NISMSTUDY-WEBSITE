@echo off
echo ========================================
echo   NISMSTUDY.COM Server Startup
echo ========================================
echo.

echo Checking for existing processes on port 5000...
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :5000') do (
    echo Killing process %%a on port 5000
    taskkill /F /PID %%a 2>nul
)

echo.
echo Starting NISMSTUDY.COM Server...
echo.

REM Try to start the server
node server.js

echo.
echo If you see any errors above, try running:
echo   npm run demo
echo.
pause


