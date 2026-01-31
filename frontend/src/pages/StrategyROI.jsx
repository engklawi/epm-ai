import { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis } from 'recharts';

const API = 'https://epm-ai-demo-20260201.uc.r.appspot.com/api';

export default function StrategyROI() {
  const [strategy, setStrategy] = useState(null);

  useEffect(() => {
    fetch(`${API}/strategy`).then(r => r.json()).then(setStrategy);
  }, []);

  if (!strategy) return <div>Loading...</div>;

  const roiData = strategy.objectives.flatMap(obj => 
    obj.projectDetails.map(p => ({ name: p.name.split(' ')[0], roi: p.roi, target: obj.targetROI }))
  );

  const alignmentData = strategy.objectives.map(obj => ({
    objective: obj.name.split(' ')[0],
    alignment: obj.projectDetails.reduce((sum, p) => sum + p.alignmentScore, 0) / obj.projectDetails.length || 0,
    weight: obj.weight
  }));

  return (
    <div>
      <div className="page-header">
        <h1>🎯 UC3: Strategy & ROI</h1>
        <p>Map projects to strategic objectives and measure ROI contribution</p>
      </div>

      <div className="grid-3 gap-20 mb-20">
        <div className="card stat">
          <div className="value">{strategy.objectives.length}</div>
          <div className="label">Strategic Objectives</div>
        </div>
        <div className="card stat">
          <div className="value health-green">{strategy.alignmentScore}%</div>
          <div className="label">Avg Alignment Score</div>
        </div>
        <div className="card stat">
          <div className="value health-green">{strategy.overallROI}%</div>
          <div className="label">Average ROI</div>
        </div>
      </div>

      <div className="grid-2 gap-20">
        <div className="card">
          <h3>📈 ROI by Project</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={roiData}>
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip formatter={(v) => `${v}%`} />
              <Bar dataKey="roi" fill="#10b981" name="Actual ROI" />
              <Bar dataKey="target" fill="#6366f1" name="Target ROI" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="card">
          <h3>🎯 Alignment by Objective</h3>
          <ResponsiveContainer width="100%" height={300}>
            <RadarChart data={alignmentData}>
              <PolarGrid />
              <PolarAngleAxis dataKey="objective" />
              <PolarRadiusAxis domain={[0, 100]} />
              <Radar name="Alignment" dataKey="alignment" stroke="#6366f1" fill="#6366f1" fillOpacity={0.5} />
            </RadarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="card mt-20">
        <h3>🏢 Strategic Objectives Breakdown</h3>
        {strategy.objectives.map(obj => (
          <div key={obj.id} style={{ marginBottom: 30, padding: 20, background: '#f8fafc', borderRadius: 8 }}>
            <div className="flex flex-between flex-center mb-20">
              <div>
                <h4 style={{ marginBottom: 5 }}>{obj.name}</h4>
                <p style={{ color: '#64748b', fontSize: '0.9rem' }}>{obj.description}</p>
              </div>
              <div className="flex gap-20">
                <div className="stat">
                  <div className="value" style={{ fontSize: '1.5rem' }}>{obj.weight}%</div>
                  <div className="label">Weight</div>
                </div>
                <div className="stat">
                  <div className="value" style={{ fontSize: '1.5rem' }}>{obj.targetROI}%</div>
                  <div className="label">Target ROI</div>
                </div>
              </div>
            </div>

            <div className="mb-20">
              <div className="flex flex-between" style={{ marginBottom: 5 }}>
                <span>Overall Progress</span>
                <span>{obj.overallProgress}%</span>
              </div>
              <div className="progress-bar">
                <div className="fill blue" style={{ width: `${obj.overallProgress}%` }} />
              </div>
            </div>

            <div className="mb-20">
              <strong>KPIs:</strong>
              <div className="grid-2 gap-10 mt-20">
                {obj.kpis.map((kpi, i) => (
                  <div key={i} style={{ padding: 10, background: 'white', borderRadius: 6 }}>
                    <div className="flex flex-between">
                      <span>{kpi.name}</span>
                      <span className={kpi.actual >= kpi.target ? 'health-green' : 'health-yellow'}>
                        {kpi.actual} / {kpi.target}
                      </span>
                    </div>
                    <div className="progress-bar" style={{ marginTop: 5 }}>
                      <div 
                        className={`fill ${kpi.actual >= kpi.target ? 'green' : 'yellow'}`} 
                        style={{ width: `${Math.min((kpi.actual / kpi.target) * 100, 100)}%` }} 
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <strong>Linked Projects:</strong>
              <div className="flex gap-10 mt-20">
                {obj.projectDetails.map(p => (
                  <span key={p.id} className={`badge badge-${p.health}`}>
                    {p.name} ({p.alignmentScore}% aligned)
                  </span>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
