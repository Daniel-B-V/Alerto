// Script to seed Firebase with dummy data for testing

import { collection, addDoc, getDocs, deleteDoc, serverTimestamp } from 'firebase/firestore';
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

// Clear all existing weather data from database
export const clearAllWeatherData = async () => {
  try {
    const weatherRef = collection(db, 'weather');
    const snapshot = await getDocs(weatherRef);

    console.log(`Found ${snapshot.size} weather records to delete...`);

    const deletePromises = snapshot.docs.map(doc => deleteDoc(doc.ref));
    await Promise.all(deletePromises);

    console.log('✅ All weather data cleared successfully!');
    return { success: true, deleted: snapshot.size };
  } catch (error) {
    console.error('❌ Error clearing weather data:', error);
    return { success: false, error: error.message };
  }
};

// Generate critical weather data for testing suspension system
const generateCriticalWeatherData = () => {
  const now = new Date();

  return [
    {
      location: {
        city: 'Lipa City',
        country: 'PH',
        lat: 13.9411,
        lon: 121.1650
      },
      current: {
        temperature: 24,
        feelsLike: 26,
        humidity: 95,
        pressure: 1008,
        windSpeed: 65, // Critical - Typhoon-level winds
        windDirection: 135,
        cloudiness: 100,
        visibility: 1.5,
        weather: {
          main: 'Thunderstorm',
          description: 'heavy thunderstorm with heavy rain',
          icon: '11d'
        },
        rainfall: 45, // Critical - Heavy rainfall
        timestamp: now
      },
      forecast: {
        next6Hours: 'Continuous heavy rain expected',
        next12Hours: 'Typhoon conditions persisting',
        warnings: ['Typhoon Warning', 'Flash Flood Warning', 'Strong Wind Warning']
      },
      alerts: [
        {
          level: 'critical',
          type: 'typhoon',
          message: 'Signal No. 2 - Severe weather conditions',
          issuedAt: now
        }
      ],
      lastUpdated: now
    },
    {
      location: {
        city: 'Batangas City',
        country: 'PH',
        lat: 13.7565,
        lon: 121.0583
      },
      current: {
        temperature: 25,
        feelsLike: 27,
        humidity: 92,
        pressure: 1009,
        windSpeed: 58,
        windDirection: 140,
        cloudiness: 98,
        visibility: 2,
        weather: {
          main: 'Rain',
          description: 'heavy intensity rain',
          icon: '10d'
        },
        rainfall: 38,
        timestamp: now
      },
      forecast: {
        next6Hours: 'Heavy rain continuing',
        next12Hours: 'Severe weather expected',
        warnings: ['Heavy Rain Warning', 'Flood Warning']
      },
      alerts: [
        {
          level: 'high',
          type: 'heavy_rain',
          message: 'Heavy rainfall advisory in effect',
          issuedAt: now
        }
      ],
      lastUpdated: now
    },
    {
      location: {
        city: 'Tanauan City',
        country: 'PH',
        lat: 14.0857,
        lon: 121.1503
      },
      current: {
        temperature: 23,
        feelsLike: 25,
        humidity: 90,
        pressure: 1010,
        windSpeed: 52,
        windDirection: 130,
        cloudiness: 95,
        visibility: 2.5,
        weather: {
          main: 'Rain',
          description: 'heavy rain with strong winds',
          icon: '10d'
        },
        rainfall: 32,
        timestamp: now
      },
      forecast: {
        next6Hours: 'Heavy rain and strong winds',
        next12Hours: 'Conditions improving slightly',
        warnings: ['Heavy Rain Warning', 'Wind Advisory']
      },
      alerts: [
        {
          level: 'high',
          type: 'storm',
          message: 'Severe thunderstorm warning',
          issuedAt: now
        }
      ],
      lastUpdated: now
    },
    {
      location: {
        city: 'Santo Tomas',
        country: 'PH',
        lat: 14.1078,
        lon: 121.1411
      },
      current: {
        temperature: 24,
        feelsLike: 26,
        humidity: 88,
        pressure: 1010,
        windSpeed: 45,
        windDirection: 125,
        cloudiness: 90,
        visibility: 3,
        weather: {
          main: 'Rain',
          description: 'moderate to heavy rain',
          icon: '10d'
        },
        rainfall: 25,
        timestamp: now
      },
      forecast: {
        next6Hours: 'Moderate to heavy rain',
        next12Hours: 'Rain tapering off',
        warnings: ['Rain Advisory']
      },
      alerts: [
        {
          level: 'medium',
          type: 'rain',
          message: 'Moderate rainfall advisory',
          issuedAt: now
        }
      ],
      lastUpdated: now
    },
    {
      location: {
        city: 'Taal',
        country: 'PH',
        lat: 13.8833,
        lon: 120.9333
      },
      current: {
        temperature: 25,
        feelsLike: 27,
        humidity: 85,
        pressure: 1011,
        windSpeed: 38,
        windDirection: 120,
        cloudiness: 85,
        visibility: 4,
        weather: {
          main: 'Rain',
          description: 'moderate rain',
          icon: '10d'
        },
        rainfall: 18,
        timestamp: now
      },
      forecast: {
        next6Hours: 'Rain showers continuing',
        next12Hours: 'Clearing expected',
        warnings: []
      },
      alerts: [],
      lastUpdated: now
    }
  ];
};

// Seed database with critical weather data
export const seedWeatherData = async () => {
  try {
    const weatherData = generateCriticalWeatherData();

    console.log(`Seeding ${weatherData.length} critical weather records...`);

    const weatherRef = collection(db, 'weather');
    const addPromises = weatherData.map(data => addDoc(weatherRef, {
      ...data,
      createdAt: serverTimestamp()
    }));

    await Promise.all(addPromises);

    console.log(`✅ Successfully added ${weatherData.length} weather records!`);
    return { success: true, count: weatherData.length };
  } catch (error) {
    console.error('❌ Error seeding weather data:', error);
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
  const clearReportsResult = await clearAllReports();
  if (!clearReportsResult.success) {
    return clearReportsResult;
  }

  const clearWeatherResult = await clearAllWeatherData();
  if (!clearWeatherResult.success) {
    console.warn('⚠️ Failed to clear weather data, continuing...');
  }

  // Seed new data
  const seedReportsResult = await seedReports(scenario);
  if (!seedReportsResult.success) {
    return seedReportsResult;
  }

  // Seed critical weather data
  const seedWeatherResult = await seedWeatherData();
  if (!seedWeatherResult.success) {
    console.warn('⚠️ Failed to seed weather data, but reports were seeded successfully');
  }

  console.log('✅ Database reset complete!');
  return {
    success: true,
    count: seedReportsResult.count,
    weatherCount: seedWeatherResult.success ? seedWeatherResult.count : 0
  };
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
