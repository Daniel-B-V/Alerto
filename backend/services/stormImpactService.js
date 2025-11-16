/**
 * Storm Impact Prediction Service
 * Calculates:
 * - Landfall location and time estimation
 * - Affected areas/cities based on forecast path
 * - Population at risk
 * - Impact severity predictions
 */

// Batangas cities with coordinates and population data
const BATANGAS_CITIES = [
  { name: 'Batangas City', lat: 13.7565, lon: 121.0583, population: 351418, coastal: true },
  { name: 'Lipa City', lat: 13.9411, lon: 121.1628, population: 372931, coastal: false },
  { name: 'Tanauan City', lat: 14.0862, lon: 121.1500, population: 193936, coastal: false },
  { name: 'Santo Tomas', lat: 14.1078, lon: 121.1414, population: 218500, coastal: false },
  { name: 'Balayan', lat: 13.9368, lon: 120.7337, population: 95913, coastal: true },
  { name: 'Bauan', lat: 13.7919, lon: 121.0086, population: 90819, coastal: true },
  { name: 'Lemery', lat: 13.9164, lon: 120.8940, population: 106826, coastal: true },
  { name: 'Taal', lat: 13.8817, lon: 120.9289, population: 61460, coastal: true },
  { name: 'Talisay', lat: 14.1103, lon: 120.9306, population: 46248, coastal: true },
  { name: 'San Pascual', lat: 13.8089, lon: 121.0297, population: 64150, coastal: true },
  { name: 'Calaca', lat: 13.9337, lon: 120.7986, population: 87361, coastal: true },
  { name: 'Nasugbu', lat: 14.0698, lon: 120.6328, population: 136524, coastal: true },
  { name: 'Mabini', lat: 13.7244, lon: 120.9039, population: 50858, coastal: true },
  { name: 'Tingloy', lat: 13.6539, lon: 120.8831, population: 19215, coastal: true },
  { name: 'San Luis', lat: 13.7775, lon: 120.9558, population: 33147, coastal: true },
  { name: 'Rosario', lat: 13.8428, lon: 121.2044, population: 128352, coastal: false },
  { name: 'Taysan', lat: 13.7742, lon: 121.2125, population: 40146, coastal: false },
  { name: 'Lobo', lat: 13.6597, lon: 121.2456, population: 40736, coastal: true },
  { name: 'San Juan', lat: 13.8297, lon: 121.3994, population: 114068, coastal: true },
  { name: 'Agoncillo', lat: 13.9333, lon: 120.9278, population: 40637, coastal: true },
  { name: 'Alitagtag', lat: 13.8619, lon: 121.0047, population: 26292, coastal: false },
  { name: 'Cuenca', lat: 13.9075, lon: 121.0489, population: 37866, coastal: false },
  { name: 'Ibaan', lat: 13.8192, lon: 121.1344, population: 58507, coastal: false },
  { name: 'Laurel', lat: 14.0461, lon: 120.9072, population: 43336, coastal: true },
  { name: 'Lian', lat: 14.0356, lon: 120.6544, population: 56280, coastal: true },
  { name: 'Malvar', lat: 14.0428, lon: 121.1600, population: 56446, coastal: false },
  { name: 'Mataas na Kahoy', lat: 13.9569, lon: 121.0806, population: 29208, coastal: false },
  { name: 'Padre Garcia', lat: 13.8817, lon: 121.2156, population: 55599, coastal: false },
  { name: 'San Jose', lat: 13.8808, lon: 121.0947, population: 79868, coastal: false },
  { name: 'San Nicolas', lat: 13.9200, lon: 121.0522, population: 23042, coastal: false },
  { name: 'Santa Teresita', lat: 13.8508, lon: 121.3711, population: 21690, coastal: true },
  { name: 'Sta. Teresita', lat: 13.8508, lon: 121.3711, population: 21690, coastal: true },
  { name: 'Tuy', lat: 14.0108, lon: 120.7289, population: 46519, coastal: true },
  { name: 'Calatagan', lat: 13.8317, lon: 120.6322, population: 58719, coastal: true }
];

// Philippine coastline points (simplified)
const PH_COASTLINE_POINTS = [
  // Luzon western coast (relevant for Batangas)
  { lat: 14.5, lon: 120.5 },
  { lat: 14.3, lon: 120.6 },
  { lat: 14.1, lon: 120.7 },
  { lat: 13.9, lon: 120.8 },
  { lat: 13.7, lon: 120.9 },
  { lat: 13.5, lon: 121.0 },
  { lat: 13.3, lon: 121.1 },
  // Batangas Bay
  { lat: 13.7, lon: 121.0 },
  { lat: 13.8, lon: 121.1 },
  { lat: 13.9, lon: 121.2 },
  // Eastern Batangas
  { lat: 13.8, lon: 121.4 },
  { lat: 13.7, lon: 121.5 }
];

/**
 * Calculate distance between two points using Haversine formula
 * Returns distance in kilometers
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
 * Calculate bearing between two points
 * Returns bearing in degrees (0-360)
 */
function calculateBearing(lat1, lon1, lat2, lon2) {
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const y = Math.sin(dLon) * Math.cos(lat2 * Math.PI / 180);
  const x = Math.cos(lat1 * Math.PI / 180) * Math.sin(lat2 * Math.PI / 180) -
            Math.sin(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.cos(dLon);

  let bearing = Math.atan2(y, x) * 180 / Math.PI;
  bearing = (bearing + 360) % 360;

  return bearing;
}

/**
 * Calculate speed of typhoon movement
 * Returns speed in km/h
 */
function calculateMovementSpeed(track) {
  if (track.length < 2) return 0;

  const recentPoints = track.slice(-3); // Use last 3 points for average
  let totalDistance = 0;
  let totalTime = 0;

  for (let i = 1; i < recentPoints.length; i++) {
    const prev = recentPoints[i - 1];
    const curr = recentPoints[i];

    const distance = calculateDistance(prev.lat, prev.lon, curr.lat, curr.lon);
    const timeDiff = (new Date(curr.timestamp) - new Date(prev.timestamp)) / (1000 * 60 * 60); // hours

    totalDistance += distance;
    totalTime += timeDiff;
  }

  return totalTime > 0 ? totalDistance / totalTime : 0;
}

/**
 * Predict landfall location and time
 * Uses current position, track history, and forecast to estimate where/when typhoon will hit land
 */
function predictLandfall(typhoon) {
  try {
    const { current, track = [], forecast = [] } = typhoon;

    if (!current || track.length < 2) {
      return {
        willMakeLandfall: false,
        reason: 'Insufficient track data'
      };
    }

    // Calculate typhoon movement vector
    const movementSpeed = calculateMovementSpeed(track);
    const lastPoint = track[track.length - 1];
    const secondLastPoint = track[track.length - 2];
    const bearing = calculateBearing(
      secondLastPoint.lat,
      secondLastPoint.lon,
      lastPoint.lat,
      lastPoint.lon
    );

    // Check forecast points for landfall
    if (forecast.length > 0) {
      for (const forecastPoint of forecast) {
        const closestCoast = findClosestCoastPoint(forecastPoint.lat, forecastPoint.lon);
        const distanceToCoast = closestCoast.distance;

        // If forecast point is very close to coast (within 20km), predict landfall
        if (distanceToCoast < 20) {
          const estimatedTime = new Date(forecastPoint.timestamp);

          return {
            willMakeLandfall: true,
            confidence: 'high',
            location: {
              lat: closestCoast.lat,
              lon: closestCoast.lon,
              name: findNearestCity(closestCoast.lat, closestCoast.lon).name
            },
            estimatedTime: estimatedTime,
            hoursUntilLandfall: forecastPoint.forecastHour,
            impactIntensity: categorizeImpact(forecastPoint.windSpeedKmh || forecastPoint.windSpeed * 1.852),
            approachBearing: Math.round(bearing),
            approachSpeed: Math.round(movementSpeed)
          };
        }
      }
    }

    // If no forecast landfall found, extrapolate from current track
    const currentDistance = findClosestCoastPoint(current.lat, current.lon).distance;

    if (currentDistance > 500) {
      return {
        willMakeLandfall: false,
        reason: 'Typhoon too far from land',
        currentDistanceKm: Math.round(currentDistance)
      };
    }

    // Project future position
    const hoursToCoast = currentDistance / movementSpeed;
    const estimatedTime = new Date(Date.now() + hoursToCoast * 60 * 60 * 1000);

    return {
      willMakeLandfall: true,
      confidence: 'medium',
      location: {
        lat: current.lat,
        lon: current.lon,
        name: 'Projected from current track'
      },
      estimatedTime: estimatedTime,
      hoursUntilLandfall: Math.round(hoursToCoast),
      impactIntensity: categorizeImpact(current.windSpeed),
      approachBearing: Math.round(bearing),
      approachSpeed: Math.round(movementSpeed)
    };

  } catch (error) {
    console.error('Error predicting landfall:', error);
    return { error: 'Failed to predict landfall' };
  }
}

/**
 * Find closest point on Philippine coastline
 */
function findClosestCoastPoint(lat, lon) {
  let minDistance = Infinity;
  let closestPoint = null;

  PH_COASTLINE_POINTS.forEach(point => {
    const distance = calculateDistance(lat, lon, point.lat, point.lon);
    if (distance < minDistance) {
      minDistance = distance;
      closestPoint = point;
    }
  });

  return {
    lat: closestPoint.lat,
    lon: closestPoint.lon,
    distance: minDistance
  };
}

/**
 * Find nearest city to a location
 */
function findNearestCity(lat, lon) {
  let minDistance = Infinity;
  let nearestCity = null;

  BATANGAS_CITIES.forEach(city => {
    const distance = calculateDistance(lat, lon, city.lat, city.lon);
    if (distance < minDistance) {
      minDistance = distance;
      nearestCity = city;
    }
  });

  return nearestCity;
}

/**
 * Categorize storm impact based on wind speed
 */
function categorizeImpact(windSpeedKmh) {
  if (windSpeedKmh >= 220) return 'catastrophic';
  if (windSpeedKmh >= 180) return 'extreme';
  if (windSpeedKmh >= 150) return 'severe';
  if (windSpeedKmh >= 120) return 'high';
  if (windSpeedKmh >= 90) return 'moderate';
  return 'low';
}

/**
 * Calculate affected areas based on typhoon forecast path and wind radii
 */
function calculateAffectedAreas(typhoon) {
  try {
    const { current, forecast = [] } = typhoon;
    const affectedCities = new Set();
    const impactDetails = [];

    // Check current position impact
    BATANGAS_CITIES.forEach(city => {
      const distance = calculateDistance(current.lat, current.lon, city.lat, city.lon);

      // Wind radii: 250km for tropical storm force, 150km for storm force, 80km for typhoon force
      let impactLevel = 'none';
      let windSpeedAtCity = 0;

      if (distance < 80 && current.windSpeed >= 119) {
        impactLevel = 'extreme';
        windSpeedAtCity = current.windSpeed;
      } else if (distance < 150 && current.windSpeed >= 93) {
        impactLevel = 'high';
        windSpeedAtCity = current.windSpeed * 0.7;
      } else if (distance < 250 && current.windSpeed >= 63) {
        impactLevel = 'moderate';
        windSpeedAtCity = current.windSpeed * 0.5;
      }

      if (impactLevel !== 'none') {
        affectedCities.add(city.name);
        impactDetails.push({
          city: city.name,
          population: city.population,
          distanceKm: Math.round(distance),
          impactLevel: impactLevel,
          estimatedWindSpeed: Math.round(windSpeedAtCity),
          isCoastal: city.coastal,
          timeframe: 'current'
        });
      }
    });

    // Check forecast positions
    forecast.forEach(forecastPoint => {
      BATANGAS_CITIES.forEach(city => {
        const distance = calculateDistance(forecastPoint.lat, forecastPoint.lon, city.lat, city.lon);

        let impactLevel = 'none';
        let windSpeedAtCity = 0;
        const forecastWindSpeed = forecastPoint.windSpeedKmh || forecastPoint.windSpeed * 1.852;

        if (distance < 80 && forecastWindSpeed >= 119) {
          impactLevel = 'extreme';
          windSpeedAtCity = forecastWindSpeed;
        } else if (distance < 150 && forecastWindSpeed >= 93) {
          impactLevel = 'high';
          windSpeedAtCity = forecastWindSpeed * 0.7;
        } else if (distance < 250 && forecastWindSpeed >= 63) {
          impactLevel = 'moderate';
          windSpeedAtCity = forecastWindSpeed * 0.5;
        }

        if (impactLevel !== 'none') {
          affectedCities.add(city.name);

          // Only add if not already in current impacts or has higher impact
          const existing = impactDetails.find(d => d.city === city.name);
          if (!existing || getImpactScore(impactLevel) > getImpactScore(existing.impactLevel)) {
            if (existing) {
              const index = impactDetails.indexOf(existing);
              impactDetails.splice(index, 1);
            }

            impactDetails.push({
              city: city.name,
              population: city.population,
              distanceKm: Math.round(distance),
              impactLevel: impactLevel,
              estimatedWindSpeed: Math.round(windSpeedAtCity),
              isCoastal: city.coastal,
              timeframe: `+${forecastPoint.forecastHour}h`,
              estimatedTime: forecastPoint.timestamp
            });
          }
        }
      });
    });

    // Calculate total population at risk
    const totalPopulation = impactDetails.reduce((sum, detail) => sum + detail.population, 0);

    // Sort by impact level (highest first)
    impactDetails.sort((a, b) => getImpactScore(b.impactLevel) - getImpactScore(a.impactLevel));

    return {
      affectedCityCount: affectedCities.size,
      affectedCities: Array.from(affectedCities),
      totalPopulationAtRisk: totalPopulation,
      impactDetails: impactDetails,
      recommendations: generateRecommendations(impactDetails)
    };

  } catch (error) {
    console.error('Error calculating affected areas:', error);
    return { error: 'Failed to calculate affected areas' };
  }
}

/**
 * Get numeric score for impact level (for sorting)
 */
function getImpactScore(level) {
  const scores = {
    'extreme': 4,
    'high': 3,
    'moderate': 2,
    'low': 1,
    'none': 0
  };
  return scores[level] || 0;
}

/**
 * Generate recommendations based on impact analysis
 */
function generateRecommendations(impactDetails) {
  const recommendations = [];

  const extremeImpact = impactDetails.filter(d => d.impactLevel === 'extreme');
  const highImpact = impactDetails.filter(d => d.impactLevel === 'high');
  const coastalImpact = impactDetails.filter(d => d.isCoastal && (d.impactLevel === 'extreme' || d.impactLevel === 'high'));

  if (extremeImpact.length > 0) {
    recommendations.push({
      priority: 'critical',
      action: 'Immediate evacuation recommended',
      areas: extremeImpact.map(d => d.city),
      reason: 'Extreme typhoon force winds expected'
    });
  }

  if (highImpact.length > 0) {
    recommendations.push({
      priority: 'high',
      action: 'Prepare for evacuation',
      areas: highImpact.map(d => d.city),
      reason: 'High winds and heavy rainfall expected'
    });
  }

  if (coastalImpact.length > 0) {
    recommendations.push({
      priority: 'high',
      action: 'Storm surge warning',
      areas: coastalImpact.map(d => d.city),
      reason: 'Coastal areas vulnerable to storm surge and flooding'
    });
  }

  return recommendations;
}

/**
 * Get comprehensive storm impact analysis
 */
async function getStormImpact(typhoon) {
  try {
    const landfallPrediction = predictLandfall(typhoon);
    const affectedAreas = calculateAffectedAreas(typhoon);

    return {
      typhoonId: typhoon.id,
      typhoonName: typhoon.name,
      landfall: landfallPrediction,
      affectedAreas: affectedAreas,
      generatedAt: new Date().toISOString()
    };

  } catch (error) {
    console.error('Error getting storm impact:', error);
    return { error: 'Failed to calculate storm impact' };
  }
}

module.exports = {
  predictLandfall,
  calculateAffectedAreas,
  getStormImpact,
  BATANGAS_CITIES
};
