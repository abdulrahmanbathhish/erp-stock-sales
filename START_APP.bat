@echo off
title ERP System

cd /d "%~dp0"

echo.
echo ============================================
echo   ERP STOCK ^& SALES MANAGEMENT SYSTEM
echo ============================================
echo.

REM Check Node.js
where node >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Node.js not found!
    echo Please install from: https://nodejs.org/
    echo.
    pause
    exit /b 1
)

REM Check dependencies
if not exist "node_modules" (
    echo [INFO] Installing dependencies...
    call SETUP.bat
    if %ERRORLEVEL% NEQ 0 (
        echo [ERROR] Setup failed!
        pause
        exit /b 1
    )
)

REM Check if already running
for /f "tokens=5" %%a in ('netstat -ano 2^>nul ^| findstr ":3000.*LISTENING"') do (
    echo [WARNING] Server already running on port 3000
    echo Use RESTART_APP.bat to restart
    echo.
    pause
    exit /b 1
)

echo [OK] Starting server...
echo.
echo Access at: http://localhost:3000
echo Press Ctrl+C to stop
echo ============================================
echo.

node server.js 2>&1

if %ERRORLEVEL% NEQ 0 (
    echo.
    echo [ERROR] Server stopped with error
    pause
)
