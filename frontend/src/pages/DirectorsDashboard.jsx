import { useState, useEffect } from 'react';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend, LineChart, Line, AreaChart, Area } from 'recharts';
import { TrendingUp, TrendingDown, DollarSign, FolderKanban, Target, AlertTriangle, Activity, Zap, Brain, Sliders, PlayCircle } from 'lucide-react';
import { API, authFetch } from '../utils/authFetch';

export default function DirectorsDashboard() {
  const [portfolio, setPortfolio] = useState(null);
  const [aiInsight, setAiInsight] = useState(null);

  // What-If Simulator State
  const [scenarioMode, setScenarioMode] = useState(false);
  const [budgetChange, setBudgetChange] = useState(0);
  const [resourceChange, setResourceChange] = useState(0);
  const [scopeChange, setScopeChange] = useState(0);
  const [scenarioResults, setScenarioResults] = useState(null);

  useEffect(() => {
    authFetch(`${API}/portfolio`).then(r => r.json()).then(setPortfolio);
    authFetch(`${API}/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: 'Give me a 2-sentence executive summary of the portfolio health and top recommendation' })
    }).then(r => r.json()).then(data => setAiInsight(data.response));
  }, []);

  // Calculate What-If Scenario Impact
  const calculateScenario = () => {
    if (!portfolio) return;

    const baseSuccessRate = 65;
    const baseBudgetHealth = 100 - Math.round((portfolio.totalSpent / portfolio.totalBudget) * 100);
    const baseTimelineRisk = portfolio.projects.filter(p => p.health === 'red').length * 20;

    // AI-simulated impact calculations
    const budgetImpact = budgetChange * 0.8; // +10% budget = +8% success
    const resourceImpact = resourceChange * 1.2; // +10% resources = +12% success
    const scopeImpact = scopeChange * -0.5; // -10% scope = +5% success (reduction helps)

    const newSuccessRate = Math.min(95, Math.max(30, baseSuccessRate + budgetImpact + resourceImpact - scopeImpact));
    const newBudgetHealth = Math.max(0, baseBudgetHealth - budgetChange);
    const newTimelineRisk = Math.max(0, baseTimelineRisk - resourceChange * 2 + scopeChange);

    setScenarioResults({
      successRate: Math.round(newSuccessRate),
      budgetHealth: Math.round(newBudgetHealth),
      timelineRisk: Math.round(newTimelineRisk),
      recommendation: newSuccessRate > 80
        ? 'Scenario shows strong improvement. Consider implementing these changes.'
        : newSuccessRate > 70
          ? 'Moderate improvement projected. May need additional adjustments.'
          : 'Limited impact. Consider alternative strategies.',
      confidence: 78 + Math.round((budgetChange + resourceChange) / 5),
      projectedSavings: budgetChange < 0 ? `$${Math.abs(budgetChange) * 50}K saved` : `$${budgetChange * 50}K additional investment`,
      timelineChange: resourceChange > 0 ? `-${resourceChange}% faster` : `+${Math.abs(resourceChange)}% slower`
    });
  };

  if (!portfolio) return (
    <div style={{ padding: 40, display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh' }}>
      <div style={{ textAlign: 'center' }}>
        <Activity size={40} color="#6366f1" style={{ animation: 'pulse 1.5s infinite' }} />
        <div style={{ marginTop: 16, color: '#64748b' }}>Loading portfolio data...</div>
      </div>
    </div>
  );

  const healthData = [
    { name: 'On Track', value: portfolio.healthBreakdown.green, color: '#10b981' },
    { name: 'At Risk', value: portfolio.healthBreakdown.yellow, color: '#f59e0b' },
    { name: 'Critical', value: portfolio.healthBreakdown.red, color: '#ef4444' },
  ];

  const budgetData = portfolio.projects.map(p => ({
    name: p.name.length > 10 ? p.name.substring(0, 10) + '...' : p.name,
    fullName: p.name,
    budget: (p.budget / 1000000).toFixed(2),
    spent: (p.spent / 1000000).toFixed(2),
    variance: ((p.budget - p.spent) / 1000000).toFixed(2)
  }));

  const utilizationRate = Math.round((portfolio.totalSpent / portfolio.totalBudget) * 100);
  const avgROI = Math.round(portfolio.projects.reduce((sum, p) => sum + p.roi, 0) / portfolio.projects.length);
  const criticalCount = portfolio.healthBreakdown.red;
  const avgAlignment = Math.round(portfolio.projects.reduce((sum, p) => sum + p.alignmentScore, 0) / portfolio.projects.length);

  const trendData = [
    { month: 'Aug', value: 58 },
    { month: 'Sep', value: 62 },
    { month: 'Oct', value: 59 },
    { month: 'Nov', value: 65 },
    { month: 'Dec', value: 68 },
    { month: 'Jan', value: portfolio.avgProgress },
  ];

  return (
    <div>
      <div className="page-header">
        <h1>Portfolio Dashboard</h1>
        <p>Executive overview with AI-powered insights and real-time analytics</p>
      </div>

      {/* KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 16, marginBottom: 24 }}>
        {[
          { label: 'Total Projects', value: portfolio.totalProjects, suffix: '', color: '#1e293b', icon: FolderKanban, trend: '+2 this quarter' },
          { label: 'Portfolio Budget', value: `$${(portfolio.totalBudget / 1000000).toFixed(1)}M`, suffix: '', color: '#6366f1', icon: DollarSign, trend: 'FY 2026' },
          { label: 'Budget Utilized', value: utilizationRate, suffix: '%', color: utilizationRate > 80 ? '#ef4444' : utilizationRate > 60 ? '#f59e0b' : '#10b981', icon: Activity, trend: `$${(portfolio.totalSpent / 1000000).toFixed(1)}M spent` },
          { label: 'Avg ROI', value: avgROI, suffix: '%', color: '#10b981', icon: TrendingUp, trend: 'Expected return' },
          { label: 'Strategic Fit', value: avgAlignment, suffix: '%', color: '#8b5cf6', icon: Target, trend: 'Alignment score' },
        ].map((kpi, i) => (
          <div key={i} style={{
            background: 'white',
            borderRadius: 16,
            padding: '20px',
            border: '1px solid #e2e8f0',
            position: 'relative',
            overflow: 'hidden'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
              <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#64748b', textTransform: 'uppercase' }}>{kpi.label}</span>
              <kpi.icon size={18} color={kpi.color} />
            </div>
            <div style={{ fontSize: '2rem', fontWeight: 700, color: kpi.color, marginBottom: 4 }}>
              {kpi.value}{kpi.suffix}
            </div>
            <div style={{ fontSize: '0.7rem', color: '#94a3b8' }}>{kpi.trend}</div>
          </div>
        ))}
      </div>

      {/* Charts Row */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 20, marginBottom: 24 }}>
        {/* Health Distribution */}
        <div style={{ background: 'white', borderRadius: 16, padding: 24, border: '1px solid #e2e8f0' }}>
          <h3 style={{ fontSize: '0.9rem', fontWeight: 600, marginBottom: 20, display: 'flex', alignItems: 'center', gap: 10 }}>
            <Target size={18} color="#6366f1" /> Health Distribution
          </h3>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie
                data={healthData}
                cx="50%"
                cy="50%"
                innerRadius={55}
                outerRadius={80}
                paddingAngle={4}
                dataKey="value"
              >
                {healthData.map((entry, i) => (
                  <Cell key={i} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip
                formatter={(value, name) => [`${value} projects`, name]}
                contentStyle={{ borderRadius: 8, border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
              />
            </PieChart>
          </ResponsiveContainer>
          <div style={{ display: 'flex', justifyContent: 'center', gap: 20, marginTop: 8 }}>
            {healthData.map((h, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <div style={{ width: 10, height: 10, borderRadius: '50%', background: h.color }} />
                <span style={{ fontSize: '0.75rem', color: '#64748b' }}>{h.name}: {h.value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Budget Analysis */}
        <div style={{ background: 'white', borderRadius: 16, padding: 24, border: '1px solid #e2e8f0' }}>
          <h3 style={{ fontSize: '0.9rem', fontWeight: 600, marginBottom: 20, display: 'flex', alignItems: 'center', gap: 10 }}>
            <DollarSign size={18} color="#6366f1" /> Budget vs Spend ($M)
          </h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={budgetData} barGap={2}>
              <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#6b7280' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 10, fill: '#6b7280' }} axisLine={false} tickLine={false} />
              <Tooltip
                formatter={(value, name) => [`$${value}M`, name === 'budget' ? 'Budget' : 'Spent']}
                contentStyle={{ borderRadius: 8, border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
              />
              <Bar dataKey="budget" fill="#6366f1" radius={[4, 4, 0, 0]} name="budget" />
              <Bar dataKey="spent" fill="#f59e0b" radius={[4, 4, 0, 0]} name="spent" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Progress Trend */}
        <div style={{ background: 'white', borderRadius: 16, padding: 24, border: '1px solid #e2e8f0' }}>
          <h3 style={{ fontSize: '0.9rem', fontWeight: 600, marginBottom: 20, display: 'flex', alignItems: 'center', gap: 10 }}>
            <Activity size={18} color="#6366f1" /> Progress Trend
          </h3>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={trendData}>
              <defs>
                <linearGradient id="progressGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <XAxis dataKey="month" tick={{ fontSize: 10, fill: '#6b7280' }} axisLine={false} tickLine={false} />
              <YAxis domain={[50, 80]} tick={{ fontSize: 10, fill: '#6b7280' }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ borderRadius: 8, border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
              <Area type="monotone" dataKey="value" stroke="#6366f1" fill="url(#progressGradient)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Risk Heat Map with AI Insights */}
      <div style={{ background: 'white', borderRadius: 16, border: '1px solid #e2e8f0', marginBottom: 24, overflow: 'hidden' }}>
        <div style={{ padding: '16px 24px', borderBottom: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <h3 style={{ fontSize: '0.9rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 10, margin: 0 }}>
            <AlertTriangle size={18} color="#f59e0b" /> Risk Heat Map
          </h3>
          {criticalCount > 0 && (
            <span style={{ padding: '4px 12px', background: '#fef2f2', color: '#dc2626', borderRadius: 8, fontSize: '0.75rem', fontWeight: 600 }}>
              {criticalCount} Critical
            </span>
          )}
        </div>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: '#f8fafc' }}>
              <th style={{ padding: '12px 24px', textAlign: 'left', fontSize: '0.7rem', fontWeight: 600, color: '#64748b', textTransform: 'uppercase' }}>Project</th>
              <th style={{ padding: '12px 16px', textAlign: 'center', fontSize: '0.7rem', fontWeight: 600, color: '#64748b', textTransform: 'uppercase' }}>Risk Score</th>
              <th style={{ padding: '12px 16px', textAlign: 'center', fontSize: '0.7rem', fontWeight: 600, color: '#64748b', textTransform: 'uppercase' }}>Budget Risk</th>
              <th style={{ padding: '12px 16px', textAlign: 'center', fontSize: '0.7rem', fontWeight: 600, color: '#64748b', textTransform: 'uppercase' }}>Schedule</th>
              <th style={{ padding: '12px 16px', textAlign: 'center', fontSize: '0.7rem', fontWeight: 600, color: '#64748b', textTransform: 'uppercase' }}>Alignment</th>
              <th style={{ padding: '12px 16px', textAlign: 'center', fontSize: '0.7rem', fontWeight: 600, color: '#64748b', textTransform: 'uppercase' }}>ROI</th>
              <th style={{ padding: '12px 24px', textAlign: 'center', fontSize: '0.7rem', fontWeight: 600, color: '#64748b', textTransform: 'uppercase' }}>Status</th>
            </tr>
          </thead>
          <tbody>
            {portfolio.projects.map((p, i) => {
              const budgetRisk = Math.round((p.spent / p.budget) * 100);
              const scheduleRisk = p.health === 'red' ? 'High' : p.health === 'yellow' ? 'Medium' : 'Low';
              const getHeatColor = (value, isInverse = false) => {
                if (isInverse) {
                  if (value >= 90) return { bg: '#f0fdf4', color: '#166534' };
                  if (value >= 80) return { bg: '#fffbeb', color: '#92400e' };
                  return { bg: '#fef2f2', color: '#991b1b' };
                }
                if (value > 70) return { bg: '#fef2f2', color: '#991b1b' };
                if (value > 50) return { bg: '#fffbeb', color: '#92400e' };
                return { bg: '#f0fdf4', color: '#166534' };
              };

              return (
                <tr key={p.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                  <td style={{ padding: '14px 24px' }}>
                    <div style={{ fontWeight: 600, color: '#1e293b', marginBottom: 2 }}>{p.name}</div>
                    <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{p.pmName}</div>
                  </td>
                  <td style={{ padding: '14px 16px', textAlign: 'center' }}>
                    <span style={{
                      padding: '4px 12px', borderRadius: 6, fontSize: '0.8rem', fontWeight: 600,
                      ...getHeatColor(p.riskScore)
                    }}>{p.riskScore}%</span>
                  </td>
                  <td style={{ padding: '14px 16px', textAlign: 'center' }}>
                    <span style={{
                      padding: '4px 12px', borderRadius: 6, fontSize: '0.8rem', fontWeight: 600,
                      ...getHeatColor(budgetRisk)
                    }}>{budgetRisk}%</span>
                  </td>
                  <td style={{ padding: '14px 16px', textAlign: 'center' }}>
                    <span style={{
                      padding: '4px 12px', borderRadius: 6, fontSize: '0.8rem', fontWeight: 600,
                      background: scheduleRisk === 'High' ? '#fef2f2' : scheduleRisk === 'Medium' ? '#fffbeb' : '#f0fdf4',
                      color: scheduleRisk === 'High' ? '#991b1b' : scheduleRisk === 'Medium' ? '#92400e' : '#166534'
                    }}>{scheduleRisk}</span>
                  </td>
                  <td style={{ padding: '14px 16px', textAlign: 'center' }}>
                    <span style={{
                      padding: '4px 12px', borderRadius: 6, fontSize: '0.8rem', fontWeight: 600,
                      ...getHeatColor(p.alignmentScore, true)
                    }}>{p.alignmentScore}%</span>
                  </td>
                  <td style={{ padding: '14px 16px', textAlign: 'center' }}>
                    <span style={{
                      padding: '4px 12px', borderRadius: 6, fontSize: '0.8rem', fontWeight: 600,
                      background: '#f0fdf4', color: '#166534'
                    }}>{p.roi}%</span>
                  </td>
                  <td style={{ padding: '14px 24px', textAlign: 'center' }}>
                    <span style={{
                      padding: '6px 14px', borderRadius: 8, fontSize: '0.75rem', fontWeight: 600,
                      background: p.health === 'green' ? '#dcfce7' : p.health === 'yellow' ? '#fef3c7' : '#fee2e2',
                      color: p.health === 'green' ? '#166534' : p.health === 'yellow' ? '#92400e' : '#991b1b'
                    }}>{p.status}</span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* AI Recommendations */}
      <div style={{ background: 'white', borderRadius: 16, padding: 24, border: '1px solid #e2e8f0', marginBottom: 24 }}>
        <h3 style={{ fontSize: '0.9rem', fontWeight: 600, marginBottom: 20, display: 'flex', alignItems: 'center', gap: 10 }}>
          <Zap size={18} color="#f59e0b" /> AI-Generated Recommendations
        </h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
          {[
            { title: 'Immediate Action', desc: 'Customer Portal requires scope freeze and additional resources to recover timeline.', priority: 'high' },
            { title: 'Budget Optimization', desc: 'Reallocate $200K from Cloud Migration contingency to Data Analytics for accelerated ROI.', priority: 'medium' },
            { title: 'Strategic Move', desc: 'Fast-track Data Analytics Platform - highest ROI (320%) with strong strategic alignment.', priority: 'low' },
          ].map((rec, i) => (
            <div key={i} style={{
              padding: 20, borderRadius: 12,
              background: rec.priority === 'high' ? '#fef2f2' : rec.priority === 'medium' ? '#fffbeb' : '#f0fdf4',
              border: `1px solid ${rec.priority === 'high' ? '#fecaca' : rec.priority === 'medium' ? '#fde68a' : '#bbf7d0'}`
            }}>
              <div style={{
                fontSize: '0.7rem', fontWeight: 600, textTransform: 'uppercase', marginBottom: 8,
                color: rec.priority === 'high' ? '#dc2626' : rec.priority === 'medium' ? '#d97706' : '#16a34a'
              }}>
                {rec.title}
              </div>
              <div style={{ fontSize: '0.85rem', color: '#475569', lineHeight: 1.5 }}>{rec.desc}</div>
            </div>
          ))}
        </div>
      </div>

      {/* AI Executive Summary - at bottom */}
      {aiInsight && (
        <div style={{
          background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)',
          borderRadius: scenarioMode ? '16px 16px 0 0' : 16,
          padding: '20px 24px',
          color: 'white',
          display: 'flex',
          alignItems: 'flex-start',
          gap: 16
        }}>
          <div style={{
            width: 44, height: 44, borderRadius: 12,
            background: 'rgba(255,255,255,0.2)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexShrink: 0
          }}>
            <Brain size={22} />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: '0.75rem', fontWeight: 600, opacity: 0.9, marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              AI Executive Summary
            </div>
            <div style={{ fontSize: '0.95rem', lineHeight: 1.6, opacity: 0.95, whiteSpace: 'pre-line' }}>
              {aiInsight}
            </div>
          </div>
          <button
            onClick={() => setScenarioMode(!scenarioMode)}
            style={{
              padding: '10px 16px',
              background: scenarioMode ? 'rgba(255,255,255,0.35)' : 'rgba(255,255,255,0.2)',
              border: 'none',
              borderRadius: 10,
              color: 'white',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              fontSize: '0.8rem',
              fontWeight: 600,
              transition: 'all 0.2s'
            }}
          >
            <Sliders size={16} />
            {scenarioMode ? 'Hide Simulator' : 'What-If Analysis'}
          </button>
        </div>
      )}

      {/* What-If Scenario Simulator - appears under AI Summary */}
      {scenarioMode && (
        <div style={{
          background: 'linear-gradient(135deg, #1e293b 0%, #334155 100%)',
          borderRadius: '0 0 16px 16px',
          padding: 24,
          color: 'white',
          marginTop: -1,
          borderTop: '1px solid rgba(255,255,255,0.1)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
            <Sliders size={20} />
            <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 600 }}>What-If Scenario Simulator</h3>
            <span style={{ padding: '4px 10px', background: 'rgba(99, 102, 241, 0.3)', borderRadius: 6, fontSize: '0.7rem' }}>AI-Powered</span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 300px', gap: 24 }}>
            {/* Budget Slider */}
            <div>
              <div style={{ fontSize: '0.75rem', opacity: 0.8, marginBottom: 8 }}>Budget Adjustment</div>
              <input
                type="range"
                min="-20"
                max="30"
                value={budgetChange}
                onChange={(e) => setBudgetChange(parseInt(e.target.value))}
                style={{ width: '100%', accentColor: '#6366f1' }}
              />
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', marginTop: 4 }}>
                <span style={{ color: budgetChange < 0 ? '#ef4444' : budgetChange > 0 ? '#10b981' : '#94a3b8' }}>
                  {budgetChange > 0 ? '+' : ''}{budgetChange}%
                </span>
                <span style={{ opacity: 0.6 }}>{budgetChange > 0 ? 'Increase' : budgetChange < 0 ? 'Decrease' : 'No change'}</span>
              </div>
            </div>

            {/* Resource Slider */}
            <div>
              <div style={{ fontSize: '0.75rem', opacity: 0.8, marginBottom: 8 }}>Resource Allocation</div>
              <input
                type="range"
                min="-15"
                max="25"
                value={resourceChange}
                onChange={(e) => setResourceChange(parseInt(e.target.value))}
                style={{ width: '100%', accentColor: '#6366f1' }}
              />
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', marginTop: 4 }}>
                <span style={{ color: resourceChange > 0 ? '#10b981' : resourceChange < 0 ? '#ef4444' : '#94a3b8' }}>
                  {resourceChange > 0 ? '+' : ''}{resourceChange}%
                </span>
                <span style={{ opacity: 0.6 }}>{resourceChange > 0 ? 'Add resources' : resourceChange < 0 ? 'Reduce' : 'No change'}</span>
              </div>
            </div>

            {/* Scope Slider */}
            <div>
              <div style={{ fontSize: '0.75rem', opacity: 0.8, marginBottom: 8 }}>Scope Adjustment</div>
              <input
                type="range"
                min="-30"
                max="20"
                value={scopeChange}
                onChange={(e) => setScopeChange(parseInt(e.target.value))}
                style={{ width: '100%', accentColor: '#6366f1' }}
              />
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', marginTop: 4 }}>
                <span style={{ color: scopeChange < 0 ? '#10b981' : scopeChange > 0 ? '#ef4444' : '#94a3b8' }}>
                  {scopeChange > 0 ? '+' : ''}{scopeChange}%
                </span>
                <span style={{ opacity: 0.6 }}>{scopeChange < 0 ? 'Reduce scope' : scopeChange > 0 ? 'Expand' : 'No change'}</span>
              </div>
            </div>

            {/* Run Simulation Button */}
            <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
              <button
                onClick={calculateScenario}
                style={{
                  padding: '14px 24px',
                  background: 'linear-gradient(135deg, #6366f1, #4f46e5)',
                  border: 'none',
                  borderRadius: 10,
                  color: 'white',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8,
                  fontSize: '0.9rem',
                  fontWeight: 600,
                  boxShadow: '0 4px 12px rgba(99, 102, 241, 0.4)'
                }}
              >
                <PlayCircle size={18} />
                Run AI Simulation
              </button>
            </div>
          </div>

          {/* Scenario Results */}
          {scenarioResults && (
            <div style={{ marginTop: 24, paddingTop: 24, borderTop: '1px solid rgba(255,255,255,0.1)' }}>
              <div style={{ fontSize: '0.75rem', opacity: 0.7, marginBottom: 12, textTransform: 'uppercase' }}>Simulation Results (Confidence: {scenarioResults.confidence}%)</div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>
                <div style={{ background: 'rgba(255,255,255,0.1)', padding: 16, borderRadius: 10 }}>
                  <div style={{ fontSize: '0.7rem', opacity: 0.7, marginBottom: 4 }}>Success Probability</div>
                  <div style={{ fontSize: '1.8rem', fontWeight: 700, color: scenarioResults.successRate > 75 ? '#10b981' : scenarioResults.successRate > 60 ? '#f59e0b' : '#ef4444' }}>
                    {scenarioResults.successRate}%
                  </div>
                </div>
                <div style={{ background: 'rgba(255,255,255,0.1)', padding: 16, borderRadius: 10 }}>
                  <div style={{ fontSize: '0.7rem', opacity: 0.7, marginBottom: 4 }}>Budget Impact</div>
                  <div style={{ fontSize: '1rem', fontWeight: 600, marginTop: 8 }}>{scenarioResults.projectedSavings}</div>
                </div>
                <div style={{ background: 'rgba(255,255,255,0.1)', padding: 16, borderRadius: 10 }}>
                  <div style={{ fontSize: '0.7rem', opacity: 0.7, marginBottom: 4 }}>Timeline Impact</div>
                  <div style={{ fontSize: '1rem', fontWeight: 600, marginTop: 8 }}>{scenarioResults.timelineChange}</div>
                </div>
                <div style={{ background: 'rgba(99, 102, 241, 0.3)', padding: 16, borderRadius: 10 }}>
                  <div style={{ fontSize: '0.7rem', opacity: 0.7, marginBottom: 4 }}>AI Recommendation</div>
                  <div style={{ fontSize: '0.85rem', lineHeight: 1.4 }}>{scenarioResults.recommendation}</div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
      `}</style>
    </div>
  );
}
