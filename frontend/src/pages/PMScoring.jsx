import { useState, useEffect } from 'react';
import { TrendingUp, TrendingDown, Minus, Award, AlertCircle } from 'lucide-react';
import { RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip } from 'recharts';

const API = 'https://epm-ai-demo-20260201.uc.r.appspot.com/api';

export default function PMScoring() {
  const [data, setData] = useState(null);
  const [selectedPM, setSelectedPM] = useState(null);

  useEffect(() => {
    fetch(`${API}/pm-scores`).then(r => r.json()).then(d => {
      setData(d);
      setSelectedPM(d.projectManagers[0]);
    });
  }, []);

  if (!data) return <div>Loading...</div>;

  const TrendIcon = ({ trend }) => {
    if (trend === 'up') return <TrendingUp size={16} className="health-green" />;
    if (trend === 'down') return <TrendingDown size={16} className="health-red" />;
    return <Minus size={16} className="health-yellow" />;
  };

  const getScoreClass = (score) => {
    if (score >= 85) return 'high';
    if (score >= 70) return 'medium';
    return 'low';
  };

  const radarData = selectedPM ? [
    { metric: 'Delivery', score: selectedPM.scores.delivery },
    { metric: 'Budget', score: selectedPM.scores.budget },
    { metric: 'Risk Mgmt', score: selectedPM.scores.riskResolution },
    { metric: 'Stakeholder', score: selectedPM.scores.stakeholderSatisfaction },
    { metric: 'Documentation', score: selectedPM.scores.documentation },
  ] : [];

  const comparisonData = data.projectManagers.map(pm => ({
    name: pm.name.split(' ')[0],
    score: pm.overallScore
  }));

  return (
    <div>
      <div className="page-header">
        <h1>👥 UC9: PM Performance Scoring</h1>
        <p>AI-driven evaluation using balanced scorecard approach and multi-dimensional KPIs</p>
      </div>

      <div className="grid-4 gap-20 mb-20">
        <div className="card stat">
          <div className="value">{data.projectManagers.length}</div>
          <div className="label">Project Managers</div>
        </div>
        <div className="card stat">
          <div className="value health-green">{data.avgScore}</div>
          <div className="label">Avg Score</div>
        </div>
        <div className="card stat">
          <div className="value">
            <Award size={24} className="health-green" />
          </div>
          <div className="label">Top: {data.topPerformer.name}</div>
        </div>
        <div className="card stat">
          <div className="value health-red">{data.needsSupport.length}</div>
          <div className="label">Needs Support</div>
        </div>
      </div>

      <div className="grid-2 gap-20">
        <div className="card">
          <h3>🏆 PM Leaderboard</h3>
          <table>
            <thead>
              <tr>
                <th>Rank</th>
                <th>Name</th>
                <th>Score</th>
                <th>Trend</th>
                <th>Workload</th>
                <th>Projects</th>
              </tr>
            </thead>
            <tbody>
              {data.projectManagers.map((pm, i) => (
                <tr 
                  key={pm.id} 
                  onClick={() => setSelectedPM(pm)}
                  style={{ cursor: 'pointer', background: selectedPM?.id === pm.id ? '#f1f5f9' : 'transparent' }}
                >
                  <td>
                    <span style={{ 
                      display: 'inline-flex', 
                      alignItems: 'center', 
                      justifyContent: 'center',
                      width: 28, 
                      height: 28, 
                      borderRadius: '50%', 
                      background: i === 0 ? '#ffd700' : i === 1 ? '#c0c0c0' : i === 2 ? '#cd7f32' : '#e5e7eb',
                      fontWeight: 600,
                      fontSize: '0.85rem'
                    }}>
                      {i + 1}
                    </span>
                  </td>
                  <td>
                    <strong>{pm.name}</strong>
                    <div style={{ fontSize: '0.8rem', color: '#64748b' }}>{pm.certifications.join(', ')}</div>
                  </td>
                  <td>
                    <div className={`score-circle ${getScoreClass(pm.overallScore)}`} style={{ width: 45, height: 45, fontSize: '1rem' }}>
                      {pm.overallScore}
                    </div>
                  </td>
                  <td><TrendIcon trend={pm.trend} /></td>
                  <td>
                    <div className="flex flex-center gap-10">
                      <div className="progress-bar" style={{ width: 60 }}>
                        <div className={`fill ${pm.workload > 80 ? 'red' : pm.workload > 60 ? 'yellow' : 'green'}`} 
                          style={{ width: `${pm.workload}%` }} />
                      </div>
                      <span style={{ fontSize: '0.85rem' }}>{pm.workload}%</span>
                    </div>
                  </td>
                  <td>{pm.activeProjects} active / {pm.completedProjects} done</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div>
          {selectedPM && (
            <div className="card">
              <h3>📊 {selectedPM.name} - Detailed Scores</h3>
              <ResponsiveContainer width="100%" height={280}>
                <RadarChart data={radarData}>
                  <PolarGrid />
                  <PolarAngleAxis dataKey="metric" />
                  <PolarRadiusAxis domain={[0, 100]} />
                  <Radar name="Score" dataKey="score" stroke="#6366f1" fill="#6366f1" fillOpacity={0.5} />
                </RadarChart>
              </ResponsiveContainer>
              
              <div className="grid-2 gap-10 mt-20">
                {Object.entries(selectedPM.scores).map(([key, value]) => (
                  <div key={key} style={{ padding: 10, background: '#f8fafc', borderRadius: 6 }}>
                    <div className="flex flex-between">
                      <span style={{ textTransform: 'capitalize' }}>{key.replace(/([A-Z])/g, ' $1')}</span>
                      <strong className={`health-${value >= 85 ? 'green' : value >= 70 ? 'yellow' : 'red'}`}>{value}</strong>
                    </div>
                    <div className="progress-bar" style={{ marginTop: 5 }}>
                      <div className={`fill ${value >= 85 ? 'green' : value >= 70 ? 'yellow' : 'red'}`} 
                        style={{ width: `${value}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="grid-2 gap-20 mt-20">
        <div className="card">
          <h3>📈 Score Comparison</h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={comparisonData}>
              <XAxis dataKey="name" />
              <YAxis domain={[0, 100]} />
              <Tooltip />
              <Bar dataKey="score" fill="#6366f1" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="card">
          <h3>⚠️ Needs Support</h3>
          {data.needsSupport.length > 0 ? (
            data.needsSupport.map(pm => (
              <div key={pm.id} className="alert warning">
                <AlertCircle size={20} />
                <div style={{ flex: 1 }}>
                  <strong>{pm.name}</strong>
                  <div style={{ fontSize: '0.85rem' }}>
                    Score: {pm.overallScore} | Trend: {pm.trend} | Workload: {pm.workload}%
                  </div>
                </div>
              </div>
            ))
          ) : (
            <p style={{ color: '#64748b', textAlign: 'center', padding: 20 }}>
              ✅ All PMs are performing well
            </p>
          )}
          
          <div style={{ marginTop: 20, padding: 15, background: '#f0fdf4', borderRadius: 8, borderLeft: '3px solid #10b981' }}>
            <strong style={{ color: '#059669' }}>💡 AI Recommendation:</strong>
            <p style={{ margin: '5px 0 0', color: '#475569', fontSize: '0.9rem' }}>
              {data.needsSupport.length > 0 
                ? `Consider pairing ${data.needsSupport[0].name} with ${data.topPerformer.name} for mentorship. Also review workload distribution to prevent burnout.`
                : 'Team is performing well. Consider cross-training to maintain knowledge sharing.'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
