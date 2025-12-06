@echo off
REM ============================================
REM ERP Stock & Sales Management System
REM Windows Setup Script (First Time Installation)
REM ============================================

title ERP System - Setup

echo.
echo ============================================
echo   ERP STOCK ^& SALES MANAGEMENT SYSTEM
echo   First Time Setup
echo ============================================
echo.

REM Check if Node.js is installed
where node >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Node.js is not installed!
    echo.
    echo Please install Node.js first:
    echo   1. Go to: https://nodejs.org/
    echo   2. Download the LTS version (recommended)
    echo   3. Run the installer
    echo   4. Restart your computer
    echo   5. Run this setup script again
    echo.
    echo Press any key to open Node.js download page...
    pause >nul
    start https://nodejs.org/
    exit /b 1
)

echo [OK] Node.js is installed
node --version
echo.

REM Check if npm is available
where npm >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] npm (Node Package Manager) is not available.
    echo Please reinstall Node.js.
    pause
    exit /b 1
)

echo [OK] npm is available
npm --version
echo.

REM Change to script directory
cd /d "%~dp0"

echo ============================================
echo Installing dependencies...
echo This may take a few minutes...
echo ============================================
echo.

REM Install dependencies
call npm install

if %ERRORLEVEL% NEQ 0 (
    echo.
    echo [ERROR] Failed to install dependencies.
    echo Please check the error messages above.
    echo.
    pause
    exit /b 1
)

echo.
echo ============================================
echo [SUCCESS] Setup completed successfully!
echo ============================================
echo.
echo The system is now ready to use.
echo.
echo To start the server, double-click: START_SERVER.bat
echo.
echo Press any key to start the server now...
pause >nul

REM Start the server
call START_SERVER.bat

