// PAGASA Rainfall Forecast Service
// Fetches rainfall forecast data from PAGASA via backend proxy

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

/**
 * Batangas Province key locations with coordinates
 */
const BATANGAS_LOCATIONS = {
  'Batangas City': { lat: 13.7565, lon: 121.0583 },
  'Lipa City': { lat: 13.9411, lon: 121.1650 },
  'Tanauan City': { lat: 14.0859, lon: 121.1498 },
  'Santo Tomas': { lat: 14.1078, lon: 121.1414 },
  'Taal': { lat: 13.8833, lon: 120.9333 },
  'Balayan': { lat: 13.9389, lon: 120.7331 },
  'Nasugbu': { lat: 14.0678, lon: 120.6308 },
  'Lemery': { lat: 13.9167, lon: 120.8833 }
};

/**
 * Get PAGASA rainfall forecast for a specific location
 * @param {string} city - City name (default: Batangas City)
 * @returns {Promise} Rainfall forecast data
 */
export const getPAGASARainfallForecast = async (city = 'Batangas City') => {
  try {
    const location = BATANGAS_LOCATIONS[city] || BATANGAS_LOCATIONS['Batangas City'];
    const url = `${API_BASE_URL}/api/batangas-forecast?lat=${location.lat}&lon=${location.lon}&city=${encodeURIComponent(city)}`;

    console.log('🌧️ Fetching PAGASA forecast:', { city, location, url });

    const response = await fetch(url);

    console.log('📡 PAGASA Response status:', response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ PAGASA API error response:', errorText);
      throw new Error(`HTTP error! status: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    console.log('✅ PAGASA data received:', data);

    const parsed = parseRainfallData(data, city);
    console.log('📊 Parsed forecast:', parsed);

    return parsed;
  } catch (error) {
    console.error('❌ PAGASA API Error:', error);
    console.error('Stack trace:', error.stack);
    throw new Error(`Failed to fetch PAGASA forecast: ${error.message}`);
  }
};

/**
 * Get PAGASA rainfall forecast for all Batangas cities
 * @returns {Promise} Array of rainfall forecasts
 */
export const getAllBatangasForecasts = async () => {
  try {
    const cities = Object.keys(BATANGAS_LOCATIONS);

    const forecasts = await Promise.all(
      cities.map(city =>
        getPAGASARainfallForecast(city).catch(err => {
          console.error(`Failed to fetch forecast for ${city}:`, err);
          return null;
        })
      )
    );

    // Filter out failed requests
    return forecasts.filter(forecast => forecast !== null);
  } catch (error) {
    console.error('PAGASA Batch Fetch Error:', error);
    throw error;
  }
};

/**
 * Parse PAGASA API response into usable format
 * @param {Object} data - Raw PAGASA API response
 * @param {string} city - City name
 * @returns {Object} Parsed forecast data
 */
const parseRainfallData = (data, city) => {
  if (!data.features || data.features.length === 0) {
    return {
      city,
      forecast: [],
      summary: {
        totalRainfall: 0,
        maxRainfall: 0,
        riskLevel: 'low',
        alerts: []
      }
    };
  }

  const features = data.features;
  const forecasts = [];
  let totalRainfall = 0;
  let maxRainfall = 0;

  features.forEach(feature => {
    const attributes = feature.attributes;

    // Extract rainfall data (adjust field names based on actual PAGASA response)
    const rainfall = attributes.rainfall || attributes.RAINFALL || attributes.precip || 0;
    const timestamp = attributes.timestamp || attributes.date || attributes.FORECAST_DATE;

    if (rainfall > 0) {
      forecasts.push({
        timestamp: timestamp ? new Date(timestamp) : new Date(),
        rainfall: parseFloat(rainfall),
        location: city,
        source: 'PAGASA'
      });

      totalRainfall += parseFloat(rainfall);
      maxRainfall = Math.max(maxRainfall, parseFloat(rainfall));
    }
  });

  // Determine risk level based on rainfall
  let riskLevel = 'low';
  let alerts = [];

  if (maxRainfall > 50) {
    riskLevel = 'critical';
    alerts.push('Heavy to intense rainfall expected - Flooding risk is high');
  } else if (maxRainfall > 30) {
    riskLevel = 'high';
    alerts.push('Heavy rainfall expected - Monitor flood-prone areas');
  } else if (maxRainfall > 15) {
    riskLevel = 'medium';
    alerts.push('Moderate rainfall expected - Be prepared for possible flooding');
  } else if (maxRainfall > 5) {
    riskLevel = 'low';
    alerts.push('Light to moderate rainfall expected');
  }

  return {
    city,
    forecast: forecasts.sort((a, b) => a.timestamp - b.timestamp),
    summary: {
      totalRainfall: Math.round(totalRainfall * 10) / 10,
      maxRainfall: Math.round(maxRainfall * 10) / 10,
      riskLevel,
      alerts
    }
  };
};

/**
 * Get combined weather and PAGASA forecast for analytics
 * @returns {Promise} Combined forecast data
 */
export const getCombinedForecast = async () => {
  try {
    const pagasaData = await getAllBatangasForecasts();

    // Calculate aggregate statistics
    const stats = {
      totalCities: pagasaData.length,
      criticalAreas: pagasaData.filter(d => d.summary.riskLevel === 'critical').length,
      highRiskAreas: pagasaData.filter(d => d.summary.riskLevel === 'high').length,
      mediumRiskAreas: pagasaData.filter(d => d.summary.riskLevel === 'medium').length,
      lowRiskAreas: pagasaData.filter(d => d.summary.riskLevel === 'low').length,
      totalExpectedRainfall: pagasaData.reduce((sum, d) => sum + d.summary.totalRainfall, 0),
      averageRainfall: 0,
      maxRainfallCity: null,
      alerts: []
    };

    stats.averageRainfall = Math.round((stats.totalExpectedRainfall / stats.totalCities) * 10) / 10;

    // Find city with max rainfall
    const maxCity = pagasaData.reduce((max, curr) =>
      curr.summary.maxRainfall > (max?.summary.maxRainfall || 0) ? curr : max
    , null);

    if (maxCity) {
      stats.maxRainfallCity = {
        name: maxCity.city,
        rainfall: maxCity.summary.maxRainfall
      };
    }

    // Collect all alerts
    pagasaData.forEach(city => {
      if (city.summary.alerts.length > 0) {
        stats.alerts.push({
          city: city.city,
          riskLevel: city.summary.riskLevel,
          message: city.summary.alerts[0]
        });
      }
    });

    return {
      cities: pagasaData,
      statistics: stats,
      source: 'PAGASA',
      lastUpdated: new Date()
    };
  } catch (error) {
    console.error('Combined Forecast Error:', error);
    throw error;
  }
};

/**
 * Get rainfall alerts for display in dashboard
 * @returns {Promise} Array of rainfall alerts
 */
export const getRainfallAlerts = async () => {
  try {
    const forecast = await getCombinedForecast();

    return forecast.statistics.alerts
      .sort((a, b) => {
        const riskPriority = { critical: 4, high: 3, medium: 2, low: 1 };
        return riskPriority[b.riskLevel] - riskPriority[a.riskLevel];
      });
  } catch (error) {
    console.error('Rainfall Alerts Error:', error);
    return [];
  }
};

export default {
  getPAGASARainfallForecast,
  getAllBatangasForecasts,
  getCombinedForecast,
  getRainfallAlerts,
  BATANGAS_LOCATIONS
};
