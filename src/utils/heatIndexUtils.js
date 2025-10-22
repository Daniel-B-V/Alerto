/**
 * Heat Index Calculation Utilities
 * Based on DOST-PAGASA Heat Index Guidelines for the Philippines
 */

/**
 * Calculate Heat Index using the Steadman formula
 * @param {number} temperature - Temperature in Celsius
 * @param {number} humidity - Relative humidity in percentage
 * @returns {number} Heat index in Celsius
 */
export const calculateHeatIndex = (temperature, humidity) => {
  // Convert to Fahrenheit for calculation
  const T = (temperature * 9/5) + 32;
  const RH = humidity;

  // Simplified Heat Index formula
  let HI = 0.5 * (T + 61.0 + ((T - 68.0) * 1.2) + (RH * 0.094));

  // If heat index is above 80°F, use the full Rothfusz regression
  if (HI >= 80) {
    HI = -42.379 +
         2.04901523 * T +
         10.14333127 * RH -
         0.22475541 * T * RH -
         0.00683783 * T * T -
         0.05481717 * RH * RH +
         0.00122874 * T * T * RH +
         0.00085282 * T * RH * RH -
         0.00000199 * T * T * RH * RH;

    // Adjustments for extreme conditions
    if (RH < 13 && T >= 80 && T <= 112) {
      HI -= ((13 - RH) / 4) * Math.sqrt((17 - Math.abs(T - 95)) / 17);
    } else if (RH > 85 && T >= 80 && T <= 87) {
      HI += ((RH - 85) / 10) * ((87 - T) / 5);
    }
  }

  // Convert back to Celsius
  return Math.round((HI - 32) * 5/9);
};

/**
 * Get heat index category based on DOST-PAGASA standards
 * @param {number} heatIndex - Heat index in Celsius
 * @returns {object} Category information with level, label, color, and description
 */
export const getHeatIndexCategory = (heatIndex) => {
  if (heatIndex >= 52) {
    return {
      level: 'extreme-danger',
      label: 'Extreme Danger',
      color: '#8B0000', // Dark red
      bgColor: '#FEE2E2',
      textColor: '#991B1B',
      icon: '🔥',
      description: 'Heat stroke imminent! Avoid outdoor activities.',
      recommendation: 'Stay indoors in air-conditioned areas. Emergency measures required.',
      suspensionRecommended: true,
      suspensionReason: 'Extreme heat index poses severe health risks'
    };
  } else if (heatIndex >= 42) {
    return {
      level: 'danger',
      label: 'Danger',
      color: '#DC2626', // Red
      bgColor: '#FEE2E2',
      textColor: '#991B1B',
      icon: '🌡️',
      description: 'Heat cramps and heat exhaustion likely. Heat stroke possible.',
      recommendation: 'Minimize outdoor exposure. Stay hydrated and in shaded areas.',
      suspensionRecommended: true,
      suspensionReason: 'Dangerous heat index - health risks to students and teachers'
    };
  } else if (heatIndex >= 33) {
    return {
      level: 'extreme-caution',
      label: 'Extreme Caution',
      color: '#F59E0B', // Orange
      bgColor: '#FEF3C7',
      textColor: '#92400E',
      icon: '⚠️',
      description: 'Heat cramps and heat exhaustion possible.',
      recommendation: 'Limit outdoor activities. Drink plenty of water.',
      suspensionRecommended: false,
      suspensionReason: null
    };
  } else if (heatIndex >= 27) {
    return {
      level: 'caution',
      label: 'Caution',
      color: '#EAB308', // Yellow
      bgColor: '#FEF9C3',
      textColor: '#854D0E',
      icon: '☀️',
      description: 'Fatigue possible with prolonged exposure.',
      recommendation: 'Take breaks and stay hydrated during outdoor activities.',
      suspensionRecommended: false,
      suspensionReason: null
    };
  } else {
    return {
      level: 'normal',
      label: 'Normal',
      color: '#10B981', // Green
      bgColor: '#D1FAE5',
      textColor: '#065F46',
      icon: '✅',
      description: 'No significant heat-related health risks.',
      recommendation: 'Normal activities safe. Stay hydrated as usual.',
      suspensionRecommended: false,
      suspensionReason: null
    };
  }
};

/**
 * Check if heat index warrants a class suspension
 * @param {number} heatIndex - Heat index in Celsius
 * @returns {boolean} Whether suspension is recommended
 */
export const shouldSuspendForHeat = (heatIndex) => {
  const category = getHeatIndexCategory(heatIndex);
  return category.suspensionRecommended;
};

/**
 * Get heat index advisory message
 * @param {number} heatIndex - Heat index in Celsius
 * @returns {string} Advisory message
 */
export const getHeatIndexAdvisory = (heatIndex) => {
  const category = getHeatIndexCategory(heatIndex);
  return `${category.icon} ${category.label}: ${category.description}`;
};

/**
 * Calculate feels like temperature (simplified version)
 * @param {number} temperature - Temperature in Celsius
 * @param {number} humidity - Relative humidity in percentage
 * @param {number} windSpeed - Wind speed in km/h
 * @returns {number} Feels like temperature in Celsius
 */
export const calculateFeelsLike = (temperature, humidity, windSpeed = 0) => {
  // For hot weather, use heat index
  if (temperature >= 27) {
    return calculateHeatIndex(temperature, humidity);
  }

  // For cooler weather, consider wind chill
  if (temperature < 10 && windSpeed > 5) {
    const windSpeedMph = windSpeed * 0.621371; // Convert to mph
    const tempF = (temperature * 9/5) + 32;
    const windChill = 35.74 + (0.6215 * tempF) - (35.75 * Math.pow(windSpeedMph, 0.16)) +
                      (0.4275 * tempF * Math.pow(windSpeedMph, 0.16));
    return Math.round((windChill - 32) * 5/9);
  }

  // Otherwise, just return temperature
  return temperature;
};

/**
 * Get heat index color for visual indicators
 * @param {number} heatIndex - Heat index in Celsius
 * @returns {string} Color hex code
 */
export const getHeatIndexColor = (heatIndex) => {
  const category = getHeatIndexCategory(heatIndex);
  return category.color;
};

/**
 * Format heat index display with category
 * @param {number} heatIndex - Heat index in Celsius
 * @returns {object} Formatted display object
 */
export const formatHeatIndexDisplay = (heatIndex) => {
  const category = getHeatIndexCategory(heatIndex);
  return {
    value: `${heatIndex}°C`,
    category: category.label,
    icon: category.icon,
    color: category.color,
    description: category.description,
    recommendation: category.recommendation
  };
};

/**
 * Check if current time is peak heat hours
 * @returns {boolean} Whether it's currently peak heat time
 */
export const isPeakHeatTime = () => {
  const hour = new Date().getHours();
  // Peak heat typically 11 AM - 3 PM in Philippines
  return hour >= 11 && hour <= 15;
};

/**
 * Get heat safety tips based on heat index
 * @param {number} heatIndex - Heat index in Celsius
 * @returns {array} Array of safety tips
 */
export const getHeatSafetyTips = (heatIndex) => {
  const category = getHeatIndexCategory(heatIndex);

  const commonTips = [
    '💧 Drink plenty of water even if not thirsty',
    '👕 Wear light-colored, loose-fitting clothing',
    '🏠 Stay in shaded or air-conditioned areas when possible'
  ];

  const dangerTips = [
    '🚫 Avoid strenuous outdoor activities',
    '⏰ Reschedule outdoor work to cooler hours',
    '👶 Check on elderly and children frequently',
    '🚗 Never leave anyone in a parked vehicle',
    '🏥 Know the signs of heat exhaustion and heat stroke'
  ];

  if (heatIndex >= 42) {
    return [...commonTips, ...dangerTips, '🚨 Seek immediate medical help if feeling dizzy or nauseous'];
  } else if (heatIndex >= 33) {
    return [...commonTips, ...dangerTips];
  } else if (heatIndex >= 27) {
    return [...commonTips, '⏰ Take frequent breaks during outdoor activities'];
  }

  return commonTips;
};

/**
 * Calculate average heat index for multiple cities
 * @param {array} weatherData - Array of weather data objects
 * @returns {number} Average heat index
 */
export const calculateAverageHeatIndex = (weatherData) => {
  if (!weatherData || weatherData.length === 0) return 0;

  const heatIndexes = weatherData
    .filter(data => data.current?.temperature && data.current?.humidity)
    .map(data => calculateHeatIndex(data.current.temperature, data.current.humidity));

  if (heatIndexes.length === 0) return 0;

  return Math.round(heatIndexes.reduce((sum, hi) => sum + hi, 0) / heatIndexes.length);
};

/**
 * Get cities with dangerous heat index
 * @param {array} weatherData - Array of weather data objects
 * @returns {array} Cities with dangerous heat levels
 */
export const getCitiesWithDangerousHeat = (weatherData) => {
  if (!weatherData || weatherData.length === 0) return [];

  return weatherData
    .filter(data => data.current?.temperature && data.current?.humidity)
    .map(data => ({
      city: data.location?.city,
      temperature: data.current.temperature,
      humidity: data.current.humidity,
      heatIndex: calculateHeatIndex(data.current.temperature, data.current.humidity),
      category: getHeatIndexCategory(calculateHeatIndex(data.current.temperature, data.current.humidity))
    }))
    .filter(city => city.category.suspensionRecommended)
    .sort((a, b) => b.heatIndex - a.heatIndex);
};

export default {
  calculateHeatIndex,
  getHeatIndexCategory,
  shouldSuspendForHeat,
  getHeatIndexAdvisory,
  calculateFeelsLike,
  getHeatIndexColor,
  formatHeatIndexDisplay,
  isPeakHeatTime,
  getHeatSafetyTips,
  calculateAverageHeatIndex,
  getCitiesWithDangerousHeat
};
