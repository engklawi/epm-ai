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
  { path: '/', icon: MessageSquare, label: 'AI Assistant', desc: 'Chat & Insights' },
  { path: '/dashboard', icon: LayoutDashboard, label: 'Portfolio', desc: 'Programs Overview' },
  { path: '/strategy', icon: Target, label: 'Strategy & ROI', desc: 'Business Alignment' },
  { path: '/pmo', icon: Activity, label: 'PMO Performance', desc: 'Process Metrics' },
  { path: '/alignment', icon: Compass, label: 'Alignment', desc: 'Strategic Scoring' },
  { path: '/risks', icon: AlertTriangle, label: 'Risk Center', desc: 'Predictive Analysis' },
  { path: '/docs', icon: FileText, label: 'Documents', desc: 'Auto-Generation' },
  { path: '/predictions', icon: LineChart, label: 'Predictions', desc: 'Executive Forecasts' },
  { path: '/pm-scores', icon: Users, label: 'PM Scoring', desc: 'Performance Metrics' },
  { path: '/pm-dev', icon: GraduationCap, label: 'Development', desc: 'Training & Growth' },
];

function App() {
  return (
    <BrowserRouter>
      <div className="app">
        <nav className="sidebar">
          <div className="logo">
            <h2>EPM Intelligence</h2>
            <span>Microsoft Project + AI</span>
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
            padding: '16px',
            background: 'linear-gradient(180deg, transparent 0%, var(--slate-900) 30%)',
          }}>
            <div style={{
              padding: '12px 14px',
              background: 'rgba(255,255,255,0.04)',
              borderRadius: 8,
              border: '1px solid rgba(255,255,255,0.06)'
            }}>
              <div style={{ fontSize: '0.65rem', fontWeight: 600, color: 'rgba(255,255,255,0.5)', marginBottom: 2, letterSpacing: '0.05em' }}>
                DEMO VERSION
              </div>
              <div style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.35)' }}>
                v1.0 · Enterprise POC
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
