# Firebase Setup Guide for Alerto

This document explains how to use and deploy the Firebase services for the Alerto Weather Alert Dashboard.

## Enabled Services

### 1. **Firestore Database** ✅
Your main database for storing:
- Community reports
- User profiles
- Comments
- Weather data
- AI analysis results

### 2. **Authentication** ✅
For user login and identity management

### 3. **Storage** ✅
For storing uploaded images and media

### 4. **Cloud Functions** 🆕
Serverless backend for:
- AI credibility checking
- Report compression/summarization
- Admin notifications
- Automatic spam detection

### 5. **Security Rules** 🆕
Protecting your data with proper access control

## What NOT to Enable

❌ **Realtime Database** - You're already using Firestore which is better for your use case

## Project Structure

```
Alerto/
├── firebase.json              # Firebase configuration
├── firestore.rules            # Security rules for Firestore
├── firestore.indexes.json     # Database indexes
├── functions/                 # Cloud Functions directory
│   ├── index.js              # Main functions file
│   ├── package.json          # Dependencies
│   └── node_modules/         # (installing...)
└── src/
    └── firebase/             # Your existing Firebase setup
```

## Cloud Functions Included

### 1. `processNewReport` (Automatic Trigger)
**Triggers:** When a new report is created in Firestore
**Purpose:**
- Analyzes report credibility using AI
- Assigns credibility score (0-1)
- Flags suspicious content
- Auto-approves high-quality reports
- Auto-rejects spam
- Notifies admins of high-priority reports

**How it works:**
```
User submits report → Firestore (status: "pending")
                          ↓
               processNewReport function runs
                          ↓
              AI Analysis completed
                          ↓
         Report updated with credibility score
                          ↓
    If high-credibility + high-severity → Notify admins
```

### 2. `reanalyzeReport` (Callable Function)
**Purpose:** Manually re-run AI analysis on existing reports
**Usage from frontend:**
```javascript
import { getFunctions, httpsCallable } from 'firebase/functions';

const functions = getFunctions();
const reanalyze = httpsCallable(functions, 'reanalyzeReport');

const result = await reanalyze({ reportId: 'abc123' });
console.log(result.data.analysis);
```

### 3. `getReportAnalysis` (Callable Function)
**Purpose:** Retrieve AI analysis results for a report
**Usage from frontend:**
```javascript
const getAnalysis = httpsCallable(functions, 'getReportAnalysis');
const result = await getAnalysis({ reportId: 'abc123' });
console.log(result.data.analysis);
```

## AI Credibility Checking

The system checks reports for:

1. **Completeness** - Has title, description, location (+0.1)
2. **Visual Evidence** - Includes photos (+0.15)
3. **Detail Level** - Sufficient description length (+0.1)
4. **Spam Detection** - No spam keywords (−0.4 if detected)
5. **Location Specificity** - Has barangay and city (+0.15)

**Credibility Scores:**
- 0.75+ → Auto-approve (if no flags)
- 0.3- → Auto-reject or flag for review
- 0.3-0.75 → Pending (requires admin review)

## Security Rules Implemented

**Reports:**
- Anyone can read verified reports
- Authenticated users can create reports (status: pending)
- Users can edit their own pending reports
- Admins can update any report
- Only admins can delete reports

**Comments:**
- Anyone can read comments
- Authenticated users can create comments
- Users can edit/delete their own comments

**Users:**
- Anyone can read user profiles
- Users can only update their own profile
- Admins can update any profile

**AI Analysis:**
- Only admins can read/write AI analysis data

## Deployment Instructions

### Step 1: Install Dependencies (Currently Running)
```bash
cd functions
npm install
```

### Step 2: Deploy Firestore Rules
```bash
firebase deploy --only firestore:rules
```

### Step 3: Deploy Cloud Functions
```bash
firebase deploy --only functions
```

### Step 4: Deploy Everything at Once
```bash
firebase deploy
```

## Enable Blaze Plan (Required for Cloud Functions)

Cloud Functions require the **Blaze (Pay-as-you-go)** plan:

1. Go to https://console.firebase.google.com/project/alerto-966c7/usage
2. Click "Modify plan"
3. Select "Blaze Plan"
4. Add billing information

**Free tier includes:**
- 2M function invocations/month
- 400,000 GB-seconds/month
- 200,000 CPU-seconds/month

You'll only pay if you exceed these limits.

## Adding Real AI Integration

The current implementation uses rule-based credibility checking. To add real AI:

### Option 1: Anthropic Claude API
```javascript
// In functions/index.js
const Anthropic = require('@anthropic-ai/sdk');
const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY
});

const message = await anthropic.messages.create({
  model: "claude-3-5-sonnet-20241022",
  max_tokens: 1024,
  messages: [{
    role: "user",
    content: `Analyze this weather report for credibility: ${reportData.description}`
  }]
});
```

### Option 2: Google Gemini (Free Tier Available)
```javascript
const { GoogleGenerativeAI } = require("@google/generative-ai");
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const model = genAI.getGenerativeModel({ model: "gemini-pro" });
const result = await model.generateContent(
  `Analyze this weather report: ${reportData.description}`
);
```

### Setting Environment Variables
```bash
firebase functions:config:set anthropic.key="your-api-key"
firebase functions:config:set gemini.key="your-api-key"
```

## Monitoring and Logs

View function logs:
```bash
firebase functions:log
```

View in console:
https://console.firebase.google.com/project/alerto-966c7/functions

## Next Steps

1. ✅ Wait for `npm install` to complete
2. Deploy Firestore rules and indexes
3. Deploy Cloud Functions
4. Upgrade to Blaze plan
5. Test the AI credibility checking
6. (Optional) Integrate real AI API
7. Monitor function performance

## Troubleshooting

**Error: "Firebase CLI requires Node 18"**
- The warning is safe to ignore, Node 22 is backwards compatible

**Error: "Functions require Blaze plan"**
- You must upgrade to enable Cloud Functions

**Error: "Permission denied"**
- Check firestore.rules file
- Ensure user is authenticated when needed

## Support

- Firebase Docs: https://firebase.google.com/docs
- Cloud Functions: https://firebase.google.com/docs/functions
- Firestore Security: https://firebase.google.com/docs/firestore/security/get-started
