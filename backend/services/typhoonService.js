const axios = require('axios');

/**
 * Typhoon Service
 * Fetches and parses ATCF (Automated Tropical Cyclone Forecasting) data from NOAA
 * Data source: ftp://ftp.nhc.noaa.gov/atcf/
 */

// HTTP mirrors for ATCF data (more accessible than FTP)
const ATCF_BASE_URL = 'https://ftp.nhc.noaa.gov/atcf';
const ATCF_BEST_TRACK_URL = `${ATCF_BASE_URL}/btk`;
const ATCF_FORECAST_URL = `${ATCF_BASE_URL}/aid_public`;

// Western Pacific basin code (covers Philippines)
const WP_BASIN = 'wp';

// Cache to reduce API calls
let typhoonCache = {
  data: null,
  lastFetch: null,
  cacheDuration: 10 * 60 * 1000 // 10 minutes
};

/**
 * Parse ATCF b-deck (best track) data format
 * Format: BASIN, CY, YYYYMMDDHH, TECHNUM/MIN, TECH, TAU, LAT, LON, VMAX, MSLP, TY, RAD, WINDCODE, ...
 */
function parseATCFLine(line) {
  const parts = line.split(',').map(s => s.trim());

  if (parts.length < 11) return null;

  return {
    basin: parts[0],
    cycloneNumber: parts[1],
    timestamp: parts[2],
    technique: parts[4],
    forecastHour: parseInt(parts[5]) || 0,
    latitude: parseLatitude(parts[6]),
    longitude: parseLongitude(parts[7]),
    windSpeed: parseInt(parts[8]) || 0, // knots
    pressure: parseInt(parts[9]) || 0, // mb
    stormType: parts[10]
  };
}

/**
 * Parse latitude from ATCF format (e.g., "145N" = 14.5°N)
 */
function parseLatitude(lat) {
  if (!lat) return 0;
  const value = parseInt(lat) / 10;
  return lat.includes('S') ? -value : value;
}

/**
 * Parse longitude from ATCF format (e.g., "1205E" = 120.5°E)
 */
function parseLongitude(lon) {
  if (!lon) return 0;
  const value = parseInt(lon) / 10;
  return lon.includes('W') ? -value : value;
}

/**
 * Classify storm category based on wind speed (Saffir-Simpson scale)
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

/**
 * Convert knots to km/h
 */
function knotsToKmh(knots) {
  return Math.round(knots * 1.852);
}

/**
 * Fetch active typhoons in Western Pacific
 */
async function getActiveTyphoons() {
  try {
    // Check cache
    if (typhoonCache.data &&
        typhoonCache.lastFetch &&
        Date.now() - typhoonCache.lastFetch < typhoonCache.cacheDuration) {
      console.log('📦 Returning cached typhoon data');
      return typhoonCache.data;
    }

    console.log('🌀 Fetching active typhoons from ATCF...');

    // Get current year
    const currentYear = new Date().getFullYear();

    // Try to fetch active storms (usually numbered sequentially)
    const activeTyphoons = [];

    // Try storms 01-30 for current year (most years have fewer than 30 storms)
    const maxStorms = 30;
    const fetchPromises = [];

    for (let i = 1; i <= maxStorms; i++) {
      const stormNum = String(i).padStart(2, '0');
      const filename = `b${WP_BASIN}${stormNum}${currentYear}.dat`;
      fetchPromises.push(
        fetchStormData(filename, stormNum, currentYear)
          .catch(err => null) // Ignore errors for non-existent storms
      );
    }

    const results = await Promise.all(fetchPromises);
    const validStorms = results.filter(storm => storm !== null);

    // Filter for recent/active storms (within last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const recentStorms = validStorms.filter(storm => {
      if (!storm.lastUpdate) return false;
      return storm.lastUpdate >= sevenDaysAgo;
    });

    console.log(`✅ Found ${recentStorms.length} recent typhoons`);

    // Cache the results
    typhoonCache.data = recentStorms;
    typhoonCache.lastFetch = Date.now();

    return recentStorms;
  } catch (error) {
    console.error('❌ Error fetching typhoons:', error.message);

    // Return cached data if available, even if expired
    if (typhoonCache.data) {
      console.log('⚠️ Returning stale cached data due to error');
      return typhoonCache.data;
    }

    return [];
  }
}

/**
 * Fetch individual storm data
 */
async function fetchStormData(filename, stormNum, year) {
  try {
    const url = `${ATCF_BEST_TRACK_URL}/${filename}`;
    const response = await axios.get(url, { timeout: 5000 });

    if (!response.data) return null;

    const lines = response.data.split('\n').filter(line => line.trim());
    if (lines.length === 0) return null;

    const trackPoints = [];
    const forecastPoints = [];
    let stormName = null;
    let lastObservation = null;

    for (const line of lines) {
      const point = parseATCFLine(line);
      if (!point) continue;

      // Extract storm name from technique field
      if (!stormName && point.technique && point.technique !== 'CARQ') {
        stormName = point.technique;
      }

      if (point.forecastHour === 0) {
        // Historical/current position
        trackPoints.push({
          lat: point.latitude,
          lon: point.longitude,
          windSpeed: point.windSpeed,
          windSpeedKmh: knotsToKmh(point.windSpeed),
          pressure: point.pressure,
          timestamp: parseATCFTimestamp(point.timestamp),
          type: point.stormType
        });
        lastObservation = point;
      } else {
        // Forecast position
        forecastPoints.push({
          lat: point.latitude,
          lon: point.longitude,
          windSpeed: point.windSpeed,
          windSpeedKmh: knotsToKmh(point.windSpeed),
          pressure: point.pressure,
          forecastHour: point.forecastHour,
          timestamp: parseATCFTimestamp(point.timestamp)
        });
      }
    }

    if (trackPoints.length === 0) return null;

    // Get the most recent position
    const currentPosition = trackPoints[trackPoints.length - 1];
    const category = getStormCategory(currentPosition.windSpeed);

    // Check if storm is near Philippines (5-25°N, 115-135°E)
    const isNearPhilippines =
      currentPosition.lat >= 5 && currentPosition.lat <= 25 &&
      currentPosition.lon >= 115 && currentPosition.lon <= 135;

    return {
      id: `${WP_BASIN}${stormNum}${year}`,
      name: stormName || `WP${stormNum}`,
      year,
      basin: WP_BASIN.toUpperCase(),
      current: {
        lat: currentPosition.lat,
        lon: currentPosition.lon,
        windSpeed: currentPosition.windSpeedKmh,
        windSpeedKnots: currentPosition.windSpeed,
        pressure: currentPosition.pressure,
        category: category.category,
        categoryName: category.name,
        categoryColor: category.color,
        timestamp: currentPosition.timestamp
      },
      track: trackPoints,
      forecast: forecastPoints.sort((a, b) => a.forecastHour - b.forecastHour),
      lastUpdate: currentPosition.timestamp,
      isNearPhilippines
    };
  } catch (error) {
    // Storm file doesn't exist or other error
    return null;
  }
}

/**
 * Parse ATCF timestamp (YYYYMMDDHH) to Date object
 */
function parseATCFTimestamp(timestamp) {
  if (!timestamp || timestamp.length < 10) return new Date();

  const year = timestamp.substring(0, 4);
  const month = timestamp.substring(4, 6);
  const day = timestamp.substring(6, 8);
  const hour = timestamp.substring(8, 10);

  return new Date(`${year}-${month}-${day}T${hour}:00:00Z`);
}

/**
 * Get detailed information for a specific typhoon
 */
async function getTyphoonDetails(typhoonId) {
  try {
    const filename = `b${typhoonId}.dat`;
    const response = await axios.get(`${ATCF_BEST_TRACK_URL}/${filename}`);

    if (!response.data) {
      return { error: 'Typhoon data not found' };
    }

    // Parse the data (similar to getActiveTyphoons but for single storm)
    const lines = response.data.split('\n').filter(line => line.trim());
    const trackPoints = lines.map(parseATCFLine).filter(p => p !== null);

    return {
      id: typhoonId,
      track: trackPoints
    };
  } catch (error) {
    console.error(`Error fetching typhoon ${typhoonId}:`, error.message);
    return { error: 'Failed to fetch typhoon details' };
  }
}

/**
 * Clear cache (useful for testing)
 */
function clearCache() {
  typhoonCache.data = null;
  typhoonCache.lastFetch = null;
  console.log('🗑️ Typhoon cache cleared');
}

module.exports = {
  getActiveTyphoons,
  getTyphoonDetails,
  clearCache
};
