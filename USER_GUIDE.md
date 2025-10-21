# Alerto User Guide
**Enhanced Weather Alert & Community Reporting System**

---

## 🌟 Quick Start Guide

### For Community Members

#### How to Submit a Weather Report

1. **Navigate to Community Page**
   - Click "Community" in the sidebar
   - Or go directly to the Community section from dashboard

2. **Click "Submit Report" Button**
   - Located in the top-right corner
   - Blue button with a "+" icon

3. **Fill Out Report Form**

   **Required Information:**
   - **Report Type:** Choose from 9 categories
     - 🌊 Flooding
     - 🌧️ Heavy Rain
     - ⛰️ Landslide
     - 💨 Strong Wind
     - 🌀 Storm/Typhoon
     - 🚧 Road Blockage
     - ⚡ Power Outage
     - 🏗️ Infrastructure Damage
     - 📋 Other

   - **Description:** Detailed description of the situation
     - Be specific about what you're seeing
     - Mention water levels, road conditions, etc.
     - Include time frame if known

   - **City/Municipality:** Select from dropdown
     - All Batangas cities available
     - Choose "Other" if not listed

   **Optional Information:**
   - **Report Title:** Brief headline for your report
   - **Barangay:** Specific barangay name
   - **Specific Location:** Landmarks, street names
   - **Images:** Upload up to 5 photos (10MB each)

4. **Wait for AI Analysis**
   - System automatically analyzes your report
   - Determines severity level
   - Calculates confidence score
   - Usually takes 2-3 seconds

5. **Submit Report**
   - Click "Submit Report" button
   - Report appears immediately in Community Feed
   - You'll receive a success confirmation

#### What Happens After Submission?

✅ **Your report is:**
- Stored in the system database
- Analyzed by AI for severity
- Visible to all users in Community Feed
- Sent to Reports page for admin review
- Included in LGU compiled reports
- Factored into class suspension predictions
- Counted in Analytics metrics

---

### For Administrators & LGU Officials

#### Reports Page - Data Collection

**Access:** Click "Reports" in sidebar

**What You See:**
- **8 Statistics Cards** showing:
  - Total Reports
  - Critical Alerts (red)
  - High Priority (orange)
  - Medium (yellow)
  - Verified Reports (green)
  - Pending Reports (purple)
  - Number of Cities
  - Number of Reporters

**Filtering Options:**
1. **Time Range:**
   - Last Hour
   - Last 6 Hours
   - Last 24 Hours
   - Last 7 Days
   - All Time

2. **Severity:**
   - Critical
   - High
   - Medium
   - Low

3. **Status:**
   - Pending (needs review)
   - Verified (confirmed)
   - Investigating (in progress)
   - Resolved (completed)

4. **City:**
   - All Batangas cities
   - Filter by specific location

**Actions You Can Take:**
- **View Details:** Click eye icon to see full report
- **Export Data:** Click "Export CSV" for external analysis
- **Refresh:** Click "Refresh" for latest data

#### LGU Reports Page - AI Summaries

**Access:** Click "LGU Reports" in sidebar

**What You See:**
- AI-compiled summaries of multiple similar reports
- Reports grouped by location and time
- Key points extracted automatically
- Recommendations for action

**Report Details Include:**
- Severity level (Critical/High/Medium/Low)
- Confidence score (AI accuracy)
- Summary of situation
- Location affected
- Number of sources (community reports)
- Key points to know
- Recommended actions
- Images from reports

**Actions You Can Take:**
- **View Full Report:** See all original reports
- **Contact Reporter:** Reach out for more info
- **Issue Suspension:** Take immediate action
- **Recompile:** Force refresh of AI analysis

#### Analytics Page - Performance Metrics

**Access:** Click "Analytics" in sidebar

**Real-Time Metrics:**

1. **Province-wide Weather Statistics:**
   - Average temperature
   - High-risk areas count
   - Moderate-risk areas
   - Normal conditions

2. **Class Suspension Prediction:**
   - Risk percentage (0-100%)
   - Risk level (Critical/High/Moderate/Low)
   - Contributing factors
   - Potentially affected cities
   - Recommendations

3. **City-by-City Conditions:**
   - Temperature
   - Rainfall
   - Wind speed
   - Humidity
   - Risk level per city

4. **Performance Metrics:**
   - Response time
   - Accuracy rate
   - Coverage area
   - Active users

5. **Charts & Visualizations:**
   - Weekly activity trends
   - Reports by city (pie chart)
   - Weekly pattern overview
   - Community engagement

**AI Reports Analysis:**
- Total reports classified
- Critical/Medium/Low counts
- Affected areas
- Main threats
- Overall priority
- Suspension recommendation

#### Suspension Page - Decision Support

**Access:** Click "Suspension" in sidebar

**Data Sources:**
- Real-time weather from OpenWeather API
- Community reports from database
- Historical patterns

**Suspension Prediction Shows:**
- Overall risk level
- Risk percentage
- Contributing factors:
  - Heavy rainfall locations
  - Strong winds
  - Critical community reports
- Weather score (0-100)
- Reports score (0-100)
- Combined score

**Recommendation Includes:**
- Whether suspension is advised
- Affected cities/municipalities
- Priority actions to take
- Expected conditions (next 6-12 hours)
- Advisory message for LGUs and parents

---

## 📊 Understanding Severity Levels

### Report Severity Classifications

**🚨 Critical:**
- Immediate danger to life or property
- Major flooding (roads impassable)
- Severe storms or typhoons
- Landslides blocking roads
- Power lines down
- **Action:** Immediate response required

**⚠️ High Priority:**
- Heavy rain or strong winds
- Rising water levels
- Potential flooding
- Safety concerns
- Road hazards
- **Action:** Monitor closely, prepare response

**📋 Medium:**
- Moderate weather conditions
- Some disruption
- Light flooding
- Minor road issues
- **Action:** Continue monitoring

**ℹ️ Low:**
- Light rain
- Minor weather issues
- Information only
- **Action:** No immediate action needed

---

## 🎯 Best Practices

### For Community Reporters:

✅ **DO:**
- Be specific in descriptions
- Include location details
- Upload clear photos
- Report in real-time
- Update if situation changes
- Stay safe while reporting

❌ **DON'T:**
- Submit false information
- Duplicate reports unnecessarily
- Include personal contact info in description
- Report second-hand information (without noting it)

### For Administrators:

✅ **DO:**
- Check Reports page regularly
- Review AI confidence scores
- Verify critical reports quickly
- Update report status
- Export data for records
- Monitor suspension recommendations

❌ **DON'T:**
- Ignore low-confidence reports
- Delay verification of critical alerts
- Forget to update status
- Miss pattern recognition from multiple reports

---

## 🔔 Notification Flow

```
User Submits Report
       ↓
AI Analyzes (2-3 sec)
       ↓
Report Appears in Community Feed
       ↓
Admin Reviews in Reports Page
       ↓
AI Compiles Similar Reports (LGU Reports)
       ↓
Factors into Suspension Prediction
       ↓
Admin Makes Decision
       ↓
Announcement Issued
```

---

## 📱 Mobile Usage Tips

- All pages are responsive
- Forms adapt to screen size
- Images can be captured directly from camera
- Touch-friendly buttons
- Swipe gestures supported
- Optimized for on-the-go reporting

---

## ❓ FAQ

**Q: How long does it take for my report to appear?**
A: Immediately! Reports show up in real-time as soon as submitted.

**Q: Can I edit my report after submission?**
A: Currently, no. Please submit a new report with updated information.

**Q: What if I make a mistake?**
A: Contact an administrator to update or remove the report.

**Q: How does AI determine severity?**
A: AI analyzes your description, location, images, and compares to similar incidents.

**Q: What is the confidence score?**
A: It's the AI's confidence (0-100%) that it correctly classified your report.

**Q: Can I see who submitted a report?**
A: Yes, reporter names are displayed (unless submitted anonymously).

**Q: How often is data updated?**
A: Real-time for Community Feed, every 10 minutes for Analytics/LGU pages.

**Q: Can I export historical data?**
A: Yes, use the "Export CSV" button on Reports page.

**Q: What happens to old reports?**
A: Reports are archived after 30 days but remain in the database.

**Q: How accurate is the suspension prediction?**
A: It combines weather data and community reports with historical patterns. Always verify with local authorities.

---

## 🆘 Troubleshooting

### Report Not Appearing
1. Check internet connection
2. Refresh the page
3. Clear browser cache
4. Try submitting again

### Image Upload Failed
1. Check file size (max 10MB)
2. Use JPG or PNG format
3. Try fewer images
4. Check storage space

### AI Analysis Stuck
1. Wait 10 seconds
2. Submit without waiting
3. Report will still be saved
4. AI runs in background

### Can't Submit Report
1. Check required fields
2. Ensure category selected
3. Verify city chosen
4. Check description length

---

## 📞 Support

For technical issues or questions:
- Contact system administrator
- Report bugs through feedback form
- Check system status page
- Review user guide

---

## 🔐 Privacy & Security

### Your Data:
- Stored securely in Firebase
- Accessible only to verified users
- Not shared with third parties
- Images stored with encryption

### Your Account:
- Email required for authentication
- Password encrypted
- Secure login process
- Session timeout for safety

---

## 🎓 Training Resources

### Video Tutorials (Coming Soon):
- How to submit your first report
- Understanding severity levels
- Using the Reports page filters
- Reading LGU compiled reports
- Interpreting suspension predictions

### Quick Reference Cards:
- Report categories guide
- Severity classification chart
- Admin dashboard overview
- Data export instructions

---

**Need Help?** Contact your local LGU office or system administrator.

**Stay Safe! Report Responsibly! 🌦️📱**
