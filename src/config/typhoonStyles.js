/**
 * Professional Typhoon Visualization Styles
 * Based on NOAA/JTWC/PAGASA meteorological standards
 */

/**
 * Intensity-based colors following Saffir-Simpson scale
 */
export const INTENSITY_COLORS = {
  // Tropical Depression (TD) - <34 knots
  TD: {
    color: '#5EBAFF',
    name: 'Tropical Depression',
    markerSize: 10,
    lineWeight: 4
  },
  // Tropical Storm (TS) - 34-63 knots
  TS: {
    color: '#00FAFA',
    name: 'Tropical Storm',
    markerSize: 12,
    lineWeight: 5
  },
  // Severe Tropical Storm (STS) - 48-63 knots (JMA)
  STS: {
    color: '#FFFF00',
    name: 'Severe Tropical Storm',
    markerSize: 14,
    lineWeight: 5
  },
  // Typhoon Category 1-2 - 64-95 knots
  TY_WEAK: {
    color: '#FFA500',
    name: 'Typhoon',
    markerSize: 16,
    lineWeight: 6
  },
  // Typhoon Category 3-4 - 96-136 knots
  TY_STRONG: {
    color: '#FF6060',
    name: 'Strong Typhoon',
    markerSize: 18,
    lineWeight: 7
  },
  // Super Typhoon Category 5 - >137 knots
  SUPER_TY: {
    color: '#FF0040',
    name: 'Super Typhoon',
    markerSize: 20,
    lineWeight: 8
  }
};

/**
 * Get intensity classification from wind speed in knots
 */
export function getIntensityStyle(windSpeedKnots) {
  if (windSpeedKnots < 34) {
    return INTENSITY_COLORS.TD;
  } else if (windSpeedKnots < 48) {
    return INTENSITY_COLORS.TS;
  } else if (windSpeedKnots < 64) {
    return INTENSITY_COLORS.STS;
  } else if (windSpeedKnots < 96) {
    return INTENSITY_COLORS.TY_WEAK;
  } else if (windSpeedKnots < 137) {
    return INTENSITY_COLORS.TY_STRONG;
  } else {
    return INTENSITY_COLORS.SUPER_TY;
  }
}

/**
 * Historical track line styling (past positions)
 */
export const HISTORICAL_TRACK_STYLE = {
  weight: 6,
  opacity: 1,
  dashArray: null, // Solid line
  shadowWeight: 10,
  shadowColor: '#000000',
  shadowOpacity: 0.3,
  outlineWeight: 8,
  outlineColor: '#FFFFFF'
};

/**
 * Forecast track line styling (future positions)
 */
export const FORECAST_TRACK_STYLE = {
  weight: 5,
  opacity: 0.8,
  dashArray: '15, 10', // Dashed line
  shadowWeight: 8,
  shadowColor: '#000000',
  shadowOpacity: 0.2,
  outlineWeight: 7,
  outlineColor: '#FFFFFF'
};

/**
 * Past position marker styling
 */
export const PAST_MARKER_STYLE = {
  radius: 10,
  fillOpacity: 1,
  color: '#FFFFFF',
  weight: 3
};

/**
 * Forecast position marker styling
 */
export const FORECAST_MARKER_STYLE = {
  radius: 9,
  fillOpacity: 0.5,
  weight: 3,
  dashArray: '5, 5'
};

/**
 * Current position marker styling
 */
export const CURRENT_MARKER_STYLE = {
  size: 48,
  pulseAnimation: true
};

/**
 * Forecast cone styling (cone of uncertainty)
 */
export const FORECAST_CONE_STYLE = {
  fillColor: '#FFFFFF',
  fillOpacity: 0.35,
  color: '#FF0000',
  weight: 2.5,
  opacity: 0.8,
  dashArray: '8, 6'
};

/**
 * NOAA/NHC Standard Forecast Error Radii
 * Based on 5-year average forecast errors (in nautical miles)
 */
export const FORECAST_ERROR_RADII = {
  12: 35,   // 12 hours: ±35 nm
  24: 60,   // 24 hours: ±60 nm
  36: 85,   // 36 hours: ±85 nm
  48: 105,  // 48 hours: ±105 nm
  72: 145,  // 72 hours: ±145 nm
  96: 185,  // 96 hours: ±185 nm
  120: 225  // 120 hours: ±225 nm
};

/**
 * Convert nautical miles to kilometers
 */
export function nmToKm(nm) {
  return nm * 1.852;
}

/**
 * Get forecast cone radius for a given forecast hour (interpolated)
 */
export function getConeRadius(forecastHour) {
  const hours = Object.keys(FORECAST_ERROR_RADII).map(Number).sort((a, b) => a - b);

  // Clamp to range
  if (forecastHour <= hours[0]) {
    return nmToKm(FORECAST_ERROR_RADII[hours[0]]);
  }
  if (forecastHour >= hours[hours.length - 1]) {
    return nmToKm(FORECAST_ERROR_RADII[hours[hours.length - 1]]);
  }

  // Find bracketing hours
  let lowerHour = hours[0];
  let upperHour = hours[hours.length - 1];

  for (let i = 0; i < hours.length - 1; i++) {
    if (forecastHour >= hours[i] && forecastHour <= hours[i + 1]) {
      lowerHour = hours[i];
      upperHour = hours[i + 1];
      break;
    }
  }

  // Linear interpolation
  const lowerRadius = FORECAST_ERROR_RADII[lowerHour];
  const upperRadius = FORECAST_ERROR_RADII[upperHour];
  const ratio = (forecastHour - lowerHour) / (upperHour - lowerHour);
  const radiusNm = lowerRadius + (upperRadius - lowerRadius) * ratio;

  return nmToKm(radiusNm);
}

/**
 * Layer z-index ordering for proper visual hierarchy
 */
export const LAYER_ORDER = {
  FORECAST_CONE: 400,
  FORECAST_TRACK: 500,
  HISTORICAL_TRACK: 600,
  WIND_RADII: 650,
  PAST_MARKERS: 700,
  FORECAST_MARKERS: 750,
  CURRENT_MARKER: 800,
  TIME_LABELS: 850
};
