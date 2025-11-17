const express = require('express');
const router = express.Router();
const lightningService = require('../services/lightningService');

/**
 * GET /api/lightning/recent
 * Get recent lightning strikes in Philippines (last 30 minutes)
 */
router.get('/recent', async (req, res) => {
  try {
    console.log('⚡ API Request: GET /api/lightning/recent');

    const lightningData = await lightningService.getRecentLightning();

    res.json({
      success: true,
      data: lightningData,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('❌ Error in /api/lightning/recent:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch lightning data',
      message: error.message
    });
  }
});

/**
 * GET /api/lightning/near
 * Get lightning strikes near a specific location
 * Query params: lat, lon, radius (km)
 */
router.get('/near', async (req, res) => {
  try {
    const { lat, lon, radius } = req.query;

    if (!lat || !lon) {
      return res.status(400).json({
        success: false,
        error: 'Missing required parameters: lat and lon'
      });
    }

    const latitude = parseFloat(lat);
    const longitude = parseFloat(lon);
    const searchRadius = radius ? parseFloat(radius) : 50; // default 50km

    console.log(`⚡ API Request: GET /api/lightning/near (${latitude}, ${longitude}, ${searchRadius}km)`);

    const nearbyLightning = lightningService.getLightningNearLocation(
      latitude,
      longitude,
      searchRadius
    );

    res.json({
      success: true,
      data: nearbyLightning,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('❌ Error in /api/lightning/near:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch nearby lightning',
      message: error.message
    });
  }
});

/**
 * GET /api/lightning/cells
 * Detect and return active storm cells based on lightning clusters
 */
router.get('/cells', async (req, res) => {
  try {
    console.log('⚡ API Request: GET /api/lightning/cells');

    const stormCells = lightningService.detectStormCells();

    res.json({
      success: true,
      data: stormCells,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('❌ Error in /api/lightning/cells:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to detect storm cells',
      message: error.message
    });
  }
});

/**
 * POST /api/lightning/clear-cache
 * Clear lightning data cache
 */
router.post('/clear-cache', (req, res) => {
  try {
    lightningService.clearCache();
    res.json({
      success: true,
      message: 'Lightning cache cleared successfully'
    });
  } catch (error) {
    console.error('❌ Error clearing lightning cache:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to clear cache',
      message: error.message
    });
  }
});

module.exports = router;
