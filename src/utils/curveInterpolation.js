/**
 * Curve Interpolation Utilities
 * Implements Catmull-Rom spline interpolation for smooth typhoon track visualization
 */

/**
 * Catmull-Rom spline interpolation
 * Creates a smooth curve passing through all control points
 *
 * @param {Array} points - Array of [lat, lon] coordinate pairs
 * @param {number} tension - Tension parameter (0 = loose/smooth, 1 = tight) Default: 0.3
 * @param {number} numSegments - Number of segments between each pair of points
 * @returns {Array} Array of interpolated [lat, lon] points
 */
export function catmullRomSpline(points, tension = 0.3, numSegments = 50) {
  if (!points || points.length < 2) {
    return points || [];
  }

  // For 2 points, create a gentle curve instead of straight line
  if (points.length === 2) {
    return interpolateTwoPoints(points[0], points[1], numSegments);
  }

  const interpolatedPoints = [];

  // Add first point
  interpolatedPoints.push(points[0]);

  // Process each segment between consecutive points
  for (let i = 0; i < points.length - 1; i++) {
    // Get 4 control points for Catmull-Rom
    const p0 = i === 0 ? points[i] : points[i - 1];
    const p1 = points[i];
    const p2 = points[i + 1];
    const p3 = i === points.length - 2 ? points[i + 1] : points[i + 2];

    // Generate interpolated points between p1 and p2
    for (let t = 1; t <= numSegments; t++) {
      const tNorm = t / numSegments;
      const point = interpolateCatmullRom(p0, p1, p2, p3, tNorm, tension);
      interpolatedPoints.push(point);
    }
  }

  return interpolatedPoints;
}

/**
 * Interpolate a single point on a Catmull-Rom curve
 * Using Cardinal spline formulation for better control
 *
 * @param {Array} p0 - Point before start
 * @param {Array} p1 - Start point
 * @param {Array} p2 - End point
 * @param {Array} p3 - Point after end
 * @param {number} t - Parameter from 0 to 1
 * @param {number} tension - Tension parameter (0 = smooth, 1 = tight)
 * @returns {Array} Interpolated [lat, lon] point
 */
function interpolateCatmullRom(p0, p1, p2, p3, t, tension) {
  const t2 = t * t;
  const t3 = t2 * t;

  // Cardinal spline tension (s = (1 - tension) / 2)
  const s = (1 - tension) / 2;

  // Calculate tangents
  const m1_lat = s * (p2[0] - p0[0]);
  const m1_lon = s * (p2[1] - p0[1]);
  const m2_lat = s * (p3[0] - p1[0]);
  const m2_lon = s * (p3[1] - p1[1]);

  // Hermite basis functions
  const h00 = 2 * t3 - 3 * t2 + 1;
  const h10 = t3 - 2 * t2 + t;
  const h01 = -2 * t3 + 3 * t2;
  const h11 = t3 - t2;

  // Interpolate
  const lat = h00 * p1[0] + h10 * m1_lat + h01 * p2[0] + h11 * m2_lat;
  const lon = h00 * p1[1] + h10 * m1_lon + h01 * p2[1] + h11 * m2_lon;

  return [lat, lon];
}

/**
 * Interpolate between two points with a gentle curve
 *
 * @param {Array} p1 - Start point
 * @param {Array} p2 - End point
 * @param {number} numSegments - Number of segments
 * @returns {Array} Interpolated points
 */
function interpolateTwoPoints(p1, p2, numSegments = 30) {
  const points = [p1];

  // Calculate perpendicular offset for natural curve
  const dx = p2[1] - p1[1];
  const dy = p2[0] - p1[0];
  const dist = Math.sqrt(dx * dx + dy * dy);

  // Control point offset (perpendicular to the line)
  const offset = dist * 0.15; // 15% of distance for gentle curve
  const midLat = (p1[0] + p2[0]) / 2;
  const midLon = (p1[1] + p2[1]) / 2;

  // Perpendicular direction
  const perpLat = -dx / dist * offset;
  const perpLon = dy / dist * offset;

  const controlPoint = [midLat + perpLat, midLon + perpLon];

  // Quadratic Bezier interpolation
  for (let i = 1; i <= numSegments; i++) {
    const t = i / numSegments;
    const oneMinusT = 1 - t;

    const lat = oneMinusT * oneMinusT * p1[0] +
                2 * oneMinusT * t * controlPoint[0] +
                t * t * p2[0];

    const lon = oneMinusT * oneMinusT * p1[1] +
                2 * oneMinusT * t * controlPoint[1] +
                t * t * p2[1];

    points.push([lat, lon]);
  }

  return points;
}

/**
 * Alternative: Quadratic Bezier curve (simpler, less smooth)
 * Useful for forecast tracks where we want gentler curves
 *
 * @param {Array} points - Array of [lat, lon] coordinate pairs
 * @param {number} numSegments - Number of segments between each pair of points
 * @returns {Array} Array of interpolated [lat, lon] points
 */
export function quadraticBezier(points, numSegments = 15) {
  if (!points || points.length < 2) {
    return points || [];
  }

  if (points.length === 2) {
    return points;
  }

  const interpolatedPoints = [];
  interpolatedPoints.push(points[0]);

  // Process pairs of points
  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[i];
    const p2 = points[i + 1];

    // Create a control point between p0 and p2
    // Offset it perpendicular to the line for natural curve
    const midLat = (p0[0] + p2[0]) / 2;
    const midLon = (p0[1] + p2[1]) / 2;

    // Calculate perpendicular offset (very subtle for natural look)
    const dx = p2[1] - p0[1];
    const dy = p2[0] - p0[0];
    const perpLat = midLat + dy * 0.1;
    const perpLon = midLon - dx * 0.1;

    const p1 = [perpLat, perpLon];

    // Generate curve points
    for (let t = 0; t <= numSegments; t++) {
      const tNorm = t / numSegments;
      const point = interpolateQuadraticBezier(p0, p1, p2, tNorm);

      if (t > 0) {
        interpolatedPoints.push(point);
      }
    }
  }

  return interpolatedPoints;
}

/**
 * Interpolate a single point on a quadratic Bezier curve
 */
function interpolateQuadraticBezier(p0, p1, p2, t) {
  const oneMinusT = 1 - t;

  const lat = oneMinusT * oneMinusT * p0[0] +
              2 * oneMinusT * t * p1[0] +
              t * t * p2[0];

  const lon = oneMinusT * oneMinusT * p0[1] +
              2 * oneMinusT * t * p1[1] +
              t * t * p2[1];

  return [lat, lon];
}

/**
 * Smooth path using averaging (simple approach)
 * Useful for subtle smoothing without changing the path too much
 *
 * @param {Array} points - Array of [lat, lon] coordinate pairs
 * @param {number} iterations - Number of smoothing passes
 * @returns {Array} Smoothed points
 */
export function smoothPath(points, iterations = 1) {
  if (!points || points.length < 3) {
    return points || [];
  }

  let smoothed = [...points];

  for (let iter = 0; iter < iterations; iter++) {
    const newPoints = [smoothed[0]]; // Keep first point fixed

    for (let i = 1; i < smoothed.length - 1; i++) {
      // Average with neighbors
      const prevPoint = smoothed[i - 1];
      const currPoint = smoothed[i];
      const nextPoint = smoothed[i + 1];

      const avgLat = (prevPoint[0] + currPoint[0] + nextPoint[0]) / 3;
      const avgLon = (prevPoint[1] + currPoint[1] + nextPoint[1]) / 3;

      newPoints.push([avgLat, avgLon]);
    }

    newPoints.push(smoothed[smoothed.length - 1]); // Keep last point fixed
    smoothed = newPoints;
  }

  return smoothed;
}

/**
 * Get a subset of track points up to a specific date/time
 * Used for timeline scrubbing functionality
 *
 * @param {Array} track - Full track array with timestamp property
 * @param {Date} selectedDate - Date to filter up to
 * @returns {Array} Filtered track points
 */
export function getTrackUpToDate(track, selectedDate) {
  if (!track || !selectedDate) {
    return track || [];
  }

  const targetTime = selectedDate.getTime();

  return track.filter(point => {
    if (!point.timestamp) return true;
    const pointTime = new Date(point.timestamp).getTime();
    return pointTime <= targetTime;
  });
}

/**
 * Interpolate position at a specific timestamp
 * Useful for smooth animation between track points
 *
 * @param {Array} track - Track array with timestamp property
 * @param {Date} targetDate - Target date to interpolate position
 * @returns {Object|null} Interpolated position with lat, lon, and interpolated data
 */
export function interpolatePositionAtTime(track, targetDate) {
  if (!track || track.length === 0 || !targetDate) {
    return null;
  }

  const targetTime = targetDate.getTime();

  // Find the two points that bracket the target time
  let beforePoint = null;
  let afterPoint = null;

  for (let i = 0; i < track.length - 1; i++) {
    const currentTime = new Date(track[i].timestamp).getTime();
    const nextTime = new Date(track[i + 1].timestamp).getTime();

    if (currentTime <= targetTime && targetTime <= nextTime) {
      beforePoint = track[i];
      afterPoint = track[i + 1];
      break;
    }
  }

  // If target time is before first point, return first point
  if (!beforePoint && targetTime < new Date(track[0].timestamp).getTime()) {
    return track[0];
  }

  // If target time is after last point, return last point
  if (!afterPoint) {
    return track[track.length - 1];
  }

  // Linear interpolation between the two points
  const beforeTime = new Date(beforePoint.timestamp).getTime();
  const afterTime = new Date(afterPoint.timestamp).getTime();
  const ratio = (targetTime - beforeTime) / (afterTime - beforeTime);

  return {
    lat: beforePoint.lat + (afterPoint.lat - beforePoint.lat) * ratio,
    lon: beforePoint.lon + (afterPoint.lon - beforePoint.lon) * ratio,
    windSpeed: Math.round(beforePoint.windSpeedKmh + (afterPoint.windSpeedKmh - beforePoint.windSpeedKmh) * ratio),
    windSpeedKmh: Math.round(beforePoint.windSpeedKmh + (afterPoint.windSpeedKmh - beforePoint.windSpeedKmh) * ratio),
    pressure: Math.round(beforePoint.pressure + (afterPoint.pressure - beforePoint.pressure) * ratio),
    timestamp: targetDate.toISOString(),
    interpolated: true
  };
}
