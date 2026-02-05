import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import OpenAI from 'openai';
import { createPSClient } from './projectServerClient.js';
import { createDataService } from './dataService.js';
import { requireAuth } from './authMiddleware.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const app = express();
app.use(cors());
app.use(express.json());

// Protect all API routes with Firebase Auth
app.use('/api', requireAuth);

// Initialize OpenAI (lazy - only when API key is available)
let openai = null;
if (process.env.OPENAI_API_KEY) {
  openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
  });
}

// Initialize Project Server client
const psConfig = {
  baseUrl: process.env.PS_URL || 'http://34.29.110.174/pwa',
  username: process.env.PS_USERNAME || 'info',
  password: process.env.PS_PASSWORD || '',
  domain: process.env.PS_DOMAIN || 'EPMTRIAL',
};

let psClient = null;
const psEnabled = process.env.PS_ENABLED !== 'false' && !!psConfig.password;
if (psEnabled) {
  psClient = createPSClient(psConfig);
  psClient.testConnection().then(ok => {
    console.log(`Project Server: ${ok ? 'Connected to ' + psConfig.baseUrl : 'Unreachable (using mock data)'}`);
  });
}

// PS Bridge Server URL (runs on the Project Server VM for CSOM operations)
const PS_BRIDGE_URL = process.env.PS_BRIDGE_URL || 'http://34.29.110.174:8080';

/**
 * Call the PS Bridge Server on the VM for CSOM-based operations.
 * This avoids the REST API queue blocking issue for resource assignments.
 */
async function callPSBridge(path, body = null, method = 'POST') {
  const url = `${PS_BRIDGE_URL}${path}`;
  const options = {
    method,
    headers: { 'Content-Type': 'application/json' },
  };
  if (body && method !== 'GET') {
    options.body = JSON.stringify(body);
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 120000); // 2 min timeout
  options.signal = controller.signal;

  try {
    const response = await fetch(url, options);
    clearTimeout(timeout);
    if (!response.ok && response.status !== 200) {
      const text = await response.text();
      throw new Error(`Bridge responded ${response.status}: ${text.substring(0, 200)}`);
    }
    return await response.json();
  } catch (err) {
    clearTimeout(timeout);
    if (err.name === 'AbortError') {
      throw new Error('PS Bridge request timed out (120s)');
    }
    throw err;
  }
}

const dataService = createDataService(psClient, {
  cacheTTL: parseInt(process.env.PS_CACHE_TTL || '300') * 1000,
  enabled: psEnabled,
});

// Load mock data (kept for local response generation functions)
const loadData = (file) => JSON.parse(readFileSync(join(__dirname, 'data', file), 'utf-8'));

// UC1: Projects & Schedule
app.get('/api/projects', async (req, res) => {
  try {
    res.json(await dataService.getProjects());
  } catch (error) {
    console.error('Error fetching projects:', error.message);
    res.json(loadData('projects.json'));
  }
});

app.get('/api/projects/:id', async (req, res) => {
  try {
    const project = await dataService.getProjectById(req.params.id);
    if (project) res.json(project);
    else res.status(404).json({ error: 'Project not found' });
  } catch (error) {
    console.error('Error fetching project:', error.message);
    const projects = loadData('projects.json');
    const project = projects.find(p => p.id === req.params.id);
    if (project) res.json(project);
    else res.status(404).json({ error: 'Project not found' });
  }
});

// ─────────────────────────────────────────────────
// OpenAI Function Calling Tools (for write-back actions)
// ─────────────────────────────────────────────────
const chatTools = [
  {
    type: 'function',
    function: {
      name: 'update_task_progress',
      description: 'Update the progress percentage of a specific task in a project. Use when the user asks to update, change, set, or move task progress/completion.',
      parameters: {
        type: 'object',
        properties: {
          projectName: { type: 'string', description: 'The project name (e.g. "Customer Portal")' },
          taskName: { type: 'string', description: 'The task name (e.g. "Payment Integration")' },
          percentComplete: { type: 'number', description: 'The new completion percentage (0-100)' },
        },
        required: ['projectName', 'taskName', 'percentComplete'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'assign_resource',
      description: 'Assign a project manager (resource) to a task in a project. Use when the user asks to assign, add, or move a PM/resource to a task.',
      parameters: {
        type: 'object',
        properties: {
          projectName: { type: 'string', description: 'The project name (e.g. "Customer Portal")' },
          taskName: { type: 'string', description: 'The task name (e.g. "Security Testing")' },
          resourceName: { type: 'string', description: 'The PM/resource name (e.g. "Mohammed Ali")' },
        },
        required: ['projectName', 'taskName', 'resourceName'],
      },
    },
  },
];

// Build compact task reference for system prompt (project → tasks mapping)
function buildTaskReference(projects) {
  return projects.map(p => {
    const taskList = (p.tasks || []).map(t => `  - "${t.name}" (${t.progress}% complete)`).join('\n');
    return `"${p.name}" (PM: ${p.pmName}, Health: ${p.health.toUpperCase()}, Progress: ${p.progress}%)\n${taskList || '  (no task data)'}`;
  }).join('\n\n');
}

// UC1: AI Chat (with function calling for write-back)
app.post('/api/chat', async (req, res) => {
  const { message } = req.body;
  let context;
  try {
    context = await dataService.getProjectContext();
  } catch {
    context = { projects: loadData('projects.json'), risks: loadData('risks.json'), pms: loadData('projectManagers.json'), objectives: loadData('strategicObjectives.json') };
  }

  // If no OpenAI key, use local response with intent detection
  if (!openai) {
    const localAction = detectLocalAction(message, context);
    if (localAction) {
      res.json({
        response: localAction.response,
        action: localAction.action,
        timestamp: new Date().toISOString(),
        source: 'local'
      });
      return;
    }
    const response = generateLocalResponse(message, context);
    res.json({ response, timestamp: new Date().toISOString(), source: 'local' });
    return;
  }

  try {
    const taskReference = buildTaskReference(context.projects);
    const resourceNames = context.pms.map(pm => pm.name).join(', ');

    const systemPrompt = `You are BAYAN (بيان), an elite AI PMO Director for an Enterprise Project Management system connected LIVE to Microsoft Project Server. Your name means "clarity" in Arabic — your purpose is to bring clarity to complex portfolios.

PERSONALITY:
- You speak like a senior PMO director with 20 years of experience — confident, decisive, data-driven
- You are bilingual: respond in the SAME language the user writes in (Arabic or English)
- When speaking Arabic, use professional formal Arabic (فصحى) but keep it natural, not overly academic
- You don't just report problems — you diagnose root causes and prescribe specific actions
- You refer to yourself as "Bayan" naturally: "Based on what I see in the portfolio..." or "بناءً على تحليلي للمحفظة..."
- You are PROACTIVE: when you identify a risk or problem, ALWAYS suggest a concrete action the user can take, and if that action is an update or assignment, call the appropriate function
- You care about Vision 2030 alignment and digital transformation maturity
- You show genuine care for the team — mention PMs by name, acknowledge good work, warn about burnout
- You think in SYSTEMS: when one thing changes, you explain the ripple effects across the portfolio
- You sound like a human colleague, not a chatbot — vary your sentence structure, use natural transitions

LIVE DATA (from Microsoft Project Server):

PROJECTS & TASKS:
${taskReference}

AVAILABLE RESOURCES (PMs):
${resourceNames}

RISKS:
${JSON.stringify(context.risks, null, 2)}

PROJECT MANAGERS (with scores):
${JSON.stringify(context.pms, null, 2)}

STRATEGIC OBJECTIVES:
${JSON.stringify(context.objectives, null, 2)}

AVAILABLE ACTIONS:
You can execute these actions by calling the appropriate function:
1. update_task_progress — Update a task's completion percentage in Project Server
2. assign_resource — Assign a PM/resource to a task in Project Server

CRITICAL BEHAVIOR — PROACTIVE ACTIONS:
- When analyzing risks or problems, if the solution involves updating progress or reassigning resources, PROACTIVELY call the function to propose the action
- Example: if user asks "what's wrong with Customer Portal?" and you see it needs help, suggest assigning a resource AND call assign_resource to propose it
- Always match names EXACTLY from the data above
- When proposing actions, explain WHY this action will help before executing

PAGE CONTEXT AWARENESS:
- The user's message may start with [Page Context: ...] indicating which page they are viewing
- When you see this context, tailor your response to be relevant to that specific page/dashboard
- For example, if they're on the Risk Center, focus on risks; if on PM Scoring, focus on PM performance
- If no page context is given, respond normally as a general PMO assistant

FORMATTING RULES:
- Do NOT use markdown formatting (no **, no ##, no ###, no *)
- Use plain text. Only use a few emojis (2-4 per response max) to aid readability — e.g. ✅ for good, ⚠️ for warning, 🔴 for critical. Do NOT overload the response with emojis
- Use bullet points with "•" character for lists
- Use "-" for sub-items
- Use ALL CAPS for emphasis instead of bold
- Keep responses insightful and professional (max 300 words for analytical queries, max 150 words for simple ones)
- ALWAYS include specific numbers, percentages, and PM names from the data — never be vague
- End EVERY response with either a recommended action or a probing question that deepens the conversation
- When proposing actions, explain the IMPACT: what changes, what improves, what risk decreases
- Structure longer responses with clear sections using emojis as headers (e.g., "📊 THE DATA" then "💡 MY TAKE")
- Show cause-and-effect reasoning: "X is happening BECAUSE of Y, which means Z will happen unless we act"`;

    const completion = await openai.chat.completions.create({
      model: 'gpt-5.2',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: message }
      ],
      tools: chatTools,
      tool_choice: 'auto',
      max_completion_tokens: 800,
      temperature: 0.7
    });

    const choice = completion.choices[0];

    // Check if GPT wants to call a function (write-back action)
    if (choice.finish_reason === 'tool_calls' && choice.message.tool_calls?.length > 0) {
      const toolCall = choice.message.tool_calls[0];
      const args = JSON.parse(toolCall.function.arguments);
      const actionType = toolCall.function.name;

      // Return the proposed action for frontend confirmation
      res.json({
        response: choice.message.content || `I'll ${actionType === 'update_task_progress' ? `update "${args.taskName}" in "${args.projectName}" to ${args.percentComplete}% complete` : `assign ${args.resourceName} to "${args.taskName}" in "${args.projectName}"`}. Please confirm this action.`,
        action: {
          type: actionType,
          params: args,
          description: actionType === 'update_task_progress'
            ? `Update "${args.taskName}" in "${args.projectName}" to ${args.percentComplete}% complete`
            : `Assign ${args.resourceName} to "${args.taskName}" in "${args.projectName}"`,
        },
        timestamp: new Date().toISOString(),
        source: 'openai'
      });
    } else {
      // Normal text response
      res.json({
        response: choice.message.content,
        timestamp: new Date().toISOString(),
        source: 'openai'
      });
    }
  } catch (error) {
    console.error('OpenAI Error:', error);
    const response = generateLocalResponse(message, context);
    res.json({ response, timestamp: new Date().toISOString(), source: 'local' });
  }
});

// UC1: Execute confirmed write-back action from AI Chat
app.post('/api/chat/execute', async (req, res) => {
  const { type, params } = req.body;

  if (!type || !params) {
    return res.status(400).json({ error: 'Missing action type or params' });
  }

  try {
    if (type === 'update_task_progress') {
      const { projectName, taskName, percentComplete } = params;

      // Look up project and task IDs from live data
      const projects = await dataService.getProjects();
      const project = projects.find(p => p.name === projectName);
      if (!project) return res.status(404).json({ error: `Project "${projectName}" not found` });

      const task = (project.tasks || []).find(t => t.name === taskName);
      if (!task) return res.status(404).json({ error: `Task "${taskName}" not found in "${projectName}"` });

      if (!psClient) return res.status(503).json({ error: 'Project Server not configured' });

      const digest = await psClient.checkoutProject(project.psId);
      await psClient.updateTask(project.psId, task.id, { PercentComplete: percentComplete }, digest);
      await psClient.publishProject(project.psId);
      dataService.invalidateCache('projects');

      res.json({
        success: true,
        message: `Updated "${taskName}" in "${projectName}" to ${percentComplete}% complete`,
        details: { projectName, taskName, percentComplete },
      });

    } else if (type === 'assign_resource') {
      const { projectName, taskName, resourceName } = params;

      // Use CSOM bridge for resource assignment
      try {
        const bridgeResult = await callPSBridge('/api/assign', {
          projectName,
          assignments: [{ resourceName, taskName }],
        });

        if (bridgeResult && bridgeResult.success) {
          dataService.invalidateCache('projects');
          res.json({
            success: true,
            message: `Assigned ${resourceName} to "${taskName}" in "${projectName}"`,
            details: { projectName, taskName, resourceName },
            method: 'csom-bridge',
          });
        } else {
          res.status(500).json({ error: bridgeResult?.message || 'Bridge assignment failed' });
        }
      } catch (bridgeErr) {
        res.status(500).json({ error: `Bridge error: ${bridgeErr.message}` });
      }

    } else {
      res.status(400).json({ error: `Unknown action type: ${type}` });
    }
  } catch (error) {
    console.error('Action execution error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Local intent detection for write-back actions (fallback when no OpenAI key)
function detectLocalAction(message, context) {
  const lower = message.toLowerCase();

  // Detect task progress update: "update X to Y%"
  const progressMatch = message.match(/(?:update|set|change|move)\s+(?:the\s+)?(.+?)\s+(?:in\s+|on\s+)?(.+?)\s+(?:to|=)\s*(\d+)\s*%/i)
    || message.match(/(?:update|set|change|move)\s+(?:the\s+)?(.+?)\s+(?:to|=)\s*(\d+)\s*%/i);

  if (progressMatch) {
    let taskName, projectName, percent;

    if (progressMatch.length === 4) {
      // 3-group match: task, project, percent
      taskName = progressMatch[1].trim();
      projectName = progressMatch[2].trim();
      percent = parseInt(progressMatch[3]);
    } else {
      // 2-group match: task, percent — infer project
      taskName = progressMatch[1].trim();
      percent = parseInt(progressMatch[2]);
    }

    // Fuzzy match task and project from context
    for (const p of context.projects) {
      for (const t of p.tasks || []) {
        if (t.name.toLowerCase().includes(taskName.toLowerCase()) ||
            taskName.toLowerCase().includes(t.name.toLowerCase())) {
          if (!projectName || p.name.toLowerCase().includes(projectName.toLowerCase()) ||
              projectName.toLowerCase().includes(p.name.toLowerCase())) {
            return {
              response: `I'll update "${t.name}" in "${p.name}" to ${percent}% complete. Please confirm this action.`,
              action: {
                type: 'update_task_progress',
                params: { projectName: p.name, taskName: t.name, percentComplete: percent },
                description: `Update "${t.name}" in "${p.name}" to ${percent}% complete`,
              },
            };
          }
        }
      }
    }
  }

  // Detect resource assignment: "assign X to Y"
  const assignMatch = message.match(/(?:assign|add|move)\s+(.+?)\s+to\s+(?:the\s+)?(.+?)(?:\s+(?:in|on|for)\s+(.+))?$/i);

  if (assignMatch && (lower.includes('assign') || lower.includes('resource'))) {
    const resourceCandidate = assignMatch[1].trim();
    const taskCandidate = assignMatch[2].trim();
    const projectCandidate = assignMatch[3]?.trim();

    // Match resource name
    const resource = context.pms.find(pm =>
      pm.name.toLowerCase().includes(resourceCandidate.toLowerCase()) ||
      resourceCandidate.toLowerCase().includes(pm.name.toLowerCase())
    );

    if (resource) {
      for (const p of context.projects) {
        if (projectCandidate && !p.name.toLowerCase().includes(projectCandidate.toLowerCase())) continue;
        for (const t of p.tasks || []) {
          if (t.name.toLowerCase().includes(taskCandidate.toLowerCase()) ||
              taskCandidate.toLowerCase().includes(t.name.toLowerCase())) {
            return {
              response: `I'll assign ${resource.name} to "${t.name}" in "${p.name}". Please confirm this action.`,
              action: {
                type: 'assign_resource',
                params: { projectName: p.name, taskName: t.name, resourceName: resource.name },
                description: `Assign ${resource.name} to "${t.name}" in "${p.name}"`,
              },
            };
          }
        }
      }
    }
  }

  return null; // No action detected
}

// Smart local fallback
function generateLocalResponse(message, context) {
  const { projects, risks, pms } = context;
  const lowerMsg = message.toLowerCase();

  if (lowerMsg.includes('status') || lowerMsg.includes('project') || lowerMsg.includes('overview')) {
    const atRisk = projects.filter(p => p.health === 'red');
    const onTrack = projects.filter(p => p.health === 'green');
    const totalBudget = projects.reduce((sum, p) => sum + p.budget, 0);
    const totalSpent = projects.reduce((sum, p) => sum + p.spent, 0);

    return `PORTFOLIO SNAPSHOT

${projects.length} Active Projects | $${(totalBudget/1000000).toFixed(1)}M Total Budget

• ✅ On Track: ${onTrack.length} (${onTrack.map(p => p.name).join(', ')})
• ⚠️ At Risk: ${projects.filter(p => p.health === 'yellow').length}
• 🔴 Critical: ${atRisk.length} (${atRisk.map(p => p.name).join(', ') || 'None'})

Budget: $${(totalSpent/1000000).toFixed(2)}M spent of $${(totalBudget/1000000).toFixed(2)}M (${Math.round(totalSpent/totalBudget*100)}%)

${atRisk.length > 0 ? `NEEDS YOUR ATTENTION\n${atRisk[0].name} is in RED with a risk score of ${atRisk[0].riskScore || 0}%. The burn rate is outpacing progress, which tells me there's likely a resource issue underneath.\n\nI can dig deeper into root causes or reassign resources right now. What would you like?` : '✅ All projects within healthy parameters. Shall I run a deeper analysis on any specific project?'}`;
  }

  if (lowerMsg.includes('risk')) {
    const critical = risks.filter(r => r.status === 'Critical');
    const increasing = risks.filter(r => r.trend === 'increasing');

    return `RISK ANALYSIS

${risks.length} active risks | ${critical.length} CRITICAL | ${increasing.length} trending UP

${critical.length > 0 ? `🔴 I'm most concerned about this pattern:` : '✅ No critical risks detected.'}

${critical.map(r => `• ${r.title} (${r.projectName})
  Probability: ${r.probability}% | Impact: ${r.impact}%
  Score: ${r.score} | Trend: ${r.trend === 'increasing' ? '↑ INCREASING' : r.trend === 'decreasing' ? '↓ Decreasing' : '→ Stable'}
  Current Mitigation: ${r.mitigation}`).join('\n\n')}

MY TAKE
${increasing.length > 1 ? `${increasing.length} risks are trending upward simultaneously. This isn't random — it signals a systemic issue, likely resource-related. I recommend we address the root cause, not just individual risks.\n\nShall I propose resource rebalancing to address this?` : `Focus on ${critical[0]?.projectName || 'the highest-score risks'} this sprint. I can help you build a mitigation plan or reassign resources.`}`;
  }

  if (lowerMsg.includes('resource') || lowerMsg.includes('workload') || lowerMsg.includes('team')) {
    const overloaded = pms.filter(pm => pm.workload > 80);
    const available = pms.filter(pm => pm.workload < 70);

    return `TEAM WORKLOAD ANALYSIS

${pms.length} Project Managers | ${overloaded.length} overloaded | ${available.length} with capacity

${overloaded.length > 0 ? '🔴 CAPACITY ALERTS' : '✅ TEAM BALANCED'}
${overloaded.map(pm => `• ${pm.name}: ${pm.workload}% capacity (${pm.activeProjects} active projects) — this is unsustainable and WILL affect quality`).join('\n')}

${available.length > 0 ? 'AVAILABLE CAPACITY' : ''}
${available.map(pm => `• ${pm.name}: ${pm.workload}% — has room for ${Math.round((90 - pm.workload) / 15)} more tasks`).join('\n')}

MY RECOMMENDATION
${overloaded.length > 0 ? `${overloaded[0].name} is carrying too much. I can reassign specific tasks to ${available[0]?.name || 'available team members'} right now — just say the word.\n\nThis isn't just about fairness. Overloaded PMs make mistakes, and that creates NEW risks.` : 'Team capacity looks healthy. Monitor weekly to maintain balance.'}`;
  }

  if (lowerMsg.includes('schedule') || lowerMsg.includes('delay') || lowerMsg.includes('timeline')) {
    const delayed = projects.filter(p => p.health === 'red' || p.health === 'yellow');

    return `SCHEDULE & TIMELINE ANALYSIS

${delayed.length} project${delayed.length !== 1 ? 's' : ''} with timeline concerns

${delayed.map(p => `${p.health === 'red' ? '🔴' : '⚠️'} ${p.name}
  • Progress: ${p.progress}% | Health: ${p.health.toUpperCase()}
  • Timeline: ${p.startDate} → ${p.endDate}
  • PM: ${p.pmName}`).join('\n\n')}

MY PREDICTION
${delayed.length > 0 ? `Based on current velocity, ${delayed[0].name} will miss its deadline by 2-4 weeks. The math doesn't lie — at ${delayed[0].progress}% complete with the budget ${Math.round((delayed[0].spent/delayed[0].budget)*100)}% spent, we need to act NOW.` : '✅ All projects tracking on schedule.'}

RECOMMENDED ACTIONS
${delayed.length > 0 ? `1. Fast-track the critical path on ${delayed[0].name}\n2. Consider MVP scope reduction to hit the deadline\n3. I can reassign resources to accelerate — want me to find the best candidate?` : '• Continue current cadence\n• I will alert you if velocity changes'}`;
  }

  if (lowerMsg.includes('mitigation') || lowerMsg.includes('action') || lowerMsg.includes('recommend')) {
    const critical = risks.filter(r => r.status === 'Critical');
    const atRiskProjects = projects.filter(p => p.health === 'red' || p.health === 'yellow');

    return `ACTION PLAN — Priority Mitigations

Here's what needs to happen, in order of urgency:

${critical.slice(0, 3).map((r, i) => `${i === 0 ? '🔴' : '⚠️'} PRIORITY ${i+1}: ${r.title} (${r.projectName})
   Current plan: ${r.mitigation}
   What I'd add:
   • Escalate to steering committee within 24 hours
   • Allocate ${10 + i * 5}% contingency budget
   • Switch to daily standups until resolved`).join('\n\n')}

PROJECT-LEVEL FIXES
${atRiskProjects.slice(0, 2).map(p => `• ${p.name}: Consider MVP scope — deliver core features first, Phase 2 for the rest`).join('\n')}

RESOURCE MOVES I CAN MAKE RIGHT NOW
• Redistribute tasks from overloaded PMs to available capacity
• Set up cross-project mentorship pairs

Bottom line: The fastest win is resource rebalancing. I can execute an assignment right now if you tell me which task to prioritize. What do you think?`;
  }

  if (lowerMsg.includes('budget') || lowerMsg.includes('cost') || lowerMsg.includes('spend')) {
    const totalBudget = projects.reduce((sum, p) => sum + p.budget, 0);
    const totalSpent = projects.reduce((sum, p) => sum + p.spent, 0);
    const overBudget = projects.filter(p => (p.spent / p.budget) > 0.8 && p.progress < 70);

    return `BUDGET & COST ANALYSIS

Portfolio: $${(totalSpent/1000000).toFixed(2)}M spent of $${(totalBudget/1000000).toFixed(2)}M (${Math.round(totalSpent/totalBudget*100)}%)
Remaining: $${((totalBudget-totalSpent)/1000000).toFixed(2)}M

BY PROJECT:
${projects.map(p => `${p.spent/p.budget > 0.8 && p.progress < 70 ? '🔴' : p.spent/p.budget > 0.7 ? '⚠️' : '✅'} ${p.name}: $${(p.spent/1000000).toFixed(2)}M / $${(p.budget/1000000).toFixed(2)}M (${Math.round(p.spent/p.budget*100)}%)`).join('\n')}

${overBudget.length > 0 ? `BURN RATE ALERT\n${overBudget.map(p => `${p.name} has used ${Math.round(p.spent/p.budget*100)}% of budget but is only ${p.progress}% complete. At this rate, the budget will be exhausted before delivery.`).join('\n')}\n\nWe need to either reduce scope to MVP or request a ${Math.round(overBudget[0].budget * 0.15 / 1000)}K contingency. I can help draft the business case. What would you prefer?` : '✅ All budgets within healthy parameters. I will alert you if any burn rate exceeds progress rate.'}`;
  }

  return `I'm here to help! Here's what I can do for you:

• Portfolio Analysis — "Give me a portfolio briefing"
• Risk Intelligence — "What risks should I worry about?"
• Team Insights — "How's the team workload?"
• Schedule Forecasting — "Are we on track?"
• Budget Monitoring — "Check our burn rate"
• Action Planning — "What should we do about Customer Portal?"

Pro tip: You can also ask me to UPDATE task progress or ASSIGN resources directly — I'll execute it on Project Server for you.

What's on your mind?`;
}

// UC2: Portfolio Dashboard
app.get('/api/portfolio', async (req, res) => {
  try {
    res.json(await dataService.getPortfolio());
  } catch (error) {
    console.error('Error fetching portfolio:', error.message);
    const projects = loadData('projects.json');
    const objectives = loadData('strategicObjectives.json');
    res.json({
      totalProjects: projects.length,
      totalBudget: projects.reduce((sum, p) => sum + p.budget, 0),
      totalSpent: projects.reduce((sum, p) => sum + p.spent, 0),
      healthBreakdown: {
        green: projects.filter(p => p.health === 'green').length,
        yellow: projects.filter(p => p.health === 'yellow').length,
        red: projects.filter(p => p.health === 'red').length,
      },
      avgProgress: Math.round(projects.reduce((sum, p) => sum + p.progress, 0) / projects.length),
      strategicObjectives: objectives.length,
      projects,
      objectives,
    });
  }
});

// UC3: Strategy & ROI
app.get('/api/strategy', async (req, res) => {
  try {
    res.json(await dataService.getStrategy());
  } catch (error) {
    console.error('Error fetching strategy:', error.message);
    const objectives = loadData('strategicObjectives.json');
    const projects = loadData('projects.json');
    res.json({
      objectives: objectives.map(obj => ({
        ...obj,
        projectDetails: projects.filter(p => obj.projects.includes(p.id)),
      })),
      overallROI: Math.round(projects.reduce((sum, p) => sum + p.roi, 0) / projects.length),
      alignmentScore: Math.round(projects.reduce((sum, p) => sum + p.alignmentScore, 0) / projects.length),
    });
  }
});

// UC6: Risk Management
app.get('/api/risks', async (req, res) => {
  try {
    res.json(await dataService.getRisksWithSummary());
  } catch (error) {
    console.error('Error fetching risks:', error.message);
    const risks = loadData('risks.json');
    res.json({
      risks,
      summary: {
        total: risks.length,
        critical: risks.filter(r => r.status === 'Critical').length,
        open: risks.filter(r => r.status === 'Open').length,
        monitoring: risks.filter(r => r.status === 'Monitoring').length,
        avgScore: Math.round(risks.reduce((sum, r) => sum + r.score, 0) / risks.length),
      },
      byCategory: {
        Resource: risks.filter(r => r.category === 'Resource').length,
        Scope: risks.filter(r => r.category === 'Scope').length,
        Financial: risks.filter(r => r.category === 'Financial').length,
        Technical: risks.filter(r => r.category === 'Technical').length,
        Schedule: risks.filter(r => r.category === 'Schedule').length,
      },
    });
  }
});

// UC7: AI Document Generation with GPT-5.2
app.post('/api/documents/generate', async (req, res) => {
  const { type, projectId } = req.body;
  let projects, project, risks;
  try {
    projects = await dataService.getProjects();
    project = projects.find(p => p.id === projectId) || projects[0];
    risks = dataService.getRisks().filter(r => r.projectId === projectId);
  } catch {
    projects = loadData('projects.json');
    project = projects.find(p => p.id === projectId) || projects[0];
    risks = loadData('risks.json').filter(r => r.projectId === projectId);
  }

  // If no OpenAI key, use local document generation
  if (!openai) {
    res.json(generateLocalDocument(type, project, risks));
    return;
  }

  try {
    const prompts = {
      'status-report': `Generate a professional project status report for "${project.name}". Include:
- Executive Summary (2-3 sentences)
- Progress Update (${project.progress}% complete, health: ${project.health})
- Budget Status ($${project.spent.toLocaleString()} of $${project.budget.toLocaleString()} spent)
- Key Risks: ${project.risks.join(', ')}
- Next Steps (3-4 action items)
Format with clear headings.`,

      'charter': `Generate a professional project charter for "${project.name}". Include:
- Project Overview & Objectives
- Strategic Alignment: ${project.strategicObjective}
- Timeline: ${project.startDate} to ${project.endDate}
- Budget: $${project.budget.toLocaleString()}
- Project Manager: ${project.pmName}
- Success Criteria & KPIs
- Assumptions & Constraints
Format with clear headings.`,

      'meeting-summary': `Generate professional meeting minutes for "${project.name}" project review. Include:
- Meeting Details (date: today, attendees: ${project.pmName}, stakeholders, technical team)
- Discussion Points (status: ${project.status}, progress: ${project.progress}%, key issues)
- Decisions Made (2-3 items)
- Action Items with owners and due dates (3-4 items)
- Next Meeting date
Format with clear headings.`
    };

    const completion = await openai.chat.completions.create({
      model: 'gpt-5.2',
      messages: [
        { role: 'system', content: 'You are a professional technical writer creating project management documents. Be concise, professional, and actionable. IMPORTANT: Do NOT use markdown formatting like ** or ## - use plain text only. Use bullet points with "•" or "-" for lists.' },
        { role: 'user', content: prompts[type] || prompts['status-report'] }
      ],
      max_completion_tokens: 800,
      temperature: 0.7
    });

    const content = completion.choices[0].message.content;
    const sections = parseDocumentSections(content, type, project);

    res.json({
      title: `${type === 'status-report' ? 'Status Report' : type === 'charter' ? 'Project Charter' : 'Meeting Summary'} - ${project.name}`,
      generatedAt: new Date().toISOString(),
      sections,
      aiGenerated: true
    });
  } catch (error) {
    console.error('Document generation error:', error);
    // Fallback to template-based generation
    res.json(generateLocalDocument(type, project, risks));
  }
});

function parseDocumentSections(content, type, project) {
  const lines = content.split('\n').filter(l => l.trim());
  const sections = [];
  let currentSection = null;
  
  for (const line of lines) {
    if (line.startsWith('#') || line.startsWith('**') && line.endsWith('**')) {
      if (currentSection) sections.push(currentSection);
      currentSection = { heading: line.replace(/[#*]/g, '').trim(), content: '' };
    } else if (currentSection) {
      currentSection.content += line + '\n';
    }
  }
  if (currentSection) sections.push(currentSection);
  
  return sections.length > 0 ? sections : [{ heading: 'Document', content }];
}

function generateLocalDocument(type, project, risks) {
  const docs = {
    'status-report': {
      title: `Status Report - ${project.name}`,
      sections: [
        { heading: 'Executive Summary', content: `Project ${project.name} is currently ${project.status} with ${project.progress}% completion. Health status is ${project.health.toUpperCase()}. ${project.health === 'red' ? 'Immediate attention required.' : 'Progress is on track.'}` },
        { heading: 'Progress Update', content: `Overall Progress: ${project.progress}%\nHealth Status: ${project.health.toUpperCase()}\nStrategic Alignment: ${project.alignmentScore}%` },
        { heading: 'Budget Status', content: `Approved Budget: $${project.budget.toLocaleString()}\nSpent to Date: $${project.spent.toLocaleString()} (${Math.round(project.spent/project.budget*100)}%)\n${project.spent/project.budget > 0.8 ? '⚠️ Budget utilization above 80%' : '✅ Budget on track'}` },
        { heading: 'Key Risks', content: project.risks.map(r => `• ${r}`).join('\n') },
        { heading: 'Next Steps', content: '• Complete current sprint deliverables\n• Address identified risks with mitigation plans\n• Schedule stakeholder review meeting\n• Update project documentation' }
      ]
    },
    'charter': {
      title: `Project Charter - ${project.name}`,
      sections: [
        { heading: 'Project Overview', content: `Project: ${project.name}\nStrategic Objective: ${project.strategicObjective}\nExpected ROI: ${project.roi}%` },
        { heading: 'Timeline', content: `Start Date: ${project.startDate}\nTarget End Date: ${project.endDate}` },
        { heading: 'Budget', content: `Approved Budget: $${project.budget.toLocaleString()}` },
        { heading: 'Project Manager', content: project.pmName },
        { heading: 'Success Criteria', content: `• ROI Target: ${project.roi}%\n• Strategic Alignment: ${project.alignmentScore}%\n• On-time delivery\n• Within budget completion` }
      ]
    },
    'meeting-summary': {
      title: `Meeting Summary - ${project.name}`,
      sections: [
        { heading: 'Attendees', content: `${project.pmName}, Stakeholders, Technical Team` },
        { heading: 'Discussion Points', content: `• Current Status: ${project.status}\n• Progress: ${project.progress}%\n• Risk assessment reviewed\n• Resource allocation discussed` },
        { heading: 'Decisions', content: '• Continue with current approach\n• Escalate critical risks to steering committee\n• Approve additional resource request' },
        { heading: 'Action Items', content: `• ${project.pmName}: Update risk register by EOW\n• Technical Lead: Provide revised estimates\n• PMO: Schedule stakeholder review\n• Next meeting: 1 week` }
      ]
    }
  };
  
  return { ...docs[type], generatedAt: new Date().toISOString(), aiGenerated: false };
}

// UC9: PM Scoring
app.get('/api/pm-scores', async (req, res) => {
  try {
    res.json(await dataService.getPMScores());
  } catch (error) {
    console.error('Error fetching PM scores:', error.message);
    const pms = loadData('projectManagers.json');
    res.json({
      projectManagers: pms.sort((a, b) => b.overallScore - a.overallScore),
      metrics: ['delivery', 'budget', 'riskResolution', 'stakeholderSatisfaction', 'documentation'],
      avgScore: Math.round(pms.reduce((sum, pm) => sum + pm.overallScore, 0) / pms.length),
      topPerformer: pms.reduce((top, pm) => pm.overallScore > top.overallScore ? pm : top, pms[0]),
      needsSupport: pms.filter(pm => pm.overallScore < 75 || pm.trend === 'down'),
    });
  }
});

// Alerts endpoint
app.get('/api/alerts', async (req, res) => {
  try {
    res.json(await dataService.getAlerts());
  } catch (error) {
    console.error('Error fetching alerts:', error.message);
    res.json([]);
  }
});

// AI Analysis endpoint for various UCs
app.post('/api/ai/analyze', async (req, res) => {
  const { type, data } = req.body;
  let context;
  try {
    context = await dataService.getProjectContext();
  } catch {
    context = { projects: loadData('projects.json'), risks: loadData('risks.json'), pms: loadData('projectManagers.json'), objectives: loadData('strategicObjectives.json') };
  }

  const prompts = {
    'risk-prediction': `Analyze these project risks and provide predictions:
${JSON.stringify(context.risks, null, 2)}
Provide: 1) Risk trend analysis, 2) Probability of escalation, 3) Recommended mitigations`,

    'resource-optimization': `Analyze PM workloads and suggest optimizations:
${JSON.stringify(context.pms, null, 2)}
Provide: 1) Workload imbalances, 2) Recommended redistributions, 3) Mentorship pairings`,

    'strategic-alignment': `Analyze project alignment with strategic objectives:
Projects: ${JSON.stringify(context.projects, null, 2)}
Objectives: ${JSON.stringify(context.objectives, null, 2)}
Provide: 1) Alignment gaps, 2) Reprioritization recommendations, 3) ROI optimization suggestions`
  };

  // If no OpenAI key, return fallback analysis
  if (!openai) {
    res.json({ analysis: generateLocalAnalysis(type, context), timestamp: new Date().toISOString(), source: 'local' });
    return;
  }

  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-5.2',
      messages: [
        { role: 'system', content: 'You are an AI analyst for enterprise project management. Provide data-driven insights and actionable recommendations.' },
        { role: 'user', content: prompts[type] || 'Analyze the project portfolio and provide insights.' }
      ],
      max_completion_tokens: 600,
      temperature: 0.7
    });
    
    res.json({ analysis: completion.choices[0].message.content, timestamp: new Date().toISOString(), source: 'openai' });
  } catch (error) {
    res.json({ analysis: generateLocalAnalysis(type, context), timestamp: new Date().toISOString(), source: 'local' });
  }
});

// Smart local analysis fallback
function generateLocalAnalysis(type, context) {
  const { projects, risks, pms, objectives } = context;

  if (type === 'risk-prediction') {
    const critical = risks.filter(r => r.status === 'Critical');
    const increasing = risks.filter(r => r.trend === 'increasing');
    return `Risk Analysis Report

Risk Trend Analysis:
• Total Risks: ${risks.length}
• Critical Risks: ${critical.length} (${Math.round(critical.length/risks.length*100)}%)
• Increasing Trend: ${increasing.length} risks showing upward trajectory

Escalation Probability:
${critical.slice(0, 3).map(r => `• ${r.title} (${r.projectName}): ${r.probability}% likely to escalate
  Current Score: ${r.score} | Trend: ${r.trend}`).join('\n')}

Recommended Mitigations:
1. Immediate review of ${critical[0]?.projectName || 'critical'} risk mitigation plans
2. Increase monitoring frequency for increasing-trend risks
3. Allocate contingency budget for high-impact scenarios
4. Schedule risk review meeting within 48 hours`;
  }

  if (type === 'resource-optimization') {
    const overloaded = pms.filter(pm => pm.workload > 80);
    const available = pms.filter(pm => pm.workload < 70);
    const avgWorkload = Math.round(pms.reduce((sum, pm) => sum + pm.workload, 0) / pms.length);

    return `Resource Optimization Analysis

Workload Imbalances:
• Average Workload: ${avgWorkload}%
• Overloaded PMs: ${overloaded.length} (>80% capacity)
${overloaded.map(pm => `  - ${pm.name}: ${pm.workload}% (${pm.activeProjects} projects)`).join('\n')}

Recommended Redistributions:
${overloaded.length > 0 && available.length > 0 ? `• Transfer 1-2 projects from ${overloaded[0].name} to ${available[0].name}` : '• Current distribution is optimal'}
• Balance team across ${Math.round(avgWorkload/10)*10}% average target

Mentorship Pairings:
${pms.filter(pm => pm.overallScore > 85).slice(0, 2).map((senior, i) => {
  const junior = pms.filter(pm => pm.overallScore < 75)[i];
  return junior ? `• ${senior.name} (${senior.overallScore}%) to ${junior.name} (${junior.overallScore}%)` : '';
}).filter(Boolean).join('\n') || '• No urgent mentorship needs identified'}`;
  }

  if (type === 'strategic-alignment') {
    const avgAlignment = Math.round(projects.reduce((sum, p) => sum + p.alignmentScore, 0) / projects.length);
    const lowAligned = projects.filter(p => p.alignmentScore < 70);
    const highROI = projects.filter(p => p.roi > 120).sort((a, b) => b.roi - a.roi);

    return `Strategic Alignment Analysis

Alignment Gaps:
• Portfolio Alignment Score: ${avgAlignment}%
• Projects Below 70% Alignment: ${lowAligned.length}
${lowAligned.map(p => `  - ${p.name}: ${p.alignmentScore}% (${p.strategicObjective})`).join('\n')}

Reprioritization Recommendations:
1. Increase resources for high-alignment projects
2. Review scope of ${lowAligned[0]?.name || 'low-aligned'} projects
3. Consider strategic pivot for projects below 60% alignment

ROI Optimization:
• Top ROI Projects:
${highROI.slice(0, 3).map(p => `  - ${p.name}: ${p.roi}% ROI`).join('\n')}
• Recommendation: Accelerate ${highROI[0]?.name || 'high-ROI'} project timelines`;
  }

  return 'Analysis complete. Review dashboard for detailed metrics.';
}

// ─────────────────────────────────────────────────
// Project Server Integration Endpoints
// ─────────────────────────────────────────────────

// PS Status
app.get('/api/ps/status', async (req, res) => {
  const status = dataService.getStatus();
  let connected = false;
  if (psClient) {
    try { connected = await psClient.testConnection(); } catch { connected = false; }
  }
  res.json({ ...status, connected, serverUrl: psConfig.baseUrl });
});

// PS Cache Invalidation
app.post('/api/ps/cache/invalidate', (req, res) => {
  dataService.invalidateCache(req.body.key || null);
  res.json({ success: true, message: req.body.key ? `Cache key '${req.body.key}' invalidated` : 'All cache cleared' });
});

// Write-back: Update task progress/cost
app.post('/api/ps/tasks/:projectId/:taskId/update', async (req, res) => {
  if (!psClient) return res.status(503).json({ error: 'Project Server not configured' });

  const { projectId, taskId } = req.params;
  const { percentComplete, fixedCost } = req.body;

  try {
    const updates = {};
    if (percentComplete !== undefined) updates.PercentComplete = percentComplete;
    if (fixedCost !== undefined) updates.FixedCost = fixedCost;

    const digest = await psClient.checkoutProject(projectId);
    await psClient.updateTask(projectId, taskId, updates, digest);
    await psClient.publishProject(projectId);
    dataService.invalidateCache('projects');

    res.json({ success: true, message: 'Task updated and published' });
  } catch (error) {
    console.error('PS write-back error:', error.message);
    res.status(500).json({ error: error.message });
  }
});

// Write-back: Update project schedule
app.post('/api/ps/projects/:projectId/schedule', async (req, res) => {
  if (!psClient) return res.status(503).json({ error: 'Project Server not configured' });

  const { projectId } = req.params;
  const { finishDate } = req.body;

  try {
    const digest = await psClient.checkoutProject(projectId);
    await psClient.updateProjectDraft(projectId, { FinishDate: finishDate }, digest);
    await psClient.publishProject(projectId);
    dataService.invalidateCache('projects');

    res.json({ success: true, message: 'Schedule updated and published' });
  } catch (error) {
    console.error('PS schedule update error:', error.message);
    res.status(500).json({ error: error.message });
  }
});

// Write-back: Assign resource to task
// Routes through the PS Bridge Server (CSOM) on the VM to avoid queue blocking.
// Falls back to REST API if bridge is unavailable.
app.post('/api/ps/projects/:projectId/resources', async (req, res) => {
  if (!psClient) return res.status(503).json({ error: 'Project Server not configured' });

  const { projectId } = req.params;
  const { resourceId, taskId, resourceName, taskName, projectName } = req.body;

  // If we have names, try the CSOM bridge first (no queue blocking)
  if (resourceName && taskName && projectName) {
    try {
      const bridgeResult = await callPSBridge('/api/assign', {
        projectName,
        assignments: [{ resourceName, taskName }],
      });
      if (bridgeResult && bridgeResult.success) {
        dataService.invalidateCache('projects');
        return res.json({
          success: true,
          message: `Resource assigned via CSOM: ${bridgeResult.message}`,
          method: 'csom-bridge',
          details: bridgeResult.data,
        });
      }
      // If bridge returned but not success, log and fall through
      console.warn('PS Bridge returned failure:', bridgeResult?.message);
    } catch (bridgeErr) {
      console.warn('PS Bridge unavailable, falling back to REST API:', bridgeErr.message);
    }
  }

  // Fallback: direct REST API (may hit queue blocking)
  try {
    const digest = await psClient.checkoutProject(projectId);
    await psClient.addTaskAssignment(projectId, taskId, resourceId, digest);
    await psClient.publishProject(projectId);
    dataService.invalidateCache('projects');

    res.json({ success: true, message: 'Resource assigned and published', method: 'rest-api' });
  } catch (error) {
    console.error('PS resource assignment error:', error.message);
    res.status(500).json({ error: error.message });
  }
});

// Bulk assign resources via CSOM bridge
app.post('/api/ps/assign-all', async (req, res) => {
  const { projectAssignments } = req.body;

  if (!projectAssignments || typeof projectAssignments !== 'object') {
    return res.status(400).json({
      error: 'projectAssignments object required: { "Project Name": [{ resourceName, taskName }] }',
    });
  }

  try {
    const bridgeResult = await callPSBridge('/api/assign-all', { projectAssignments });
    dataService.invalidateCache('projects');
    res.json(bridgeResult);
  } catch (err) {
    console.error('Bulk assign error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// PS Bridge health check
app.get('/api/ps/bridge/health', async (req, res) => {
  try {
    const result = await callPSBridge('/health', null, 'GET');
    res.json({ available: true, ...result });
  } catch (err) {
    res.json({ available: false, error: err.message });
  }
});

// PS Enterprise Resources list (for UI dropdowns)
app.get('/api/ps/resources', async (req, res) => {
  if (!psClient) return res.status(503).json({ error: 'Project Server not configured' });

  try {
    const resources = await psClient.getEnterpriseResources();
    res.json(resources.map(r => ({ id: r.Id, name: r.Name })));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ─────────────────────────────────────────────────

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`EPM-AI Backend running on http://localhost:${PORT}`);
  console.log(`OpenAI integration: ${process.env.OPENAI_API_KEY ? 'Enabled' : 'Disabled (using fallback)'}`);
  console.log(`Project Server: ${psEnabled ? psConfig.baseUrl : 'Disabled (set PS_PASSWORD to enable)'}`);
});
