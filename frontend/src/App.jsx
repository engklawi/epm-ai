import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, NavLink, Navigate } from 'react-router-dom';
import { LayoutDashboard, Target, AlertTriangle, FileText, Users, Activity, Compass, LineChart, GraduationCap, RefreshCw, ChevronLeft, ChevronRight, LogOut } from 'lucide-react';
import DirectorsDashboard from './pages/DirectorsDashboard';
import StrategyROI from './pages/StrategyROI';
import PMOPerformance from './pages/PMOPerformance';
import StrategicAlignment from './pages/StrategicAlignment';
import RiskManagement from './pages/RiskManagement';
import Documentation from './pages/Documentation';
import ExecutivePredictions from './pages/ExecutivePredictions';
import PMScoring from './pages/PMScoring';
import PMDevelopment from './pages/PMDevelopment';
import BayanPanel from './components/BayanPanel';
import LoginPage from './pages/LoginPage';
import ProtectedRoute from './components/ProtectedRoute';
import { useAuth } from './contexts/AuthContext';
import { API, authFetch } from './utils/authFetch';
import './App.css';

const navItems = [
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

function AppLayout() {
  const { logout } = useAuth();
  const [psStatus, setPsStatus] = useState({ connected: false, loading: true });
  const [refreshing, setRefreshing] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(true);

  const checkStatus = () => {
    authFetch(`${API}/ps/status`)
      .then(r => r.json())
      .then(data => setPsStatus({ connected: data.connected, lastSync: data.lastSync, loading: false }))
      .catch(() => setPsStatus({ connected: false, loading: false }));
  };

  const manualRefresh = () => {
    setRefreshing(true);
    setPsStatus(prev => ({ ...prev, loading: true }));
    authFetch(`${API}/ps/status`)
      .then(r => r.json())
      .then(data => setPsStatus({ connected: data.connected, lastSync: data.lastSync, loading: false }))
      .catch(() => setPsStatus({ connected: false, loading: false }))
      .finally(() => setTimeout(() => setRefreshing(false), 600));
  };

  useEffect(() => {
    checkStatus();
    const interval = setInterval(checkStatus, 60000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className={`app ${sidebarCollapsed ? 'sidebar-collapsed' : ''}`}>
      {/* Left Sidebar - Navigation */}
      <nav className={`sidebar ${sidebarCollapsed ? 'collapsed' : ''}`}>
        <div className="logo" style={{ display: 'flex', justifyContent: 'center' }}>
          <img
            src="/DGA Logo-01_0.png"
            alt="DGA"
            style={{
              width: sidebarCollapsed ? 44 : 160,
              height: 'auto',
              objectFit: 'contain',
              filter: 'brightness(0) invert(1)'
            }}
          />
        </div>
        <div style={{ flex: 1, overflow: 'auto', paddingBottom: 80 }}>
          <ul>
            {navItems.map(({ path, icon: Icon, label, desc }) => (
              <li key={path}>
                <NavLink to={path} className={({ isActive }) => isActive ? 'active' : ''} title={sidebarCollapsed ? label : undefined}>
                  <Icon size={18} strokeWidth={1.8} />
                  {!sidebarCollapsed && (
                    <div>
                      <span>{label}</span>
                      <small>{desc}</small>
                    </div>
                  )}
                </NavLink>
              </li>
            ))}
          </ul>
        </div>
        {/* Toggle Button */}
        <button
          onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
          className="sidebar-toggle"
          title={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {sidebarCollapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
        </button>
        {/* Bottom Section: PS Status + Logout */}
        <div style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          padding: sidebarCollapsed ? '12px 8px' : '16px',
          background: 'linear-gradient(180deg, transparent 0%, var(--slate-900) 30%)',
          display: 'flex',
          flexDirection: 'column',
          gap: 8,
        }}>
          {/* PS Connection Indicator */}
          <div style={{
            padding: sidebarCollapsed ? '8px' : '10px 14px',
            background: psStatus.connected ? 'rgba(34, 197, 94, 0.08)' : 'rgba(239, 68, 68, 0.08)',
            borderRadius: 8,
            border: `1px solid ${psStatus.connected ? 'rgba(34, 197, 94, 0.2)' : 'rgba(239, 68, 68, 0.15)'}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: sidebarCollapsed ? 'center' : 'flex-start',
            gap: sidebarCollapsed ? 0 : 10
          }}>
            <div style={{
              width: 8, height: 8, borderRadius: '50%',
              background: psStatus.loading ? '#94a3b8' : psStatus.connected ? '#22c55e' : '#ef4444',
              boxShadow: psStatus.connected ? '0 0 6px rgba(34, 197, 94, 0.5)' : 'none',
              animation: psStatus.connected ? 'pulse-dot 2s ease-in-out infinite' : 'none',
              flexShrink: 0
            }} title={sidebarCollapsed ? (psStatus.connected ? 'Connected to Project Server' : 'Disconnected') : undefined} />
            {!sidebarCollapsed && (
              <>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '0.65rem', fontWeight: 600, color: psStatus.connected ? 'rgba(34, 197, 94, 0.9)' : 'rgba(239, 68, 68, 0.8)', letterSpacing: '0.03em' }}>
                    {psStatus.loading ? 'CHECKING...' : psStatus.connected ? 'LIVE — EPM SERVER' : 'DISCONNECTED'}
                  </div>
                  {psStatus.lastSync && (
                    <div style={{ fontSize: '0.6rem', color: 'rgba(255,255,255,0.3)', marginTop: 1 }}>
                      Last sync: {new Date(psStatus.lastSync).toLocaleTimeString()}
                    </div>
                  )}
                </div>
                <button onClick={manualRefresh} style={{
                  background: 'none', border: 'none', cursor: 'pointer',
                  padding: 4, borderRadius: 4, display: 'flex', flexShrink: 0,
                  color: psStatus.connected ? 'rgba(34, 197, 94, 0.6)' : 'rgba(239, 68, 68, 0.5)',
                  transition: 'all 0.2s'
                }} title="Refresh connection">
                  <RefreshCw size={13} style={{
                    animation: refreshing ? 'spin 0.6s linear infinite' : 'none'
                  }} />
                </button>
              </>
            )}
          </div>
          {/* Logout Button */}
          <button
            onClick={logout}
            title="Sign out"
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: sidebarCollapsed ? 'center' : 'flex-start',
              gap: 8,
              padding: sidebarCollapsed ? '8px' : '8px 14px',
              background: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              borderRadius: 8,
              color: 'rgba(255, 255, 255, 0.5)',
              cursor: 'pointer',
              fontSize: '0.7rem',
              fontWeight: 500,
              transition: 'all 0.2s',
              width: '100%',
              boxSizing: 'border-box',
            }}
          >
            <LogOut size={14} />
            {!sidebarCollapsed && <span>Sign Out</span>}
          </button>
        </div>
      </nav>

      {/* Main Content Area */}
      <main className="content">
        <Routes>
          <Route path="/dashboard" element={<DirectorsDashboard />} />
          <Route path="/strategy" element={<StrategyROI />} />
          <Route path="/pmo" element={<PMOPerformance />} />
          <Route path="/alignment" element={<StrategicAlignment />} />
          <Route path="/risks" element={<RiskManagement />} />
          <Route path="/docs" element={<Documentation />} />
          <Route path="/predictions" element={<ExecutivePredictions />} />
          <Route path="/pm-scores" element={<PMScoring />} />
          <Route path="/pm-dev" element={<PMDevelopment />} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </main>

      {/* Right Sidebar - Bayan AI Panel */}
      <BayanPanel />
    </div>
  );
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/*" element={
          <ProtectedRoute>
            <AppLayout />
          </ProtectedRoute>
        } />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
