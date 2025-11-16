import axios from 'axios';

const API_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';

/**
 * Enhanced Typhoon Service
 * Provides access to new typhoon features:
 * - Multi-model ensemble forecasts
 * - Storm impact predictions
 * - Landfall estimations
 */

/**
 * Get multi-model ensemble forecast for a typhoon
 * Combines forecasts from multiple agencies (NOAA, JTWC, ECMWF, etc.)
 */
export async function getEnsembleForecast(typhoonId) {
  try {
    const response = await axios.get(`${API_URL}/api/typhoon/ensemble/${typhoonId}`, {
      timeout: 10000
    });

    if (response.data.success) {
      return response.data.data;
    }

    throw new Error('Failed to fetch ensemble forecast');
  } catch (error) {
    console.error(`Error fetching ensemble forecast for ${typhoonId}:`, error);
    return { error: error.message };
  }
}

/**
 * Get spaghetti plot data (all model tracks overlaid)
 * Useful for visualizing forecast uncertainty
 */
export async function getSpaghettiPlot(typhoonId) {
  try {
    const response = await axios.get(`${API_URL}/api/typhoon/spaghetti/${typhoonId}`, {
      timeout: 10000
    });

    if (response.data.success) {
      return response.data.data;
    }

    throw new Error('Failed to fetch spaghetti plot data');
  } catch (error) {
    console.error(`Error fetching spaghetti plot for ${typhoonId}:`, error);
    return { error: error.message };
  }
}

/**
 * Get storm impact prediction
 * Includes landfall prediction, affected areas, population at risk
 */
export async function getStormImpact(typhoonId) {
  try {
    const response = await axios.get(`${API_URL}/api/typhoon/impact/${typhoonId}`, {
      timeout: 10000
    });

    if (response.data.success) {
      return response.data.data;
    }

    throw new Error('Failed to fetch storm impact');
  } catch (error) {
    console.error(`Error fetching storm impact for ${typhoonId}:`, error);
    return { error: error.message };
  }
}

/**
 * Get available forecast models information
 */
export async function getModelInfo() {
  try {
    const response = await axios.get(`${API_URL}/api/typhoon/models`, {
      timeout: 5000
    });

    if (response.data.success) {
      return response.data.data;
    }

    throw new Error('Failed to fetch model information');
  } catch (error) {
    console.error('Error fetching model info:', error);
    return {};
  }
}
