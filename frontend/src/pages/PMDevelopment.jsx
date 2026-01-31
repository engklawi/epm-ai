import { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis } from 'recharts';
import { Award, TrendingUp, AlertTriangle, BookOpen, Target, Heart } from 'lucide-react';

const API = 'https://epm-ai-demo-20260201.uc.r.appspot.com/api';

export default function PMDevelopment() {
  const [pmData, setPmData] = useState(null);

  useEffect(() => {
    fetch(`${API}/pm-scores`).then(r => r.json()).then(setPmData);
  }, []);

  if (!pmData) return <div style={{ padding: 40 }}>Loading...</div>;

  const skillGaps = [
    { pm: 'Fatima Hassan', gaps: ['Risk Management', 'Stakeholder Communication'], priority: 'high' },
    { pm: 'Ahmed Khalil', gaps: ['Documentation', 'Budget Forecasting'], priority: 'medium' },
  ];

  const trainingRecommendations = [
    { pm: 'Fatima Hassan', course: 'Advanced Risk Management Certification', duration: '4 weeks', impact: 'High' },
    { pm: 'Ahmed Khalil', course: 'PMP Documentation Best Practices', duration: '2 weeks', impact: 'Medium' },
    { pm: 'Mohammed Ali', course: 'Leadership Excellence Program', duration: '6 weeks', impact: 'High' },
  ];

  const attritionRisk = [
    { name: 'Sarah Ahmed', risk: 15, engagement: 92, workload: 85 },
    { name: 'Mohammed Ali', risk: 10, engagement: 88, workload: 60 },
    { name: 'Ahmed Khalil', risk: 25, engagement: 78, workload: 70 },
    { name: 'Fatima Hassan', risk: 45, engagement: 65, workload: 95 },
  ];

  return (
    <div>
      <div className="page-header">
        <h1>PM Development</h1>
        <p>AI-powered career development, training recommendations, and retention insights</p>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 20, marginBottom: 24 }}>
        {[
          { label: 'Avg Team Score', value: pmData.avgScore, icon: Target, color: '#10b981' },
          { label: 'Top Performers', value: pmData.projectManagers.filter(p => p.overallScore >= 85).length, icon: Award, color: '#6366f1' },
          { label: 'Development Needed', value: pmData.needsSupport.length, icon: BookOpen, color: '#f59e0b' },
          { label: 'High Attrition Risk', value: attritionRisk.filter(p => p.risk > 30).length, icon: AlertTriangle, color: '#ef4444' },
        ].map((stat, i) => (
          <div key={i} style={{ 
            background: 'white', borderRadius: 16, padding: 24, 
            border: '1px solid #e2e8f0', borderTop: `4px solid ${stat.color}`
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
              <stat.icon size={18} color={stat.color} />
              <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#64748b', textTransform: 'uppercase' }}>{stat.label}</span>
            </div>
            <div style={{ fontSize: '2rem', fontWeight: 700, color: stat.color }}>{stat.value}</div>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, marginBottom: 24 }}>
        {/* Leaderboard */}
        <div style={{ background: 'white', borderRadius: 16, padding: 24, border: '1px solid #e2e8f0' }}>
          <h3 style={{ fontSize: '0.875rem', fontWeight: 600, marginBottom: 20, color: 'var(--slate-800)' }}>PM Rankings & Career Path</h3>
          {pmData.projectManagers.map((pm, i) => (
            <div key={pm.id} style={{ 
              display: 'flex', alignItems: 'center', gap: 16, padding: '14px 16px', 
              marginBottom: 10, background: '#f8fafc', borderRadius: 10,
              border: i === 0 ? '2px solid #fbbf24' : '1px solid #e2e8f0'
            }}>
              <div style={{ 
                width: 32, height: 32, borderRadius: '50%', 
                background: i === 0 ? '#fbbf24' : i === 1 ? '#9ca3af' : i === 2 ? '#b45309' : '#e2e8f0',
                display: 'flex', alignItems: 'center', justifyContent: 'center', 
                fontWeight: 700, fontSize: '0.85rem', color: i < 3 ? 'white' : '#64748b'
              }}>
                {i + 1}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 600 }}>{pm.name}</div>
                <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{pm.certifications.join(', ')}</div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ 
                  fontSize: '1.25rem', fontWeight: 700, 
                  color: pm.overallScore >= 85 ? '#059669' : pm.overallScore >= 75 ? '#d97706' : '#dc2626' 
                }}>
                  {pm.overallScore}
                </div>
                <div style={{ fontSize: '0.7rem', color: '#64748b' }}>SCORE</div>
              </div>
            </div>
          ))}
        </div>

        {/* Attrition Risk */}
        <div style={{ background: 'white', borderRadius: 16, padding: 24, border: '1px solid #e2e8f0' }}>
          <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: 20, display: 'flex', alignItems: 'center', gap: 8 }}>
            <Heart size={18} color="#ef4444" /> Attrition Risk Analysis
          </h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={attritionRisk} layout="vertical">
              <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 11 }} />
              <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} width={100} />
              <Tooltip formatter={(v) => `${v}%`} />
              <Bar dataKey="risk" fill="#ef4444" name="Attrition Risk" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
          <div style={{ marginTop: 16, padding: 14, background: '#fef2f2', borderRadius: 10, border: '1px solid #fecaca' }}>
            <div style={{ fontWeight: 600, fontSize: '0.85rem', color: '#991b1b', marginBottom: 4 }}>⚠️ High Risk Alert</div>
            <div style={{ fontSize: '0.8rem', color: '#7f1d1d' }}>
              Fatima Hassan shows 45% attrition risk due to high workload (95%) and declining engagement.
            </div>
          </div>
        </div>
      </div>

      {/* Training Recommendations */}
      <div style={{ background: 'white', borderRadius: 16, padding: 24, border: '1px solid #e2e8f0', marginBottom: 24 }}>
        <h3 style={{ fontSize: '0.875rem', fontWeight: 600, marginBottom: 20, color: 'var(--slate-800)' }}>AI Training Recommendations</h3>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: '#f8fafc' }}>
              <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '0.7rem', color: '#64748b' }}>PROJECT MANAGER</th>
              <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '0.7rem', color: '#64748b' }}>RECOMMENDED COURSE</th>
              <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '0.7rem', color: '#64748b' }}>DURATION</th>
              <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '0.7rem', color: '#64748b' }}>EXPECTED IMPACT</th>
            </tr>
          </thead>
          <tbody>
            {trainingRecommendations.map((rec, i) => (
              <tr key={i} style={{ borderBottom: '1px solid #f1f5f9' }}>
                <td style={{ padding: '14px 16px', fontWeight: 500 }}>{rec.pm}</td>
                <td style={{ padding: '14px 16px' }}>{rec.course}</td>
                <td style={{ padding: '14px 16px', color: '#64748b' }}>{rec.duration}</td>
                <td style={{ padding: '14px 16px' }}>
                  <span style={{ 
                    padding: '4px 10px', borderRadius: 6, fontSize: '0.75rem', fontWeight: 600,
                    background: rec.impact === 'High' ? '#dcfce7' : '#fef3c7',
                    color: rec.impact === 'High' ? '#166534' : '#92400e'
                  }}>{rec.impact}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mentorship Pairings */}
      <div style={{ background: 'white', borderRadius: 16, padding: 24, border: '1px solid #e2e8f0' }}>
        <h3 style={{ fontSize: '0.875rem', fontWeight: 600, marginBottom: 20, color: 'var(--slate-800)' }}>AI-Suggested Mentorship Pairings</h3>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          {[
            { mentor: 'Sarah Ahmed', mentee: 'Fatima Hassan', focus: 'Risk Management & Stakeholder Communication', reason: 'Complementary skill profiles, similar project domains' },
            { mentor: 'Mohammed Ali', mentee: 'Ahmed Khalil', focus: 'Documentation & Process Excellence', reason: '10 years experience transfer, leadership development' },
          ].map((pair, i) => (
            <div key={i} style={{ padding: 20, background: '#f0fdf4', borderRadius: 12, border: '1px solid #bbf7d0' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                <div style={{ padding: '6px 12px', background: '#dcfce7', borderRadius: 6, fontWeight: 600, fontSize: '0.85rem', color: '#166534' }}>
                  {pair.mentor}
                </div>
                <span style={{ color: '#64748b' }}>→</span>
                <div style={{ padding: '6px 12px', background: 'white', borderRadius: 6, fontWeight: 500, fontSize: '0.85rem', border: '1px solid #e2e8f0' }}>
                  {pair.mentee}
                </div>
              </div>
              <div style={{ fontSize: '0.85rem', fontWeight: 600, color: '#166534', marginBottom: 4 }}>Focus: {pair.focus}</div>
              <div style={{ fontSize: '0.8rem', color: '#64748b' }}>{pair.reason}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
