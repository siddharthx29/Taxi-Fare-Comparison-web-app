@echo off
title RideCompare Local Startup
echo ====================================================
echo         Starting RideCompare (Local Environment)     
echo ====================================================

:: Ensure we are in the correct directory
cd "%~dp0"
cd backend

echo 📦 Checking and installing dependencies...
call npm install

echo 🗄️ Setting up database and running migrations...
call npm run db:setup
if %ERRORLEVEL% neq 0 (
    echo.
    echo ❌ Database setup failed!
    echo Please make sure PostgreSQL is running on port 5432 and the password matches in backend/.env.
    echo.
    pause
    exit /b 1
)

echo 🚀 Starting local backend server in development mode...
call npm run dev
