// Script to seed Firebase with dummy data for testing

import { collection, addDoc, getDocs, deleteDoc } from 'firebase/firestore';
import { db } from '../firebase/config';
import { generateAllDummyData, getTestScenarios } from './dummyData';

// Clear all existing reports from database
export const clearAllReports = async () => {
  try {
    const reportsRef = collection(db, 'reports');
    const snapshot = await getDocs(reportsRef);

    console.log(`Found ${snapshot.size} reports to delete...`);

    const deletePromises = snapshot.docs.map(doc => deleteDoc(doc.ref));
    await Promise.all(deletePromises);

    console.log('✅ All reports cleared successfully!');
    return { success: true, deleted: snapshot.size };
  } catch (error) {
    console.error('❌ Error clearing reports:', error);
    return { success: false, error: error.message };
  }
};

// Seed database with dummy reports
export const seedReports = async (scenario = 'fullDataset') => {
  try {
    const scenarios = getTestScenarios();
    const reports = scenarios[scenario] || scenarios.fullDataset;

    console.log(`Seeding ${reports.length} reports...`);

    const reportsRef = collection(db, 'reports');
    const addPromises = reports.map(report => addDoc(reportsRef, report));

    await Promise.all(addPromises);

    console.log(`✅ Successfully added ${reports.length} reports!`);
    return { success: true, count: reports.length };
  } catch (error) {
    console.error('❌ Error seeding reports:', error);
    return { success: false, error: error.message };
  }
};

// Clear and reseed database in one operation
export const resetDatabase = async (scenario = 'fullDataset') => {
  console.log('🔄 Resetting database...');

  // Clear existing data
  const clearResult = await clearAllReports();
  if (!clearResult.success) {
    return clearResult;
  }

  // Seed new data
  const seedResult = await seedReports(scenario);

  if (seedResult.success) {
    console.log('✅ Database reset complete!');
  }

  return seedResult;
};

// Get scenario information
export const getScenarioInfo = () => {
  return {
    fullDataset: {
      name: 'Full Dataset',
      description: 'Comprehensive test data with Lipa City (45 reports - high confidence), Batangas City (18 reports), and scattered reports across other cities',
      recommended: 'Best for full system testing'
    },
    highConfidence: {
      name: 'High Confidence Scenario',
      description: 'Lipa City with 45 reports - should trigger suspension recommendation (AI confidence ~89%)',
      recommended: 'Test suspension feature'
    },
    mediumConfidence: {
      name: 'Medium Confidence Scenario',
      description: 'Tanauan City with 15 reports - borderline case (~65-75% confidence)',
      recommended: 'Test edge cases'
    },
    lowConfidence: {
      name: 'Low Confidence Scenario',
      description: 'Only 5 scattered reports from Mabini and San Juan - low confidence (~40-50%)',
      recommended: 'Test low confidence handling'
    }
  };
};

// Export convenience function for browser console
export const seed = {
  full: () => resetDatabase('fullDataset'),
  high: () => resetDatabase('highConfidence'),
  medium: () => resetDatabase('mediumConfidence'),
  low: () => resetDatabase('lowConfidence'),
  clear: () => clearAllReports(),
  info: () => {
    const info = getScenarioInfo();
    console.table(info);
    return info;
  }
};
