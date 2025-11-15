/**
 * Frontend Typhoon Test Data Generator
 * Generates realistic fake typhoon data without requiring backend
 */

/**
 * Generate realistic typhoon test data (client-side)
 */
export function generateTestTyphoonsLocal() {
  const testTyphoons = [];

  // Test Typhoon: UWAN (Usagi) - Recent November 2025 typhoon
  // Simulating its approach to Northern Luzon
  testTyphoons.push(generateTyphoon({
    id: 'test01',
    name: 'UWAN',
    category: 4,
    centerLat: 16.5,
    centerLon: 126.0,
    windSpeed: 130, // knots (Typhoon Cat 4)
    pressure: 950,
    movementDirection: 'WNW',
    trackLength: 10,
    forecastLength: 6
  }));

  return testTyphoons;
}

/**
 * Generate a single typhoon with track and forecast
 */
function generateTyphoon(config) {
  const {
    id,
    name,
    category,
    centerLat,
    centerLon,
    windSpeed,
    pressure,
    movementDirection,
    trackLength,
    forecastLength
  } = config;

  // Get movement vector
  const movement = getMovementVector(movementDirection);

  // Generate historical track (going backwards in time)
  const track = [];
  const now = new Date();

  for (let i = trackLength; i >= 0; i--) {
    const hoursAgo = i * 6; // 6-hour intervals
    const timestamp = new Date(now.getTime() - hoursAgo * 3600000);

    // Calculate position (going backwards)
    const lat = centerLat - (movement.lat * i * 0.5);
    const lon = centerLon - (movement.lon * i * 0.5);

    // Wind speed gradually increases as storm approaches current position
    const windFactor = 0.7 + (0.3 * (trackLength - i) / trackLength);
    const trackWindSpeed = Math.round(windSpeed * windFactor);
    const trackPressure = pressure + Math.round((1010 - pressure) * (i / trackLength) * 0.5);

    track.push({
      lat: parseFloat(lat.toFixed(2)),
      lon: parseFloat(lon.toFixed(2)),
      windSpeed: trackWindSpeed,
      windSpeedKmh: knotsToKmh(trackWindSpeed),
      pressure: trackPressure,
      timestamp: timestamp.toISOString(),
      type: getStormType(trackWindSpeed)
    });
  }

  // Generate forecast (going forward in time)
  const forecast = [];

  for (let i = 1; i <= forecastLength; i++) {
    const forecastHours = i * 12; // 12-hour intervals
    const timestamp = new Date(now.getTime() + forecastHours * 3600000);

    // Calculate future position
    const lat = centerLat + (movement.lat * i * 0.8);
    const lon = centerLon + (movement.lon * i * 0.8);

    // Wind speed gradually decreases or intensifies
    const intensityChange = category >= 3 ? -0.05 : 0.02; // Weaken if strong, intensify if weak
    const windFactor = 1 + (intensityChange * i);
    const forecastWindSpeed = Math.round(windSpeed * windFactor);
    const forecastPressure = pressure + Math.round((i * 5));

    forecast.push({
      lat: parseFloat(lat.toFixed(2)),
      lon: parseFloat(lon.toFixed(2)),
      windSpeed: forecastWindSpeed,
      windSpeedKmh: knotsToKmh(forecastWindSpeed),
      pressure: forecastPressure,
      forecastHour: forecastHours,
      timestamp: timestamp.toISOString()
    });
  }

  // Get current position (last track point)
  const currentPosition = track[track.length - 1];
  const categoryInfo = getStormCategory(windSpeed);

  // Check if near Philippines
  const isNearPhilippines =
    centerLat >= 5 && centerLat <= 25 &&
    centerLon >= 115 && centerLon <= 135;

  return {
    id: `wptest${id}2025`,
    name,
    year: 2025,
    basin: 'WP',
    current: {
      lat: centerLat,
      lon: centerLon,
      windSpeed: knotsToKmh(windSpeed),
      windSpeedKnots: windSpeed,
      pressure,
      category: categoryInfo.category,
      categoryName: categoryInfo.name,
      categoryColor: categoryInfo.color,
      timestamp: now.toISOString()
    },
    track,
    forecast,
    lastUpdate: now,
    isNearPhilippines,
    isTestData: true // Flag to indicate this is synthetic data
  };
}

/**
 * Get movement vector based on direction
 */
function getMovementVector(direction) {
  const vectors = {
    'N': { lat: 1, lon: 0 },
    'NE': { lat: 0.7, lon: 0.7 },
    'E': { lat: 0, lon: 1 },
    'SE': { lat: -0.7, lon: 0.7 },
    'S': { lat: -1, lon: 0 },
    'SW': { lat: -0.7, lon: -0.7 },
    'W': { lat: 0, lon: -1 },
    'NW': { lat: 0.7, lon: -0.7 },
    'WNW': { lat: 0.3, lon: -0.9 },
    'NNW': { lat: 0.9, lon: -0.3 },
    'ESE': { lat: -0.3, lon: 0.9 },
    'SSE': { lat: -0.9, lon: 0.3 }
  };

  return vectors[direction] || vectors['W'];
}

/**
 * Convert knots to km/h
 */
function knotsToKmh(knots) {
  return Math.round(knots * 1.852);
}

/**
 * Get storm type abbreviation based on wind speed
 */
function getStormType(windSpeedKnots) {
  const windSpeedMph = windSpeedKnots * 1.151;

  if (windSpeedMph >= 74) return 'TY'; // Typhoon
  if (windSpeedMph >= 39) return 'TS'; // Tropical Storm
  return 'TD'; // Tropical Depression
}

/**
 * Classify storm category based on wind speed
 */
function getStormCategory(windSpeedKnots) {
  const windSpeedMph = windSpeedKnots * 1.151;

  if (windSpeedMph >= 157) return { category: 5, name: 'Super Typhoon', color: '#8b0000' };
  if (windSpeedMph >= 130) return { category: 4, name: 'Typhoon', color: '#ff0000' };
  if (windSpeedMph >= 111) return { category: 3, name: 'Typhoon', color: '#ff8c00' };
  if (windSpeedMph >= 96) return { category: 2, name: 'Typhoon', color: '#ffa500' };
  if (windSpeedMph >= 74) return { category: 1, name: 'Typhoon', color: '#ffff00' };
  if (windSpeedMph >= 39) return { category: 0, name: 'Tropical Storm', color: '#00ff00' };
  return { category: -1, name: 'Tropical Depression', color: '#00ffff' };
}
