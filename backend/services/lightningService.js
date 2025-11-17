const axios = require('axios');

/**
 * Lightning Tracking Service
 * Uses Blitzortung.org - Free, community-driven lightning detection network
 * Real-time lightning strike data for storm tracking
 */

// Blitzortung API endpoints
const BLITZORTUNG_BASE = 'https://data.blitzortung.org';
const LIGHTNING_DATA_URL = `${BLITZORTUNG_BASE}/Data/Protected/last_strikes.php`;

// Alternative: LightningMaps.org (sister site)
const LIGHTNING_MAPS_API = 'https://www.lightningmaps.org/blitzortung/america/index.php?bo_page=map_data';

// Philippines bounding box
const PH_BOUNDS = {
  minLat: 4.0,
  maxLat: 22.0,
  minLon: 116.0,
  maxLon: 127.0
};

// Cache for lightning strikes
let lightningCache = {
  data: null,
  lastFetch: null,
  cacheDuration: 2 * 60 * 1000 // 2 minutes - lightning is real-time
};

/**
 * Get recent lightning strikes in Philippines region
 * Returns strikes from last 30 minutes
 */
async function getRecentLightning() {
  try {
    // Check cache
    if (lightningCache.data &&
        lightningCache.lastFetch &&
        Date.now() - lightningCache.lastFetch < lightningCache.cacheDuration) {
      console.log('⚡ Returning cached lightning data');
      return lightningCache.data;
    }

    console.log('⚡ Fetching real-time lightning strikes...');

    // Blitzortung provides data in JSON format
    // Format: [time, lat, lon, altitude, polarity]
    const response = await axios.get(LIGHTNING_DATA_URL, {
      timeout: 10000,
      headers: {
        'User-Agent': 'Alerto-Weather-App/1.0'
      }
    });

    if (!response.data) {
      return generateFallbackLightningData();
    }

    // Parse and filter for Philippines region
    const strikes = parseLightningData(response.data);
    const philippineStrikes = filterStrikesInRegion(strikes, PH_BOUNDS);

    // Group strikes by time intervals (for animation)
    const groupedStrikes = groupStrikesByTime(philippineStrikes);

    const result = {
      strikes: philippineStrikes,
      groupedByTime: groupedStrikes,
      totalCount: philippineStrikes.length,
      region: 'Philippines',
      timeRange: '30 minutes',
      lastUpdate: new Date().toISOString()
    };

    // Cache the results
    lightningCache.data = result;
    lightningCache.lastFetch = Date.now();

    console.log(`✅ Found ${philippineStrikes.length} lightning strikes in Philippines`);

    return result;

  } catch (error) {
    console.error('❌ Error fetching lightning data:', error.message);

    // Return cached data if available
    if (lightningCache.data) {
      console.log('⚠️ Returning stale cached lightning data');
      return lightningCache.data;
    }

    // Generate fallback data
    return generateFallbackLightningData();
  }
}

/**
 * Parse lightning data from Blitzortung format
 * Format can vary - handle both JSON and CSV formats
 */
function parseLightningData(data) {
  const strikes = [];
  const now = Date.now();
  const thirtyMinutesAgo = now - (30 * 60 * 1000);

  try {
    // If data is array (JSON format)
    if (Array.isArray(data)) {
      data.forEach(strike => {
        if (Array.isArray(strike) && strike.length >= 3) {
          const timestamp = strike[0]; // Unix timestamp in microseconds
          const lat = parseFloat(strike[1]);
          const lon = parseFloat(strike[2]);
          const altitude = strike[3] ? parseFloat(strike[3]) : 0;
          const polarity = strike[4] || 0; // Positive or negative lightning

          // Convert microsecond timestamp to milliseconds
          const strikeTime = typeof timestamp === 'number'
            ? timestamp / 1000
            : new Date(timestamp).getTime();

          // Only include strikes from last 30 minutes
          if (strikeTime >= thirtyMinutesAgo && !isNaN(lat) && !isNaN(lon)) {
            strikes.push({
              timestamp: new Date(strikeTime),
              lat: lat,
              lon: lon,
              altitude: altitude,
              polarity: polarity,
              intensity: calculateIntensity(altitude, polarity)
            });
          }
        }
      });
    }

  } catch (error) {
    console.error('Error parsing lightning data:', error);
  }

  return strikes;
}

/**
 * Calculate lightning intensity based on altitude and polarity
 * Higher altitude = more intense storm
 */
function calculateIntensity(altitude, polarity) {
  const altitudeScore = Math.min(altitude / 15000, 1); // Normalize to 0-1
  const polarityFactor = Math.abs(polarity);

  if (altitudeScore > 0.8 || polarityFactor > 50) return 'severe';
  if (altitudeScore > 0.5 || polarityFactor > 30) return 'strong';
  if (altitudeScore > 0.3 || polarityFactor > 15) return 'moderate';
  return 'weak';
}

/**
 * Filter strikes within a bounding box
 */
function filterStrikesInRegion(strikes, bounds) {
  return strikes.filter(strike => {
    return strike.lat >= bounds.minLat &&
           strike.lat <= bounds.maxLat &&
           strike.lon >= bounds.minLon &&
           strike.lon <= bounds.maxLon;
  });
}

/**
 * Group strikes by 5-minute intervals for animation
 */
function groupStrikesByTime(strikes) {
  const groups = {};
  const interval = 5 * 60 * 1000; // 5 minutes

  strikes.forEach(strike => {
    const timestamp = strike.timestamp.getTime();
    const groupKey = Math.floor(timestamp / interval) * interval;
    const groupTime = new Date(groupKey).toISOString();

    if (!groups[groupTime]) {
      groups[groupTime] = [];
    }

    groups[groupTime].push(strike);
  });

  return groups;
}

/**
 * Get lightning activity near a specific location
 * Returns strikes within specified radius
 */
function getLightningNearLocation(lat, lon, radiusKm = 50) {
  try {
    if (!lightningCache.data || !lightningCache.data.strikes) {
      return {
        nearbyStrikes: [],
        count: 0,
        closestDistance: null
      };
    }

    const nearbyStrikes = [];
    let closestDistance = Infinity;

    lightningCache.data.strikes.forEach(strike => {
      const distance = calculateDistance(lat, lon, strike.lat, strike.lon);

      if (distance <= radiusKm) {
        nearbyStrikes.push({
          ...strike,
          distanceKm: Math.round(distance)
        });

        if (distance < closestDistance) {
          closestDistance = distance;
        }
      }
    });

    // Sort by distance (closest first)
    nearbyStrikes.sort((a, b) => a.distanceKm - b.distanceKm);

    return {
      nearbyStrikes: nearbyStrikes,
      count: nearbyStrikes.length,
      closestDistance: closestDistance < Infinity ? Math.round(closestDistance) : null,
      searchRadius: radiusKm,
      location: { lat, lon }
    };

  } catch (error) {
    console.error('Error finding nearby lightning:', error);
    return {
      error: 'Failed to find nearby lightning',
      nearbyStrikes: [],
      count: 0
    };
  }
}

/**
 * Calculate distance between two points (Haversine formula)
 */
function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // Earth radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Detect storm cells based on lightning cluster analysis
 * Groups nearby strikes into storm cells
 */
function detectStormCells() {
  try {
    if (!lightningCache.data || !lightningCache.data.strikes) {
      return { cells: [], count: 0 };
    }

    const strikes = lightningCache.data.strikes;
    const cells = [];
    const processed = new Set();
    const clusterRadius = 30; // km - strikes within this radius form a cell

    strikes.forEach((strike, index) => {
      if (processed.has(index)) return;

      const cell = {
        center: { lat: strike.lat, lon: strike.lon },
        strikes: [strike],
        intensity: strike.intensity,
        firstStrike: strike.timestamp,
        lastStrike: strike.timestamp
      };

      // Find nearby strikes
      strikes.forEach((otherStrike, otherIndex) => {
        if (index === otherIndex || processed.has(otherIndex)) return;

        const distance = calculateDistance(
          strike.lat, strike.lon,
          otherStrike.lat, otherStrike.lon
        );

        if (distance <= clusterRadius) {
          cell.strikes.push(otherStrike);
          processed.add(otherIndex);

          // Update cell center (weighted average)
          cell.center.lat = cell.strikes.reduce((sum, s) => sum + s.lat, 0) / cell.strikes.length;
          cell.center.lon = cell.strikes.reduce((sum, s) => sum + s.lon, 0) / cell.strikes.length;

          // Update time range
          if (otherStrike.timestamp < cell.firstStrike) {
            cell.firstStrike = otherStrike.timestamp;
          }
          if (otherStrike.timestamp > cell.lastStrike) {
            cell.lastStrike = otherStrike.timestamp;
          }
        }
      });

      processed.add(index);

      // Only add if cell has multiple strikes
      if (cell.strikes.length >= 3) {
        cell.strikeCount = cell.strikes.length;
        cell.duration = (cell.lastStrike - cell.firstStrike) / (60 * 1000); // minutes
        cell.activity = cell.strikeCount / Math.max(cell.duration, 1); // strikes per minute

        // Determine severity
        if (cell.strikeCount > 50) cell.severity = 'severe';
        else if (cell.strikeCount > 20) cell.severity = 'strong';
        else if (cell.strikeCount > 10) cell.severity = 'moderate';
        else cell.severity = 'weak';

        cells.push(cell);
      }
    });

    // Sort by strike count (most active first)
    cells.sort((a, b) => b.strikeCount - a.strikeCount);

    return {
      cells: cells,
      count: cells.length,
      timestamp: new Date().toISOString()
    };

  } catch (error) {
    console.error('Error detecting storm cells:', error);
    return { cells: [], count: 0, error: 'Failed to detect storm cells' };
  }
}

/**
 * Generate fallback lightning data (for testing when API unavailable)
 */
function generateFallbackLightningData() {
  console.log('⚠️ Generating fallback lightning data');

  const strikes = [];
  const now = Date.now();

  // Generate random strikes in Batangas region
  for (let i = 0; i < 20; i++) {
    const timestamp = new Date(now - Math.random() * 30 * 60 * 1000);
    const lat = 13.5 + Math.random() * 1.0; // Batangas latitude range
    const lon = 120.6 + Math.random() * 0.8; // Batangas longitude range

    strikes.push({
      timestamp: timestamp,
      lat: lat,
      lon: lon,
      altitude: Math.random() * 15000,
      polarity: (Math.random() - 0.5) * 100,
      intensity: ['weak', 'moderate', 'strong'][Math.floor(Math.random() * 3)]
    });
  }

  return {
    strikes: strikes,
    groupedByTime: groupStrikesByTime(strikes),
    totalCount: strikes.length,
    region: 'Philippines (Test Data)',
    timeRange: '30 minutes',
    lastUpdate: new Date().toISOString(),
    isFallback: true
  };
}

/**
 * Clear lightning cache
 */
function clearCache() {
  lightningCache.data = null;
  lightningCache.lastFetch = null;
  console.log('🗑️ Lightning cache cleared');
}

module.exports = {
  getRecentLightning,
  getLightningNearLocation,
  detectStormCells,
  clearCache
};
