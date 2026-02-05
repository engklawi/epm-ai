import { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Cell } from 'recharts';
import { Target, TrendingUp, Layers, CheckCircle } from 'lucide-react';
import { API, authFetch } from '../utils/authFetch';

export default function StrategyROI() {
  const [strategy, setStrategy] = useState(null);
  const [expandedObj, setExpandedObj] = useState(null);

  useEffect(() => {
    authFetch(`${API}/strategy`).then(r => r.json()).then(setStrategy);
  }, []);

  if (!strategy) return <div style={{ padding: 40 }}>Loading...</div>;

  const roiData = strategy.objectives.flatMap(obj =>
    obj.projectDetails.map(p => ({ name: p.name.split(' ')[0], roi: p.roi, target: obj.targetROI }))
  );

  const alignmentData = strategy.objectives.map(obj => ({
    objective: obj.name.split(' ')[0],
    alignment: obj.projectDetails.reduce((sum, p) => sum + p.alignmentScore, 0) / obj.projectDetails.length || 0,
    weight: obj.weight
  }));

  const colors = ['#0078d4', '#00a36c', '#f59e0b', '#8b5cf6'];

  return (
    <div>
      <div className="page-header">
        <h1>Strategy & ROI</h1>
        <p>Map projects to strategic objectives and measure ROI contribution</p>
      </div>

      {/* Summary Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 20, marginBottom: 24 }}>
        {[
          { label: 'Strategic Objectives', value: strategy.objectives.length, icon: Target, color: '#0078d4' },
          { label: 'Avg Alignment', value: `${strategy.alignmentScore}%`, icon: Layers, color: '#00a36c' },
          { label: 'Average ROI', value: `${strategy.overallROI}%`, icon: TrendingUp, color: '#f59e0b' },
          { label: 'On Target KPIs', value: `${strategy.objectives.reduce((acc, obj) => acc + obj.kpis.filter(k => k.actual >= k.target).length, 0)}/${strategy.objectives.reduce((acc, obj) => acc + obj.kpis.length, 0)}`, icon: CheckCircle, color: '#8b5cf6' },
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

      {/* Charts Row */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, marginBottom: 24 }}>
        <div style={{ background: 'white', borderRadius: 16, padding: 24, border: '1px solid #e2e8f0' }}>
          <h3 style={{ fontSize: '0.875rem', fontWeight: 600, marginBottom: 20, color: 'var(--slate-800)' }}>ROI by Project</h3>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={roiData}>
              <XAxis dataKey="name" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip formatter={(v) => `${v}%`} />
              <Bar dataKey="roi" fill="#00a36c" name="Actual ROI" radius={[4, 4, 0, 0]} />
              <Bar dataKey="target" fill="#94a3b8" name="Target ROI" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div style={{ background: 'white', borderRadius: 16, padding: 24, border: '1px solid #e2e8f0' }}>
          <h3 style={{ fontSize: '0.875rem', fontWeight: 600, marginBottom: 20, color: 'var(--slate-800)' }}>Alignment by Objective</h3>
          <ResponsiveContainer width="100%" height={280}>
            <RadarChart data={alignmentData} cx="50%" cy="50%" outerRadius="70%">
              <PolarGrid stroke="#e2e8f0" />
              <PolarAngleAxis dataKey="objective" tick={{ fontSize: 11, fill: '#64748b' }} />
              <PolarRadiusAxis domain={[0, 100]} tick={{ fontSize: 10 }} axisLine={false} />
              <Radar name="Alignment" dataKey="alignment" stroke="#0078d4" fill="#0078d4" fillOpacity={0.4} strokeWidth={2} />
            </RadarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Strategic Objectives - Compact Cards */}
      <div style={{ background: 'white', borderRadius: 16, padding: 24, border: '1px solid #e2e8f0' }}>
        <h3 style={{ fontSize: '0.875rem', fontWeight: 600, marginBottom: 20, color: 'var(--slate-800)' }}>Strategic Objectives</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 16 }}>
          {strategy.objectives.map((obj, idx) => (
            <div
              key={obj.id}
              style={{
                padding: 20,
                background: '#f8fafc',
                borderRadius: 12,
                borderLeft: `4px solid ${colors[idx % colors.length]}`,
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
              onClick={() => setExpandedObj(expandedObj === obj.id ? null : obj.id)}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                <div style={{ flex: 1 }}>
                  <h4 style={{ fontWeight: 600, fontSize: '0.95rem', marginBottom: 4 }}>{obj.name}</h4>
                  <p style={{ color: '#64748b', fontSize: '0.8rem', lineHeight: 1.4 }}>{obj.description}</p>
                </div>
                <div style={{ display: 'flex', gap: 16, marginLeft: 16 }}>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '1.25rem', fontWeight: 700, color: colors[idx % colors.length] }}>{obj.weight}%</div>
                    <div style={{ fontSize: '0.65rem', color: '#94a3b8', textTransform: 'uppercase' }}>Weight</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '1.25rem', fontWeight: 700, color: '#00a36c' }}>{obj.targetROI}%</div>
                    <div style={{ fontSize: '0.65rem', color: '#94a3b8', textTransform: 'uppercase' }}>Target ROI</div>
                  </div>
                </div>
              </div>

              {/* Progress Bar */}
              <div style={{ marginBottom: 12 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                  <span style={{ fontSize: '0.75rem', color: '#64748b' }}>Overall Progress</span>
                  <span style={{ fontSize: '0.75rem', fontWeight: 600, color: colors[idx % colors.length] }}>{obj.overallProgress}%</span>
                </div>
                <div style={{ height: 6, background: '#e2e8f0', borderRadius: 3 }}>
                  <div style={{
                    width: `${obj.overallProgress}%`,
                    height: '100%',
                    background: colors[idx % colors.length],
                    borderRadius: 3,
                    transition: 'width 0.3s ease'
                  }} />
                </div>
              </div>

              {/* Expanded Content */}
              {expandedObj === obj.id && (
                <div style={{ marginTop: 16, paddingTop: 16, borderTop: '1px solid #e2e8f0' }}>
                  <div style={{ marginBottom: 16 }}>
                    <div style={{ fontSize: '0.75rem', fontWeight: 600, color: '#64748b', marginBottom: 8 }}>KPIs:</div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                      {obj.kpis.map((kpi, i) => (
                        <div key={i} style={{ padding: 10, background: 'white', borderRadius: 8, border: '1px solid #e2e8f0' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', marginBottom: 4 }}>
                            <span>{kpi.name}</span>
                            <span style={{ fontWeight: 600, color: kpi.actual >= kpi.target ? '#00a36c' : '#f59e0b' }}>
                              {kpi.actual} / {kpi.target}
                            </span>
                          </div>
                          <div style={{ height: 4, background: '#e2e8f0', borderRadius: 2 }}>
                            <div style={{
                              width: `${Math.min((kpi.actual / kpi.target) * 100, 100)}%`,
                              height: '100%',
                              background: kpi.actual >= kpi.target ? '#00a36c' : '#f59e0b',
                              borderRadius: 2
                            }} />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <div style={{ fontSize: '0.75rem', fontWeight: 600, color: '#64748b', marginBottom: 8 }}>Linked Projects:</div>
                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                      {obj.projectDetails.map(p => (
                        <span key={p.id} style={{
                          padding: '4px 10px',
                          borderRadius: 6,
                          fontSize: '0.75rem',
                          fontWeight: 500,
                          background: p.health === 'green' ? '#dcfce7' : p.health === 'yellow' ? '#fef3c7' : '#fee2e2',
                          color: p.health === 'green' ? '#166534' : p.health === 'yellow' ? '#92400e' : '#991b1b'
                        }}>
                          {p.name} ({p.alignmentScore}% aligned)
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              <div style={{ fontSize: '0.7rem', color: '#94a3b8', marginTop: 8, textAlign: 'center' }}>
                {expandedObj === obj.id ? 'Click to collapse' : 'Click to expand details'}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
