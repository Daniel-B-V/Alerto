# 🌦️ Alerto — AI-Powered Class Suspension and Early Warning System  
### Prompt for Claude Optimization & System Design Feedback

## 🧠 Project Overview
**Alerto** is an AI-driven platform designed to assist in **class suspension decisions** across the Philippines.  
It gathers data from:
- Weather APIs (temperature, rainfall, wind speed, humidity)
- Community reports
- AI summarization via Gemini (for report analysis)

The system compiles these inputs and generates **advisories** recommending which cities or provinces should suspend classes.

---

## ⚙️ Current Flow
1. **Users** submit reports (e.g., flooding, heavy rain, strong winds).  
2. Reports are analyzed and summarized by **Gemini AI**.  
3. The **AI generates an advisory** showing affected cities and recommended suspensions.  
4. The **Governor** currently has the authority to issue official class suspensions per city.

---

## ⚠️ Current Issue
The AI reports are informative but appear **cluttered** and **unfinished**.  
We want to:
- Simplify the display and make it **more structured and polished**.  
- Add a clear **decision interface** for the governor.  
- Introduce a new section called **“Suspension Candidates”** — for areas being monitored but not yet officially suspended.  
- Clarify **role-based permissions** (Governor vs. Mayor).

---

## 🧾 Current Example Output

**Class Suspension Recommended**  
**Risk Level:** Critical (100%)  

**Official Advisory:**  
CLASS SUSPENSION RECOMMENDED for Batangas City, Tanauan City, Santo Tomas, Lipa City, Rosario.  
Dangerous conditions detected: Heavy rainfall, strong winds, and flooding reports.  

**Affected Cities (5):**  
- Batangas City  
- Tanauan City  
- Santo Tomas  
- Lipa City  
- Rosario  

**Contributing Factors:**
- Heavy rainfall (25–45 mm/h)  
- Winds up to 65 km/h  
- 126 critical community reports  

**Priority Actions:**
1. Suspend classes in affected areas.  
2. Notify schools and parents.  
3. Activate emergency response teams.  
4. Continue monitoring within 6 hours.  

**Forecast:** Conditions expected to remain severe (next 6–12 hours).

---

## 🧩 New Section: Suspension Candidates

This new section lists **areas under observation** based on AI-assessed risk levels but not yet officially suspended.  
Governors can review, check specific categories (e.g., elementary, high school, college, work), and issue decisions.

### 🗂️ Example Layout

**Suspension Candidates (AI Assessment):**

| City / Municipality | Risk Level | Rainfall | Wind Speed | Reports | Recommendation | Decision |
|----------------------|-------------|-----------|-------------|----------|----------------|-----------|
| Batangas City | Critical | 38 mm/h | 40 km/h | 45 | Suspend | ☑ Classes ☑ Work ☐ Activities |
| Tanauan City | High | 32 mm/h | 35 km/h | 38 | Suspend | ☑ Classes ☐ Work ☐ Activities |
| Santo Tomas | Moderate | 20 mm/h | 28 km/h | 18 | Monitor | ☐ Classes ☐ Work ☐ Activities |
| Lipa City | Critical | 45 mm/h | 65 km/h | 50 | Suspend | ☑ Classes ☑ Work ☑ Activities |
| Rosario | High | 22 mm/h | 50 km/h | 25 | Suspend | ☑ Classes ☐ Work ☐ Activities |

**Governor’s Controls:**
- Select checkboxes for **specific suspension levels**:
  - ☑ Classes (Default)
  - ☑ Work
  - ☑ Public Activities  
- **Confirm Suspension** → instantly updates the public advisory.  
- **Request More Data** → triggers AI to recheck weather and report summaries.

---

## 🏛️ Role-Based System Design

### 👑 Governor Role
**Access and Abilities:**
- View AI advisory summaries (province-wide).  
- Review suspension candidates (with risk scores).  
- Issue **official class/work/activity suspensions** per city or province.  
- View early warning system and AI forecasts.  
- Request re-analysis (e.g., “Recalculate based on latest data”).  
- Send SMS/social alerts to affected areas.  

**Governor’s Dashboard Includes:**
- AI-generated advisories.  
- Suspension Candidates table with checkboxes.  
- Summary graph of severity levels (Critical, High, Moderate).  
- Button to **Confirm Suspension** or **Override AI Recommendation**.  
- Section for **Active Suspensions** and their duration.  
- **Expected Weather Trend (Next 12 Hours)** chart.

---

### 🧑‍⚖️ Mayor Role
**Access and Abilities:**
- View **AI recommendations and weather data** for their own city only.  
- Submit **approval requests** to the governor for city-level suspensions.  
- View **user reports** specific to their municipality.  
- Cannot suspend directly without governor approval.  
- May mark schools as “Prepared” or “Affected” for monitoring.  

**Mayor’s Dashboard Includes:**
- City-level summary only.  
- Weather forecast (next 6 hours).  
- Button: **Request Suspension Approval**.  
- Status Tracker: “Pending Governor Decision.”

---

## 🌤️ Improved AI Summary Display

### 🔔 AI Advisory Summary (For Governor)
**Region:** Batangas Province  
**Date & Time:** November 10, 2025 — 5:30 AM  
**Status:** 🟥 Class Suspension Recommended  
**Overall Risk Level:** Critical (100%)  

---

### 🌦️ Weather Summary
- Temperature: 27°C  
- Conditions: Scattered Clouds  
- Rainfall: 5–45 mm/h (Heavy to Moderate)  
- Wind Speed: Up to 65 km/h  
- Humidity: 78%  

---

### 📍 Recommended Actions
- Suspend classes in **Batangas City, Tanauan City, Santo Tomas, Lipa City, Rosario**.  
- Notify parents and schools via SMS.  
- Coordinate with LGUs for flood monitoring.  
- Review “Suspension Candidates” for next action.

---

### 🧮 Summary Chart Example (for Claude to design)
| Risk Level | Number of Cities | AI Confidence |
|-------------|------------------|----------------|
| Critical | 3 | 98% |
| High | 2 | 87% |
| Moderate | 4 | 72% |

---

### ⏳ Early Warning Forecast
> Conditions expected to remain **severe** for the next 6–12 hours.  
> Heavy rainfall and strong winds likely to continue.  
> Roads may be **impassable**.  
> Please issue public advisories accordingly.

---

## 🔁 Automatic AI Reevaluation and Updates

After the governor issues a decision (e.g., suspending classes in certain cities), the system should:
1. **Log the decision** (city, suspension level, duration, timestamp).  
2. **Trigger automatic AI reevaluation** every **30 minutes** using:
   - Updated weather data  
   - New community reports  
   - Ongoing sensor/alert feeds  
3. If conditions **improve or worsen**, AI will:
   - **Update risk levels** and issue a follow-up advisory.  
   - **Notify the governor** of any new cities becoming critical.  
   - **Suggest extensions or lifting** of current suspensions.  
4. All updates appear under **“Ongoing Suspensions”** with status tags:
   - 🟢 Improving  
   - 🟠 Stable  
   - 🔴 Worsening  

This ensures the system remains **dynamic**, continuously adapting to changing weather and on-ground reports, giving authorities live decision support.

---

## 🎯 Claude, Your Task

Please analyze and enhance the following:

1. **Suspension Candidates Section**
   - Improve the visual layout and user flow (checkboxes, confirm buttons, etc.).
   - Suggest how data transitions once the governor confirms suspensions.
   - Recommend a logical structure for tracking ongoing suspensions.

2. **Governor Dashboard**
   - Suggest how the dashboard can best display both AI advisories and actionable items.
   - Propose layout ideas (priority alerts, charts, quick decisions, status tracking).

3. **AI Report Simplification**
   - Clean up clutter in current advisory format.  
   - Make the AI report more modular and easy to read.

4. **Functional Flow**
   - Explain how decisions (governor → mayors → public) should cascade.  
   - Suggest how “Suspension Candidates” integrate into the overall workflow.

5. **Automatic AI Reevaluation**
   - Refine how the reevaluation and update system can look and function.  
   - Suggest user notification logic and UI cues for live updates.

6. **Optional:** Provide text-based or mock UI layout showing what an ideal finished version of this system could look like.

---

## ✨ Goal
We want to make **Alerto** a complete and realistic system by:
- Clarifying **authority levels and permissions**.  
- Making the **AI advisory structured, readable, and user-friendly**.  
- Adding **Suspension Candidates** with selectable levels (Classes, Work, Activities).  
- Introducing **automatic AI reevaluation** for live updates.  
- Creating a **clean, decision-driven governor dashboard** ready for presentation.
