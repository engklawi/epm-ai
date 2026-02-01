import { useState, useEffect, useRef } from 'react';
import { Send, AlertCircle, AlertTriangle, Bot, Sparkles, RefreshCw, TrendingUp, TrendingDown, Calendar, Users, Clock, Zap, ChevronDown, ChevronUp, Lightbulb } from 'lucide-react';

const API = 'http://localhost:3001/api';

export default function PMAssistant() {
  const [messages, setMessages] = useState([
    {
      role: 'ai',
      content: "Hello! I'm your AI Project Management Assistant.\n\nI have real-time access to your portfolio data and can provide:\n\n• Project status & health analysis\n• Predictive risk assessment\n• Resource optimization recommendations\n• Schedule delay predictions\n• Budget variance analysis\n\nTry asking: \"What projects need attention?\" or click a quick action below.",
      suggestions: ["Show critical risks", "Portfolio overview", "Resource bottlenecks", "Budget alerts"]
    }
  ]);
  const [input, setInput] = useState('');
  const [alerts, setAlerts] = useState([]);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(false);
  const [conversationContext, setConversationContext] = useState([]);
  const [expandedProject, setExpandedProject] = useState(null);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    fetch(`${API}/alerts`).then(r => r.json()).then(setAlerts);
    fetch(`${API}/projects`).then(r => r.json()).then(setProjects);
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Generate contextual suggestions based on response
  const generateSuggestions = (response, query) => {
    const lowerResponse = response.toLowerCase();
    const suggestions = [];
    
    if (lowerResponse.includes('risk') || lowerResponse.includes('critical')) {
      suggestions.push("Show mitigation strategies");
      suggestions.push("Risk trend analysis");
    }
    if (lowerResponse.includes('budget') || lowerResponse.includes('cost')) {
      suggestions.push("Budget forecast");
      suggestions.push("Cost optimization tips");
    }
    if (lowerResponse.includes('delay') || lowerResponse.includes('schedule')) {
      suggestions.push("Recovery plan options");
      suggestions.push("Impact analysis");
    }
    if (lowerResponse.includes('resource') || lowerResponse.includes('workload')) {
      suggestions.push("Reallocation suggestions");
      suggestions.push("Capacity forecast");
    }
    if (lowerResponse.includes('project')) {
      suggestions.push("Drill down details");
      suggestions.push("Compare with peers");
    }
    
    // Default suggestions if none matched
    if (suggestions.length === 0) {
      suggestions.push("Tell me more");
      suggestions.push("What actions should I take?");
    }
    
    return suggestions.slice(0, 4);
  };

  const sendMessage = async (customMessage) => {
    const messageToSend = customMessage || input;
    if (!messageToSend.trim() || loading) return;
    
    const userMsg = { role: 'user', content: messageToSend };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);
    
    // Add to conversation context for continuity
    const newContext = [...conversationContext, { role: 'user', content: messageToSend }].slice(-6);
    
    try {
      const res = await fetch(`${API}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          message: messageToSend,
          context: newContext // Send conversation history
        })
      });
      const data = await res.json();
      const suggestions = generateSuggestions(data.response, messageToSend);
      
      setMessages(prev => [...prev, { 
        role: 'ai', 
        content: data.response,
        suggestions,
        timestamp: new Date().toLocaleTimeString()
      }]);
      
      setConversationContext([...newContext, { role: 'assistant', content: data.response }].slice(-6));
    } catch (err) {
      setMessages(prev => [...prev, { 
        role: 'ai', 
        content: 'Connection error. Please try again.',
        suggestions: ["Retry last question", "Check system status"]
      }]);
    }
    setLoading(false);
  };

  const quickQueries = [
    { label: "Portfolio Health", query: "Give me a comprehensive portfolio health overview with key metrics", icon: "📊" },
    { label: "Critical Risks", query: "What are the critical risks that need immediate attention?", icon: "⚠️" },
    { label: "Resource Issues", query: "Analyze resource workload and identify bottlenecks", icon: "👥" },
    { label: "Budget Status", query: "Show budget utilization and any variance concerns", icon: "💰" },
    { label: "Schedule Delays", query: "Which projects have schedule delays and what's the impact?", icon: "📅" },
    { label: "AI Recommendations", query: "What are your top 3 recommendations for the portfolio right now?", icon: "🤖" }
  ];

  const criticalAlerts = alerts.filter(a => a.type === 'critical');
  const warningAlerts = alerts.filter(a => a.type === 'warning');

  return (
    <div>
      <div className="page-header">
        <h1>AI Project Assistant</h1>
        <p>Intelligent AI insights with real-time portfolio data</p>
      </div>

      {/* AI Advisor Panel - Option 2: Narrative briefing style */}
      {projects.length > 0 && (
        <div style={{
          background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)',
          borderRadius: 16,
          padding: 20,
          marginBottom: 24,
          border: '1px solid #e2e8f0'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
            <div style={{
              width: 36,
              height: 36,
              borderRadius: 10,
              background: 'linear-gradient(135deg, #6366f1, #4f46e5)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 4px 12px rgba(99, 102, 241, 0.3)'
            }}>
              <Lightbulb size={18} color="white" />
            </div>
            <div>
              <div style={{ fontWeight: 700, fontSize: '1rem', color: '#1e293b' }}>AI Advisor Briefing</div>
              <div style={{ fontSize: '0.75rem', color: '#64748b' }}>Today's key recommendations based on portfolio analysis</div>
            </div>
          </div>

          <div style={{
            maxHeight: 180,
            overflowY: 'auto',
            paddingRight: 8
          }}>
            {/* Schedule Optimization Recommendations */}
            {projects.filter(p => p.aiInsights?.optimizedSchedule).slice(0, 2).map(p => (
              <div key={`schedule-${p.id}`} style={{
                display: 'flex',
                gap: 12,
                padding: '12px 14px',
                background: 'white',
                borderRadius: 10,
                marginBottom: 10,
                border: '1px solid #e2e8f0',
                alignItems: 'flex-start'
              }}>
                <div style={{
                  width: 28,
                  height: 28,
                  borderRadius: 8,
                  background: '#eef2ff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0
                }}>
                  <Calendar size={14} color="#6366f1" />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '0.8rem', color: '#64748b', marginBottom: 2 }}>Schedule Optimization</div>
                  <div style={{ fontSize: '0.9rem', color: '#1e293b', lineHeight: 1.5 }}>
                    <strong>{p.name}</strong> could save <span style={{ color: '#059669', fontWeight: 600 }}>{p.aiInsights.optimizedSchedule.timelineSavings}</span> by {p.aiInsights.optimizedSchedule.reasoning.toLowerCase()}
                  </div>
                  <div style={{ fontSize: '0.7rem', color: '#94a3b8', marginTop: 4 }}>
                    Confidence: {p.aiInsights.optimizedSchedule.confidence}%
                  </div>
                </div>
              </div>
            ))}

            {/* Resource Reallocation Recommendations */}
            {projects.filter(p => p.aiInsights?.suggestedReallocation?.length > 0).slice(0, 2).map(p => (
              p.aiInsights.suggestedReallocation.slice(0, 1).map((r, i) => (
                <div key={`resource-${p.id}-${i}`} style={{
                  display: 'flex',
                  gap: 12,
                  padding: '12px 14px',
                  background: 'white',
                  borderRadius: 10,
                  marginBottom: 10,
                  border: '1px solid #e2e8f0',
                  alignItems: 'flex-start'
                }}>
                  <div style={{
                    width: 28,
                    height: 28,
                    borderRadius: 8,
                    background: '#fef3c7',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0
                  }}>
                    <Users size={14} color="#d97706" />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '0.8rem', color: '#64748b', marginBottom: 2 }}>Resource Reallocation</div>
                    <div style={{ fontSize: '0.9rem', color: '#1e293b', lineHeight: 1.5 }}>
                      Recommend <strong>{r.action.toLowerCase()}ing {r.resource}</strong> to <strong>{p.name}</strong> ({r.hours}h/week) — expected impact: <span style={{ color: '#059669', fontWeight: 600 }}>{r.impact}</span>
                    </div>
                  </div>
                </div>
              ))
            ))}

            {/* Delay Warning */}
            {projects.filter(p => p.aiInsights?.predictedCompletion && p.aiInsights.predictedCompletion.onTimeProb < 70).map(p => (
              <div key={`delay-${p.id}`} style={{
                display: 'flex',
                gap: 12,
                padding: '12px 14px',
                background: 'white',
                borderRadius: 10,
                marginBottom: 10,
                border: '1px solid #fecaca',
                alignItems: 'flex-start'
              }}>
                <div style={{
                  width: 28,
                  height: 28,
                  borderRadius: 8,
                  background: '#fef2f2',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0
                }}>
                  <Clock size={14} color="#dc2626" />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '0.8rem', color: '#64748b', marginBottom: 2 }}>Delay Risk Alert</div>
                  <div style={{ fontSize: '0.9rem', color: '#1e293b', lineHeight: 1.5 }}>
                    <strong>{p.name}</strong> has only <span style={{ color: '#dc2626', fontWeight: 600 }}>{p.aiInsights.predictedCompletion.onTimeProb}%</span> probability of on-time completion. Consider reviewing critical path activities.
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 400px', gap: 24 }}>
        {/* Chat Panel */}
        <div style={{ 
          background: 'white', 
          borderRadius: 16, 
          border: '1px solid #e2e8f0',
          display: 'flex',
          flexDirection: 'column',
          height: 650,
          overflow: 'hidden'
        }}>
          <div style={{ 
            padding: '16px 20px', 
            borderBottom: '1px solid #e2e8f0',
            background: 'linear-gradient(135deg, #f8fafc, #f1f5f9)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ 
                width: 40, height: 40, borderRadius: 10, 
                background: 'linear-gradient(135deg, #6366f1, #4f46e5)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: '0 4px 12px rgba(99, 102, 241, 0.3)'
              }}>
                <Bot size={20} color="white" />
              </div>
              <div>
                <div style={{ fontWeight: 600, fontSize: '1rem' }}>AI Assistant</div>
                <div style={{ fontSize: '0.75rem', color: '#64748b' }}>AI-Powered • Real-time data</div>
              </div>
            </div>
            <div style={{ 
              padding: '4px 10px', 
              background: '#dcfce7', 
              borderRadius: 12, 
              fontSize: '0.7rem', 
              fontWeight: 600, 
              color: '#166534' 
            }}>
              Online
            </div>
          </div>
          
          <div style={{ flex: 1, overflow: 'auto', padding: 20, display: 'flex', flexDirection: 'column', gap: 16 }}>
            {messages.map((msg, i) => (
              <div key={i} style={{ alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start', maxWidth: '85%' }}>
                <div style={{
                  padding: '14px 18px',
                  borderRadius: msg.role === 'user' ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
                  fontSize: '0.9rem',
                  lineHeight: 1.6,
                  whiteSpace: 'pre-wrap',
                  background: msg.role === 'user' ? 'linear-gradient(135deg, #6366f1, #4f46e5)' : '#f1f5f9',
                  color: msg.role === 'user' ? 'white' : '#334155',
                  boxShadow: msg.role === 'user' ? '0 4px 12px rgba(99, 102, 241, 0.2)' : 'none'
                }}>
                  {msg.content}
                </div>
                {msg.suggestions && msg.role === 'ai' && (
                  <div style={{ display: 'flex', gap: 8, marginTop: 10, flexWrap: 'wrap' }}>
                    {msg.suggestions.map((s, j) => (
                      <button key={j} onClick={() => sendMessage(s)} style={{
                        padding: '6px 12px', fontSize: '0.75rem', background: 'white',
                        border: '1px solid #e2e8f0', borderRadius: 8, cursor: 'pointer',
                        color: '#6366f1', fontWeight: 500,
                        transition: 'all 0.2s'
                      }}>{s}</button>
                    ))}
                  </div>
                )}
                {msg.timestamp && msg.role === 'ai' && (
                  <div style={{ fontSize: '0.65rem', color: '#94a3b8', marginTop: 4 }}>{msg.timestamp}</div>
                )}
              </div>
            ))}
            {loading && (
              <div style={{ 
                display: 'flex', alignItems: 'center', gap: 8, 
                color: '#6366f1', fontSize: '0.85rem', fontWeight: 500 
              }}>
                <RefreshCw size={14} className="animate-spin" style={{ animation: 'spin 1s linear infinite' }} />
                Analyzing portfolio data...
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
          
          <div style={{ padding: 16, borderTop: '1px solid #e2e8f0', background: '#fafafa' }}>
            <div style={{ display: 'flex', gap: 10, marginBottom: 12 }}>
              <input
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyPress={e => e.key === 'Enter' && sendMessage()}
                placeholder="Ask about projects, risks, resources, schedules..."
                style={{ 
                  flex: 1, padding: '14px 18px', border: '1px solid #e2e8f0', 
                  borderRadius: 12, fontSize: '0.9rem', background: 'white',
                  outline: 'none'
                }}
              />
              <button onClick={() => sendMessage()} disabled={loading} style={{ 
                padding: '14px 18px', background: 'linear-gradient(135deg, #6366f1, #4f46e5)', 
                color: 'white', border: 'none', borderRadius: 12, cursor: 'pointer',
                boxShadow: '0 4px 12px rgba(99, 102, 241, 0.3)',
                opacity: loading ? 0.7 : 1
              }}>
                <Send size={18} />
              </button>
            </div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {quickQueries.map(q => (
                <button key={q.label} onClick={() => sendMessage(q.query)} style={{
                  padding: '8px 14px', fontSize: '0.75rem', background: 'white',
                  border: '1px solid #e2e8f0', borderRadius: 8, cursor: 'pointer',
                  display: 'flex', alignItems: 'center', gap: 6,
                  transition: 'all 0.2s'
                }}>
                  <span>{q.icon}</span> {q.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Right Panel */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Real-time Alerts */}
          <div style={{ background: 'white', borderRadius: 16, padding: 20, border: '1px solid #e2e8f0' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
              <h3 style={{ fontSize: '0.8rem', fontWeight: 600, color: '#1e293b', display: 'flex', alignItems: 'center', gap: 8 }}>
                <AlertTriangle size={16} color="#f59e0b" /> Real-time Alerts
              </h3>
              <span style={{ 
                padding: '2px 8px', 
                background: criticalAlerts.length > 0 ? '#fef2f2' : '#f0fdf4', 
                borderRadius: 8, 
                fontSize: '0.7rem', 
                fontWeight: 600,
                color: criticalAlerts.length > 0 ? '#dc2626' : '#16a34a'
              }}>
                {criticalAlerts.length} Critical
              </span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {alerts.slice(0, 5).map((alert, i) => (
                <div key={i} style={{
                  display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px',
                  borderRadius: 10,
                  background: alert.type === 'critical' ? '#fef2f2' : '#fffbeb',
                  border: `1px solid ${alert.type === 'critical' ? '#fecaca' : '#fde68a'}`,
                  cursor: 'pointer',
                  transition: 'transform 0.2s'
                }} onClick={() => sendMessage(`Tell me more about: ${alert.message}`)}>
                  {alert.type === 'critical' ? 
                    <AlertCircle size={14} color="#dc2626" /> : 
                    <AlertTriangle size={14} color="#d97706" />
                  }
                  <span style={{ fontSize: '0.8rem', fontWeight: 500, flex: 1 }}>{alert.message}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Portfolio Overview */}
          <div style={{ background: 'white', borderRadius: 16, padding: 20, border: '1px solid #e2e8f0' }}>
            <h3 style={{ fontSize: '0.8rem', fontWeight: 600, color: '#1e293b', marginBottom: 16 }}>
              Portfolio Overview
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12, marginBottom: 16 }}>
              {[
                { v: projects.length, l: 'Total', c: '#1e293b', bg: '#f8fafc' },
                { v: projects.filter(p => p.health === 'green').length, l: 'On Track', c: '#059669', bg: '#f0fdf4' },
                { v: projects.filter(p => p.health === 'yellow').length, l: 'At Risk', c: '#d97706', bg: '#fffbeb' },
                { v: projects.filter(p => p.health === 'red').length, l: 'Critical', c: '#dc2626', bg: '#fef2f2' },
              ].map((s, i) => (
                <div key={i} style={{ textAlign: 'center', padding: '12px 8px', background: s.bg, borderRadius: 10 }}>
                  <div style={{ fontSize: '1.5rem', fontWeight: 700, color: s.c }}>{s.v}</div>
                  <div style={{ fontSize: '0.65rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 600 }}>{s.l}</div>
                </div>
              ))}
            </div>
            
            {/* Option 1: Expandable Project Cards with AI Insights */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {projects.map(p => (
                <div key={p.id}>
                  <div style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '10px 12px',
                    background: expandedProject === p.id ? '#eef2ff' : '#f8fafc',
                    borderRadius: expandedProject === p.id ? '10px 10px 0 0' : 10,
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    border: expandedProject === p.id ? '1px solid #c7d2fe' : '1px solid transparent'
                  }} onClick={() => setExpandedProject(expandedProject === p.id ? null : p.id)}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      {expandedProject === p.id ?
                        <ChevronUp size={14} color="#6366f1" /> :
                        <ChevronDown size={14} color="#94a3b8" />
                      }
                      <div>
                        <div style={{ fontWeight: 600, fontSize: '0.85rem', marginBottom: 2 }}>{p.name}</div>
                        <div style={{ fontSize: '0.7rem', color: '#64748b' }}>{p.pmName}</div>
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{
                          fontSize: '0.85rem', fontWeight: 700,
                          color: p.health === 'green' ? '#059669' : p.health === 'yellow' ? '#d97706' : '#dc2626'
                        }}>{p.progress}%</div>
                      </div>
                      {p.health === 'red' ?
                        <TrendingDown size={16} color="#dc2626" /> :
                        <TrendingUp size={16} color="#059669" />
                      }
                    </div>
                  </div>

                  {/* Expanded AI Insights for this project */}
                  {expandedProject === p.id && p.aiInsights && (
                    <div style={{
                      background: '#f8fafc',
                      borderRadius: '0 0 10px 10px',
                      padding: '12px',
                      borderTop: 'none',
                      border: '1px solid #c7d2fe',
                      borderTop: '1px dashed #c7d2fe'
                    }}>
                      {/* Schedule Optimization */}
                      {p.aiInsights.optimizedSchedule && (
                        <div style={{
                          display: 'flex',
                          gap: 10,
                          marginBottom: 10,
                          padding: '8px 10px',
                          background: 'white',
                          borderRadius: 8,
                          alignItems: 'flex-start'
                        }}>
                          <Calendar size={14} color="#6366f1" style={{ marginTop: 2 }} />
                          <div style={{ flex: 1 }}>
                            <div style={{ fontSize: '0.7rem', color: '#6366f1', fontWeight: 600, marginBottom: 2 }}>SCHEDULE</div>
                            <div style={{ fontSize: '0.8rem', color: '#334155' }}>
                              Potential savings of <strong>{p.aiInsights.optimizedSchedule.timelineSavings}</strong>
                            </div>
                            <div style={{ fontSize: '0.7rem', color: '#64748b', marginTop: 2 }}>
                              {p.aiInsights.optimizedSchedule.reasoning}
                            </div>
                          </div>
                          <div style={{
                            padding: '2px 6px',
                            background: '#eef2ff',
                            borderRadius: 4,
                            fontSize: '0.65rem',
                            color: '#6366f1',
                            fontWeight: 600
                          }}>
                            {p.aiInsights.optimizedSchedule.confidence}%
                          </div>
                        </div>
                      )}

                      {/* Resource Suggestions */}
                      {p.aiInsights.suggestedReallocation?.length > 0 && (
                        <div style={{
                          display: 'flex',
                          gap: 10,
                          marginBottom: 10,
                          padding: '8px 10px',
                          background: 'white',
                          borderRadius: 8,
                          alignItems: 'flex-start'
                        }}>
                          <Users size={14} color="#d97706" style={{ marginTop: 2 }} />
                          <div style={{ flex: 1 }}>
                            <div style={{ fontSize: '0.7rem', color: '#d97706', fontWeight: 600, marginBottom: 2 }}>RESOURCES</div>
                            {p.aiInsights.suggestedReallocation.slice(0, 2).map((r, i) => (
                              <div key={i} style={{ fontSize: '0.8rem', color: '#334155', marginBottom: 2 }}>
                                {r.action} <strong>{r.resource}</strong> • {r.hours}h/week → <span style={{ color: '#059669' }}>{r.impact}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Delay Predictions */}
                      {p.aiInsights.predictedCompletion && (
                        <div style={{
                          display: 'flex',
                          gap: 10,
                          padding: '8px 10px',
                          background: 'white',
                          borderRadius: 8,
                          alignItems: 'center'
                        }}>
                          <Clock size={14} color="#dc2626" />
                          <div style={{ fontSize: '0.7rem', color: '#dc2626', fontWeight: 600 }}>DELAY RISK</div>
                          <div style={{ display: 'flex', gap: 6, flex: 1 }}>
                            <div style={{
                              padding: '2px 8px',
                              background: p.aiInsights.predictedCompletion.onTimeProb >= 70 ? '#dcfce7' : '#fef2f2',
                              borderRadius: 4,
                              fontSize: '0.7rem',
                              fontWeight: 600,
                              color: p.aiInsights.predictedCompletion.onTimeProb >= 70 ? '#166534' : '#dc2626'
                            }}>
                              {p.aiInsights.predictedCompletion.onTimeProb}% On-Time
                            </div>
                            <div style={{
                              padding: '2px 8px',
                              background: '#fffbeb',
                              borderRadius: 4,
                              fontSize: '0.7rem',
                              color: '#92400e'
                            }}>
                              {p.aiInsights.predictedCompletion.delay1MonthProb}% 1mo delay
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Ask AI Button */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          sendMessage(`Give me detailed analysis and recommendations for ${p.name}`);
                        }}
                        style={{
                          marginTop: 10,
                          width: '100%',
                          padding: '8px',
                          background: 'linear-gradient(135deg, #6366f1, #4f46e5)',
                          color: 'white',
                          border: 'none',
                          borderRadius: 6,
                          fontSize: '0.75rem',
                          fontWeight: 600,
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: 6
                        }}
                      >
                        <Sparkles size={12} /> Ask AI for Full Analysis
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
      
      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
