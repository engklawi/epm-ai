# EPM-AI Project - Claude Code Instructions

## Project Structure
```
EPM-AI/
├── backend/          # Node.js Express API
│   ├── server.js     # Main API server
│   ├── data/         # Mock JSON data
│   └── app.yaml      # GCP App Engine config
├── frontend/         # React + Vite
│   ├── src/pages/    # 10 Use Case pages
│   └── app.yaml      # GCP App Engine config
```

## Local Development
```bash
# Backend (Terminal 1)
cd backend && npm run dev

# Frontend (Terminal 2)  
cd frontend && npm run dev
```

## Deploy to Google Cloud

### Prerequisites
```bash
export PATH="$HOME/google-cloud-sdk/bin:$PATH"
gcloud auth login  # if not already logged in
```

### Deploy Commands
```bash
PROJECT_ID="epm-ai-demo-20260201"

# 1. Update frontend API URLs to production
BACKEND_URL="https://$PROJECT_ID.uc.r.appspot.com"
cd frontend/src/pages
for f in *.jsx; do sed -i '' "s|http://localhost:3001|$BACKEND_URL|g" "$f"; done
cd ../..

# 2. Build frontend
npm run build

# 3. Deploy backend
cd ../backend
gcloud app deploy --project=$PROJECT_ID --quiet

# 4. Deploy frontend
cd ../frontend
gcloud app deploy --project=$PROJECT_ID --quiet
```

### Live URLs
- **Frontend:** https://frontend-dot-epm-ai-demo-20260201.uc.r.appspot.com
- **Backend:** https://epm-ai-demo-20260201.uc.r.appspot.com
- **GitHub:** https://github.com/engklawi/epm-ai

## Environment Variables
Backend needs:
- `OPENAI_API_KEY` - For AI chat and document generation

## Use Cases (10 total)
1. PM Assistant - AI Chat
2. Portfolio Dashboard
3. Strategy & ROI
4. PMO Performance
5. Strategic Alignment
6. Risk Center
7. Document Generation
8. Executive Predictions
9. PM Scoring
10. PM Development
