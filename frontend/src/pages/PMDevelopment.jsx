import { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, RadarChart, Radar, PolarGrid, PolarAngleAxis } from 'recharts';
import { Award, TrendingUp, AlertTriangle, BookOpen, Target, Heart, Brain, GraduationCap, Users, Zap, Activity } from 'lucide-react';

const API = 'http://localhost:3001/api';

export default function PMDevelopment() {
  const [pmData, setPmData] = useState(null);
  const [aiInsight, setAiInsight] = useState(null);

  useEffect(() => {
    fetch(`${API}/pm-scores`).then(r => r.json()).then(setPmData);
    fetch(`${API}/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: 'Analyze PM team and recommend top 2 development priorities with specific training suggestions' })
    }).then(r => r.json()).then(data => setAiInsight(data.response));
  }, []);

  if (!pmData) return <div style={{ padding: 40, textAlign: 'center' }}><Activity size={32} style={{ animation: 'spin 1s linear infinite' }} /> Loading...</div>;

  const skillGaps = [
    { pm: 'Fatima Hassan', gaps: ['Risk Management', 'Stakeholder Communication'], priority: 'high', score: 72 },
    { pm: 'Ahmed Khalil', gaps: ['Documentation', 'Budget Forecasting'], priority: 'medium', score: 78 },
  ];

  const trainingRecommendations = [
    { pm: 'Fatima Hassan', course: 'Advanced Risk Management Certification', duration: '4 weeks', impact: 'High', roi: '+15% risk score', provider: 'PMI' },
    { pm: 'Ahmed Khalil', course: 'PMP Documentation Best Practices', duration: '2 weeks', impact: 'Medium', roi: '+10% doc score', provider: 'Coursera' },
    { pm: 'Mohammed Ali', course: 'Leadership Excellence Program', duration: '6 weeks', impact: 'High', roi: 'Succession ready', provider: 'Harvard Online' },
    { pm: 'Sarah Ahmed', course: 'Executive Communication Masterclass', duration: '3 weeks', impact: 'Medium', roi: 'Exec presence', provider: 'LinkedIn Learning' },
  ];

  const attritionRisk = [
    { name: 'Sarah Ahmed', risk: 15, engagement: 92, workload: 85, tenure: '5 years' },
    { name: 'Mohammed Ali', risk: 10, engagement: 88, workload: 60, tenure: '10 years' },
    { name: 'Ahmed Khalil', risk: 25, engagement: 78, workload: 70, tenure: '3 years' },
    { name: 'Fatima Hassan', risk: 45, engagement: 65, workload: 95, tenure: '2 years' },
  ].sort((a, b) => b.risk - a.risk);

  const careerPaths = [
    { pm: 'Sarah Ahmed', current: 'Senior PM', next: 'PMO Director', readiness: 85, timeline: '6-12 months' },
    { pm: 'Mohammed Ali', current: 'Lead PM', next: 'Portfolio Manager', readiness: 75, timeline: '12-18 months' },
  ];

  return (
    <div>
      <div className="page-header">
        <h1>PM Development</h1>
        <p>AI-powered career development, training recommendations, and retention insights</p>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 24 }}>
        {[
          { label: 'Team Size', value: pmData.projectManagers.length, icon: Users, color: '#6366f1' },
          { label: 'Avg Score', value: pmData.avgScore, icon: Target, color: '#10b981' },
          { label: 'Development Needed', value: pmData.needsSupport.length, icon: BookOpen, color: '#f59e0b' },
          { label: 'High Attrition Risk', value: attritionRisk.filter(p => p.risk > 30).length, icon: AlertTriangle, color: '#ef4444' },
        ].map((stat, i) => (
          <div key={i} style={{ background: 'white', borderRadius: 16, padding: 20, border: '1px solid #e2e8f0', borderTop: `4px solid ${stat.color}` }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
              <stat.icon size={18} color={stat.color} />
              <span style={{ fontSize: '0.7rem', fontWeight: 600, color: '#64748b', textTransform: 'uppercase' }}>{stat.label}</span>
            </div>
            <div style={{ fontSize: '2rem', fontWeight: 700, color: stat.color }}>{stat.value}</div>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 24 }}>
        {/* Leaderboard with Career Path */}
        <div style={{ background: 'white', borderRadius: 16, padding: 24, border: '1px solid #e2e8f0' }}>
          <h3 style={{ fontSize: '0.9rem', fontWeight: 600, marginBottom: 20, display: 'flex', alignItems: 'center', gap: 8 }}>
            <Award size={18} color="#fbbf24" /> Rankings & Career Path
          </h3>
          {pmData.projectManagers.map((pm, i) => {
            const careerPath = careerPaths.find(c => c.pm === pm.name);
            return (
              <div key={pm.id} style={{
                display: 'flex', alignItems: 'center', gap: 14, padding: '14px 16px', marginBottom: 10,
                background: i === 0 ? '#fefce8' : '#f8fafc', borderRadius: 10,
                border: i === 0 ? '2px solid #fbbf24' : '1px solid #e2e8f0'
              }}>
                <div style={{
                  width: 32, height: 32, borderRadius: '50%',
                  background: i === 0 ? '#fbbf24' : i === 1 ? '#94a3b8' : i === 2 ? '#b45309' : '#e2e8f0',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontWeight: 700, fontSize: '0.85rem', color: i < 3 ? 'white' : '#64748b'
                }}>{i + 1}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600, marginBottom: 2 }}>{pm.name}</div>
                  <div style={{ fontSize: '0.7rem', color: '#64748b' }}>
                    {pm.certifications.join(', ')}
                    {careerPath && <span style={{ marginLeft: 8, color: '#6366f1' }}>→ {careerPath.next}</span>}
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '1.25rem', fontWeight: 700, color: pm.overallScore >= 85 ? '#059669' : pm.overallScore >= 75 ? '#d97706' : '#dc2626' }}>{pm.overallScore}</div>
                  <div style={{ fontSize: '0.6rem', color: '#94a3b8' }}>SCORE</div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Attrition Risk */}
        <div style={{ background: 'white', borderRadius: 16, padding: 24, border: '1px solid #e2e8f0' }}>
          <h3 style={{ fontSize: '0.9rem', fontWeight: 600, marginBottom: 20, display: 'flex', alignItems: 'center', gap: 8 }}>
            <Heart size={18} color="#ef4444" /> Attrition Risk Analysis
          </h3>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={attritionRisk} layout="vertical">
              <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 10 }} />
              <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} width={90} />
              <Tooltip formatter={(v) => `${v}%`} />
              <Bar dataKey="risk" fill="#ef4444" name="Attrition Risk" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
          <div style={{ marginTop: 16, padding: 14, background: '#fef2f2', borderRadius: 10, border: '1px solid #fecaca' }}>
            <div style={{ fontWeight: 600, fontSize: '0.85rem', color: '#991b1b', marginBottom: 4, display: 'flex', alignItems: 'center', gap: 6 }}>
              <AlertTriangle size={14} /> High Risk Alert
            </div>
            <div style={{ fontSize: '0.8rem', color: '#7f1d1d' }}>
              Fatima Hassan shows 45% attrition risk due to high workload (95%) and declining engagement (65%).
            </div>
          </div>
        </div>
      </div>

      {/* Training Recommendations */}
      <div style={{ background: 'white', borderRadius: 16, padding: 24, border: '1px solid #e2e8f0', marginBottom: 24 }}>
        <h3 style={{ fontSize: '0.9rem', fontWeight: 600, marginBottom: 20, display: 'flex', alignItems: 'center', gap: 8 }}>
          <BookOpen size={18} color="#6366f1" /> AI Training Recommendations
        </h3>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: '#f8fafc' }}>
              {['PM', 'Recommended Course', 'Provider', 'Duration', 'Expected ROI', 'Impact'].map(h => (
                <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontSize: '0.7rem', fontWeight: 600, color: '#64748b', textTransform: 'uppercase' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {trainingRecommendations.map((rec, i) => (
              <tr key={i} style={{ borderBottom: '1px solid #f1f5f9' }}>
                <td style={{ padding: '14px 16px', fontWeight: 500 }}>{rec.pm}</td>
                <td style={{ padding: '14px 16px' }}>{rec.course}</td>
                <td style={{ padding: '14px 16px', fontSize: '0.85rem', color: '#64748b' }}>{rec.provider}</td>
                <td style={{ padding: '14px 16px', fontSize: '0.85rem', color: '#64748b' }}>{rec.duration}</td>
                <td style={{ padding: '14px 16px', fontSize: '0.85rem', color: '#059669', fontWeight: 500 }}>{rec.roi}</td>
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
      <div style={{ background: 'white', borderRadius: 16, padding: 24, border: '1px solid #e2e8f0', marginBottom: 24 }}>
        <h3 style={{ fontSize: '0.9rem', fontWeight: 600, marginBottom: 20, display: 'flex', alignItems: 'center', gap: 8 }}>
          <Zap size={18} color="#f59e0b" /> AI-Suggested Mentorship Pairings
        </h3>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          {[
            { mentor: 'Sarah Ahmed', mentee: 'Fatima Hassan', focus: 'Risk Management & Stakeholder Communication', reason: 'Complementary skill profiles, similar project domains', match: 92 },
            { mentor: 'Mohammed Ali', mentee: 'Ahmed Khalil', focus: 'Documentation & Process Excellence', reason: '10 years experience transfer, leadership development', match: 88 },
          ].map((pair, i) => (
            <div key={i} style={{ padding: 20, background: '#f0fdf4', borderRadius: 12, border: '1px solid #bbf7d0' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ padding: '6px 12px', background: '#dcfce7', borderRadius: 6, fontWeight: 600, fontSize: '0.85rem', color: '#166534' }}>{pair.mentor}</div>
                  <span style={{ color: '#64748b' }}>→</span>
                  <div style={{ padding: '6px 12px', background: 'white', borderRadius: 6, fontWeight: 500, fontSize: '0.85rem', border: '1px solid #e2e8f0' }}>{pair.mentee}</div>
                </div>
                <span style={{ padding: '4px 10px', background: '#10b981', color: 'white', borderRadius: 6, fontSize: '0.75rem', fontWeight: 600 }}>{pair.match}% match</span>
              </div>
              <div style={{ fontSize: '0.85rem', fontWeight: 600, color: '#166534', marginBottom: 4 }}>Focus: {pair.focus}</div>
              <div style={{ fontSize: '0.8rem', color: '#64748b' }}>{pair.reason}</div>
            </div>
          ))}
        </div>
      </div>

      {/* AI Development Insight */}
      {aiInsight && (
        <div style={{ background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)', borderRadius: 16, padding: '20px 24px', color: 'white', display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{ width: 48, height: 48, borderRadius: 12, background: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <GraduationCap size={24} />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: '0.7rem', fontWeight: 600, opacity: 0.85, marginBottom: 4, textTransform: 'uppercase' }}>AI Development Priorities</div>
            <div style={{ fontSize: '0.9rem', lineHeight: 1.6, whiteSpace: 'pre-line' }}>{aiInsight}</div>
          </div>
        </div>
      )}

      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
