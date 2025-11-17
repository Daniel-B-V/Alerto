import axios from 'axios';

const API_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';

/**
 * Lightning Service
 * Real-time lightning strike tracking and storm cell detection
 */

/**
 * Get recent lightning strikes in Philippines (last 30 minutes)
 */
export async function getRecentLightning() {
  try {
    const response = await axios.get(`${API_URL}/api/lightning/recent`, {
      timeout: 8000
    });

    if (response.data.success) {
      return response.data.data;
    }

    throw new Error('Failed to fetch lightning data');
  } catch (error) {
    console.error('Error fetching lightning data:', error);

    // Return empty data instead of throwing
    return {
      strikes: [],
      groupedByTime: {},
      totalCount: 0,
      region: 'Philippines',
      timeRange: '30 minutes',
      error: error.message
    };
  }
}

/**
 * Get lightning strikes near a specific location
 * @param {number} lat - Latitude
 * @param {number} lon - Longitude
 * @param {number} radius - Search radius in km (default 50)
 */
export async function getLightningNearLocation(lat, lon, radius = 50) {
  try {
    const response = await axios.get(`${API_URL}/api/lightning/near`, {
      params: { lat, lon, radius },
      timeout: 5000
    });

    if (response.data.success) {
      return response.data.data;
    }

    throw new Error('Failed to fetch nearby lightning');
  } catch (error) {
    console.error('Error fetching nearby lightning:', error);
    return {
      nearbyStrikes: [],
      count: 0,
      closestDistance: null,
      error: error.message
    };
  }
}

/**
 * Detect active storm cells based on lightning clusters
 */
export async function getStormCells() {
  try {
    const response = await axios.get(`${API_URL}/api/lightning/cells`, {
      timeout: 8000
    });

    if (response.data.success) {
      return response.data.data;
    }

    throw new Error('Failed to detect storm cells');
  } catch (error) {
    console.error('Error detecting storm cells:', error);
    return {
      cells: [],
      count: 0,
      error: error.message
    };
  }
}

/**
 * Clear lightning cache (for refresh)
 */
export async function clearLightningCache() {
  try {
    const response = await axios.post(`${API_URL}/api/lightning/clear-cache`);
    return response.data;
  } catch (error) {
    console.error('Error clearing lightning cache:', error);
    throw error;
  }
}
