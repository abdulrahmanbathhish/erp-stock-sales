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

REM Check exit code - only show error for actual errors, not Ctrl+C
REM Exit codes: 0 = success, 1/130 = Ctrl+C (normal), others = actual errors
set EXIT_CODE=%ERRORLEVEL%
if %EXIT_CODE% NEQ 0 (
    if %EXIT_CODE% EQU 1 (
        REM Exit code 1 is common for Ctrl+C, treat as normal shutdown
        exit /b 0
    )
    if %EXIT_CODE% EQU 130 (
        REM Exit code 130 is also Ctrl+C (SIGINT), treat as normal shutdown
        exit /b 0
    )
    REM Other exit codes indicate actual errors
    echo.
    echo [ERROR] Server stopped with an error (Exit code: %EXIT_CODE%).
    echo.
    pause
    exit /b %EXIT_CODE%
)

