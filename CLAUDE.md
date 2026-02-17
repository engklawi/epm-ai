# EPM-AI Project

## Live URLs
- **Frontend:** https://frontend-dot-epm-ai-demo-20260201.uc.r.appspot.com
- **Backend:** https://epm-ai-demo-20260201.uc.r.appspot.com
- **GitHub:** https://github.com/engklawi/epm-ai

## Infrastructure

### GCP Project
- **Project ID:** `epm-ai-demo-20260201`
- **GCP Account:** `info@macsoft.ai`
- **gcloud auth:** Run `gcloud auth login` if tokens expire

### Project Server VM
- **VM Name:** `epm-trial-server`
- **Zone:** `us-central1-a`
- **External IP:** `34.29.110.174`
- **Internal IP:** `10.128.0.2`
- **OS:** Windows Server 2022
- **Software:** Microsoft Project Server 2016, SharePoint 2016, SQL Server, IIS
- **PWA URL:** `http://34.29.110.174/pwa`
- **Bridge URL:** `http://34.29.110.174:8080`

### Credentials
- **PS Username:** `info`
- **PS Password:** `rXr<{=eiKQ,49+V`
- **PS Domain:** `EPMTRIAL`
- **RDP:** Use `gcloud compute instances get-serial-port-output` or GCP Console RDP

### GCP Firewall Rules
| Rule | Port | Purpose |
|------|------|---------|
| allow-http-pwa | 80 | PWA / IIS |
| allow-rdp | 3389 | Remote Desktop |
| allow-ps-bridge | 8080 | PS Bridge Server (CSOM) |
| allow-winrm | 5985, 5986, 22 | WinRM / SSH (SSH not active) |

### IIS Bindings (PWA Site)
- `10.128.0.2:80` (internal)
- `34.29.110.174:80` (external)
- Note: `localhost:80` does NOT work — bindings are IP-specific
- The NTLM loopback check is disabled via `DisableLoopbackCheck=1` registry key

### SharePoint Alternate Access Mappings (AAM)
- Default zone: `http://34.29.110.174` (was `34.122.56.26`, updated)

---

## Architecture

### Data Flow
```
Frontend (React/Vite)
    ↓ HTTP
Backend (Express on App Engine)
    ├── dataService.js (merge layer + TTL cache 300s)
    │   ├── projectServerClient.js → REST API → Project Server (read + task updates)
    │   └── Mock JSON data (data/*.json) for enrichment
    └── callPSBridge() → PS Bridge Server on VM (resource assignments)
                              ↓ spawns
                         PowerShell CSOM script
                              ↓
                         Project Server (CSOM DLLs)
```

### Why Two API Paths?

| Operation | Method | Why |
|-----------|--------|-----|
| Read projects/tasks | REST API | Simple, works perfectly |
| Update task progress | REST API (PATCH) | Single queue job, no blocking |
| Update project schedule | REST API (PATCH) | Single queue job, no blocking |
| **Assign resources** | **CSOM via Bridge** | REST API creates per-operation queue jobs that block each other. CSOM batches all changes client-side, then publishes as ONE queue job. |

### Key Technical Insight
Project Server's queue uses **correlation-based job grouping** (correlation ID = project GUID). Only ONE queue job per project can process at a time. REST API's `Assignments/Add` creates a queue job, and `Publish` creates another — they block each other (`GeneralQueueCorrelationBlocked`). CSOM's `draft.Assignments.Add()` modifies an in-memory object (no queue job), and only `draft.Publish()` creates one queue job for all changes.

---

## Project Structure
```
EPM-AI/
├── start.sh                   # One-command startup script
├── reset-demo.sh              # Demo reset (resets PS data to baseline after each demo)
├── backend/
│   ├── server.js              # Main Express API (GPT-5.2 + Bayan persona + function calling + PS write-back)
│   ├── authMiddleware.js      # Firebase Auth token verification + email whitelist
│   ├── projectServerClient.js # NTLM REST API client (read + task/schedule updates)
│   ├── dataService.js         # Data orchestrator (live PS + mock JSON merge, TTL cache)
│   ├── firebase-sa-key.json   # Firebase service account key (gitignored, local only)
│   ├── app.yaml               # GCP App Engine config (default service)
│   ├── data/                  # Mock JSON data files
│   │   ├── projects.json      # 5 projects (P001-P005)
│   │   ├── risks.json         # 6 risk records
│   │   ├── projectManagers.json # 4 PMs
│   │   └── strategicObjectives.json # 4 strategic objectives
│   ├── ps-bridge/             # CSOM Bridge Server (deployed to VM)
│   │   ├── bridge-server.js   # Express server (port 8080) — spawns PowerShell + auto-retry force check-in
│   │   ├── Invoke-PSAssignment.ps1  # CSOM script for resource assignments
│   │   ├── setup-bridge.ps1   # One-time setup script for VM (watchdog, restarts, log rotation)
│   │   ├── deploy-update-startup.ps1  # VM startup script (deploys all bridge files on boot)
│   │   └── deploy-to-vm.sh    # Deployment helper
│   └── scripts/               # Utility scripts (upload, test, debug)
│       ├── upload-to-project-server.js  # Main data upload (7-step process)
│       ├── add-assignments.js           # Assignment via REST (broken - queue blocking)
│       └── [17 other test/debug scripts]
├── frontend/
│   ├── src/
│   │   ├── App.jsx                  # Main shell (collapsible sidebar, routing, PS indicator, BayanPanel)
│   │   ├── App.css                  # Global styles
│   │   ├── firebase.js              # Firebase client SDK init
│   │   ├── contexts/
│   │   │   └── AuthContext.jsx      # Auth state, login(), logout(), useAuth()
│   │   ├── utils/
│   │   │   └── authFetch.js         # Authenticated fetch wrapper + API constant
│   │   ├── components/
│   │   │   ├── BayanPanel.jsx       # Persistent AI chat sidebar (350px, page-context aware)
│   │   │   └── ProtectedRoute.jsx   # Route guard for authenticated routes
│   │   └── pages/                   # 9 Use Case pages + Login (React + Vite)
│   │       ├── LoginPage.jsx        # Professional login (DGA + Bayan branding)
│   │       ├── DirectorsDashboard.jsx  # UC2: Portfolio Dashboard
│   │       ├── StrategyROI.jsx         # UC3: Strategy & ROI
│   │       ├── PMOPerformance.jsx      # UC4: PMO Performance
│   │       ├── StrategicAlignment.jsx  # UC5: Strategic Alignment
│   │       ├── RiskManagement.jsx      # UC6: Risk Center
│   │       ├── Documentation.jsx       # UC7: Document Generation
│   │       ├── ExecutivePredictions.jsx # UC8: Executive Predictions
│   │       ├── PMScoring.jsx           # UC9: PM Scoring
│   │       └── PMDevelopment.jsx       # UC10: PM Development
│   ├── tests/
│   │   └── bayan-e2e.spec.js        # 23 E2E tests (Playwright)
│   ├── playwright.config.js         # Playwright config (Chromium, headless)
│   └── app.yaml               # GCP App Engine config (frontend service)
```

---

## Project Server Data

### 5 Projects (uploaded to PS)
| Project | PM | Health | Progress | Budget | Tasks |
|---------|-----|--------|----------|--------|-------|
| ERP Modernization | Sarah Ahmed | YELLOW | 65% | $2.5M | 8 |
| Cloud Migration | Mohammed Ali | GREEN | 80% | $1.8M | 8 |
| Customer Portal | Fatima Hassan | RED | 36% | $900K | 7 |
| Data Analytics Platform | Ahmed Khalil | YELLOW | 48% | $1.2M | 7 |
| Mobile App Revamp | Sarah Ahmed | GREEN | 54% | $600K | 7 |

### 4 Enterprise Resources (PMs)
| Name | ID in PS | Mock ID |
|------|----------|---------|
| Sarah Ahmed | `a092e1e9-aede-4829-aaf9-b6943cdec313` | PM001 |
| Mohammed Ali | `4bdbb19c-ba58-4279-9af5-837a8faf4a81` | PM002 |
| Fatima Hassan | `e63bdaf5-1854-4b42-ab5d-ee4a543b6906` | PM003 |
| Ahmed Khalil | `0bff7e86-aa5d-402d-ab03-e50f45be8897` | PM004 |

### Description Field Format (pipe-delimited metadata)
```
Strategic Objective: Digital Transformation | Status: In Progress | Health: YELLOW | ROI: 145% | Budget: $2.5M | Alignment: 92%
```
Parsed by `projectServerClient.js → parseDescription()`.

---

## API Endpoints

### Read Endpoints
| Endpoint | Description |
|----------|-------------|
| `GET /api/projects` | All projects (merged PS + mock) |
| `GET /api/projects/:id` | Single project |
| `GET /api/portfolio` | Portfolio summary |
| `GET /api/strategy` | Strategy & ROI data |
| `GET /api/risks` | Risks with summary |
| `GET /api/pm-scores` | PM scoring data |
| `GET /api/alerts` | Active alerts |
| `GET /api/ps/status` | PS connection status |
| `GET /api/ps/resources` | Enterprise resources list |

### Write Endpoints
| Endpoint | Method | Description |
|----------|--------|-------------|
| `POST /api/ps/tasks/:projectId/:taskId/update` | REST API | Update task progress/cost |
| `POST /api/ps/projects/:projectId/schedule` | REST API | Update project schedule |
| `POST /api/ps/projects/:projectId/resources` | CSOM Bridge (fallback: REST) | Assign resource to task |
| `POST /api/ps/assign-all` | CSOM Bridge | Bulk assign across projects |
| `GET /api/ps/bridge/health` | - | Check bridge availability |

### AI Endpoints
| Endpoint | Description |
|----------|-------------|
| `POST /api/chat` | Bayan AI chat (GPT-5.2 with function calling + local fallback) |
| `POST /api/chat/execute` | Execute confirmed AI actions (task update, resource assignment) |
| `POST /api/ai/analyze` | AI analysis (risk-prediction, resource-optimization, strategic-alignment) |
| `POST /api/documents/generate` | Document generation (status-report, charter, meeting-summary) |

---

## Environment Variables

### Backend (App Engine / Local)
| Variable | Default | Description |
|----------|---------|-------------|
| `OPENAI_API_KEY` | - | Required for AI chat and document generation |
| `PS_URL` | `http://34.29.110.174/pwa` | Project Server PWA URL |
| `PS_USERNAME` | `info` | PS username |
| `PS_PASSWORD` | *(empty)* | PS password (set to enable PS integration) |
| `PS_DOMAIN` | `EPMTRIAL` | Windows domain |
| `PS_ENABLED` | `true` | Set `false` to disable PS integration |
| `PS_CACHE_TTL` | `300` | Cache TTL in seconds |
| `PS_BRIDGE_URL` | `http://34.29.110.174:8080` | CSOM Bridge Server URL |
| `PORT` | `3001` | Express server port |

### PS Bridge Server (on VM)
| Variable | Default | Description |
|----------|---------|-------------|
| `PS_BRIDGE_PORT` | `8080` | Bridge listen port |
| `PWA_URL` | `http://34.29.110.174/pwa` | PWA URL for CSOM |
| `PS_USERNAME` | `info` | PS username |
| `PS_PASSWORD` | `rXr<{=eiKQ,49+V` | PS password |
| `PS_DOMAIN` | `EPMTRIAL` | Windows domain |

---

## Local Development
```bash
# One command to start everything (recommended)
./start.sh

# Or manually:
# Backend (Terminal 1)
cd backend
GOOGLE_APPLICATION_CREDENTIALS=./firebase-sa-key.json PS_PASSWORD='rXr<{=eiKQ,49+V' npm run dev

# Frontend (Terminal 2)
cd frontend && npm run dev
```

## Deploy to Google Cloud (App Engine)
```bash
export PATH="$HOME/google-cloud-sdk/bin:$PATH"
PROJECT_ID="epm-ai-demo-20260201"
BACKEND_URL="https://$PROJECT_ID.uc.r.appspot.com"

# 1. Update ALL frontend API URLs to production (pages + App.jsx)
cd frontend/src/pages
for f in *.jsx; do sed -i '' "s|http://localhost:3001|$BACKEND_URL|g" "$f"; done
cd ..
sed -i '' "s|http://localhost:3001|$BACKEND_URL|g" App.jsx
cd ..

# 2. Build frontend
npm run build

# 3. Deploy backend
cd ../backend
gcloud app deploy --project=$PROJECT_ID --quiet

# 4. Deploy frontend
cd ../frontend
gcloud app deploy --project=$PROJECT_ID --quiet
```

## VM Management
```bash
# Check VM status
gcloud compute instances describe epm-trial-server --zone=us-central1-a --format="get(status)"

# Reset VM (triggers startup scripts: PS deploys files, CMD starts bridge)
gcloud compute instances reset epm-trial-server --zone=us-central1-a --quiet

# View serial console output (check startup script results)
gcloud compute instances get-serial-port-output epm-trial-server --zone=us-central1-a

# Update PS startup script (deploys bridge files)
gcloud compute instances add-metadata epm-trial-server --zone=us-central1-a \
  --metadata-from-file=windows-startup-script-ps1=backend/ps-bridge/deploy-update-startup.ps1

# Check bridge health
curl http://34.29.110.174:8080/health

# Force check-in all projects (clears stuck checkouts)
curl -X POST http://34.29.110.174:8080/api/force-checkin
```

### VM Startup Architecture
The VM uses **two** startup scripts that run in sequence on boot/reset:
1. **`windows-startup-script-ps1`** (PowerShell): Kills old bridge process, writes `bridge-server.js`, `start-bridge.bat`, `watchdog.ps1`, registers watchdog task, updates restart settings
2. **`windows-startup-script-cmd`** (CMD): Sets env vars (`PWA_URL`, `PS_PASSWORD`, etc.) and starts `node bridge-server.js`

**IMPORTANT:** The CMD script must set `PWA_URL=http://34.29.110.174/pwa` — IIS doesn't bind to `localhost:80`.

### Bridge Stability Features
- **Auto-restart:** PSBridgeServer scheduled task with 999 restarts, 1-min interval
- **Watchdog:** PSBridgeWatchdog task checks health every 5 min, restarts if down
- **Log rotation:** bridge.log archived at >10MB
- **Memory monitoring:** Logs RSS/heap every 30 minutes
- **Crash handlers:** uncaughtException and unhandledRejection handlers prevent silent crashes

## Demo Reset
```bash
# After each demo — reset all data to baseline (~30 seconds)
./reset-demo.sh

# View current state without making changes
./reset-demo.sh --check

# Only force check-in all projects (clears stuck locks)
./reset-demo.sh --checkin
```
The reset script: force checks in all projects → removes non-baseline assignments → resets task progress to original percentages.

---

## E2E Testing

### Setup
```bash
cd frontend
npx playwright install chromium  # one-time
```

### Run Tests
```bash
# Requires both backend (port 3001) and frontend (port 5173) running
cd frontend && npx playwright test --reporter=list
```

### Test Coverage (23 tests)
| Act | Tests | Coverage |
|-----|-------|----------|
| 1. Bayan Chat | 6 | Page load, morning briefing, voice input, language toggle (Arabic/RTL), chat messaging, quick queries |
| 2. Sidebar | 4 | Branding, PS indicator, refresh button, STC footer |
| 3. All Pages | 10 | Each of 10 use case pages loads without JS errors |
| 4. Right Panel | 3 | Live alerts, portfolio overview, alert-click triggers analysis |

### Key Patterns
- Set up `page.waitForResponse()` **BEFORE** `page.goto()` to avoid race conditions
- Use `.first()` for selectors that may match multiple elements (Playwright strict mode)
- Filter out `ResizeObserver` and `Failed to fetch` from error assertions

---

## Known Issues & Solutions

### Queue Blocking (GeneralQueueCorrelationBlocked)
- **Problem:** REST API `Assignments/Add` + `Publish` create separate queue jobs that block each other
- **Solution:** Use CSOM via PS Bridge Server — batches all changes into one `Publish()` queue job
- **Proven:** CSOM assignment `Result: Success` confirmed on 2026-02-04

### CICOCheckedOutInOtherSession
- **Problem:** Projects left in checked-out state after failed operations prevent new checkouts
- **CSOM ForceCheckIn() doesn't work** — tried multiple approaches
- **Solution:** REST API `POST /_api/ProjectServer/Projects('{guid}')/Draft/CheckIn(force=true)` with X-RequestDigest
- **Auto-retry:** bridge-server.js detects this error on `/api/assign` and auto-retries after REST force check-in
- **Manual fix:** `curl -X POST http://34.29.110.174:8080/api/force-checkin` or `./reset-demo.sh --checkin`

### Bridge Server PWA_URL
- **Problem:** `PWA_URL=http://localhost/pwa` doesn't work because IIS binds to IP addresses, not localhost
- **Solution:** Always use `PWA_URL=http://34.29.110.174/pwa` in start-bridge.bat and env vars
- **The CMD startup script** (`windows-startup-script-cmd`) sets this correctly

### PowerShell Password Special Characters
- **Problem:** Password `rXr<{=eiKQ,49+V` contains `<` which breaks PowerShell `-Command` inline parsing
- **Solution:** Use `-EncodedCommand` (Base64 UTF-16LE) instead of `-Command` for PowerShell REST calls in bridge-server.js

### IIS Port 80 Binding Conflict
- **Problem:** Multiple IIS sites (PWA, Default, Central Admin) all bound to `*:80`
- **Solution:** PWA bound to `10.128.0.2:80` and `34.29.110.174:80` specifically

### NTLM Loopback Check
- **Problem:** CSOM on VM can't authenticate to itself via external IP
- **Solution:** Registry `DisableLoopbackCheck=1` and `BackConnectionHostNames` with both IPs

### SharePoint AAM Mismatch
- **Problem:** Old IP `34.122.56.26` in Alternate Access Mappings caused 500 errors
- **Solution:** Updated AAM to `http://34.29.110.174` via `Set-SPAlternateURL`

### Task Progress Updates
- **Works:** `PATCH` with `__metadata: { type: 'PS.DraftTask' }` modifies draft in-place
- **Proven:** Changed Payment Integration from 20% → 25% successfully

---

## 9 Use Cases
1. **Portfolio Dashboard** - Live project data visualization with What-If Simulator
2. **Strategy & ROI** - Strategic alignment and ROI analysis
3. **PMO Performance** - Cross-project performance metrics
4. **Strategic Alignment** - Project-to-objective mapping
5. **Risk Center** - AI-predicted risks and mitigation
6. **Document Generation** - AI-generated reports/charters/minutes
7. **Executive Predictions** - AI forecasting
8. **PM Scoring** - PM performance metrics
9. **PM Development** - Training and skill gap analysis

**Note:** Bayan AI is now a persistent right sidebar panel on all pages (not a dedicated page)

---

## Bayan AI Assistant (بيان)

### Identity
- **Name:** Bayan (بيان) — Arabic for "clarity" / "clear expression"
- **Role:** AI PMO Assistant
- **Avatar:** Abstract prism/diamond SVG icon with light rays (purple gradient)
- **Personality:** Confident, data-driven, proactive

### Key Features
1. **Persistent Right Sidebar** — `BayanPanel.jsx` — 350px fixed panel always visible on all pages
   - Page-context aware: detects current page and provides relevant suggestions
   - Clean professional design (#f8fafc background, subtle borders)
2. **Proactive Actions** — AI recommends task updates and resource assignments as fixes to problems
3. **Write-Back to PS** — Two-phase confirmation: AI proposes → user confirms → backend executes
4. **Function Calling** — GPT-5.2 `tools` with `update_task_progress` and `assign_resource` functions
5. **Local Fallback** — Regex-based intent detection when OpenAI is unavailable

### Removed Features (2026-02-05)
- Arabic language support and RTL layout
- Voice input functionality
- Dedicated Bayan page (AI now in persistent right panel)
- Floating chat FAB (replaced by persistent panel)
- STC SOLUTIONS branding

### AI Model
- **Model:** `gpt-5.2` (was `gpt-4o`)
- **Parameter:** `max_completion_tokens` (not `max_tokens` — GPT-5.2 requirement)
- **System Prompt:** Bayan persona with bilingual instructions, Vision 2030 awareness, proactive action recommendations

### Write-Back Flow
```
User types "Update Customer Portal Payment Integration to 50%"
    ↓
GPT-5.2 detects intent via function calling → returns tool_call
    ↓
Frontend shows confirmation card (blue for task, amber for resource)
    ↓
User clicks [Confirm]
    ↓
POST /api/chat/execute → resolves names to IDs → executes on PS
    ↓
Success → cache invalidated → UI refreshed
```

---

## Authentication

### Overview
Firebase Authentication with email/password, whitelist-only access. No public sign-up.

### Demo Credentials
| Email | Password |
|-------|----------|
| `info@macsoft.ai` | `Demo2026!` |
| `omar@macsoft.ai` | `Demo2026!` |

### Architecture
```
Frontend (React)
    │
    ├── firebase.js           # Firebase client SDK init
    ├── AuthContext.jsx       # React context: user state, login(), logout()
    ├── ProtectedRoute.jsx    # Redirects unauthenticated users to /login
    ├── LoginPage.jsx         # Split-panel login (DGA logo + Bayan branding)
    └── authFetch.js          # Wrapper that injects Bearer token into API calls

Backend (Express)
    │
    └── authMiddleware.js     # Firebase Admin token verification + email whitelist
        └── Uses Application Default Credentials (auto on App Engine)
```

### Key Files
| File | Purpose |
|------|---------|
| `frontend/src/firebase.js` | Firebase client config (public values) |
| `frontend/src/contexts/AuthContext.jsx` | `useAuth()` hook, login/logout |
| `frontend/src/utils/authFetch.js` | `authFetch()` + `API` constant |
| `frontend/src/components/ProtectedRoute.jsx` | Route guard |
| `frontend/src/pages/LoginPage.jsx` | Professional login page |
| `backend/authMiddleware.js` | `requireAuth` middleware |

### Adding New Users
1. Create user in Firebase Console (Authentication → Users → Add User)
2. Add email to `ALLOWED_EMAILS` array in `backend/authMiddleware.js`

### Local Development
```bash
# Backend needs service account key
cd backend
GOOGLE_APPLICATION_CREDENTIALS=./firebase-sa-key.json PS_PASSWORD='...' npm run dev
```

### Production (App Engine)
- Uses GCP Application Default Credentials automatically
- No service account key needed — Firebase Admin SDK authenticates via project metadata
