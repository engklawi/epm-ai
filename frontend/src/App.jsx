import { BrowserRouter, Routes, Route, NavLink } from 'react-router-dom';
import { MessageSquare, LayoutDashboard, Target, AlertTriangle, FileText, Users, Activity, Compass, LineChart, GraduationCap } from 'lucide-react';
import PMAssistant from './pages/PMAssistant';
import DirectorsDashboard from './pages/DirectorsDashboard';
import StrategyROI from './pages/StrategyROI';
import PMOPerformance from './pages/PMOPerformance';
import StrategicAlignment from './pages/StrategicAlignment';
import RiskManagement from './pages/RiskManagement';
import Documentation from './pages/Documentation';
import ExecutivePredictions from './pages/ExecutivePredictions';
import PMScoring from './pages/PMScoring';
import PMDevelopment from './pages/PMDevelopment';
import './App.css';

const navItems = [
  { path: '/', icon: MessageSquare, label: 'UC1: PM Assistant', desc: 'AI Chat & Insights' },
  { path: '/dashboard', icon: LayoutDashboard, label: 'UC2: Portfolio', desc: 'Directors Dashboard' },
  { path: '/strategy', icon: Target, label: 'UC3: Strategy & ROI', desc: 'Objectives & Returns' },
  { path: '/pmo', icon: Activity, label: 'UC4: PMO Performance', desc: 'Process Metrics' },
  { path: '/alignment', icon: Compass, label: 'UC5: Alignment', desc: 'Strategic Scoring' },
  { path: '/risks', icon: AlertTriangle, label: 'UC6: Risk Center', desc: 'Predictive Analytics' },
  { path: '/docs', icon: FileText, label: 'UC7: Documents', desc: 'Auto-Generation' },
  { path: '/predictions', icon: LineChart, label: 'UC8: Predictions', desc: 'Executive Forecasts' },
  { path: '/pm-scores', icon: Users, label: 'UC9: PM Scoring', desc: 'Performance Metrics' },
  { path: '/pm-dev', icon: GraduationCap, label: 'UC10: PM Development', desc: 'Training & Growth' },
];

function App() {
  return (
    <BrowserRouter>
      <div className="app">
        <nav className="sidebar">
          <div className="logo">
            <h2>EPM AI</h2>
            <span>Microsoft EPM + Intelligence</span>
          </div>
          <div style={{ flex: 1, overflow: 'auto', paddingBottom: 80 }}>
            <ul>
              {navItems.map(({ path, icon: Icon, label, desc }) => (
                <li key={path}>
                  <NavLink to={path} className={({ isActive }) => isActive ? 'active' : ''}>
                    <Icon size={18} strokeWidth={1.8} />
                    <div>
                      <span>{label}</span>
                      <small>{desc}</small>
                    </div>
                  </NavLink>
                </li>
              ))}
            </ul>
          </div>
          <div style={{ 
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            padding: '16px 20px',
            background: 'linear-gradient(180deg, transparent 0%, #0f172a 20%)',
          }}>
            <div style={{ 
              padding: '12px 14px',
              background: 'rgba(255,255,255,0.03)',
              borderRadius: 8,
              border: '1px solid rgba(255,255,255,0.06)'
            }}>
              <div style={{ fontSize: '0.7rem', fontWeight: 600, color: 'rgba(255,255,255,0.7)', marginBottom: 2 }}>
                PROOF OF CONCEPT
              </div>
              <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.4)' }}>
                v1.0 • All 10 Use Cases
              </div>
            </div>
          </div>
        </nav>
        <main className="content">
          <Routes>
            <Route path="/" element={<PMAssistant />} />
            <Route path="/dashboard" element={<DirectorsDashboard />} />
            <Route path="/strategy" element={<StrategyROI />} />
            <Route path="/pmo" element={<PMOPerformance />} />
            <Route path="/alignment" element={<StrategicAlignment />} />
            <Route path="/risks" element={<RiskManagement />} />
            <Route path="/docs" element={<Documentation />} />
            <Route path="/predictions" element={<ExecutivePredictions />} />
            <Route path="/pm-scores" element={<PMScoring />} />
            <Route path="/pm-dev" element={<PMDevelopment />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}

export default App;
