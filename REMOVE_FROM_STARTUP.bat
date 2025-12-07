@echo off
REM ============================================
REM ERP Stock & Sales Management System
REM Remove from Windows Startup
REM ============================================

echo.
echo ============================================
echo   ERP STOCK ^& SALES MANAGEMENT SYSTEM
echo   Removing from Windows Startup...
echo ============================================
echo.

REM Remove shortcut from Startup folder
set "STARTUP_FOLDER=%APPDATA%\Microsoft\Windows\Start Menu\Programs\Startup"
set "SHORTCUT_PATH=%STARTUP_FOLDER%\ERP_Stock_Sales.lnk"

if exist "%SHORTCUT_PATH%" (
    del "%SHORTCUT_PATH%" >nul 2>&1
    if %ERRORLEVEL% EQU 0 (
        echo [OK] Removed shortcut from Startup folder
    ) else (
        echo [WARNING] Could not remove shortcut
    )
) else (
    echo [INFO] No shortcut found in Startup folder
)
echo.

REM Remove from Registry
reg query "HKCU\Software\Microsoft\Windows\CurrentVersion\Run" /v "ERP_Stock_Sales" >nul 2>&1
if %ERRORLEVEL% EQU 0 (
    reg delete "HKCU\Software\Microsoft\Windows\CurrentVersion\Run" /v "ERP_Stock_Sales" /f >nul 2>&1
    if %ERRORLEVEL% EQU 0 (
        echo [OK] Removed from Windows Registry
    ) else (
        echo [WARNING] Could not remove from registry
    )
) else (
    echo [INFO] No registry entry found
)
echo.

echo ============================================
echo   REMOVAL COMPLETE!
echo ============================================
echo.
echo The ERP app will no longer start automatically.
echo.
pause
