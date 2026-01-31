import { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';
import { TrendingUp, CheckCircle, Clock, DollarSign } from 'lucide-react';

const API = 'https://epm-ai-demo-20260201.uc.r.appspot.com/api';

export default function PMOPerformance() {
  const [portfolio, setPortfolio] = useState(null);

  useEffect(() => {
    fetch(`${API}/portfolio`).then(r => r.json()).then(setPortfolio);
  }, []);

  if (!portfolio) return <div style={{ padding: 40 }}>Loading...</div>;

  const kpiData = [
    { name: 'Delivery Success', value: 78, target: 85, icon: CheckCircle, color: '#10b981' },
    { name: 'Budget Accuracy', value: 72, target: 90, icon: DollarSign, color: '#6366f1' },
    { name: 'Schedule Adherence', value: 68, target: 80, icon: Clock, color: '#f59e0b' },
    { name: 'Compliance', value: 92, target: 95, icon: TrendingUp, color: '#8b5cf6' },
  ];

  const trendData = [
    { month: 'Jul', delivery: 72, budget: 68, schedule: 65 },
    { month: 'Aug', delivery: 74, budget: 70, schedule: 66 },
    { month: 'Sep', delivery: 75, budget: 71, schedule: 68 },
    { month: 'Oct', delivery: 76, budget: 72, schedule: 67 },
    { month: 'Nov', delivery: 77, budget: 71, schedule: 68 },
    { month: 'Dec', delivery: 78, budget: 72, schedule: 68 },
  ];

  const benchmarkData = [
    { metric: 'Delivery', internal: 78, industry: 75 },
    { metric: 'Budget', internal: 72, industry: 70 },
    { metric: 'Schedule', internal: 68, industry: 72 },
    { metric: 'Quality', internal: 85, industry: 80 },
  ];

  return (
    <div>
      <div className="page-header">
        <h1>PMO Performance</h1>
        <p>Monitor and enhance PMO performance with AI-driven insights and benchmarking</p>
      </div>

      {/* KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 20, marginBottom: 24 }}>
        {kpiData.map((kpi, i) => (
          <div key={i} style={{ 
            background: 'white', borderRadius: 16, padding: 24, 
            border: '1px solid #e2e8f0', position: 'relative', overflow: 'hidden'
          }}>
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 4, background: kpi.color }} />
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
              <kpi.icon size={20} color={kpi.color} />
              <span style={{ fontSize: '0.8rem', fontWeight: 600, color: '#64748b' }}>{kpi.name}</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
              <span style={{ fontSize: '2rem', fontWeight: 700, color: kpi.value >= kpi.target ? '#059669' : '#d97706' }}>
                {kpi.value}%
              </span>
              <span style={{ fontSize: '0.85rem', color: '#94a3b8' }}>/ {kpi.target}% target</span>
            </div>
            <div style={{ marginTop: 12, height: 6, background: '#e2e8f0', borderRadius: 3 }}>
              <div style={{ width: `${(kpi.value / kpi.target) * 100}%`, height: '100%', background: kpi.color, borderRadius: 3 }} />
            </div>
          </div>
        ))}
      </div>

      {/* Charts */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, marginBottom: 24 }}>
        <div style={{ background: 'white', borderRadius: 16, padding: 24, border: '1px solid #e2e8f0' }}>
          <h3 style={{ fontSize: '0.875rem', fontWeight: 600, marginBottom: 20, color: 'var(--slate-800)' }}>Performance Trends</h3>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={trendData}>
              <XAxis dataKey="month" tick={{ fontSize: 12 }} />
              <YAxis domain={[60, 85]} tick={{ fontSize: 12 }} />
              <Tooltip />
              <Line type="monotone" dataKey="delivery" stroke="#10b981" strokeWidth={2} dot={{ r: 4 }} name="Delivery" />
              <Line type="monotone" dataKey="budget" stroke="#6366f1" strokeWidth={2} dot={{ r: 4 }} name="Budget" />
              <Line type="monotone" dataKey="schedule" stroke="#f59e0b" strokeWidth={2} dot={{ r: 4 }} name="Schedule" />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div style={{ background: 'white', borderRadius: 16, padding: 24, border: '1px solid #e2e8f0' }}>
          <h3 style={{ fontSize: '0.875rem', fontWeight: 600, marginBottom: 20, color: 'var(--slate-800)' }}>Industry Benchmarking</h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={benchmarkData} layout="vertical">
              <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 12 }} />
              <YAxis type="category" dataKey="metric" tick={{ fontSize: 12 }} width={80} />
              <Tooltip />
              <Bar dataKey="internal" fill="#6366f1" name="Our PMO" radius={[0, 4, 4, 0]} />
              <Bar dataKey="industry" fill="#cbd5e1" name="Industry Avg" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* AI Recommendations */}
      <div style={{ background: 'white', borderRadius: 16, padding: 24, border: '1px solid #e2e8f0' }}>
        <h3 style={{ fontSize: '0.875rem', fontWeight: 600, marginBottom: 20, color: 'var(--slate-800)' }}>AI Process Recommendations</h3>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          {[
            { title: 'Schedule Adherence Gap', desc: 'Consider adopting Agile methodology for 3 waterfall projects showing consistent delays', priority: 'high' },
            { title: 'Budget Accuracy', desc: 'Implement bi-weekly budget reviews for projects >$1M to improve forecasting accuracy', priority: 'medium' },
            { title: 'Delivery Success', desc: 'Current trajectory suggests 85% target achievable by Q2 with current improvement rate', priority: 'info' },
            { title: 'Compliance Score', desc: 'Governance framework compliance is strong. Maintain current review cadence.', priority: 'success' },
          ].map((rec, i) => (
            <div key={i} style={{ 
              padding: 16, borderRadius: 12, 
              background: rec.priority === 'high' ? '#fef2f2' : rec.priority === 'medium' ? '#fffbeb' : rec.priority === 'success' ? '#f0fdf4' : '#f0f9ff',
              border: `1px solid ${rec.priority === 'high' ? '#fecaca' : rec.priority === 'medium' ? '#fde68a' : rec.priority === 'success' ? '#bbf7d0' : '#bae6fd'}`
            }}>
              <div style={{ fontWeight: 600, fontSize: '0.9rem', marginBottom: 6 }}>{rec.title}</div>
              <div style={{ fontSize: '0.85rem', color: '#64748b', lineHeight: 1.5 }}>{rec.desc}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
