import { useState, useEffect } from 'react';
import { FileText, Download, Sparkles, CheckCircle, Clock, RefreshCw, FileCode, FilePlus } from 'lucide-react';
import { API, authFetch } from '../utils/authFetch';

export default function Documentation() {
  const [projects, setProjects] = useState([]);
  const [selectedProject, setSelectedProject] = useState('');
  const [selectedType, setSelectedType] = useState('status-report');
  const [document, setDocument] = useState(null);
  const [loading, setLoading] = useState(false);
  const [recentDocs, setRecentDocs] = useState([]);

  useEffect(() => {
    authFetch(`${API}/projects`).then(r => r.json()).then(data => {
      setProjects(data);
      if (data.length > 0) setSelectedProject(data[0].id);
    });
  }, []);

  const documentTypes = [
    { id: 'status-report', name: 'Status Report', icon: FileText, desc: 'Weekly/monthly project status update', color: '#6366f1' },
    { id: 'charter', name: 'Project Charter', icon: FilePlus, desc: 'Project initiation document', color: '#10b981' },
    { id: 'meeting-summary', name: 'Meeting Summary', icon: FileCode, desc: 'Meeting minutes with action items', color: '#f59e0b' },
  ];

  const generateDocument = async () => {
    if (!selectedProject) return;
    setLoading(true);
    setDocument(null);
    
    try {
      const res = await authFetch(`${API}/documents/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: selectedType, projectId: selectedProject })
      });
      const data = await res.json();
      setDocument(data);
      
      const project = projects.find(p => p.id === selectedProject);
      setRecentDocs(prev => [{
        title: data.title,
        type: selectedType,
        project: project?.name,
        time: new Date().toLocaleTimeString(),
        sections: data.sections?.length || 0
      }, ...prev.slice(0, 4)]);
    } catch (err) {
      setDocument({ error: 'Failed to generate document. Please try again.' });
    }
    setLoading(false);
  };

  const selectedProjectData = projects.find(p => p.id === selectedProject);

  return (
    <div>
      <div className="page-header">
        <h1>AI Document Generation</h1>
        <p>Generate professional project documents instantly using AI</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '350px 1fr', gap: 24 }}>
        {/* Left Panel - Controls */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* Document Type Selection */}
          <div style={{ background: 'white', borderRadius: 16, padding: 24, border: '1px solid #e2e8f0' }}>
            <h3 style={{ fontSize: '0.85rem', fontWeight: 600, marginBottom: 16, color: '#1e293b' }}>Document Type</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {documentTypes.map(type => (
                <div
                  key={type.id}
                  onClick={() => setSelectedType(type.id)}
                  style={{
                    padding: 16,
                    borderRadius: 12,
                    border: `2px solid ${selectedType === type.id ? type.color : '#e2e8f0'}`,
                    background: selectedType === type.id ? `${type.color}08` : 'white',
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{ 
                      width: 36, height: 36, borderRadius: 10, 
                      background: `${type.color}15`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center'
                    }}>
                      <type.icon size={18} color={type.color} />
                    </div>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>{type.name}</div>
                      <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{type.desc}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Project Selection */}
          <div style={{ background: 'white', borderRadius: 16, padding: 24, border: '1px solid #e2e8f0' }}>
            <h3 style={{ fontSize: '0.85rem', fontWeight: 600, marginBottom: 16, color: '#1e293b' }}>Select Project</h3>
            <select
              value={selectedProject}
              onChange={e => setSelectedProject(e.target.value)}
              style={{
                width: '100%', padding: '14px 16px', borderRadius: 10,
                border: '1px solid #e2e8f0', fontSize: '0.9rem',
                background: 'white', cursor: 'pointer'
              }}
            >
              {projects.map(p => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>

            {selectedProjectData && (
              <div style={{ marginTop: 16, padding: 14, background: '#f8fafc', borderRadius: 10 }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div>
                    <div style={{ fontSize: '0.7rem', color: '#64748b', textTransform: 'uppercase' }}>PM</div>
                    <div style={{ fontSize: '0.85rem', fontWeight: 500 }}>{selectedProjectData.pmName}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: '0.7rem', color: '#64748b', textTransform: 'uppercase' }}>Status</div>
                    <div style={{ fontSize: '0.85rem', fontWeight: 500 }}>{selectedProjectData.status}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: '0.7rem', color: '#64748b', textTransform: 'uppercase' }}>Progress</div>
                    <div style={{ fontSize: '0.85rem', fontWeight: 500 }}>{selectedProjectData.progress}%</div>
                  </div>
                  <div>
                    <div style={{ fontSize: '0.7rem', color: '#64748b', textTransform: 'uppercase' }}>Health</div>
                    <span style={{ 
                      padding: '2px 8px', borderRadius: 4, fontSize: '0.75rem', fontWeight: 600,
                      background: selectedProjectData.health === 'green' ? '#dcfce7' : selectedProjectData.health === 'yellow' ? '#fef3c7' : '#fee2e2',
                      color: selectedProjectData.health === 'green' ? '#166534' : selectedProjectData.health === 'yellow' ? '#92400e' : '#991b1b'
                    }}>{selectedProjectData.health.toUpperCase()}</span>
                  </div>
                </div>
              </div>
            )}

            <button
              onClick={generateDocument}
              disabled={loading || !selectedProject}
              style={{
                width: '100%', marginTop: 16, padding: '14px 20px',
                background: loading ? '#94a3b8' : 'linear-gradient(135deg, #6366f1, #4f46e5)',
                color: 'white', border: 'none', borderRadius: 12,
                fontSize: '0.9rem', fontWeight: 600, cursor: loading ? 'not-allowed' : 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
                boxShadow: '0 4px 12px rgba(99, 102, 241, 0.3)'
              }}
            >
              {loading ? (
                <>
                  <RefreshCw size={18} style={{ animation: 'spin 1s linear infinite' }} />
                  Generating with AI...
                </>
              ) : (
                <>
                  <Sparkles size={18} />
                  Generate Document
                </>
              )}
            </button>
          </div>

          {/* Recent Documents */}
          {recentDocs.length > 0 && (
            <div style={{ background: 'white', borderRadius: 16, padding: 24, border: '1px solid #e2e8f0' }}>
              <h3 style={{ fontSize: '0.85rem', fontWeight: 600, marginBottom: 16, color: '#1e293b' }}>Recently Generated</h3>
              {recentDocs.map((doc, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 0', borderBottom: i < recentDocs.length - 1 ? '1px solid #f1f5f9' : 'none' }}>
                  <CheckCircle size={16} color="#10b981" />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '0.8rem', fontWeight: 500 }}>{doc.title}</div>
                    <div style={{ fontSize: '0.7rem', color: '#64748b' }}>{doc.time}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right Panel - Document Preview */}
        <div style={{ background: 'white', borderRadius: 16, border: '1px solid #e2e8f0', overflow: 'hidden' }}>
          <div style={{ padding: '16px 24px', borderBottom: '1px solid #e2e8f0', background: '#f8fafc', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <FileText size={20} color="#6366f1" />
              <span style={{ fontWeight: 600 }}>Document Preview</span>
            </div>
            {document && !document.error && (
              <div style={{ display: 'flex', gap: 10 }}>
                <span style={{ padding: '4px 12px', background: '#dcfce7', color: '#166534', borderRadius: 8, fontSize: '0.75rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Sparkles size={12} /> AI Generated
                </span>
                <button
                  onClick={() => {
                    const content = document.sections?.map(s => `${s.heading}\n${'='.repeat(s.heading.length)}\n${s.content}\n`).join('\n') || '';
                    const blob = new Blob([`${document.title}\n${'='.repeat(document.title.length)}\nGenerated: ${new Date(document.generatedAt).toLocaleString()}\n\n${content}`], { type: 'text/plain' });
                    const url = URL.createObjectURL(blob);
                    const a = window.document.createElement('a');
                    a.href = url;
                    a.download = `${document.title.replace(/\s+/g, '-').toLowerCase()}.txt`;
                    a.click();
                    URL.revokeObjectURL(url);
                  }}
                  style={{ padding: '6px 14px', background: '#6366f1', color: 'white', border: 'none', borderRadius: 8, fontSize: '0.75rem', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Download size={14} /> Export
                </button>
              </div>
            )}
          </div>

          <div style={{ padding: 32, minHeight: 500 }}>
            {!document && !loading && (
              <div style={{ textAlign: 'center', color: '#94a3b8', padding: '80px 40px' }}>
                <FileText size={48} style={{ marginBottom: 16, opacity: 0.5 }} />
                <div style={{ fontSize: '1rem', fontWeight: 500, marginBottom: 8 }}>No document generated yet</div>
                <div style={{ fontSize: '0.85rem' }}>Select a document type and project, then click Generate</div>
              </div>
            )}

            {loading && (
              <div style={{ textAlign: 'center', color: '#6366f1', padding: '80px 40px' }}>
                <RefreshCw size={48} style={{ marginBottom: 16, animation: 'spin 1s linear infinite' }} />
                <div style={{ fontSize: '1rem', fontWeight: 500, marginBottom: 8 }}>Generating with AI...</div>
                <div style={{ fontSize: '0.85rem', color: '#94a3b8' }}>AI is analyzing project data and creating your document</div>
              </div>
            )}

            {document && document.error && (
              <div style={{ textAlign: 'center', color: '#ef4444', padding: '80px 40px' }}>
                <div style={{ fontSize: '1rem', fontWeight: 500 }}>{document.error}</div>
              </div>
            )}

            {document && !document.error && (
              <div>
                <h1 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: 8, color: '#1e293b' }}>{document.title}</h1>
                <div style={{ fontSize: '0.8rem', color: '#64748b', marginBottom: 24, display: 'flex', alignItems: 'center', gap: 16 }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    <Clock size={14} /> Generated: {new Date(document.generatedAt).toLocaleString()}
                  </span>
                  <span>{document.sections?.length || 0} sections</span>
                </div>

                <div style={{ borderTop: '2px solid #6366f1', paddingTop: 24 }}>
                  {document.sections?.map((section, i) => (
                    <div key={i} style={{ marginBottom: 24 }}>
                      <h2 style={{ fontSize: '1.1rem', fontWeight: 600, color: '#1e293b', marginBottom: 12, paddingBottom: 8, borderBottom: '1px solid #e2e8f0' }}>
                        {section.heading}
                      </h2>
                      <div style={{ fontSize: '0.9rem', color: '#475569', lineHeight: 1.8, whiteSpace: 'pre-wrap' }}>
                        {section.content}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
