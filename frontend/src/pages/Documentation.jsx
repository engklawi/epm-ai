import { useState, useEffect } from 'react';
import { FileText, Download, RefreshCw } from 'lucide-react';

const API = 'https://epm-ai-demo-20260201.uc.r.appspot.com/api';

export default function Documentation() {
  const [projects, setProjects] = useState([]);
  const [selectedProject, setSelectedProject] = useState('P001');
  const [docType, setDocType] = useState('status-report');
  const [document, setDocument] = useState(null);
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    fetch(`${API}/projects`).then(r => r.json()).then(setProjects);
  }, []);

  const generateDocument = async () => {
    setGenerating(true);
    try {
      const res = await fetch(`${API}/documents/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: docType, projectId: selectedProject })
      });
      const data = await res.json();
      setDocument(data);
    } catch (err) {
      console.error(err);
    }
    setGenerating(false);
  };

  const docTypes = [
    { id: 'status-report', label: 'Status Report', icon: '📊' },
    { id: 'charter', label: 'Project Charter', icon: '📜' },
    { id: 'meeting-summary', label: 'Meeting Summary', icon: '📝' },
  ];

  return (
    <div>
      <div className="page-header">
        <h1>📄 UC7: AI Documentation</h1>
        <p>Automatically generate project documents using AI templates and real-time data</p>
      </div>

      <div className="grid-2 gap-20">
        <div>
          <div className="card">
            <h3>📝 Generate Document</h3>
            
            <div style={{ marginBottom: 20 }}>
              <label style={{ display: 'block', marginBottom: 8, fontWeight: 600 }}>Select Project</label>
              <select 
                value={selectedProject} 
                onChange={e => setSelectedProject(e.target.value)}
                style={{ width: '100%', padding: 12, borderRadius: 8, border: '1px solid #e5e7eb', fontSize: '1rem' }}
              >
                {projects.map(p => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>

            <div style={{ marginBottom: 20 }}>
              <label style={{ display: 'block', marginBottom: 8, fontWeight: 600 }}>Document Type</label>
              <div className="flex gap-10">
                {docTypes.map(dt => (
                  <button
                    key={dt.id}
                    className={docType === dt.id ? 'primary' : 'secondary'}
                    onClick={() => setDocType(dt.id)}
                    style={{ flex: 1 }}
                  >
                    {dt.icon} {dt.label}
                  </button>
                ))}
              </div>
            </div>

            <button 
              className="primary" 
              onClick={generateDocument} 
              disabled={generating}
              style={{ width: '100%', padding: 15 }}
            >
              {generating ? (
                <><RefreshCw size={18} style={{ animation: 'spin 1s linear infinite' }} /> Generating...</>
              ) : (
                <><FileText size={18} /> Generate Document</>
              )}
            </button>
          </div>

          <div className="card">
            <h3>🤖 AI Capabilities</h3>
            <ul style={{ lineHeight: 2, paddingLeft: 20 }}>
              <li>✅ Auto-generate project charters from EPM data</li>
              <li>✅ Create status reports with real-time metrics</li>
              <li>✅ Summarize meeting discussions into structured minutes</li>
              <li>✅ Extract lessons learned from past documentation</li>
              <li>✅ Dynamic templates auto-fill with live data</li>
            </ul>
          </div>
        </div>

        <div className="card">
          <div className="flex flex-between flex-center mb-20">
            <h3>📑 Document Preview</h3>
            {document && (
              <button className="secondary" onClick={() => alert('Download functionality would save this document')}>
                <Download size={16} /> Export
              </button>
            )}
          </div>

          {document ? (
            <div className="document-preview">
              <h2>{document.title}</h2>
              <p style={{ color: '#64748b', fontSize: '0.85rem', marginBottom: 20 }}>
                Generated: {new Date(document.generatedAt).toLocaleString()}
              </p>
              {document.sections.map((section, i) => (
                <section key={i}>
                  <h4>{section.heading}</h4>
                  <p>{section.content}</p>
                </section>
              ))}
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: 60, color: '#64748b' }}>
              <FileText size={48} style={{ opacity: 0.3, marginBottom: 10 }} />
              <p>Select a project and document type, then click Generate</p>
            </div>
          )}
        </div>
      </div>

      <div className="card mt-20">
        <h3>📚 Recent Documents</h3>
        <table>
          <thead>
            <tr>
              <th>Document</th>
              <th>Project</th>
              <th>Type</th>
              <th>Generated</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Status Report - ERP Modernization</td>
              <td>ERP Modernization</td>
              <td><span className="badge badge-blue">Status Report</span></td>
              <td>Today, 2:30 PM</td>
              <td><button className="secondary" style={{ padding: '5px 10px' }}>View</button></td>
            </tr>
            <tr>
              <td>Project Charter - Cloud Migration</td>
              <td>Cloud Migration</td>
              <td><span className="badge badge-green">Charter</span></td>
              <td>Yesterday, 10:15 AM</td>
              <td><button className="secondary" style={{ padding: '5px 10px' }}>View</button></td>
            </tr>
            <tr>
              <td>Weekly Meeting Summary</td>
              <td>Customer Portal</td>
              <td><span className="badge badge-yellow">Meeting</span></td>
              <td>Jan 28, 4:00 PM</td>
              <td><button className="secondary" style={{ padding: '5px 10px' }}>View</button></td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
