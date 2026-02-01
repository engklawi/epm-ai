import { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line, RadarChart, Radar, PolarGrid, PolarAngleAxis } from 'recharts';
import { TrendingUp, CheckCircle, Clock, DollarSign, Brain, Award, Target, Zap } from 'lucide-react';

const API = 'https://epm-ai-demo-20260201.uc.r.appspot.com/api';

export default function PMOPerformance() {
  const [portfolio, setPortfolio] = useState(null);
  const [aiInsight, setAiInsight] = useState(null);

  useEffect(() => {
    fetch(`${API}/portfolio`).then(r => r.json()).then(setPortfolio);
    fetch(`${API}/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: 'Analyze PMO performance metrics and give 1 key insight with recommended action' })
    }).then(r => r.json()).then(data => setAiInsight(data.response?.split('\n')[0]));
  }, []);

  if (!portfolio) return <div style={{ padding: 40 }}>Loading...</div>;

  const kpiData = [
    { name: 'Delivery Success', value: 78, target: 85, icon: CheckCircle, color: '#10b981', trend: '+3%' },
    { name: 'Budget Accuracy', value: 72, target: 90, icon: DollarSign, color: '#6366f1', trend: '+2%' },
    { name: 'Schedule Adherence', value: 68, target: 80, icon: Clock, color: '#f59e0b', trend: '-1%' },
    { name: 'Compliance', value: 92, target: 95, icon: TrendingUp, color: '#8b5cf6', trend: '+5%' },
  ];

  const trendData = [
    { month: 'Jul', delivery: 72, budget: 68, schedule: 65 },
    { month: 'Aug', delivery: 74, budget: 70, schedule: 66 },
    { month: 'Sep', delivery: 75, budget: 71, schedule: 68 },
    { month: 'Oct', delivery: 76, budget: 72, schedule: 67 },
    { month: 'Nov', delivery: 77, budget: 71, schedule: 68 },
    { month: 'Dec', delivery: 78, budget: 72, schedule: 68 },
  ];

  const radarData = [
    { metric: 'Delivery', value: 78, fullMark: 100 },
    { metric: 'Budget', value: 72, fullMark: 100 },
    { metric: 'Schedule', value: 68, fullMark: 100 },
    { metric: 'Quality', value: 85, fullMark: 100 },
    { metric: 'Risk Mgmt', value: 75, fullMark: 100 },
    { metric: 'Stakeholder', value: 82, fullMark: 100 },
  ];

  const benchmarkData = [
    { metric: 'Delivery', internal: 78, industry: 75, topQuartile: 88 },
    { metric: 'Budget', internal: 72, industry: 70, topQuartile: 85 },
    { metric: 'Schedule', internal: 68, industry: 72, topQuartile: 82 },
    { metric: 'Quality', internal: 85, industry: 80, topQuartile: 92 },
  ];

  const maturityScore = Math.round((78 + 72 + 68 + 92) / 4);

  return (
    <div>
      <div className="page-header">
        <h1>PMO Performance</h1>
        <p>AI-driven PMO maturity assessment and continuous improvement insights</p>
      </div>

      {/* AI Insight Banner */}
      {aiInsight && (
        <div style={{ background: 'linear-gradient(135deg, #8b5cf6 0%, #6366f1 100%)', borderRadius: 16, padding: '20px 24px', marginBottom: 24, color: 'white', display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{ width: 44, height: 44, borderRadius: 12, background: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Brain size={22} />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: '0.75rem', fontWeight: 600, opacity: 0.9, marginBottom: 4, textTransform: 'uppercase' }}>AI Performance Insight</div>
            <div style={{ fontSize: '0.95rem', lineHeight: 1.5 }}>{aiInsight}</div>
          </div>
          <div style={{ textAlign: 'center', padding: '12px 20px', background: 'rgba(255,255,255,0.15)', borderRadius: 12 }}>
            <div style={{ fontSize: '1.75rem', fontWeight: 700 }}>{maturityScore}%</div>
            <div style={{ fontSize: '0.7rem', opacity: 0.9 }}>Maturity Score</div>
          </div>
        </div>
      )}

      {/* KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 24 }}>
        {kpiData.map((kpi, i) => (
          <div key={i} style={{ background: 'white', borderRadius: 16, padding: 20, border: '1px solid #e2e8f0', borderTop: `4px solid ${kpi.color}` }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <kpi.icon size={18} color={kpi.color} />
                <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#64748b' }}>{kpi.name}</span>
              </div>
              <span style={{ fontSize: '0.7rem', fontWeight: 600, color: kpi.trend.startsWith('+') ? '#10b981' : '#ef4444' }}>{kpi.trend}</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
              <span style={{ fontSize: '2rem', fontWeight: 700, color: kpi.value >= kpi.target * 0.9 ? '#059669' : '#d97706' }}>{kpi.value}%</span>
              <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>/ {kpi.target}%</span>
            </div>
            <div style={{ marginTop: 12, height: 6, background: '#e2e8f0', borderRadius: 3 }}>
              <div style={{ width: `${Math.min((kpi.value / kpi.target) * 100, 100)}%`, height: '100%', background: kpi.color, borderRadius: 3, transition: 'width 0.3s' }} />
            </div>
          </div>
        ))}
      </div>

      {/* Charts Row */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 20, marginBottom: 24 }}>
        {/* Performance Trends */}
        <div style={{ background: 'white', borderRadius: 16, padding: 24, border: '1px solid #e2e8f0' }}>
          <h3 style={{ fontSize: '0.9rem', fontWeight: 600, marginBottom: 20, display: 'flex', alignItems: 'center', gap: 8 }}>
            <TrendingUp size={18} color="#6366f1" /> Performance Trends (6 months)
          </h3>
          <ResponsiveContainer width="100%" height={240}>
            <LineChart data={trendData}>
              <XAxis dataKey="month" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis domain={[60, 85]} tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ borderRadius: 8, border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
              <Line type="monotone" dataKey="delivery" stroke="#10b981" strokeWidth={2} dot={{ r: 4 }} name="Delivery" />
              <Line type="monotone" dataKey="budget" stroke="#6366f1" strokeWidth={2} dot={{ r: 4 }} name="Budget" />
              <Line type="monotone" dataKey="schedule" stroke="#f59e0b" strokeWidth={2} dot={{ r: 4 }} name="Schedule" />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Radar Chart */}
        <div style={{ background: 'white', borderRadius: 16, padding: 24, border: '1px solid #e2e8f0' }}>
          <h3 style={{ fontSize: '0.9rem', fontWeight: 600, marginBottom: 16 }}>Capability Assessment</h3>
          <ResponsiveContainer width="100%" height={240}>
            <RadarChart data={radarData}>
              <PolarGrid stroke="#e2e8f0" />
              <PolarAngleAxis dataKey="metric" tick={{ fontSize: 10, fill: '#64748b' }} />
              <Radar name="PMO" dataKey="value" stroke="#6366f1" fill="#6366f1" fillOpacity={0.3} strokeWidth={2} />
            </RadarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Benchmarking */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 24 }}>
        <div style={{ background: 'white', borderRadius: 16, padding: 24, border: '1px solid #e2e8f0' }}>
          <h3 style={{ fontSize: '0.9rem', fontWeight: 600, marginBottom: 20, display: 'flex', alignItems: 'center', gap: 8 }}>
            <Award size={18} color="#f59e0b" /> Industry Benchmarking
          </h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={benchmarkData} layout="vertical" barGap={2}>
              <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 10 }} />
              <YAxis type="category" dataKey="metric" tick={{ fontSize: 11 }} width={70} />
              <Tooltip contentStyle={{ borderRadius: 8, border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
              <Bar dataKey="internal" fill="#6366f1" name="Our PMO" radius={[0, 4, 4, 0]} />
              <Bar dataKey="industry" fill="#cbd5e1" name="Industry Avg" radius={[0, 4, 4, 0]} />
              <Bar dataKey="topQuartile" fill="#10b981" name="Top Quartile" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Maturity Levels */}
        <div style={{ background: 'white', borderRadius: 16, padding: 24, border: '1px solid #e2e8f0' }}>
          <h3 style={{ fontSize: '0.9rem', fontWeight: 600, marginBottom: 20, display: 'flex', alignItems: 'center', gap: 8 }}>
            <Target size={18} color="#6366f1" /> PMO Maturity Level
          </h3>
          {['Initial', 'Repeatable', 'Defined', 'Managed', 'Optimizing'].map((level, i) => {
            const isActive = i === 2; // Level 3: Defined
            const isPast = i < 2;
            return (
              <div key={level} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 0', borderBottom: i < 4 ? '1px solid #f1f5f9' : 'none' }}>
                <div style={{ 
                  width: 28, height: 28, borderRadius: '50%', 
                  background: isPast ? '#10b981' : isActive ? '#6366f1' : '#e2e8f0',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: 'white', fontSize: '0.75rem', fontWeight: 600
                }}>{i + 1}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: isActive ? 600 : 400, color: isActive ? '#6366f1' : isPast ? '#10b981' : '#94a3b8' }}>{level}</div>
                </div>
                {isActive && <span style={{ padding: '4px 10px', background: '#eff6ff', color: '#1e40af', borderRadius: 6, fontSize: '0.7rem', fontWeight: 600 }}>CURRENT</span>}
                {isPast && <CheckCircle size={16} color="#10b981" />}
              </div>
            );
          })}
        </div>
      </div>

      {/* AI Recommendations */}
      <div style={{ background: 'white', borderRadius: 16, padding: 24, border: '1px solid #e2e8f0' }}>
        <h3 style={{ fontSize: '0.9rem', fontWeight: 600, marginBottom: 20, display: 'flex', alignItems: 'center', gap: 8 }}>
          <Zap size={18} color="#f59e0b" /> AI Improvement Recommendations
        </h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 16 }}>
          {[
            { title: 'Schedule Adherence Gap', desc: 'Adopt Agile for 3 waterfall projects with consistent delays. Predicted improvement: +8%', priority: 'high', impact: 'High Impact' },
            { title: 'Budget Forecasting', desc: 'Implement bi-weekly budget reviews for projects >$1M. Current accuracy can improve by 12%', priority: 'medium', impact: 'Medium Impact' },
            { title: 'Path to Level 4', desc: 'Focus on quantitative process management. Target: Q3 2026 for "Managed" maturity level', priority: 'info', impact: 'Strategic' },
            { title: 'Top Quartile Gap', desc: 'Quality metrics already top-quartile. Maintain current QA processes and documentation standards', priority: 'success', impact: 'Maintain' },
          ].map((rec, i) => (
            <div key={i} style={{ padding: 20, borderRadius: 12, background: rec.priority === 'high' ? '#fef2f2' : rec.priority === 'medium' ? '#fffbeb' : rec.priority === 'success' ? '#f0fdf4' : '#f0f9ff', border: `1px solid ${rec.priority === 'high' ? '#fecaca' : rec.priority === 'medium' ? '#fde68a' : rec.priority === 'success' ? '#bbf7d0' : '#bae6fd'}` }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>{rec.title}</div>
                <span style={{ padding: '2px 8px', background: 'rgba(0,0,0,0.05)', borderRadius: 4, fontSize: '0.65rem', fontWeight: 600 }}>{rec.impact}</span>
              </div>
              <div style={{ fontSize: '0.85rem', color: '#64748b', lineHeight: 1.5 }}>{rec.desc}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
