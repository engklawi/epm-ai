# Windows Startup Script — Deploys all updated bridge files and restarts
# Set as VM metadata: windows-startup-script-ps1
# Runs on every boot/reset

$ErrorActionPreference = "Continue"
$bridgeDir = "C:\ps-bridge"
$logFile = "$bridgeDir\deploy-update.log"

function Log($msg) {
    $ts = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    "$ts  $msg" | Tee-Object -FilePath $logFile -Append
}

# Ensure dir exists
if (-not (Test-Path $bridgeDir)) {
    New-Item -ItemType Directory -Path $bridgeDir -Force | Out-Null
}

Log "=== Deploy Update Startup Script ==="
Log "Deploying updated bridge files..."

# Kill any bridge processes so we can write fresh files
# The CMD startup script (windows-startup-script-cmd) will restart it after this PS script completes
Get-Process -Name "node" -ErrorAction SilentlyContinue | ForEach-Object {
    $cmd = (Get-CimInstance Win32_Process -Filter "ProcessId=$($_.Id)" -ErrorAction SilentlyContinue).CommandLine
    if ($cmd -match "bridge-server") {
        Log "  Killing bridge process (PID: $($_.Id)) for update..."
        Stop-Process -Id $_.Id -Force -ErrorAction SilentlyContinue
    }
}
Start-Sleep -Seconds 2

# ────────────────────────────────────────────────
# 1. Write bridge-server.js
# ────────────────────────────────────────────────
Log "Writing bridge-server.js..."
# We download from the repo or use inline content
# For reliability, inline the critical file content here

$bridgeJs = @'
/**
 * PS Bridge Server — Runs on the Project Server VM (Windows)
 *
 * A lightweight Express server that receives HTTP requests from the main
 * EPM-AI backend and executes PowerShell CSOM commands on the local machine.
 *
 * This bridges the gap between Node.js (REST API — queue blocking) and
 * .NET CSOM (batched operations — no queue blocking).
 *
 * Endpoints:
 *   GET  /health                          - Health check
 *   GET  /api/projects                    - List projects via CSOM
 *   GET  /api/resources                   - List enterprise resources via CSOM
 *   GET  /api/projects/:name/tasks        - List tasks for a project
 *   POST /api/assign                      - Assign resources to tasks
 *   POST /api/assign-all                  - Assign all resources across all projects
 *
 * Runs on port 8080 by default (PS_BRIDGE_PORT env var to change).
 *
 * Usage on the VM:
 *   npm install express
 *   node bridge-server.js
 */

const express = require('express');
const { execFile } = require('child_process');
const http = require('http');
const path = require('path');

const app = express();
app.use(express.json());

// Configuration
const PORT = process.env.PS_BRIDGE_PORT || 8080;
const PWA_URL = process.env.PWA_URL || 'http://localhost/pwa';
const PS_USERNAME = process.env.PS_USERNAME || 'info';
const PS_PASSWORD = process.env.PS_PASSWORD || 'rXr<{=eiKQ,49+V';
const PS_DOMAIN = process.env.PS_DOMAIN || 'EPMTRIAL';

// Path to the PowerShell CSOM script
const PS_SCRIPT = path.join(__dirname, 'Invoke-PSAssignment.ps1');

/**
 * Execute the PowerShell CSOM script with the given action and parameters.
 * Returns parsed JSON from the script's stdout.
 */
function runPowerShell(action, extra = {}) {
  return new Promise((resolve, reject) => {
    const args = [
      '-NoProfile',
      '-ExecutionPolicy', 'Bypass',
      '-File', PS_SCRIPT,
      '-PwaUrl', PWA_URL,
      '-Username', PS_USERNAME,
      '-Password', PS_PASSWORD,
      '-Domain', PS_DOMAIN,
      '-Action', action,
    ];

    if (extra.projectName) {
      args.push('-ProjectName', extra.projectName);
    }
    if (extra.assignments) {
      args.push('-Assignments', JSON.stringify(extra.assignments));
    }

    console.log(`[${new Date().toISOString()}] Running: ${action}${extra.projectName ? ` (${extra.projectName})` : ''}`);

    execFile('powershell.exe', args, {
      timeout: 180000, // 3 min timeout (publish can be slow)
      maxBuffer: 10 * 1024 * 1024, // 10MB
    }, (err, stdout, stderr) => {
      if (stderr) {
        console.error(`[PS stderr] ${stderr.substring(0, 500)}`);
      }

      // Try to parse JSON from stdout even if exit code was non-zero
      const output = (stdout || '').trim();
      try {
        const parsed = JSON.parse(output);
        if (err && !parsed.success) {
          console.error(`[PS error] ${parsed.message}`);
        }
        resolve(parsed);
      } catch (parseErr) {
        if (err) {
          reject(new Error(`PowerShell failed: ${err.message}. Output: ${output.substring(0, 300)}`));
        } else {
          reject(new Error(`Invalid JSON from PowerShell: ${output.substring(0, 300)}`));
        }
      }
    });
  });
}

/**
 * Make an NTLM-authenticated REST API call to Project Server.
 * Uses PowerShell's Invoke-RestMethod under the hood (simplest NTLM on Windows).
 */
function psRestCall(method, endpoint, body = null) {
  return new Promise((resolve, reject) => {
    // Build PowerShell script for NTLM REST call
    // Use -EncodedCommand to avoid special character issues in password (contains < { = etc.)
    const psScript = `
$secPwd = ConvertTo-SecureString '${PS_PASSWORD.replace(/'/g, "''")}' -AsPlainText -Force
$cred = New-Object System.Management.Automation.PSCredential('${PS_DOMAIN}\\${PS_USERNAME}', $secPwd)
$headers = @{ 'Accept' = 'application/json;odata=verbose' }
${method === 'POST' ? `
$ctx = Invoke-RestMethod -Uri '${PWA_URL}/_api/contextinfo' -Method POST -Credential $cred -Headers $headers -ContentType 'application/json'
$digest = $ctx.d.GetContextWebInformation.FormDigestValue
$headers['X-RequestDigest'] = $digest
` : ''}
try {
  $result = Invoke-RestMethod -Uri '${PWA_URL}/_api/${endpoint}' -Method ${method} -Credential $cred -Headers $headers -ContentType 'application/json'
  $result | ConvertTo-Json -Depth 5 -Compress
} catch {
  Write-Output ('{"error":"' + $_.Exception.Message + '"}')
}
`;
    // Encode as UTF-16LE Base64 for -EncodedCommand
    const encoded = Buffer.from(psScript, 'utf16le').toString('base64');

    execFile('powershell.exe', ['-NoProfile', '-ExecutionPolicy', 'Bypass', '-EncodedCommand', encoded], {
      timeout: 30000,
      maxBuffer: 5 * 1024 * 1024,
    }, (err, stdout, stderr) => {
      if (err) {
        console.error(`[REST error] ${err.message}`);
        reject(err);
      } else {
        try {
          resolve(JSON.parse(stdout.trim()));
        } catch (e) {
          resolve({ raw: stdout.trim() });
        }
      }
    });
  });
}

/**
 * Force check-in a project by GUID using the REST API.
 * This is more reliable than CSOM ForceCheckIn() and resolves CICOCheckedOutInOtherSession.
 */
async function forceCheckInProject(projectId) {
  console.log(`[${new Date().toISOString()}] Force check-in: ${projectId}`);
  try {
    const result = await psRestCall('POST', `ProjectServer/Projects('${projectId}')/Draft/CheckIn(force=true)`);
    // Wait for queue job to complete
    await new Promise(r => setTimeout(r, 5000));
    console.log(`[${new Date().toISOString()}] Force check-in completed for ${projectId}`);
    return result;
  } catch (err) {
    console.error(`[${new Date().toISOString()}] Force check-in failed for ${projectId}: ${err.message}`);
    throw err;
  }
}

/**
 * Force check-in ALL projects (useful for recovering from stuck states).
 */
async function forceCheckInAllProjects() {
  const result = await runPowerShell('list-projects');
  if (!result.success) throw new Error('Failed to list projects');

  const results = [];
  for (const project of result.data) {
    try {
      await forceCheckInProject(project.id);
      results.push({ name: project.name, id: project.id, status: 'checked_in' });
    } catch (err) {
      results.push({ name: project.name, id: project.id, status: 'error', message: err.message });
    }
  }
  return results;
}

// ── Health Check ──
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'ps-bridge',
    pwaUrl: PWA_URL,
    timestamp: new Date().toISOString(),
  });
});

// ── List Projects ──
app.get('/api/projects', async (req, res) => {
  try {
    const result = await runPowerShell('list-projects');
    res.json(result);
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ── List Enterprise Resources ──
app.get('/api/resources', async (req, res) => {
  try {
    const result = await runPowerShell('list-resources');
    res.json(result);
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ── List Tasks for a Project ──
app.get('/api/projects/:name/tasks', async (req, res) => {
  try {
    const result = await runPowerShell('list-tasks', {
      projectName: decodeURIComponent(req.params.name),
    });
    res.json(result);
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ── Assign Resources to Tasks ──
app.post('/api/assign', async (req, res) => {
  const { projectName, assignments } = req.body;

  if (!projectName) {
    return res.status(400).json({ success: false, message: 'projectName is required' });
  }
  if (!assignments || !Array.isArray(assignments) || assignments.length === 0) {
    return res.status(400).json({ success: false, message: 'assignments array is required' });
  }

  try {
    let result = await runPowerShell('assign', { projectName, assignments });

    // Auto-retry with force check-in if project is stuck checked out
    if (!result.success && result.message && result.message.includes('CICOCheckedOutInOtherSession')) {
      console.log(`[${new Date().toISOString()}] Project "${projectName}" is stuck checked out — forcing check-in...`);

      // Find project ID from list
      const projectList = await runPowerShell('list-projects');
      const proj = projectList.data?.find(p => p.name === projectName);
      if (proj) {
        await forceCheckInProject(proj.id);
        // Retry the assignment
        console.log(`[${new Date().toISOString()}] Retrying assignment for "${projectName}"...`);
        result = await runPowerShell('assign', { projectName, assignments });
      }
    }

    res.json(result);
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ── Force Check-In All Projects ──
app.post('/api/force-checkin', async (req, res) => {
  try {
    const results = await forceCheckInAllProjects();
    res.json({ success: true, message: `Processed ${results.length} projects`, results });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ── Assign All Resources Across All Projects ──
// Convenience endpoint: takes a map of { projectName: [{ resourceName, taskName }] }
app.post('/api/assign-all', async (req, res) => {
  const { projectAssignments } = req.body;

  if (!projectAssignments || typeof projectAssignments !== 'object') {
    return res.status(400).json({
      success: false,
      message: 'projectAssignments object is required: { "Project Name": [{ resourceName, taskName }] }',
    });
  }

  const results = [];
  const projectNames = Object.keys(projectAssignments);

  // Process projects sequentially (each project uses a separate queue job)
  for (const projectName of projectNames) {
    const assignments = projectAssignments[projectName];
    console.log(`Processing ${projectName}: ${assignments.length} assignments...`);

    try {
      const result = await runPowerShell('assign', {
        projectName,
        assignments,
      });
      results.push({ projectName, ...result });
    } catch (err) {
      results.push({ projectName, success: false, message: err.message });
    }
  }

  const successCount = results.filter(r => r.success).length;
  res.json({
    success: successCount === projectNames.length,
    message: `Processed ${projectNames.length} projects: ${successCount} succeeded`,
    results,
  });
});

// ── Uncaught Exception & Rejection Handlers ──
// Prevent process from crashing silently on unhandled errors
process.on('uncaughtException', (err) => {
  console.error(`[${new Date().toISOString()}] UNCAUGHT EXCEPTION: ${err.message}`);
  console.error(err.stack);
  // Don't exit — keep serving. The watchdog will restart if needed.
});

process.on('unhandledRejection', (reason, promise) => {
  console.error(`[${new Date().toISOString()}] UNHANDLED REJECTION:`, reason);
});

// ── Memory Monitoring ──
// Log memory usage every 30 minutes to help diagnose memory leaks
setInterval(() => {
  const mem = process.memoryUsage();
  console.log(`[${new Date().toISOString()}] Memory: RSS=${(mem.rss / 1024 / 1024).toFixed(1)}MB, Heap=${(mem.heapUsed / 1024 / 1024).toFixed(1)}/${(mem.heapTotal / 1024 / 1024).toFixed(1)}MB`);
}, 30 * 60 * 1000);

// ── Start Server ──
const server = app.listen(PORT, () => {
  console.log(`\n=== PS Bridge Server ===`);
  console.log(`Port:     ${PORT}`);
  console.log(`PWA URL:  ${PWA_URL}`);
  console.log(`User:     ${PS_DOMAIN}\\${PS_USERNAME}`);
  console.log(`Script:   ${PS_SCRIPT}`);
  console.log(`PID:      ${process.pid}`);
  console.log(`Started:  ${new Date().toISOString()}`);
  console.log(`Ready at: http://localhost:${PORT}/health\n`);
});

// Keep-alive settings to prevent idle connection timeouts
server.keepAliveTimeout = 120000; // 2 minutes
server.headersTimeout = 130000;
'@

# Only write if we have actual content (not placeholder)
if ($bridgeJs -notmatch "PLACEHOLDER") {
    Set-Content -Path "$bridgeDir\bridge-server.js" -Value $bridgeJs -Encoding UTF8
    Log "  bridge-server.js updated"
}

# ────────────────────────────────────────────────
# 2. Write start-bridge.bat (FIXED: use IP-based PWA_URL)
# ────────────────────────────────────────────────
Log "Writing start-bridge.bat..."
$batchContent = @"
@echo off
cd /d C:\ps-bridge
set PS_PASSWORD=rXr<{=eiKQ,49+V
set PWA_URL=http://34.29.110.174/pwa
set PS_USERNAME=info
set PS_DOMAIN=EPMTRIAL
set NODE_OPTIONS=--max-old-space-size=512

REM Log rotation: archive if > 10MB
for %%%%F in (bridge.log) do if %%%%~zF GTR 10485760 (
    move /y bridge.log bridge.log.old
)

node bridge-server.js >> C:\ps-bridge\bridge.log 2>&1
"@
Set-Content -Path "$bridgeDir\start-bridge.bat" -Value $batchContent -Encoding ASCII
Log "  start-bridge.bat updated (PWA_URL = http://34.29.110.174/pwa)"

# ────────────────────────────────────────────────
# 3. Write watchdog.ps1
# ────────────────────────────────────────────────
Log "Writing watchdog.ps1..."
$watchdog = @'
# PS Bridge Watchdog - checks health every 5 minutes, restarts if down
$logFile = "C:\ps-bridge\watchdog.log"
$maxLogSize = 5MB

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
    if ($health.status -eq "ok") { exit 0 }
} catch {
    Log "Bridge DOWN - restarting... ($($_.Exception.Message))"
    Get-Process -Name "node" -ErrorAction SilentlyContinue | ForEach-Object {
        $cmd = (Get-CimInstance Win32_Process -Filter "ProcessId=$($_.Id)" -ErrorAction SilentlyContinue).CommandLine
        if ($cmd -match "bridge-server") {
            Log "  Killing stuck node (PID: $($_.Id))"
            Stop-Process -Id $_.Id -Force -ErrorAction SilentlyContinue
        }
    }
    Start-Sleep -Seconds 3
    $task = Get-ScheduledTask -TaskName "PSBridgeServer" -ErrorAction SilentlyContinue
    if ($task) {
        if ($task.State -eq "Running") { Stop-ScheduledTask -TaskName "PSBridgeServer" -ErrorAction SilentlyContinue; Start-Sleep 2 }
        Start-ScheduledTask -TaskName "PSBridgeServer"
        Log "  Restarted PSBridgeServer"
    } else {
        Start-Process -FilePath "cmd.exe" -ArgumentList "/c C:\ps-bridge\start-bridge.bat" -WindowStyle Hidden
        Log "  Started bridge directly"
    }
    Start-Sleep -Seconds 10
    try {
        $v = Invoke-WebRequest -Uri "http://localhost:8080/health" -UseBasicParsing -TimeoutSec 10
        Log "  Bridge recovered!"
    } catch {
        Log "  WARNING: Bridge still down after restart"
    }
}
'@
Set-Content -Path "$bridgeDir\watchdog.ps1" -Value $watchdog -Encoding UTF8
Log "  watchdog.ps1 created"

# ────────────────────────────────────────────────
# 4. Register watchdog scheduled task (every 5 min)
# ────────────────────────────────────────────────
Log "Registering watchdog task..."
$wdTask = "PSBridgeWatchdog"
$existing = Get-ScheduledTask -TaskName $wdTask -ErrorAction SilentlyContinue
if (-not $existing) {
    $wdAction = New-ScheduledTaskAction -Execute "powershell.exe" -Argument "-NoProfile -ExecutionPolicy Bypass -File `"$bridgeDir\watchdog.ps1`""
    $wdTrigger = New-ScheduledTaskTrigger -Once -At (Get-Date) -RepetitionInterval (New-TimeSpan -Minutes 5) -RepetitionDuration (New-TimeSpan -Days 365)
    $wdPrincipal = New-ScheduledTaskPrincipal -UserId "SYSTEM" -LogonType ServiceAccount -RunLevel Highest
    $wdSettings = New-ScheduledTaskSettingsSet -AllowStartIfOnBatteries -DontStopIfGoingOnBatteries -StartWhenAvailable -MultipleInstances IgnoreNew
    Register-ScheduledTask -TaskName $wdTask -Action $wdAction -Trigger $wdTrigger -Principal $wdPrincipal -Settings $wdSettings -Description "Monitors PS Bridge and restarts if down" | Out-Null
    Start-ScheduledTask -TaskName $wdTask
    Log "  Watchdog task registered and started"
} else {
    Log "  Watchdog task already exists"
}

# ────────────────────────────────────────────────
# 5. Update PSBridgeServer task for unlimited restarts
# ────────────────────────────────────────────────
Log "Updating PSBridgeServer task settings..."
$bridgeTask = Get-ScheduledTask -TaskName "PSBridgeServer" -ErrorAction SilentlyContinue
if ($bridgeTask) {
    # Update restart policy to unlimited
    $bridgeTask.Settings.RestartCount = 999
    $bridgeTask.Settings.RestartInterval = "PT1M"
    $bridgeTask.Settings.ExecutionTimeLimit = "P365D"
    Set-ScheduledTask -InputObject $bridgeTask | Out-Null
    Log "  PSBridgeServer updated: 999 restarts, 1-min interval"
}

# ────────────────────────────────────────────────
# 6. Bridge will be started by windows-startup-script-cmd
#    which runs after this PS script and calls start-bridge.bat
# ────────────────────────────────────────────────
Log "Files updated. Bridge will be started by CMD startup script next."
Log "=== Deploy Complete ==="
