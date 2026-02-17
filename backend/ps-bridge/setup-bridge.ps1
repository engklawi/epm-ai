<#
.SYNOPSIS
    Sets up the PS Bridge Server on the Project Server VM.
    Run this once to install Node.js, copy files, and register as a Windows Service.

.DESCRIPTION
    1. Checks if Node.js is installed (installs if not)
    2. Creates the bridge directory at C:\ps-bridge
    3. Copies script files
    4. Installs npm dependencies (express)
    5. Opens firewall port 8080
    6. Registers as a Windows Service using NSSM (or creates a scheduled task)
    7. Starts the service

.NOTES
    Run as Administrator!
#>

$ErrorActionPreference = "Stop"
$BridgeDir = "C:\ps-bridge"

Write-Host "=== PS Bridge Server Setup ===" -ForegroundColor Cyan

# 1. Check Node.js
Write-Host "`n[1/6] Checking Node.js..." -ForegroundColor Yellow
$nodeVersion = $null
try {
    $nodeVersion = & node --version 2>$null
} catch {}

if (-not $nodeVersion) {
    Write-Host "  Node.js not found. Installing..." -ForegroundColor Red

    # Download Node.js LTS
    $nodeUrl = "https://nodejs.org/dist/v20.11.1/node-v20.11.1-x64.msi"
    $nodeInstaller = "$env:TEMP\node-installer.msi"

    Write-Host "  Downloading Node.js..."
    [Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12
    Invoke-WebRequest -Uri $nodeUrl -OutFile $nodeInstaller -UseBasicParsing

    Write-Host "  Installing Node.js..."
    Start-Process msiexec.exe -Wait -ArgumentList "/i `"$nodeInstaller`" /qn" -NoNewWindow

    # Refresh PATH
    $env:Path = [System.Environment]::GetEnvironmentVariable("Path","Machine") + ";" + [System.Environment]::GetEnvironmentVariable("Path","User")

    $nodeVersion = & node --version
    Write-Host "  Installed Node.js $nodeVersion" -ForegroundColor Green
} else {
    Write-Host "  Node.js $nodeVersion found" -ForegroundColor Green
}

# 2. Create bridge directory
Write-Host "`n[2/6] Setting up $BridgeDir..." -ForegroundColor Yellow
if (-not (Test-Path $BridgeDir)) {
    New-Item -ItemType Directory -Path $BridgeDir -Force | Out-Null
}

# 3. Copy files
Write-Host "`n[3/6] Copying files..." -ForegroundColor Yellow
$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
Copy-Item "$scriptDir\bridge-server.js" "$BridgeDir\bridge-server.js" -Force
Copy-Item "$scriptDir\Invoke-PSAssignment.ps1" "$BridgeDir\Invoke-PSAssignment.ps1" -Force
Write-Host "  Copied bridge-server.js and Invoke-PSAssignment.ps1" -ForegroundColor Green

# 4. Install npm dependencies
Write-Host "`n[4/6] Installing npm dependencies..." -ForegroundColor Yellow
Push-Location $BridgeDir

# Create minimal package.json if it doesn't exist
if (-not (Test-Path "package.json")) {
    @{
        name = "ps-bridge"
        version = "1.0.0"
        description = "Project Server CSOM Bridge"
        main = "bridge-server.js"
    } | ConvertTo-Json | Out-File -FilePath "package.json" -Encoding utf8
}

& npm install express --save 2>&1 | Out-Null
Write-Host "  Express installed" -ForegroundColor Green
Pop-Location

# 5. Open firewall port
Write-Host "`n[5/6] Configuring firewall..." -ForegroundColor Yellow
$existingRule = Get-NetFirewallRule -DisplayName "PS Bridge Server" -ErrorAction SilentlyContinue
if ($existingRule) {
    Remove-NetFirewallRule -DisplayName "PS Bridge Server"
}
New-NetFirewallRule -DisplayName "PS Bridge Server" -Direction Inbound -Protocol TCP -LocalPort 8080 -Action Allow | Out-Null
Write-Host "  Firewall rule added for port 8080" -ForegroundColor Green

# 6. Create a scheduled task to run at startup (simpler than NSSM)
Write-Host "`n[6/6] Registering startup task..." -ForegroundColor Yellow

$taskName = "PSBridgeServer"
$existingTask = Get-ScheduledTask -TaskName $taskName -ErrorAction SilentlyContinue
if ($existingTask) {
    Unregister-ScheduledTask -TaskName $taskName -Confirm:$false
}

# Create a batch file to start the bridge
# IMPORTANT: PWA_URL must use the IP-based binding, NOT localhost
# (IIS bindings are IP-specific: 10.128.0.2:80 and 34.29.110.174:80)
$batchContent = @"
@echo off
cd /d C:\ps-bridge
set PS_PASSWORD=rXr<{=eiKQ,49+V
set PWA_URL=http://34.29.110.174/pwa
set PS_USERNAME=info
set PS_DOMAIN=EPMTRIAL
set NODE_OPTIONS=--max-old-space-size=512

REM Log rotation: archive if > 10MB
for %%F in (bridge.log) do if %%~zF GTR 10485760 (
    move /y bridge.log bridge.log.old
)

node bridge-server.js >> C:\ps-bridge\bridge.log 2>&1
"@
$batchContent | Out-File -FilePath "$BridgeDir\start-bridge.bat" -Encoding ascii

# Create a watchdog script that monitors the bridge and restarts if down
$watchdogContent = @'
# PS Bridge Watchdog - runs every 5 minutes via scheduled task
# Checks if the bridge is responding and restarts if not

$logFile = "C:\ps-bridge\watchdog.log"
$maxLogSize = 5MB

# Log rotation
if (Test-Path $logFile) {
    if ((Get-Item $logFile).Length -gt $maxLogSize) {
        Move-Item -Path $logFile -Destination "$logFile.old" -Force
    }
}

function Log($msg) {
    $ts = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    "$ts  $msg" | Out-File -FilePath $logFile -Append
}

try {
    $response = Invoke-WebRequest -Uri "http://localhost:8080/health" -UseBasicParsing -TimeoutSec 10 -ErrorAction Stop
    $health = $response.Content | ConvertFrom-Json
    if ($health.status -eq "ok") {
        # All good - don't log normal checks to keep log small
        exit 0
    }
} catch {
    # Bridge is down or unresponsive
    Log "Bridge DOWN - restarting... (Error: $($_.Exception.Message))"

    # Kill any existing node processes running bridge-server
    Get-Process -Name "node" -ErrorAction SilentlyContinue | ForEach-Object {
        $cmdLine = (Get-CimInstance Win32_Process -Filter "ProcessId=$($_.Id)" -ErrorAction SilentlyContinue).CommandLine
        if ($cmdLine -match "bridge-server") {
            Log "  Killing stuck node process (PID: $($_.Id))"
            Stop-Process -Id $_.Id -Force -ErrorAction SilentlyContinue
        }
    }
    Start-Sleep -Seconds 3

    # Restart via scheduled task
    $task = Get-ScheduledTask -TaskName "PSBridgeServer" -ErrorAction SilentlyContinue
    if ($task) {
        if ($task.State -eq "Running") {
            Stop-ScheduledTask -TaskName "PSBridgeServer" -ErrorAction SilentlyContinue
            Start-Sleep -Seconds 2
        }
        Start-ScheduledTask -TaskName "PSBridgeServer"
        Log "  Restarted PSBridgeServer task"
    } else {
        # Fallback: start directly
        Start-Process -FilePath "cmd.exe" -ArgumentList "/c C:\ps-bridge\start-bridge.bat" -WindowStyle Hidden
        Log "  Started bridge directly (no scheduled task found)"
    }

    # Wait and verify
    Start-Sleep -Seconds 10
    try {
        $verify = Invoke-WebRequest -Uri "http://localhost:8080/health" -UseBasicParsing -TimeoutSec 10
        Log "  Bridge recovered: $($verify.Content)"
    } catch {
        Log "  WARNING: Bridge still not responding after restart"
    }
}
'@
$watchdogContent | Out-File -FilePath "$BridgeDir\watchdog.ps1" -Encoding utf8

$action = New-ScheduledTaskAction -Execute "cmd.exe" -Argument "/c `"$BridgeDir\start-bridge.bat`""
$trigger = New-ScheduledTaskTrigger -AtStartup
$principal = New-ScheduledTaskPrincipal -UserId "SYSTEM" -LogonType ServiceAccount -RunLevel Highest
# RestartCount 999 with 1-minute interval = effectively unlimited restarts
$settings = New-ScheduledTaskSettingsSet -AllowStartIfOnBatteries -DontStopIfGoingOnBatteries -StartWhenAvailable -RestartCount 999 -RestartInterval (New-TimeSpan -Minutes 1) -ExecutionTimeLimit (New-TimeSpan -Days 365)

Register-ScheduledTask -TaskName $taskName -Action $action -Trigger $trigger -Principal $principal -Settings $settings -Description "PS Bridge Server for EPM-AI" | Out-Null
Write-Host "  Scheduled task '$taskName' registered (unlimited restarts)" -ForegroundColor Green

# Register the watchdog task (runs every 5 minutes)
$watchdogTask = "PSBridgeWatchdog"
$existingWatchdog = Get-ScheduledTask -TaskName $watchdogTask -ErrorAction SilentlyContinue
if ($existingWatchdog) {
    Unregister-ScheduledTask -TaskName $watchdogTask -Confirm:$false
}

$wdAction = New-ScheduledTaskAction -Execute "powershell.exe" -Argument "-NoProfile -ExecutionPolicy Bypass -File `"$BridgeDir\watchdog.ps1`""
# Trigger every 5 minutes using repetition
$wdTrigger = New-ScheduledTaskTrigger -Once -At (Get-Date) -RepetitionInterval (New-TimeSpan -Minutes 5) -RepetitionDuration (New-TimeSpan -Days 365)
$wdPrincipal = New-ScheduledTaskPrincipal -UserId "SYSTEM" -LogonType ServiceAccount -RunLevel Highest
$wdSettings = New-ScheduledTaskSettingsSet -AllowStartIfOnBatteries -DontStopIfGoingOnBatteries -StartWhenAvailable -MultipleInstances IgnoreNew

Register-ScheduledTask -TaskName $watchdogTask -Action $wdAction -Trigger $wdTrigger -Principal $wdPrincipal -Settings $wdSettings -Description "Monitors PS Bridge Server and restarts if down" | Out-Null
Write-Host "  Watchdog task '$watchdogTask' registered (every 5 minutes)" -ForegroundColor Green

# Start everything
Write-Host "`nStarting PS Bridge Server..." -ForegroundColor Cyan
Start-ScheduledTask -TaskName $taskName
Start-ScheduledTask -TaskName $watchdogTask
Start-Sleep -Seconds 5

# Verify it's running
try {
    $response = Invoke-WebRequest -Uri "http://localhost:8080/health" -UseBasicParsing -TimeoutSec 10
    $health = $response.Content | ConvertFrom-Json
    Write-Host "`n=== Setup Complete ===" -ForegroundColor Green
    Write-Host "Bridge server is running!" -ForegroundColor Green
    Write-Host "  Health:   $($health.status)"
    Write-Host "  URL:      http://localhost:8080"
    Write-Host "  Log:      C:\ps-bridge\bridge.log"
    Write-Host "  Watchdog: C:\ps-bridge\watchdog.log"
    Write-Host ""
    Write-Host "Stability features:" -ForegroundColor Cyan
    Write-Host "  - Scheduled task: auto-starts on boot"
    Write-Host "  - 999 auto-restarts on crash (1-min interval)"
    Write-Host "  - Watchdog: checks health every 5 minutes"
    Write-Host "  - Log rotation: auto-rotates at 10MB"
    Write-Host "  - Memory monitoring: logs RSS/heap every 30 min"
    Write-Host "  - Uncaught exception handler: prevents silent crashes"
} catch {
    Write-Host "`nBridge server may need a moment to start." -ForegroundColor Yellow
    Write-Host "Check: http://localhost:8080/health"
    Write-Host "Log:   C:\ps-bridge\bridge.log"
    Write-Host "Manual start: Start-ScheduledTask -TaskName '$taskName'"
}
