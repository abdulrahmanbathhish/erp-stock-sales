# ============================================
# ERP Stock & Sales Management System
# Restart Server Script (PowerShell)
# ============================================

$ErrorActionPreference = "Continue"
$projectPath = Split-Path -Parent $MyInvocation.MyCommand.Path
$logFile = Join-Path $projectPath "startup-log.txt"

# Log function
function Write-Log {
    param($message)
    $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    "$timestamp - $message" | Out-File -FilePath $logFile -Append -ErrorAction SilentlyContinue
    Write-Host $message
}

Write-Host ""
Write-Host "============================================" -ForegroundColor Cyan
Write-Host "  ERP STOCK & SALES MANAGEMENT SYSTEM" -ForegroundColor Cyan
Write-Host "  Restarting Server..." -ForegroundColor Cyan
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""

try {
    Set-Location $projectPath -ErrorAction Stop
    Write-Log "[1/4] Stopping any existing server instances..."
    
    # Find and kill Node.js processes running server.js
    $nodeProcesses = Get-Process -Name node -ErrorAction SilentlyContinue
    foreach ($proc in $nodeProcesses) {
        try {
            $cmdLine = (Get-CimInstance Win32_Process -Filter "ProcessId = $($proc.Id)").CommandLine
            if ($cmdLine -like "*server.js*") {
                Write-Log "  Stopping process PID: $($proc.Id)"
                Stop-Process -Id $proc.Id -Force -ErrorAction SilentlyContinue
            }
        } catch {
            # Ignore errors
        }
    }
    
    # Also kill processes using port 3000
    $portProcesses = Get-NetTCPConnection -LocalPort 3000 -ErrorAction SilentlyContinue | 
                     Select-Object -ExpandProperty OwningProcess -Unique
    foreach ($pid in $portProcesses) {
        Write-Log "  Stopping process using port 3000 (PID: $pid)"
        Stop-Process -Id $pid -Force -ErrorAction SilentlyContinue
    }
    
    Start-Sleep -Seconds 2
    Write-Log "  [OK] Cleanup complete"
    Write-Host ""
    
    # Check Node.js
    Write-Log "[2/4] Checking Node.js installation..."
    $nodePath = Get-Command node -ErrorAction SilentlyContinue
    if (-not $nodePath) {
        throw "Node.js is not installed or not in PATH. Please install from https://nodejs.org/"
    }
    Write-Log "  [OK] Node.js found"
    Write-Host ""
    
    # Check dependencies
    Write-Log "[3/4] Checking dependencies..."
    if (-not (Test-Path (Join-Path $projectPath "node_modules"))) {
        Write-Log "  [WARNING] Dependencies not installed. Running setup..."
        & "$projectPath\SETUP.bat"
        if ($LASTEXITCODE -ne 0) {
            throw "Setup failed"
        }
    } else {
        Write-Log "  [OK] Dependencies found"
    }
    Write-Host ""
    
    # Start server
    Write-Log "[4/4] Starting server..."
    Write-Host ""
    Write-Host "============================================" -ForegroundColor Green
    Write-Host "  Server will be accessible on:" -ForegroundColor Green
    Write-Host "  - Local: http://localhost:3000" -ForegroundColor Green
    Write-Host "  - Network: http://[YOUR-IP]:3000" -ForegroundColor Green
    Write-Host "============================================" -ForegroundColor Green
    Write-Host ""
    
    # Start the server in foreground
    Set-Location $projectPath
    node server.js
    
} catch {
    Write-Log "ERROR: $($_.Exception.Message)"
    Write-Host ""
    Write-Host "[ERROR] $($_.Exception.Message)" -ForegroundColor Red
    Write-Host ""
    pause
    exit 1
}

