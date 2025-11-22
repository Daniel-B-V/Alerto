// Script to seed Firebase with dummy data for testing

import { collection, addDoc, getDocs, deleteDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase/config';
import { generateAllDummyData, getTestScenarios } from './dummyData';
import { BATANGAS_MUNICIPALITIES } from '../constants/batangasLocations';

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

    // Also clear announcements (mayor/governor posts in community)
    const announcementsRef = collection(db, 'announcements');
    const announcementsSnapshot = await getDocs(announcementsRef);

    if (announcementsSnapshot.size > 0) {
      console.log(`Found ${announcementsSnapshot.size} announcements to delete...`);
      const announcementDeletePromises = announcementsSnapshot.docs.map(doc => deleteDoc(doc.ref));
      await Promise.all(announcementDeletePromises);
      console.log('✅ All announcements cleared!');
    }

    console.log('✅ All reports, suspensions, and announcements cleared successfully!');
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

// Generate weather data based on scenario for ALL 34 municipalities
const generateWeatherData = (scenario = 'critical') => {
  const now = new Date();

  // Helper to format city name
  const formatCityName = (name) => {
    return name.split(' ').map(word =>
      word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
    ).join(' ');
  };

  // Coordinates for all municipalities
  const cityCoordinates = {
    'Agoncillo': { lat: 13.9333, lon: 120.9167 },
    'Alitagtag': { lat: 13.8667, lon: 121.0167 },
    'Balayan': { lat: 13.9333, lon: 120.7333 },
    'Balete': { lat: 13.7833, lon: 121.0833 },
    'Batangas City': { lat: 13.7565, lon: 121.0583 },
    'Bauan': { lat: 13.7917, lon: 121.0083 },
    'Calaca': { lat: 13.9333, lon: 120.8000 },
    'Calatagan': { lat: 13.8333, lon: 120.6333 },
    'Cuenca': { lat: 13.9000, lon: 121.0500 },
    'Ibaan': { lat: 13.8167, lon: 121.1333 },
    'Laurel': { lat: 14.0500, lon: 120.9167 },
    'Lemery': { lat: 13.9167, lon: 120.8833 },
    'Lian': { lat: 14.0333, lon: 120.6500 },
    'Lipa City': { lat: 13.9411, lon: 121.1650 },
    'Lobo': { lat: 13.6500, lon: 121.2167 },
    'Mabini': { lat: 13.7333, lon: 120.9000 },
    'Malvar': { lat: 14.0333, lon: 121.1500 },
    'Mataas Na Kahoy': { lat: 13.9667, lon: 121.0833 },
    'Nasugbu': { lat: 14.0667, lon: 120.6333 },
    'Padre Garcia': { lat: 13.8833, lon: 121.2167 },
    'Rosario': { lat: 13.8500, lon: 121.2000 },
    'San Jose': { lat: 13.8667, lon: 121.1000 },
    'San Juan': { lat: 13.8333, lon: 121.4000 },
    'San Luis': { lat: 13.8500, lon: 121.0167 },
    'San Nicolas': { lat: 13.9333, lon: 121.0500 },
    'San Pascual': { lat: 13.8000, lon: 121.0333 },
    'Santa Teresita': { lat: 13.8500, lon: 120.9833 },
    'Santo Tomas': { lat: 14.1078, lon: 121.1411 },
    'Taal': { lat: 13.8833, lon: 120.9333 },
    'Talisay': { lat: 13.9500, lon: 120.9333 },
    'Tanauan City': { lat: 14.0857, lon: 121.1503 },
    'Taysan': { lat: 13.7833, lon: 121.2000 },
    'Tingloy': { lat: 13.6333, lon: 120.8667 },
    'Tuy': { lat: 14.0167, lon: 120.7333 }
  };

  // Specific weather for key cities based on scenario (18 cities with severe weather)
  const scenarioConfigs = {
    critical: {
      // CRITICAL LEVEL (3 cities) - Typhoon conditions
      'Lipa City': { temp: 24, humidity: 95, windSpeed: 65, rainfall: 45, condition: 'Thunderstorm', desc: 'heavy thunderstorm with heavy rain', alert: 'critical', alertType: 'typhoon', alertMsg: 'Signal No. 2 - Severe weather conditions' },
      'Nasugbu': { temp: 23, humidity: 94, windSpeed: 62, rainfall: 42, condition: 'Thunderstorm', desc: 'severe thunderstorm with very heavy rain', alert: 'critical', alertType: 'typhoon', alertMsg: 'Signal No. 2 - Typhoon warning in effect' },
      'Calatagan': { temp: 24, humidity: 93, windSpeed: 60, rainfall: 40, condition: 'Thunderstorm', desc: 'typhoon-level conditions with storm surge risk', alert: 'critical', alertType: 'typhoon', alertMsg: 'Signal No. 2 - Coastal flooding warning' },

      // HIGH LEVEL (7 cities) - Heavy rain and strong winds
      'Batangas City': { temp: 25, humidity: 92, windSpeed: 58, rainfall: 38, condition: 'Rain', desc: 'heavy intensity rain', alert: 'high', alertType: 'heavy_rain', alertMsg: 'Heavy rainfall advisory in effect' },
      'Tanauan City': { temp: 23, humidity: 90, windSpeed: 52, rainfall: 32, condition: 'Rain', desc: 'heavy rain with strong winds', alert: 'high', alertType: 'storm', alertMsg: 'Severe thunderstorm warning' },
      'Lemery': { temp: 24, humidity: 91, windSpeed: 55, rainfall: 35, condition: 'Rain', desc: 'continuous heavy rainfall', alert: 'high', alertType: 'heavy_rain', alertMsg: 'Flash flood warning in effect' },
      'Taal': { temp: 25, humidity: 89, windSpeed: 53, rainfall: 33, condition: 'Rain', desc: 'heavy rain and gusty winds', alert: 'high', alertType: 'storm', alertMsg: 'Severe weather warning' },
      'Bauan': { temp: 24, humidity: 90, windSpeed: 54, rainfall: 34, condition: 'Rain', desc: 'heavy rainfall with flooding risk', alert: 'high', alertType: 'heavy_rain', alertMsg: 'Heavy rain warning' },
      'San Juan': { temp: 23, humidity: 91, windSpeed: 51, rainfall: 31, condition: 'Rain', desc: 'intense rainfall', alert: 'high', alertType: 'heavy_rain', alertMsg: 'Flooding advisory in effect' },
      'Lobo': { temp: 24, humidity: 89, windSpeed: 52, rainfall: 32, condition: 'Rain', desc: 'heavy rain showers', alert: 'high', alertType: 'storm', alertMsg: 'Heavy rainfall warning' },

      // MEDIUM LEVEL (8 cities) - Moderate to heavy rain
      'Santo Tomas': { temp: 24, humidity: 88, windSpeed: 45, rainfall: 25, condition: 'Rain', desc: 'moderate to heavy rain', alert: 'medium', alertType: 'rain', alertMsg: 'Moderate rainfall advisory' },
      'Rosario': { temp: 24, humidity: 87, windSpeed: 42, rainfall: 22, condition: 'Rain', desc: 'moderate rain', alert: 'medium', alertType: 'rain', alertMsg: 'Moderate rainfall warning' },
      'Ibaan': { temp: 25, humidity: 86, windSpeed: 44, rainfall: 24, condition: 'Rain', desc: 'moderate rainfall with occasional heavy showers', alert: 'medium', alertType: 'rain', alertMsg: 'Rainfall advisory' },
      'Cuenca': { temp: 24, humidity: 87, windSpeed: 43, rainfall: 23, condition: 'Rain', desc: 'moderate rain showers', alert: 'medium', alertType: 'rain', alertMsg: 'Moderate rain warning' },
      'Malvar': { temp: 25, humidity: 85, windSpeed: 41, rainfall: 21, condition: 'Rain', desc: 'moderate rainfall', alert: 'medium', alertType: 'rain', alertMsg: 'Rain advisory in effect' },
      'San Pascual': { temp: 24, humidity: 86, windSpeed: 42, rainfall: 22, condition: 'Rain', desc: 'moderate to heavy rain periods', alert: 'medium', alertType: 'rain', alertMsg: 'Rainfall warning' },
      'Alitagtag': { temp: 25, humidity: 84, windSpeed: 40, rainfall: 20, condition: 'Rain', desc: 'moderate rain conditions', alert: 'medium', alertType: 'rain', alertMsg: 'Moderate rainfall advisory' },
      'Laurel': { temp: 24, humidity: 85, windSpeed: 41, rainfall: 21, condition: 'Rain', desc: 'moderate rain with gusty winds', alert: 'medium', alertType: 'rain', alertMsg: 'Rainfall and wind advisory' }
    },
    moderate: {
      'Tanauan City': { temp: 25, humidity: 85, windSpeed: 38, rainfall: 20, condition: 'Rain', desc: 'moderate rain', alert: 'medium', alertType: 'rain', alertMsg: 'Moderate rainfall advisory' }
    },
    normal: {}
  };

  const selectedConfig = scenarioConfigs[scenario] || scenarioConfigs.critical;
  const weatherDataArray = [];

  // Generate weather for all municipalities
  BATANGAS_MUNICIPALITIES.forEach(municipality => {
    const cityName = formatCityName(municipality);
    const coords = cityCoordinates[cityName] || { lat: 13.8500, lon: 121.0000 };

    // Check if city has specific scenario config
    const specificConfig = selectedConfig[cityName];

    // Default weather (varies slightly per city for realism)
    const baseTemp = 28 + Math.floor(Math.random() * 4);
    const baseHumidity = 65 + Math.floor(Math.random() * 15);
    const baseWindSpeed = 10 + Math.floor(Math.random() * 15);
    const baseRainfall = scenario === 'critical' ? Math.floor(Math.random() * 10) : 0;

    const config = specificConfig || {
      temp: baseTemp,
      humidity: baseHumidity,
      windSpeed: baseWindSpeed,
      rainfall: baseRainfall,
      condition: baseRainfall > 5 ? 'Rain' : baseRainfall > 0 ? 'Clouds' : 'Clear',
      desc: baseRainfall > 5 ? 'light rain' : baseRainfall > 0 ? 'scattered clouds' : 'clear sky',
      alert: 'low',
      alertType: null,
      alertMsg: null
    };

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
