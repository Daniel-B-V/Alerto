import axios from 'axios';
import { generateTestTyphoonsLocal } from './typhoonTestData';

const API_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';

/**
 * Typhoon Service
 * Frontend service for fetching typhoon data from backend API
 */

/**
 * Get all active typhoons in Western Pacific
 */
export async function getActiveTyphoons() {
  try {
    const response = await axios.get(`${API_URL}/api/typhoon/active`);

    if (response.data.success) {
      return response.data.data;
    }

    throw new Error('Failed to fetch active typhoons');
  } catch (error) {
    console.error('Error fetching active typhoons:', error);
    throw error;
  }
}

/**
 * Get typhoons near Philippines only
 */
export async function getPhilippinesTyphoons() {
  try {
    const response = await axios.get(`${API_URL}/api/typhoon/philippines`, {
      timeout: 5000 // 5 second timeout
    });

    if (response.data.success) {
      return response.data.data;
    }

    throw new Error('Failed to fetch Philippines typhoons');
  } catch (error) {
    console.error('Error fetching Philippines typhoons:', error);

    // Return empty array instead of test data fallback
    // This allows the UI to show "No Active Typhoons" state
    return [];
  }
}

/**
 * Get detailed information for a specific typhoon
 */
export async function getTyphoonDetails(typhoonId) {
  try {
    const response = await axios.get(`${API_URL}/api/typhoon/${typhoonId}`);

    if (response.data.success) {
      return response.data.data;
    }

    throw new Error('Failed to fetch typhoon details');
  } catch (error) {
    console.error(`Error fetching typhoon ${typhoonId}:`, error);
    throw error;
  }
}

/**
 * Clear the backend cache (for testing)
 */
export async function clearTyphoonCache() {
  try {
    const response = await axios.post(`${API_URL}/api/typhoon/clear-cache`);
    return response.data;
  } catch (error) {
    console.error('Error clearing typhoon cache:', error);
    throw error;
  }
}

/**
 * Get synthetic test typhoon data (for testing/demo when no real typhoons exist)
 */
export async function getTestTyphoons() {
  try {
    // Try to fetch from backend first
    const response = await axios.get(`${API_URL}/api/typhoon/test-data`, {
      timeout: 3000 // 3 second timeout
    });

    if (response.data.success) {
      return {
        data: response.data.data,
        isTestData: true,
        message: response.data.message
      };
    }

    throw new Error('Failed to fetch test typhoon data');
  } catch (error) {
    console.warn('Backend unavailable, using local test data');

    // Fallback to local test data
    const testData = generateTestTyphoonsLocal();
    return {
      data: testData,
      isTestData: true,
      message: '⚠️ This is synthetic test data generated locally (backend unavailable)'
    };
  }
}
