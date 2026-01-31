import { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';
import { AlertTriangle, TrendingUp, TrendingDown, DollarSign, Users, Calendar } from 'lucide-react';

const API = 'https://epm-ai-demo-20260201.uc.r.appspot.com/api';

export default function ExecutivePredictions() {
  const [risks, setRisks] = useState(null);
  const [portfolio, setPortfolio] = useState(null);

  useEffect(() => {
    fetch(`${API}/risks`).then(r => r.json()).then(setRisks);
    fetch(`${API}/portfolio`).then(r => r.json()).then(setPortfolio);
  }, []);

  if (!risks || !portfolio) return <div style={{ padding: 40 }}>Loading...</div>;

  const predictions = [
    { 
      type: 'Budget Overrun', 
      probability: 72, 
      impact: '$450K', 
      trend: 'up',
      icon: DollarSign,
      color: '#ef4444',
      desc: 'Predicted budget overrun across 2 projects by Q2'
    },
    { 
      type: 'Talent Shortage', 
      probability: 45, 
      impact: '3 Projects', 
      trend: 'stable',
      icon: Users,
      color: '#f59e0b',
      desc: 'Senior developer shortage likely to affect delivery'
    },
    { 
      type: 'Delivery Delay', 
      probability: 68, 
      impact: '6-8 weeks', 
      trend: 'up',
      icon: Calendar,
      color: '#ef4444',
      desc: 'Customer Portal and ERP likely to miss Q3 deadline'
    },
  ];

  const forecastData = [
    { month: 'Jan', actual: 4.2, predicted: 4.2 },
    { month: 'Feb', actual: 4.5, predicted: 4.4 },
    { month: 'Mar', actual: 4.8, predicted: 4.7 },
    { month: 'Apr', actual: null, predicted: 5.1 },
    { month: 'May', actual: null, predicted: 5.4 },
    { month: 'Jun', actual: null, predicted: 5.8 },
  ];

  const scenarioData = [
    { name: 'Current Path', success: 65, budget: 110, timeline: 95 },
    { name: 'With Mitigation', success: 82, budget: 98, timeline: 102 },
    { name: 'Best Case', success: 90, budget: 95, timeline: 100 },
  ];

  return (
    <div>
      <div className="page-header">
        <h1>Executive Predictions</h1>
        <p>AI-powered forecasting for organizational challenges and strategic risks</p>
      </div>

      {/* Prediction Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 20, marginBottom: 24 }}>
        {predictions.map((pred, i) => (
          <div key={i} style={{ 
            background: 'white', borderRadius: 16, padding: 24, 
            border: '1px solid #e2e8f0', borderLeft: `4px solid ${pred.color}`
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ 
                  width: 40, height: 40, borderRadius: 10, 
                  background: `${pred.color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center' 
                }}>
                  <pred.icon size={20} color={pred.color} />
                </div>
                <span style={{ fontWeight: 600 }}>{pred.type}</span>
              </div>
              {pred.trend === 'up' ? <TrendingUp size={18} color="#ef4444" /> : <TrendingDown size={18} color="#10b981" />}
            </div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 8 }}>
              <span style={{ fontSize: '2rem', fontWeight: 700, color: pred.color }}>{pred.probability}%</span>
              <span style={{ fontSize: '0.85rem', color: '#64748b' }}>probability</span>
            </div>
            <div style={{ fontSize: '0.9rem', color: '#64748b', marginBottom: 12 }}>
              Impact: <strong style={{ color: '#1e293b' }}>{pred.impact}</strong>
            </div>
            <div style={{ fontSize: '0.85rem', color: '#64748b', lineHeight: 1.5 }}>{pred.desc}</div>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, marginBottom: 24 }}>
        {/* Budget Forecast */}
        <div style={{ background: 'white', borderRadius: 16, padding: 24, border: '1px solid #e2e8f0' }}>
          <h3 style={{ fontSize: '0.875rem', fontWeight: 600, marginBottom: 20, color: 'var(--slate-800)' }}>Budget Forecast (Millions)</h3>
          <ResponsiveContainer width="100%" height={250}>
            <AreaChart data={forecastData}>
              <XAxis dataKey="month" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} domain={[4, 6]} />
              <Tooltip formatter={(v) => v ? `$${v}M` : 'N/A'} />
              <Area type="monotone" dataKey="actual" stroke="#6366f1" fill="#6366f1" fillOpacity={0.3} name="Actual" />
              <Area type="monotone" dataKey="predicted" stroke="#f59e0b" fill="#f59e0b" fillOpacity={0.2} strokeDasharray="5 5" name="Predicted" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Scenario Analysis */}
        <div style={{ background: 'white', borderRadius: 16, padding: 24, border: '1px solid #e2e8f0' }}>
          <h3 style={{ fontSize: '0.875rem', fontWeight: 600, marginBottom: 20, color: 'var(--slate-800)' }}>Scenario Analysis</h3>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#f8fafc' }}>
                <th style={{ padding: '10px 12px', textAlign: 'left', fontSize: '0.7rem', color: '#64748b' }}>SCENARIO</th>
                <th style={{ padding: '10px 12px', textAlign: 'center', fontSize: '0.7rem', color: '#64748b' }}>SUCCESS %</th>
                <th style={{ padding: '10px 12px', textAlign: 'center', fontSize: '0.7rem', color: '#64748b' }}>BUDGET %</th>
                <th style={{ padding: '10px 12px', textAlign: 'center', fontSize: '0.7rem', color: '#64748b' }}>TIMELINE %</th>
              </tr>
            </thead>
            <tbody>
              {scenarioData.map((s, i) => (
                <tr key={i} style={{ borderBottom: '1px solid #f1f5f9' }}>
                  <td style={{ padding: '12px', fontWeight: 500 }}>{s.name}</td>
                  <td style={{ padding: '12px', textAlign: 'center' }}>
                    <span style={{ 
                      padding: '4px 10px', borderRadius: 6, fontSize: '0.8rem', fontWeight: 600,
                      background: s.success >= 80 ? '#dcfce7' : s.success >= 70 ? '#fef3c7' : '#fee2e2',
                      color: s.success >= 80 ? '#166534' : s.success >= 70 ? '#92400e' : '#991b1b'
                    }}>{s.success}%</span>
                  </td>
                  <td style={{ padding: '12px', textAlign: 'center', color: s.budget <= 100 ? '#059669' : '#dc2626' }}>{s.budget}%</td>
                  <td style={{ padding: '12px', textAlign: 'center', color: s.timeline <= 100 ? '#059669' : '#dc2626' }}>{s.timeline}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Executive Recommendations */}
      <div style={{ background: 'white', borderRadius: 16, padding: 24, border: '1px solid #e2e8f0' }}>
        <h3 style={{ fontSize: '0.875rem', fontWeight: 600, marginBottom: 20, color: 'var(--slate-800)' }}>AI Strategic Recommendations</h3>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          {[
            { title: 'Immediate Action Required', items: ['Freeze scope on Customer Portal', 'Reallocate 2 developers from Cloud Migration'], urgent: true },
            { title: 'Q2 Strategic Moves', items: ['Accelerate Data Analytics Platform (highest ROI)', 'Begin succession planning for senior PMs'], urgent: false },
          ].map((rec, i) => (
            <div key={i} style={{ 
              padding: 20, borderRadius: 12, 
              background: rec.urgent ? '#fef2f2' : '#f0fdf4',
              border: `1px solid ${rec.urgent ? '#fecaca' : '#bbf7d0'}`
            }}>
              <div style={{ fontWeight: 600, fontSize: '0.95rem', marginBottom: 12, color: rec.urgent ? '#991b1b' : '#166534' }}>
                {rec.title}
              </div>
              <ul style={{ margin: 0, paddingLeft: 20 }}>
                {rec.items.map((item, j) => (
                  <li key={j} style={{ fontSize: '0.85rem', color: '#475569', marginBottom: 6 }}>{item}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
