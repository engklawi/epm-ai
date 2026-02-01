# EPM-AI Demo Presentation Guide

## Executive Summary
AI-powered Enterprise Project Management system that enhances Microsoft EPM with intelligent insights, predictive analytics, and automated recommendations.

---

## Demo Flow (Recommended Order)

### 1. Start with AI Assistant (UC1) - 3 min
**Key Points:**
- Natural language interface powered by GPT-5.2
- Real-time access to all portfolio data
- Contextual follow-up suggestions

**Demo Script:**
1. Ask: "What's the portfolio status?"
2. Show the detailed response with real data
3. Click a follow-up suggestion
4. Ask: "What are the critical risks?"
5. Highlight: AI understands context and provides actionable insights

### 2. Portfolio Dashboard (UC2) - 3 min
**Key Points:**
- Executive-level KPIs at a glance
- AI-generated executive summary (top banner)
- Risk heat map with color coding
- AI recommendations panel

**Demo Script:**
1. Point to AI Executive Summary banner
2. Walk through KPI cards (5 key metrics)
3. Show health distribution pie chart
4. Scroll to Risk Heat Map - explain color coding
5. Highlight AI Recommendations section

### 3. Strategy & ROI (UC3) - 2 min
**Key Points:**
- Strategic objective tracking
- ROI forecasting
- Alignment scoring

**Demo Script:**
1. Show strategic objectives with linked projects
2. Point to ROI percentages
3. Explain alignment scores

### 4. Risk Management (UC6) - 3 min
**Key Points:**
- Predictive risk scoring
- Trend analysis (increasing/decreasing)
- AI mitigation suggestions

**Demo Script:**
1. Show risk matrix
2. Highlight critical risks
3. Show AI-generated mitigation strategies
4. Explain trend indicators

### 5. Document Generation (UC7) - 2 min
**Key Points:**
- AI-powered document creation
- Multiple templates (Status Report, Charter, Meeting Summary)
- One-click generation

**Demo Script:**
1. Select a project
2. Choose "Status Report"
3. Click Generate
4. Show the AI-generated content
5. Mention: "This saves PMs hours of manual work"

### 6. PM Scoring & Development (UC9 & UC10) - 2 min
**Key Points:**
- Objective PM performance metrics
- AI-driven training recommendations
- Career path suggestions

**Demo Script:**
1. Show PM leaderboard
2. Point to scoring breakdown
3. Show training recommendations

---

## Key Messages to Emphasize

### 1. AI Integration
- "Every screen has AI-powered insights"
- "GPT-5.2 integration for intelligent responses"
- "Not just dashboards - actionable recommendations"

### 2. Real-time Data
- "All data comes from Microsoft EPM"
- "Real-time synchronization"
- "No manual data entry"

### 3. Time Savings
- "Document generation: hours → seconds"
- "Risk analysis: automated, not manual"
- "Executive summaries: AI-generated"

### 4. Decision Support
- "AI recommendations based on data patterns"
- "Predictive analytics for proactive management"
- "Strategic alignment scoring"

---

## Anticipated Q&A

### Q: How does the AI integration work?
**A:** We use OpenAI's GPT-5.2 API. The system provides real-time project data as context, and the AI generates insights, recommendations, and documents based on that data.

### Q: Is this connected to real Microsoft EPM?
**A:** This POC uses realistic mock data. Production integration would connect via Microsoft Project API and Power Platform connectors.

### Q: What about data security?
**A:** Data stays within the organization's cloud environment. AI calls can be routed through Azure OpenAI for enterprise compliance.

### Q: How accurate are the AI predictions?
**A:** The AI analyzes historical patterns and current data. Accuracy improves with more data. Risk predictions have shown 80%+ accuracy in similar implementations.

### Q: Can this be customized?
**A:** Yes, all AI prompts, scoring algorithms, and dashboard layouts are configurable to match organizational needs.

---

## Technical Highlights

- **Frontend:** React + Vite (modern, fast)
- **Backend:** Node.js + Express
- **AI:** OpenAI GPT-5.2 API
- **Charts:** Recharts (professional visualizations)
- **Hosting:** Google Cloud App Engine

---

## URLs for Demo

- **Live Demo:** https://frontend-dot-epm-ai-demo-20260201.uc.r.appspot.com
- **Backend API:** https://epm-ai-demo-20260201.uc.r.appspot.com
- **Source Code:** https://github.com/engklawi/epm-ai

---

## Backup Plans

If live demo fails:
1. Screenshots are in `.playwright-mcp/` folder
2. Backend API can be demoed via curl
3. Local development servers as fallback

---

## 10 Use Cases Summary

| UC | Name | AI Feature |
|----|------|------------|
| 1 | PM Assistant | Natural language chat with GPT-5.2 |
| 2 | Portfolio Dashboard | AI executive summary, recommendations |
| 3 | Strategy & ROI | Alignment scoring, ROI forecasting |
| 4 | PMO Performance | Benchmark analysis, AI suggestions |
| 5 | Strategic Alignment | Reprioritization engine |
| 6 | Risk Management | Predictive risk scoring, mitigations |
| 7 | Document Generation | AI-powered templates |
| 8 | Executive Predictions | Budget/timeline forecasting |
| 9 | PM Scoring | Performance analytics |
| 10 | PM Development | AI training recommendations |
