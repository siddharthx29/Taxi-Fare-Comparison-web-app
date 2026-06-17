# RideCompare Local Startup Script (Windows PowerShell)

Write-Host "====================================================" -ForegroundColor Cyan
Write-Host "        Starting RideCompare (Local Environment)     " -ForegroundColor Cyan
Write-Host "====================================================" -ForegroundColor Cyan

# Ensure we run in backend directory
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
if ($ScriptDir) {
    Set-Location $ScriptDir
}
Set-Location backend

# Install dependencies if node_modules doesn't exist or just standard npm install
Write-Host "📦 Checking and installing dependencies..." -ForegroundColor Gray
npm install

# Check database availability, ensure DB exists, and execute migrations
Write-Host "🗄️ Setting up database and running migrations..." -ForegroundColor Gray
npm run db:setup

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Database setup failed. Please make sure PostgreSQL is running on port 5432 and the password matches in backend/.env." -ForegroundColor Red
    Exit 1
}

# Launch the Express server
Write-Host "🚀 Starting local backend server in development mode..." -ForegroundColor Green
npm run dev
