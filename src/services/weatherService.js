// OpenWeather API Service for Real-time Weather Data
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '../firebase/config';
import {
  getRainfallWarningLevel,
  getTCWSLevel,
  checkAutoSuspendCriteria,
  PAGASA_WARNINGS
} from '../constants/suspensionCriteria';

const WEATHER_API_KEY = import.meta.env.VITE_WEATHER_API_KEY;
const WEATHER_API_URL = import.meta.env.VITE_WEATHER_API_URL || 'https://api.openweathermap.org/data/2.5';

// Default location: Batangas, Philippines
const DEFAULT_LOCATION = {
  city: 'Batangas',
  lat: 13.7565,
  lon: 121.0583,
  country: 'PH'
};

// Helper function to handle API errors
const handleApiError = (error, context) => {
  console.error(`Weather API Error (${context}):`, error);
  throw new Error(`Failed to fetch ${context}: ${error.message}`);
};

// Get current weather for a specific location
export const getCurrentWeather = async (city = DEFAULT_LOCATION.city) => {
  try {
    const response = await fetch(
      `${WEATHER_API_URL}/weather?q=${encodeURIComponent(city)},PH&appid=${WEATHER_API_KEY}&units=metric`
    );

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();

    // Transform API response to our format
    return {
      location: {
        city: data.name,
        country: data.sys.country,
        lat: data.coord.lat,
        lon: data.coord.lon,
      },
      current: {
        temperature: Math.round(data.main.temp),
        feelsLike: Math.round(data.main.feels_like),
        humidity: data.main.humidity,
        pressure: data.main.pressure,
        windSpeed: Math.round(data.wind.speed * 3.6), // Convert m/s to km/h
        windDirection: data.wind.deg,
        cloudiness: data.clouds.all,
        visibility: data.visibility / 1000, // Convert to km
        weather: {
          main: data.weather[0].main,
          description: data.weather[0].description,
          icon: data.weather[0].icon,
          iconUrl: `https://openweathermap.org/img/wn/${data.weather[0].icon}@2x.png`,
        },
        rainfall: data.rain?.['1h'] || 0, // Rainfall in last hour (mm)
        timestamp: new Date(data.dt * 1000),
      },
      sys: {
        sunrise: new Date(data.sys.sunrise * 1000),
        sunset: new Date(data.sys.sunset * 1000),
      },
    };
  } catch (error) {
    handleApiError(error, 'current weather');
  }
};

// Get 5-day weather forecast (3-hour intervals)
export const getWeatherForecast = async (city = DEFAULT_LOCATION.city) => {
  try {
    const response = await fetch(
      `${WEATHER_API_URL}/forecast?q=${encodeURIComponent(city)},PH&appid=${WEATHER_API_KEY}&units=metric`
    );

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();

    // Transform forecast data
    const forecast = data.list.map(item => ({
      timestamp: new Date(item.dt * 1000),
      temperature: Math.round(item.main.temp),
      feelsLike: Math.round(item.main.feels_like),
      humidity: item.main.humidity,
      pressure: item.main.pressure,
      windSpeed: Math.round(item.wind.speed * 3.6),
      cloudiness: item.clouds.all,
      rainfall: item.rain?.['3h'] || 0, // Rainfall in last 3 hours (mm)
      weather: {
        main: item.weather[0].main,
        description: item.weather[0].description,
        icon: item.weather[0].icon,
        iconUrl: `https://openweathermap.org/img/wn/${item.weather[0].icon}@2x.png`,
      },
      pop: item.pop * 100, // Probability of precipitation (%)
    }));

    return {
      location: {
        city: data.city.name,
        country: data.city.country,
        lat: data.city.coord.lat,
        lon: data.city.coord.lon,
      },
      forecast,
    };
  } catch (error) {
    handleApiError(error, 'weather forecast');
  }
};

// Get weather for multiple cities in Batangas Province
export const getBatangasWeather = async () => {
  try {
    // First, try to fetch from Firestore (seeded data)
    const weatherRef = collection(db, 'weather');
    const snapshot = await getDocs(weatherRef);

    if (!snapshot.empty) {
      // We have seeded data in Firestore, use it
      console.log('📊 Using seeded weather data from Firestore');
      const weatherData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        // Convert Firestore Timestamps to JS Dates
        current: {
          ...doc.data().current,
          timestamp: doc.data().current.timestamp?.toDate ? doc.data().current.timestamp.toDate() : new Date()
        },
        lastUpdated: doc.data().lastUpdated?.toDate ? doc.data().lastUpdated.toDate() : new Date()
      }));

      return weatherData;
    }

    // If no Firestore data, fall back to OpenWeather API
    console.log('🌐 No seeded data found. Fetching weather data from OpenWeather API...');
    const batangasCities = [
      'Batangas City',
      'Lipa City',
      'Tanauan City',
      'Santo Tomas',
      'Rosario',
      'Ibaan',
      'Taal',
      'Lemery',
      'Balayan',
      'Nasugbu',
      'Mabini',
      'San Juan',
      'Bauan',
      'San Pascual',
      'Calaca',
    ];

    const weatherPromises = batangasCities.map(city =>
      getCurrentWeather(city).catch(err => {
        console.error(`Failed to fetch weather for ${city}:`, err);
        return null;
      })
    );

    const results = await Promise.all(weatherPromises);

    // Filter out any failed requests
    const validResults = results.filter(result => result !== null);

    if (validResults.length === 0) {
      console.warn('⚠️ No weather data available from API');
    } else {
      console.log(`✅ Successfully fetched weather data for ${validResults.length} cities from API`);
    }

    return validResults;
  } catch (error) {
    console.error('Error fetching Batangas weather:', error);
    // If Firestore fails, try API as fallback
    try {
      console.log('🔄 Firestore error, attempting API fallback...');
      const batangasCities = [
        'Batangas City',
        'Lipa City',
        'Tanauan City',
        'Santo Tomas',
        'Rosario',
        'Ibaan',
        'Taal',
        'Lemery',
        'Balayan',
        'Nasugbu',
        'Mabini',
        'San Juan',
        'Bauan',
        'San Pascual',
        'Calaca',
      ];

      const weatherPromises = batangasCities.map(city =>
        getCurrentWeather(city).catch(err => {
          console.error(`Failed to fetch weather for ${city}:`, err);
          return null;
        })
      );

      const results = await Promise.all(weatherPromises);
      const validResults = results.filter(result => result !== null);

      if (validResults.length === 0) {
        console.error('❌ No weather data available from API fallback');
        return [];
      }

      return validResults;
    } catch (apiError) {
      console.error('❌ API fallback failed:', apiError);
      return [];
    }
  }
};

// Get hourly forecast for charts (next 24 hours)
export const getHourlyForecast = async (city = DEFAULT_LOCATION.city) => {
  try {
    const forecastData = await getWeatherForecast(city);

    // Get next 8 data points (24 hours with 3-hour intervals)
    const hourlyData = forecastData.forecast.slice(0, 8).map(item => {
      const hour = item.timestamp.getHours();
      const ampm = hour >= 12 ? 'PM' : 'AM';
      const displayHour = hour % 12 || 12;

      return {
        time: `${displayHour}${ampm}`,
        timestamp: item.timestamp,
        rainfall: item.rainfall,
        humidity: item.humidity,
        wind: item.windSpeed,
        temperature: item.temperature,
        weather: item.weather.main,
      };
    });

    return hourlyData;
  } catch (error) {
    handleApiError(error, 'hourly forecast');
  }
};

// Get weather alerts (categorize based on weather conditions)
export const getWeatherAlerts = async () => {
  try {
    const batangasWeather = await getBatangasWeather();

    // Analyze weather data and create alerts
    const alerts = batangasWeather.map(data => {
      // First check if the weather data has alerts array from seeded data
      let level = 'low';
      let status = 'Normal';

      if (data.alerts && data.alerts.length > 0) {
        // Use the alert level from seeded data
        level = data.alerts[0].level;
        status = data.alerts[0].message || 'Weather Alert';
      } else {
        // Determine alert level based on conditions (fallback for non-seeded data)
        if (data.current.rainfall >= 30 || data.current.windSpeed >= 55) {
          level = 'critical';
          status = data.current.rainfall >= 30 ? 'Critical - Typhoon Level Rainfall' : 'Critical - Typhoon Force Winds';
        } else if (data.current.rainfall >= 20 || data.current.windSpeed >= 40) {
          level = 'high';
          status = data.current.rainfall >= 20 ? 'Heavy Rain Warning' : 'Strong Wind Warning';
        } else if (data.current.rainfall >= 10 || data.current.windSpeed >= 30) {
          level = 'medium';
          status = data.current.rainfall >= 10 ? 'Moderate Rain' : 'Gusty Winds';
        } else if (data.current.rainfall >= 5 || data.current.windSpeed >= 20 || data.current.weather.main === 'Rain') {
          level = 'low';
          status = 'Light Rain';
        }
      }

      return {
        location: data.location.city,
        level,
        status,
        conditions: {
          temperature: data.current.temperature,
          rainfall: data.current.rainfall,
          windSpeed: data.current.windSpeed,
          humidity: data.current.humidity,
        },
        timestamp: data.current.timestamp,
      };
    });

    // Sort by alert level (critical > high > medium > low)
    const levelPriority = { critical: 4, high: 3, medium: 2, low: 1 };
    alerts.sort((a, b) => levelPriority[b.level] - levelPriority[a.level]);

    return alerts;
  } catch (error) {
    handleApiError(error, 'weather alerts');
  }
};

// Calculate weather statistics for analytics
export const getWeatherStatistics = async () => {
  try {
    const batangasWeather = await getBatangasWeather();

    const stats = {
      averageTemperature: 0,
      averageHumidity: 0,
      averageWindSpeed: 0,
      totalRainfall: 0,
      highRiskAreas: 0,
      mediumRiskAreas: 0,
      normalAreas: 0,
      weatherConditions: {
        clear: 0,
        cloudy: 0,
        rain: 0,
        storm: 0,
      },
    };

    batangasWeather.forEach(data => {
      stats.averageTemperature += data.current.temperature;
      stats.averageHumidity += data.current.humidity;
      stats.averageWindSpeed += data.current.windSpeed;
      stats.totalRainfall += data.current.rainfall;

      // Count risk areas
      if (data.current.rainfall > 10 || data.current.windSpeed > 40) {
        stats.highRiskAreas++;
      } else if (data.current.rainfall > 5 || data.current.windSpeed > 25) {
        stats.mediumRiskAreas++;
      } else {
        stats.normalAreas++;
      }

      // Count weather conditions
      const condition = data.current.weather.main.toLowerCase();
      if (condition.includes('clear') || condition.includes('sun')) {
        stats.weatherConditions.clear++;
      } else if (condition.includes('cloud')) {
        stats.weatherConditions.cloudy++;
      } else if (condition.includes('rain') || condition.includes('drizzle')) {
        stats.weatherConditions.rain++;
      } else if (condition.includes('storm') || condition.includes('thunder')) {
        stats.weatherConditions.storm++;
      }
    });

    // Calculate averages
    const count = batangasWeather.length;
    stats.averageTemperature = Math.round(stats.averageTemperature / count);
    stats.averageHumidity = Math.round(stats.averageHumidity / count);
    stats.averageWindSpeed = Math.round(stats.averageWindSpeed / count);
    stats.totalRainfall = Math.round(stats.totalRainfall * 10) / 10;

    return stats;
  } catch (error) {
    handleApiError(error, 'weather statistics');
  }
};

// Get weather icon component name based on condition
export const getWeatherIconName = (weatherMain) => {
  const iconMap = {
    Clear: 'Sun',
    Clouds: 'Cloud',
    Rain: 'CloudRain',
    Drizzle: 'CloudDrizzle',
    Thunderstorm: 'CloudLightning',
    Snow: 'Snowflake',
    Mist: 'CloudFog',
    Fog: 'CloudFog',
    Haze: 'CloudFog',
  };

  return iconMap[weatherMain] || 'Cloud';
};

// Get detailed hourly forecast from Pro API (96 hours)
export const getDetailedHourlyForecast = async (city = DEFAULT_LOCATION.city) => {
  try {
    const apiKey = '13616e53cdfb9b00c018abeaa05e9784';
    const response = await fetch(
      `https://pro.openweathermap.org/data/2.5/forecast/hourly?q=${encodeURIComponent(city)}&appid=${apiKey}&units=metric`
    );

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();

    // Process hourly data (next 48 hours)
    const hourlyData = data.list.slice(0, 48).map(item => {
      const timestamp = new Date(item.dt * 1000);
      const hour = timestamp.getHours();
      const ampm = hour >= 12 ? 'PM' : 'AM';
      const displayHour = hour % 12 || 12;

      return {
        time: `${displayHour}${ampm}`,
        fullTime: timestamp.toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', hour12: true }),
        timestamp,
        temperature: Math.round(item.main.temp),
        feelsLike: Math.round(item.main.feels_like),
        humidity: item.main.humidity,
        rainfall: item.rain ? item.rain['1h'] || 0 : 0,
        windSpeed: Math.round(item.wind.speed * 3.6), // Convert m/s to km/h
        windDirection: item.wind.deg,
        pressure: item.main.pressure,
        clouds: item.clouds.all,
        weather: {
          main: item.weather[0].main,
          description: item.weather[0].description,
          icon: item.weather[0].icon
        }
      };
    });

    return hourlyData;
  } catch (error) {
    console.error('Detailed hourly forecast error:', error);
    // Fallback to regular hourly forecast if pro API fails
    return getHourlyForecast(city);
  }
};

// Get 4-day daily forecast (aggregated from 5-day/3-hour forecast)
export const getClimateForecast = async () => {
  try {
    const apiKey = '13616e53cdfb9b00c018abeaa05e9784';
    // Using Batangas coordinates
    const lat = 13.7567;
    const lon = 121.058;

    const response = await fetch(
      `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&appid=${apiKey}&units=metric`
    );

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();

    // Group forecast data by day
    const dailyData = {};

    data.list.forEach(item => {
      const date = new Date(item.dt * 1000);
      const dayKey = date.toDateString(); // Use date string as key

      if (!dailyData[dayKey]) {
        dailyData[dayKey] = {
          timestamp: date,
          temps: [],
          humidities: [],
          rainfalls: [],
          windSpeeds: [],
          pressures: [],
          weather: item.weather[0]
        };
      }

      dailyData[dayKey].temps.push(item.main.temp);
      dailyData[dayKey].humidities.push(item.main.humidity);
      dailyData[dayKey].rainfalls.push(item.rain ? item.rain['3h'] || 0 : 0);
      dailyData[dayKey].windSpeeds.push(item.wind.speed * 3.6); // Convert m/s to km/h
      dailyData[dayKey].pressures.push(item.main.pressure);
    });

    // Convert to array and calculate daily averages
    const forecastData = Object.values(dailyData).slice(0, 4).map(day => {
      const avgTemp = day.temps.reduce((a, b) => a + b, 0) / day.temps.length;
      const minTemp = Math.min(...day.temps);
      const maxTemp = Math.max(...day.temps);
      const avgHumidity = day.humidities.reduce((a, b) => a + b, 0) / day.humidities.length;
      const totalRainfall = day.rainfalls.reduce((a, b) => a + b, 0);
      const avgWindSpeed = day.windSpeeds.reduce((a, b) => a + b, 0) / day.windSpeeds.length;
      const avgPressure = day.pressures.reduce((a, b) => a + b, 0) / day.pressures.length;

      const dayName = day.timestamp.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });

      return {
        time: dayName,
        fullTime: day.timestamp.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' }),
        timestamp: day.timestamp,
        temperature: Math.round(avgTemp),
        tempMin: Math.round(minTemp),
        tempMax: Math.round(maxTemp),
        humidity: Math.round(avgHumidity),
        rainfall: Math.round(totalRainfall * 10) / 10,
        windSpeed: Math.round(avgWindSpeed),
        pressure: Math.round(avgPressure),
        weather: {
          main: day.weather.main,
          description: day.weather.description,
          icon: day.weather.icon
        }
      };
    });

    return forecastData;
  } catch (error) {
    console.error('Climate forecast error:', error);
    throw error;
  }
};

/**
 * Get PAGASA rainfall warning for a city's current conditions
 * @param {object} weatherData - Weather data object with rainfall
 * @returns {object|null} PAGASA warning object or null
 */
export const getPAGASAWarning = (weatherData) => {
  const rainfall = weatherData?.current?.rainfall || 0;
  return getRainfallWarningLevel(rainfall);
};

/**
 * Get TCWS level for a city's current wind speed
 * @param {object} weatherData - Weather data object with windSpeed
 * @returns {object|null} TCWS level object or null
 */
export const getTCWS = (weatherData) => {
  const windSpeed = weatherData?.current?.windSpeed || 0;
  return getTCWSLevel(windSpeed);
};

/**
 * Check if weather conditions meet DepEd auto-suspend criteria
 * @param {object} weatherData - Weather data object
 * @returns {object} Auto-suspend assessment
 */
export const checkSuspensionCriteria = (weatherData) => {
  const criteria = {
    rainfall: weatherData?.current?.rainfall || 0,
    windSpeed: weatherData?.current?.windSpeed || 0,
    tcws: weatherData?.tcws || null
  };

  return checkAutoSuspendCriteria(criteria);
};

/**
 * Get comprehensive weather assessment for suspension decision
 * @param {string} city - City name
 * @returns {object} Comprehensive weather assessment
 */
export const getWeatherAssessmentForSuspension = async (city) => {
  try {
    const weatherData = await getCurrentWeather(city);
    const pagasaWarning = getPAGASAWarning(weatherData);
    const tcws = getTCWS(weatherData);
    const autoSuspend = checkSuspensionCriteria(weatherData);

    return {
      city,
      weather: weatherData,
      pagasaWarning,
      tcws,
      autoSuspend,
      timestamp: new Date(),
      criteria: {
        rainfall: weatherData.current.rainfall,
        windSpeed: weatherData.current.windSpeed,
        temperature: weatherData.current.temperature,
        humidity: weatherData.current.humidity,
        conditions: weatherData.current.weather.description
      }
    };
  } catch (error) {
    console.error(`Error getting weather assessment for ${city}:`, error);
    return null;
  }
};

/**
 * Get weather assessments for all Batangas cities with suspension criteria
 * @returns {Array} Array of weather assessments for all cities
 */
export const getBatangasWeatherWithSuspensionCriteria = async () => {
  try {
    const batangasWeather = await getBatangasWeather();

    return batangasWeather.map(weatherData => {
      const pagasaWarning = getPAGASAWarning(weatherData);
      const tcws = getTCWS(weatherData);
      const autoSuspend = checkSuspensionCriteria(weatherData);

      return {
        city: weatherData.location.city,
        weather: weatherData,
        pagasaWarning,
        tcws,
        autoSuspend,
        timestamp: weatherData.current.timestamp,
        criteria: {
          rainfall: weatherData.current.rainfall,
          windSpeed: weatherData.current.windSpeed,
          temperature: weatherData.current.temperature,
          humidity: weatherData.current.humidity,
          conditions: weatherData.current.weather.description
        }
      };
    });
  } catch (error) {
    console.error('Error getting Batangas weather with suspension criteria:', error);
    return [];
  }
};

/**
 * Get cities that meet auto-suspension criteria
 * @returns {Array} Array of cities that should be auto-suspended
 */
export const getCitiesForAutoSuspension = async () => {
  try {
    const assessments = await getBatangasWeatherWithSuspensionCriteria();

    return assessments
      .filter(assessment => assessment.autoSuspend.shouldAutoSuspend)
      .map(assessment => ({
        city: assessment.city,
        reason: assessment.autoSuspend.triggers.map(t => t.description).join(', '),
        pagasaWarning: assessment.pagasaWarning,
        tcws: assessment.tcws,
        criteria: assessment.criteria,
        affectedLevels: assessment.autoSuspend.affectedLevels,
        triggers: assessment.autoSuspend.triggers
      }));
  } catch (error) {
    console.error('Error getting cities for auto-suspension:', error);
    return [];
  }
};

/**
 * Get PAGASA warning badge color and label
 * @param {string} warningLevel - Warning level (yellow/orange/red)
 * @returns {object} Badge properties
 */
export const getPAGASAWarningBadge = (warningLevel) => {
  if (!warningLevel) {
    return {
      label: 'No Warning',
      color: '#10B981',
      bgColor: '#D1FAE5',
      icon: '✓'
    };
  }

  const warning = PAGASA_WARNINGS[warningLevel.toUpperCase()];
  return warning
    ? {
        label: warning.label,
        color: warning.color,
        bgColor: warning.bgColor,
        icon: warning.icon
      }
    : {
        label: 'Unknown',
        color: '#6B7280',
        bgColor: '#F3F4F6',
        icon: '?'
      };
};

export default {
  getCurrentWeather,
  getWeatherForecast,
  getBatangasWeather,
  getHourlyForecast,
  getDetailedHourlyForecast,
  getClimateForecast,
  getWeatherAlerts,
  getWeatherStatistics,
  getWeatherIconName,
  // New suspension-related functions
  getPAGASAWarning,
  getTCWS,
  checkSuspensionCriteria,
  getWeatherAssessmentForSuspension,
  getBatangasWeatherWithSuspensionCriteria,
  getCitiesForAutoSuspension,
  getPAGASAWarningBadge
};
