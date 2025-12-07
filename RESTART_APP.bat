@echo off
title ERP System - Restart

cd /d "%~dp0"

echo.
echo ============================================
echo   ERP STOCK ^& SALES MANAGEMENT SYSTEM
echo   Restarting Server...
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

echo [1/3] Stopping existing server...
echo.

REM Stop Node.js processes running server.js
for /f "tokens=2" %%a in ('tasklist /FI "IMAGENAME eq node.exe" /FO LIST 2^>nul ^| findstr /I "PID"') do (
    for /f "tokens=*" %%b in ('wmic process where "ProcessId=%%a" get CommandLine /format:list 2^>nul ^| findstr /I "server.js"') do (
        taskkill /F /PID %%a >nul 2>&1
    )
)

REM Stop by port 3000
for /f "tokens=5" %%a in ('netstat -ano 2^>nul ^| findstr ":3000.*LISTENING"') do (
    taskkill /F /PID %%a >nul 2>&1
)

timeout /t 2 /nobreak >nul
echo [OK] Server stopped
echo.

REM Check dependencies
echo [2/3] Checking dependencies...
if not exist "node_modules" (
    echo [INFO] Installing dependencies...
    call SETUP.bat
    if %ERRORLEVEL% NEQ 0 (
        echo [ERROR] Setup failed!
        pause
        exit /b 1
    )
) else (
    echo [OK] Dependencies found
)
echo.

REM Start server
echo [3/3] Starting server...
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

