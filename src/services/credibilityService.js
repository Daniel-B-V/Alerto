// Report Credibility Verification Service
// Checks if user reports align with actual weather conditions

import { getCurrentWeather } from './weatherService';

/**
 * Verify report credibility against current weather data
 * @param {Object} report - Report data including category, location, description
 * @returns {Object} Credibility assessment
 */
export const verifyReportCredibility = async (report) => {
  try {
    const { category, city, description } = report;

    // Fetch current weather for the reported location
    const weatherData = await getCurrentWeather(city);

    if (!weatherData) {
      return {
        isCredible: true, // Give benefit of doubt if weather data unavailable
        confidence: 50,
        warning: null,
        weatherConditions: null,
        reason: 'Unable to verify - weather data unavailable'
      };
    }

    const { current } = weatherData;

    // Define credibility rules based on report category
    const credibilityCheck = checkCredibilityByCategory(
      category,
      current,
      description
    );

    return {
      isCredible: credibilityCheck.isCredible,
      confidence: credibilityCheck.confidence,
      warning: credibilityCheck.warning,
      weatherConditions: {
        temperature: current.temperature,
        weather: current.weather.description,
        rainfall: current.rainfall,
        windSpeed: current.windSpeed,
        humidity: current.humidity,
        cloudiness: current.cloudiness
      },
      reason: credibilityCheck.reason,
      suggestion: credibilityCheck.suggestion
    };

  } catch (error) {
    console.error('Credibility verification error:', error);
    return {
      isCredible: true,
      confidence: 50,
      warning: null,
      weatherConditions: null,
      reason: 'Verification unavailable - proceeding with manual review'
    };
  }
};

/**
 * Check credibility based on report category and weather conditions
 */
const checkCredibilityByCategory = (category, weatherData, description) => {
  const descLower = description.toLowerCase();

  // Weather-related categories
  switch (category) {
    case 'flooding':
      return checkFloodingCredibility(weatherData, descLower);

    case 'heavy_rain':
      return checkHeavyRainCredibility(weatherData, descLower);

    case 'storm':
      return checkStormCredibility(weatherData, descLower);

    case 'strong_wind':
      return checkStrongWindCredibility(weatherData, descLower);

    case 'landslide':
      return checkLandslideCredibility(weatherData, descLower);

    // Non-weather categories (always credible unless contradicted)
    case 'road_blockage':
    case 'power_outage':
    case 'infrastructure':
    case 'other':
      return {
        isCredible: true,
        confidence: 85,
        warning: null,
        reason: 'Report category does not require weather verification',
        suggestion: null
      };

    default:
      return {
        isCredible: true,
        confidence: 70,
        warning: null,
        reason: 'Unable to verify this type of report',
        suggestion: null
      };
  }
};

/**
 * Check flooding report credibility
 */
const checkFloodingCredibility = (weather, description) => {
  const { rainfall, weather: weatherInfo, humidity } = weather;
  const hasRecentRain = rainfall > 0 || weatherInfo.main === 'Rain';
  const highHumidity = humidity > 80;

  // High credibility if there's active rainfall
  if (rainfall > 5) {
    return {
      isCredible: true,
      confidence: 95,
      warning: null,
      reason: `Current heavy rainfall (${rainfall}mm/h) supports flooding report`,
      suggestion: null
    };
  }

  // Medium credibility if light rain or recent rain
  if (hasRecentRain || highHumidity) {
    return {
      isCredible: true,
      confidence: 75,
      warning: 'Moderate credibility - light rainfall detected',
      reason: `Weather conditions (${weatherInfo.description}, humidity: ${humidity}%) are consistent with possible flooding`,
      suggestion: null
    };
  }

  // Low credibility if no rain
  if (rainfall === 0 && weatherInfo.main === 'Clear') {
    return {
      isCredible: false,
      confidence: 30,
      warning: '⚠️ Warning: Current weather is clear with no rainfall',
      reason: `No active rainfall detected (0mm/h). Current weather: ${weatherInfo.description}`,
      suggestion: 'Please verify this report. If flooding exists, it may be due to drainage issues or water from other areas.'
    };
  }

  return {
    isCredible: true,
    confidence: 60,
    warning: 'Unable to fully verify - weather data inconclusive',
    reason: 'Weather conditions neither strongly support nor contradict the report',
    suggestion: null
  };
};

/**
 * Check heavy rain report credibility
 */
const checkHeavyRainCredibility = (weather, description) => {
  const { rainfall, weather: weatherInfo } = weather;

  if (rainfall > 7.5) {
    return {
      isCredible: true,
      confidence: 95,
      warning: null,
      reason: `Very heavy rainfall confirmed (${rainfall}mm/h)`,
      suggestion: null
    };
  }

  if (rainfall > 2.5 || weatherInfo.main === 'Rain') {
    return {
      isCredible: true,
      confidence: 85,
      warning: null,
      reason: `Rainfall detected (${rainfall}mm/h). Weather: ${weatherInfo.description}`,
      suggestion: null
    };
  }

  if (rainfall === 0 && !weatherInfo.main.includes('Rain')) {
    return {
      isCredible: false,
      confidence: 25,
      warning: '⚠️ Warning: No rainfall detected at this time',
      reason: `Current weather: ${weatherInfo.description} with 0mm/h rainfall`,
      suggestion: 'Current weather conditions do not support heavy rain reports. Please verify your location and timing.'
    };
  }

  return {
    isCredible: true,
    confidence: 65,
    warning: 'Weather partially supports this report',
    reason: 'Some precipitation possible but not confirmed',
    suggestion: null
  };
};

/**
 * Check storm/typhoon report credibility
 */
const checkStormCredibility = (weather, description) => {
  const { rainfall, windSpeed, weather: weatherInfo } = weather;
  const hasStormConditions =
    (rainfall > 10 && windSpeed > 40) ||
    weatherInfo.main === 'Thunderstorm' ||
    windSpeed > 60;

  if (hasStormConditions) {
    return {
      isCredible: true,
      confidence: 95,
      warning: null,
      reason: `Storm conditions confirmed: ${rainfall}mm/h rainfall, ${windSpeed}km/h winds`,
      suggestion: null
    };
  }

  if (rainfall > 5 || windSpeed > 30) {
    return {
      isCredible: true,
      confidence: 70,
      warning: 'Moderate weather activity detected',
      reason: `Severe weather developing: ${rainfall}mm/h rainfall, ${windSpeed}km/h winds`,
      suggestion: null
    };
  }

  if (rainfall < 2 && windSpeed < 20 && weatherInfo.main === 'Clear') {
    return {
      isCredible: false,
      confidence: 20,
      warning: '⚠️ Warning: No storm activity detected',
      reason: `Current conditions are calm: ${weatherInfo.description}, ${windSpeed}km/h winds, ${rainfall}mm/h rain`,
      suggestion: 'No storm or typhoon detected in your area at this time. Please check official weather advisories.'
    };
  }

  return {
    isCredible: true,
    confidence: 60,
    warning: 'Weather conditions inconclusive for storm activity',
    reason: 'Some weather activity but not storm-level',
    suggestion: null
  };
};

/**
 * Check strong wind report credibility
 */
const checkStrongWindCredibility = (weather, description) => {
  const { windSpeed, weather: weatherInfo } = weather;

  if (windSpeed > 50) {
    return {
      isCredible: true,
      confidence: 95,
      warning: null,
      reason: `Very strong winds confirmed (${windSpeed}km/h)`,
      suggestion: null
    };
  }

  if (windSpeed > 30) {
    return {
      isCredible: true,
      confidence: 85,
      warning: null,
      reason: `Strong winds detected (${windSpeed}km/h)`,
      suggestion: null
    };
  }

  if (windSpeed < 15) {
    return {
      isCredible: false,
      confidence: 30,
      warning: '⚠️ Warning: Winds are currently calm',
      reason: `Wind speed is low (${windSpeed}km/h). Current weather: ${weatherInfo.description}`,
      suggestion: 'Wind conditions appear normal at this time. Strong winds may be localized or have already passed.'
    };
  }

  return {
    isCredible: true,
    confidence: 70,
    warning: 'Moderate wind activity',
    reason: `Wind speed: ${windSpeed}km/h - within normal to moderate range`,
    suggestion: null
  };
};

/**
 * Check landslide report credibility
 */
const checkLandslideCredibility = (weather, description) => {
  const { rainfall, weather: weatherInfo, humidity } = weather;

  // Landslides are often caused by accumulated rainfall
  if (rainfall > 10 || (rainfall > 5 && humidity > 90)) {
    return {
      isCredible: true,
      confidence: 90,
      warning: null,
      reason: `Heavy rainfall (${rainfall}mm/h) and high humidity (${humidity}%) create landslide conditions`,
      suggestion: null
    };
  }

  if (rainfall > 2 || humidity > 80) {
    return {
      isCredible: true,
      confidence: 75,
      warning: null,
      reason: `Moderate rainfall and high humidity support possible landslide`,
      suggestion: null
    };
  }

  if (rainfall === 0 && weatherInfo.main === 'Clear') {
    return {
      isCredible: true, // Don't reject completely - could be delayed effect
      confidence: 60,
      warning: '⚠️ Note: Current weather is clear',
      reason: 'Landslides can occur after rainfall has stopped due to soil saturation',
      suggestion: 'If this is an active landslide, please report exact location for emergency response.'
    };
  }

  return {
    isCredible: true,
    confidence: 70,
    warning: null,
    reason: 'Landslides can be caused by various factors beyond immediate weather',
    suggestion: null
  };
};

/**
 * Get credibility level label
 */
export const getCredibilityLevel = (confidence) => {
  if (confidence >= 80) return 'High';
  if (confidence >= 60) return 'Moderate';
  if (confidence >= 40) return 'Low';
  return 'Very Low';
};

/**
 * Get credibility color for UI
 */
export const getCredibilityColor = (confidence) => {
  if (confidence >= 80) return { bg: 'bg-green-50', border: 'border-green-200', text: 'text-green-700' };
  if (confidence >= 60) return { bg: 'bg-yellow-50', border: 'border-yellow-200', text: 'text-yellow-700' };
  if (confidence >= 40) return { bg: 'bg-orange-50', border: 'border-orange-200', text: 'text-orange-700' };
  return { bg: 'bg-red-50', border: 'border-red-200', text: 'text-red-700' };
};

export default {
  verifyReportCredibility,
  getCredibilityLevel,
  getCredibilityColor
};
