/**
 * Forecast Cone (Cone of Uncertainty) Utilities
 * Generates the cone polygon based on NOAA/NHC standards
 */

import { getConeRadius } from '../config/typhoonStyles';

/**
 * Calculate bearing between two geographic points (in degrees)
 * @param {Object} point1 - {lat, lon}
 * @param {Object} point2 - {lat, lon}
 * @returns {number} Bearing in degrees (0-360)
 */
export function calculateBearing(point1, point2) {
  const lat1 = point1.lat * Math.PI / 180;
  const lat2 = point2.lat * Math.PI / 180;
  const dLon = (point2.lon - point1.lon) * Math.PI / 180;

  const y = Math.sin(dLon) * Math.cos(lat2);
  const x = Math.cos(lat1) * Math.sin(lat2) -
            Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLon);

  const bearing = Math.atan2(y, x) * 180 / Math.PI;
  return (bearing + 360) % 360;
}

/**
 * Calculate destination point given starting point, distance, and bearing
 * @param {Object} point - {lat, lon}
 * @param {number} distanceKm - Distance in kilometers
 * @param {number} bearing - Bearing in degrees
 * @returns {Object} Destination point {lat, lon}
 */
export function calculateDestination(point, distanceKm, bearing) {
  const R = 6371; // Earth radius in km
  const lat1 = point.lat * Math.PI / 180;
  const lon1 = point.lon * Math.PI / 180;
  const bearingRad = bearing * Math.PI / 180;
  const d = distanceKm / R;

  const lat2 = Math.asin(
    Math.sin(lat1) * Math.cos(d) +
    Math.cos(lat1) * Math.sin(d) * Math.cos(bearingRad)
  );

  const lon2 = lon1 + Math.atan2(
    Math.sin(bearingRad) * Math.sin(d) * Math.cos(lat1),
    Math.cos(d) - Math.sin(lat1) * Math.sin(lat2)
  );

  return {
    lat: lat2 * 180 / Math.PI,
    lon: lon2 * 180 / Math.PI
  };
}

/**
 * Generate forecast cone polygon coordinates with proper widening
 * Creates a smooth meteorological-standard cone like PAGASA/NOAA
 * @param {Object} currentPosition - {lat, lon} - Current typhoon position
 * @param {Array} forecastPoints - Array of forecast points with {lat, lon, forecastHour}
 * @returns {Array} Array of [lat, lon] coordinates forming the cone polygon
 */
export function generateForecastCone(currentPosition, forecastPoints) {
  if (!forecastPoints || forecastPoints.length === 0) {
    return [];
  }

  const leftEdge = [];
  const rightEdge = [];

  // Calculate initial bearing from current position to first forecast point
  const initialBearing = calculateBearing(currentPosition, forecastPoints[0]);
  const initialRadius = 35; // Opening at tail position (35 km for better visibility)

  // Create opening at tail position
  const startLeft = calculateDestination(currentPosition, initialRadius, initialBearing - 90);
  const startRight = calculateDestination(currentPosition, initialRadius, initialBearing + 90);

  leftEdge.push([startLeft.lat, startLeft.lon]);
  rightEdge.push([startRight.lat, startRight.lon]);

  // Process each point to build widening cone
  forecastPoints.forEach((point, index) => {
    // Determine radius based on whether this is historical or forecast
    let radiusKm;

    if (point.forecastHour !== undefined) {
      // Forecast point - use standard error radii
      radiusKm = getConeRadius(point.forecastHour);
    } else {
      // Historical track point - use smaller, progressively growing radius
      // Start at 25km and grow to 50km at current position
      const historicalRatio = (index + 1) / forecastPoints.length;
      radiusKm = 25 + (historicalRatio * 25); // 25km to 50km
    }

    // Determine bearing for this segment
    let bearing;
    if (index < forecastPoints.length - 1) {
      // Use bearing to next point
      bearing = calculateBearing(point, forecastPoints[index + 1]);
    } else {
      // Last point: use bearing from previous point
      bearing = calculateBearing(
        index > 0 ? forecastPoints[index - 1] : currentPosition,
        point
      );
    }

    // Create perpendicular offset points
    const leftPoint = calculateDestination(point, radiusKm, bearing - 90);
    const rightPoint = calculateDestination(point, radiusKm, bearing + 90);

    leftEdge.push([leftPoint.lat, leftPoint.lon]);
    rightEdge.push([rightPoint.lat, rightPoint.lon]);
  });

  // Add rounded cap at the last point
  const lastPoint = forecastPoints[forecastPoints.length - 1];
  const lastBearing = calculateBearing(
    forecastPoints.length > 1 ? forecastPoints[forecastPoints.length - 2] : currentPosition,
    lastPoint
  );

  // Determine last radius (same logic as above)
  let lastRadius;
  if (lastPoint.forecastHour !== undefined) {
    lastRadius = getConeRadius(lastPoint.forecastHour);
  } else {
    // Historical point
    lastRadius = 50; // Max radius for historical track
  }

  // Generate semicircular cap (from right edge to left edge)
  const capPoints = [];
  const numCapPoints = 12;
  for (let i = 0; i <= numCapPoints; i++) {
    // Sweep from -90 degrees (right) to +90 degrees (left)
    const angle = lastBearing + 90 - (180 * i / numCapPoints);
    const capPoint = calculateDestination(lastPoint, lastRadius, angle);
    capPoints.push([capPoint.lat, capPoint.lon]);
  }

  // Construct the complete cone polygon
  // Order: current position → left edge → cap → right edge (reversed) → back to start
  const conePolygon = [
    [currentPosition.lat, currentPosition.lon],
    ...leftEdge,
    ...capPoints,
    ...rightEdge.reverse(),
    [currentPosition.lat, currentPosition.lon]
  ];

  return conePolygon;
}

/**
 * Generate discrete forecast circles at specific intervals (JTWC style)
 * @param {Array} forecastPoints - Array of forecast points
 * @returns {Array} Array of circle definitions {center, radius, forecastHour}
 */
export function generateForecastCircles(forecastPoints) {
  if (!forecastPoints || forecastPoints.length === 0) {
    return [];
  }

  const circles = [];
  const intervalHours = [24, 48, 72, 96, 120];

  forecastPoints.forEach(point => {
    const forecastHour = point.forecastHour;

    if (intervalHours.includes(forecastHour)) {
      const radiusKm = getConeRadius(forecastHour);

      circles.push({
        center: [point.lat, point.lon],
        radius: radiusKm * 1000, // Convert km to meters for Leaflet
        forecastHour: forecastHour,
        label: `${forecastHour}h`
      });
    }
  });

  return circles;
}

/**
 * Smooth cone edges using interpolation (makes cone look more professional)
 * @param {Array} conePoints - Raw cone polygon points
 * @param {number} smoothness - Number of interpolation points between each pair
 * @returns {Array} Smoothed cone polygon points
 */
export function smoothConeEdges(conePoints, smoothness = 5) {
  if (conePoints.length < 3) return conePoints;

  const smoothed = [];

  for (let i = 0; i < conePoints.length; i++) {
    const p1 = conePoints[i];
    const p2 = conePoints[(i + 1) % conePoints.length];

    smoothed.push(p1);

    // Add interpolated points using smoother curve
    for (let j = 1; j < smoothness; j++) {
      const t = j / smoothness;
      // Use ease-in-out for smoother transitions
      const smoothT = t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
      const lat = p1[0] + (p2[0] - p1[0]) * smoothT;
      const lon = p1[1] + (p2[1] - p1[1]) * smoothT;
      smoothed.push([lat, lon]);
    }
  }

  return smoothed;
}
