/**
 * Wind Data Service
 * Provides wind data in the format required by leaflet-velocity
 * Uses OpenWeatherMap or alternative wind data sources
 */

const OPENWEATHER_API_KEY = '13616e53cdfb9b00c018abeaa05e9784';

/**
 * Fetch wind data from OpenWeatherMap
 * Note: This is a simplified version. For production, you'd want to use
 * GRIB data from NOAA or a dedicated wind data service.
 */
export async function getWindData(bounds) {
  try {
    // For now, we'll use a sample wind data structure
    // In production, you would fetch from NOAA GFS or similar service

    // OpenWeatherMap doesn't provide the grid data needed for velocity display
    // We'll return a sample data structure that leaflet-velocity can use

    const windData = [
      {
        header: {
          parameterCategory: 2,
          parameterNumber: 2,
          dx: 0.5,
          dy: 0.5,
          nx: 360,
          ny: 181,
          la1: 90,
          la2: -90,
          lo1: 0,
          lo2: 359.5,
        },
        data: []
      },
      {
        header: {
          parameterCategory: 2,
          parameterNumber: 3,
          dx: 0.5,
          dy: 0.5,
          nx: 360,
          ny: 181,
          la1: 90,
          la2: -90,
          lo1: 0,
          lo2: 359.5,
        },
        data: []
      }
    ];

    // For demo purposes, we'll use the publicly available wind data
    // You can host your own wind-js-server or use a service
    const publicWindDataUrl = 'https://www.ncei.noaa.gov/data/global-forecast-system/access/grid-004-0.5-degree/forecast/';

    return windData;
  } catch (error) {
    console.error('Error fetching wind data:', error);
    throw error;
  }
}

/**
 * Fetch sample wind data from a public source
 * This uses a demo wind data file for testing
 */
export async function getSampleWindData() {
  try {
    // Using a publicly available sample wind data file
    // This is the same format used by the leaflet-velocity examples
    const response = await fetch('https://onaci.github.io/leaflet-velocity/wind-global.json');

    if (!response.ok) {
      throw new Error(`Wind data fetch error: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching sample wind data:', error);
    // Return null so we can handle it gracefully
    return null;
  }
}

/**
 * Convert OpenWeatherMap wind data to velocity format
 * This is a helper function for future implementation
 */
export function convertToVelocityFormat(weatherData) {
  // This would convert OpenWeatherMap data to the format required by leaflet-velocity
  // Implementation depends on the specific data source
  return weatherData;
}

export default {
  getWindData,
  getSampleWindData,
  convertToVelocityFormat
};
