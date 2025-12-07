@echo off
REM ============================================
REM ERP Stock & Sales Management System
REM Add to Windows Startup (Easy Method)
REM ============================================

echo.
echo ============================================
echo   ERP STOCK ^& SALES MANAGEMENT SYSTEM
echo   Adding to Windows Startup...
echo ============================================
echo.

REM Check if PowerShell is available
powershell -Command "Get-ExecutionPolicy" >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] PowerShell is not available.
    echo.
    echo Please run ADD_TO_STARTUP.ps1 manually, or:
    echo 1. Press Win+R, type: shell:startup
    echo 2. Create a shortcut to: START_ON_BOOT.bat
    echo.
    pause
    exit /b 1
)

REM Run PowerShell script
powershell -ExecutionPolicy Bypass -File "%~dp0ADD_TO_STARTUP.ps1"

