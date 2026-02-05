# EPM-AI Progress Log

## Session: 2026-02-05 — Major UX Redesign & Simplification

### Completed Work

#### 16. Bayan AI Panel Redesign ✅
- **Converted BayanFloatingChat to BayanPanel** — persistent right sidebar (330px width)
  - Replaced floating FAB + popup with fixed right panel always visible
  - Professional clean design: #f8fafc background, subtle borders
  - Greeting changed from "AI PMO Director" to "AI PMO Assistant"
  - Page-context aware: detects current page and provides relevant suggestions
- **Removed features:**
  - Arabic language support and RTL layout
  - Voice input functionality
  - Bilingual UI strings
- **Kept features:**
  - Page-context awareness with smart suggestions
  - AI chat with GPT-5.2 function calling
  - Action confirmation cards for write-back operations

#### 17. Left Sidebar — Collapsible Navigation ✅
- **Added collapse/expand toggle button** (ChevronLeft/ChevronRight icons)
- **Default state:** Collapsed (icons only, 64px width)
- **Expanded state:** Full width with labels and descriptions
- **Removed items:**
  - "Bayan بيان" dedicated page (AI now in right panel)
  - STC SOLUTIONS footer branding
- **Updated branding:**
  - Replaced "EPM-AI" logo with DGA logo (`/DGA Logo-01_0.png`)
  - Changed "PROJECT SERVER" indicator to "EPM SERVER"

#### 18. Dashboard What-If Simulator ✅
- **Moved position:** From top of DirectorsDashboard to under AI Executive Summary section
- **Connected styling:** Border radius connects summary and simulator when expanded
- **Toggle button:** "What-If Analysis" / "Hide Simulator" with smooth transitions

#### 19. CSS Layout Updates ✅
- **App.css:** Updated `margin-right` from 300px to 330px for Bayan panel
- **Sidebar collapsed class:** Added `.sidebar-collapsed` styles for narrow navigation

---

## Session: 2026-02-04 (Part 3) — Floating Chat, E2E Tests & Demo Polish

### Completed Work

#### 13. E2E Testing Suite — 23/23 Passing ✅
- **Created `frontend/tests/bayan-e2e.spec.js`** — 23 comprehensive Playwright tests
  - Act 1 (6 tests): Bayan chat page load, morning briefing, voice input, language toggle, chat messaging, quick queries
  - Act 2 (4 tests): Sidebar branding, PS connection indicator, refresh button, STC footer
  - Act 3 (10 tests): All 10 use case pages load without errors
  - Act 4 (3 tests): Live alerts, portfolio overview, alert click → analysis query
- **Created `frontend/playwright.config.js`** — Chromium headless, localhost:5173
- **Key fixes during development:**
  - `waitForResponse` race conditions: set up listener BEFORE `page.goto()`
  - Playwright strict mode: use `.first()` when selectors match multiple elements
- **Result:** All 23 tests pass consistently in ~72 seconds

#### 14. Floating Bayan Chat Widget — Cross-Page AI Assistant ✅
- **Created `frontend/src/components/BayanFloatingChat.jsx`**
  - **Floating Action Button (FAB):** 56x56px purple prism icon, bottom-right, gentle floating animation
  - **Chat Panel:** 400x520px slide-up panel with full Bayan capabilities
  - **Page-Context Aware:** Maps all 9 non-Bayan pages with:
    - `name` / `nameAr` — bilingual page names
    - `context` — detailed description for GPT-5.2 (what data the user sees)
    - `suggestions` / `suggestionsAr` — 3 context-relevant quick queries per page
  - **Smart Behavior:**
    - Returns `null` on `/` (dedicated Bayan page) — no duplicate chat
    - On first open: contextual greeting ("You're viewing 'Portfolio Dashboard'...")
    - On page change: adds navigation message with new page context
    - Prepends `[Page Context: ...]` to all user messages for GPT-5.2
  - **Full Features:** Voice input, RTL/Arabic support, action confirmation cards, bilingual UI
- **Added to `App.jsx`** inside BrowserRouter, outside Routes
- **Updated backend system prompt** with PAGE CONTEXT AWARENESS section
- **Key fix:** React Rules of Hooks violation — moved `if (pageCtx === null) return null;` after all useEffect hooks

#### 15. Visual Polish & Demo Verification ✅
- Verified all 10 pages render correctly via Playwright screenshots
- FAB button visible on all non-Bayan pages
- Chat panel opens with page-specific greeting and suggestions
- PS indicator shows green "LIVE — PROJECT SERVER" status

---

## Session: 2026-02-04 (Part 2) — Bayan AI & Demo Preparation

### Completed Work

#### 9. AI Chat Write-Back Integration (THE BIG ONE) ✅
- **Backend (`server.js`):**
  - Added OpenAI function calling tools (`chatTools`) for `update_task_progress` and `assign_resource`
  - Added `buildTaskReference()` for compact task data in system prompt
  - Updated `/api/chat` to use GPT-5.2 with `tool_choice: 'auto'`
  - Created `/api/chat/execute` endpoint for confirmed action execution
  - Added `detectLocalAction()` regex-based fallback when OpenAI unavailable
  - Changed `max_tokens` → `max_completion_tokens` (GPT-5.2 requirement)
  - Changed model from `gpt-4o` → `gpt-5.2`
  - Added `import 'dotenv/config'` for ESM env loading
- **Frontend (`PMAssistant.jsx`):**
  - Action confirmation cards with state machine (pending → executing → success/failed/cancelled)
  - Blue gradient for task updates, amber for resource assignments
  - `executeAction()` calls `POST /api/chat/execute`
  - `cancelAction()` with "no changes made" feedback

#### 10. Bayan AI Assistant (بيان) — Complete Rewrite ✅
- **Name:** Bayan (بيان) meaning "clarity"
- **Role:** AI PMO Director
- **Avatar:** Custom SVG prism/diamond with light rays (purple gradient)
- **Bilingual:** Full Arabic (ar-SA) and English (en-US) support
  - All UI strings bilingual (buttons, placeholders, status messages, suggestions)
  - Auto language detection via Arabic Unicode range regex
  - RTL layout support with `dir="rtl"` attribute
  - Globe icon language toggle button
- **Voice Input:** Web Speech API (`webkitSpeechRecognition`)
  - Red pulsing mic button when listening
  - Language-aware recognition (ar-SA / en-US)
  - Auto-detect language from voice transcript
- **Morning Briefing:** Dynamic portfolio summary
  - Critical projects get red "Analyze & Rescue" buttons with Sparkles icon
  - Schedule optimization cards for projects with AI insights
  - Portfolio health counts (on track / at risk / critical)
- **Proactive Actions:** AI recommends task updates and resource assignments
  - Clicking alerts triggers "Analyze this and suggest a fix" queries
  - Clicking projects triggers "Analyze [project] and suggest actions" queries
- **Backend System Prompt:** Rewrote for Bayan persona
  - PMO Director personality, confident but approachable
  - Vision 2030 aware, Saudi business context
  - Proactive action recommendations in every response

#### 11. Sidebar Enhancements ✅
- **PS Connection Indicator:** Green pulsing dot when connected, red when disconnected
  - Added manual **refresh button** (RefreshCw icon with spin animation)
  - Shows "CHECKING..." → "LIVE — PROJECT SERVER" → "DISCONNECTED"
  - Last sync timestamp display
- **Branding Updates:**
  - Bayan prism SVG logo in sidebar header
  - Subtitle: "Powered by Bayan AI"
  - First nav item: "Bayan بيان" / "AI PMO Director"
  - Footer: "STC SOLUTIONS · EPM-AI" / "v2.0 · Bayan AI · Enterprise"

#### 12. Environment & Config ✅
- Created `backend/.env` with all credentials (in .gitignore)
- Updated `backend/app.yaml` with hardcoded values (not `${}` references)
- Added `dotenv` dependency to `backend/package.json`

---

## Session: 2026-02-04 (Part 1) — Infrastructure & Data

### Completed Work

#### 1. VM & PWA Infrastructure Recovery
- **Problem:** PWA at `http://34.29.110.174/pwa` was returning HTTP 503
- **Root Cause Chain:**
  1. IIS sites (PWA, Default Web Site, Central Admin) were all STOPPED
  2. Port 80 binding conflict — 4 sites all bound to `*:80`
  3. SharePoint AAM had old IP `34.122.56.26` instead of current `34.29.110.174`
  4. GCP startup script had PowerShell syntax error (broken `2>` redirect)
- **Fixes Applied:**
  - Changed PWA IIS binding from `*:80` to `10.128.0.2:80` + `34.29.110.174:80`
  - Updated SharePoint AAM: `Set-SPAlternateURL -Identity "http://34.122.56.26" -Url "http://34.29.110.174"`
  - Installed proper startup script via `gcloud compute instances add-metadata`
- **Result:** PWA accessible, API returns 200 with project data

#### 2. IP Mismatch Cleanup
- **Problem:** 19 script files had old IP `34.122.56.26` hardcoded
- **Fix:** Updated all 19 files in `backend/scripts/` to use `34.29.110.174`

#### 3. Mock Data Upload to Project Server
- **Script:** `backend/scripts/upload-to-project-server.js`
- **Process:** 7-step upload (delete existing → custom fields → resources → projects with tasks → verify)
- **Result:** 5 projects with 37 tasks total uploaded successfully
- **Stale project "Call Center Migration"** deleted (force checkin + delete)

#### 4. Task Progress Update (Write-Back) — PROVEN WORKING
- **Test:** Updated "Payment Integration" task in Customer Portal from 20% → 25%
- **Method:** `PATCH` to `/_api/ProjectServer/Projects('{id}')/Draft/Tasks('{taskId}')` with `__metadata: { type: 'PS.DraftTask' }`
- **Why it works:** PATCH modifies the draft in-place, only `Publish` creates a queue job — no blocking

#### 5. Resource Assignment Investigation — REST API FAILS
- **Tested approaches:** Single assignment, multiple with delays (2s–60s), Draft/update() + WaitForQueue, CSOM ProcessQuery XML
- **Root cause:** REST `Assignments/Add` creates a queue job; `Publish` creates another. Same project correlation ID = `GeneralQueueCorrelationBlocked`.
- **PWA UI also limited:** "Resource Assignments" button disabled for `info` user (permissions)

#### 6. CSOM Bridge Server — BUILT, DEPLOYED, WORKING
- **Architecture:**
  ```
  Node.js Backend → HTTP → Bridge Server (VM:8080) → PowerShell → CSOM DLLs → Project Server
  ```
- **Files created:**
  - `backend/ps-bridge/Invoke-PSAssignment.ps1` — PowerShell CSOM script
  - `backend/ps-bridge/bridge-server.js` — Express server spawning PowerShell
  - `backend/ps-bridge/setup-bridge.ps1` — One-time VM setup
  - `backend/ps-bridge/deploy-to-vm.sh` — Deployment helper
- **Backend integration:**
  - `server.js`: Added `callPSBridge()` helper, updated `/api/ps/projects/:id/resources` to use bridge with REST fallback
  - Added new endpoints: `POST /api/ps/assign-all`, `GET /api/ps/bridge/health`
- **VM deployment:**
  - Node.js v20 installed on VM
  - Express + bridge-server.js running at `C:\ps-bridge\`
  - Firewall rule `allow-ps-bridge` (port 8080) created in GCP
  - Registered as Windows Scheduled Task "PSBridgeServer" (auto-start on boot)
  - NTLM loopback check disabled (`DisableLoopbackCheck=1` + `BackConnectionHostNames` registry)
- **Key fix:** Used `$null = $draft.Assignments.Add($ai)` instead of `| Out-Null` or `[void]` to suppress CSOM object output in PowerShell heredocs

#### 7. CSOM Assignment — PROVEN WORKING (Manual + Bridge)
- **Manual test on VM (RDP):**
  ```
  Project: Mobile App Revamp — Resource: Ahmed Khalil — Task: UI/UX Redesign
  Result: Success
  ```
- **Bridge API test (remote HTTP):**
  ```
  POST http://34.29.110.174:8080/api/assign
  Body: {"projectName":"Customer Portal","assignments":[{"resourceName":"Fatima Hassan","taskName":"Frontend Development"}]}
  Result: {"success":true,"message":"Publish: Success. Added 1, skipped 0."}
  ```

#### 8. ALL Resources Assigned Across ALL 5 Projects ✅
Successfully assigned via CSOM bridge (`POST /api/assign`):

| Project | PM Assigned | Tasks Assigned | Result |
|---------|------------|----------------|--------|
| ERP Modernization | Sarah Ahmed | 8/8 tasks | Success |
| Cloud Migration | Mohammed Ali | 8/8 tasks | Success |
| Customer Portal | Fatima Hassan | 7/7 tasks | Success |
| Data Analytics Platform | Ahmed Khalil | 7/7 tasks | Success |
| Mobile App Revamp | Sarah Ahmed | 7/7 tasks | Success |

**Total: 37 task assignments across 5 projects, all via CSOM single-queue-job publish.**

PWA Tasks view now shows work hours and resource assignments for all projects.

---

### Current State (Everything Working)

| Feature | Status | Method |
|---------|--------|--------|
| PWA accessible | ✅ Working | `http://34.29.110.174/pwa` |
| PS Bridge Server | ✅ Running | `http://34.29.110.174:8080/health` |
| Read projects from PS | ✅ Working | REST API |
| Read tasks from PS | ✅ Working | REST API |
| **Bayan AI Chat (bilingual)** | ✅ **Working** | GPT-5.2 + function calling |
| **Voice Input** | ✅ **Working** | Web Speech API (ar-SA / en-US) |
| **AI Write-Back (task update)** | ✅ **Working** | Function calling → REST API PATCH |
| **AI Write-Back (resource assign)** | ✅ **Working** | Function calling → CSOM Bridge |
| **Action Confirmation Cards** | ✅ **Working** | Two-phase: propose → confirm → execute |
| **Morning Briefing** | ✅ **Working** | Dynamic portfolio summary |
| **PS Connection Indicator** | ✅ **Working** | Sidebar with refresh button |
| **Floating Bayan Chat (all pages)** | ✅ **Working** | Page-context aware FAB + chat panel |
| **E2E Tests (23/23)** | ✅ **Passing** | Playwright + Chromium |
| Portfolio Dashboard | ✅ Working | Live PS data |
| Risk Analysis | ✅ Working | AI + mock risks |
| Document Generation | ✅ Working | GPT-5.2 |
| Update task progress | ✅ Working | REST API PATCH |
| Update project schedule | ✅ Working | REST API PATCH |
| **Assign resources** | ✅ **Working** | CSOM Bridge Server |
| **All 37 tasks assigned** | ✅ **Done** | CSOM Bridge (all 5 projects) |

---

### Pending / Next Steps

#### 1. Deploy to App Engine (BOTH backend + frontend)
```bash
# Backend
cd backend && gcloud app deploy --project=epm-ai-demo-20260201 --quiet

# Frontend (update API URLs first)
cd frontend/src/pages
for f in *.jsx; do sed -i '' "s|http://localhost:3001|https://epm-ai-demo-20260201.uc.r.appspot.com|g" "$f"; done
cd ../.. && npm run build && gcloud app deploy --project=epm-ai-demo-20260201 --quiet
```

#### 2. Polish & Enhancement
- PMO Performance (UC4): replace hardcoded KPIs with real data
- Strategic Alignment (UC5): add AI analysis (currently has none)
- Risk Center (UC6): add "Apply Mitigation" button for resource reallocation

#### 3. Full Demo Flow
See **DEMO-FLOW.md** for complete Bayan storytelling demo script.

---

### Technical Notes for Future Sessions

#### Force Checkin All Projects (if needed)
```bash
cd backend && node -e "
import httpntlm from 'httpntlm';
const PWA = 'http://34.29.110.174/pwa';
const auth = { username: 'info', password: 'rXr<{=eiKQ,49+V', domain: 'EPMTRIAL' };
function req(method, url, body, extra = {}) {
  return new Promise((resolve, reject) => {
    httpntlm[method.toLowerCase()]({ url, ...auth, headers: { 'Accept': 'application/json;odata=verbose', 'Content-Type': 'application/json;odata=verbose', ...extra }, body: body ? JSON.stringify(body) : undefined }, (err, res) => { if (err) reject(err); let d; try { d = JSON.parse(res.body); } catch { d = res.body; } resolve({ status: res.statusCode, data: d }); });
  });
}
async function main() {
  const dr = await req('POST', PWA + '/_api/contextinfo', {});
  const digest = dr.data.d.GetContextWebInformation.FormDigestValue;
  const pr = await req('GET', PWA + '/_api/ProjectServer/Projects?\\\$select=Id,Name,IsCheckedOut');
  for (const p of pr.data.d.results) {
    if (p.IsCheckedOut) {
      const ci = await req('POST', PWA + '/_api/ProjectServer/Projects(\\'' + p.Id + '\\')/Draft/checkIn(true)', {}, { 'X-RequestDigest': digest });
      console.log('Checked in: ' + p.Name + ' (' + ci.status + ')');
    }
  }
}
main();
"
```

#### Re-upload All Data (if needed)
```bash
cd backend && PS_PASSWORD='rXr<{=eiKQ,49+V' node scripts/upload-to-project-server.js
```
Then re-assign all resources via bridge (see Section 8 above).

#### Bridge Server Debugging
```bash
# Health check
curl http://34.29.110.174:8080/health

# List projects via CSOM
curl http://34.29.110.174:8080/api/projects

# List resources
curl http://34.29.110.174:8080/api/resources

# List tasks for a project
curl "http://34.29.110.174:8080/api/projects/Mobile%20App%20Revamp/tasks"

# Assign resource
curl -X POST http://34.29.110.174:8080/api/assign \
  -H "Content-Type: application/json" \
  -d '{"projectName":"Customer Portal","assignments":[{"resourceName":"Mohammed Ali","taskName":"Security Testing"}]}'
```

#### PowerShell CSOM Output Suppression
When writing PowerShell scripts that call CSOM methods inside double-quoted heredocs (`@"..."`):
- **Use:** `$null = $draft.Assignments.Add($ai)` — most reliable
- **Avoid:** `[void]$draft.Assignments.Add($ai)` — can break in heredocs
- **Avoid:** `$draft.Assignments.Add($ai) | Out-Null` — pipeline can leak objects
