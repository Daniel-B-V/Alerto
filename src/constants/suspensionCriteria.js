/**
 * Suspension Criteria Constants
 * Based on DepEd Order No. 022, s. 2024 and PAGASA Rainfall Warning System
 */

// PAGASA Rainfall Warning System
export const PAGASA_WARNINGS = {
  YELLOW: {
    id: 'yellow',
    label: 'Yellow Warning',
    threshold: 7.5, // mm/hour
    maxThreshold: 15, // mm/hour
    duration: 2, // hours
    suspensionLevels: ['preschool', 'k12'], // Only ECCD and K-12
    color: '#FFA500',
    bgColor: '#FFF4E6',
    icon: '🟡',
    hazard: 'Slight flooding in low-lying areas',
    description: 'Rainfall of 7.5-15 mm/hour for at least 2 hours'
  },
  ORANGE: {
    id: 'orange',
    label: 'Orange Warning',
    threshold: 15, // mm/hour
    maxThreshold: 30, // mm/hour
    duration: 2, // hours
    suspensionLevels: ['all'], // Automatic suspension at ALL levels
    color: '#FF6B00',
    bgColor: '#FFF0E6',
    icon: '🟠',
    hazard: 'Flooding threat in low-lying areas and near rivers',
    description: 'Rainfall of 15-30 mm/hour for at least 2 hours',
    autoSuspend: true
  },
  RED: {
    id: 'red',
    label: 'Red Warning',
    threshold: 30, // mm/hour
    maxThreshold: Infinity,
    duration: 2, // hours
    suspensionLevels: ['all'], // Automatic suspension at ALL levels
    color: '#DC2626',
    bgColor: '#FEE2E2',
    icon: '🔴',
    hazard: 'Serious flooding expected - evacuation may be necessary',
    description: 'Rainfall of 30+ mm/hour for at least 2 hours',
    autoSuspend: true
  }
};

// Tropical Cyclone Wind Signal (TCWS) - DepEd Order 022
export const TCWS_LEVELS = {
  1: {
    label: 'Signal No. 1',
    windSpeed: { min: 39, max: 61 }, // km/h
    autoSuspend: true, // As per DepEd Order 022, s. 2024 - ANY TCWS triggers suspension
    suspensionLevels: ['all'],
    color: '#FFA500',
    icon: '🌬️',
    description: 'Winds 39-61 km/h - Classes suspended'
  },
  2: {
    label: 'Signal No. 2',
    windSpeed: { min: 62, max: 88 },
    autoSuspend: true,
    suspensionLevels: ['all'],
    color: '#FF6B00',
    icon: '💨',
    description: 'Winds 62-88 km/h - Classes suspended'
  },
  3: {
    label: 'Signal No. 3',
    windSpeed: { min: 89, max: 117 },
    autoSuspend: true,
    suspensionLevels: ['all'],
    color: '#DC2626',
    icon: '🌪️',
    description: 'Winds 89-117 km/h - Classes suspended'
  },
  4: {
    label: 'Signal No. 4',
    windSpeed: { min: 118, max: 184 },
    autoSuspend: true,
    suspensionLevels: ['all'],
    color: '#991B1B',
    icon: '🌀',
    description: 'Winds 118-184 km/h - Classes suspended'
  },
  5: {
    label: 'Signal No. 5',
    windSpeed: { min: 185, max: Infinity },
    autoSuspend: true,
    suspensionLevels: ['all'],
    color: '#7F1D1D',
    icon: '🌀',
    description: 'Winds 185+ km/h - Classes suspended'
  }
};

// Suspension Levels (What can be suspended)
export const SUSPENSION_LEVELS = [
  {
    id: 'preschool',
    label: 'Preschool/ECCD',
    shortLabel: 'Preschool',
    description: 'Early Childhood Care and Development programs',
    order: 1
  },
  {
    id: 'k12',
    label: 'K-12 Basic Education',
    shortLabel: 'K-12',
    description: 'Kindergarten through Grade 12',
    order: 2
  },
  {
    id: 'college',
    label: 'College/University',
    shortLabel: 'College',
    description: 'Higher education institutions',
    order: 3
  },
  {
    id: 'work',
    label: 'Government Work',
    shortLabel: 'Work',
    description: 'Government offices and services',
    order: 4
  },
  {
    id: 'activities',
    label: 'Public Activities',
    shortLabel: 'Activities',
    description: 'Public gatherings and outdoor events',
    order: 5
  }
];

// DepEd Order 022 Automatic Suspension Criteria
export const DEPED_AUTO_SUSPEND_CRITERIA = {
  // Any TCWS level (1-5) triggers automatic suspension
  TCWS_ANY: {
    enabled: true,
    description: 'Any Tropical Cyclone Wind Signal (1-5) triggers automatic suspension',
    levels: ['all']
  },
  // Orange rainfall warning
  ORANGE_WARNING: {
    enabled: true,
    description: 'Orange Rainfall Warning (15-30mm/h) triggers automatic suspension',
    levels: ['all']
  },
  // Red rainfall warning
  RED_WARNING: {
    enabled: true,
    description: 'Red Rainfall Warning (30+mm/h) triggers automatic suspension',
    levels: ['all']
  },
  // Yellow warning only for ECCD and K-12
  YELLOW_WARNING: {
    enabled: true,
    description: 'Yellow Rainfall Warning (7.5-15mm/h) triggers suspension for ECCD and K-12 only',
    levels: ['preschool', 'k12']
  }
};

// Risk Level Definitions
export const RISK_LEVELS = {
  SAFE: {
    id: 'safe',
    label: 'Safe',
    color: '#10B981',
    bgColor: '#D1FAE5',
    icon: '✓',
    aiConfidenceRange: [0, 30],
    suspensionRecommended: false
  },
  LOW: {
    id: 'low',
    label: 'Low Risk',
    color: '#3B82F6',
    bgColor: '#DBEAFE',
    icon: 'ℹ️',
    aiConfidenceRange: [31, 50],
    suspensionRecommended: false
  },
  MODERATE: {
    id: 'moderate',
    label: 'Moderate Risk',
    color: '#F59E0B',
    bgColor: '#FEF3C7',
    icon: '⚠️',
    aiConfidenceRange: [51, 70],
    suspensionRecommended: false
  },
  HIGH: {
    id: 'high',
    label: 'High Risk',
    color: '#EF4444',
    bgColor: '#FEE2E2',
    icon: '⚠️',
    aiConfidenceRange: [71, 85],
    suspensionRecommended: true
  },
  CRITICAL: {
    id: 'critical',
    label: 'Critical',
    color: '#DC2626',
    bgColor: '#FEE2E2',
    icon: '🚨',
    aiConfidenceRange: [86, 100],
    suspensionRecommended: true
  }
};

// Suspension Status
export const SUSPENSION_STATUS = {
  ACTIVE: {
    id: 'active',
    label: 'Active',
    color: '#DC2626',
    bgColor: '#FEE2E2',
    icon: '🚨',
    description: 'Suspension is currently in effect'
  },
  SCHEDULED: {
    id: 'scheduled',
    label: 'Scheduled',
    color: '#F59E0B',
    bgColor: '#FEF3C7',
    icon: '⏰',
    description: 'Suspension scheduled for future'
  },
  LIFTED: {
    id: 'lifted',
    label: 'Lifted',
    color: '#10B981',
    bgColor: '#D1FAE5',
    icon: '✓',
    description: 'Suspension has been lifted'
  },
  EXPIRED: {
    id: 'expired',
    label: 'Expired',
    color: '#6B7280',
    bgColor: '#F3F4F6',
    icon: '⏱️',
    description: 'Suspension period has ended'
  }
};

// Weather Condition Status (for reevaluation)
export const WEATHER_CONDITION_STATUS = {
  IMPROVING: {
    id: 'improving',
    label: 'Improving',
    color: '#10B981',
    icon: '🟢',
    description: 'Weather conditions are improving'
  },
  STABLE: {
    id: 'stable',
    label: 'Stable',
    color: '#F59E0B',
    icon: '🟠',
    description: 'Weather conditions remain stable'
  },
  WORSENING: {
    id: 'worsening',
    label: 'Worsening',
    color: '#DC2626',
    icon: '🔴',
    description: 'Weather conditions are worsening'
  }
};

// LGU Roles
export const LGU_ROLES = {
  GOVERNOR: {
    id: 'governor',
    label: 'Provincial Governor',
    permissions: ['issue_suspension', 'lift_suspension', 'view_all', 'override_ai'],
    jurisdiction: 'province',
    icon: '👑'
  },
  MAYOR: {
    id: 'mayor',
    label: 'City/Municipal Mayor',
    permissions: ['request_suspension', 'view_own_city', 'issue_if_delegated'],
    jurisdiction: 'city',
    icon: '🧑‍⚖️'
  },
  DEPED_OFFICIAL: {
    id: 'deped',
    label: 'DepEd Official',
    permissions: ['view_all', 'provide_input'],
    jurisdiction: 'educational',
    icon: '📚'
  },
  PAGASA_OFFICIAL: {
    id: 'pagasa',
    label: 'PAGASA Representative',
    permissions: ['view_all', 'provide_weather_input'],
    jurisdiction: 'weather',
    icon: '🌦️'
  }
};

// AI Recommendation Actions
export const AI_ACTIONS = {
  SUSPEND_NOW: {
    id: 'suspend_now',
    label: 'SUSPEND',
    color: '#DC2626',
    bgColor: '#FEE2E2',
    icon: '🚨',
    description: 'Immediate suspension recommended'
  },
  MONITOR: {
    id: 'monitor',
    label: 'MONITOR',
    color: '#F59E0B',
    bgColor: '#FEF3C7',
    icon: '👁️',
    description: 'Monitor conditions closely'
  },
  SAFE: {
    id: 'safe',
    label: 'SAFE',
    color: '#10B981',
    bgColor: '#D1FAE5',
    icon: '✓',
    description: 'No suspension needed'
  }
};

// Batangas Cities and Municipalities
export const BATANGAS_LOCATIONS = [
  'Agoncillo',
  'Alitagtag',
  'Balayan',
  'Balete',
  'Batangas City',
  'Bauan',
  'Calaca',
  'Calatagan',
  'Cuenca',
  'Ibaan',
  'Laurel',
  'Lemery',
  'Lian',
  'Lipa City',
  'Lobo',
  'Mabini',
  'Malvar',
  'Mataas na Kahoy',
  'Nasugbu',
  'Padre Garcia',
  'Rosario',
  'San Jose',
  'San Juan',
  'San Luis',
  'San Nicolas',
  'San Pascual',
  'Santa Teresita',
  'Santo Tomas',
  'Taal',
  'Talisay',
  'Tanauan City',
  'Taysan',
  'Tingloy',
  'Tuy'
];

// Helper Functions

/**
 * Determine PAGASA warning level based on rainfall
 * @param {number} rainfall - Rainfall in mm/hour
 * @returns {object|null} PAGASA warning object or null
 */
export const getRainfallWarningLevel = (rainfall) => {
  if (!rainfall || rainfall < PAGASA_WARNINGS.YELLOW.threshold) {
    return null;
  }

  if (rainfall >= PAGASA_WARNINGS.RED.threshold) {
    return PAGASA_WARNINGS.RED;
  }

  if (rainfall >= PAGASA_WARNINGS.ORANGE.threshold) {
    return PAGASA_WARNINGS.ORANGE;
  }

  if (rainfall >= PAGASA_WARNINGS.YELLOW.threshold) {
    return PAGASA_WARNINGS.YELLOW;
  }

  return null;
};

/**
 * Determine TCWS level based on wind speed
 * @param {number} windSpeed - Wind speed in km/h
 * @returns {object|null} TCWS object or null
 */
export const getTCWSLevel = (windSpeed) => {
  if (!windSpeed) return null;

  for (const [level, data] of Object.entries(TCWS_LEVELS)) {
    if (windSpeed >= data.windSpeed.min && windSpeed <= data.windSpeed.max) {
      return { level: parseInt(level), ...data };
    }
  }

  return null;
};

/**
 * Check if conditions meet DepEd auto-suspend criteria
 * @param {object} weatherData - Weather data object
 * @returns {object} Auto-suspend assessment
 */
export const checkAutoSuspendCriteria = (weatherData) => {
  const { rainfall, windSpeed, tcws } = weatherData;
  const triggers = [];

  // Check TCWS
  if (tcws && tcws >= 1) {
    triggers.push({
      criterion: 'TCWS_ANY',
      value: tcws,
      description: `Tropical Cyclone Wind Signal #${tcws}`,
      levels: DEPED_AUTO_SUSPEND_CRITERIA.TCWS_ANY.levels
    });
  }

  // Check wind speed for TCWS
  const tcwsLevel = getTCWSLevel(windSpeed);
  if (tcwsLevel && !tcws) {
    triggers.push({
      criterion: 'TCWS_ANY',
      value: tcwsLevel.level,
      description: `Wind speed indicates ${tcwsLevel.label}`,
      levels: DEPED_AUTO_SUSPEND_CRITERIA.TCWS_ANY.levels
    });
  }

  // Check rainfall warnings
  const rainfallWarning = getRainfallWarningLevel(rainfall);
  if (rainfallWarning) {
    if (rainfallWarning.id === 'red') {
      triggers.push({
        criterion: 'RED_WARNING',
        value: rainfall,
        description: `${rainfallWarning.label} (${rainfall}mm/h)`,
        levels: DEPED_AUTO_SUSPEND_CRITERIA.RED_WARNING.levels
      });
    } else if (rainfallWarning.id === 'orange') {
      triggers.push({
        criterion: 'ORANGE_WARNING',
        value: rainfall,
        description: `${rainfallWarning.label} (${rainfall}mm/h)`,
        levels: DEPED_AUTO_SUSPEND_CRITERIA.ORANGE_WARNING.levels
      });
    } else if (rainfallWarning.id === 'yellow') {
      triggers.push({
        criterion: 'YELLOW_WARNING',
        value: rainfall,
        description: `${rainfallWarning.label} (${rainfall}mm/h)`,
        levels: DEPED_AUTO_SUSPEND_CRITERIA.YELLOW_WARNING.levels
      });
    }
  }

  return {
    shouldAutoSuspend: triggers.length > 0,
    triggers,
    affectedLevels: triggers.length > 0
      ? [...new Set(triggers.flatMap(t => t.levels))]
      : []
  };
};

/**
 * Get risk level based on AI confidence score
 * @param {number} confidence - AI confidence score (0-100)
 * @returns {object} Risk level object
 */
export const getRiskLevelFromConfidence = (confidence) => {
  for (const riskLevel of Object.values(RISK_LEVELS)) {
    const [min, max] = riskLevel.aiConfidenceRange;
    if (confidence >= min && confidence <= max) {
      return riskLevel;
    }
  }
  return RISK_LEVELS.SAFE;
};

/**
 * Format duration in human-readable format
 * @param {number} hours - Duration in hours
 * @returns {string} Formatted duration
 */
export const formatDuration = (hours) => {
  if (hours < 1) {
    return `${Math.round(hours * 60)} minutes`;
  }
  if (hours === 1) {
    return '1 hour';
  }
  if (hours < 24) {
    return `${hours} hours`;
  }
  const days = Math.floor(hours / 24);
  const remainingHours = hours % 24;
  if (remainingHours === 0) {
    return days === 1 ? '1 day' : `${days} days`;
  }
  return `${days} day${days > 1 ? 's' : ''} ${remainingHours} hour${remainingHours > 1 ? 's' : ''}`;
};

/**
 * Check if user has permission to perform action
 * @param {string} userRole - User's role
 * @param {string} action - Action to check
 * @returns {boolean} Whether user has permission
 */
export const hasPermission = (userRole, action) => {
  const role = LGU_ROLES[userRole.toUpperCase()];
  return role ? role.permissions.includes(action) : false;
};

export default {
  PAGASA_WARNINGS,
  TCWS_LEVELS,
  SUSPENSION_LEVELS,
  DEPED_AUTO_SUSPEND_CRITERIA,
  RISK_LEVELS,
  SUSPENSION_STATUS,
  WEATHER_CONDITION_STATUS,
  LGU_ROLES,
  AI_ACTIONS,
  BATANGAS_LOCATIONS,
  getRainfallWarningLevel,
  getTCWSLevel,
  checkAutoSuspendCriteria,
  getRiskLevelFromConfidence,
  formatDuration,
  hasPermission
};
