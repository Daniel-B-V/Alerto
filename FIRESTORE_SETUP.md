# Firestore Setup Guide

## Issue: Community Section Shows White Screen

The community section is showing a white screen because Firestore needs composite indexes to query data with `orderBy` and `where` clauses together.

## Quick Fix Options

### Option 1: Deploy Firestore Indexes (Recommended)

1. **Install Firebase CLI** (if not already installed):
   ```bash
   npm install -g firebase-tools
   ```

2. **Login to Firebase:**
   ```bash
   firebase login
   ```

3. **Initialize Firebase in your project** (if not done):
   ```bash
   firebase init firestore
   ```
   - Select your Firebase project: `alerto-966c7`
   - Accept default options for Firestore rules and indexes

4. **Deploy the indexes:**
   ```bash
   firebase deploy --only firestore:indexes
   ```

5. **Wait 5-10 minutes** for indexes to build, then refresh your app

---

### Option 2: Create Indexes Manually via Firebase Console

1. Go to: https://console.firebase.google.com/project/alerto-966c7/firestore/indexes

2. **Create these composite indexes:**

   **Index 1: For filtered reports**
   - Collection: `reports`
   - Fields:
     - `status` (Ascending)
     - `createdAt` (Descending)
   - Query scope: Collection

   **Index 2: For user reports**
   - Collection: `reports`
   - Fields:
     - `userId` (Ascending)
     - `createdAt` (Descending)
   - Query scope: Collection

   **Index 3: For comments**
   - Collection: `comments`
   - Fields:
     - `reportId` (Ascending)
     - `createdAt` (Descending)
   - Query scope: Collection

3. **Wait 5-10 minutes** for indexes to build

---

### Option 3: Quick Test Without Indexes (Temporary)

If you want to test immediately without waiting for indexes, you can temporarily use a simpler query:

**Edit `src/firebase/firestore.js`** line 272:

Change:
```javascript
} else {
  q = query(reportsRef, orderBy('createdAt', 'desc'));
}
```

To:
```javascript
} else {
  // Temporarily remove orderBy to avoid index requirement
  q = query(reportsRef, limit(20));
}
```

**Also comment out line 269:**
```javascript
// orderBy('createdAt', 'desc')
```

This will make reports load (but not in order). Then deploy proper indexes later.

---

## Add Sample Data for Testing

If your Firestore is empty, add sample reports:

1. Go to: https://console.firebase.google.com/project/alerto-966c7/firestore/data

2. Create collection `reports` with sample document:
   ```json
   {
     "title": "Heavy Flooding on Main Street",
     "description": "Water level rising rapidly on Main Street near the market. Multiple vehicles stranded.",
     "location": {
       "city": "Batangas City",
       "barangay": "Poblacion",
       "coordinates": {
         "lat": 13.7565,
         "lng": 121.0583
       }
     },
     "severity": "high",
     "status": "verified",
     "category": "flooding",
     "userName": "Juan Dela Cruz",
     "userId": "user123",
     "userVerified": true,
     "userPhotoURL": "https://via.placeholder.com/150",
     "images": [
       "https://images.unsplash.com/photo-1547683905-f686c993aae5?w=400"
     ],
     "tags": ["flooding", "emergency", "traffic"],
     "likes": [],
     "commentsCount": 0,
     "viewsCount": 0,
     "createdAt": "2025-10-20T08:00:00.000Z",
     "updatedAt": "2025-10-20T08:00:00.000Z"
   }
   ```

3. Add 3-5 more sample reports with different locations and severity levels

---

## Verify Everything Works

1. **Open your app:** http://localhost:3001
2. **Click "Community"** in sidebar
3. **Should see reports** instead of white screen
4. **Check browser console** (F12) for any errors

---

## Common Errors and Solutions

### Error: "requires an index"
**Solution:** Deploy Firestore indexes (Option 1 or 2 above)

### Error: "Missing or insufficient permissions"
**Solution:** Update Firestore rules in Firebase Console:
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /reports/{reportId} {
      allow read: if true;  // Anyone can read reports
      allow create: if request.auth != null;  // Must be logged in to create
      allow update, delete: if request.auth != null && request.auth.uid == resource.data.userId;
    }

    match /users/{userId} {
      allow read: if true;
      allow write: if request.auth != null && request.auth.uid == userId;
    }

    match /comments/{commentId} {
      allow read: if true;
      allow create: if request.auth != null;
      allow update, delete: if request.auth != null && request.auth.uid == resource.data.userId;
    }
  }
}
```

### Error: "Firebase: No Firebase App"
**Solution:** Check that Firebase is initialized in `src/firebase/config.js`

---

## Need Help?

1. Check browser console (F12) for specific error messages
2. Check Firebase Console for index building status
3. Verify your Firebase project ID is correct: `alerto-966c7`
4. Make sure you're logged into the correct Firebase account

---

**Once indexes are deployed, the community section should work perfectly!** 🎉
