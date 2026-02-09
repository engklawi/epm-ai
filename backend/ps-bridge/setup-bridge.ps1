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
$batchContent = @"
@echo off
cd /d C:\ps-bridge
set PS_PASSWORD=rXr<{=eiKQ,49+V
set PWA_URL=http://localhost/pwa
set PS_USERNAME=info
set PS_DOMAIN=EPMTRIAL
node bridge-server.js >> C:\ps-bridge\bridge.log 2>&1
"@
$batchContent | Out-File -FilePath "$BridgeDir\start-bridge.bat" -Encoding ascii

$action = New-ScheduledTaskAction -Execute "cmd.exe" -Argument "/c `"$BridgeDir\start-bridge.bat`""
$trigger = New-ScheduledTaskTrigger -AtStartup
$principal = New-ScheduledTaskPrincipal -UserId "SYSTEM" -LogonType ServiceAccount -RunLevel Highest
$settings = New-ScheduledTaskSettingsSet -AllowStartIfOnBatteries -DontStopIfGoingOnBatteries -StartWhenAvailable -RestartCount 3 -RestartInterval (New-TimeSpan -Minutes 1)

Register-ScheduledTask -TaskName $taskName -Action $action -Trigger $trigger -Principal $principal -Settings $settings -Description "PS Bridge Server for EPM-AI" | Out-Null
Write-Host "  Scheduled task '$taskName' registered" -ForegroundColor Green

# Start the task now
Write-Host "`nStarting PS Bridge Server..." -ForegroundColor Cyan
Start-ScheduledTask -TaskName $taskName
Start-Sleep -Seconds 3

# Verify it's running
try {
    $response = Invoke-WebRequest -Uri "http://localhost:8080/health" -UseBasicParsing -TimeoutSec 5
    $health = $response.Content | ConvertFrom-Json
    Write-Host "`n=== Setup Complete ===" -ForegroundColor Green
    Write-Host "Bridge server is running!" -ForegroundColor Green
    Write-Host "  Health: $($health.status)"
    Write-Host "  URL:    http://localhost:8080"
    Write-Host "  Log:    C:\ps-bridge\bridge.log"
} catch {
    Write-Host "`nBridge server may need a moment to start." -ForegroundColor Yellow
    Write-Host "Check: http://localhost:8080/health"
    Write-Host "Log:   C:\ps-bridge\bridge.log"
    Write-Host "Manual start: Start-ScheduledTask -TaskName '$taskName'"
}
