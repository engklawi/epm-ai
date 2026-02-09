# EPM-AI Demo Guide

## Pre-Demo Setup (2 minutes before)

1. Open **https://bayan-dga.macsoft.ai/** in Chrome
2. Login with `info@macsoft.ai` / `Demo2026!`
3. Make sure Bayan panel is visible on the right
4. Have the browser full-screen (no distractions)
5. Start on the **Portfolio Dashboard** page

---

## Act 1: "THE PROBLEM" (5 minutes)

**Goal:** Hook the audience — show them a real crisis the AI found

### Step 1 — Portfolio Dashboard (you're already here)

> *"This is a live dashboard connected to Microsoft Project Server. Everything you see is real data, not a mockup."*

- Point to the **5 project cards** — show the color coding (green, yellow, red)
- Point to **Customer Portal in RED** — *"Notice this one? 35% progress, but 83% of the budget is already spent. That's a problem."*

### Step 2 — Ask Bayan your first question

Type in the Bayan panel:
> **"What's the situation with Customer Portal?"**

- Let Bayan respond — it will pull live data from Project Server and give a rich analysis
- *"Notice Bayan didn't just repeat numbers — it analyzed the burn rate, identified the PM is overloaded, and connected it to 3 active risks."*

### Step 3 — Navigate to Risk Center (sidebar)

- Show the **risk heat map** — Customer Portal has 3 risks clustered in high-probability/high-impact zone
- Point to **Budget Overrun (score: 77, Critical)** and **Timeline Delay (score: 68, Critical)**
- Show the **Monte Carlo simulation** — *"The AI ran 1,000 simulations. Without action, there's an 85% chance of escalation."*

> **Transition:** *"So we have a crisis. But a dashboard just shows you the problem. Let me show you how Bayan diagnoses the ROOT CAUSE."*

---

## Act 2: "THE DIAGNOSIS" (4 minutes)

**Goal:** Show AI connecting dots that humans would miss

### Step 4 — Navigate to PM Scoring (sidebar)

- Show the **PM comparison table**
- Point to **Fatima Hassan: Score 73, Workload 95%, Trend DOWN**
- Compare to **Mohammed Ali: Score 90, Workload 60%**

> *"Fatima is Customer Portal's PM. She's talented, but she's at 95% capacity and trending down. The AI doesn't just see a red project — it sees WHY it's red."*

### Step 5 — Navigate to PM Development (sidebar)

- Show **Fatima's skill gaps** — this connects her low score to specific competency areas
- *"This isn't about blaming Fatima. The AI identified she needs support — specific training areas and possibly a co-PM."*

### Step 6 — Navigate to Executive Predictions (sidebar)

- Show the **AI predictions** for project outcomes
- Point to Customer Portal's low on-time probability (15%)
- *"Traditional dashboards show you where you ARE. AI tells you where you're GOING."*

> **Transition:** *"Now here's where it gets exciting. Bayan doesn't just diagnose — it recommends and EXECUTES solutions."*

---

## Act 3: "THE SOLUTION" — THE WOW MOMENT (5 minutes)

**Goal:** Live write-back to Project Server — the audience gasps

### Step 7 — Go back to Portfolio Dashboard

- Open the **What-If Simulator** (if available on the dashboard)
- *"What if we reassigned Mohammed Ali — our top PM at 60% workload — to help Customer Portal?"*

### Step 8 — Ask Bayan the magic question

Type in the Bayan panel:
> **"Assign Mohammed Ali to the Payment Integration task on Customer Portal"**

- **PAUSE HERE** — Let the audience see what happens:
  1. Bayan processes the request through GPT-5.2
  2. A **confirmation card appears** (amber/blue card with action details)
  3. *"Notice it's NOT executing automatically. The AI recommends, but the human decides."*

### Step 9 — Click [Confirm] on the action card

- The system sends the request through the **CSOM Bridge** on the Project Server VM
- It modifies the draft project, assigns the resource, and publishes — all as ONE queue job
- Show the **success message**

> *"That just happened LIVE on Microsoft Project Server. Not a simulation. Not a mockup. A real assignment, through a real API, on your real enterprise system."*

### Step 10 — Quick verification (optional but powerful)

- If you have the PWA tab open (`http://34.29.110.174/pwa`), switch to it and show the resource now appears
- *"For the skeptics in the room — here it is in native Project Server."*

> **Transition:** *"So we went from crisis detection to solution execution in under 3 minutes. Now let me show you the strategic layer."*

---

## Act 4: "THE VISION" (4 minutes)

**Goal:** Show the strategic value — this isn't just operational

### Step 11 — Navigate to Strategy & ROI (sidebar)

- Show the **ROI comparison across projects**
- Point to **Data Analytics Platform: 320% ROI, 98% alignment** — *"This is your star project. The AI confirms it's your best investment."*
- Contrast with Customer Portal's lower ROI and the cost of doing nothing

### Step 12 — Navigate to PMO Performance (sidebar)

- Show cross-project metrics
- *"A PMO Director sees everything in one view — not buried in 5 different MS Project files."*

### Step 13 — Navigate to Documentation (sidebar)

- Select **"Status Report"** and click Generate

> *"Watch this."*

- The AI generates a **full executive status report** in ~3 seconds
- *"That report would take a PMO analyst 2-4 hours. Bayan did it in 3 seconds, using live data from Project Server."*

> **Transition:** *"Let me bring it all together."*

---

## Act 5: "THE CLOSE" (2 minutes)

**Goal:** Let the AI deliver your closing argument

### Step 14 — Navigate to Strategic Alignment (sidebar)

- Show how projects map to strategic objectives
- *"Every project has a purpose. The AI tracks whether that purpose is being served."*

### Step 15 — The Final Bayan Question

Type in the Bayan panel:
> **"If you were presenting to the steering committee tomorrow, what would be your 3 key messages?"**

- Let Bayan synthesize everything — portfolio health, risks, recommendations
- *"That's not a canned response. Bayan just analyzed 5 live projects, 6 risks, 4 PMs, and 4 strategic objectives to give you an executive briefing on demand."*

### Step 16 — Closing statement

> *"What you just saw is AI that doesn't replace your PMO team — it makes them 10x more effective. It connects to your existing Microsoft Project Server, it respects your governance (human confirms every action), and it turns data into decisions in seconds, not days."*

---

## Key Phrases to Use During Demo

| Moment | Say This |
|--------|----------|
| When data loads | *"This is live from Project Server — not a mockup"* |
| When Bayan analyzes | *"It's connecting dots across projects, risks, and people"* |
| Before clicking Confirm | *"AI recommends, humans decide"* |
| After write-back succeeds | *"That just happened on your real Project Server"* |
| After document generates | *"3 seconds vs. 4 hours"* |

## Things to Avoid

1. **Don't click through pages too fast** — let each insight land
2. **Don't read the screen** — tell the STORY behind what they see
3. **Don't apologize for loading times** — just keep talking while data loads
4. **Don't demo more than one write-back** — one wow moment is enough

## If Something Goes Wrong

| Issue | Recovery |
|-------|----------|
| Bayan gives a short/generic response | Say *"Let me rephrase that"* and ask a more specific question |
| Page loads slowly | Talk about the architecture: *"This is calling Project Server's REST API in real-time"* |
| Write-back fails | Say *"This demonstrates the governance — the system validates before executing"* and move on |
| Login issues | Have a second browser tab already logged in |

## Key Data Points

- **Customer Portal**: RED status, 35% progress, 83% budget spent, 3 critical risks
- **Fatima Hassan**: Score 73, 95% workload, 45% attrition risk — the root cause
- **Mohammed Ali**: Score 90, 60% workload — the available solution
- **Data Analytics Platform**: 320% ROI, 98% alignment — the success story contrast
