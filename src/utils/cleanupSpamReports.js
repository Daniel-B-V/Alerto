/**
 * Utility to clean up spam/test reports from Firestore
 * Run this from browser console: window.cleanupSpamReports()
 */

import { collection, query, where, getDocs, deleteDoc, doc } from 'firebase/firestore';
import { db } from '../firebase/config';

/**
 * Delete reports that match spam patterns
 * @param {Object} options - Cleanup options
 * @returns {Promise<Object>} - Cleanup results
 */
export const cleanupSpamReports = async (options = {}) => {
  const {
    deleteGibberish = true,  // Delete reports with gibberish text
    deleteLowConfidence = true,  // Delete reports with AI confidence < 40
    dryRun = false  // If true, just report what would be deleted
  } = options;

  console.log('🧹 Starting spam report cleanup...', { dryRun });

  try {
    const reportsRef = collection(db, 'reports');
    const snapshot = await getDocs(reportsRef);

    const toDelete = [];
    const results = {
      total: snapshot.size,
      gibberishCount: 0,
      lowConfidenceCount: 0,
      deleted: 0,
      errors: []
    };

    // Spam detection patterns
    const gibberishPattern = /^(asd|qwe|zxc|test|asdf|jkl|xxx|zzz){3,}|(.)\1{4,}|(.{2,})\2{3,}/i;

    snapshot.forEach(docSnapshot => {
      const report = docSnapshot.data();
      let shouldDelete = false;
      let reason = [];

      // Check for gibberish text
      if (deleteGibberish) {
        const titleGibberish = gibberishPattern.test(report.title || '');
        const descGibberish = gibberishPattern.test(report.description || '');

        if (titleGibberish || descGibberish) {
          shouldDelete = true;
          reason.push('gibberish text');
          results.gibberishCount++;
        }
      }

      // Check for low AI confidence
      if (deleteLowConfidence && report.aiCredibility !== null && report.aiCredibility !== undefined) {
        if (report.aiCredibility < 40) {
          shouldDelete = true;
          reason.push(`low AI confidence: ${report.aiCredibility}%`);
          results.lowConfidenceCount++;
        }
      }

      if (shouldDelete) {
        toDelete.push({
          id: docSnapshot.id,
          title: report.title || 'No title',
          description: (report.description || '').substring(0, 50),
          aiCredibility: report.aiCredibility,
          reason: reason.join(', ')
        });
      }
    });

    console.log(`📊 Found ${toDelete.length} spam reports to delete:`, toDelete);

    if (dryRun) {
      console.log('🔍 DRY RUN - No reports deleted');
      return {
        ...results,
        wouldDelete: toDelete.length,
        reports: toDelete
      };
    }

    // Actually delete the reports
    for (const report of toDelete) {
      try {
        await deleteDoc(doc(db, 'reports', report.id));
        results.deleted++;
        console.log(`🗑️ Deleted: ${report.title} (${report.reason})`);
      } catch (error) {
        console.error(`❌ Failed to delete ${report.id}:`, error);
        results.errors.push({ id: report.id, error: error.message });
      }
    }

    console.log('✅ Cleanup complete:', results);
    return results;

  } catch (error) {
    console.error('❌ Cleanup failed:', error);
    throw error;
  }
};

/**
 * Delete ALL reports (dangerous - use with caution)
 */
export const deleteAllReports = async () => {
  const confirm = window.confirm(
    '⚠️ WARNING: This will delete ALL reports in the database. Are you absolutely sure?'
  );

  if (!confirm) {
    console.log('❌ Deletion cancelled');
    return;
  }

  try {
    const reportsRef = collection(db, 'reports');
    const snapshot = await getDocs(reportsRef);

    let deleted = 0;
    for (const docSnapshot of snapshot.docs) {
      await deleteDoc(doc(db, 'reports', docSnapshot.id));
      deleted++;
    }

    console.log(`✅ Deleted ${deleted} reports`);
    return { deleted };
  } catch (error) {
    console.error('❌ Failed to delete reports:', error);
    throw error;
  }
};

// Make available in browser console
if (typeof window !== 'undefined') {
  window.cleanupSpamReports = cleanupSpamReports;
  window.deleteAllReports = deleteAllReports;
  console.log('🧹 Cleanup utilities loaded. Available commands:');
  console.log('  - window.cleanupSpamReports() // Delete spam reports');
  console.log('  - window.cleanupSpamReports({ dryRun: true }) // Preview what would be deleted');
  console.log('  - window.deleteAllReports() // Delete ALL reports (dangerous!)');
}
