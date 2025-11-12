# 🌦️ Alerto Class Suspension System - Complete Documentation

## Table of Contents
1. [Overview](#overview)
2. [System Architecture](#system-architecture)
3. [Official Compliance](#official-compliance)
4. [Features](#features)
5. [User Guide](#user-guide)
6. [Technical Documentation](#technical-documentation)
7. [API Reference](#api-reference)
8. [Deployment](#deployment)
9. [Troubleshooting](#troubleshooting)

---

## Overview

The **Alerto Class Suspension System** is an AI-powered platform that assists Local Government Units (LGUs) in making informed class suspension decisions across Batangas Province, Philippines.

### Key Capabilities
- ✅ Real-time weather monitoring with PAGASA warning integration
- ✅ AI-powered suspension recommendations
- ✅ Community report aggregation and analysis
- ✅ Automatic reevaluation of active suspensions
- ✅ Multi-level suspension management (Preschool, K-12, College, Work, Activities)
- ✅ Public notification system via persistent banner
- ✅ Comprehensive analytics and reporting

---

## System Architecture

### Technology Stack
```
Frontend:
├── React 18.3.1
├── Vite (Build tool)
├── Tailwind CSS + Radix UI
├── Recharts (Analytics)
└── Lucide React (Icons)

Backend:
├── Firebase Firestore (Database)
├── Firebase Auth (Authentication)
├── Node.js/Express (Optional API)
└── Mongoose (MongoDB models)

AI/Services:
├── Google Gemini 1.5 Flash (AI Analysis)
├── OpenWeather API (Weather Data)
└── Custom algorithms (PAGASA mapping)
```

### Database Collections

#### `suspensions`
```javascript
{
  id: string,
  city: string,
  province: string,
  status: 'active' | 'scheduled' | 'lifted' | 'expired',
  levels: ['preschool' | 'k12' | 'college' | 'work' | 'activities' | 'all'],
  issuedBy: {
    name: string,
    title: string,
    office: string,
    role: 'governor' | 'mayor'
  },
  criteria: {
    pagasaWarning: 'yellow' | 'orange' | 'red' | null,
    tcws: 1-5 | null,
    rainfall: number,
    windSpeed: number,
    temperature: number,
    humidity: number
  },
  aiAnalysis: {
    recommendation: 'suspend' | 'monitor' | 'safe',
    confidence: 0-100,
    reportCount: number,
    criticalReports: number,
    summary: string,
    justification: string
  },
  issuedAt: Timestamp,
  effectiveFrom: Timestamp,
  effectiveUntil: Timestamp,
  durationHours: number,
  message: string,
  weatherConditionStatus: 'improving' | 'stable' | 'worsening' | null
}
```

---

## Official Compliance

### DepEd Order No. 022, s. 2024
The system complies with official DepEd guidelines:

**Automatic Suspension Triggers:**
1. **Any TCWS Level (1-5)** → Automatic class suspension
2. **Red Rainfall Warning (30+ mm/h for 2 hours)** → Automatic suspension at ALL levels
3. **Orange Rainfall Warning (15-30 mm/h for 2 hours)** → Automatic suspension at ALL levels
4. **Yellow Rainfall Warning (7.5-15 mm/h for 2 hours)** → Suspension for ECCD and K-12 only

### PAGASA Rainfall Warning System
```
🟡 Yellow Warning: 7.5-15 mm/h
   Hazard: Slight flooding in low-lying areas
   Action: Suspend ECCD and K-12

🟠 Orange Warning: 15-30 mm/h
   Hazard: Flooding threat in low-lying areas and near rivers
   Action: Suspend ALL levels

🔴 Red Warning: 30+ mm/h
   Hazard: Serious flooding - evacuation may be necessary
   Action: Suspend ALL levels
```

### LGU Authority Structure
- **Provincial Governor**: Full authority to issue province-wide suspensions
- **City/Municipal Mayors**: Authority to suspend within their jurisdiction
- **DepEd Officials**: Advisory role
- **PAGASA**: Provides weather warnings and data

---

## Features

### 1. Suspension Candidate Dashboard
**Location:** Admin → Suspension → Candidates Tab

**What it shows:**
- All 34 Batangas cities with real-time weather
- PAGASA warning levels (Yellow/Orange/Red badges)
- TCWS indicators (if applicable)
- Rainfall and wind speed metrics
- Community report counts (total + critical)
- AI recommendation with confidence score
- Quick-issue buttons per city

**Actions available:**
- Issue suspension for any city
- Select suspension levels (checkboxes)
- View detailed weather assessment

### 2. Active Suspensions Management
**Location:** Admin → Suspension → Active Tab

**What it shows:**
- Currently active suspensions
- Time remaining countdown
- Weather condition trend (🟢 Improving, 🟠 Stable, 🔴 Worsening)
- Issuing authority details
- Reevaluation count

**Actions available:**
- **Extend:** Add 2/4/6/12/24 hours to suspension
- **Lift Early:** End suspension before scheduled time
- **View Details:** Full suspension information

### 3. Suspension Banner (Public)
**Location:** Top of every page (auto-appears)

**Features:**
- Persistent red banner showing active suspensions
- City count aggregation
- Expandable details view
- Auto-dismiss after 1 hour
- Re-appears on new suspensions
- Mobile-responsive (collapsible)
- Screen reader accessible

### 4. Enhanced Reports Integration
**Location:** Admin → Reports → Enhanced Reports

**Integration:**
- AI analyzes community reports by city
- Credibility scoring (0-100%)
- "Issue Class Suspension" button appears for high-risk cities
- Modal with suspension level selectors
- Duration picker
- Custom message editor

### 5. Automatic Reevaluation Service
**Runs automatically every 30 minutes:**

**What it does:**
1. Fetches current weather for cities with active suspensions
2. Compares to weather at time of issuance
3. Determines trend: Improving / Stable / Worsening
4. Updates suspension record with new data
5. Auto-expires suspensions past their end time
6. Logs significant changes

**Weather Trend Detection:**
- **Improving:** Rainfall ↓5mm/h AND wind ↓10km/h
- **Worsening:** Rainfall ↑5mm/h AND wind ↑10km/h
- **Stable:** Minimal change

### 6. Suspension Analytics
**Location:** Admin → Suspension → Analytics (new tab)

**Metrics:**
- Total suspensions (all time)
- Average duration per suspension
- Response time (report → decision)
- Success rate
- Top cities with suspensions (bar chart)
- Weekly suspension trends (line chart)
- Suspension levels distribution (pie chart)
- Most frequent reasons
- Recent activity log

---

## User Guide

### For Governors/Administrators

#### How to Issue a Suspension

**Method 1: Via Suspension Candidates**
1. Navigate to **Suspension** in sidebar
2. Review "Suspension Candidates" table
3. Identify cities with:
   - Red/Orange PAGASA warnings
   - High AI confidence (>70%)
   - Multiple critical reports
4. Click **ISSUE** button for the city
5. In the modal:
   - Review AI justification
   - Select suspension levels (☑ K-12, ☑ Preschool, etc.)
   - Choose duration (2-48 hours)
   - Edit public message or use default
   - Preview announcement
6. Click **Confirm & Issue Suspension**
7. Suspension becomes active immediately

**Method 2: Via Enhanced Reports**
1. Navigate to **Reports** → Enhanced Reports
2. Click on a city with high confidence
3. Click **Issue Class Suspension** button
4. Follow same modal steps as above

#### How to Manage Active Suspensions

**To Extend a Suspension:**
1. Go to **Suspension** → Active tab
2. Find the suspension to extend
3. Click **Extend** button
4. Select additional hours (2/4/6/12/24)
5. Add reason (optional)
6. Confirm

**To Lift a Suspension Early:**
1. Go to **Suspension** → Active tab
2. Find the suspension to lift
3. Click **Lift** button
4. Add reason (e.g., "Weather improved")
5. Confirm

**Monitor Weather Trends:**
- Check the "Weather Status" column
- 🟢 Improving = Consider lifting
- 🔴 Worsening = Consider extending
- 🟠 Stable = Monitor

#### How to View Analytics
1. Navigate to **Suspension** → Analytics tab
2. Review key metrics at top
3. Analyze charts:
   - **Bar Chart:** Which cities need most attention
   - **Line Chart:** Seasonal patterns
   - **Pie Chart:** What gets suspended most
4. Check recent activity for patterns

### For Mayors

Currently, mayors can:
- View their city's suspension status
- See AI recommendations for their jurisdiction
- Request governor approval (feature ready for implementation)

*Full mayor workflow coming in Phase 5*

### For Public Users

**Viewing Active Suspensions:**
1. Banner appears automatically at top when suspensions are active
2. Click "View Details" to see all affected cities
3. Read announcement messages
4. Check time remaining

**Dismissing Alerts:**
- Click ❌ button to dismiss
- Banner auto-dismisses after 1 hour
- Will re-appear if new suspension issued

---

## Technical Documentation

### File Structure
```
src/
├── components/
│   └── suspension/
│       ├── SuspensionPanel.jsx          # Main admin dashboard
│       ├── SuspensionCandidateTable.jsx # Candidates view
│       ├── ActiveSuspensionsTable.jsx   # Active management
│       ├── SuspensionBanner.jsx         # Public banner
│       └── SuspensionAnalytics.jsx      # Analytics dashboard
├── contexts/
│   └── SuspensionContext.jsx            # Global state
├── hooks/
│   └── useSuspensions.js                # Custom hooks (8 variants)
├── services/
│   ├── suspensionService.js             # Firestore CRUD
│   ├── reevaluationService.js           # Auto-reevaluation
│   └── weatherService.js                # Enhanced with PAGASA
├── constants/
│   └── suspensionCriteria.js            # Official criteria
backend/
└── models/
    └── Suspension.js                     # Mongoose schema
```

### Key Functions

#### suspensionService.js
```javascript
// Create
createSuspension(data) → returns suspensionId

// Read
getSuspension(id) → returns suspension object
getActiveSuspensions(city?) → returns array
getSuspensionHistory(city?, limit) → returns array
hasActiveSuspension(city) → returns boolean

// Update
liftSuspension(id, liftData) → void
extendSuspension(id, extensionData) → void
reevaluateSuspension(id, reevaluationData) → void
updateSuspension(id, updates) → void

// Subscribe
subscribeToActiveSuspensions(callback, city?) → unsubscribe function

// AI
generateSuspensionRecommendation(city, reports) → returns recommendation object

// Utilities
autoExpireSuspensions() → returns count
```

#### weatherService.js (Enhanced)
```javascript
// PAGASA Integration
getPAGASAWarning(weatherData) → returns warning object | null
getTCWS(weatherData) → returns TCWS object | null
checkSuspensionCriteria(weatherData) → returns assessment
getPAGASAWarningBadge(warningLevel) → returns badge properties

// Suspension-Specific
getWeatherAssessmentForSuspension(city) → returns comprehensive assessment
getBatangasWeatherWithSuspensionCriteria() → returns all cities
getCitiesForAutoSuspension() → returns cities meeting criteria
```

#### reevaluationService.js
```javascript
// Service Control
startReevaluationService() → void
stopReevaluationService() → void
triggerManualReevaluation() → Promise

// Analysis
reevaluateAllActiveSuspensions() → Promise
getNewSuspensionRecommendations() → returns array
getSuspensionsToConsiderLifting() → returns array
```

### Custom Hooks

```javascript
// Main hook
useSuspensions() → full context

// Specialized hooks
useActiveSuspensions(city?) → { suspensions, loading, error }
useSuspensionHistory(city?, limit) → { history, loading, error }
useCitySuspensionStatus(city) → { hasActiveSuspension, suspension, suspensions, loading }
useSuspensionSubscriptions() → { subscriptions, isSubscribed, subscribeTo, unsubscribeFrom, toggleSubscription }
useSuspensionNotifications() → { notifications, unreadCount, hasUnread, dismiss, clearAll }
useSuspensionStats() → stats object
useTimeBasedSuspensions() → { endingSoon, recentlyIssued, longDuration }
```

---

## API Reference

### Constants

#### PAGASA_WARNINGS
```javascript
{
  YELLOW: {
    threshold: 7.5,
    maxThreshold: 15,
    suspensionLevels: ['preschool', 'k12'],
    color: '#FFA500',
    icon: '🟡'
  },
  ORANGE: { threshold: 15, maxThreshold: 30, autoSuspend: true },
  RED: { threshold: 30, autoSuspend: true }
}
```

#### SUSPENSION_LEVELS
```javascript
[
  { id: 'preschool', label: 'Preschool/ECCD', icon: '👶' },
  { id: 'k12', label: 'K-12 Basic Education', icon: '🎒' },
  { id: 'college', label: 'College/University', icon: '🎓' },
  { id: 'work', label: 'Government Work', icon: '💼' },
  { id: 'activities', label: 'Public Activities', icon: '🏃' }
]
```

#### TCWS_LEVELS
```javascript
{
  1: { windSpeed: { min: 39, max: 61 }, autoSuspend: true },
  2: { windSpeed: { min: 62, max: 88 }, autoSuspend: true },
  3: { windSpeed: { min: 89, max: 117 }, autoSuspend: true },
  4: { windSpeed: { min: 118, max: 184 }, autoSuspend: true },
  5: { windSpeed: { min: 185, max: Infinity }, autoSuspend: true }
}
```

### Helper Functions

```javascript
// Criteria Checking
getRainfallWarningLevel(rainfall) → PAGASA warning object | null
getTCWSLevel(windSpeed) → TCWS object | null
checkAutoSuspendCriteria(weatherData) → { shouldAutoSuspend, triggers, affectedLevels }
getRiskLevelFromConfidence(confidence) → risk level object

// Utilities
formatDuration(hours) → human-readable string
hasPermission(userRole, action) → boolean
```

---

## Deployment

### Prerequisites
1. **Firebase Project** with Firestore and Auth enabled
2. **OpenWeather API Key** (free tier works)
3. **Google Gemini API Key** (for AI analysis)
4. **Node.js 18+** and npm

### Environment Variables
Create `.env` file:
```env
VITE_FIREBASE_API_KEY=your_firebase_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
VITE_FIREBASE_APP_ID=your_app_id

VITE_WEATHER_API_KEY=your_openweather_api_key
VITE_WEATHER_API_URL=https://api.openweathermap.org/data/2.5

VITE_GEMINI_API_KEY=your_gemini_api_key
```

### Firestore Security Rules
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Suspensions - Read: Public, Write: Admin only
    match /suspensions/{suspensionId} {
      allow read: if true; // Public can view
      allow create, update, delete: if request.auth != null &&
                                     request.auth.token.role in ['admin', 'governor', 'mayor'];
    }

    // Reports - As per existing rules
    match /reports/{reportId} {
      allow read: if true;
      allow create: if request.auth != null;
      allow update, delete: if request.auth != null &&
                             request.auth.token.role in ['admin', 'super_admin'];
    }
  }
}
```

### Firestore Indexes
Create composite indexes for:
```
suspensions:
  - (status, effectiveUntil) - Ascending
  - (city, status, effectiveUntil) - Ascending
  - (status, issuedAt) - Descending
```

### Build & Deploy
```bash
# Install dependencies
npm install

# Build for production
npm run build

# Deploy to Firebase Hosting
firebase deploy --only hosting

# Or deploy to Vercel/Netlify
# (Upload dist/ folder)
```

### Starting Reevaluation Service
Add to your app initialization (App.jsx or main entry point):
```javascript
import { startReevaluationService } from './services/reevaluationService';

// In useEffect or after auth
useEffect(() => {
  if (isAuthenticated && userRole === 'admin') {
    startReevaluationService();
  }

  return () => {
    stopReevaluationService();
  };
}, [isAuthenticated, userRole]);
```

---

## Troubleshooting

### Common Issues

#### 1. Suspensions not appearing in banner
**Cause:** Firebase real-time listener not connected
**Solution:**
- Check that `SuspensionProvider` wraps your app
- Verify Firestore rules allow read access
- Check browser console for errors

#### 2. AI recommendations showing 0% confidence
**Cause:** Gemini API key invalid or rate limited
**Solution:**
- Verify `VITE_GEMINI_API_KEY` in .env
- Check Gemini API quota in Google Cloud Console
- Fallback: System will still show PAGASA-based recommendations

#### 3. Weather data not loading
**Cause:** OpenWeather API key issue
**Solution:**
- Verify `VITE_WEATHER_API_KEY` in .env
- Check API key is active on OpenWeather
- Use seeded Firestore data as fallback

#### 4. Reevaluation service not running
**Cause:** Service not started or stopped prematurely
**Solution:**
```javascript
// Manually start
import { startReevaluationService } from './services/reevaluationService';
startReevaluationService();

// Check console for logs
// Should see: "🚀 Starting automatic reevaluation service..."
```

#### 5. Permission denied errors
**Cause:** User role not set correctly
**Solution:**
```javascript
// Check user role
import { checkCurrentUserRole } from './utils/adminUtils';
window.checkMyRole(); // In dev console

// Make user admin
window.makeCurrentUserAdmin();
```

---

## Performance Optimization

### Best Practices

1. **Limit Real-time Listeners**
   - Use `subscribeToActiveSuspensions()` instead of manual queries
   - Unsubscribe when component unmounts

2. **Cache Weather Data**
   - Weather service has 15-minute cache
   - Don't fetch excessively

3. **Batch Operations**
   - Use Firestore batch writes for multiple updates
   - Limit to 500 operations per batch

4. **Index Optimization**
   - Ensure all Firestore queries use indexes
   - Check Firebase Console for index warnings

---

## Future Enhancements (Phase 5+)

### Planned Features
- [ ] SMS notifications via Twilio
- [ ] Email alerts for subscribed users
- [ ] Multi-language support (Tagalog/English toggle)
- [ ] Mayor approval workflow
- [ ] Integration with school management systems
- [ ] Predictive suspension alerts (24h advance)
- [ ] Mobile app (React Native)
- [ ] WhatsApp/Viber integration
- [ ] Offline PWA support
- [ ] Voice announcements

### Contribution Guidelines
See CONTRIBUTING.md for details on:
- Code style
- Pull request process
- Testing requirements
- Documentation standards

---

## Support

### Resources
- **GitHub Repository:** [Link to repo]
- **Documentation:** This file
- **Bug Reports:** GitHub Issues
- **Feature Requests:** GitHub Discussions

### Contact
- **Development Team:** [Your contact]
- **Technical Support:** [Support email]
- **Emergency:** [Emergency contact for critical issues]

---

## License
[Your license here - MIT, Apache, etc.]

---

## Acknowledgments
- **PAGASA** for weather data standards
- **DepEd** for suspension guidelines
- **Batangas Provincial Government** for domain expertise
- **Google Gemini** for AI capabilities
- **OpenWeather** for weather API
- **Firebase** for infrastructure

---

**Last Updated:** January 2025
**Version:** 1.0.0
**Status:** Production Ready ✅
