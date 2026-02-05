import { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, RadarChart, Radar, PolarGrid, PolarAngleAxis, LineChart, Line } from 'recharts';
import { Award, TrendingUp, TrendingDown, Users, Star, Target, Brain, Activity } from 'lucide-react';
import { API, authFetch } from '../utils/authFetch';

export default function PMScoring() {
  const [pmData, setPmData] = useState(null);
  const [selectedPM, setSelectedPM] = useState(null);
  const [aiInsight, setAiInsight] = useState(null);

  useEffect(() => {
    authFetch(`${API}/pm-scores`).then(r => r.json()).then(data => {
      setPmData(data);
      if (data.projectManagers?.length > 0) setSelectedPM(data.projectManagers[0]);
    });
    authFetch(`${API}/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: 'Analyze PM performance data and identify top performer strengths and areas for team-wide improvement' })
    }).then(r => r.json()).then(data => setAiInsight(data.response));
  }, []);

  if (!pmData) return <div style={{ padding: 40, textAlign: 'center' }}><Activity size={32} style={{ animation: 'spin 1s linear infinite' }} /> Loading PM data...</div>;

  const metrics = ['delivery', 'budget', 'riskResolution', 'stakeholderSatisfaction', 'documentation'];
  const metricLabels = { delivery: 'Delivery', budget: 'Budget', riskResolution: 'Risk Mgmt', stakeholderSatisfaction: 'Stakeholder', documentation: 'Documentation' };

  const getRadarData = (pm) => metrics.map(m => ({ metric: metricLabels[m], value: pm.scores[m], fullMark: 100 }));

  const trendData = [
    { month: 'Aug', score: 80 }, { month: 'Sep', score: 82 }, { month: 'Oct', score: 81 },
    { month: 'Nov', score: 83 }, { month: 'Dec', score: 84 }, { month: 'Jan', score: pmData.avgScore }
  ];

  const rankColors = ['#fbbf24', '#94a3b8', '#b45309'];

  return (
    <div>
      <div className="page-header">
        <h1>PM Performance Scoring</h1>
        <p>AI-driven objective performance metrics with multi-dimensional scoring</p>
      </div>

      {/* Summary Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 24 }}>
        {[
          { label: 'Project Managers', value: pmData.projectManagers.length, icon: Users, color: '#6366f1' },
          { label: 'Team Average', value: `${pmData.avgScore}%`, icon: Target, color: '#10b981' },
          { label: 'Top Performer', value: pmData.topPerformer.name.split(' ')[0], icon: Award, color: '#fbbf24' },
          { label: 'Needs Support', value: pmData.needsSupport.length, icon: TrendingDown, color: '#ef4444' },
        ].map((stat, i) => (
          <div key={i} style={{ background: 'white', borderRadius: 16, padding: 20, border: '1px solid #e2e8f0', borderTop: `4px solid ${stat.color}` }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
              <stat.icon size={18} color={stat.color} />
              <span style={{ fontSize: '0.7rem', fontWeight: 600, color: '#64748b', textTransform: 'uppercase' }}>{stat.label}</span>
            </div>
            <div style={{ fontSize: '1.75rem', fontWeight: 700, color: stat.color }}>{stat.value}</div>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 400px', gap: 24 }}>
        {/* Main Content */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* Leaderboard */}
          <div style={{ background: 'white', borderRadius: 16, padding: 24, border: '1px solid #e2e8f0' }}>
            <h3 style={{ fontSize: '0.9rem', fontWeight: 600, marginBottom: 20, display: 'flex', alignItems: 'center', gap: 8 }}>
              <Award size={18} color="#fbbf24" /> Performance Leaderboard
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {pmData.projectManagers.map((pm, i) => (
                <div key={pm.id} onClick={() => setSelectedPM(pm)} style={{
                  display: 'flex', alignItems: 'center', gap: 16, padding: '16px 20px',
                  background: selectedPM?.id === pm.id ? '#eff6ff' : '#f8fafc',
                  border: selectedPM?.id === pm.id ? '2px solid #6366f1' : i === 0 ? '2px solid #fbbf24' : '1px solid #e2e8f0',
                  borderRadius: 12, cursor: 'pointer', transition: 'all 0.2s'
                }}>
                  <div style={{
                    width: 36, height: 36, borderRadius: '50%',
                    background: i < 3 ? rankColors[i] : '#e2e8f0',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontWeight: 700, fontSize: '0.9rem', color: i < 3 ? 'white' : '#64748b'
                  }}>{i + 1}</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 600, marginBottom: 2 }}>{pm.name}</div>
                    <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{pm.certifications.join(', ')}</div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    {pm.trend === 'up' ? <TrendingUp size={16} color="#10b981" /> : pm.trend === 'down' ? <TrendingDown size={16} color="#ef4444" /> : null}
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: '1.5rem', fontWeight: 700, color: pm.overallScore >= 85 ? '#059669' : pm.overallScore >= 75 ? '#d97706' : '#dc2626' }}>
                        {pm.overallScore}
                      </div>
                      <div style={{ fontSize: '0.65rem', color: '#94a3b8' }}>SCORE</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Team Trend */}
          <div style={{ background: 'white', borderRadius: 16, padding: 24, border: '1px solid #e2e8f0' }}>
            <h3 style={{ fontSize: '0.9rem', fontWeight: 600, marginBottom: 16 }}>Team Performance Trend</h3>
            <ResponsiveContainer width="100%" height={180}>
              <LineChart data={trendData}>
                <XAxis dataKey="month" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis domain={[75, 90]} tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip />
                <Line type="monotone" dataKey="score" stroke="#6366f1" strokeWidth={2} dot={{ r: 4, fill: '#6366f1' }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Right Panel - Selected PM Details */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {selectedPM && (
            <>
              {/* PM Card */}
              <div style={{ background: 'white', borderRadius: 16, padding: 24, border: '1px solid #e2e8f0' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 20 }}>
                  <div style={{ width: 56, height: 56, borderRadius: 16, background: 'linear-gradient(135deg, #6366f1, #4f46e5)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: '1.25rem', fontWeight: 700 }}>
                    {selectedPM.name.split(' ').map(n => n[0]).join('')}
                  </div>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: '1.1rem' }}>{selectedPM.name}</div>
                    <div style={{ fontSize: '0.8rem', color: '#64748b' }}>{selectedPM.experience} experience</div>
                  </div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div style={{ padding: 12, background: '#f8fafc', borderRadius: 8 }}>
                    <div style={{ fontSize: '0.65rem', color: '#64748b', textTransform: 'uppercase' }}>Overall Score</div>
                    <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#6366f1' }}>{selectedPM.overallScore}%</div>
                  </div>
                  <div style={{ padding: 12, background: '#f8fafc', borderRadius: 8 }}>
                    <div style={{ fontSize: '0.65rem', color: '#64748b', textTransform: 'uppercase' }}>Active Projects</div>
                    <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#1e293b' }}>{selectedPM.activeProjects}</div>
                  </div>
                  <div style={{ padding: 12, background: '#f8fafc', borderRadius: 8 }}>
                    <div style={{ fontSize: '0.65rem', color: '#64748b', textTransform: 'uppercase' }}>Workload</div>
                    <div style={{ fontSize: '1.5rem', fontWeight: 700, color: selectedPM.workload > 85 ? '#ef4444' : '#10b981' }}>{selectedPM.workload}%</div>
                  </div>
                  <div style={{ padding: 12, background: '#f8fafc', borderRadius: 8 }}>
                    <div style={{ fontSize: '0.65rem', color: '#64748b', textTransform: 'uppercase' }}>Trend</div>
                    <div style={{ fontSize: '1.5rem', fontWeight: 700, color: selectedPM.trend === 'up' ? '#10b981' : '#ef4444', display: 'flex', alignItems: 'center', gap: 4 }}>
                      {selectedPM.trend === 'up' ? <TrendingUp size={20} /> : <TrendingDown size={20} />}
                      {selectedPM.trend}
                    </div>
                  </div>
                </div>
              </div>

              {/* Radar Chart */}
              <div style={{ background: 'white', borderRadius: 16, padding: 24, border: '1px solid #e2e8f0' }}>
                <h3 style={{ fontSize: '0.9rem', fontWeight: 600, marginBottom: 8 }}>Competency Profile</h3>
                <ResponsiveContainer width="100%" height={220}>
                  <RadarChart data={getRadarData(selectedPM)}>
                    <PolarGrid stroke="#e2e8f0" />
                    <PolarAngleAxis dataKey="metric" tick={{ fontSize: 10, fill: '#64748b' }} />
                    <Radar name={selectedPM.name} dataKey="value" stroke="#6366f1" fill="#6366f1" fillOpacity={0.3} strokeWidth={2} />
                  </RadarChart>
                </ResponsiveContainer>
              </div>

              {/* Score Breakdown */}
              <div style={{ background: 'white', borderRadius: 16, padding: 24, border: '1px solid #e2e8f0' }}>
                <h3 style={{ fontSize: '0.9rem', fontWeight: 600, marginBottom: 16 }}>Score Breakdown</h3>
                {metrics.map(m => (
                  <div key={m} style={{ marginBottom: 12 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                      <span style={{ fontSize: '0.8rem', color: '#64748b' }}>{metricLabels[m]}</span>
                      <span style={{ fontSize: '0.8rem', fontWeight: 600, color: selectedPM.scores[m] >= 85 ? '#059669' : selectedPM.scores[m] >= 75 ? '#d97706' : '#dc2626' }}>
                        {selectedPM.scores[m]}%
                      </span>
                    </div>
                    <div style={{ height: 6, background: '#e2e8f0', borderRadius: 3 }}>
                      <div style={{
                        width: `${selectedPM.scores[m]}%`, height: '100%', borderRadius: 3,
                        background: selectedPM.scores[m] >= 85 ? '#10b981' : selectedPM.scores[m] >= 75 ? '#f59e0b' : '#ef4444'
                      }} />
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {/* AI Insight */}
      {aiInsight && (
        <div style={{ background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)', borderRadius: 16, padding: '20px 24px', marginTop: 24, color: 'white', display: 'flex', alignItems: 'center', gap: 16 }}>
          <Brain size={24} />
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: '0.7rem', fontWeight: 600, opacity: 0.8, marginBottom: 4, textTransform: 'uppercase' }}>AI Performance Insight</div>
            <div style={{ fontSize: '0.9rem', lineHeight: 1.5, whiteSpace: 'pre-line' }}>{aiInsight}</div>
          </div>
          <div style={{ padding: '12px 20px', background: 'rgba(255,255,255,0.15)', borderRadius: 12, textAlign: 'center' }}>
            <div style={{ fontSize: '1.75rem', fontWeight: 700 }}>{pmData.avgScore}</div>
            <div style={{ fontSize: '0.7rem', opacity: 0.9 }}>Team Avg</div>
          </div>
        </div>
      )}

      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
