/**
 * Storm Detection Utilities
 * Helper functions for typhoon detection and threat assessment
 */

/**
 * Calculate distance between two coordinates using Haversine formula
 * @param {number} lat1 - Latitude of first point
 * @param {number} lon1 - Longitude of first point
 * @param {number} lat2 - Latitude of second point
 * @param {number} lon2 - Longitude of second point
 * @returns {number} Distance in kilometers
 */
export function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // Earth's radius in kilometers
  const dLat = toRadians(lat2 - lat1);
  const dLon = toRadians(lon2 - lon1);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;

  return Math.round(distance * 10) / 10; // Round to 1 decimal place
}

/**
 * Convert degrees to radians
 */
function toRadians(degrees) {
  return degrees * (Math.PI / 180);
}

/**
 * Determine if a storm is within monitoring radius
 * @param {number} distance - Distance in kilometers
 * @param {number} radius - Monitoring radius in kilometers
 * @returns {boolean}
 */
export function isWithinRadius(distance, radius) {
  return distance <= radius;
}

/**
 * Get threat level based on distance and storm intensity
 * @param {number} distance - Distance from location in km
 * @param {number} windSpeed - Wind speed in km/h
 * @returns {string} Threat level: CRITICAL, HIGH, MODERATE, LOW, MINIMAL
 */
export function getThreatLevel(distance, windSpeed = 0) {
  if (distance <= 200) {
    return 'CRITICAL';
  } else if (distance <= 500) {
    return windSpeed >= 150 ? 'CRITICAL' : windSpeed >= 100 ? 'HIGH' : 'MODERATE';
  } else if (distance <= 800) {
    return windSpeed >= 150 ? 'HIGH' : 'MODERATE';
  } else if (distance <= 1200) {
    return 'LOW';
  }
  return 'MINIMAL';
}

/**
 * Get threat level color for UI
 */
export function getThreatColor(threatLevel) {
  const colors = {
    CRITICAL: '#DC2626', // red-600
    HIGH: '#EA580C',     // orange-600
    MODERATE: '#F59E0B', // amber-500
    LOW: '#3B82F6',      // blue-500
    MINIMAL: '#6B7280',  // gray-500
    NONE: '#10B981'      // green-500
  };
  return colors[threatLevel] || colors.MINIMAL;
}

/**
 * Get threat level badge color classes
 */
export function getThreatBadgeClass(threatLevel) {
  const classes = {
    CRITICAL: 'bg-red-100 text-red-800 border-red-300',
    HIGH: 'bg-orange-100 text-orange-800 border-orange-300',
    MODERATE: 'bg-yellow-100 text-yellow-800 border-yellow-300',
    LOW: 'bg-blue-100 text-blue-800 border-blue-300',
    MINIMAL: 'bg-gray-100 text-gray-800 border-gray-300',
    NONE: 'bg-green-100 text-green-800 border-green-300'
  };
  return classes[threatLevel] || classes.MINIMAL;
}

/**
 * Format distance for display
 * @param {number} distance - Distance in kilometers
 * @returns {string} Formatted distance string
 */
export function formatDistance(distance) {
  if (distance < 1) {
    return `${Math.round(distance * 1000)}m`;
  } else if (distance < 100) {
    return `${distance.toFixed(1)}km`;
  }
  return `${Math.round(distance)}km`;
}

/**
 * Calculate ETA based on storm movement
 * @param {number} distance - Distance in kilometers
 * @param {number} speed - Storm movement speed in km/h
 * @returns {string} ETA description
 */
export function calculateETA(distance, speed) {
  if (!speed || speed === 0) return 'Unknown';

  const hours = distance / speed;

  if (hours < 1) {
    return `${Math.round(hours * 60)} minutes`;
  } else if (hours < 24) {
    return `${Math.round(hours)} hours`;
  } else {
    const days = Math.floor(hours / 24);
    const remainingHours = Math.round(hours % 24);
    return `${days} day${days > 1 ? 's' : ''}${remainingHours > 0 ? ` ${remainingHours}h` : ''}`;
  }
}

/**
 * Determine if storm is approaching or moving away
 * @param {object} currentPosition - Current position {lat, lng}
 * @param {object} forecastPosition - Forecast position {lat, lng}
 * @param {object} targetLocation - Target location {lat, lng}
 * @returns {string} 'APPROACHING', 'RECEDING', or 'STATIONARY'
 */
export function getStormDirection(currentPosition, forecastPosition, targetLocation) {
  if (!forecastPosition) return 'STATIONARY';

  const currentDistance = calculateDistance(
    currentPosition.lat,
    currentPosition.lng,
    targetLocation.lat,
    targetLocation.lng
  );

  const forecastDistance = calculateDistance(
    forecastPosition.lat,
    forecastPosition.lng,
    targetLocation.lat,
    targetLocation.lng
  );

  const difference = forecastDistance - currentDistance;

  if (Math.abs(difference) < 10) return 'STATIONARY';
  return difference < 0 ? 'APPROACHING' : 'RECEDING';
}

/**
 * Calculate bearing from one point to another
 * @returns {number} Bearing in degrees (0-360)
 */
export function calculateBearing(lat1, lon1, lat2, lon2) {
  const dLon = toRadians(lon2 - lon1);
  const y = Math.sin(dLon) * Math.cos(toRadians(lat2));
  const x = Math.cos(toRadians(lat1)) * Math.sin(toRadians(lat2)) -
    Math.sin(toRadians(lat1)) * Math.cos(toRadians(lat2)) * Math.cos(dLon);

  let bearing = Math.atan2(y, x);
  bearing = bearing * (180 / Math.PI);
  bearing = (bearing + 360) % 360;

  return Math.round(bearing);
}

/**
 * Get compass direction from bearing
 * @param {number} bearing - Bearing in degrees
 * @returns {string} Compass direction (N, NE, E, SE, S, SW, W, NW)
 */
export function getCompassDirection(bearing) {
  const directions = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
  const index = Math.round(bearing / 45) % 8;
  return directions[index];
}

/**
 * Check if any forecast point is within the critical radius
 * @param {array} forecastTrack - Array of forecast positions
 * @param {object} targetLocation - Target location {lat, lng}
 * @param {number} criticalRadius - Critical radius in km
 * @returns {object|null} First forecast point within radius, or null
 */
export function findCriticalForecast(forecastTrack, targetLocation, criticalRadius = 200) {
  if (!forecastTrack || forecastTrack.length === 0) return null;

  for (const forecast of forecastTrack) {
    const distance = calculateDistance(
      forecast.lat,
      forecast.lng,
      targetLocation.lat,
      targetLocation.lng
    );

    if (distance <= criticalRadius) {
      return {
        ...forecast,
        distance,
        threatLevel: getThreatLevel(distance)
      };
    }
  }

  return null;
}

/**
 * Get alert message based on threat level
 */
export function getAlertMessage(threatLevel, stormName, distance) {
  const messages = {
    CRITICAL: `⚠️ CRITICAL ALERT: Typhoon ${stormName} is ${formatDistance(distance)} away. Immediate action required!`,
    HIGH: `⚠️ HIGH ALERT: Typhoon ${stormName} is ${formatDistance(distance)} away. Prepare for severe weather.`,
    MODERATE: `⚠️ WEATHER ALERT: Typhoon ${stormName} is ${formatDistance(distance)} away. Monitor closely.`,
    LOW: `ℹ️ ADVISORY: Typhoon ${stormName} is ${formatDistance(distance)} away. Stay informed.`,
    MINIMAL: `ℹ️ Typhoon ${stormName} detected ${formatDistance(distance)} away.`
  };
  return messages[threatLevel] || messages.MINIMAL;
}
