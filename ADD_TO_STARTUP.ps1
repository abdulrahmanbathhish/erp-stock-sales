# ============================================
# ERP Stock & Sales Management System
# Add to Windows Startup Script
# ============================================

Write-Host ""
Write-Host "============================================" -ForegroundColor Cyan
Write-Host "  ERP STOCK & SALES MANAGEMENT SYSTEM" -ForegroundColor Cyan
Write-Host "  Adding to Windows Startup..." -ForegroundColor Cyan
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""

# Get the current script directory
$scriptPath = Split-Path -Parent $MyInvocation.MyCommand.Path
$startupBat = Join-Path $scriptPath "START_ON_BOOT.bat"

# Check if START_ON_BOOT.bat exists
if (-not (Test-Path $startupBat)) {
    Write-Host "[ERROR] START_ON_BOOT.bat not found!" -ForegroundColor Red
    Write-Host "Please make sure you're running this script from the ERP directory." -ForegroundColor Yellow
    Write-Host ""
    pause
    exit 1
}

# Get Windows Startup folder path
$startupFolder = [System.Environment]::GetFolderPath("Startup")
$shortcutPath = Join-Path $startupFolder "ERP_Stock_Sales.lnk"

Write-Host "Startup folder: $startupFolder" -ForegroundColor Gray
Write-Host "Creating shortcut: $shortcutPath" -ForegroundColor Gray
Write-Host ""

try {
    # Create WScript Shell object
    $WshShell = New-Object -ComObject WScript.Shell
    
    # Create shortcut
    $Shortcut = $WshShell.CreateShortcut($shortcutPath)
    $Shortcut.TargetPath = $startupBat
    $Shortcut.WorkingDirectory = $scriptPath
    $Shortcut.Description = "ERP Stock & Sales Management System - Auto Start"
    $Shortcut.WindowStyle = 7  # Minimized window
    $Shortcut.Save()
    
    Write-Host "[SUCCESS] ERP app has been added to Windows Startup!" -ForegroundColor Green
    Write-Host ""
    Write-Host "The app will now start automatically when you restart your PC." -ForegroundColor Yellow
    Write-Host ""
    Write-Host "To remove from startup:" -ForegroundColor Gray
    Write-Host "  1. Press Win+R, type: shell:startup" -ForegroundColor Gray
    Write-Host "  2. Delete the 'ERP_Stock_Sales.lnk' shortcut" -ForegroundColor Gray
    Write-Host ""
    
} catch {
    Write-Host "[ERROR] Failed to create startup shortcut: $_" -ForegroundColor Red
    Write-Host ""
    Write-Host "You can manually add it to startup:" -ForegroundColor Yellow
    Write-Host "  1. Press Win+R, type: shell:startup" -ForegroundColor Yellow
    Write-Host "  2. Create a shortcut to: $startupBat" -ForegroundColor Yellow
    Write-Host ""
    pause
    exit 1
}

Write-Host "Press any key to exit..."
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")

