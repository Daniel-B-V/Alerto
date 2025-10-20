# Alerto AI Features Guide

## 🤖 AI-Powered Report Compilation System

Alerto now includes an advanced AI system powered by **Google Gemini** that automatically compiles community weather reports for Local Government Units (LGU).

---

## 📋 Features Overview

### 1. **LGU Reports Panel** (AI-Compiled)
A dedicated dashboard that helps mayors and LGU officials make quick decisions about class suspensions.

#### What It Does:
- **Automatically fetches** all community reports from the last 24 hours
- **Groups reports** by location and time (60-minute windows)
- **Analyzes with Gemini AI** to detect patterns, urgency, and authenticity
- **Compiles** multiple reports into single executive summaries
- **Presents** clear severity levels, confidence scores, and recommendations

#### Key Components:
- ✅ **Severity Detection**: Critical, High, Medium, Low
- ✅ **Confidence Scoring**: AI calculates confidence (0-100%)
- ✅ **Smart Summaries**: Professional summaries compressed from hundreds of words
- ✅ **Image Compilation**: All photos from related reports compiled together
- ✅ **Key Points**: Bullet-point highlights
- ✅ **Recommendations**: AI-generated action recommendations

---

## 🔑 API Configuration

### Environment Variables

**Frontend (.env):**
```env
VITE_GEMINI_API_KEY=AIzaSyAa77e05tsleFKz8EUEnKQ_LrPFYxgYAz8
```

**Backend (backend/.env):**
```env
GEMINI_API_KEY=AIzaSyAa77e05tsleFKz8EUEnKQ_LrPFYxgYAz8
```

### Gemini Free Tier Limits:
- **15 requests per minute**
- **1,500 requests per day**
- **1 million tokens per day**
- **Multimodal support** (text + images)

---

## 🏗️ Architecture

### Files Created:

1. **`src/services/geminiService.js`**
   - Main AI service for report analysis
   - Functions:
     - `compileReports()` - Compiles multiple reports
     - `analyzeReportWithImages()` - Analyzes single report with images
     - `groupReportsByLocationAndTime()` - Groups similar reports
     - `getSeverityColor()` - Helper for UI colors

2. **`src/components/LGUReportsPanel.jsx`**
   - Main UI component for LGU dashboard
   - Features:
     - Statistics cards (Total, Critical, High, Medium)
     - Compiled report cards with severity badges
     - Image galleries
     - Action buttons (View Full Report, Contact Reporter, Issue Suspension)
     - Auto-refresh every 10 minutes

3. **Updated Components:**
   - `Sidebar.jsx` - Added "LGU Reports" menu item with AI badge
   - `DashboardContent.jsx` - Integrated LGU Reports panel
   - `.env` files - Added Gemini API key

---

## 🎯 How It Works (Flow)

```
1. Community members submit weather reports via mobile/web
   ↓
2. Reports stored in Firebase Firestore
   ↓
3. LGU Reports Panel fetches reports (last 24 hours)
   ↓
4. Reports grouped by location & time (60-min windows)
   ↓
5. Each group sent to Gemini AI for analysis
   ↓
6. AI analyzes:
   - Report text content
   - Number of sources (multiple reports = higher confidence)
   - Weather conditions described
   - Images (if available)
   ↓
7. AI generates:
   - Severity level (critical/high/medium/low)
   - Confidence score (0-100%)
   - Professional summary
   - Key points
   - Recommendation for LGU
   ↓
8. Compiled reports displayed in clean UI
   ↓
9. Mayor/LGU official reviews and decides on class suspension
```

---

## 📊 Example Output

### Input (Multiple Community Reports):
```
Report 1: "Heavy flooding on Maharlika Highway near Lipa City. Water level rising fast!"
Report 2: "Power lines down on highway, traffic blocked"
Report 3: "Can't pass through Maharlika, severe storm damage"
Report 4: "Emergency! Highway flooded, cars stranded"
Report 5: "Power outage and flooding in Lipa area"
```

### Output (AI-Compiled Report):
```
🔴 CRITICAL                              92% confidence

Power lines down on Maharlika Highway, traffic disruption
expected for 4-6 hours

📍 Maharlika Highway, Lipa City
⏰ 12 minutes ago
📊 5 sources
📝 Compressed from 189 words

Summary:
Multiple community members report severe conditions on Maharlika
Highway in Lipa City. Power lines are damaged and blocking the
major thoroughfare. Heavy flooding is affecting the area with
water levels rising rapidly. Several vehicles are reportedly
stranded. Emergency response time estimated at 4-6 hours.

Key Points:
• Power lines severely damaged blocking highway
• Heavy flooding with rising water levels
• Multiple vehicles stranded
• Major traffic disruption expected
• 4-6 hour estimated response/clearance time

Recommendation: Immediate class suspension recommended for Lipa
City area and surrounding municipalities. Emergency services
should be notified.

[4 images from different reporters showing flooding and damage]

[View Full Report] [Contact Reporter] [🚨 Issue Suspension]
```

---

## 🎨 UI Features

### Statistics Dashboard
- **Total Compiled Reports**: Shows number of compiled reports
- **Critical Alerts**: Red - Immediate danger situations
- **High Priority**: Orange - Serious weather conditions
- **Medium Priority**: Yellow - Moderate concerns

### Report Cards
Each compiled report shows:
- **Severity badge** with icon and color coding
- **Confidence score** (verified badge)
- **Location** with map pin icon
- **Timestamp** (relative time)
- **Number of sources** (e.g., "5 sources")
- **Compression info** (e.g., "Compressed from 189 words")
- **Professional summary**
- **Key points** (bullet list)
- **Image gallery** (up to 4 images preview)
- **Recommendation box** (highlighted)

### Action Buttons
- **👁️ View Full Report** - See all original reports
- **💬 Contact Reporter** - Reach out to reporters
- **🚨 Issue Suspension** - Quick suspension decision

### Auto-Refresh
- Automatically recompiles reports every **10 minutes**
- Manual refresh button available
- Shows last update timestamp

---

## 🚀 Usage

### For Developers

1. **Start the app:**
   ```bash
   npm run dev
   ```

2. **Navigate to LGU Reports:**
   - Click "LGU Reports" in the sidebar (has AI badge)
   - System automatically compiles reports on load

3. **Testing:**
   - Make sure Firebase has community reports in `reports` collection
   - Reports should have: `location`, `description`, `timestamp`, `images`
   - AI will group and analyze them automatically

### For LGU Officials (End Users)

1. **Open Alerto Dashboard**
2. **Click "LGU Reports"** (with purple AI badge)
3. **Review compiled reports:**
   - Check severity levels (Critical reports at top)
   - Read AI-generated summaries
   - View compiled images
   - Check confidence scores
4. **Take action:**
   - Click "Issue Suspension" for critical areas
   - Click "View Full Report" to see original reports
   - Click "Contact Reporter" to reach community members

---

## 🔧 Customization

### Adjust Grouping Time Window
In `LGUReportsPanel.jsx`, line ~39:
```javascript
const groupedReports = groupReportsByLocationAndTime(reports, 60); // 60 minutes
```
Change `60` to adjust time window for grouping reports.

### Adjust Refresh Interval
In `LGUReportsPanel.jsx`, line ~92:
```javascript
}, 10 * 60 * 1000); // 10 minutes
```
Change `10` to adjust auto-refresh interval.

### Customize Severity Thresholds
In `geminiService.js`, modify the AI prompt to adjust what qualifies as critical/high/medium/low.

---

## 📱 Mobile Responsive

The LGU Reports panel is fully responsive:
- Statistics cards stack on mobile
- Report cards adapt to screen size
- Images resize appropriately
- Action buttons stack on small screens

---

## 🎓 Benefits for Batangas Province

✅ **Faster Decision Making**: Mayor sees 1 compiled report instead of 50+ individual ones
✅ **Reduced Information Overload**: No more spam, just actionable intelligence
✅ **Higher Confidence**: AI aggregates multiple sources for verification
✅ **Visual Confirmation**: All relevant photos compiled in one place
✅ **Time-Saving**: Professional summaries instead of reading hundreds of reports
✅ **Better Accuracy**: Pattern detection across multiple reports
✅ **Free to Use**: Gemini's free tier is generous for LGU needs

---

## 🔒 Security Notes

- API key is client-side (for prototype/MVP)
- For production, move API calls to backend
- Implement rate limiting
- Add API key rotation
- Use Firebase Security Rules to protect data

---

## 📝 Future Enhancements

Potential features to add:
- [ ] Historical report analysis
- [ ] Predictive alerts based on patterns
- [ ] Multi-language support (Tagalog/English)
- [ ] SMS notifications to reporters
- [ ] Integration with PAGASA weather data
- [ ] Automated class suspension announcements
- [ ] Report verification workflow
- [ ] Admin approval before compilation

---

## 🐛 Troubleshooting

### AI Compilation Not Working?
1. Check Gemini API key in `.env` file
2. Verify Firebase has reports in `reports` collection
3. Check browser console for errors
4. Ensure reports have required fields: `location`, `description`, `timestamp`

### No Reports Showing?
1. Check Firebase Firestore for data
2. Verify date filter (last 24 hours)
3. Check Firebase Security Rules
4. Ensure user is authenticated

### Images Not Loading?
1. Check Firebase Storage rules
2. Verify image URLs are valid
3. Check CORS settings
4. Ensure images are properly uploaded

---

## 📞 Support

For issues or questions:
- Check browser console for errors
- Review Firebase console for data
- Verify API key is correct
- Check network tab for failed requests

---

**Built with ❤️ for Batangas Province using Google Gemini AI**
