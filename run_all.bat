@echo off
chcp 65001 >nul
setlocal enabledelayedexpansion

title NeuroLens Launcher

echo.
echo ========================================================
echo    🧠 NeuroLens (CogniFusion) - Multi-Modal AI Platform
echo ========================================================
echo.

:: Ensure we are running from project root
cd /d "%~dp0"

:: 1. Check for Node.js
where node >nul 2>&1
if %ERRORLEVEL% neq 0 (
    echo [ERROR] Node.js is not installed or not in PATH!
    echo Please install Node.js (v18+) from https://nodejs.org/
    pause
    exit /b 1
)

:: 2. Check backend dependencies
if not exist "backend\node_modules" (
    echo [SETUP] Installing backend dependencies...
    cd backend
    call npm install
    cd ..
)

:: 3. Check frontend dependencies
if not exist "frontend\node_modules" (
    echo [SETUP] Installing frontend dependencies...
    cd frontend
    call npm install
    cd ..
)

:: 4. Start Backend Server in a new window
echo [STARTING] Launching Backend API on http://localhost:5000 ...
start "NeuroLens Backend [Port 5000]" cmd /k "title NeuroLens Backend [Port 5000] && cd /d "%~dp0backend" && node server.js"

:: 5. Short pause to allow backend to bind port
timeout /t 2 /nobreak >nul

:: 6. Start Frontend Server in a new window
echo [STARTING] Launching Frontend Client on http://localhost:5173 ...
start "NeuroLens Frontend [Port 5173]" cmd /k "title NeuroLens Frontend [Port 5173] && cd /d "%~dp0frontend" && npm run dev"

:: 7. Wait for Vite server to initialize
timeout /t 3 /nobreak >nul

:: 8. Open Web Browser
echo [OPENING] Opening application in your browser...
start http://localhost:5173

echo.
echo ========================================================
echo   ✅ NeuroLens is now running!
echo ========================================================
echo   • Frontend UI: http://localhost:5173
echo   • Backend API: http://localhost:5000
echo   • API Health:  http://localhost:5000/health
echo ========================================================
echo   To shut down, close the terminal windows or run stop.bat
echo.
pause

