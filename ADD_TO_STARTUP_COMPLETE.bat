@echo off
REM ============================================
REM ERP Stock & Sales Management System
REM Complete Startup Setup (All Methods)
REM ============================================

echo.
echo ============================================
echo   ERP STOCK ^& SALES MANAGEMENT SYSTEM
echo   Adding to Windows Startup...
echo ============================================
echo.

REM Check if running as administrator
net session >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo [WARNING] Not running as Administrator.
    echo Some startup methods may require admin rights.
    echo.
)

REM Get script directory
set "SCRIPT_DIR=%~dp0"
set "STARTUP_BAT=%SCRIPT_DIR%START_ON_BOOT.bat"

REM Check if START_ON_BOOT.bat exists
if not exist "%STARTUP_BAT%" (
    echo [ERROR] START_ON_BOOT.bat not found!
    echo Please make sure you're running this from the ERP directory.
    echo.
    pause
    exit /b 1
)

echo [1/3] Creating shortcut in Startup folder...
echo.

REM Method 1: Add shortcut to Startup folder (User-level)
set "STARTUP_FOLDER=%APPDATA%\Microsoft\Windows\Start Menu\Programs\Startup"
set "SHORTCUT_PATH=%STARTUP_FOLDER%\ERP_Stock_Sales.lnk"

REM Use PowerShell to create shortcut
powershell -Command "$WshShell = New-Object -ComObject WScript.Shell; $Shortcut = $WshShell.CreateShortcut('%SHORTCUT_PATH%'); $Shortcut.TargetPath = '%STARTUP_BAT%'; $Shortcut.WorkingDirectory = '%SCRIPT_DIR%'; $Shortcut.Description = 'ERP Stock ^& Sales Management System - Auto Start'; $Shortcut.WindowStyle = 7; $Shortcut.Save()"

if %ERRORLEVEL% EQU 0 (
    echo   [OK] Shortcut created in Startup folder
) else (
    echo   [WARNING] Could not create shortcut automatically
    echo   You can manually create it:
    echo   1. Press Win+R, type: shell:startup
    echo   2. Create a shortcut to: %STARTUP_BAT%
)
echo.

echo [2/3] Adding to Windows Registry (Current User)...
echo.

REM Method 2: Add to Registry Run key (User-level)
for /f "tokens=2*" %%a in ('reg query "HKCU\Software\Microsoft\Windows\CurrentVersion\Run" /v "ERP_Stock_Sales" 2^>nul') do (
    echo   Removing existing registry entry...
    reg delete "HKCU\Software\Microsoft\Windows\CurrentVersion\Run" /v "ERP_Stock_Sales" /f >nul 2>&1
)

reg add "HKCU\Software\Microsoft\Windows\CurrentVersion\Run" /v "ERP_Stock_Sales" /t REG_SZ /d "\"%STARTUP_BAT%\"" /f >nul 2>&1

if %ERRORLEVEL% EQU 0 (
    echo   [OK] Added to Windows Registry (Current User)
) else (
    echo   [WARNING] Could not add to registry
)
echo.

echo [3/3] Verifying startup configuration...
echo.

if exist "%SHORTCUT_PATH%" (
    echo   [OK] Startup shortcut exists
) else (
    echo   [WARNING] Startup shortcut not found
)

reg query "HKCU\Software\Microsoft\Windows\CurrentVersion\Run" /v "ERP_Stock_Sales" >nul 2>&1
if %ERRORLEVEL% EQU 0 (
    echo   [OK] Registry entry exists
) else (
    echo   [WARNING] Registry entry not found
)
echo.

echo ============================================
echo   SETUP COMPLETE!
echo ============================================
echo.
echo The ERP app will now start automatically when you restart your laptop.
echo.
echo Server will be accessible on:
echo   - Local: http://localhost:3000
echo   - Network: http://[YOUR-IP]:3000 (for WiFi users)
echo.
echo To remove from startup:
echo   1. Press Win+R, type: shell:startup
echo   2. Delete the 'ERP_Stock_Sales.lnk' shortcut
echo   3. Or run: REMOVE_FROM_STARTUP.bat
echo.
echo To restart the app now, run: RESTART_APP.bat
echo.
pause

