# 🛑 Alerto: Class Suspension Decision System - Complete Redesign

## System Overview

A web-based Class Suspension Management System for Batangas Province that enables data-driven decision-making through AI analysis, real-time weather monitoring, and community reporting.

### Key Principles
- **Hierarchical Decision Flow**: Barangay → Mayor → Governor
- **AI-Assisted, Human-Decided**: AI provides recommendations; officials make final decisions
- **Real-time Data Integration**: Weather APIs + Community Reports + Historical Patterns
- **Role-Based Access**: Different views and permissions for Citizens, Mayors, and Governors

---

## 🎭 User Roles & Access Levels

### 1. **Citizen / Barangay Reporter**
- Submit hazard reports with photos
- View active suspensions in their area
- Track report status

### 2. **Mayor (City-Level)**
- View reports from their city only
- Monitor city-specific weather and AI risk
- Request suspension from Governor
- Cannot directly issue suspensions

### 3. **Governor (Provincial-Level)**
- View all cities across Batangas Province
- Approve/deny mayor requests
- Issue province-wide suspensions
- Override AI recommendations

---

## 📝 1. Report Form (Citizen / Barangay Reporter)

### Form Fields

| Field | Type | Required | Visibility |
|-------|------|----------|------------|
| **Reporter Name** | Text | Optional | Mayor + Governor |
| **Municipality** | Dropdown | ✅ Yes | Mayor + Governor |
| **Barangay** | Dropdown (filtered) | ✅ Yes | Mayor + Governor |
| **Type of Hazard** | Dropdown | ✅ Yes | Mayor + Governor |
| **Severity / Description** | Textarea | ✅ Yes | Mayor + Governor |
| **Photo Upload** | File (max 5) | Optional | Mayor + Governor |
| **Urgency Level** | Radio (Low/Moderate/Critical) | ✅ Yes | Mayor + Governor |
| **Timestamp** | Auto-generated | Auto | Mayor + Governor |

### Hazard Types
- 🌧️ Heavy Rain
- 🌊 Flooding
- ⛰️ Landslide
- 💨 Strong Winds
- ⚡ Power Outage
- 🚧 Road Damage
- 📋 Other

---

## 🏛️ 2. Mayor's Dashboard (City-Level View)

### Overview Panel
Shows real-time weather metrics for the mayor's city only.

### AI Risk Assessment (City-Specific)
- Risk Level with percentage and confidence
- Key factors (rainfall, wind, reports)
- Clear recommendation with affected levels
- Visual progress bars

### Reports by Barangay
- Filterable table showing reports grouped by barangay
- Urgency color coding (Red/Yellow/Green)
- Quick view action buttons

### Suspension Request Panel
- Checkboxes for suspension levels (Preschool, Elementary, HS, College, Work)
- Justification textarea
- Supporting data from AI
- Submit request to Governor button

---

## 👑 3. Governor's Dashboard (Provincial-Level View)

### Provincial Overview
- Total cities, high alerts, pending requests, active suspensions

### AI Provincial Risk Map
- Overall province risk level
- Cities grouped by risk (High/Moderate/Low)
- Visual color coding

### Suspension Candidates Table
Shows all cities with:
- AI Risk Score (percentage + color)
- Number of critical reports
- Mayor request status
- Recommended suspension levels
- Action buttons (Issue/Watch/Safe)

### Mayor Requests Panel
- List of pending requests from mayors
- Each request shows:
  - City name and mayor
  - Requested suspension levels
  - AI support level
  - Number of reports
  - Weather conditions
  - Justification text
  - Approve/Deny/Request Info buttons

### Governor Actions
- Issue province-wide suspension
- Approve all pending requests
- Generate situation report
- Broadcast public advisory

---

## 🤖 4. AI Advisory System - Redesigned

### Improved AI Output Format

Visual risk meter with:
- City name
- Risk percentage with progress bar
- Individual factor scores (rainfall, wind, temp, reports)
- Clear thresholds (e.g., "CRITICAL >30mm/h")
- Recommendation with confidence level
- Bullet-point reasoning

### AI Risk Scoring Logic

**Risk Score Formula:**
```
Risk Score = (Weather × 40%) + (Reports × 30%) + (Historical × 20%) + (Forecast × 10%)
```

**Weather Scoring:**
- Rainfall: <10mm/h = 0pts, 30-50mm/h = 80pts, >50mm/h = 100pts
- Wind: <40km/h = 0pts, 60-80km/h = 70pts, >80km/h = 100pts
- Temperature: 25-32°C = 0pts, >35°C = 60pts

**Confidence Levels:**
- 90-100%: Very High - Strong recommendation
- 75-89%: High - Recommend action
- 60-74%: Moderate - Consider action
- 50-59%: Low - Monitor situation
- <50%: Very Low - No action

**Suspension Recommendations:**
- 80-100%: All levels (Pre-K through College + Work)
- 70-79%: Preschool, Elementary, High School
- 60-69%: Preschool, Elementary only
- 50-59%: Preschool only (optional)
- <50%: No suspension

### Realistic Scenarios

**Should NOT Recommend (45% Risk):**
- Rainfall: 15mm/h (Light)
- Wind: 55km/h (Moderate)
- Reports: 2 (low urgency)
- Result: ✅ SAFE - Continue classes

**Should Recommend (82% Risk):**
- Rainfall: 45mm/h (Heavy)
- Wind: 65km/h (Strong)
- Reports: 12 (8 critical, flooding)
- Result: ⚠️ SUSPEND CLASSES

---

## 🔄 5. Data Flow & System Architecture

### Complete Workflow

1. **Citizen** submits report (barangay, hazard, photos, urgency)
2. **Report Database** stores and triggers AI analysis
3. **Mayor Dashboard** shows city-specific reports
4. **Governor Dashboard** shows all cities
5. **AI Engine** analyzes weather + reports + history
6. **Mayor** submits suspension request
7. **Governor** reviews and approves/denies
8. **Decision** recorded in database
9. **Public Announcement** broadcast via SMS/web/social media

---

## 🎨 6. UI/UX Improvements

### Design Principles
1. Color-coded risk levels (Red/Yellow/Green)
2. Progressive disclosure (summary first, details on click)
3. Mobile-first design
4. Real-time updates
5. High accessibility

### Color Scheme
- Risk Red: #DC2626
- Warning Yellow: #F59E0B
- Safe Green: #10B981
- Info Blue: #3B82F6

---

## 📊 7. Realistic LGU Workflow (Philippines)

### Authority Hierarchy
```
PRESIDENT/NDRRMC → REGIONAL DIRECTOR → GOVERNOR → MAYOR → BARANGAY → CITIZENS
```

### Suspension Authority
- **Governor**: Can suspend province-wide or per city
- **Mayor**: Can REQUEST but needs Governor approval
- **PAGASA**: Provides weather advisories

### Realistic Scenarios

**Localized Flooding:**
Mayor sees critical reports → Requests suspension → Governor approves for that city only

**Typhoon Approaching:**
PAGASA issues warning → AI detects high risk → Governor issues province-wide suspension

**False Alarm:**
AI shows moderate risk → Mayor checks ground → Conditions improving → No request submitted

---

## 🚀 8. Implementation Phases

**Phase 1 (MVP):**
- Report form with barangay selection
- Mayor & Governor dashboards
- Basic AI risk scoring
- Request/approval workflow

**Phase 2 (Enhanced AI):**
- Improved algorithm with historical data
- Weather API integration
- Confidence calculations

**Phase 3 (Communication):**
- SMS broadcast
- Push notifications
- Public announcement page

**Phase 4 (Analytics):**
- Historical data tracking
- Accuracy metrics
- Performance analysis

---

## 📋 Summary of Key Improvements

1. **Simplified AI Output**: Visual meters, color-coding, clear percentages
2. **Realistic Risk Logic**: Multi-factor scoring, context-aware thresholds
3. **Role-Based Access**: Mayor (city) vs Governor (province)
4. **Better UX**: Barangay precision, filterable tables, mobile-friendly
5. **Clear Data Flow**: Report → Mayor → Governor → Decision → Broadcast

---

**This redesign ensures the system is practical, user-friendly, and aligned with real Philippine LGU operations.**
