const express = require('express');
const router = express.Router();
const typhoonService = require('../services/typhoonService');
const { generateTestTyphoons } = require('../services/typhoonTestData');

/**
 * GET /api/typhoon/active
 * Get all active typhoons in the Western Pacific
 */
router.get('/active', async (req, res) => {
  try {
    console.log('📡 API Request: GET /api/typhoon/active');

    const typhoons = await typhoonService.getActiveTyphoons();

    res.json({
      success: true,
      count: typhoons.length,
      data: typhoons,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('❌ Error in /api/typhoon/active:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch active typhoons',
      message: error.message
    });
  }
});

/**
 * GET /api/typhoon/philippines
 * Get typhoons near Philippines only
 */
router.get('/philippines', async (req, res) => {
  try {
    console.log('📡 API Request: GET /api/typhoon/philippines');

    const allTyphoons = await typhoonService.getActiveTyphoons();
    const philippinesTyphoons = allTyphoons.filter(t => t.isNearPhilippines);

    res.json({
      success: true,
      count: philippinesTyphoons.length,
      data: philippinesTyphoons,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('❌ Error in /api/typhoon/philippines:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch Philippines typhoons',
      message: error.message
    });
  }
});

/**
 * GET /api/typhoon/test-data
 * Get synthetic test typhoon data for testing/demo purposes
 * NOTE: This route must come BEFORE /:id to avoid being caught by the parameter route
 */
router.get('/test-data', (req, res) => {
  try {
    console.log('📡 API Request: GET /api/typhoon/test-data (Synthetic Data)');

    const testTyphoons = generateTestTyphoons();

    res.json({
      success: true,
      count: testTyphoons.length,
      data: testTyphoons,
      timestamp: new Date().toISOString(),
      isTestData: true,
      message: '⚠️ This is synthetic test data for demonstration purposes only'
    });
  } catch (error) {
    console.error('❌ Error generating test data:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate test data',
      message: error.message
    });
  }
});

/**
 * GET /api/typhoon/:id
 * Get detailed information for a specific typhoon
 */
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    console.log(`📡 API Request: GET /api/typhoon/${id}`);

    const typhoonDetails = await typhoonService.getTyphoonDetails(id);

    if (typhoonDetails.error) {
      return res.status(404).json({
        success: false,
        error: typhoonDetails.error
      });
    }

    res.json({
      success: true,
      data: typhoonDetails,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error(`❌ Error in /api/typhoon/${req.params.id}:`, error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch typhoon details',
      message: error.message
    });
  }
});

/**
 * POST /api/typhoon/clear-cache
 * Clear the typhoon data cache (for testing/debugging)
 */
router.post('/clear-cache', (req, res) => {
  try {
    typhoonService.clearCache();
    res.json({
      success: true,
      message: 'Cache cleared successfully'
    });
  } catch (error) {
    console.error('❌ Error clearing cache:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to clear cache',
      message: error.message
    });
  }
});

module.exports = router;
