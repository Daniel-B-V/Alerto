/**
 * Automatic Reevaluation Service
 * Background service that monitors active suspensions and updates their status
 */

import { getActiveSuspensions, reevaluateSuspension, autoExpireSuspensions } from './suspensionService';
import { getWeatherAssessmentForSuspension } from './weatherService';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../firebase/config';

// Reevaluation interval (30 minutes)
const REEVALUATION_INTERVAL = 30 * 60 * 1000;

// Track running interval
let reevaluationInterval = null;

/**
 * Determine weather condition trend
 * @param {object} previousCriteria - Previous weather measurements
 * @param {object} currentCriteria - Current weather measurements
 * @returns {string} 'improving', 'stable', or 'worsening'
 */
const determineWeatherTrend = (previousCriteria, currentCriteria) => {
  if (!previousCriteria || !currentCriteria) return 'stable';

  const rainfallChange = currentCriteria.rainfall - previousCriteria.rainfall;
  const windSpeedChange = currentCriteria.windSpeed - previousCriteria.windSpeed;

  // Calculate severity score change
  const prevSeverity = (previousCriteria.rainfall || 0) + (previousCriteria.windSpeed || 0) / 2;
  const currSeverity = (currentCriteria.rainfall || 0) + (currentCriteria.windSpeed || 0) / 2;
  const severityChange = currSeverity - prevSeverity;

  // Improving: significant reduction in severity
  if (severityChange < -10 || (rainfallChange < -5 && windSpeedChange < -10)) {
    return 'improving';
  }

  // Worsening: significant increase in severity
  if (severityChange > 10 || (rainfallChange > 5 && windSpeedChange > 10)) {
    return 'worsening';
  }

  // Stable: minimal change
  return 'stable';
};

/**
 * Reevaluate a single suspension
 * @param {object} suspension - Suspension object
 */
const reevaluateSingleSuspension = async (suspension) => {
  try {
    console.log(`🔄 Reevaluating suspension for ${suspension.city}...`);

    // Get current weather assessment
    const weatherAssessment = await getWeatherAssessmentForSuspension(suspension.city);

    if (!weatherAssessment) {
      console.warn(`⚠️ Could not get weather assessment for ${suspension.city}`);
      return;
    }

    // Determine weather trend
    const trend = determineWeatherTrend(
      suspension.criteria,
      weatherAssessment.criteria
    );

    // Update suspension with new data
    await reevaluateSuspension(suspension.id, {
      status: trend,
      weatherData: {
        rainfall: weatherAssessment.criteria.rainfall,
        windSpeed: weatherAssessment.criteria.windSpeed,
        temperature: weatherAssessment.criteria.temperature,
        humidity: weatherAssessment.criteria.humidity,
        conditions: weatherAssessment.criteria.conditions,
        pagasaWarning: weatherAssessment.pagasaWarning?.id || null,
        tcws: weatherAssessment.tcws?.level || null
      }
    });

    console.log(`✅ Reevaluated ${suspension.city}: ${trend}`);

    // Log significant changes
    if (trend === 'worsening') {
      console.warn(`⚠️ CONDITIONS WORSENING in ${suspension.city}!`);
      console.warn(`   Rainfall: ${suspension.criteria.rainfall} → ${weatherAssessment.criteria.rainfall} mm/h`);
      console.warn(`   Wind: ${suspension.criteria.windSpeed} → ${weatherAssessment.criteria.windSpeed} km/h`);
    } else if (trend === 'improving') {
      console.log(`📉 Conditions improving in ${suspension.city}`);
      console.log(`   Rainfall: ${suspension.criteria.rainfall} → ${weatherAssessment.criteria.rainfall} mm/h`);
      console.log(`   Wind: ${suspension.criteria.windSpeed} → ${weatherAssessment.criteria.windSpeed} km/h`);
    }
  } catch (error) {
    console.error(`❌ Error reevaluating ${suspension.city}:`, error);
  }
};

/**
 * Reevaluate all active suspensions
 */
const reevaluateAllActiveSuspensions = async () => {
  try {
    console.log('🔍 Starting automatic reevaluation of active suspensions...');

    // First, auto-expire any that have passed their end time
    const expiredCount = await autoExpireSuspensions();
    if (expiredCount > 0) {
      console.log(`⏱️ Auto-expired ${expiredCount} suspension(s)`);
    }

    // Get all active suspensions
    const activeSuspensions = await getActiveSuspensions();

    if (activeSuspensions.length === 0) {
      console.log('ℹ️ No active suspensions to reevaluate');
      return;
    }

    console.log(`📊 Reevaluating ${activeSuspensions.length} active suspension(s)...`);

    // Reevaluate each suspension
    for (const suspension of activeSuspensions) {
      await reevaluateSingleSuspension(suspension);
      // Small delay between evaluations to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    console.log('✅ Reevaluation complete!');
  } catch (error) {
    console.error('❌ Error during reevaluation:', error);
  }
};

/**
 * Get suspension recommendations for cities without active suspensions
 * @returns {Promise<Array>} Cities that should consider suspensions
 */
export const getNewSuspensionRecommendations = async () => {
  try {
    const { getBatangasWeatherWithSuspensionCriteria } = await import('./weatherService');
    const weatherAssessments = await getBatangasWeatherWithSuspensionCriteria();

    // Get cities with active suspensions
    const activeSuspensions = await getActiveSuspensions();
    const citiesWithActiveSuspensions = new Set(activeSuspensions.map(s => s.city));

    // Filter to cities without active suspensions that meet criteria
    const recommendations = weatherAssessments
      .filter(assessment =>
        !citiesWithActiveSuspensions.has(assessment.city) &&
        assessment.autoSuspend.shouldAutoSuspend
      )
      .map(assessment => ({
        city: assessment.city,
        reason: assessment.autoSuspend.triggers.map(t => t.description).join(', '),
        pagasaWarning: assessment.pagasaWarning,
        tcws: assessment.tcws,
        criteria: assessment.criteria,
        urgency: assessment.pagasaWarning?.id === 'red' || assessment.tcws?.level >= 3 ? 'critical' : 'high'
      }));

    if (recommendations.length > 0) {
      console.log(`🚨 ${recommendations.length} new cities recommended for suspension:`);
      recommendations.forEach(rec => {
        console.log(`   - ${rec.city}: ${rec.reason}`);
      });
    }

    return recommendations;
  } catch (error) {
    console.error('Error getting new suspension recommendations:', error);
    return [];
  }
};

/**
 * Check for suspensions that should be lifted
 * @returns {Promise<Array>} Suspensions that could be lifted
 */
export const getSuspensionsToConsiderLifting = async () => {
  try {
    const activeSuspensions = await getActiveSuspensions();

    const candidatesForLifting = [];

    for (const suspension of activeSuspensions) {
      // Get current weather
      const weatherAssessment = await getWeatherAssessmentForSuspension(suspension.city);

      if (!weatherAssessment) continue;

      // Check if conditions have significantly improved
      const rainfallImprovement = suspension.criteria.rainfall - weatherAssessment.criteria.rainfall;
      const windImprovement = suspension.criteria.windSpeed - weatherAssessment.criteria.windSpeed;

      // Suggest lifting if:
      // 1. Rainfall dropped below Yellow threshold (< 7.5 mm/h)
      // 2. Wind speed dropped significantly (> 20 km/h reduction)
      // 3. No PAGASA warning or TCWS
      const shouldConsiderLifting = (
        weatherAssessment.criteria.rainfall < 7.5 &&
        weatherAssessment.criteria.windSpeed < 30 &&
        !weatherAssessment.pagasaWarning &&
        !weatherAssessment.tcws
      );

      if (shouldConsiderLifting) {
        candidatesForLifting.push({
          suspension,
          reason: `Conditions improved: Rainfall ${suspension.criteria.rainfall}→${weatherAssessment.criteria.rainfall}mm/h, Wind ${suspension.criteria.windSpeed}→${weatherAssessment.criteria.windSpeed}km/h`,
          improvement: {
            rainfall: rainfallImprovement,
            windSpeed: windImprovement
          }
        });
      }
    }

    if (candidatesForLifting.length > 0) {
      console.log(`📉 ${candidatesForLifting.length} suspension(s) could be lifted due to improved conditions`);
    }

    return candidatesForLifting;
  } catch (error) {
    console.error('Error checking suspensions for lifting:', error);
    return [];
  }
};

/**
 * Start automatic reevaluation service
 */
export const startReevaluationService = () => {
  if (reevaluationInterval) {
    console.log('ℹ️ Reevaluation service already running');
    return;
  }

  console.log('🚀 Starting automatic reevaluation service...');
  console.log(`⏰ Will reevaluate every ${REEVALUATION_INTERVAL / 60000} minutes`);

  // Run immediately on start
  reevaluateAllActiveSuspensions();

  // Then run on interval
  reevaluationInterval = setInterval(() => {
    reevaluateAllActiveSuspensions();
  }, REEVALUATION_INTERVAL);
};

/**
 * Stop automatic reevaluation service
 */
export const stopReevaluationService = () => {
  if (reevaluationInterval) {
    clearInterval(reevaluationInterval);
    reevaluationInterval = null;
    console.log('⏸️ Reevaluation service stopped');
  }
};

/**
 * Manual reevaluation trigger
 */
export const triggerManualReevaluation = async () => {
  console.log('🔄 Manual reevaluation triggered...');
  await reevaluateAllActiveSuspensions();
};

export default {
  startReevaluationService,
  stopReevaluationService,
  triggerManualReevaluation,
  reevaluateAllActiveSuspensions,
  getNewSuspensionRecommendations,
  getSuspensionsToConsiderLifting
};
