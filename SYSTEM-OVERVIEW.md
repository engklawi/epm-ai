# EPM-AI System Overview

## For Context: What This Document Is

This document describes the EPM-AI system (branded as "Bayan" / بيان) in detail. It is intended to be consumed by another LLM or technical/business stakeholder who needs to fully understand the system's purpose, capabilities, business logic, data model, and user experience. The emphasis is on the **business value and use cases**, with a concise technical appendix at the end.

---

## 1. Executive Summary

EPM-AI (branded **Bayan** — Arabic for "clarity") is an AI-powered Enterprise Project Management intelligence layer that sits on top of Microsoft Project Server. It transforms raw project data into actionable executive intelligence.

**The core value proposition:** Instead of PMO teams spending hours manually compiling reports, cross-referencing spreadsheets, and identifying risks across a portfolio, Bayan does it in seconds — with AI-powered insights, predictive analytics, and the unique ability to **write changes back to Project Server** through natural language conversation.

**Key differentiator:** Bayan is not a standalone tool. It integrates directly with an organization's existing Microsoft Project Server infrastructure. It reads live project data (tasks, schedules, resources, progress) and can write back changes (task updates, resource assignments) — all through conversational AI with human-in-the-loop governance.

**Live URL:** https://bayan-dga.macsoft.ai/

---

## 2. The Problem Bayan Solves

Enterprise PMOs (Project Management Offices) struggle with:

1. **Data Fragmentation** — Project data lives in Microsoft Project Server, risk assessments in spreadsheets, PM performance reviews in documents, strategic objectives in presentations. Nobody has a unified view.

2. **Reactive Management** — By the time a project turns "red" in traditional dashboards, it's often too late. PMO directors discover problems at monthly reviews when the damage is already done.

3. **Insight Extraction** — Raw data (task progress %, budget spent, resource hours) doesn't tell a story. Connecting "Fatima's workload is 95%" to "Customer Portal is RED" to "3 risks are increasing" requires a human analyst spending hours.

4. **Action Bottleneck** — Even after identifying a problem, executing the fix (reassigning a resource, updating a schedule) requires logging into Project Server, navigating the interface, and making the changes manually. This creates delays between decision and action.

5. **Reporting Burden** — Status reports, project charters, and meeting minutes are written manually, consuming hours of PM time that could be spent managing projects.

---

## 3. The Bayan Solution — 9 Use Cases

### Use Case 1: Bayan AI Assistant (Persistent Sidebar)

**What it is:** An always-present AI chat panel on the right side of every page (350px wide). Bayan is not a chatbot — it is an AI PMO Director with a distinct personality: confident, data-driven, proactive, bilingual (English/Arabic).

**What it does:**
- Answers portfolio questions using live Project Server data ("What's the situation with Customer Portal?")
- Provides analysis that connects dots across projects, risks, PMs, and strategy
- **Proactively recommends actions** — when it identifies a problem, it doesn't just report it. It suggests specific fixes and offers to execute them
- **Writes back to Project Server** through a two-phase confirmation flow:
  - Phase 1: AI proposes an action (e.g., "Assign Mohammed Ali to Payment Integration on Customer Portal")
  - Phase 2: A confirmation card appears in the chat. The user must click [Confirm] to execute
  - Phase 3: The system executes the change on Microsoft Project Server in real-time

**Supported write-back actions:**
1. **Update Task Progress** — Change the completion percentage of any task (e.g., "Update Payment Integration to 50%")
2. **Assign Resource** — Assign a PM/resource to any task on any project (e.g., "Assign Mohammed Ali to Security Testing on Customer Portal")

**Page-context awareness:** Bayan knows which page the user is currently viewing and tailors its responses and suggestions accordingly. On the Risk Center, it focuses on risks. On PM Scoring, it focuses on PM performance.

**AI Model:** OpenAI GPT-5.2 with function calling. When OpenAI is unavailable, the system falls back to a local regex-based intent detection engine that can still detect and execute write-back actions.

---

### Use Case 2: Portfolio Dashboard (Directors Dashboard)

**What it is:** The main landing page — an executive-level overview of the entire project portfolio.

**What it shows:**
- **KPI Cards** — Total Projects (5), Portfolio Budget ($7.0M), Budget Utilized (55%), Average ROI (204%), Strategic Fit (92%)
- **Health Distribution** — Donut chart: 2 On Track (green), 2 At Risk (yellow), 1 Critical (red)
- **Budget vs Spend** — Horizontal bar chart comparing allocated budget to actual spend per project
- **Progress Trend** — Line chart showing portfolio progress over time
- **Risk Heat Map** — Table with project name, risk score, budget risk, schedule, alignment, ROI, and status
- **AI-Generated Recommendations** — 3 actionable recommendations (Immediate Action, Budget Optimization, Strategic Move)
- **AI Executive Summary** — A full paragraph synthesized by GPT-5.2 analyzing the portfolio state, identifying the biggest threat, and recommending a specific action
- **What-If Simulator** — An interactive tool to model "what if" scenarios (e.g., "What if we reassigned Mohammed Ali to Customer Portal?")

**Data source:** Live from Microsoft Project Server (tasks, progress, schedules) merged with enrichment data (ROI, alignment scores, risk scores, AI insights).

---

### Use Case 3: Strategy & ROI

**What it is:** Shows how each project contributes to the organization's strategic objectives and their expected return on investment.

**What it shows:**
- ROI comparison across all 5 projects (bar chart)
- Strategic objectives breakdown (Digital Transformation 30%, Cost Optimization 25%, Customer Experience 30%, Data-Driven Decisions 15%)
- Alignment radar chart
- Project-to-objective mapping

**Business value:** Answers the executive question: "Are we investing in the right projects?" For example, Data Analytics Platform has 320% ROI and 98% strategic alignment — it's the star project. Customer Portal has lower ROI and is consuming budget disproportionately — is it still worth the investment?

---

### Use Case 4: PMO Performance

**What it is:** Cross-project performance metrics for the PMO as a whole.

**What it shows:**
- Delivery success rates
- Budget accuracy (planned vs. actual)
- Resource utilization across the portfolio
- Quarterly comparison

**Business value:** Answers: "How effective is our PMO?" This is the organizational health check, not just project-level.

---

### Use Case 5: Strategic Alignment

**What it is:** Maps each project to the organization's strategic objectives with alignment scores.

**What it shows:**
- Project-to-objective mapping matrix
- Alignment gaps (e.g., Cost Optimization has only one supporting project)
- Overall alignment score

**Business value:** Ensures the portfolio serves the organization's strategy. Identifies gaps where objectives lack supporting projects and overlaps where too many projects compete for the same objective.

---

### Use Case 6: Risk Management Center

**What it is:** AI-powered predictive risk identification and mitigation.

**What it shows:**
- **Risk Matrix** — Scatter plot of probability vs. impact for all 6 risks
- **Risk by Category** — Bar chart (Resource, Scope, Financial, Technical, Schedule)
- **Risk Score Trend** — Line chart showing risk trend over time
- **Critical Risk Cards** — Deep-dive cards for each critical risk, including:
  - AI-detected historical pattern match (e.g., "Budget Overrun Pattern")
  - Confidence level of the pattern match
  - AI-recommended mitigation with success rate and recovery timeline
  - **Monte Carlo Simulation** — Shows probability of escalation with and without mitigation action (e.g., Budget Overrun: 92% probability without action, 35% with mitigation)
- **Complete Risk Register** — Table with all 6 risks, their scores, trends, and statuses
- **AI Risk Analysis** — Full narrative analysis from GPT-5.2

**Current risks in the system:**
| Risk | Project | Score | Status | Trend |
|------|---------|-------|--------|-------|
| Resource Shortage | ERP Modernization | 56 | Open | Increasing |
| Scope Creep | ERP Modernization | 42 | Monitoring | Stable |
| Budget Overrun | Customer Portal | 77 | Critical | Increasing |
| Technical Debt | Customer Portal | 49 | Open | Increasing |
| Timeline Delay | Customer Portal | 68 | Critical | Increasing |
| Integration Complexity | Mobile App Revamp | 33 | Monitoring | Stable |

**Business value:** Traditional risk registers are static lists updated monthly. Bayan's Risk Center uses AI pattern matching, Monte Carlo simulations, and trend analysis to predict risk escalation BEFORE it happens, and recommends specific mitigations with success probabilities.

---

### Use Case 7: Document Generation

**What it is:** AI-generated project documents in seconds.

**Supported document types:**
1. **Status Report** — Executive summary, progress update, budget status, key risks, next steps
2. **Project Charter** — Project overview, strategic alignment, timeline, budget, success criteria
3. **Meeting Summary** — Attendees, discussion points, decisions, action items with owners

**How it works:** User selects a document type and a project. GPT-5.2 generates the document using live data from Project Server and enrichment data. The document is structured with clear sections and professional language.

**Business value:** A status report that takes a PM 2-4 hours to compile is generated in 3 seconds, using live data that's always current.

---

### Use Case 8: Executive Predictions

**What it is:** AI-powered forecasting for project outcomes.

**What it shows:**
- Budget overrun probability per project
- On-time delivery probability (e.g., Customer Portal: 15% on-time probability)
- Resource strain forecasts
- Best case vs. worst case scenario analysis

**Business value:** Moves PMO from reactive ("this project is late") to predictive ("this project has a 15% chance of being on time — here's what we need to do"). Enables proactive intervention before problems become crises.

---

### Use Case 9: PM Scoring & Development

**PM Scoring** shows:
- Performance leaderboard ranked by overall score
- Competency radar charts (delivery, budget management, risk resolution, stakeholder satisfaction, documentation)
- Trend indicators (up/down/stable)
- Workload metrics

**PM Development** shows:
- Training recommendations based on skill gaps
- Mentorship pairing suggestions (e.g., pair Mohammed Ali with Sarah Ahmed)
- Skill gap analysis per PM

**Current PM data:**
| PM | Score | Workload | Trend | Active Projects |
|----|-------|----------|-------|-----------------|
| Sarah Ahmed | 90 | 85% | Up | ERP Modernization, Data Analytics Platform |
| Mohammed Ali | 90 | 60% | Stable | Cloud Migration |
| Fatima Hassan | 73 | 95% | Down | Customer Portal |
| Ahmed Khalil | 83 | 70% | Stable | Mobile App Revamp |

**Business value:** Turns PM management from subjective annual reviews into data-driven continuous monitoring. Identifies burnout risk (Fatima at 95%) and available capacity (Mohammed at 60%) before they become problems.

---

## 4. The Demo Data Narrative

The 5 projects in the system tell a carefully crafted story:

**The Crisis:** Customer Portal is in RED — 35% progress with 83% of budget spent. It has 3 risks all trending upward (Budget Overrun score 77, Timeline Delay score 68, Technical Debt score 49). The root cause? Its PM, Fatima Hassan, has a score of 73, is at 95% workload capacity, and trending DOWN. She's talented but overloaded.

**The Solution:** Mohammed Ali has a score of 90, only 60% workload, and is available. The demo shows Bayan identifying this mismatch and proposing to assign Mohammed Ali to Customer Portal — then executing that assignment LIVE on Project Server.

**The Success Story:** Data Analytics Platform is GREEN — 48% progress, 320% expected ROI, 98% strategic alignment. It's proof that when projects are properly resourced and aligned, the system works beautifully.

**The Middle Ground:** ERP Modernization (YELLOW, 55%) and Mobile App Revamp (YELLOW, 54%) represent projects that need monitoring but aren't in crisis. Cloud Migration (GREEN, 65%) is healthy and on track.

This narrative arc — crisis detection, root cause diagnosis, AI-recommended solution, live execution — forms the backbone of every demo.

---

## 5. The Bayan Persona

Bayan is not a generic chatbot. It has a carefully designed personality:

- **Name:** Bayan (بيان) — Arabic for "clarity" or "clear expression"
- **Role:** AI PMO Director (not assistant — director)
- **Experience:** Speaks like a senior PMO director with 20 years of experience
- **Personality traits:**
  - Confident and decisive — doesn't hedge or qualify excessively
  - Data-driven — always cites specific numbers, percentages, and names
  - Proactive — doesn't wait to be asked; when it sees a problem, it proposes a solution
  - Systems thinker — explains ripple effects ("if X changes, here's what happens to Y and Z")
  - Caring about the team — mentions PMs by name, warns about burnout, acknowledges good work
  - Bilingual — responds in the same language the user writes in (English or Arabic)
- **Visual identity:** Abstract prism/diamond avatar with purple gradient and light rays

**Example of Bayan's voice:**
When asked "What's wrong with Customer Portal?", Bayan doesn't say "Customer Portal has some issues." It says:

> "Customer Portal is in a critical state — 35% progress with 83% of budget already consumed. The burn rate is 2.3x faster than progress, which tells me we'll exhaust the budget before reaching 60% completion. Three risks are clustering on this project (Budget Overrun score 77, Timeline Delay score 68, Technical Debt score 49), and all three are trending UPWARD. This isn't coincidence — it's systemic. The root cause? Fatima Hassan is carrying this project at 95% capacity with a declining trend. She needs reinforcement. Mohammed Ali has a score of 90 and is at 60% workload. I recommend assigning him to the Payment Integration task immediately. Shall I do that?"

---

## 6. Authentication & Access

- **Method:** Firebase Authentication with email/password
- **Access model:** Whitelist-only — no public sign-up. New users must be added manually (Firebase Console + backend whitelist)
- **Demo credentials:** info@macsoft.ai / Demo2026!
- **Session management:** Firebase ID tokens, verified on every API request

---

## 7. The 5 Projects in Detail

### Project 1: ERP Modernization
- **PM:** Sarah Ahmed
- **Health:** YELLOW | **Progress:** 55% | **Budget:** $2.5M
- **Strategic Objective:** Digital Transformation
- **ROI:** 145% | **Alignment:** 92%
- **Timeline:** Jul 2025 — Dec 2026
- **Key risks:** Resource shortage, Scope creep
- **8 Tasks:** Requirements Analysis (100%), System Design (90%), Database Migration (75%), API Development (60%), Frontend Redesign (45%), Testing & QA (20%), User Training (10%), Go-Live Preparation (5%)

### Project 2: Cloud Migration
- **PM:** Mohammed Ali
- **Health:** GREEN | **Progress:** 65% | **Budget:** $1.8M
- **Strategic Objective:** Cost Optimization
- **ROI:** 210% | **Alignment:** 88%
- **Timeline:** Sep 2025 — Jun 2026
- **Key risks:** None critical
- **8 Tasks:** Infrastructure Assessment (100%), Cloud Architecture (95%), Security Framework (80%), Data Transfer (70%), Application Refactoring (55%), Load Testing (40%), Monitoring Setup (30%), Production Cutover (15%)

### Project 3: Customer Portal (THE CRISIS PROJECT)
- **PM:** Fatima Hassan
- **Health:** RED | **Progress:** 35% | **Budget:** $900K
- **Strategic Objective:** Customer Experience
- **ROI:** 180% | **Alignment:** 95%
- **Timeline:** Aug 2025 — May 2026
- **Key risks:** Budget overrun (77), Timeline delay (68), Technical debt (49)
- **7 Tasks:** UX Research & Wireframes (80%), Frontend Development (55%), Backend API Development (40%), Payment Integration (25%), Security Testing (15%), Legacy System Integration (10%), User Acceptance Testing (5%)

### Project 4: Data Analytics Platform
- **PM:** Ahmed Khalil (in mock data as Sarah Ahmed on PS)
- **Health:** GREEN | **Progress:** 48% | **Budget:** $1.2M
- **Strategic Objective:** Data-Driven Decisions
- **ROI:** 320% | **Alignment:** 98%
- **Timeline:** Oct 2025 — Sep 2026
- **Key risks:** None critical
- **7 Tasks:** Data Pipeline Architecture (90%), ETL Development (70%), Dashboard Framework (55%), ML Model Integration (35%), Data Governance Setup (30%), User Training (10%), Performance Optimization (15%)

### Project 5: Mobile App Revamp
- **PM:** Sarah Ahmed (in mock data as Ahmed Khalil on PS)
- **Health:** YELLOW | **Progress:** 54% | **Budget:** $600K
- **Strategic Objective:** Customer Experience
- **ROI:** 165% | **Alignment:** 85%
- **Timeline:** Oct 2025 — May 2026
- **Key risks:** Integration complexity (33)
- **7 Tasks:** UI/UX Redesign (90%), Core Features Dev (70%), Push Notifications (60%), Offline Mode (45%), API Integration (40%), Beta Testing (25%), App Store Submission (10%)

---

## 8. Strategic Objectives

The portfolio maps to 4 organizational strategic objectives (inspired by Saudi Vision 2030):

| Objective | Weight | Description |
|-----------|--------|-------------|
| Digital Transformation | 30% | Modernize IT infrastructure and processes |
| Cost Optimization | 25% | Reduce operational costs through technology |
| Customer Experience | 30% | Enhance digital customer touchpoints |
| Data-Driven Decisions | 15% | Build analytics capabilities for informed strategy |

---

## 9. Technical Architecture (Brief)

### System Components
```
User (Browser)
  |
  v
Frontend (React + Vite, hosted on Google App Engine)
  |
  v (HTTP with Firebase Auth tokens)
Backend (Node.js + Express, hosted on Google App Engine)
  |
  |--- OpenAI GPT-5.2 (AI chat, document generation, analysis)
  |
  |--- Microsoft Project Server (via REST API with NTLM auth)
  |      Reads: projects, tasks, schedules, progress, resources
  |      Writes: task progress updates, schedule updates
  |
  |--- PS Bridge Server (Express on Windows VM, port 8080)
  |      Executes PowerShell CSOM scripts for resource assignments
  |      Solves REST API queue blocking issue
  |
  |--- Mock JSON Data (risks, PM scores, strategic objectives, AI insights)
         Enriches live PS data with business context
```

### Data Architecture
The system uses a **two-tier data model**:
- **Tier 1 (Live):** Microsoft Project Server provides real-time operational data — project names, task lists, progress percentages, resource assignments, schedules, costs
- **Tier 2 (Enrichment):** Local JSON files provide business intelligence data — risk assessments, PM competency scores, strategic objectives, AI insights, ROI calculations

These are merged by a data service layer with a 5-minute TTL cache. The frontend receives a unified data object that appears seamlessly integrated.

### Why Two API Paths for Write-Back?
- **Task updates** use the REST API directly (simple PATCH operation)
- **Resource assignments** use a CSOM Bridge Server running on the Project Server VM

The reason: Project Server's queue system uses correlation-based job grouping. When you assign a resource via REST API, it creates a queue job for the assignment AND a separate queue job for publishing — these block each other. CSOM (Client-Side Object Model) batches all changes in memory and publishes as a single queue job, avoiding the blocking issue.

### Hosting
- **Frontend:** Google App Engine (static site)
- **Backend:** Google App Engine (Node.js)
- **Project Server VM:** Google Compute Engine (Windows Server 2022, running MS Project Server 2016, SharePoint 2016, SQL Server, IIS)
- **Domain:** bayan-dga.macsoft.ai (custom domain pointing to App Engine)

---

## 10. Key Business Metrics the System Tracks

| Metric | Where Shown | Description |
|--------|-------------|-------------|
| Project Health (RED/YELLOW/GREEN) | Dashboard, all pages | Overall project status based on progress, budget, and risk |
| Budget Utilization % | Dashboard, Strategy | Spent vs. allocated budget |
| ROI % | Strategy & ROI | Expected return on investment per project |
| Strategic Alignment Score | Strategy, Alignment | How well a project maps to organizational objectives |
| Risk Score (0-100) | Risk Center | Composite of probability x impact |
| Monte Carlo Simulation | Risk Center | Probability of risk escalation with/without mitigation |
| PM Performance Score (0-100) | PM Scoring | Composite of delivery, budget, risk, stakeholder, documentation |
| PM Workload % | PM Scoring, Development | Current capacity utilization |
| On-Time Delivery Probability | Predictions | AI-predicted likelihood of meeting deadline |
| Budget Overrun Probability | Predictions | AI-predicted likelihood of exceeding budget |

---

## 11. What Makes This System Unique

1. **Live Integration** — Not a mockup. Connected to real Microsoft Project Server with real-time data.
2. **AI Write-Back** — The AI doesn't just analyze; it can execute changes on Project Server through natural language.
3. **Human-in-the-Loop** — Every AI-proposed action requires explicit user confirmation before execution. AI recommends, humans decide.
4. **Persona-Driven AI** — Bayan has a distinct personality, not a generic chatbot. It speaks like a senior PMO director.
5. **Page-Context Awareness** — The AI knows which page you're viewing and tailors responses accordingly.
6. **Monte Carlo Simulations** — Risk predictions based on 1,000 simulations, not gut feeling.
7. **Two-Tier Data** — Combines operational data (from Project Server) with business intelligence (AI insights, risk scores, PM scores) for a complete picture.
8. **Bilingual** — Supports both English and Arabic (professional formal Arabic).
9. **Document Generation** — AI generates status reports, charters, and meeting minutes in seconds using live data.
10. **Predictive, Not Reactive** — Forecasts project outcomes (on-time probability, budget overrun probability) to enable proactive intervention.
