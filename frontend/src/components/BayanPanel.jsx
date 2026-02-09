import { useState, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { Send, Mic, MicOff, Loader, CheckCircle, XCircle, TrendingUp, Users, BarChart3, AlertTriangle, Lightbulb } from 'lucide-react';
import { API, authFetch } from '../utils/authFetch';

// Page context mapping — tells Bayan where the user is and what data they're viewing
const PAGE_CONTEXT = {
  '/': { name: 'Portfolio Dashboard', context: 'Portfolio Dashboard with project health, budgets, and analytics.', suggestions: ['Explain this dashboard', 'Which project needs attention?', 'Summarize portfolio health'] },
  '/dashboard': { name: 'Portfolio Dashboard', context: 'Portfolio Dashboard with project health statuses, budget charts, AI executive summary, and What-If Simulator.', suggestions: ['Explain this dashboard', 'Which project needs attention?', 'Summarize portfolio health'] },
  '/strategy': { name: 'Strategy & ROI', context: 'Strategy & ROI page showing ROI comparison, strategic objectives, and alignment radar chart.', suggestions: ['Which project has the best ROI?', 'Are we aligned with Vision 2030?', 'Strategic gaps analysis'] },
  '/pmo': { name: 'PMO Performance', context: 'PMO Performance metrics including delivery success rates, budget accuracy, and resource utilization.', suggestions: ['How is our delivery rate?', 'Resource utilization concerns?', 'Compare quarters'] },
  '/alignment': { name: 'Strategic Alignment', context: 'Strategic Alignment scoring, mapping projects to organizational objectives.', suggestions: ['Which projects are misaligned?', 'Reprioritization recommendations', 'Alignment breakdown'] },
  '/risks': { name: 'Risk Center', context: 'Risk Center with risk matrix, critical risk cards, Monte Carlo simulations, and mitigation recommendations.', suggestions: ['What is the top risk?', 'Mitigation plan for budget overrun', 'Risk trend analysis'] },
  '/docs': { name: 'Document Generation', context: 'Document Generation page for creating status reports, project charters, and meeting summaries.', suggestions: ['Generate status report', 'What documents should I prepare?', 'Summarize latest report'] },
  '/predictions': { name: 'Executive Predictions', context: 'Executive Predictions including budget overrun probability, resource strain forecasts, and scenario analysis.', suggestions: ['Biggest predicted risk?', 'How accurate are predictions?', 'Best vs worst case'] },
  '/pm-scores': { name: 'PM Scoring', context: 'PM Scoring with performance leaderboard, competency radar charts, and trend indicators.', suggestions: ['Top performing PM?', 'Which PM needs support?', 'Compare PMs'] },
  '/pm-dev': { name: 'PM Development', context: 'PM Development with training recommendations, mentorship pairings, and skill gap analysis.', suggestions: ['Most urgent training?', 'Mentorship suggestions', 'Skill gap analysis'] },
};

// Bayan Avatar - will use a real photo with fallback
const BayanAvatar = ({ size = 48, pulse = false }) => {
  const [imageError, setImageError] = useState(false);

  return (
    <div style={{
      width: size, height: size, borderRadius: '50%', flexShrink: 0,
      background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      position: 'relative',
      boxShadow: pulse ? '0 0 0 3px rgba(99, 102, 241, 0.3)' : 'none',
      animation: pulse ? 'avatar-pulse 2s ease-in-out infinite' : 'none',
      overflow: 'hidden'
    }}>
      {!imageError ? (
        <img
          src="/bayan_avatar.png"
          alt="Bayan"
          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          onError={() => setImageError(true)}
        />
      ) : (
        <svg width={size * 0.5} height={size * 0.5} viewBox="0 0 16 16" fill="none">
          <path d="M8 2 L12 8 L8 14 L4 8 Z" fill="white" opacity="0.9" />
        </svg>
      )}
    </div>
  );
};

const BayanAvatarSmall = () => {
  const [imageError, setImageError] = useState(false);

  return (
    <div style={{
      width: 28, height: 28, borderRadius: '50%', flexShrink: 0,
      background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      overflow: 'hidden'
    }}>
      {!imageError ? (
        <img
          src="/bayan_avatar.png"
          alt="Bayan"
          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          onError={() => setImageError(true)}
        />
      ) : (
        <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
          <path d="M8 2 L12 8 L8 14 L4 8 Z" fill="white" opacity="0.9" />
        </svg>
      )}
    </div>
  );
};

export default function BayanPanel() {
  const location = useLocation();
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [conversationContext, setConversationContext] = useState([]);
  const [isListening, setIsListening] = useState(false);
  const [voiceLang, setVoiceLang] = useState('en-US');
  const messagesEndRef = useRef(null);
  const recognitionRef = useRef(null);
  const textareaRef = useRef(null);
  const prevPathRef = useRef(location.pathname);
  const [initialized, setInitialized] = useState(false);

  const pageCtx = PAGE_CONTEXT[location.pathname] || PAGE_CONTEXT['/dashboard'];

  // Initialize with greeting on first render
  useEffect(() => {
    if (!initialized) {
      setMessages([{
        role: 'ai',
        content: `Good ${new Date().getHours() < 12 ? 'morning' : new Date().getHours() < 17 ? 'afternoon' : 'evening'}! I'm Bayan, your AI PMO Director.\n\nI've already scanned your entire portfolio \u2014 5 projects, 37 tasks, 4 PMs, and 6 active risks. I'm connected live to Project Server and ready to take action.\n\n⚠️ Quick heads up: I'm seeing a pattern on Customer Portal that needs your attention. Want me to brief you?`,
        suggestions: pageCtx.suggestions,
      }]);
      setInitialized(true);
    }
  }, [initialized]);

  // When page changes, add a contextual message
  useEffect(() => {
    if (prevPathRef.current !== location.pathname && initialized) {
      prevPathRef.current = location.pathname;
      const newPageCtx = PAGE_CONTEXT[location.pathname] || PAGE_CONTEXT['/dashboard'];
      setMessages(prev => [...prev, {
        role: 'ai',
        content: `I see you've navigated to ${newPageCtx.name}. ${getPageInsight(location.pathname)}\n\nHow can I help you here?`,
        suggestions: newPageCtx.suggestions,
        isNavigation: true,
      }]);
    }
  }, [location.pathname, initialized]);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Get a brief insight about the current page
  function getPageInsight(path) {
    const insights = {
      '/dashboard': "I can see 2 projects in GREEN, 2 in YELLOW, and 1 in RED. Customer Portal needs immediate attention \u2014 it's burning budget 2.3x faster than progress.",
      '/strategy': "Your Digital Transformation objective is 92% aligned, but Customer Experience is at risk if Customer Portal slips further.",
      '/pmo': "PMO performance looks strong overall, but I'm detecting a workload imbalance \u2014 Fatima Hassan is carrying 30% more than the team average.",
      '/alignment': "I've mapped all 5 projects against 4 strategic objectives. One gap stands out: Cost Optimization has only one supporting project.",
      '/risks': "⚠️ 3 of your 6 risks are trending UPWARD this month, and they're all clustering on Customer Portal. This isn't coincidence \u2014 it's a systemic issue.",
      '/docs': "I can generate executive-ready status reports, project charters, or meeting summaries in seconds. Which project should I write about?",
      '/predictions': "My forecast models show Cloud Migration has an 85% success probability, but Customer Portal is at only 30% without intervention.",
      '/pm-scores': "Mohammed Ali leads on delivery (92 score), while Sarah Ahmed excels at stakeholder management (95). But Fatima's scores are declining due to overload.",
      '/pm-dev': "I've identified a mentorship opportunity: pairing Mohammed Ali with Sarah Ahmed could boost both their weaker areas.",
    };
    return insights[path] || "I'm ready to assist.";
  }

  // Voice input
  const toggleVoice = () => {
    if (!('webkitSpeechRecognition' in window || 'SpeechRecognition' in window)) {
      alert('Voice input requires Chrome.');
      return;
    }
    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
      return;
    }
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    recognition.lang = voiceLang;
    recognition.interimResults = true;
    recognition.continuous = false;
    recognition.onresult = (event) => {
      const transcript = Array.from(event.results).map(r => r[0].transcript).join('');
      setInput(transcript);
      if (event.results[0].isFinal) {
        setIsListening(false);
      }
    };
    recognition.onerror = () => setIsListening(false);
    recognition.onend = () => setIsListening(false);
    recognitionRef.current = recognition;
    recognition.start();
    setIsListening(true);
  };

  // Execute confirmed action
  const executeAction = async (msgIndex, action) => {
    setMessages(prev => prev.map((msg, i) => i === msgIndex ? { ...msg, actionStatus: 'executing' } : msg));
    try {
      const res = await authFetch(`${API}/chat/execute`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: action.type, params: action.params })
      });
      const data = await res.json();
      if (data.success) {
        setMessages(prev => [
          ...prev.map((msg, i) => i === msgIndex ? { ...msg, actionStatus: 'success' } : msg),
          { role: 'ai', content: `Done ✓ ${data.message}` }
        ]);
      } else {
        setMessages(prev => [
          ...prev.map((msg, i) => i === msgIndex ? { ...msg, actionStatus: 'failed' } : msg),
          { role: 'ai', content: `Failed: ${data.error}` }
        ]);
      }
    } catch (err) {
      setMessages(prev => [
        ...prev.map((msg, i) => i === msgIndex ? { ...msg, actionStatus: 'failed' } : msg),
        { role: 'ai', content: `Error: ${err.message}` }
      ]);
    }
  };

  const cancelAction = (msgIndex) => {
    setMessages(prev => [
      ...prev.map((msg, i) => i === msgIndex ? { ...msg, actionStatus: 'cancelled' } : msg),
      { role: 'ai', content: 'Cancelled. No changes made.' }
    ]);
  };

  // Auto-resize textarea
  const handleInputChange = (e) => {
    setInput(e.target.value);
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      textarea.style.height = Math.min(textarea.scrollHeight, 120) + 'px';
    }
  };

  // Reset textarea height after sending
  const resetTextareaHeight = () => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
    }
  };

  // Send message with page context
  const sendMessage = async (customMessage) => {
    const messageToSend = customMessage || input;
    if (!messageToSend.trim() || loading) return;

    setMessages(prev => [...prev, { role: 'user', content: messageToSend }]);
    setInput('');
    resetTextareaHeight();
    setLoading(true);

    const newContext = [...conversationContext, { role: 'user', content: messageToSend }].slice(-6);

    // Include page context so Bayan knows where the user is
    const contextPrefix = `[Page Context: User is viewing "${pageCtx.name}". ${pageCtx.context}]\n\n`;

    try {
      const res = await authFetch(`${API}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: contextPrefix + messageToSend,
          context: newContext
        })
      });
      const data = await res.json();

      setMessages(prev => [...prev, {
        role: 'ai',
        content: data.response,
        action: data.action || null,
        actionStatus: data.action ? 'pending' : null,
        suggestions: data.action ? [] : pageCtx.suggestions.slice(0, 2),
      }]);
      setConversationContext([...newContext, { role: 'assistant', content: data.response }].slice(-6));
    } catch (err) {
      setMessages(prev => [...prev, {
        role: 'ai',
        content: 'Connection error. Please try again.',
      }]);
    }
    setLoading(false);
  };

  return (
    <aside className="bayan-panel">
      {/* Header - Compact */}
      <div className="bayan-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <BayanAvatar size={36} pulse={loading} />
          <div>
            <div style={{ fontWeight: 600, fontSize: '0.9rem', color: '#374151' }}>Bayan</div>
            <div style={{ fontSize: '0.65rem', color: '#9ca3af', display: 'flex', alignItems: 'center', gap: 4 }}>
              <span style={{ width: 5, height: 5, borderRadius: '50%', background: '#22c55e', display: 'inline-block' }} />
              {pageCtx.name}
            </div>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="bayan-messages">
        {messages.map((msg, i) => (
          <div key={i} className={`bayan-message ${msg.role} ${msg.isNavigation ? 'navigation' : ''}`}>
            {msg.role === 'ai' && <BayanAvatarSmall />}
            <div className="message-content">
              <div className={`message-bubble ${msg.role}`}>
                {msg.content}
              </div>

              {/* Action Confirmation Card */}
              {msg.action && msg.role === 'ai' && (
                <div className={`action-card ${msg.actionStatus}`}>
                  <div className="action-header">
                    <div className={`action-icon ${msg.action.type}`}>
                      {msg.action.type === 'update_task_progress' ? <TrendingUp size={14} color="white" /> : <Users size={14} color="white" />}
                    </div>
                    <div className="action-title">
                      {msg.action.type === 'update_task_progress' ? 'Update Task' : 'Assign Resource'}
                    </div>
                  </div>
                  <div className="action-description">{msg.action.description}</div>

                  {msg.actionStatus === 'pending' && (
                    <div className="action-buttons">
                      <button className="confirm" onClick={() => executeAction(i, msg.action)}>
                        <CheckCircle size={14} /> Confirm
                      </button>
                      <button className="cancel" onClick={() => cancelAction(i)}>
                        <XCircle size={14} /> Cancel
                      </button>
                    </div>
                  )}
                  {msg.actionStatus === 'executing' && (
                    <div className="action-status executing">
                      <Loader size={14} className="spin" /> Executing...
                    </div>
                  )}
                  {msg.actionStatus === 'success' && (
                    <div className="action-status success">
                      <CheckCircle size={13} /> Completed
                    </div>
                  )}
                </div>
              )}

              {/* Suggestions */}
              {msg.suggestions && msg.suggestions.length > 0 && msg.role === 'ai' && (
                <div className="suggestions">
                  {msg.suggestions.map((s, j) => (
                    <button key={j} onClick={() => sendMessage(s)} className="suggestion-btn">{s}</button>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}
        {loading && (
          <div className="bayan-message ai">
            <BayanAvatarSmall />
            <div className="message-content">
              <div className="message-bubble ai loading-bubble">
                <Loader size={14} className="spin" /> Analyzing...
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Quick Actions - More compact */}
      <div className="bayan-quick-actions">
        <button onClick={() => sendMessage('Portfolio health summary')}>
          <BarChart3 size={12} /> Portfolio
        </button>
        <button onClick={() => sendMessage('What are the critical risks?')}>
          <AlertTriangle size={12} /> Risks
        </button>
        <button onClick={() => sendMessage('Your top recommendations')}>
          <Lightbulb size={12} /> Tips
        </button>
      </div>

      {/* Input - More compact */}
      <div className="bayan-input">
        <button
          onClick={() => setVoiceLang(voiceLang === 'en-US' ? 'ar-SA' : 'en-US')}
          className="lang-toggle-btn"
          title={voiceLang === 'en-US' ? 'Switch voice to Arabic' : 'Switch voice to English'}
        >
          {voiceLang === 'en-US' ? 'EN' : 'ع'}
        </button>
        <button onClick={toggleVoice} className={`voice-btn ${isListening ? 'listening' : ''}`}>
          {isListening ? <MicOff size={18} /> : <Mic size={18} />}
        </button>
        <textarea
          ref={textareaRef}
          value={input}
          onChange={handleInputChange}
          onKeyDown={e => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              sendMessage();
            }
          }}
          placeholder={voiceLang === 'en-US' ? 'Ask Bayan...' : '...اسأل بيان'}
          dir={voiceLang === 'ar-SA' ? 'rtl' : 'ltr'}
          rows={1}
        />
        <button onClick={() => sendMessage()} disabled={loading} className="send-btn">
          <Send size={18} />
        </button>
      </div>

      <style>{`
        .bayan-panel {
          width: 350px;
          height: 100vh;
          background: #f8fafc;
          border-left: 1px solid #e2e8f0;
          display: flex;
          flex-direction: column;
          flex-shrink: 0;
          position: fixed;
          right: 0;
          top: 0;
          z-index: 90;
        }

        .bayan-header {
          padding: 14px 16px;
          background: #f8fafc;
          border-bottom: 1px solid #e2e8f0;
        }

        .bayan-header div:first-child > div:last-child > div:first-child {
          color: #1e293b !important;
          font-weight: 600;
        }

        .bayan-header div:first-child > div:last-child > div:last-child {
          color: #64748b !important;
        }

        .bayan-header div:first-child > div:last-child > div:last-child span {
          background: #22c55e !important;
          box-shadow: 0 0 6px rgba(34, 197, 94, 0.5);
        }

        .bayan-messages {
          flex: 1;
          overflow-y: auto;
          padding: 14px;
          display: flex;
          flex-direction: column;
          gap: 14px;
          background: transparent;
        }

        .bayan-message {
          display: flex;
          gap: 8px;
          max-width: 100%;
        }

        .bayan-message.user {
          flex-direction: row-reverse;
        }

        .bayan-message.navigation {
          opacity: 0.85;
        }

        .message-content {
          flex: 1;
          min-width: 0;
        }

        .message-bubble {
          padding: 12px 14px;
          border-radius: 14px;
          font-size: 0.85rem;
          line-height: 1.6;
          white-space: pre-wrap;
        }

        .message-bubble.ai {
          background: white;
          color: #374151;
          border: 1px solid rgba(99, 102, 241, 0.12);
          border-bottom-left-radius: 4px;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
        }

        .message-bubble.user {
          background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
          color: white;
          border-bottom-right-radius: 4px;
          box-shadow: 0 2px 8px rgba(99, 102, 241, 0.25);
        }

        .message-bubble.loading-bubble {
          display: flex;
          align-items: center;
          gap: 6px;
          color: #6366f1;
          font-weight: 500;
          background: linear-gradient(135deg, #eef2ff 0%, #faf5ff 100%);
          border: 1px solid rgba(99, 102, 241, 0.15);
        }

        .action-card {
          margin-top: 8px;
          padding: 12px;
          border-radius: 12px;
          border: 1px solid rgba(99, 102, 241, 0.2);
          background: linear-gradient(135deg, #ffffff 0%, #fafaff 100%);
          box-shadow: 0 2px 8px rgba(99, 102, 241, 0.08);
        }

        .action-card.success {
          border-color: rgba(34, 197, 94, 0.3);
          background: linear-gradient(135deg, #f0fdf4 0%, #ecfdf5 100%);
        }

        .action-card.failed {
          border-color: rgba(239, 68, 68, 0.3);
          background: linear-gradient(135deg, #fef2f2 0%, #fff1f2 100%);
        }

        .action-header {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 8px;
        }

        .action-icon {
          width: 26px;
          height: 26px;
          border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        }

        .action-icon.update_task_progress {
          background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
        }

        .action-icon.assign_resource {
          background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
        }

        .action-title {
          font-weight: 600;
          font-size: 0.75rem;
          color: #374151;
        }

        .action-description {
          padding: 8px 10px;
          background: rgba(99, 102, 241, 0.04);
          border-radius: 8px;
          font-size: 0.75rem;
          color: #4b5563;
          margin-bottom: 8px;
          font-weight: 500;
          border: 1px solid rgba(99, 102, 241, 0.08);
        }

        .action-buttons {
          display: flex;
          gap: 6px;
        }

        .action-buttons button {
          flex: 1;
          padding: 8px;
          font-size: 0.75rem;
          font-weight: 600;
          border-radius: 8px;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 4px;
          transition: all 0.2s;
        }

        .action-buttons .confirm {
          background: linear-gradient(135deg, #22c55e 0%, #16a34a 100%);
          color: white;
          border: none;
          box-shadow: 0 2px 6px rgba(34, 197, 94, 0.3);
        }

        .action-buttons .confirm:hover {
          transform: translateY(-1px);
          box-shadow: 0 4px 8px rgba(34, 197, 94, 0.4);
        }

        .action-buttons .cancel {
          background: white;
          color: #6b7280;
          border: 1px solid #e5e7eb;
        }

        .action-buttons .cancel:hover {
          background: #f9fafb;
          border-color: #d1d5db;
        }

        .action-status {
          font-size: 0.75rem;
          font-weight: 600;
          display: flex;
          align-items: center;
          gap: 4px;
        }

        .action-status.executing {
          color: #6366f1;
          justify-content: center;
          padding: 6px;
        }

        .action-status.success {
          color: #16a34a;
        }

        .suggestions {
          display: flex;
          gap: 4px;
          margin-top: 8px;
          flex-wrap: wrap;
        }

        .suggestion-btn {
          padding: 5px 10px;
          font-size: 0.7rem;
          background: linear-gradient(135deg, #ffffff 0%, #fafaff 100%);
          border: 1px solid rgba(99, 102, 241, 0.2);
          border-radius: 8px;
          cursor: pointer;
          color: #6366f1;
          font-weight: 500;
          transition: all 0.2s;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
        }

        .suggestion-btn:hover {
          background: linear-gradient(135deg, #eef2ff 0%, #faf5ff 100%);
          border-color: rgba(99, 102, 241, 0.35);
          transform: translateY(-1px);
          box-shadow: 0 2px 6px rgba(99, 102, 241, 0.12);
        }

        .bayan-quick-actions {
          padding: 10px 14px;
          border-top: 1px solid rgba(99, 102, 241, 0.1);
          display: flex;
          gap: 6px;
          background: rgba(255, 255, 255, 0.8);
          backdrop-filter: blur(8px);
        }

        .bayan-quick-actions button {
          flex: 1;
          padding: 7px 8px;
          font-size: 0.7rem;
          background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
          border: 1px solid rgba(99, 102, 241, 0.12);
          border-radius: 8px;
          cursor: pointer;
          color: #64748b;
          font-weight: 500;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 4px;
          transition: all 0.2s;
        }

        .bayan-quick-actions button:hover {
          background: linear-gradient(135deg, #eef2ff 0%, #faf5ff 100%);
          color: #6366f1;
          border-color: rgba(99, 102, 241, 0.25);
          transform: translateY(-1px);
        }

        .bayan-input {
          padding: 12px 14px;
          border-top: 1px solid rgba(99, 102, 241, 0.1);
          display: flex;
          gap: 8px;
          align-items: flex-end;
          background: rgba(255, 255, 255, 0.9);
          backdrop-filter: blur(8px);
        }

        .bayan-input textarea {
          flex: 1;
          padding: 10px 12px;
          border: 1px solid rgba(99, 102, 241, 0.15);
          border-radius: 10px;
          font-size: 0.8rem;
          outline: none;
          transition: border-color 0.2s, background 0.2s, box-shadow 0.2s;
          background: #fafaff;
          resize: none;
          overflow-y: auto;
          min-height: 42px;
          max-height: 120px;
          line-height: 1.4;
          font-family: inherit;
        }

        .bayan-input textarea:focus {
          border-color: rgba(99, 102, 241, 0.4);
          background: white;
          box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.08);
        }

        .lang-toggle-btn {
          width: 34px;
          height: 42px;
          border-radius: 8px;
          border: 1px solid rgba(99, 102, 241, 0.15);
          background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
          color: #6366f1;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 0.7rem;
          font-weight: 700;
          transition: all 0.2s;
          flex-shrink: 0;
        }

        .lang-toggle-btn:hover {
          background: linear-gradient(135deg, #eef2ff 0%, #faf5ff 100%);
          border-color: rgba(99, 102, 241, 0.3);
        }

        .voice-btn {
          width: 42px;
          height: 42px;
          border-radius: 10px;
          border: 1px solid rgba(99, 102, 241, 0.15);
          background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
          color: #9ca3af;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s;
        }

        .voice-btn:hover {
          background: linear-gradient(135deg, #eef2ff 0%, #faf5ff 100%);
          color: #6366f1;
          border-color: rgba(99, 102, 241, 0.3);
        }

        .voice-btn.listening {
          background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
          border-color: transparent;
          color: white;
          animation: pulse-voice 1s ease-in-out infinite;
          box-shadow: 0 2px 8px rgba(239, 68, 68, 0.4);
        }

        .send-btn {
          width: 42px;
          height: 42px;
          border-radius: 10px;
          border: none;
          background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
          color: white;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s;
          box-shadow: 0 2px 8px rgba(99, 102, 241, 0.3);
        }

        .send-btn:hover {
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(99, 102, 241, 0.4);
        }

        .send-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
          transform: none;
          box-shadow: none;
        }

        .spin {
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }

        @keyframes avatar-pulse {
          0%, 100% { box-shadow: 0 0 0 2px rgba(99, 102, 241, 0.2); }
          50% { box-shadow: 0 0 0 4px rgba(99, 102, 241, 0.1); }
        }

        @keyframes pulse-voice {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.05); }
        }
      `}</style>
    </aside>
  );
}
