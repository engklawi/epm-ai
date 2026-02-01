import { useState, useEffect, useRef } from 'react';
import { Send, AlertCircle, AlertTriangle, Bot, Sparkles } from 'lucide-react';

const API = 'https://epm-ai-demo-20260201.uc.r.appspot.com/api';

export default function PMAssistant() {
  const [messages, setMessages] = useState([
    { role: 'ai', content: "Hello! I'm your AI Project Management Assistant.\n\nI can help you with:\n• Real-time project status\n• Risk analysis & predictions\n• Resource workload optimization\n• Schedule & delay analysis\n\nHow can I assist you today?" }
  ]);
  const [input, setInput] = useState('');
  const [alerts, setAlerts] = useState([]);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    fetch(`${API}/alerts`).then(r => r.json()).then(setAlerts);
    fetch(`${API}/projects`).then(r => r.json()).then(setProjects);
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = async () => {
    if (!input.trim() || loading) return;
    const userMsg = { role: 'user', content: input };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);
    try {
      const res = await fetch(`${API}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: input })
      });
      const data = await res.json();
      setMessages(prev => [...prev, { role: 'ai', content: data.response }]);
    } catch (err) {
      setMessages(prev => [...prev, { role: 'ai', content: 'Connection error. Please try again.' }]);
    }
    setLoading(false);
  };

  const quickQueries = [
    { label: "Project Status", query: "What's the project status?" },
    { label: "Risk Analysis", query: "Show me risks" },
    { label: "Workload", query: "Check resource workload" },
    { label: "Delays", query: "Any schedule delays?" }
  ];

  return (
    <div>
      <div className="page-header">
        <h1>AI Project Assistant</h1>
        <p>Natural language interface for real-time project insights</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
        {/* Chat Panel */}
        <div style={{ 
          background: 'white', 
          borderRadius: 16, 
          border: '1px solid #e2e8f0',
          display: 'flex',
          flexDirection: 'column',
          height: 600,
          overflow: 'hidden'
        }}>
          <div style={{ 
            padding: '16px 20px', 
            borderBottom: '1px solid #e2e8f0',
            background: '#f8fafc',
            display: 'flex',
            alignItems: 'center',
            gap: 12
          }}>
            <div style={{ 
              width: 36, height: 36, borderRadius: 8, 
              background: 'linear-gradient(135deg, #6366f1, #4f46e5)',
              display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}>
              <Bot size={18} color="white" />
            </div>
            <div>
              <div style={{ fontWeight: 600, fontSize: '0.95rem' }}>AI Assistant</div>
              <div style={{ fontSize: '0.75rem', color: '#64748b' }}>Powered by predictive analytics</div>
            </div>
          </div>
          
          <div style={{ flex: 1, overflow: 'auto', padding: 20, display: 'flex', flexDirection: 'column', gap: 12 }}>
            {messages.map((msg, i) => (
              <div key={i} style={{
                maxWidth: '85%',
                padding: '12px 16px',
                borderRadius: 12,
                fontSize: '0.9rem',
                lineHeight: 1.5,
                whiteSpace: 'pre-wrap',
                alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start',
                background: msg.role === 'user' ? 'linear-gradient(135deg, #6366f1, #4f46e5)' : '#f1f5f9',
                color: msg.role === 'user' ? 'white' : '#334155',
              }}>
                {msg.content}
              </div>
            ))}
            {loading && <div style={{ color: '#64748b', fontSize: '0.85rem' }}><Sparkles size={14} /> Analyzing...</div>}
            <div ref={messagesEndRef} />
          </div>
          
          <div style={{ padding: 16, borderTop: '1px solid #e2e8f0' }}>
            <div style={{ display: 'flex', gap: 10, marginBottom: 10 }}>
              <input
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyPress={e => e.key === 'Enter' && sendMessage()}
                placeholder="Ask about projects, risks, resources..."
                style={{ flex: 1, padding: '12px 16px', border: '1px solid #e2e8f0', borderRadius: 8, fontSize: '0.9rem' }}
              />
              <button onClick={sendMessage} style={{ 
                padding: '12px 16px', background: 'linear-gradient(135deg, #6366f1, #4f46e5)', 
                color: 'white', border: 'none', borderRadius: 8, cursor: 'pointer' 
              }}>
                <Send size={18} />
              </button>
            </div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {quickQueries.map(q => (
                <button key={q.label} onClick={() => setInput(q.query)} style={{
                  padding: '6px 12px', fontSize: '0.75rem', background: '#f1f5f9',
                  border: '1px solid #e2e8f0', borderRadius: 6, cursor: 'pointer'
                }}>{q.label}</button>
              ))}
            </div>
          </div>
        </div>

        {/* Right Panel */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* Alerts */}
          <div style={{ background: 'white', borderRadius: 16, padding: 20, border: '1px solid #e2e8f0' }}>
            <h3 style={{ fontSize: '0.75rem', fontWeight: 600, color: '#64748b', textTransform: 'uppercase', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
              <AlertTriangle size={14} /> Active Alerts
            </h3>
            {alerts.slice(0, 4).map((alert, i) => (
              <div key={i} style={{
                display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px',
                marginBottom: 8, borderRadius: 10,
                background: alert.type === 'critical' ? '#fef2f2' : '#fffbeb',
                border: `1px solid ${alert.type === 'critical' ? '#fecaca' : '#fde68a'}`
              }}>
                {alert.type === 'critical' ? <AlertCircle size={16} color="#dc2626" /> : <AlertTriangle size={16} color="#d97706" />}
                <span style={{ fontSize: '0.85rem', fontWeight: 500 }}>{alert.message}</span>
              </div>
            ))}
          </div>

          {/* Portfolio */}
          <div style={{ background: 'white', borderRadius: 16, padding: 20, border: '1px solid #e2e8f0' }}>
            <h3 style={{ fontSize: '0.75rem', fontWeight: 600, color: '#64748b', textTransform: 'uppercase', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ width: 14, height: 14, background: 'linear-gradient(135deg, #0078d4, #005a9e)', borderRadius: 3 }}></span> Portfolio Summary
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 16 }}>
              {[
                { v: projects.length, l: 'Total', c: '#1e293b' },
                { v: projects.filter(p => p.health === 'green').length, l: 'On Track', c: '#059669' },
                { v: projects.filter(p => p.health === 'yellow').length, l: 'At Risk', c: '#d97706' },
                { v: projects.filter(p => p.health === 'red').length, l: 'Critical', c: '#dc2626' },
              ].map((s, i) => (
                <div key={i} style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '1.5rem', fontWeight: 700, color: s.c }}>{s.v}</div>
                  <div style={{ fontSize: '0.65rem', color: '#64748b', textTransform: 'uppercase' }}>{s.l}</div>
                </div>
              ))}
            </div>
            {projects.map(p => (
              <div key={p.id} style={{ 
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '10px 12px', marginBottom: 6, background: '#f8fafc', borderRadius: 8
              }}>
                <span style={{ fontWeight: 500, fontSize: '0.85rem' }}>{p.name}</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ width: 60, height: 6, background: '#e2e8f0', borderRadius: 3 }}>
                    <div style={{ 
                      width: `${p.progress}%`, height: '100%', borderRadius: 3,
                      background: p.health === 'green' ? '#10b981' : p.health === 'yellow' ? '#f59e0b' : '#ef4444'
                    }} />
                  </div>
                  <span style={{ fontSize: '0.75rem', color: '#64748b', minWidth: 32 }}>{p.progress}%</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
