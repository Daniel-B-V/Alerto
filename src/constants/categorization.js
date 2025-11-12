/**
 * ALERTO CATEGORIZATION SYSTEM
 *
 * Centralized constants for all categorization systems used throughout the application.
 * This is the single source of truth for categories, severity levels, colors, and thresholds.
 *
 * Last Updated: 2025-01-09
 */

// ============================================================================
// REPORT CATEGORIES
// ============================================================================

/**
 * Report Category Types
 * Used for classifying weather-related incidents and reports
 */
export const CATEGORIES = {
  FLOODING: 'flooding',
  HEAVY_RAIN: 'heavy_rain',
  STRONG_WIND: 'strong_wind',
  TYPHOON: 'typhoon',
  LANDSLIDE: 'landslide',
  ROAD_BLOCKAGE: 'road_blockage',
  POWER_OUTAGE: 'power_outage',
  INFRASTRUCTURE_DAMAGE: 'infrastructure_damage',
  OTHER: 'other',
};

/**
 * Category Display Names and Metadata
 */
export const CATEGORY_CONFIG = {
  [CATEGORIES.FLOODING]: {
    label: 'Flooding',
    emoji: '🌊',
    description: 'Water accumulation causing flooding in roads, homes, or communities',
    color: '#3b82f6', // blue-500
  },
  [CATEGORIES.HEAVY_RAIN]: {
    label: 'Heavy Rain',
    emoji: '🌧️',
    description: 'Intense rainfall that may lead to flooding or other hazards',
    color: '#0ea5e9', // sky-500
  },
  [CATEGORIES.STRONG_WIND]: {
    label: 'Strong Wind',
    emoji: '💨',
    description: 'High wind speeds causing damage or hazardous conditions',
    color: '#8b5cf6', // violet-500
  },
  [CATEGORIES.TYPHOON]: {
    label: 'Typhoon/Storm',
    emoji: '🌀',
    description: 'Tropical cyclone or severe storm system',
    color: '#ef4444', // red-500
  },
  [CATEGORIES.LANDSLIDE]: {
    label: 'Landslide',
    emoji: '⛰️',
    description: 'Ground movement, mudslides, or slope failures',
    color: '#f59e0b', // amber-500
  },
  [CATEGORIES.ROAD_BLOCKAGE]: {
    label: 'Road Blockage',
    emoji: '🚧',
    description: 'Roads blocked due to debris, flooding, or other obstructions',
    color: '#f97316', // orange-500
  },
  [CATEGORIES.POWER_OUTAGE]: {
    label: 'Power Outage',
    emoji: '⚡',
    description: 'Loss of electrical power affecting areas or communities',
    color: '#eab308', // yellow-500
  },
  [CATEGORIES.INFRASTRUCTURE_DAMAGE]: {
    label: 'Infrastructure Damage',
    emoji: '🏗️',
    description: 'Damage to bridges, buildings, utilities, or public infrastructure',
    color: '#06b6d4', // cyan-500
  },
  [CATEGORIES.OTHER]: {
    label: 'Other',
    emoji: '📋',
    description: 'Other weather-related incidents not covered by specific categories',
    color: '#6b7280', // gray-500
  },
};

/**
 * Get array of all category values for validation
 */
export const CATEGORY_VALUES = Object.values(CATEGORIES);

// ============================================================================
// SEVERITY LEVELS
// ============================================================================

/**
 * Severity/Risk Levels
 * 5-level system from Safe to Critical
 */
export const SEVERITY = {
  SAFE: 'safe',
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high',
  CRITICAL: 'critical',
};

/**
 * Severity Level Configuration with Colors and Descriptions
 */
export const SEVERITY_CONFIG = {
  [SEVERITY.SAFE]: {
    label: 'Safe',
    shortLabel: 'Safe',
    color: '#16a34a', // green-600
    bgClass: 'bg-green-600',
    textClass: 'text-green-600',
    borderClass: 'border-green-600',
    badgeClass: 'bg-green-600 text-white',
    description: 'Normal conditions, no immediate risk',
    priority: 0,
  },
  [SEVERITY.LOW]: {
    label: 'Low Risk',
    shortLabel: 'Low',
    color: '#3b82f6', // blue-500
    bgClass: 'bg-blue-500',
    textClass: 'text-blue-500',
    borderClass: 'border-blue-500',
    badgeClass: 'bg-blue-500 text-white',
    description: 'Minor concern, monitoring recommended',
    priority: 1,
  },
  [SEVERITY.MEDIUM]: {
    label: 'Moderate',
    shortLabel: 'Moderate',
    color: '#eab308', // yellow-500
    bgClass: 'bg-yellow-500',
    textClass: 'text-yellow-600',
    borderClass: 'border-yellow-500',
    badgeClass: 'bg-yellow-500 text-white',
    description: 'Moderate risk, caution advised',
    priority: 2,
  },
  [SEVERITY.HIGH]: {
    label: 'High Risk',
    shortLabel: 'High',
    color: '#ea580c', // orange-600
    bgClass: 'bg-orange-600',
    textClass: 'text-orange-600',
    borderClass: 'border-orange-600',
    badgeClass: 'bg-orange-600 text-white',
    description: 'Significant risk, immediate action may be needed',
    priority: 3,
  },
  [SEVERITY.CRITICAL]: {
    label: 'CRITICAL',
    shortLabel: 'Critical',
    color: '#dc2626', // red-600
    bgClass: 'bg-red-600',
    textClass: 'text-red-600',
    borderClass: 'border-red-600',
    badgeClass: 'bg-red-600 text-white',
    description: 'Life-threatening conditions, urgent action required',
    priority: 4,
  },
};

/**
 * Get array of all severity values for validation
 * Note: 'safe' is calculated dynamically, not stored in database
 */
export const SEVERITY_VALUES = Object.values(SEVERITY);

/**
 * Database-storable severity values (excludes 'safe')
 */
export const DATABASE_SEVERITY_VALUES = [
  SEVERITY.LOW,
  SEVERITY.MEDIUM,
  SEVERITY.HIGH,
  SEVERITY.CRITICAL,
];

// ============================================================================
// WEATHER THRESHOLDS
// ============================================================================

/**
 * Weather Condition Thresholds for Severity Calculation
 * Based on rainfall (mm/h) and wind speed (km/h)
 */
export const WEATHER_THRESHOLDS = {
  rainfall: {
    [SEVERITY.CRITICAL]: 30, // >= 30 mm/h
    [SEVERITY.HIGH]: 20,     // >= 20 mm/h
    [SEVERITY.MEDIUM]: 10,   // >= 10 mm/h
    [SEVERITY.LOW]: 5,       // >= 5 mm/h
    [SEVERITY.SAFE]: 0,      // < 5 mm/h
  },
  windSpeed: {
    [SEVERITY.CRITICAL]: 55, // >= 55 km/h (Typhoon force)
    [SEVERITY.HIGH]: 40,     // >= 40 km/h (Strong wind)
    [SEVERITY.MEDIUM]: 30,   // >= 30 km/h (Moderate wind)
    [SEVERITY.LOW]: 20,      // >= 20 km/h (Light wind)
    [SEVERITY.SAFE]: 0,      // < 20 km/h
  },
  temperature: {
    extremeHeat: 40,  // >= 40°C (Extreme heat)
    highHeat: 35,     // >= 35°C (High heat)
    extremeCold: 10,  // <= 10°C (Extreme cold - rare in PH)
  },
  humidity: {
    veryHigh: 80,     // >= 80% (Very high)
    high: 60,         // >= 60% (High)
    normal: 40,       // >= 40% (Normal)
  },
};

/**
 * Calculate severity level based on weather conditions
 * @param {number} rainfall - Rainfall in mm/h
 * @param {number} windSpeed - Wind speed in km/h
 * @returns {string} Severity level
 */
export const calculateWeatherSeverity = (rainfall, windSpeed) => {
  // Critical: Either extreme rainfall or extreme wind
  if (rainfall >= WEATHER_THRESHOLDS.rainfall[SEVERITY.CRITICAL] ||
      windSpeed >= WEATHER_THRESHOLDS.windSpeed[SEVERITY.CRITICAL]) {
    return SEVERITY.CRITICAL;
  }

  // High: Either high rainfall or high wind
  if (rainfall >= WEATHER_THRESHOLDS.rainfall[SEVERITY.HIGH] ||
      windSpeed >= WEATHER_THRESHOLDS.windSpeed[SEVERITY.HIGH]) {
    return SEVERITY.HIGH;
  }

  // Medium: Either medium rainfall or medium wind
  if (rainfall >= WEATHER_THRESHOLDS.rainfall[SEVERITY.MEDIUM] ||
      windSpeed >= WEATHER_THRESHOLDS.windSpeed[SEVERITY.MEDIUM]) {
    return SEVERITY.MEDIUM;
  }

  // Low: Either low rainfall or low wind
  if (rainfall >= WEATHER_THRESHOLDS.rainfall[SEVERITY.LOW] ||
      windSpeed >= WEATHER_THRESHOLDS.windSpeed[SEVERITY.LOW]) {
    return SEVERITY.LOW;
  }

  // Safe: Below all thresholds
  return SEVERITY.SAFE;
};

// ============================================================================
// REPORT STATUS
// ============================================================================

/**
 * Report Verification Status
 * Note: 'pending' removed - all reports are auto-verified by AI
 */
export const REPORT_STATUS = {
  VERIFIED: 'verified',
  INVESTIGATING: 'investigating',
  RESOLVED: 'resolved',
  FALSE_REPORT: 'false_report',
};

/**
 * Report Status Configuration
 */
export const STATUS_CONFIG = {
  [REPORT_STATUS.VERIFIED]: {
    label: 'Verified',
    color: '#16a34a', // green-600
    bgClass: 'bg-green-600',
    textClass: 'text-green-600',
    badgeClass: 'bg-green-600 text-white',
    description: 'Report verified and confirmed',
  },
  [REPORT_STATUS.INVESTIGATING]: {
    label: 'Investigating',
    color: '#3b82f6', // blue-500
    bgClass: 'bg-blue-500',
    textClass: 'text-blue-500',
    badgeClass: 'bg-blue-500 text-white',
    description: 'Report under investigation',
  },
  [REPORT_STATUS.RESOLVED]: {
    label: 'Resolved',
    color: '#6b7280', // gray-500
    bgClass: 'bg-gray-500',
    textClass: 'text-gray-500',
    badgeClass: 'bg-gray-500 text-white',
    description: 'Situation resolved',
  },
  [REPORT_STATUS.FALSE_REPORT]: {
    label: 'False Report',
    color: '#dc2626', // red-600
    bgClass: 'bg-red-600',
    textClass: 'text-red-600',
    badgeClass: 'bg-red-600 text-white',
    description: 'Report marked as false or invalid',
  },
};

/**
 * Get array of all status values for validation
 */
export const STATUS_VALUES = Object.values(REPORT_STATUS);

// ============================================================================
// WEATHER ALERT TYPES
// ============================================================================

/**
 * Weather Alert Types
 */
export const WEATHER_ALERT_TYPES = {
  STORM: 'storm',
  FLOOD: 'flood',
  HEAT: 'heat',
  COLD: 'cold',
  WIND: 'wind',
  RAIN: 'rain',
};

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Get category configuration by value
 * @param {string} category - Category value
 * @returns {object} Category configuration object
 */
export const getCategoryConfig = (category) => {
  return CATEGORY_CONFIG[category] || CATEGORY_CONFIG[CATEGORIES.OTHER];
};

/**
 * Get severity configuration by value
 * @param {string} severity - Severity value
 * @returns {object} Severity configuration object
 */
export const getSeverityConfig = (severity) => {
  return SEVERITY_CONFIG[severity] || SEVERITY_CONFIG[SEVERITY.LOW];
};

/**
 * Get status configuration by value
 * @param {string} status - Status value
 * @returns {object} Status configuration object
 */
export const getStatusConfig = (status) => {
  return STATUS_CONFIG[status] || STATUS_CONFIG[REPORT_STATUS.VERIFIED];
};

/**
 * Get category label without emoji
 * @param {string} category - Category value
 * @returns {string} Category label
 */
export const getCategoryLabel = (category) => {
  return getCategoryConfig(category).label;
};

/**
 * Get category with emoji
 * @param {string} category - Category value
 * @returns {string} Category label with emoji
 */
export const getCategoryLabelWithEmoji = (category) => {
  const config = getCategoryConfig(category);
  return `${config.emoji} ${config.label}`;
};

/**
 * Sort severity levels by priority (safe -> critical)
 * @param {string} a - First severity level
 * @param {string} b - Second severity level
 * @returns {number} Sort order
 */
export const sortBySeverityPriority = (a, b) => {
  const priorityA = SEVERITY_CONFIG[a]?.priority || 0;
  const priorityB = SEVERITY_CONFIG[b]?.priority || 0;
  return priorityA - priorityB;
};

// ============================================================================
// EXPORT DEFAULT
// ============================================================================

export default {
  CATEGORIES,
  CATEGORY_CONFIG,
  CATEGORY_VALUES,
  SEVERITY,
  SEVERITY_CONFIG,
  SEVERITY_VALUES,
  DATABASE_SEVERITY_VALUES,
  WEATHER_THRESHOLDS,
  calculateWeatherSeverity,
  REPORT_STATUS,
  STATUS_CONFIG,
  STATUS_VALUES,
  WEATHER_ALERT_TYPES,
  getCategoryConfig,
  getSeverityConfig,
  getStatusConfig,
  getCategoryLabel,
  getCategoryLabelWithEmoji,
  sortBySeverityPriority,
};
