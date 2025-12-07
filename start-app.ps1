# ERP App Startup Script
$ErrorActionPreference = "Continue"
$projectPath = "E:\ERP\erp abdulrahman for sh all v 0.2.4\erp abdulrahman for sh all v 0.2.4"
$logFile = Join-Path $projectPath "startup-log.txt"

# Log function
function Write-Log {
    param($message)
    $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    "$timestamp - $message" | Out-File -FilePath $logFile -Append -ErrorAction SilentlyContinue
}

try {
    Write-Log "=== Starting ERP app startup script ==="
    
    # Change to project directory
    Set-Location "$projectPath" -ErrorAction Stop
    Write-Log "Changed directory to: $projectPath"
    
    # Find Node.js
    $nodePath = "C:\Program Files\nodejs\node.exe"
    if (-not (Test-Path $nodePath)) {
        $nodePath = "C:\Program Files (x86)\nodejs\node.exe"
    }
    if (-not (Test-Path $nodePath)) {
        throw "Node.js not found at standard locations"
    }
    Write-Log "Using Node.js at: $nodePath"
    
    # Check if server.js exists
    $serverFile = Join-Path $projectPath "server.js"
    if (-not (Test-Path $serverFile)) {
        throw "server.js not found at: $serverFile"
    }
    Write-Log "Found server.js"
    
    # Wait for system to be ready
    Start-Sleep -Seconds 5
    Write-Log "System ready check complete"
    
    # Check if port 3000 is already in use
    $portCheck = & netstat -ano 2>$null | Select-String ":3000.*LISTENING"
    if ($portCheck) {
        Write-Log "Port 3000 already in use. Server may already be running. Exiting."
        exit 0
    }
    
    # Kill any existing node processes
    $existingProcess = Get-Process -Name node -ErrorAction SilentlyContinue
    if ($existingProcess) {
        Write-Log "Stopping existing Node.js processes..."
        $existingProcess | Stop-Process -Force -ErrorAction SilentlyContinue
        Start-Sleep -Seconds 2
    }
    
    # Start the server
    Write-Log "Starting Node.js server..."
    $process = Start-Process -FilePath $nodePath -ArgumentList "server.js" -WorkingDirectory "$projectPath" -WindowStyle Hidden -PassThru
    
    if ($process) {
        Write-Log "Server process started with PID: $($process.Id)"
        Start-Sleep -Seconds 3
        
        # Verify it's running
        $verifyProcess = Get-Process -Id $process.Id -ErrorAction SilentlyContinue
        if ($verifyProcess) {
            Write-Log "SUCCESS: Server verified running (PID: $($process.Id))"
        } else {
            Write-Log "WARNING: Process may have exited"
        }
    } else {
        throw "Failed to start Node.js process"
    }
    
    Write-Log "=== Startup script completed successfully ==="
    exit 0
} catch {
    Write-Log "ERROR: $($_.Exception.Message)"
    Write-Log "ERROR Details: $($_.ToString())"
    exit 1
}
