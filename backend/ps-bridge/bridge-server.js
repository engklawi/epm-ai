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
    const result = await runPowerShell('assign', {
      projectName,
      assignments,
    });
    res.json(result);
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

// ── Start Server ──
app.listen(PORT, () => {
  console.log(`\n=== PS Bridge Server ===`);
  console.log(`Port:     ${PORT}`);
  console.log(`PWA URL:  ${PWA_URL}`);
  console.log(`User:     ${PS_DOMAIN}\\${PS_USERNAME}`);
  console.log(`Script:   ${PS_SCRIPT}`);
  console.log(`Ready at: http://localhost:${PORT}/health\n`);
});
