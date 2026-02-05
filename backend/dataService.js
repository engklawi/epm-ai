/**
 * Data Service - Orchestrates Project Server and mock data
 *
 * Merges live PS operational data with EPM-AI analytical enrichments.
 * Provides caching and graceful fallback to mock data.
 */

import { readFileSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import { parseDescription } from './projectServerClient.js';

const __dirname = dirname(fileURLToPath(import.meta.url));

const loadData = (file) => JSON.parse(readFileSync(join(__dirname, 'data', file), 'utf-8'));

// ─────────────────────────────────────────────────
// TTL Cache
// ─────────────────────────────────────────────────

class TTLCache {
  constructor(defaultTTL = 300000) {
    this.cache = new Map();
    this.defaultTTL = defaultTTL;
  }

  get(key) {
    const entry = this.cache.get(key);
    if (!entry) return null;
    if (Date.now() > entry.expiry) {
      this.cache.delete(key);
      return null;
    }
    return entry.value;
  }

  set(key, value, ttl) {
    this.cache.set(key, {
      value,
      expiry: Date.now() + (ttl || this.defaultTTL),
    });
  }

  invalidate(key) {
    if (key) this.cache.delete(key);
    else this.cache.clear();
  }

  keys() {
    return [...this.cache.keys()];
  }
}

// ─────────────────────────────────────────────────
// Merge PS project with mock enrichments
// ─────────────────────────────────────────────────

function mergeProjectData(psProject, psTasks, mockProjects) {
  const desc = parseDescription(psProject.Description);
  const mock = mockProjects.find(m => m.name === psProject.Name);

  // Compute spent from task costs weighted by completion
  const spent = psTasks.reduce((sum, t) => {
    return sum + ((t.FixedCost || 0) * (t.PercentComplete || 0) / 100);
  }, 0);

  return {
    // Identity - use mock ID if matched for backward compatibility
    id: mock?.id || psProject.Id.substring(0, 8),
    psId: psProject.Id,
    name: psProject.Name,

    // Operational data from PS
    progress: psProject.PercentComplete || 0,
    startDate: psProject.StartDate?.split('T')[0] || mock?.startDate || '',
    endDate: psProject.FinishDate?.split('T')[0] || mock?.endDate || '',

    // From Description parsing, falling back to mock
    status: desc.status || mock?.status || 'Unknown',
    health: desc.health || mock?.health || 'yellow',
    budget: desc.budget || mock?.budget || 0,
    spent: spent || mock?.spent || 0,
    roi: desc.roi || mock?.roi || 0,
    alignmentScore: desc.alignmentScore || mock?.alignmentScore || 0,
    strategicObjective: desc.strategicObjective || mock?.strategicObjective || '',

    // From mock only (not in PS)
    riskScore: mock?.riskScore || 0,
    risks: mock?.risks || [],
    pmId: mock?.pmId || '',
    pmName: mock?.pmName || '',

    // AI enrichments always from mock/computed
    aiInsights: mock?.aiInsights || {},
    lessonsLearned: mock?.lessonsLearned || [],

    // Tasks from PS (new field, additive)
    tasks: psTasks.map(t => ({
      id: t.Id,
      name: t.Name,
      progress: t.PercentComplete || 0,
      cost: t.FixedCost || 0,
      startDate: t.Start?.split('T')[0] || '',
      endDate: t.Finish?.split('T')[0] || '',
    })),

    // Metadata
    _source: 'project-server',
    _lastSync: new Date().toISOString(),
  };
}

// ─────────────────────────────────────────────────
// Data Service Factory
// ─────────────────────────────────────────────────

export function createDataService(psClient, options = {}) {
  const cache = new TTLCache(options.cacheTTL || 300000);
  const psEnabled = options.enabled !== false && psClient !== null;
  let lastSync = null;

  async function fetchPSProjects() {
    const psProjects = await psClient.getProjects();
    if (!psProjects || psProjects.length === 0) return null;

    const mockProjects = loadData('projects.json');

    const merged = await Promise.all(
      psProjects.map(async (psp) => {
        const tasks = await psClient.getProjectTasks(psp.Id);
        return mergeProjectData(psp, tasks, mockProjects);
      })
    );

    lastSync = new Date().toISOString();
    return merged;
  }

  return {
    async getProjects() {
      const cached = cache.get('projects');
      if (cached) return cached;

      if (psEnabled) {
        try {
          const projects = await fetchPSProjects();
          if (projects) {
            cache.set('projects', projects);
            return projects;
          }
        } catch (error) {
          console.error('PS fetch failed, falling back to mock data:', error.message);
        }
      }

      const mockData = loadData('projects.json');
      cache.set('projects', mockData);
      return mockData;
    },

    async getProjectById(id) {
      const projects = await this.getProjects();
      return projects.find(p => p.id === id || p.psId === id) || null;
    },

    getRisks() {
      // Risks stay in mock data (PS doesn't store the EPM-AI risk model)
      return loadData('risks.json');
    },

    getProjectManagers() {
      // PM scoring/performance data stays in mock
      return loadData('projectManagers.json');
    },

    getStrategicObjectives() {
      return loadData('strategicObjectives.json');
    },

    async getPortfolio() {
      const projects = await this.getProjects();
      const objectives = this.getStrategicObjectives();

      return {
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
      };
    },

    async getStrategy() {
      const objectives = this.getStrategicObjectives();
      const projects = await this.getProjects();

      return {
        objectives: objectives.map(obj => ({
          ...obj,
          projectDetails: projects.filter(p => obj.projects.includes(p.id)),
        })),
        overallROI: Math.round(projects.reduce((sum, p) => sum + p.roi, 0) / projects.length),
        alignmentScore: Math.round(projects.reduce((sum, p) => sum + p.alignmentScore, 0) / projects.length),
      };
    },

    async getAlerts() {
      const projects = await this.getProjects();
      const risks = this.getRisks();
      const pms = this.getProjectManagers();

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
        alerts.push({ type: 'warning', category: 'budget', message: `${p.name} budget concern: ${Math.round(p.spent / p.budget * 100)}% spent, ${p.progress}% complete`, projectId: p.id });
      });

      return alerts;
    },

    async getPMScores() {
      const pms = this.getProjectManagers();
      return {
        projectManagers: pms.sort((a, b) => b.overallScore - a.overallScore),
        metrics: ['delivery', 'budget', 'riskResolution', 'stakeholderSatisfaction', 'documentation'],
        avgScore: Math.round(pms.reduce((sum, pm) => sum + pm.overallScore, 0) / pms.length),
        topPerformer: pms.reduce((top, pm) => pm.overallScore > top.overallScore ? pm : top, pms[0]),
        needsSupport: pms.filter(pm => pm.overallScore < 75 || pm.trend === 'down'),
      };
    },

    async getRisksWithSummary() {
      const risks = this.getRisks();
      return {
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
      };
    },

    async getProjectContext() {
      const projects = await this.getProjects();
      const risks = this.getRisks();
      const pms = this.getProjectManagers();
      const objectives = this.getStrategicObjectives();
      return { projects, risks, pms, objectives };
    },

    invalidateCache(key) {
      cache.invalidate(key);
    },

    isLive() {
      return psEnabled;
    },

    getStatus() {
      return {
        psEnabled,
        lastSync,
        cachedKeys: cache.keys(),
      };
    },
  };
}
