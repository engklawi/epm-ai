import { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { AlertTriangle, ArrowRight, TrendingUp } from 'lucide-react';

const API = 'http://localhost:3001/api';

export default function StrategicAlignment() {
  const [strategy, setStrategy] = useState(null);
  const [projects, setProjects] = useState([]);

  useEffect(() => {
    fetch(`${API}/strategy`).then(r => r.json()).then(setStrategy);
    fetch(`${API}/projects`).then(r => r.json()).then(setProjects);
  }, []);

  if (!strategy) return <div style={{ padding: 40 }}>Loading...</div>;

  const alignmentData = projects.map(p => ({
    name: p.name.length > 15 ? p.name.substring(0, 15) + '...' : p.name,
    score: p.alignmentScore,
    color: p.alignmentScore >= 90 ? '#10b981' : p.alignmentScore >= 80 ? '#f59e0b' : '#ef4444'
  }));

  const misalignedProjects = projects.filter(p => p.alignmentScore < 85);
  const highValueProjects = projects.filter(p => p.roi > 180 && p.alignmentScore >= 90);

  return (
    <div>
      <div className="page-header">
        <h1>Strategic Alignment</h1>
        <p>Continuously score and realign initiatives with strategic goals</p>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 20, marginBottom: 24 }}>
        {[
          { label: 'Avg Alignment', value: `${strategy.alignmentScore}%`, color: '#10b981' },
          { label: 'High Alignment (≥90%)', value: projects.filter(p => p.alignmentScore >= 90).length, color: '#6366f1' },
          { label: 'Needs Review (<85%)', value: misalignedProjects.length, color: '#f59e0b' },
          { label: 'High Value Projects', value: highValueProjects.length, color: '#8b5cf6' },
        ].map((stat, i) => (
          <div key={i} style={{ 
            background: 'white', borderRadius: 16, padding: 24, 
            border: '1px solid #e2e8f0', borderTop: `4px solid ${stat.color}`
          }}>
            <div style={{ fontSize: '0.75rem', fontWeight: 600, color: '#64748b', textTransform: 'uppercase', marginBottom: 8 }}>
              {stat.label}
            </div>
            <div style={{ fontSize: '2rem', fontWeight: 700, color: stat.color }}>{stat.value}</div>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, marginBottom: 24 }}>
        {/* Alignment Scores */}
        <div style={{ background: 'white', borderRadius: 16, padding: 24, border: '1px solid #e2e8f0' }}>
          <h3 style={{ fontSize: '0.875rem', fontWeight: 600, marginBottom: 20, color: 'var(--slate-800)' }}>Alignment Scores by Project</h3>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={alignmentData} layout="vertical">
              <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 11 }} />
              <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} width={120} />
              <Tooltip formatter={(v) => `${v}%`} />
              <Bar dataKey="score" radius={[0, 4, 4, 0]}>
                {alignmentData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Reprioritization Engine */}
        <div style={{ background: 'white', borderRadius: 16, padding: 24, border: '1px solid #e2e8f0' }}>
          <h3 style={{ fontSize: '0.875rem', fontWeight: 600, marginBottom: 20, color: 'var(--slate-800)' }}>Smart Reprioritization</h3>
          <div style={{ marginBottom: 20 }}>
            <div style={{ fontSize: '0.8rem', color: '#64748b', marginBottom: 12 }}>AI-RECOMMENDED ACTIONS</div>
            {[
              { from: 'Mobile App Revamp', action: 'Increase funding by 15%', reason: '85% alignment, strong ROI potential' },
              { from: 'Customer Portal', action: 'Reduce scope or cancel', reason: 'High risk, budget overrun concerns' },
            ].map((item, i) => (
              <div key={i} style={{ 
                padding: 14, marginBottom: 10, borderRadius: 10, 
                background: '#f8fafc', border: '1px solid #e2e8f0' 
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                  <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>{item.from}</span>
                  <ArrowRight size={14} color="#64748b" />
                  <span style={{ fontSize: '0.85rem', color: '#6366f1', fontWeight: 500 }}>{item.action}</span>
                </div>
                <div style={{ fontSize: '0.8rem', color: '#64748b' }}>{item.reason}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Misaligned Projects */}
      <div style={{ background: 'white', borderRadius: 16, padding: 24, border: '1px solid #e2e8f0' }}>
        <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: 20, display: 'flex', alignItems: 'center', gap: 8 }}>
          <AlertTriangle size={18} color="#f59e0b" /> Projects Requiring Alignment Review
        </h3>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: '#f8fafc' }}>
              <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '0.75rem', color: '#64748b' }}>PROJECT</th>
              <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '0.75rem', color: '#64748b' }}>ALIGNMENT</th>
              <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '0.75rem', color: '#64748b' }}>ROI</th>
              <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '0.75rem', color: '#64748b' }}>RECOMMENDATION</th>
            </tr>
          </thead>
          <tbody>
            {projects.map(p => (
              <tr key={p.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                <td style={{ padding: '14px 16px', fontWeight: 500 }}>{p.name}</td>
                <td style={{ padding: '14px 16px' }}>
                  <span style={{ 
                    padding: '4px 10px', borderRadius: 6, fontSize: '0.8rem', fontWeight: 600,
                    background: p.alignmentScore >= 90 ? '#dcfce7' : p.alignmentScore >= 80 ? '#fef3c7' : '#fee2e2',
                    color: p.alignmentScore >= 90 ? '#166534' : p.alignmentScore >= 80 ? '#92400e' : '#991b1b'
                  }}>
                    {p.alignmentScore}%
                  </span>
                </td>
                <td style={{ padding: '14px 16px', color: '#059669', fontWeight: 600 }}>{p.roi}%</td>
                <td style={{ padding: '14px 16px', fontSize: '0.85rem', color: '#64748b' }}>
                  {p.alignmentScore >= 90 ? 'Maintain current approach' : 
                   p.alignmentScore >= 80 ? 'Review scope alignment' : 'Consider realignment or cancellation'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
