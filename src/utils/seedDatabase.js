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

    // Also clear suspensions when clearing reports
    await clearAllSuspensions();

    console.log('✅ All reports and suspensions cleared successfully!');
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

    // Also clear suspensions when clearing weather data
    await clearAllSuspensions();

    console.log('✅ All weather data and suspensions cleared successfully!');
    return { success: true, deleted: snapshot.size };
  } catch (error) {
    console.error('❌ Error clearing weather data:', error);
    return { success: false, error: error.message };
  }
};

// Clear all existing suspensions from database
export const clearAllSuspensions = async () => {
  try {
    const suspensionsRef = collection(db, 'suspensions');
    const snapshot = await getDocs(suspensionsRef);

    console.log(`Found ${snapshot.size} suspensions to delete...`);

    const deletePromises = snapshot.docs.map(doc => deleteDoc(doc.ref));
    await Promise.all(deletePromises);

    console.log('✅ All suspensions cleared successfully!');
    return { success: true, deleted: snapshot.size };
  } catch (error) {
    console.error('❌ Error clearing suspensions:', error);
    return { success: false, error: error.message };
  }
};

// Generate weather data based on scenario
const generateWeatherData = (scenario = 'critical') => {
  const now = new Date();

  // Scenario configurations
  const scenarios = {
    critical: {
      // High confidence - multiple cities in crisis
      cities: {
        'Lipa City': { temp: 24, humidity: 95, windSpeed: 65, rainfall: 45, condition: 'Thunderstorm', desc: 'heavy thunderstorm with heavy rain', alert: 'critical', alertType: 'typhoon', alertMsg: 'Signal No. 2 - Severe weather conditions' },
        'Batangas City': { temp: 25, humidity: 92, windSpeed: 58, rainfall: 38, condition: 'Rain', desc: 'heavy intensity rain', alert: 'high', alertType: 'heavy_rain', alertMsg: 'Heavy rainfall advisory in effect' },
        'Tanauan City': { temp: 23, humidity: 90, windSpeed: 52, rainfall: 32, condition: 'Rain', desc: 'heavy rain with strong winds', alert: 'high', alertType: 'storm', alertMsg: 'Severe thunderstorm warning' },
        'Santo Tomas': { temp: 24, humidity: 88, windSpeed: 45, rainfall: 25, condition: 'Rain', desc: 'moderate to heavy rain', alert: 'medium', alertType: 'rain', alertMsg: 'Moderate rainfall advisory' },
        'Rosario': { temp: 24, humidity: 87, windSpeed: 42, rainfall: 22, condition: 'Rain', desc: 'moderate rain', alert: 'medium', alertType: 'rain', alertMsg: 'Moderate rainfall warning' },
        'Ibaan': { temp: 25, humidity: 84, windSpeed: 38, rainfall: 16, condition: 'Rain', desc: 'light to moderate rain', alert: 'low', alertType: null, alertMsg: null },
        'Taal': { temp: 25, humidity: 85, windSpeed: 38, rainfall: 18, condition: 'Rain', desc: 'moderate rain', alert: 'low', alertType: null, alertMsg: null },
        'Lemery': { temp: 26, humidity: 82, windSpeed: 35, rainfall: 15, condition: 'Rain', desc: 'light to moderate rain', alert: 'low', alertType: null, alertMsg: null },
        'Balayan': { temp: 26, humidity: 80, windSpeed: 32, rainfall: 12, condition: 'Clouds', desc: 'overcast clouds with light rain', alert: 'low', alertType: null, alertMsg: null },
        'Nasugbu': { temp: 27, humidity: 78, windSpeed: 28, rainfall: 8, condition: 'Clouds', desc: 'partly cloudy', alert: 'low', alertType: null, alertMsg: null },
        'Mabini': { temp: 27, humidity: 78, windSpeed: 30, rainfall: 5, condition: 'Clouds', desc: 'scattered clouds', alert: 'low', alertType: null, alertMsg: null },
        'San Juan': { temp: 26, humidity: 80, windSpeed: 33, rainfall: 8, condition: 'Rain', desc: 'light rain', alert: 'low', alertType: null, alertMsg: null },
        'Bauan': { temp: 27, humidity: 76, windSpeed: 28, rainfall: 3, condition: 'Clouds', desc: 'broken clouds', alert: 'low', alertType: null, alertMsg: null },
        'San Pascual': { temp: 26, humidity: 79, windSpeed: 31, rainfall: 7, condition: 'Rain', desc: 'light rain showers', alert: 'low', alertType: null, alertMsg: null },
        'Calaca': { temp: 27, humidity: 75, windSpeed: 26, rainfall: 2, condition: 'Clouds', desc: 'partly cloudy', alert: 'low', alertType: null, alertMsg: null }
      }
    },
    moderate: {
      // Medium confidence - one city with moderate conditions
      cities: {
        'Lipa City': { temp: 26, humidity: 78, windSpeed: 25, rainfall: 8, condition: 'Rain', desc: 'light rain', alert: 'low', alertType: null, alertMsg: null },
        'Batangas City': { temp: 27, humidity: 75, windSpeed: 22, rainfall: 5, condition: 'Clouds', desc: 'scattered clouds', alert: 'low', alertType: null, alertMsg: null },
        'Tanauan City': { temp: 25, humidity: 85, windSpeed: 38, rainfall: 20, condition: 'Rain', desc: 'moderate rain', alert: 'medium', alertType: 'rain', alertMsg: 'Moderate rainfall advisory' },
        'Santo Tomas': { temp: 27, humidity: 72, windSpeed: 20, rainfall: 3, condition: 'Clouds', desc: 'partly cloudy', alert: 'low', alertType: null, alertMsg: null },
        'Rosario': { temp: 28, humidity: 70, windSpeed: 18, rainfall: 2, condition: 'Clouds', desc: 'few clouds', alert: 'low', alertType: null, alertMsg: null },
        'Ibaan': { temp: 27, humidity: 73, windSpeed: 19, rainfall: 4, condition: 'Clouds', desc: 'partly cloudy', alert: 'low', alertType: null, alertMsg: null },
        'Taal': { temp: 28, humidity: 71, windSpeed: 17, rainfall: 1, condition: 'Clear', desc: 'clear sky', alert: 'low', alertType: null, alertMsg: null },
        'Lemery': { temp: 28, humidity: 72, windSpeed: 18, rainfall: 2, condition: 'Clouds', desc: 'scattered clouds', alert: 'low', alertType: null, alertMsg: null },
        'Balayan': { temp: 29, humidity: 69, windSpeed: 16, rainfall: 0, condition: 'Clear', desc: 'clear sky', alert: 'low', alertType: null, alertMsg: null },
        'Nasugbu': { temp: 29, humidity: 68, windSpeed: 15, rainfall: 0, condition: 'Clear', desc: 'clear sky', alert: 'low', alertType: null, alertMsg: null },
        'Mabini': { temp: 28, humidity: 70, windSpeed: 17, rainfall: 1, condition: 'Clouds', desc: 'few clouds', alert: 'low', alertType: null, alertMsg: null },
        'San Juan': { temp: 27, humidity: 74, windSpeed: 20, rainfall: 3, condition: 'Clouds', desc: 'scattered clouds', alert: 'low', alertType: null, alertMsg: null },
        'Bauan': { temp: 28, humidity: 71, windSpeed: 18, rainfall: 1, condition: 'Clouds', desc: 'few clouds', alert: 'low', alertType: null, alertMsg: null },
        'San Pascual': { temp: 27, humidity: 73, windSpeed: 19, rainfall: 2, condition: 'Clouds', desc: 'partly cloudy', alert: 'low', alertType: null, alertMsg: null },
        'Calaca': { temp: 29, humidity: 68, windSpeed: 15, rainfall: 0, condition: 'Clear', desc: 'clear sky', alert: 'low', alertType: null, alertMsg: null }
      }
    },
    normal: {
      // Low confidence - mostly clear/good weather
      cities: {
        'Lipa City': { temp: 29, humidity: 68, windSpeed: 15, rainfall: 0, condition: 'Clear', desc: 'clear sky', alert: 'low', alertType: null, alertMsg: null },
        'Batangas City': { temp: 30, humidity: 65, windSpeed: 12, rainfall: 0, condition: 'Clear', desc: 'clear sky', alert: 'low', alertType: null, alertMsg: null },
        'Tanauan City': { temp: 28, humidity: 70, windSpeed: 14, rainfall: 0, condition: 'Clouds', desc: 'few clouds', alert: 'low', alertType: null, alertMsg: null },
        'Santo Tomas': { temp: 29, humidity: 67, windSpeed: 13, rainfall: 0, condition: 'Clear', desc: 'clear sky', alert: 'low', alertType: null, alertMsg: null },
        'Rosario': { temp: 29, humidity: 66, windSpeed: 13, rainfall: 0, condition: 'Clear', desc: 'clear sky', alert: 'low', alertType: null, alertMsg: null },
        'Ibaan': { temp: 28, humidity: 69, windSpeed: 14, rainfall: 1, condition: 'Clouds', desc: 'few clouds', alert: 'low', alertType: null, alertMsg: null },
        'Taal': { temp: 30, humidity: 64, windSpeed: 11, rainfall: 0, condition: 'Clear', desc: 'clear sky', alert: 'low', alertType: null, alertMsg: null },
        'Lemery': { temp: 30, humidity: 65, windSpeed: 12, rainfall: 0, condition: 'Clear', desc: 'clear sky', alert: 'low', alertType: null, alertMsg: null },
        'Balayan': { temp: 31, humidity: 62, windSpeed: 10, rainfall: 0, condition: 'Clear', desc: 'clear sky', alert: 'low', alertType: null, alertMsg: null },
        'Nasugbu': { temp: 31, humidity: 61, windSpeed: 10, rainfall: 0, condition: 'Clear', desc: 'clear sky', alert: 'low', alertType: null, alertMsg: null },
        'Mabini': { temp: 30, humidity: 64, windSpeed: 11, rainfall: 0, condition: 'Clear', desc: 'clear sky', alert: 'low', alertType: null, alertMsg: null },
        'San Juan': { temp: 29, humidity: 67, windSpeed: 13, rainfall: 0, condition: 'Clouds', desc: 'few clouds', alert: 'low', alertType: null, alertMsg: null },
        'Bauan': { temp: 30, humidity: 65, windSpeed: 12, rainfall: 0, condition: 'Clear', desc: 'clear sky', alert: 'low', alertType: null, alertMsg: null },
        'San Pascual': { temp: 29, humidity: 66, windSpeed: 13, rainfall: 0, condition: 'Clouds', desc: 'few clouds', alert: 'low', alertType: null, alertMsg: null },
        'Calaca': { temp: 31, humidity: 62, windSpeed: 10, rainfall: 0, condition: 'Clear', desc: 'clear sky', alert: 'low', alertType: null, alertMsg: null }
      }
    }
  };

  const cityCoordinates = {
    'Lipa City': { lat: 13.9411, lon: 121.1650 },
    'Batangas City': { lat: 13.7565, lon: 121.0583 },
    'Tanauan City': { lat: 14.0857, lon: 121.1503 },
    'Santo Tomas': { lat: 14.1078, lon: 121.1411 },
    'Rosario': { lat: 13.8500, lon: 121.2000 },
    'Ibaan': { lat: 13.8167, lon: 121.1333 },
    'Taal': { lat: 13.8833, lon: 120.9333 },
    'Lemery': { lat: 13.9167, lon: 120.8833 },
    'Balayan': { lat: 13.9333, lon: 120.7333 },
    'Nasugbu': { lat: 14.0667, lon: 120.6333 },
    'Mabini': { lat: 13.7333, lon: 120.9000 },
    'San Juan': { lat: 13.8333, lon: 121.4000 },
    'Bauan': { lat: 13.7917, lon: 121.0083 },
    'San Pascual': { lat: 13.8000, lon: 121.0333 },
    'Calaca': { lat: 13.9333, lon: 120.8000 }
  };

  const selectedScenario = scenarios[scenario] || scenarios.critical;
  const weatherDataArray = [];

  Object.entries(selectedScenario.cities).forEach(([cityName, config]) => {
    const coords = cityCoordinates[cityName] || { lat: 13.9411, lon: 121.1650 };

    const weatherData = {
      location: {
        city: cityName,
        country: 'PH',
        lat: coords.lat,
        lon: coords.lon
      },
      current: {
        temperature: config.temp,
        feelsLike: config.temp + 2,
        humidity: config.humidity,
        pressure: config.alert === 'critical' ? 1008 : config.alert === 'high' ? 1009 : 1011,
        windSpeed: config.windSpeed,
        windDirection: 135,
        cloudiness: config.rainfall > 20 ? 100 : config.rainfall > 10 ? 85 : config.rainfall > 5 ? 70 : 50,
        visibility: config.rainfall > 30 ? 1.5 : config.rainfall > 15 ? 3 : config.rainfall > 5 ? 6 : 10,
        weather: {
          main: config.condition,
          description: config.desc,
          icon: config.condition === 'Thunderstorm' ? '11d' : config.condition === 'Rain' ? '10d' : config.condition === 'Clouds' ? '04d' : '01d'
        },
        rainfall: config.rainfall,
        timestamp: now
      },
      forecast: {
        next6Hours: config.rainfall > 30 ? 'Continuous heavy rain expected' : config.rainfall > 15 ? 'Moderate to heavy rain' : config.rainfall > 5 ? 'Light to moderate rain' : 'Fair weather',
        next12Hours: config.rainfall > 30 ? 'Severe weather conditions persisting' : config.rainfall > 15 ? 'Rain continuing' : 'Improving conditions',
        warnings: config.rainfall > 30 ? ['Typhoon Warning', 'Flash Flood Warning', 'Strong Wind Warning'] : config.rainfall > 15 ? ['Heavy Rain Warning', 'Wind Advisory'] : []
      },
      alerts: config.alert && config.alertType ? [
        {
          level: config.alert,
          type: config.alertType,
          message: config.alertMsg,
          issuedAt: now
        }
      ] : [],
      lastUpdated: now
    };

    weatherDataArray.push(weatherData);
  });

  return weatherDataArray;
};

// Generate critical weather data for testing suspension system (legacy function for compatibility)
const generateCriticalWeatherData = () => {
  return generateWeatherData('critical');
};

// Seed database with weather data based on scenario (critical/moderate/normal)
export const seedWeatherData = async (scenario = 'critical') => {
  try {
    const weatherData = generateWeatherData(scenario);

    console.log(`Seeding ${weatherData.length} weather records for ${scenario} scenario...`);

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

  // Map report scenarios to weather scenarios
  const weatherScenarioMap = {
    'fullDataset': 'critical',
    'highConfidence': 'critical',
    'mediumConfidence': 'moderate',
    'lowConfidence': 'normal'
  };

  const weatherScenario = weatherScenarioMap[scenario] || 'critical';

  // Seed weather data matching the scenario
  const seedWeatherResult = await seedWeatherData(weatherScenario);
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
      description: 'Multiple cities with high report density: Lipa City (45), Batangas City (28), Tanauan City (22), and 15 scattered reports across 4 more cities',
      recommended: 'Test suspension feature with multi-city crisis'
    },
    mediumConfidence: {
      name: 'Medium Confidence Scenario',
      description: 'Tanauan City with 15 reports - borderline case (~65-75% confidence)',
      recommended: 'Test edge cases'
    },
    lowConfidence: {
      name: 'Low Confidence Scenario',
      description: '12 scattered reports across 8 cities (Mabini, San Juan, Balayan, Lemery, Nasugbu, Bauan, San Pascual, Calaca)',
      recommended: 'Test low confidence with diverse locations'
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
