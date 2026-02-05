import { useState, useEffect } from 'react';
import { AlertTriangle, TrendingUp, TrendingDown, Minus, Brain, Shield, Zap, Activity, History, BookOpen } from 'lucide-react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, ScatterChart, Scatter, XAxis, YAxis, ZAxis, AreaChart, Area, BarChart, Bar } from 'recharts';

const API = 'http://localhost:3001/api';

export default function RiskManagement() {
  const [riskData, setRiskData] = useState(null);
  const [aiAnalysis, setAiAnalysis] = useState(null);
  const [selectedRisk, setSelectedRisk] = useState(null);

  useEffect(() => {
    fetch(`${API}/risks`).then(r => r.json()).then(setRiskData);
    fetch(`${API}/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: 'Analyze all risks and give me a 2-sentence executive summary with the most critical action needed' })
    }).then(r => r.json()).then(data => setAiAnalysis(data.response));
  }, []);

  if (!riskData) return <div style={{ padding: 40, textAlign: 'center' }}><Activity size={32} style={{ animation: 'spin 1s linear infinite' }} /> Loading risk data...</div>;

  const categoryData = Object.entries(riskData.byCategory).map(([name, value]) => ({
    name, value, color: {
      Resource: '#6366f1', Scope: '#f59e0b', Financial: '#ef4444', Technical: '#8b5cf6', Schedule: '#10b981'
    }[name]
  }));

  const riskMatrix = riskData.risks.map(r => ({
    x: r.probability, y: r.impact, z: r.score, name: r.title, project: r.projectName
  }));

  const trendData = [
    { month: 'Aug', score: 48 }, { month: 'Sep', score: 52 }, { month: 'Oct', score: 49 },
    { month: 'Nov', score: 55 }, { month: 'Dec', score: 58 }, { month: 'Jan', score: riskData.summary.avgScore }
  ];

  const TrendIcon = ({ trend }) => {
    if (trend === 'increasing') return <TrendingUp size={16} color="#ef4444" />;
    if (trend === 'decreasing') return <TrendingDown size={16} color="#10b981" />;
    return <Minus size={16} color="#f59e0b" />;
  };

  const criticalRisks = riskData.risks.filter(r => r.status === 'Critical');
  const increasingRisks = riskData.risks.filter(r => r.trend === 'increasing');

  return (
    <div>
      <div className="page-header">
        <h1>Risk Management Center</h1>
        <p>AI-powered predictive risk identification with Monte Carlo simulation and historical pattern matching</p>
      </div>

      {/* KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 16, marginBottom: 24 }}>
        {[
          { label: 'Total Risks', value: riskData.summary.total, color: '#1e293b', icon: Shield },
          { label: 'Critical', value: riskData.summary.critical, color: '#ef4444', icon: AlertTriangle },
          { label: 'Open', value: riskData.summary.open, color: '#f59e0b', icon: Activity },
          { label: 'Increasing Trend', value: increasingRisks.length, color: '#dc2626', icon: TrendingUp },
          { label: 'Avg Risk Score', value: riskData.summary.avgScore, color: '#6366f1', icon: Zap },
        ].map((stat, i) => (
          <div key={i} style={{ background: 'white', borderRadius: 16, padding: 20, border: '1px solid #e2e8f0', borderTop: `4px solid ${stat.color}` }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
              <stat.icon size={16} color={stat.color} />
              <span style={{ fontSize: '0.7rem', fontWeight: 600, color: '#64748b', textTransform: 'uppercase' }}>{stat.label}</span>
            </div>
            <div style={{ fontSize: '2rem', fontWeight: 700, color: stat.color }}>{stat.value}</div>
          </div>
        ))}
      </div>

      {/* Charts Row */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 20, marginBottom: 24 }}>
        {/* Risk Matrix */}
        <div style={{ background: 'white', borderRadius: 16, padding: 24, border: '1px solid #e2e8f0' }}>
          <h3 style={{ fontSize: '0.9rem', fontWeight: 600, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
            <Shield size={16} color="#6366f1" /> Risk Matrix
          </h3>
          <ResponsiveContainer width="100%" height={220}>
            <ScatterChart margin={{ top: 10, right: 10, bottom: 10, left: 0 }}>
              <XAxis type="number" dataKey="x" name="Probability" domain={[0, 100]} tick={{ fontSize: 10 }} label={{ value: 'Probability', position: 'bottom', fontSize: 10 }} />
              <YAxis type="number" dataKey="y" name="Impact" domain={[0, 100]} tick={{ fontSize: 10 }} label={{ value: 'Impact', angle: -90, position: 'left', fontSize: 10 }} />
              <ZAxis type="number" dataKey="z" range={[50, 400]} />
              <Tooltip content={({ payload }) => payload?.[0] ? (
                <div style={{ background: 'white', padding: 10, borderRadius: 8, boxShadow: '0 4px 12px rgba(0,0,0,0.1)', fontSize: '0.8rem' }}>
                  <div style={{ fontWeight: 600 }}>{payload[0].payload.name}</div>
                  <div style={{ color: '#64748b' }}>{payload[0].payload.project}</div>
                  <div>Score: {payload[0].payload.z}</div>
                </div>
              ) : null} />
              <Scatter data={riskMatrix} fill="#ef4444" />
            </ScatterChart>
          </ResponsiveContainer>
        </div>

        {/* Category Distribution */}
        <div style={{ background: 'white', borderRadius: 16, padding: 24, border: '1px solid #e2e8f0' }}>
          <h3 style={{ fontSize: '0.9rem', fontWeight: 600, marginBottom: 16 }}>By Category</h3>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie data={categoryData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={3} dataKey="value">
                {categoryData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
          <div style={{ display: 'flex', justifyContent: 'center', gap: 12, flexWrap: 'wrap', marginTop: 8 }}>
            {categoryData.map((c, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: '0.7rem' }}>
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: c.color }} />
                <span>{c.name}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Risk Trend */}
        <div style={{ background: 'white', borderRadius: 16, padding: 24, border: '1px solid #e2e8f0' }}>
          <h3 style={{ fontSize: '0.9rem', fontWeight: 600, marginBottom: 16 }}>Risk Score Trend</h3>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={trendData}>
              <defs>
                <linearGradient id="riskGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <XAxis dataKey="month" tick={{ fontSize: 10 }} />
              <YAxis domain={[40, 70]} tick={{ fontSize: 10 }} />
              <Tooltip />
              <Area type="monotone" dataKey="score" stroke="#ef4444" fill="url(#riskGradient)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Critical Risks with AI Analysis */}
      <div style={{ background: 'white', borderRadius: 16, padding: 24, border: '1px solid #e2e8f0', marginBottom: 24 }}>
        <h3 style={{ fontSize: '0.9rem', fontWeight: 600, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
          <AlertTriangle size={16} color="#ef4444" /> Critical Risks - AI-Powered Analysis ({criticalRisks.length})
        </h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 16 }}>
          {criticalRisks.map(risk => (
            <div key={risk.id} style={{ padding: 20, background: '#fef2f2', borderRadius: 12, border: '1px solid #fecaca' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                <div>
                  <div style={{ fontWeight: 600, fontSize: '1rem', color: '#991b1b', marginBottom: 4 }}>{risk.title}</div>
                  <div style={{ fontSize: '0.8rem', color: '#7f1d1d' }}>{risk.projectName} | {risk.category}</div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <TrendIcon trend={risk.trend} />
                  <span style={{ padding: '4px 10px', background: '#dc2626', color: 'white', borderRadius: 6, fontSize: '0.75rem', fontWeight: 600 }}>
                    Score: {risk.score}
                  </span>
                </div>
              </div>

              {/* AI Analysis Section */}
              {risk.aiAnalysis && (
                <div style={{ marginTop: 12 }}>
                  {/* Pattern Match */}
                  <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
                    <span style={{ padding: '3px 8px', background: '#6366f1', color: 'white', borderRadius: 4, fontSize: '0.65rem', fontWeight: 600 }}>
                      Pattern: {risk.aiAnalysis.patternName}
                    </span>
                    <span style={{ padding: '3px 8px', background: '#059669', color: 'white', borderRadius: 4, fontSize: '0.65rem', fontWeight: 600 }}>
                      {risk.aiAnalysis.confidence}% Confidence
                    </span>
                  </div>

                  {/* AI Recommended Mitigation */}
                  <div style={{ padding: 12, background: 'white', borderRadius: 8, borderLeft: '3px solid #6366f1', marginBottom: 10 }}>
                    <div style={{ fontSize: '0.75rem', fontWeight: 600, color: '#6366f1', marginBottom: 4 }}>AI Recommended Mitigation</div>
                    <div style={{ fontSize: '0.85rem', fontWeight: 600, color: '#1e293b', marginBottom: 4 }}>{risk.aiAnalysis.recommendedMitigation.primary}</div>
                    <div style={{ fontSize: '0.8rem', color: '#64748b' }}>{risk.aiAnalysis.recommendedMitigation.reasoning}</div>
                    <div style={{ display: 'flex', gap: 12, marginTop: 8 }}>
                      <span style={{ fontSize: '0.75rem', color: '#059669' }}>Success Rate: {risk.aiAnalysis.recommendedMitigation.successRate}%</span>
                      <span style={{ fontSize: '0.75rem', color: '#6366f1' }}>Recovery: {risk.aiAnalysis.recommendedMitigation.estimatedRecovery}</span>
                    </div>
                  </div>

                  {/* Monte Carlo Outcomes */}
                  {risk.aiAnalysis.monteCarloOutcomes && (
                    <div style={{ background: '#1e293b', borderRadius: 8, padding: 12, color: 'white' }}>
                      <div style={{ fontSize: '0.7rem', fontWeight: 600, opacity: 0.8, marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
                        <History size={12} /> Monte Carlo Simulation
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                        <div>
                          <div style={{ fontSize: '0.65rem', opacity: 0.7 }}>Without Action</div>
                          <div style={{ fontSize: '1rem', fontWeight: 700, color: '#ef4444' }}>{risk.aiAnalysis.monteCarloOutcomes.noAction.escalationProb}%</div>
                          <div style={{ fontSize: '0.7rem', opacity: 0.8 }}>{risk.aiAnalysis.monteCarloOutcomes.noAction.impactRange}</div>
                        </div>
                        <div>
                          <div style={{ fontSize: '0.65rem', opacity: 0.7 }}>With Mitigation</div>
                          <div style={{ fontSize: '1rem', fontWeight: 700, color: '#10b981' }}>{risk.aiAnalysis.monteCarloOutcomes.withMitigation.escalationProb}%</div>
                          <div style={{ fontSize: '0.7rem', opacity: 0.8 }}>{risk.aiAnalysis.monteCarloOutcomes.withMitigation.impactRange}</div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              <div style={{ marginTop: 10, fontSize: '0.75rem', color: '#991b1b' }}>
                Predicted escalation: {risk.predictedDate}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Full Risk Register with AI Insights */}
      <div style={{ background: 'white', borderRadius: 16, border: '1px solid #e2e8f0', overflow: 'hidden', marginBottom: 24 }}>
        <div style={{ padding: '16px 24px', borderBottom: '1px solid #e2e8f0', background: '#f8fafc', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 style={{ fontSize: '0.9rem', fontWeight: 600, margin: 0 }}>Complete Risk Register with AI Analysis</h3>
          <span style={{ padding: '4px 10px', background: '#6366f1', color: 'white', borderRadius: 6, fontSize: '0.7rem', fontWeight: 600 }}>
            <BookOpen size={12} style={{ display: 'inline', marginRight: 4 }} /> Historical Pattern Matching
          </span>
        </div>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: '#f8fafc' }}>
              {['Risk', 'Project', 'Category', 'Score', 'AI Pattern', 'Mitigation Success', 'Trend', 'Status'].map(h => (
                <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontSize: '0.7rem', fontWeight: 600, color: '#64748b', textTransform: 'uppercase' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {riskData.risks.sort((a, b) => b.score - a.score).map(risk => (
              <tr key={risk.id} style={{ borderBottom: '1px solid #f1f5f9', cursor: 'pointer' }} onClick={() => setSelectedRisk(selectedRisk === risk.id ? null : risk.id)}>
                <td style={{ padding: '14px 16px' }}>
                  <div style={{ fontWeight: 600, marginBottom: 2 }}>{risk.title}</div>
                  <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{risk.description}</div>
                </td>
                <td style={{ padding: '14px 16px', fontSize: '0.85rem' }}>{risk.projectName}</td>
                <td style={{ padding: '14px 16px' }}>
                  <span style={{ padding: '4px 10px', background: '#eff6ff', color: '#1e40af', borderRadius: 6, fontSize: '0.75rem', fontWeight: 500 }}>{risk.category}</span>
                </td>
                <td style={{ padding: '14px 16px' }}>
                  <span style={{ padding: '4px 10px', borderRadius: 6, fontSize: '0.8rem', fontWeight: 600,
                    background: risk.score > 60 ? '#fef2f2' : risk.score > 40 ? '#fffbeb' : '#f0fdf4',
                    color: risk.score > 60 ? '#991b1b' : risk.score > 40 ? '#92400e' : '#166534'
                  }}>{risk.score}</span>
                </td>
                <td style={{ padding: '14px 16px' }}>
                  {risk.aiAnalysis && (
                    <span style={{ padding: '4px 10px', background: '#f0f9ff', color: '#0369a1', borderRadius: 6, fontSize: '0.7rem', fontWeight: 500 }}>
                      {risk.aiAnalysis.patternName.replace(' Pattern', '')}
                    </span>
                  )}
                </td>
                <td style={{ padding: '14px 16px' }}>
                  {risk.aiAnalysis && (
                    <span style={{ padding: '4px 10px', background: '#f0fdf4', color: '#166534', borderRadius: 6, fontSize: '0.75rem', fontWeight: 600 }}>
                      {risk.aiAnalysis.recommendedMitigation.successRate}%
                    </span>
                  )}
                </td>
                <td style={{ padding: '14px 16px' }}><TrendIcon trend={risk.trend} /></td>
                <td style={{ padding: '14px 16px' }}>
                  <span style={{ padding: '6px 12px', borderRadius: 8, fontSize: '0.75rem', fontWeight: 600,
                    background: risk.status === 'Critical' ? '#fee2e2' : risk.status === 'Open' ? '#fef3c7' : '#dbeafe',
                    color: risk.status === 'Critical' ? '#991b1b' : risk.status === 'Open' ? '#92400e' : '#1e40af'
                  }}>{risk.status}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* AI Analysis Banner - at bottom */}
      {aiAnalysis && (
        <div style={{ background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)', borderRadius: 16, padding: '20px 24px', color: 'white', display: 'flex', alignItems: 'flex-start', gap: 16 }}>
          <div style={{ width: 44, height: 44, borderRadius: 12, background: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <Brain size={22} />
          </div>
          <div>
            <div style={{ fontSize: '0.75rem', fontWeight: 600, opacity: 0.9, marginBottom: 6, textTransform: 'uppercase' }}>AI Risk Analysis</div>
            <div style={{ fontSize: '0.95rem', lineHeight: 1.6, opacity: 0.95, whiteSpace: 'pre-line' }}>{aiAnalysis}</div>
          </div>
        </div>
      )}

      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
