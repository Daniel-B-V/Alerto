/**
 * Typhoon Tracking Service
 * Fetches and processes JTWC (Joint Typhoon Warning Center) typhoon data
 * Combined with NOAA satellite imagery for comprehensive storm tracking
 */

// JTWC RSS Feed URL for Western Pacific
const JTWC_RSS_URL = 'https://www.metoc.navy.mil/jtwc/rss/jtwc.rss';
const JTWC_PRODUCTS_URL = 'https://www.metoc.navy.mil/jtwc/products';

// Batangas coordinates (center of province)
const BATANGAS_COORDS = {
  lat: 13.7565,
  lng: 121.0583
};

// Monitoring radii in kilometers
const MONITORING_RADIUS = {
  CRITICAL: 200,    // Direct threat
  HIGH: 500,        // High threat
  MODERATE: 800,    // Monitor closely
  LOW: 1200        // Awareness
};

/**
 * Fetch active typhoons from JTWC RSS feed
 */
export async function fetchActiveTyphoons() {
  // Check if we should use test data (for development/demo)
  const useTestData = localStorage.getItem('useTyphoonTestData') === 'true';

  if (useTestData) {
    console.log('📍 Using test typhoon data (UWAN)');
    return await fetchTestTyphoons();
  }

  try {
    // Use a CORS proxy for development (you may need to deploy a backend endpoint for production)
    const proxyUrl = 'https://api.allorigins.win/raw?url=';
    const response = await fetch(proxyUrl + encodeURIComponent(JTWC_RSS_URL));

    if (!response.ok) {
      throw new Error('Failed to fetch JTWC data');
    }

    const xmlText = await response.text();
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(xmlText, 'text/xml');

    // Parse RSS items
    const items = xmlDoc.querySelectorAll('item');
    const typhoons = [];

    for (const item of items) {
      const title = item.querySelector('title')?.textContent || '';
      const description = item.querySelector('description')?.textContent || '';
      const link = item.querySelector('link')?.textContent || '';
      const pubDate = item.querySelector('pubDate')?.textContent || '';

      // Extract typhoon name and basin from title
      // Example: "Typhoon 01W (DUJUAN) Warning #15"
      const nameMatch = title.match(/(\w+)\s+(\d+\w+)\s+\(([^)]+)\)/);

      if (nameMatch) {
        const [, type, id, name] = nameMatch;

        // Parse coordinates from description or fetch detailed bulletin
        const coords = await parseCoordinatesFromBulletin(link);

        if (coords) {
          typhoons.push({
            id,
            name,
            type,
            title,
            description,
            link,
            pubDate: new Date(pubDate),
            currentPosition: coords.current,
            forecastTrack: coords.forecast,
            intensity: coords.intensity,
            distanceFromBatangas: null // Will be calculated
          });
        }
      }
    }

    // Calculate distances and filter for relevant typhoons
    return typhoons.map(typhoon => ({
      ...typhoon,
      distanceFromBatangas: calculateDistance(
        BATANGAS_COORDS.lat,
        BATANGAS_COORDS.lng,
        typhoon.currentPosition.lat,
        typhoon.currentPosition.lng
      ),
      threatLevel: determineThreatLevel(typhoon)
    })).filter(typhoon => typhoon.distanceFromBatangas <= MONITORING_RADIUS.LOW);

  } catch (error) {
    console.error('Error fetching JTWC data:', error);
    return [];
  }
}

/**
 * Fetch test typhoon data (UWAN)
 */
async function fetchTestTyphoons() {
  // Simulate UWAN (Usagi) typhoon
  const testTyphoon = {
    id: '26W',
    name: 'UWAN',
    type: 'Typhoon',
    title: 'Typhoon 26W (UWAN) Warning',
    description: 'Test typhoon data for demonstration',
    link: '#',
    pubDate: new Date(),
    currentPosition: {
      lat: 16.5,
      lng: 126.0
    },
    forecastTrack: [
      { lat: 16.8, lng: 125.2, hours: 12 },
      { lat: 17.0, lng: 124.5, hours: 24 },
      { lat: 17.2, lng: 123.8, hours: 36 },
      { lat: 17.4, lng: 123.0, hours: 48 },
      { lat: 17.6, lng: 122.2, hours: 60 },
      { lat: 17.8, lng: 121.5, hours: 72 }
    ],
    intensity: {
      windSpeed: 241, // km/h
      category: 'Typhoon Category 4'
    },
    distanceFromBatangas: null
  };

  // Calculate distance from Batangas
  testTyphoon.distanceFromBatangas = calculateDistance(
    BATANGAS_COORDS.lat,
    BATANGAS_COORDS.lng,
    testTyphoon.currentPosition.lat,
    testTyphoon.currentPosition.lng
  );

  testTyphoon.threatLevel = determineThreatLevel(testTyphoon);

  return [testTyphoon];
}

/**
 * Parse coordinates from JTWC text bulletin
 */
async function parseCoordinatesFromBulletin(bulletinUrl) {
  try {
    const proxyUrl = 'https://api.allorigins.win/raw?url=';
    const response = await fetch(proxyUrl + encodeURIComponent(bulletinUrl));

    if (!response.ok) return null;

    const text = await response.text();

    // Extract current position
    // Format: "CENTER LOCATED NEAR 13.5N 123.4E AT 16/0600Z"
    const positionMatch = text.match(/CENTER LOCATED NEAR\s+(\d+\.?\d*)([NS])\s+(\d+\.?\d*)([EW])/i);

    if (!positionMatch) return null;

    const [, lat, latDir, lng, lngDir] = positionMatch;
    const currentLat = parseFloat(lat) * (latDir === 'S' ? -1 : 1);
    const currentLng = parseFloat(lng) * (lngDir === 'W' ? -1 : 1);

    // Extract intensity
    const intensityMatch = text.match(/MAX SUSTAINED WINDS\s+-\s+(\d+)\s*KT/i);
    const windSpeed = intensityMatch ? parseInt(intensityMatch[1]) : null;

    // Extract forecast positions
    // Format: "TAU 12 | 14.1N | 122.5E | 045 | 055"
    const forecastMatches = [...text.matchAll(/TAU\s+(\d+)\s*\|\s*(\d+\.?\d*)([NS])\s*\|\s*(\d+\.?\d*)([EW])/gi)];

    const forecast = forecastMatches.map(match => {
      const [, hours, lat, latDir, lng, lngDir] = match;
      return {
        hours: parseInt(hours),
        lat: parseFloat(lat) * (latDir === 'S' ? -1 : 1),
        lng: parseFloat(lng) * (lngDir === 'W' ? -1 : 1)
      };
    });

    return {
      current: { lat: currentLat, lng: currentLng },
      forecast,
      intensity: {
        windSpeed: windSpeed ? windSpeed * 1.852 : null, // Convert knots to km/h
        category: categorizeIntensity(windSpeed)
      }
    };

  } catch (error) {
    console.error('Error parsing bulletin:', error);
    return null;
  }
}

/**
 * Calculate distance between two points using Haversine formula
 * Returns distance in kilometers
 */
function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // Earth's radius in kilometers
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;

  return Math.round(distance);
}

function toRad(degrees) {
  return degrees * (Math.PI / 180);
}

/**
 * Categorize typhoon intensity based on wind speed (in knots)
 */
function categorizeIntensity(windSpeedKnots) {
  if (!windSpeedKnots) return 'Unknown';

  if (windSpeedKnots >= 137) return 'Super Typhoon';
  if (windSpeedKnots >= 64) return 'Typhoon';
  if (windSpeedKnots >= 48) return 'Severe Tropical Storm';
  if (windSpeedKnots >= 34) return 'Tropical Storm';
  return 'Tropical Depression';
}

/**
 * Determine threat level based on distance and intensity
 */
function determineThreatLevel(typhoon) {
  const distance = typhoon.distanceFromBatangas || Infinity;
  const intensity = typhoon.intensity?.windSpeed || 0;

  if (distance <= MONITORING_RADIUS.CRITICAL) {
    return 'CRITICAL';
  } else if (distance <= MONITORING_RADIUS.HIGH) {
    return intensity >= 100 ? 'HIGH' : 'MODERATE';
  } else if (distance <= MONITORING_RADIUS.MODERATE) {
    return 'MODERATE';
  } else if (distance <= MONITORING_RADIUS.LOW) {
    return 'LOW';
  }

  return 'MINIMAL';
}

/**
 * Get NOAA satellite imagery URL for the Western Pacific
 */
export function getNOAASatelliteImagery() {
  return {
    infrared: 'https://cdn.star.nesdis.noaa.gov/GOES17/ABI/SECTOR/wna/GEOCOLOR/latest.jpg',
    visible: 'https://cdn.star.nesdis.noaa.gov/GOES17/ABI/SECTOR/wna/02/latest.jpg',
    waterVapor: 'https://cdn.star.nesdis.noaa.gov/GOES17/ABI/SECTOR/wna/08/latest.jpg',
    // Alternative: Himawari-8 satellite for better Western Pacific coverage
    himawariInfrared: 'https://www.jma.go.jp/bosai/himawari/data/satimg/targetTbb_PSEAS_latest.jpg',
    himawariVisible: 'https://www.jma.go.jp/bosai/himawari/data/satimg/targetSct_PSEAS_latest.jpg'
  };
}

/**
 * Get typhoon summary for display
 */
export function getTyphoonSummary(typhoons) {
  if (!typhoons || typhoons.length === 0) {
    return {
      active: false,
      count: 0,
      nearest: null,
      threat: 'NONE',
      message: 'No active typhoons affecting the region'
    };
  }

  // Sort by distance
  const sorted = [...typhoons].sort((a, b) =>
    a.distanceFromBatangas - b.distanceFromBatangas
  );

  const nearest = sorted[0];
  const criticalCount = typhoons.filter(t => t.threatLevel === 'CRITICAL').length;
  const highCount = typhoons.filter(t => t.threatLevel === 'HIGH').length;

  let threat = 'LOW';
  let message = `${typhoons.length} active typhoon(s) being monitored`;

  if (criticalCount > 0) {
    threat = 'CRITICAL';
    message = `⚠️ CRITICAL: ${criticalCount} typhoon(s) within ${MONITORING_RADIUS.CRITICAL}km`;
  } else if (highCount > 0) {
    threat = 'HIGH';
    message = `⚠️ HIGH ALERT: ${highCount} typhoon(s) within ${MONITORING_RADIUS.HIGH}km`;
  } else if (nearest.distanceFromBatangas <= MONITORING_RADIUS.MODERATE) {
    threat = 'MODERATE';
    message = `Monitoring: Nearest typhoon ${nearest.distanceFromBatangas}km away`;
  }

  return {
    active: true,
    count: typhoons.length,
    nearest,
    threat,
    message
  };
}

export { BATANGAS_COORDS, MONITORING_RADIUS };
