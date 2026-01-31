# EPM-AI: Microsoft EPM + AI Integration POC

Proof of concept demonstrating 6 AI-powered use cases for Enterprise Project Management.

## Quick Start

### 1. Start Backend (Terminal 1)
```bash
cd ~/Documents/projects/EPM-AI/backend
npm run dev
```
Backend runs on: http://localhost:3001

### 2. Start Frontend (Terminal 2)
```bash
cd ~/Documents/projects/EPM-AI/frontend
npm run dev
```
Frontend runs on: http://localhost:5173

## Use Cases Implemented

| UC | Name | Features |
|----|------|----------|
| **UC1** | PM Assistant | Conversational AI, project queries, intelligent alerts |
| **UC2** | Directors Dashboard | Portfolio health, heat maps, budget tracking |
| **UC3** | Strategy & ROI | Strategic alignment, KPI mapping, ROI calculators |
| **UC6** | Risk Management | Predictive risk, auto-register, mitigation recommendations |
| **UC7** | Documentation | Auto-generate charters, reports, meeting summaries |
| **UC9** | PM Scoring | Multi-KPI scoring, balanced scorecard, leaderboards |

## Project Structure

```
EPM-AI/
├── backend/
│   ├── server.js          # Express API
│   ├── data/              # Mock data (JSON)
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── App.jsx        # Main app + routing
│   │   ├── App.css        # Global styles
│   │   └── pages/         # UC page components
│   └── package.json
├── use-cases.docx         # Original requirements
├── use-cases.md           # Extracted text
├── analysis.md            # Implementation strategy
└── README.md
```

## API Endpoints

| Endpoint | Description |
|----------|-------------|
| `GET /api/projects` | All projects |
| `GET /api/portfolio` | Portfolio summary |
| `GET /api/strategy` | Strategic objectives + ROI |
| `GET /api/risks` | Risk register |
| `GET /api/pm-scores` | PM performance data |
| `GET /api/alerts` | Intelligent alerts |
| `POST /api/chat` | AI assistant chat |
| `POST /api/documents/generate` | Generate documents |

## Tech Stack

- **Backend:** Node.js, Express
- **Frontend:** React, Vite, Recharts, Lucide Icons
- **Data:** Mock JSON (easily replaceable with real APIs)

## Next Steps (Full Implementation)

1. Connect to Microsoft Project API
2. Integrate real AI/ML models for predictions
3. Add user authentication
4. Implement real-time updates (WebSocket)
5. Add export functionality (PDF, Excel)
