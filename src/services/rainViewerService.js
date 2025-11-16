/**
 * RainViewer API Service
 * Provides animated rain radar data for the map
 * API Documentation: https://www.rainviewer.com/api.html
 */

const RAINVIEWER_API_URL = 'https://api.rainviewer.com/public/weather-maps.json';

/**
 * Fetch available rain radar frames from RainViewer
 * @returns {Promise<Object>} RainViewer API response with available radar frames
 */
export async function getRainRadarFrames() {
  try {
    const response = await fetch(RAINVIEWER_API_URL);

    if (!response.ok) {
      throw new Error(`RainViewer API error: ${response.status}`);
    }

    const data = await response.json();

    // RainViewer API returns:
    // - host: tile server URL
    // - radar.past: array of past radar frames
    // - radar.nowcast: array of forecast frames
    // - satellite.infrared: infrared satellite images

    return data;
  } catch (error) {
    console.error('Error fetching RainViewer data:', error);
    throw error;
  }
}

/**
 * Get RainViewer tile URL for a specific frame
 * @param {string} host - The tile server host from API
 * @param {string} path - The frame path from API
 * @param {number} z - Zoom level
 * @param {number} x - Tile X coordinate
 * @param {number} y - Tile Y coordinate
 * @returns {string} Complete tile URL
 */
export function getRainTileUrl(host, path, z, x, y) {
  return `${host}${path}/256/${z}/${x}/${y}/2/1_1.png`;
}

/**
 * Get the most recent rain radar frame
 * @returns {Promise<Object>} Most recent radar frame data
 */
export async function getLatestRainRadar() {
  try {
    const data = await getRainRadarFrames();

    if (!data.radar || !data.radar.past || data.radar.past.length === 0) {
      throw new Error('No radar data available');
    }

    // Get the most recent frame
    const latestFrame = data.radar.past[data.radar.past.length - 1];

    return {
      host: data.host,
      path: latestFrame.path,
      time: latestFrame.time,
      frames: data.radar.past,
      nowcast: data.radar.nowcast || []
    };
  } catch (error) {
    console.error('Error getting latest rain radar:', error);
    throw error;
  }
}

export default {
  getRainRadarFrames,
  getRainTileUrl,
  getLatestRainRadar
};
