import { useState, useEffect } from 'react';
import { AlertTriangle, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';

const API = 'https://epm-ai-demo-20260201.uc.r.appspot.com/api';

export default function RiskManagement() {
  const [riskData, setRiskData] = useState(null);

  useEffect(() => {
    fetch(`${API}/risks`).then(r => r.json()).then(setRiskData);
  }, []);

  if (!riskData) return <div>Loading...</div>;

  const categoryData = Object.entries(riskData.byCategory).map(([name, value]) => ({
    name, value, color: {
      Resource: '#6366f1',
      Scope: '#f59e0b',
      Financial: '#ef4444',
      Technical: '#8b5cf6',
      Schedule: '#10b981'
    }[name]
  }));

  const TrendIcon = ({ trend }) => {
    if (trend === 'increasing') return <TrendingUp size={16} className="health-red" />;
    if (trend === 'decreasing') return <TrendingDown size={16} className="health-green" />;
    return <Minus size={16} className="health-yellow" />;
  };

  return (
    <div>
      <div className="page-header">
        <h1>⚠️ UC6: Risk Management</h1>
        <p>Predictive risk identification with AI-powered mitigation recommendations</p>
      </div>

      <div className="grid-4 gap-20 mb-20">
        <div className="card stat">
          <div className="value">{riskData.summary.total}</div>
          <div className="label">Total Risks</div>
        </div>
        <div className="card stat">
          <div className="value health-red">{riskData.summary.critical}</div>
          <div className="label">Critical</div>
        </div>
        <div className="card stat">
          <div className="value health-yellow">{riskData.summary.open}</div>
          <div className="label">Open</div>
        </div>
        <div className="card stat">
          <div className="value">{riskData.summary.avgScore}</div>
          <div className="label">Avg Risk Score</div>
        </div>
      </div>

      <div className="grid-2 gap-20">
        <div className="card">
          <h3>📊 Risks by Category</h3>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie
                data={categoryData}
                cx="50%"
                cy="50%"
                outerRadius={100}
                dataKey="value"
                label={({ name, value }) => `${name}: ${value}`}
              >
                {categoryData.map((entry, i) => (
                  <Cell key={i} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="card">
          <h3>🚨 Critical Risks - Immediate Attention</h3>
          {riskData.risks.filter(r => r.status === 'Critical').map(risk => (
            <div key={risk.id} className="alert critical">
              <AlertTriangle size={20} />
              <div style={{ flex: 1 }}>
                <strong>{risk.title}</strong>
                <div style={{ fontSize: '0.85rem', color: '#64748b' }}>
                  {risk.projectName} • Score: {risk.score}
                </div>
              </div>
              <TrendIcon trend={risk.trend} />
            </div>
          ))}
        </div>
      </div>

      <div className="card mt-20">
        <h3>📋 Risk Register</h3>
        <table>
          <thead>
            <tr>
              <th>Risk</th>
              <th>Project</th>
              <th>Category</th>
              <th>Probability</th>
              <th>Impact</th>
              <th>Score</th>
              <th>Trend</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {riskData.risks.sort((a, b) => b.score - a.score).map(risk => (
              <tr key={risk.id}>
                <td>
                  <strong>{risk.title}</strong>
                  <div style={{ fontSize: '0.8rem', color: '#64748b' }}>{risk.description}</div>
                </td>
                <td>{risk.projectName}</td>
                <td><span className="badge badge-blue">{risk.category}</span></td>
                <td>
                  <span className={`heat-cell ${risk.probability > 70 ? 'heat-high' : risk.probability > 50 ? 'heat-medium' : 'heat-low'}`}>
                    {risk.probability}%
                  </span>
                </td>
                <td>
                  <span className={`heat-cell ${risk.impact > 70 ? 'heat-high' : risk.impact > 50 ? 'heat-medium' : 'heat-low'}`}>
                    {risk.impact}%
                  </span>
                </td>
                <td>
                  <span className={`heat-cell ${risk.score > 60 ? 'heat-high' : risk.score > 40 ? 'heat-medium' : 'heat-low'}`}>
                    {risk.score}
                  </span>
                </td>
                <td><TrendIcon trend={risk.trend} /></td>
                <td>
                  <span className={`badge ${risk.status === 'Critical' ? 'badge-red' : risk.status === 'Open' ? 'badge-yellow' : 'badge-blue'}`}>
                    {risk.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="card mt-20">
        <h3>🤖 AI-Recommended Mitigations</h3>
        {riskData.risks.filter(r => r.status === 'Critical' || r.status === 'Open').slice(0, 4).map(risk => (
          <div key={risk.id} style={{ padding: 15, background: '#f8fafc', borderRadius: 8, marginBottom: 10 }}>
            <div className="flex flex-between flex-center">
              <div>
                <strong>{risk.title}</strong> — {risk.projectName}
              </div>
              <span className={`badge ${risk.status === 'Critical' ? 'badge-red' : 'badge-yellow'}`}>{risk.status}</span>
            </div>
            <div style={{ marginTop: 10, padding: 10, background: 'white', borderRadius: 6, borderLeft: '3px solid #6366f1' }}>
              <strong style={{ color: '#6366f1' }}>💡 Recommended Action:</strong>
              <p style={{ margin: '5px 0 0', color: '#475569' }}>{risk.mitigation}</p>
            </div>
            <div style={{ marginTop: 8, fontSize: '0.8rem', color: '#64748b' }}>
              Predicted escalation date: {risk.predictedDate}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
