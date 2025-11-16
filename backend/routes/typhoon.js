const express = require('express');
const router = express.Router();
const typhoonService = require('../services/typhoonService');
const { generateTestTyphoons } = require('../services/typhoonTestData');
const multiModelService = require('../services/multiModelForecastService');
const stormImpactService = require('../services/stormImpactService');

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
 * GET /api/typhoon/ensemble/:id
 * Get multi-model ensemble forecast for a specific typhoon
 */
router.get('/ensemble/:id', async (req, res) => {
  try {
    const { id } = req.params;
    console.log(`📡 API Request: GET /api/typhoon/ensemble/${id}`);

    const ensembleData = await multiModelService.getEnsembleForecast(id);

    if (ensembleData.error) {
      return res.status(404).json({
        success: false,
        error: ensembleData.error
      });
    }

    res.json({
      success: true,
      data: ensembleData,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error(`❌ Error in /api/typhoon/ensemble/${req.params.id}:`, error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch ensemble forecast',
      message: error.message
    });
  }
});

/**
 * GET /api/typhoon/spaghetti/:id
 * Get spaghetti plot data (all forecast models) for a specific typhoon
 */
router.get('/spaghetti/:id', async (req, res) => {
  try {
    const { id } = req.params;
    console.log(`📡 API Request: GET /api/typhoon/spaghetti/${id}`);

    const spaghettiData = await multiModelService.getSpaghettiPlot(id);

    if (spaghettiData.error) {
      return res.status(404).json({
        success: false,
        error: spaghettiData.error
      });
    }

    res.json({
      success: true,
      data: spaghettiData,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error(`❌ Error in /api/typhoon/spaghetti/${req.params.id}:`, error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch spaghetti plot data',
      message: error.message
    });
  }
});

/**
 * GET /api/typhoon/impact/:id
 * Get storm impact prediction for a specific typhoon
 */
router.get('/impact/:id', async (req, res) => {
  try {
    const { id } = req.params;
    console.log(`📡 API Request: GET /api/typhoon/impact/${id}`);

    // First get the typhoon data
    const allTyphoons = await typhoonService.getActiveTyphoons();
    const typhoon = allTyphoons.find(t => t.id === id);

    if (!typhoon) {
      return res.status(404).json({
        success: false,
        error: 'Typhoon not found'
      });
    }

    // Calculate impact
    const impactData = await stormImpactService.getStormImpact(typhoon);

    if (impactData.error) {
      return res.status(500).json({
        success: false,
        error: impactData.error
      });
    }

    res.json({
      success: true,
      data: impactData,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error(`❌ Error in /api/typhoon/impact/${req.params.id}:`, error);
    res.status(500).json({
      success: false,
      error: 'Failed to calculate storm impact',
      message: error.message
    });
  }
});

/**
 * GET /api/typhoon/models
 * Get information about available forecast models
 */
router.get('/models', (req, res) => {
  try {
    console.log('📡 API Request: GET /api/typhoon/models');

    const modelInfo = multiModelService.getModelInfo();

    res.json({
      success: true,
      data: modelInfo,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('❌ Error in /api/typhoon/models:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch model information',
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
