import express from "express";
import axios from "axios";
import cors from "cors";

const app = express();
const PORT = process.env.PORT || 5000;

// Enable CORS for frontend
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
}));

app.use(express.json());

// PAGASA Rainfall Forecast Endpoint
const PAGASA_URL =
  "https://portal.georisk.gov.ph/arcgis/rest/services/PAGASA/PAGASA/MapServer/26/query";

/**
 * Route to get rainfall forecast for specific coordinates
 * Query params: lat, lon, city (optional)
 */
app.get("/api/batangas-forecast", async (req, res) => {
  try {
    // Get coordinates from query params or use default (Batangas City)
    const lat = parseFloat(req.query.lat) || 13.7565;
    const lon = parseFloat(req.query.lon) || 121.0583;
    const city = req.query.city || 'Batangas City';

    console.log(`Fetching PAGASA forecast for ${city} (${lat}, ${lon})`);

    const params = {
      where: "1=1",
      geometry: `${lon},${lat}`,
      geometryType: "esriGeometryPoint",
      inSR: 4326,
      spatialRel: "esriSpatialRelIntersects",
      outFields: "*",
      returnGeometry: false,
      f: "json",
    };

    const response = await axios.get(PAGASA_URL, {
      params,
      timeout: 10000 // 10 second timeout
    });

    // Add metadata to response
    const enrichedData = {
      ...response.data,
      metadata: {
        city,
        coordinates: { lat, lon },
        source: 'PAGASA',
        timestamp: new Date().toISOString()
      }
    };

    res.json(enrichedData);
  } catch (error) {
    console.error("Error fetching PAGASA data:", error.message);

    // Send detailed error response
    res.status(500).json({
      error: "Failed to fetch PAGASA data",
      message: error.message,
      details: error.response?.data || null
    });
  }
});

/**
 * Route to get forecast for multiple locations
 */
app.post("/api/batangas-forecast-batch", async (req, res) => {
  try {
    const locations = req.body.locations || [];

    if (!Array.isArray(locations) || locations.length === 0) {
      return res.status(400).json({
        error: "Invalid request",
        message: "locations array is required"
      });
    }

    console.log(`Fetching PAGASA forecast for ${locations.length} locations`);

    const promises = locations.map(async ({ city, lat, lon }) => {
      try {
        const params = {
          where: "1=1",
          geometry: `${lon},${lat}`,
          geometryType: "esriGeometryPoint",
          inSR: 4326,
          spatialRel: "esriSpatialRelIntersects",
          outFields: "*",
          returnGeometry: false,
          f: "json",
        };

        const response = await axios.get(PAGASA_URL, {
          params,
          timeout: 10000
        });

        return {
          city,
          coordinates: { lat, lon },
          data: response.data,
          success: true
        };
      } catch (error) {
        console.error(`Failed to fetch data for ${city}:`, error.message);
        return {
          city,
          coordinates: { lat, lon },
          error: error.message,
          success: false
        };
      }
    });

    const results = await Promise.all(promises);

    res.json({
      total: results.length,
      successful: results.filter(r => r.success).length,
      failed: results.filter(r => !r.success).length,
      results,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error("Batch fetch error:", error.message);
    res.status(500).json({
      error: "Failed to fetch batch data",
      message: error.message
    });
  }
});

/**
 * Health check endpoint
 */
app.get("/api/health", (req, res) => {
  res.json({
    status: "ok",
    service: "PAGASA Forecast Proxy",
    timestamp: new Date().toISOString()
  });
});

/**
 * Test endpoint to verify PAGASA API connection
 */
app.get("/api/test-pagasa", async (req, res) => {
  try {
    const testParams = {
      where: "1=1",
      geometry: "121.0583,13.7565",
      geometryType: "esriGeometryPoint",
      inSR: 4326,
      spatialRel: "esriSpatialRelIntersects",
      outFields: "*",
      returnGeometry: false,
      f: "json",
    };

    const response = await axios.get(PAGASA_URL, {
      params: testParams,
      timeout: 10000
    });

    res.json({
      success: true,
      message: "PAGASA API connection successful",
      sampleData: response.data,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: "PAGASA API connection failed",
      message: error.message,
      details: error.response?.data || null
    });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`╔═══════════════════════════════════════╗`);
  console.log(`║   PAGASA Forecast Proxy Server       ║`);
  console.log(`╚═══════════════════════════════════════╝`);
  console.log(`🌧️  Server running on port ${PORT}`);
  console.log(`📡 PAGASA API: ${PAGASA_URL}`);
  console.log(`🔗 Frontend: ${process.env.FRONTEND_URL || 'http://localhost:3000'}`);
  console.log(`\n✅ Ready to serve rainfall forecasts!\n`);
});

export default app;
