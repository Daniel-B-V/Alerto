/**
 * Fix Invalid Timestamps in Firestore Reports
 *
 * This script finds all reports with invalid timestamps and fixes them
 * by setting createdAt to the current server time.
 *
 * Usage: node fix-invalid-timestamps.js
 */

import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, updateDoc, doc, serverTimestamp } from 'firebase/firestore';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Initialize Firebase
const firebaseConfig = {
  apiKey: process.env.VITE_FIREBASE_API_KEY,
  authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.VITE_FIREBASE_APP_ID
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function fixInvalidTimestamps() {
  console.log('🔍 Scanning for reports with invalid timestamps...\n');

  try {
    const reportsRef = collection(db, 'reports');
    const snapshot = await getDocs(reportsRef);

    let invalidCount = 0;
    let fixedCount = 0;
    const invalidReports = [];

    snapshot.docs.forEach(docSnap => {
      const data = docSnap.data();
      const report = { id: docSnap.id, ...data };

      // Check if createdAt is invalid
      let hasInvalidTimestamp = false;

      if (!report.createdAt) {
        hasInvalidTimestamp = true;
        console.log(`❌ Report ${report.id}: Missing createdAt`);
      } else if (report.createdAt.seconds === undefined && report.createdAt.toDate === undefined) {
        // Not a Firestore Timestamp
        hasInvalidTimestamp = true;
        console.log(`❌ Report ${report.id}: Invalid createdAt format`, report.createdAt);
      } else {
        // Try to convert to date
        try {
          const date = report.createdAt.toDate ? report.createdAt.toDate() : new Date(report.createdAt);
          if (isNaN(date.getTime())) {
            hasInvalidTimestamp = true;
            console.log(`❌ Report ${report.id}: createdAt converts to Invalid Date`);
          }
        } catch (error) {
          hasInvalidTimestamp = true;
          console.log(`❌ Report ${report.id}: Error converting createdAt`, error.message);
        }
      }

      if (hasInvalidTimestamp) {
        invalidCount++;
        invalidReports.push({
          id: report.id,
          title: report.title || 'Untitled',
          userName: report.userName || 'Unknown',
          city: report.location?.city || 'Unknown'
        });
      }
    });

    console.log(`\n📊 Found ${invalidCount} reports with invalid timestamps`);

    if (invalidCount === 0) {
      console.log('✅ All reports have valid timestamps!');
      return;
    }

    console.log('\n🔧 Fixing invalid timestamps...\n');

    for (const report of invalidReports) {
      try {
        const reportRef = doc(db, 'reports', report.id);
        await updateDoc(reportRef, {
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
          _timestampFixed: true // Mark that this was fixed
        });
        fixedCount++;
        console.log(`✅ Fixed: ${report.id} - "${report.title}" by ${report.userName}`);
      } catch (error) {
        console.error(`❌ Failed to fix ${report.id}:`, error.message);
      }
    }

    console.log(`\n✨ Fixed ${fixedCount} out of ${invalidCount} reports`);
    console.log('🎉 Database cleanup complete!\n');

  } catch (error) {
    console.error('❌ Error:', error);
  }

  process.exit(0);
}

// Run the fix
fixInvalidTimestamps();
