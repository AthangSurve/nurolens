@echo off
chcp 65001 >nul
title NeuroLens Stopper

echo.
echo ========================================================
echo    🛑 Stopping NeuroLens Servers (Ports 5000 & 5173)
echo ========================================================
echo.

:: Kill process listening on port 5000 (Backend)
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :5000 ^| findstr LISTENING') do (
    echo Stopping Backend process (PID %%a)...
    taskkill /F /PID %%a >nul 2>&1
)

:: Kill process listening on port 5173 (Frontend)
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :5173 ^| findstr LISTENING') do (
    echo Stopping Frontend process (PID %%a)...
    taskkill /F /PID %%a >nul 2>&1
)

echo.
echo ✅ NeuroLens servers stopped.
echo.
timeout /t 2 >nul

