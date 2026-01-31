import { useState, useEffect } from 'react';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { TrendingUp, TrendingDown, DollarSign, FolderKanban, Target, AlertTriangle } from 'lucide-react';

const API = 'http://localhost:3001/api';

export default function DirectorsDashboard() {
  const [portfolio, setPortfolio] = useState(null);

  useEffect(() => {
    fetch(`${API}/portfolio`).then(r => r.json()).then(setPortfolio);
  }, []);

  if (!portfolio) return <div style={{ padding: 40 }}>Loading...</div>;

  const healthData = [
    { name: 'On Track', value: portfolio.healthBreakdown.green, color: '#10b981' },
    { name: 'At Risk', value: portfolio.healthBreakdown.yellow, color: '#f59e0b' },
    { name: 'Critical', value: portfolio.healthBreakdown.red, color: '#ef4444' },
  ];

  const budgetData = portfolio.projects.map(p => ({
    name: p.name.length > 12 ? p.name.substring(0, 12) + '...' : p.name,
    fullName: p.name,
    budget: (p.budget / 1000000).toFixed(2),
    spent: (p.spent / 1000000).toFixed(2),
  }));

  const utilizationRate = Math.round((portfolio.totalSpent / portfolio.totalBudget) * 100);

  return (
    <div>
      <div className="page-header">
        <h1>Portfolio Dashboard</h1>
        <p>Executive overview of all projects, budgets, and strategic alignment</p>
      </div>

      {/* Stats Row */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-label">Total Projects</div>
          <div className="stat-value">{portfolio.totalProjects}</div>
          <div className="stat-subtitle">Active in portfolio</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Total Budget</div>
          <div className="stat-value primary">${(portfolio.totalBudget / 1000000).toFixed(1)}M</div>
          <div className="stat-subtitle">Allocated this year</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Budget Utilized</div>
          <div className="stat-value" style={{ color: utilizationRate > 80 ? '#ef4444' : utilizationRate > 60 ? '#f59e0b' : '#10b981' }}>
            {utilizationRate}%
          </div>
          <div className="stat-subtitle">${(portfolio.totalSpent / 1000000).toFixed(1)}M spent</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Avg Progress</div>
          <div className="stat-value success">{portfolio.avgProgress}%</div>
          <div className="stat-subtitle">Across all projects</div>
        </div>
      </div>

      {/* Charts Row */}
      <div className="dashboard-grid">
        <div className="chart-card">
          <h3><Target size={18} /> Portfolio Health Distribution</h3>
          <ResponsiveContainer width="100%" height={260}>
            <PieChart>
              <Pie
                data={healthData}
                cx="50%"
                cy="50%"
                innerRadius={70}
                outerRadius={100}
                paddingAngle={3}
                dataKey="value"
              >
                {healthData.map((entry, i) => (
                  <Cell key={i} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip 
                formatter={(value, name) => [`${value} projects`, name]}
                contentStyle={{ borderRadius: 8, border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
              />
              <Legend 
                verticalAlign="bottom" 
                height={36}
                formatter={(value, entry) => <span style={{ color: '#374151', fontSize: '0.85rem' }}>{value}</span>}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="chart-card">
          <h3><DollarSign size={18} /> Budget vs Actual Spend (Millions)</h3>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={budgetData} barGap={2}>
              <XAxis 
                dataKey="name" 
                tick={{ fontSize: 12, fill: '#6b7280' }}
                axisLine={{ stroke: '#e5e7eb' }}
                tickLine={false}
              />
              <YAxis 
                tick={{ fontSize: 12, fill: '#6b7280' }}
                axisLine={false}
                tickLine={false}
                tickFormatter={(v) => `$${v}M`}
              />
              <Tooltip 
                formatter={(value, name) => [`$${value}M`, name === 'budget' ? 'Budget' : 'Spent']}
                contentStyle={{ borderRadius: 8, border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                labelFormatter={(label, payload) => payload[0]?.payload?.fullName || label}
              />
              <Legend 
                verticalAlign="top" 
                height={36}
                formatter={(value) => <span style={{ color: '#374151', fontSize: '0.85rem' }}>{value === 'budget' ? 'Budget' : 'Spent'}</span>}
              />
              <Bar dataKey="budget" fill="#6366f1" radius={[4, 4, 0, 0]} name="budget" />
              <Bar dataKey="spent" fill="#f59e0b" radius={[4, 4, 0, 0]} name="spent" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Risk Heat Map */}
      <div className="table-card mb-24">
        <div className="table-header">
          <h3><AlertTriangle size={18} /> Risk Heat Map</h3>
        </div>
        <table>
          <thead>
            <tr>
              <th>Project</th>
              <th>Risk Score</th>
              <th>Budget Risk</th>
              <th>Schedule Risk</th>
              <th>Strategic Alignment</th>
              <th>Overall Health</th>
            </tr>
          </thead>
          <tbody>
            {portfolio.projects.map(p => {
              const budgetRisk = Math.round((p.spent / p.budget) * 100);
              const scheduleRisk = p.health === 'red' ? 'High' : p.health === 'yellow' ? 'Medium' : 'Low';
              return (
                <tr key={p.id}>
                  <td>
                    <div style={{ fontWeight: 600, color: '#111827' }}>{p.name}</div>
                    <div style={{ fontSize: '0.8rem', color: '#6b7280' }}>{p.pmName}</div>
                  </td>
                  <td>
                    <span className={`heat-cell ${p.riskScore > 60 ? 'heat-high' : p.riskScore > 40 ? 'heat-medium' : 'heat-low'}`}>
                      {p.riskScore}%
                    </span>
                  </td>
                  <td>
                    <span className={`heat-cell ${budgetRisk > 80 ? 'heat-high' : budgetRisk > 60 ? 'heat-medium' : 'heat-low'}`}>
                      {budgetRisk}%
                    </span>
                  </td>
                  <td>
                    <span className={`heat-cell heat-${scheduleRisk.toLowerCase()}`}>
                      {scheduleRisk}
                    </span>
                  </td>
                  <td>
                    <span className={`heat-cell ${p.alignmentScore >= 90 ? 'heat-low' : p.alignmentScore >= 80 ? 'heat-medium' : 'heat-high'}`}>
                      {p.alignmentScore}%
                    </span>
                  </td>
                  <td>
                    <span className={`badge badge-${p.health}`}>{p.status}</span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Project Details */}
      <div className="table-card">
        <div className="table-header">
          <h3><FolderKanban size={18} /> Project Details</h3>
        </div>
        <table>
          <thead>
            <tr>
              <th>Project</th>
              <th>Project Manager</th>
              <th style={{ width: 180 }}>Progress</th>
              <th>Budget</th>
              <th>Timeline</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {portfolio.projects.map(p => (
              <tr key={p.id}>
                <td style={{ fontWeight: 600, color: '#111827' }}>{p.name}</td>
                <td>{p.pmName}</td>
                <td>
                  <div className="flex flex-center gap-12">
                    <div className="progress-bar" style={{ flex: 1, maxWidth: 100 }}>
                      <div className={`fill ${p.health}`} style={{ width: `${p.progress}%` }} />
                    </div>
                    <span style={{ fontSize: '0.85rem', fontWeight: 500, minWidth: 40 }}>{p.progress}%</span>
                  </div>
                </td>
                <td>
                  <div style={{ fontWeight: 500 }}>${(p.spent / 1000000).toFixed(2)}M</div>
                  <div style={{ fontSize: '0.8rem', color: '#6b7280' }}>of ${(p.budget / 1000000).toFixed(2)}M</div>
                </td>
                <td>
                  <div style={{ fontSize: '0.85rem' }}>{p.startDate}</div>
                  <div style={{ fontSize: '0.8rem', color: '#6b7280' }}>→ {p.endDate}</div>
                </td>
                <td>
                  <span className={`badge badge-${p.health}`}>{p.status}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
