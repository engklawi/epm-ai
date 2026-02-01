import express from 'express';
import cors from 'cors';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import OpenAI from 'openai';

const __dirname = dirname(fileURLToPath(import.meta.url));
const app = express();
app.use(cors());
app.use(express.json());

// Initialize OpenAI (lazy - only when API key is available)
let openai = null;
if (process.env.OPENAI_API_KEY) {
  openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
  });
}

// Load mock data
const loadData = (file) => JSON.parse(readFileSync(join(__dirname, 'data', file), 'utf-8'));

// Get all project data for AI context
const getProjectContext = () => {
  const projects = loadData('projects.json');
  const risks = loadData('risks.json');
  const pms = loadData('projectManagers.json');
  const objectives = loadData('strategicObjectives.json');
  return { projects, risks, pms, objectives };
};

// UC1: Projects & Schedule
app.get('/api/projects', (req, res) => {
  res.json(loadData('projects.json'));
});

app.get('/api/projects/:id', (req, res) => {
  const projects = loadData('projects.json');
  const project = projects.find(p => p.id === req.params.id);
  if (project) res.json(project);
  else res.status(404).json({ error: 'Project not found' });
});

// UC1: AI Chat with GPT-5.2
app.post('/api/chat', async (req, res) => {
  const { message } = req.body;
  const context = getProjectContext();

  // If no OpenAI key, use local response
  if (!openai) {
    const response = generateLocalResponse(message, context);
    res.json({ response, timestamp: new Date().toISOString(), source: 'local' });
    return;
  }

  try {
    const systemPrompt = `You are an AI Project Management Assistant for an EPM (Enterprise Project Management) system. You have access to the following real-time data:

PROJECTS:
${JSON.stringify(context.projects, null, 2)}

RISKS:
${JSON.stringify(context.risks, null, 2)}

PROJECT MANAGERS:
${JSON.stringify(context.pms, null, 2)}

STRATEGIC OBJECTIVES:
${JSON.stringify(context.objectives, null, 2)}

IMPORTANT FORMATTING RULES:
- Do NOT use markdown formatting (no **, no ##, no ###)
- Use plain text only
- Use bullet points with "•" character for lists
- Use "-" for sub-items
- Use ALL CAPS for emphasis instead of bold
- Keep responses concise and professional
- Include specific numbers, percentages, and names from the data
- Provide actionable insights`;

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: message }
      ],
      max_tokens: 500,
      temperature: 0.7
    });

    res.json({
      response: completion.choices[0].message.content,
      timestamp: new Date().toISOString(),
      source: 'openai'
    });
  } catch (error) {
    console.error('OpenAI Error:', error);
    // Fallback to smart local response
    const response = generateLocalResponse(message, context);
    res.json({ response, timestamp: new Date().toISOString(), source: 'local' });
  }
});

// Smart local fallback
function generateLocalResponse(message, context) {
  const { projects, risks, pms } = context;
  const lowerMsg = message.toLowerCase();

  if (lowerMsg.includes('status') || lowerMsg.includes('project') || lowerMsg.includes('overview')) {
    const atRisk = projects.filter(p => p.health === 'red');
    const onTrack = projects.filter(p => p.health === 'green');
    const totalBudget = projects.reduce((sum, p) => sum + p.budget, 0);
    const totalSpent = projects.reduce((sum, p) => sum + p.spent, 0);

    return `Portfolio Status Overview

Projects: ${projects.length} active
• On Track: ${onTrack.length} (${onTrack.map(p => p.name).join(', ')})
• At Risk: ${projects.filter(p => p.health === 'yellow').length}
• Critical: ${atRisk.length} (${atRisk.map(p => p.name).join(', ') || 'None'})

Budget: $${(totalSpent/1000000).toFixed(2)}M / $${(totalBudget/1000000).toFixed(2)}M (${Math.round(totalSpent/totalBudget*100)}% utilized)

Highest Risk: ${atRisk[0]?.name || 'None'} - Risk Score: ${atRisk[0]?.riskScore || 0}%

Recommended Action: ${atRisk.length > 0 ? `Immediate review needed for ${atRisk[0].name}` : 'Continue monitoring all projects'}`;
  }

  if (lowerMsg.includes('risk')) {
    const critical = risks.filter(r => r.status === 'Critical');
    const increasing = risks.filter(r => r.trend === 'increasing');

    return `Risk Analysis

Summary: ${risks.length} total risks identified
• Critical: ${critical.length}
• Increasing Trend: ${increasing.length}

Top Critical Risks:
${critical.map(r => `• ${r.title} (${r.projectName})
  - Probability: ${r.probability}% | Impact: ${r.impact}%
  - Score: ${r.score} | Trend: ${r.trend}
  - Mitigation: ${r.mitigation}`).join('\n\n')}

AI Recommendation: Focus immediate attention on ${critical[0]?.projectName || 'high-score risks'}. Consider implementing suggested mitigations within the next sprint.`;
  }

  if (lowerMsg.includes('resource') || lowerMsg.includes('workload') || lowerMsg.includes('team')) {
    const overloaded = pms.filter(pm => pm.workload > 80);
    const available = pms.filter(pm => pm.workload < 70);

    return `Resource & Workload Analysis

Team: ${pms.length} Project Managers

Capacity Alerts:
${overloaded.map(pm => `• ${pm.name}: ${pm.workload}% capacity (${pm.activeProjects} active projects) [OVERLOADED]`).join('\n')}

Available Capacity:
${available.map(pm => `• ${pm.name}: ${pm.workload}% capacity`).join('\n')}

AI Recommendation: ${overloaded.length > 0 ? `Redistribute workload from ${overloaded[0].name} to ${available[0]?.name || 'available resources'}. Consider pairing overloaded PMs with mentors.` : 'Team capacity is balanced. Continue monitoring.'}`;
  }

  if (lowerMsg.includes('schedule') || lowerMsg.includes('delay') || lowerMsg.includes('timeline')) {
    const delayed = projects.filter(p => p.health === 'red' || p.health === 'yellow');

    return `Schedule & Timeline Analysis

Projects with Timeline Concerns: ${delayed.length}

${delayed.map(p => `• ${p.name}
  - Progress: ${p.progress}% | Health: ${p.health.toUpperCase()}
  - Timeline: ${p.startDate} to ${p.endDate}
  - PM: ${p.pmName}`).join('\n\n')}

AI Prediction: ${delayed.length > 0 ? `${delayed[0].name} is likely to miss deadline by 2-4 weeks based on current velocity.` : 'All projects on track.'}

Recommended Actions:
${delayed.length > 0 ? `1. Fast-track critical path for ${delayed[0].name}
2. Add resources or reduce scope
3. Communicate timeline risks to stakeholders` : '• Continue current cadence\n• Monitor weekly progress'}`;
  }

  if (lowerMsg.includes('mitigation') || lowerMsg.includes('action') || lowerMsg.includes('recommend')) {
    const critical = risks.filter(r => r.status === 'Critical');
    const atRiskProjects = projects.filter(p => p.health === 'red' || p.health === 'yellow');

    return `Mitigation Strategies & Action Plan

Immediate Actions Required:

${critical.slice(0, 3).map((r, i) => `${i+1}. ${r.title} (${r.projectName})
   Current Mitigation: ${r.mitigation}
   Additional Actions:
   • Escalate to steering committee within 24 hours
   • Allocate contingency budget (10-15% of project value)
   • Daily status updates until resolved`).join('\n\n')}

Project-Level Recommendations:
${atRiskProjects.slice(0, 2).map(p => `• ${p.name}: Review scope, fast-track critical path, consider phased delivery`).join('\n')}

Resource Optimization:
• Redistribute workload from overloaded PMs
• Consider external contractor support for critical projects
• Implement pair management for high-risk initiatives

Timeline: Execute top 3 mitigations within next 5 business days`;
  }

  if (lowerMsg.includes('budget') || lowerMsg.includes('cost') || lowerMsg.includes('spend')) {
    const totalBudget = projects.reduce((sum, p) => sum + p.budget, 0);
    const totalSpent = projects.reduce((sum, p) => sum + p.spent, 0);
    const overBudget = projects.filter(p => (p.spent / p.budget) > 0.8 && p.progress < 70);

    return `Budget & Cost Analysis

Portfolio Financial Summary:
• Total Budget: $${(totalBudget/1000000).toFixed(2)}M
• Total Spent: $${(totalSpent/1000000).toFixed(2)}M (${Math.round(totalSpent/totalBudget*100)}%)
• Remaining: $${((totalBudget-totalSpent)/1000000).toFixed(2)}M

Budget Health by Project:
${projects.map(p => `• ${p.name}: $${(p.spent/1000000).toFixed(2)}M / $${(p.budget/1000000).toFixed(2)}M (${Math.round(p.spent/p.budget*100)}%)${p.spent/p.budget > 0.8 ? ' [WARNING]' : ''}`).join('\n')}

Alerts:
${overBudget.length > 0 ? overBudget.map(p => `• ${p.name}: ${Math.round(p.spent/p.budget*100)}% budget used at ${p.progress}% completion [CRITICAL]`).join('\n') : 'No immediate budget concerns'}

AI Recommendation: ${overBudget.length > 0 ? `Review ${overBudget[0].name} for scope reduction or budget increase` : 'Continue monitoring burn rates weekly'}`;
  }

  return `I can help you with:
• Project status - "What's the project status?"
• Risk analysis - "Show me the risks"
• Resource workload - "Check team workload"
• Schedule analysis - "Any timeline delays?"
• Budget analysis - "Check budget status"
• Mitigation strategies - "Show mitigation strategies"

What would you like to know?`;
}

// UC2: Portfolio Dashboard
app.get('/api/portfolio', (req, res) => {
  const projects = loadData('projects.json');
  const objectives = loadData('strategicObjectives.json');
  
  res.json({
    totalProjects: projects.length,
    totalBudget: projects.reduce((sum, p) => sum + p.budget, 0),
    totalSpent: projects.reduce((sum, p) => sum + p.spent, 0),
    healthBreakdown: {
      green: projects.filter(p => p.health === 'green').length,
      yellow: projects.filter(p => p.health === 'yellow').length,
      red: projects.filter(p => p.health === 'red').length
    },
    avgProgress: Math.round(projects.reduce((sum, p) => sum + p.progress, 0) / projects.length),
    strategicObjectives: objectives.length,
    projects,
    objectives
  });
});

// UC3: Strategy & ROI
app.get('/api/strategy', (req, res) => {
  const objectives = loadData('strategicObjectives.json');
  const projects = loadData('projects.json');
  
  res.json({
    objectives: objectives.map(obj => ({
      ...obj,
      projectDetails: projects.filter(p => obj.projects.includes(p.id))
    })),
    overallROI: Math.round(projects.reduce((sum, p) => sum + p.roi, 0) / projects.length),
    alignmentScore: Math.round(projects.reduce((sum, p) => sum + p.alignmentScore, 0) / projects.length)
  });
});

// UC6: Risk Management
app.get('/api/risks', (req, res) => {
  const risks = loadData('risks.json');
  res.json({
    risks,
    summary: {
      total: risks.length,
      critical: risks.filter(r => r.status === 'Critical').length,
      open: risks.filter(r => r.status === 'Open').length,
      monitoring: risks.filter(r => r.status === 'Monitoring').length,
      avgScore: Math.round(risks.reduce((sum, r) => sum + r.score, 0) / risks.length)
    },
    byCategory: {
      Resource: risks.filter(r => r.category === 'Resource').length,
      Scope: risks.filter(r => r.category === 'Scope').length,
      Financial: risks.filter(r => r.category === 'Financial').length,
      Technical: risks.filter(r => r.category === 'Technical').length,
      Schedule: risks.filter(r => r.category === 'Schedule').length
    }
  });
});

// UC7: AI Document Generation with GPT-4o
app.post('/api/documents/generate', async (req, res) => {
  const { type, projectId } = req.body;
  const projects = loadData('projects.json');
  const project = projects.find(p => p.id === projectId) || projects[0];
  const risks = loadData('risks.json').filter(r => r.projectId === projectId);

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
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: 'You are a professional technical writer creating project management documents. Be concise, professional, and actionable.' },
        { role: 'user', content: prompts[type] || prompts['status-report'] }
      ],
      max_tokens: 800,
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
app.get('/api/pm-scores', (req, res) => {
  const pms = loadData('projectManagers.json');
  res.json({
    projectManagers: pms.sort((a, b) => b.overallScore - a.overallScore),
    metrics: ['delivery', 'budget', 'riskResolution', 'stakeholderSatisfaction', 'documentation'],
    avgScore: Math.round(pms.reduce((sum, pm) => sum + pm.overallScore, 0) / pms.length),
    topPerformer: pms.reduce((top, pm) => pm.overallScore > top.overallScore ? pm : top, pms[0]),
    needsSupport: pms.filter(pm => pm.overallScore < 75 || pm.trend === 'down')
  });
});

// Alerts endpoint
app.get('/api/alerts', (req, res) => {
  const projects = loadData('projects.json');
  const risks = loadData('risks.json');
  const pms = loadData('projectManagers.json');
  
  const alerts = [];
  
  projects.filter(p => p.health === 'red').forEach(p => {
    alerts.push({ type: 'critical', category: 'project', message: `${p.name} is at risk`, projectId: p.id });
  });
  
  risks.filter(r => r.status === 'Critical').forEach(r => {
    alerts.push({ type: 'critical', category: 'risk', message: `Critical risk: ${r.title}`, projectId: r.projectId });
  });
  
  pms.filter(pm => pm.workload > 80).forEach(pm => {
    alerts.push({ type: 'warning', category: 'resource', message: `${pm.name} is overloaded (${pm.workload}%)`, pmId: pm.id });
  });
  
  projects.filter(p => (p.spent / p.budget) > 0.8 && p.progress < 70).forEach(p => {
    alerts.push({ type: 'warning', category: 'budget', message: `${p.name} budget concern: ${Math.round(p.spent/p.budget*100)}% spent, ${p.progress}% complete`, projectId: p.id });
  });
  
  res.json(alerts);
});

// AI Analysis endpoint for various UCs
app.post('/api/ai/analyze', async (req, res) => {
  const { type, data } = req.body;
  const context = getProjectContext();

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
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: 'You are an AI analyst for enterprise project management. Provide data-driven insights and actionable recommendations.' },
        { role: 'user', content: prompts[type] || 'Analyze the project portfolio and provide insights.' }
      ],
      max_tokens: 600,
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

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`EPM-AI Backend running on http://localhost:${PORT}`);
  console.log(`OpenAI integration: ${process.env.OPENAI_API_KEY ? 'Enabled' : 'Disabled (using fallback)'}`);
});
