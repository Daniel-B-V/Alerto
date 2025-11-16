const axios = require('axios');

/**
 * Multi-Model Typhoon Forecast Service
 * Integrates multiple forecast models for ensemble predictions
 * - NOAA ATCF (Automated Tropical Cyclone Forecasting)
 * - JTWC (Joint Typhoon Warning Center)
 * - Provides consensus forecast and uncertainty ranges
 */

// Data sources
const JTWC_URL = 'https://www.metoc.navy.mil/jtwc/products';
const ATCF_BASE_URL = 'https://ftp.nhc.noaa.gov/atcf';
const ATCF_FORECAST_URL = `${ATCF_BASE_URL}/aid_public`;

// Cache for ensemble forecasts
let ensembleCache = {
  data: null,
  lastFetch: null,
  cacheDuration: 15 * 60 * 1000 // 15 minutes
};

/**
 * Parse ATCF aid_public format for model forecasts
 * Contains predictions from multiple forecasting agencies
 */
function parseATCFForecastLine(line) {
  const parts = line.split(',').map(s => s.trim());

  if (parts.length < 12) return null;

  return {
    basin: parts[0],
    cycloneNumber: parts[1],
    timestamp: parts[2],
    technique: parts[4], // Forecasting model name (e.g., OFCL, JTWC, ECMWF)
    forecastHour: parseInt(parts[5]) || 0,
    latitude: parseLatitude(parts[6]),
    longitude: parseLongitude(parts[7]),
    windSpeed: parseInt(parts[8]) || 0, // knots
    pressure: parseInt(parts[9]) || 0, // mb
    stormType: parts[10]
  };
}

/**
 * Parse latitude from ATCF format
 */
function parseLatitude(lat) {
  if (!lat) return 0;
  const value = parseInt(lat) / 10;
  return lat.includes('S') ? -value : value;
}

/**
 * Parse longitude from ATCF format
 */
function parseLongitude(lon) {
  if (!lon) return 0;
  const value = parseInt(lon) / 10;
  return lon.includes('W') ? -value : value;
}

/**
 * Convert knots to km/h
 */
function knotsToKmh(knots) {
  return Math.round(knots * 1.852);
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
 * Get ensemble forecast for a specific typhoon
 * Combines multiple models: OFCL (official), JTWC, ECMWF, GFS, etc.
 */
async function getEnsembleForecast(typhoonId) {
  try {
    // Extract basin and storm number from ID (e.g., "wp012025")
    const basin = typhoonId.substring(0, 2);
    const stormNum = typhoonId.substring(2, 4);
    const year = typhoonId.substring(4);

    const filename = `a${basin}${stormNum}${year}.dat`;
    const url = `${ATCF_FORECAST_URL}/${filename}`;

    console.log(`🔄 Fetching ensemble forecast from: ${url}`);

    const response = await axios.get(url, { timeout: 10000 });

    if (!response.data) {
      return { error: 'No forecast data available' };
    }

    const lines = response.data.split('\n').filter(line => line.trim());
    const allForecasts = lines.map(parseATCFForecastLine).filter(f => f !== null);

    // Group forecasts by model/technique
    const modelForecasts = {};

    allForecasts.forEach(forecast => {
      const model = forecast.technique;

      if (!modelForecasts[model]) {
        modelForecasts[model] = [];
      }

      modelForecasts[model].push({
        forecastHour: forecast.forecastHour,
        lat: forecast.latitude,
        lon: forecast.longitude,
        windSpeed: forecast.windSpeed,
        windSpeedKmh: knotsToKmh(forecast.windSpeed),
        pressure: forecast.pressure,
        timestamp: parseATCFTimestamp(forecast.timestamp)
      });
    });

    // Calculate consensus forecast (average of all models)
    const consensusForecast = calculateConsensus(modelForecasts);

    // Calculate uncertainty (spread between models)
    const uncertainty = calculateUncertainty(modelForecasts);

    return {
      typhoonId,
      models: modelForecasts,
      consensus: consensusForecast,
      uncertainty: uncertainty,
      modelCount: Object.keys(modelForecasts).length,
      lastUpdate: new Date().toISOString()
    };

  } catch (error) {
    console.error(`Error fetching ensemble forecast for ${typhoonId}:`, error.message);
    return { error: 'Failed to fetch ensemble forecast' };
  }
}

/**
 * Calculate consensus forecast by averaging all model predictions
 */
function calculateConsensus(modelForecasts) {
  const forecastHours = new Set();

  // Get all unique forecast hours
  Object.values(modelForecasts).forEach(forecasts => {
    forecasts.forEach(f => forecastHours.add(f.forecastHour));
  });

  const consensus = [];

  // For each forecast hour, calculate average position and intensity
  Array.from(forecastHours).sort((a, b) => a - b).forEach(hour => {
    const forecastsAtHour = [];

    Object.values(modelForecasts).forEach(forecasts => {
      const forecast = forecasts.find(f => f.forecastHour === hour);
      if (forecast) forecastsAtHour.push(forecast);
    });

    if (forecastsAtHour.length === 0) return;

    // Calculate average
    const avgLat = forecastsAtHour.reduce((sum, f) => sum + f.lat, 0) / forecastsAtHour.length;
    const avgLon = forecastsAtHour.reduce((sum, f) => sum + f.lon, 0) / forecastsAtHour.length;
    const avgWind = forecastsAtHour.reduce((sum, f) => sum + f.windSpeed, 0) / forecastsAtHour.length;
    const avgPressure = forecastsAtHour.reduce((sum, f) => sum + f.pressure, 0) / forecastsAtHour.length;

    consensus.push({
      forecastHour: hour,
      lat: avgLat,
      lon: avgLon,
      windSpeed: Math.round(avgWind),
      windSpeedKmh: knotsToKmh(Math.round(avgWind)),
      pressure: Math.round(avgPressure),
      modelCount: forecastsAtHour.length
    });
  });

  return consensus;
}

/**
 * Calculate forecast uncertainty (spread between models)
 * Returns confidence intervals and spread metrics
 */
function calculateUncertainty(modelForecasts) {
  const forecastHours = new Set();

  Object.values(modelForecasts).forEach(forecasts => {
    forecasts.forEach(f => forecastHours.add(f.forecastHour));
  });

  const uncertainty = [];

  Array.from(forecastHours).sort((a, b) => a - b).forEach(hour => {
    const forecastsAtHour = [];

    Object.values(modelForecasts).forEach(forecasts => {
      const forecast = forecasts.find(f => f.forecastHour === hour);
      if (forecast) forecastsAtHour.push(forecast);
    });

    if (forecastsAtHour.length < 2) return;

    // Calculate standard deviation for position
    const avgLat = forecastsAtHour.reduce((sum, f) => sum + f.lat, 0) / forecastsAtHour.length;
    const avgLon = forecastsAtHour.reduce((sum, f) => sum + f.lon, 0) / forecastsAtHour.length;

    const latVariance = forecastsAtHour.reduce((sum, f) => sum + Math.pow(f.lat - avgLat, 2), 0) / forecastsAtHour.length;
    const lonVariance = forecastsAtHour.reduce((sum, f) => sum + Math.pow(f.lon - avgLon, 2), 0) / forecastsAtHour.length;

    const latStdDev = Math.sqrt(latVariance);
    const lonStdDev = Math.sqrt(lonVariance);

    // Calculate position uncertainty in km (rough approximation)
    const positionUncertaintyKm = Math.sqrt(
      Math.pow(latStdDev * 111, 2) +
      Math.pow(lonStdDev * 111 * Math.cos(avgLat * Math.PI / 180), 2)
    );

    // Calculate min/max bounds
    const minLat = Math.min(...forecastsAtHour.map(f => f.lat));
    const maxLat = Math.max(...forecastsAtHour.map(f => f.lat));
    const minLon = Math.min(...forecastsAtHour.map(f => f.lon));
    const maxLon = Math.max(...forecastsAtHour.map(f => f.lon));

    uncertainty.push({
      forecastHour: hour,
      positionUncertaintyKm: Math.round(positionUncertaintyKm),
      latStdDev: latStdDev,
      lonStdDev: lonStdDev,
      bounds: {
        minLat, maxLat, minLon, maxLon
      },
      confidenceLevel: calculateConfidence(forecastsAtHour.length, positionUncertaintyKm)
    });
  });

  return uncertainty;
}

/**
 * Calculate confidence level based on model agreement
 */
function calculateConfidence(modelCount, uncertaintyKm) {
  if (modelCount >= 8 && uncertaintyKm < 50) return 'very-high';
  if (modelCount >= 6 && uncertaintyKm < 100) return 'high';
  if (modelCount >= 4 && uncertaintyKm < 150) return 'medium';
  if (modelCount >= 2 && uncertaintyKm < 200) return 'low';
  return 'very-low';
}

/**
 * Get spaghetti plot data (all models overlaid)
 */
async function getSpaghettiPlot(typhoonId) {
  try {
    const ensembleData = await getEnsembleForecast(typhoonId);

    if (ensembleData.error) {
      return { error: ensembleData.error };
    }

    // Format for visualization
    const spaghettiData = {
      typhoonId,
      models: [],
      consensus: ensembleData.consensus
    };

    Object.entries(ensembleData.models).forEach(([modelName, forecasts]) => {
      spaghettiData.models.push({
        name: modelName,
        track: forecasts.map(f => ({
          lat: f.lat,
          lon: f.lon,
          forecastHour: f.forecastHour,
          windSpeed: f.windSpeedKmh
        }))
      });
    });

    return spaghettiData;

  } catch (error) {
    console.error('Error generating spaghetti plot:', error);
    return { error: 'Failed to generate spaghetti plot' };
  }
}

/**
 * Get model names and descriptions
 */
function getModelInfo() {
  return {
    OFCL: { name: 'Official Forecast', agency: 'NOAA/NHC', color: '#ff0000' },
    JTWC: { name: 'Joint Typhoon Warning', agency: 'US Navy/Air Force', color: '#0000ff' },
    ECMWF: { name: 'European Model', agency: 'ECMWF', color: '#00aa00' },
    GFS: { name: 'Global Forecast System', agency: 'NOAA', color: '#ff8c00' },
    HWRF: { name: 'Hurricane Weather Research', agency: 'NOAA', color: '#9400d3' },
    UKMET: { name: 'UK Met Office', agency: 'UK Met Office', color: '#1e90ff' },
    CMC: { name: 'Canadian Model', agency: 'Environment Canada', color: '#ff1493' },
    NVGM: { name: 'Navy Model', agency: 'US Navy', color: '#008b8b' }
  };
}

/**
 * Clear ensemble cache
 */
function clearEnsembleCache() {
  ensembleCache.data = null;
  ensembleCache.lastFetch = null;
  console.log('🗑️ Ensemble forecast cache cleared');
}

module.exports = {
  getEnsembleForecast,
  getSpaghettiPlot,
  getModelInfo,
  clearEnsembleCache
};
