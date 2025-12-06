@echo off
REM ============================================
REM ERP Stock & Sales Management System
REM Windows Startup Script
REM ============================================

title ERP Stock & Sales Management System

echo.
echo ============================================
echo   ERP STOCK ^& SALES MANAGEMENT SYSTEM
echo   Starting Server...
echo ============================================
echo.

REM Check if Node.js is installed
where node >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Node.js is not installed or not in PATH.
    echo.
    echo Please install Node.js from: https://nodejs.org/
    echo Then run this script again.
    echo.
    pause
    exit /b 1
)

REM Change to script directory
cd /d "%~dp0"

REM Check if node_modules exists (dependencies installed)
if not exist "node_modules" (
    echo [INFO] Installing dependencies...
    echo.
    call npm install
    if %ERRORLEVEL% NEQ 0 (
        echo.
        echo [ERROR] Failed to install dependencies.
        echo.
        pause
        exit /b 1
    )
    echo.
    echo [SUCCESS] Dependencies installed successfully!
    echo.
)

echo Starting server...
echo.
echo ============================================
echo.

REM Start the server
node server.js

REM If server exits, pause so user can see any error messages
if %ERRORLEVEL% NEQ 0 (
    echo.
    echo [ERROR] Server stopped with an error.
    echo.
    pause
)

