@echo off
REM ============================================
REM Create Desktop Shortcut for ERP System
REM ============================================

title Create Desktop Shortcut

echo.
echo ============================================
echo   Creating Desktop Shortcut...
echo ============================================
echo.

REM Get the current directory and desktop path
set "SCRIPT_DIR=%~dp0"
set "DESKTOP=%USERPROFILE%\Desktop"
set "SHORTCUT_NAME=ERP Stock & Sales System.lnk"

REM Create VBScript to create shortcut
set "VBS=%TEMP%\create_shortcut.vbs"
echo Set oWS = WScript.CreateObject("WScript.Shell") > "%VBS%"
echo sLinkFile = "%DESKTOP%\%SHORTCUT_NAME%" >> "%VBS%"
echo Set oLink = oWS.CreateShortcut(sLinkFile) >> "%VBS%"
echo oLink.TargetPath = "%SCRIPT_DIR%START_SERVER.bat" >> "%VBS%"
echo oLink.WorkingDirectory = "%SCRIPT_DIR%" >> "%VBS%"
echo oLink.Description = "ERP Stock & Sales Management System" >> "%VBS%"
echo oLink.IconLocation = "shell32.dll,137" >> "%VBS%"
echo oLink.Save >> "%VBS%"

REM Run the VBScript
cscript //nologo "%VBS%"

REM Clean up
del "%VBS%"

if exist "%DESKTOP%\%SHORTCUT_NAME%" (
    echo.
    echo [SUCCESS] Desktop shortcut created!
    echo.
    echo You can now double-click "ERP Stock ^& Sales System" 
    echo on your desktop to start the server.
    echo.
) else (
    echo.
    echo [WARNING] Could not create shortcut automatically.
    echo.
    echo You can manually create a shortcut:
    echo   1. Right-click START_SERVER.bat
    echo   2. Select "Create shortcut"
    echo   3. Move the shortcut to your Desktop
    echo.
)

pause

