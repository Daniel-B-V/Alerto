/**
 * Suspension Service
 * Handles all Firestore CRUD operations for class suspensions
 */

import {
  collection,
  doc,
  addDoc,
  getDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  Timestamp,
  onSnapshot
} from 'firebase/firestore';
import { db } from '../firebase/config';
import { analyzeSuspensionAdvisory } from './geminiService';
import { getWeatherAssessmentForSuspension } from './weatherService';

const SUSPENSIONS_COLLECTION = 'suspensions';

/**
 * Create a new suspension
 * @param {object} suspensionData - Suspension data object
 * @returns {Promise<string>} Document ID of created suspension
 */
export const createSuspension = async (suspensionData) => {
  try {
    const now = new Date();

    const suspension = {
      city: suspensionData.city,
      province: suspensionData.province || 'Batangas',
      status: suspensionData.status || 'active',
      levels: suspensionData.levels || ['k12'],

      issuedBy: {
        name: suspensionData.issuedBy.name,
        title: suspensionData.issuedBy.title,
        office: suspensionData.issuedBy.office,
        role: suspensionData.issuedBy.role
      },

      criteria: {
        pagasaWarning: suspensionData.criteria?.pagasaWarning || null,
        tcws: suspensionData.criteria?.tcws || null,
        rainfall: suspensionData.criteria?.rainfall || null,
        windSpeed: suspensionData.criteria?.windSpeed || null,
        temperature: suspensionData.criteria?.temperature || null,
        heatIndex: suspensionData.criteria?.heatIndex || null,
        humidity: suspensionData.criteria?.humidity || null,
        conditions: suspensionData.criteria?.conditions || null
      },

      aiAnalysis: {
        recommendation: suspensionData.aiAnalysis?.recommendation || 'suspend',
        confidence: suspensionData.aiAnalysis?.confidence || 0,
        reportCount: suspensionData.aiAnalysis?.reportCount || 0,
        criticalReports: suspensionData.aiAnalysis?.criticalReports || 0,
        summary: suspensionData.aiAnalysis?.summary || '',
        justification: suspensionData.aiAnalysis?.justification || '',
        riskLevel: suspensionData.aiAnalysis?.riskLevel || 'moderate'
      },

      issuedAt: Timestamp.fromDate(suspensionData.issuedAt || now),
      effectiveFrom: Timestamp.fromDate(suspensionData.effectiveFrom || now),
      effectiveUntil: Timestamp.fromDate(suspensionData.effectiveUntil),
      liftedAt: suspensionData.liftedAt ? Timestamp.fromDate(suspensionData.liftedAt) : null,

      durationHours: suspensionData.durationHours,
      message: suspensionData.message,
      instructions: suspensionData.instructions || '',
      reason: suspensionData.reason,

      isAutoSuspended: suspensionData.isAutoSuspended || false,
      isOverridden: suspensionData.isOverridden || false,
      overrideReason: suspensionData.overrideReason || null,

      notificationSent: suspensionData.notificationSent || false,
      notificationChannels: suspensionData.notificationChannels || ['in_app'],

      lastReevaluatedAt: null,
      reevaluationCount: 0,
      weatherConditionStatus: null,

      extensions: [],
      updates: [],

      createdAt: Timestamp.fromDate(now),
      updatedAt: Timestamp.fromDate(now)
    };

    const docRef = await addDoc(collection(db, SUSPENSIONS_COLLECTION), suspension);
    console.log(`✅ Suspension created for ${suspensionData.city} with ID: ${docRef.id}`);

    return docRef.id;
  } catch (error) {
    console.error('Error creating suspension:', error);
    throw new Error(`Failed to create suspension: ${error.message}`);
  }
};

/**
 * Get a suspension by ID
 * @param {string} suspensionId - Suspension document ID
 * @returns {Promise<object>} Suspension data
 */
export const getSuspension = async (suspensionId) => {
  try {
    const docRef = doc(db, SUSPENSIONS_COLLECTION, suspensionId);
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) {
      throw new Error('Suspension not found');
    }

    return {
      id: docSnap.id,
      ...docSnap.data(),
      // Convert Timestamps to JS Dates
      issuedAt: docSnap.data().issuedAt?.toDate(),
      effectiveFrom: docSnap.data().effectiveFrom?.toDate(),
      effectiveUntil: docSnap.data().effectiveUntil?.toDate(),
      liftedAt: docSnap.data().liftedAt?.toDate(),
      lastReevaluatedAt: docSnap.data().lastReevaluatedAt?.toDate(),
      createdAt: docSnap.data().createdAt?.toDate(),
      updatedAt: docSnap.data().updatedAt?.toDate()
    };
  } catch (error) {
    console.error('Error getting suspension:', error);
    throw new Error(`Failed to get suspension: ${error.message}`);
  }
};

/**
 * Get all active suspensions
 * @param {string} city - Optional city filter
 * @returns {Promise<Array>} Array of active suspensions
 */
export const getActiveSuspensions = async (city = null) => {
  try {
    const now = Timestamp.now();
    let q;
    
    if (city) {
      q = query(
        collection(db, SUSPENSIONS_COLLECTION),
        where('city', '==', city),
        where('status', '==', 'active'),
        where('effectiveUntil', '>', now)
      );
    } else {
      q = query(
        collection(db, SUSPENSIONS_COLLECTION),
        where('status', '==', 'active'),
        where('effectiveUntil', '>', now)
      );
    }

    const snapshot = await getDocs(q);

    const suspensions = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      issuedAt: doc.data().issuedAt?.toDate(),
      effectiveFrom: doc.data().effectiveFrom?.toDate(),
      effectiveUntil: doc.data().effectiveUntil?.toDate(),
      liftedAt: doc.data().liftedAt?.toDate(),
      lastReevaluatedAt: doc.data().lastReevaluatedAt?.toDate(),
      createdAt: doc.data().createdAt?.toDate(),
      updatedAt: doc.data().updatedAt?.toDate()
    }));

    // Sort in memory: first by effectiveUntil (asc), then by issuedAt (desc)
    return suspensions.sort((a, b) => {
      const timeCompare = a.effectiveUntil - b.effectiveUntil;
      if (timeCompare !== 0) return timeCompare;
      return b.issuedAt - a.issuedAt;
    });
  } catch (error) {
    console.error('Error getting active suspensions:', error);
    throw new Error(`Failed to get active suspensions: ${error.message}`);
  }
};

/**
 * Get suspension history
 * @param {string} city - Optional city filter
 * @param {number} limitCount - Number of records to return
 * @returns {Promise<Array>} Array of historical suspensions
 */
export const getSuspensionHistory = async (city = null, limitCount = 50) => {
  try {
    let q;

    if (city) {
      q = query(
        collection(db, SUSPENSIONS_COLLECTION),
        where('city', '==', city),
        orderBy('issuedAt', 'desc'),
        limit(limitCount)
      );
    } else {
      q = query(
        collection(db, SUSPENSIONS_COLLECTION),
        orderBy('issuedAt', 'desc'),
        limit(limitCount)
      );
    }

    const snapshot = await getDocs(q);

    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      issuedAt: doc.data().issuedAt?.toDate(),
      effectiveFrom: doc.data().effectiveFrom?.toDate(),
      effectiveUntil: doc.data().effectiveUntil?.toDate(),
      liftedAt: doc.data().liftedAt?.toDate(),
      lastReevaluatedAt: doc.data().lastReevaluatedAt?.toDate(),
      createdAt: doc.data().createdAt?.toDate(),
      updatedAt: doc.data().updatedAt?.toDate()
    }));
  } catch (error) {
    console.error('Error getting suspension history:', error);
    throw new Error(`Failed to get suspension history: ${error.message}`);
  }
};

/**
 * Check if city has active suspension
 * @param {string} city - City name
 * @returns {Promise<boolean>} True if city has active suspension
 */
export const hasActiveSuspension = async (city) => {
  try {
    const now = Timestamp.now();
    const q = query(
      collection(db, SUSPENSIONS_COLLECTION),
      where('city', '==', city),
      where('status', '==', 'active'),
      where('effectiveUntil', '>', now),
      limit(1)
    );

    const snapshot = await getDocs(q);
    return !snapshot.empty;
  } catch (error) {
    console.error('Error checking active suspension:', error);
    return false;
  }
};

/**
 * Lift (cancel) a suspension early
 * @param {string} suspensionId - Suspension document ID
 * @param {object} liftData - Data about who lifted and why
 * @returns {Promise<void>}
 */
export const liftSuspension = async (suspensionId, liftData) => {
  try {
    const docRef = doc(db, SUSPENSIONS_COLLECTION, suspensionId);
    const now = new Date();

    await updateDoc(docRef, {
      status: 'lifted',
      liftedAt: Timestamp.fromDate(now),
      updates: liftData.updates || [],
      updatedAt: Timestamp.fromDate(now)
    });

    console.log(`✅ Suspension ${suspensionId} lifted`);
  } catch (error) {
    console.error('Error lifting suspension:', error);
    throw new Error(`Failed to lift suspension: ${error.message}`);
  }
};

/**
 * Extend a suspension's duration
 * @param {string} suspensionId - Suspension document ID
 * @param {object} extensionData - New effectiveUntil and reason
 * @returns {Promise<void>}
 */
export const extendSuspension = async (suspensionId, extensionData) => {
  try {
    const docRef = doc(db, SUSPENSIONS_COLLECTION, suspensionId);
    const now = new Date();
    const suspension = await getSuspension(suspensionId);

    const newDurationHours = (extensionData.newEffectiveUntil - suspension.effectiveFrom) / (1000 * 60 * 60);

    await updateDoc(docRef, {
      effectiveUntil: Timestamp.fromDate(extensionData.newEffectiveUntil),
      durationHours: newDurationHours,
      extensions: [
        ...suspension.extensions,
        {
          extendedAt: Timestamp.fromDate(now),
          newEffectiveUntil: Timestamp.fromDate(extensionData.newEffectiveUntil),
          reason: extensionData.reason,
          extendedBy: extensionData.extendedBy
        }
      ],
      updatedAt: Timestamp.fromDate(now)
    });

    console.log(`✅ Suspension ${suspensionId} extended until ${extensionData.newEffectiveUntil}`);
  } catch (error) {
    console.error('Error extending suspension:', error);
    throw new Error(`Failed to extend suspension: ${error.message}`);
  }
};

/**
 * Update suspension status after reevaluation
 * @param {string} suspensionId - Suspension document ID
 * @param {object} reevaluationData - Weather condition status and new criteria
 * @returns {Promise<void>}
 */
export const reevaluateSuspension = async (suspensionId, reevaluationData) => {
  try {
    const docRef = doc(db, SUSPENSIONS_COLLECTION, suspensionId);
    const suspension = await getSuspension(suspensionId);
    const now = new Date();

    await updateDoc(docRef, {
      lastReevaluatedAt: Timestamp.fromDate(now),
      reevaluationCount: (suspension.reevaluationCount || 0) + 1,
      weatherConditionStatus: reevaluationData.status,
      criteria: {
        ...suspension.criteria,
        ...(reevaluationData.weatherData || {})
      },
      updatedAt: Timestamp.fromDate(now)
    });

    console.log(`✅ Suspension ${suspensionId} reevaluated - Status: ${reevaluationData.status}`);
  } catch (error) {
    console.error('Error reevaluating suspension:', error);
    throw new Error(`Failed to reevaluate suspension: ${error.message}`);
  }
};

/**
 * Update a suspension
 * @param {string} suspensionId - Suspension document ID
 * @param {object} updates - Fields to update
 * @returns {Promise<void>}
 */
export const updateSuspension = async (suspensionId, updates) => {
  try {
    const docRef = doc(db, SUSPENSIONS_COLLECTION, suspensionId);
    const now = new Date();

    await updateDoc(docRef, {
      ...updates,
      updatedAt: Timestamp.fromDate(now)
    });

    console.log(`✅ Suspension ${suspensionId} updated`);
  } catch (error) {
    console.error('Error updating suspension:', error);
    throw new Error(`Failed to update suspension: ${error.message}`);
  }
};

/**
 * Delete a suspension
 * @param {string} suspensionId - Suspension document ID
 * @returns {Promise<void>}
 */
export const deleteSuspension = async (suspensionId) => {
  try {
    const docRef = doc(db, SUSPENSIONS_COLLECTION, suspensionId);
    await deleteDoc(docRef);
    console.log(`✅ Suspension ${suspensionId} deleted`);
  } catch (error) {
    console.error('Error deleting suspension:', error);
    throw new Error(`Failed to delete suspension: ${error.message}`);
  }
};

/**
 * Subscribe to active suspensions (real-time updates)
 * @param {function} callback - Callback function called on updates
 * @param {string} city - Optional city filter
 * @returns {function} Unsubscribe function
 */
export const subscribeToActiveSuspensions = (callback, city = null) => {
  try {
    const now = Timestamp.now();
    let q;
    
    if (city) {
      q = query(
        collection(db, SUSPENSIONS_COLLECTION),
        where('city', '==', city),
        where('status', '==', 'active'),
        where('effectiveUntil', '>', now)
      );
    } else {
      q = query(
        collection(db, SUSPENSIONS_COLLECTION),
        where('status', '==', 'active'),
        where('effectiveUntil', '>', now)
      );
    }

    return onSnapshot(q, (snapshot) => {
      const suspensions = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        issuedAt: doc.data().issuedAt?.toDate(),
        effectiveFrom: doc.data().effectiveFrom?.toDate(),
        effectiveUntil: doc.data().effectiveUntil?.toDate(),
        liftedAt: doc.data().liftedAt?.toDate(),
        lastReevaluatedAt: doc.data().lastReevaluatedAt?.toDate(),
        createdAt: doc.data().createdAt?.toDate(),
        updatedAt: doc.data().updatedAt?.toDate()
      }));

      // Sort in memory: first by effectiveUntil (asc), then by issuedAt (desc)
      const sorted = suspensions.sort((a, b) => {
        const timeCompare = a.effectiveUntil - b.effectiveUntil;
        if (timeCompare !== 0) return timeCompare;
        return b.issuedAt - a.issuedAt;
      });

      callback(sorted);
    });
  } catch (error) {
    console.error('Error subscribing to suspensions:', error);
    return () => {}; // Return empty unsubscribe function
  }
};

/**
 * Generate AI recommendation for suspension
 * @param {string} city - City name
 * @param {Array} reports - Community reports for the city
 * @returns {Promise<object>} AI recommendation object
 */
export const generateSuspensionRecommendation = async (city, reports = []) => {
  try {
    // Get current weather assessment
    const weatherAssessment = await getWeatherAssessmentForSuspension(city);

    if (!weatherAssessment) {
      throw new Error('Could not get weather assessment');
    }

    // Format weather data for AI
    const weatherData = {
      location: city,
      current: {
        temperature: weatherAssessment.criteria.temperature,
        rainfall: weatherAssessment.criteria.rainfall,
        windSpeed: weatherAssessment.criteria.windSpeed,
        humidity: weatherAssessment.criteria.humidity,
        conditions: weatherAssessment.criteria.conditions
      },
      alerts: []
    };

    // Add PAGASA warning to alerts
    if (weatherAssessment.pagasaWarning) {
      weatherData.alerts.push({
        level: weatherAssessment.pagasaWarning.id,
        message: weatherAssessment.pagasaWarning.description,
        hazard: weatherAssessment.pagasaWarning.hazard
      });
    }

    // Add TCWS to alerts
    if (weatherAssessment.tcws) {
      weatherData.alerts.push({
        level: 'tcws',
        message: weatherAssessment.tcws.description,
        signal: weatherAssessment.tcws.level
      });
    }

    // Get AI advisory
    const aiAdvisory = await analyzeSuspensionAdvisory(weatherData, reports);

    return {
      city,
      weatherAssessment,
      aiAdvisory,
      recommendation: {
        shouldSuspend: weatherAssessment.autoSuspend.shouldAutoSuspend || aiAdvisory.suspensionRecommended,
        confidence: aiAdvisory.combinedScore || 0,
        riskLevel: aiAdvisory.overallRiskLevel || 'moderate',
        affectedLevels: weatherAssessment.autoSuspend.affectedLevels || ['k12'],
        reason: weatherAssessment.autoSuspend.triggers.map(t => t.description).join(', ') || aiAdvisory.advisory,
        justification: aiAdvisory.advisory,
        criticalReports: reports.filter(r => r.severity === 'critical').length,
        totalReports: reports.length
      }
    };
  } catch (error) {
    console.error('Error generating suspension recommendation:', error);
    throw new Error(`Failed to generate recommendation: ${error.message}`);
  }
};

/**
 * Auto-expire suspensions that have passed their effectiveUntil
 * @returns {Promise<number>} Number of suspensions expired
 */
export const autoExpireSuspensions = async () => {
  try {
    const now = Timestamp.now();
    const q = query(
      collection(db, SUSPENSIONS_COLLECTION),
      where('status', '==', 'active'),
      where('effectiveUntil', '<=', now)
    );

    const snapshot = await getDocs(q);
    let expiredCount = 0;

    for (const docSnap of snapshot.docs) {
      await updateDoc(doc(db, SUSPENSIONS_COLLECTION, docSnap.id), {
        status: 'expired',
        updatedAt: Timestamp.fromDate(new Date())
      });
      expiredCount++;
    }

    if (expiredCount > 0) {
      console.log(`✅ Auto-expired ${expiredCount} suspension(s)`);
    }

    return expiredCount;
  } catch (error) {
    console.error('Error auto-expiring suspensions:', error);
    return 0;
  }
};

/**
 * Get city suspension history with analytics
 * @param {string} city - City name
 * @param {number} limitCount - Number of suspensions to fetch
 * @returns {Promise<object>} Suspension history with analytics
 */
export const getCitySuspensionHistory = async (city, limitCount = 50) => {
  try {
    const suspensions = await getSuspensionHistory(city, limitCount);

    // Calculate analytics
    const totalSuspensions = suspensions.length;

    if (totalSuspensions === 0) {
      return {
        suspensions: [],
        analytics: {
          totalSuspensions: 0,
          avgDuration: 0,
          mostCommonReason: null,
          suspensionsPerMonth: 0
        }
      };
    }

    // Average duration
    const avgDuration = Math.round(
      suspensions.reduce((sum, s) => sum + (s.durationHours || 0), 0) / totalSuspensions
    );

    // Most common reason
    const reasonCounts = {};
    suspensions.forEach(s => {
      const reason = s.reason || 'Weather conditions';
      reasonCounts[reason] = (reasonCounts[reason] || 0) + 1;
    });
    const mostCommonReason = Object.entries(reasonCounts)
      .sort((a, b) => b[1] - a[1])[0]?.[0];

    // Suspensions per month
    const oldestDate = new Date(Math.min(...suspensions.map(s => new Date(s.issuedAt).getTime())));
    const monthsDiff = Math.max(1, Math.ceil((Date.now() - oldestDate.getTime()) / (1000 * 60 * 60 * 24 * 30)));
    const suspensionsPerMonth = (totalSuspensions / monthsDiff).toFixed(1);

    return {
      suspensions,
      analytics: {
        totalSuspensions,
        avgDuration,
        mostCommonReason,
        suspensionsPerMonth: parseFloat(suspensionsPerMonth)
      }
    };
  } catch (error) {
    console.error('Error getting city suspension history:', error);
    throw new Error(`Failed to get city suspension history: ${error.message}`);
  }
};

/**
 * Get suspension recommendation based on current conditions
 * @param {string} city - City name
 * @param {object} weatherData - Current weather data
 * @param {number} reportCount - Number of community reports
 * @param {number} criticalReports - Number of critical reports
 * @returns {Promise<object>} Recommendation with risk score
 */
export const getSuspensionRecommendation = async (city, weatherData, reportCount = 0, criticalReports = 0) => {
  try {
    let riskScore = 0;
    const factors = [];

    // Weather factors (max 50 points)
    if (weatherData) {
      // Rainfall (0-20 points)
      if (weatherData.rainfall >= 30) {
        riskScore += 20;
        factors.push({ type: 'rainfall', severity: 'critical', value: weatherData.rainfall });
      } else if (weatherData.rainfall >= 15) {
        riskScore += 15;
        factors.push({ type: 'rainfall', severity: 'high', value: weatherData.rainfall });
      } else if (weatherData.rainfall >= 7.5) {
        riskScore += 10;
        factors.push({ type: 'rainfall', severity: 'moderate', value: weatherData.rainfall });
      }

      // Wind (0-15 points)
      if (weatherData.windSpeed >= 55) {
        riskScore += 15;
        factors.push({ type: 'wind', severity: 'critical', value: weatherData.windSpeed });
      } else if (weatherData.windSpeed >= 39) {
        riskScore += 10;
        factors.push({ type: 'wind', severity: 'high', value: weatherData.windSpeed });
      }

      // Heat Index (0-15 points)
      const heatIndex = weatherData.heatIndex || weatherData.temperature;
      if (heatIndex >= 41) {
        riskScore += 15;
        factors.push({ type: 'heat', severity: 'critical', value: heatIndex });
      } else if (heatIndex >= 33) {
        riskScore += 10;
        factors.push({ type: 'heat', severity: 'high', value: heatIndex });
      }
    }

    // Community reports (max 30 points)
    if (criticalReports > 0) {
      const reportPoints = Math.min(20, criticalReports * 5);
      riskScore += reportPoints;
      factors.push({ type: 'criticalReports', severity: 'high', value: criticalReports });
    }
    if (reportCount > 0) {
      const reportPoints = Math.min(10, reportCount * 2);
      riskScore += reportPoints;
      factors.push({ type: 'reports', severity: 'moderate', value: reportCount });
    }

    // PAGASA Warning (max 20 points)
    if (weatherData?.pagasaWarning) {
      if (weatherData.pagasaWarning.id === 'red') {
        riskScore += 20;
        factors.push({ type: 'pagasaWarning', severity: 'critical', value: 'red' });
      } else if (weatherData.pagasaWarning.id === 'orange') {
        riskScore += 15;
        factors.push({ type: 'pagasaWarning', severity: 'high', value: 'orange' });
      } else if (weatherData.pagasaWarning.id === 'yellow') {
        riskScore += 10;
        factors.push({ type: 'pagasaWarning', severity: 'moderate', value: 'yellow' });
      }
    }

    riskScore = Math.min(100, Math.round(riskScore));

    // Determine recommendation
    let recommendation;
    if (riskScore >= 75) {
      recommendation = {
        action: 'SUSPEND_NOW',
        level: 'critical',
        message: 'Immediate suspension recommended based on current conditions.',
        shouldSuspend: true
      };
    } else if (riskScore >= 50) {
      recommendation = {
        action: 'CONSIDER_SUSPENDING',
        level: 'high',
        message: 'Weather conditions warrant serious consideration for suspension.',
        shouldSuspend: false
      };
    } else if (riskScore >= 25) {
      recommendation = {
        action: 'MONITOR_CLOSELY',
        level: 'moderate',
        message: 'Continue monitoring conditions. Suspension may be needed soon.',
        shouldSuspend: false
      };
    } else {
      recommendation = {
        action: 'SAFE',
        level: 'low',
        message: 'Current conditions do not warrant suspension at this time.',
        shouldSuspend: false
      };
    }

    return {
      riskScore,
      recommendation,
      factors,
      timestamp: new Date()
    };
  } catch (error) {
    console.error('Error generating suspension recommendation:', error);
    return {
      riskScore: 0,
      recommendation: {
        action: 'ERROR',
        level: 'unknown',
        message: 'Unable to generate recommendation.',
        shouldSuspend: false
      },
      factors: [],
      error: error.message
    };
  }
};

/**
 * Get statistics for a specific city
 * @param {string} city - City name
 * @returns {Promise<object>} City statistics
 */
export const getCityStatistics = async (city) => {
  try {
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    // Get all suspensions for the city
    const allSuspensions = await getSuspensionHistory(city, 100);

    // Get recent suspensions (last 30 days)
    const recentSuspensions = allSuspensions.filter(s =>
      new Date(s.issuedAt) >= thirtyDaysAgo
    );

    // Check for active suspension
    const activeSuspension = allSuspensions.find(s =>
      s.status === 'active' && new Date(s.effectiveUntil) > now
    );

    return {
      totalSuspensions: allSuspensions.length,
      recentSuspensions: recentSuspensions.length,
      hasActiveSuspension: !!activeSuspension,
      activeSuspension: activeSuspension || null,
      avgDurationHours: allSuspensions.length > 0
        ? Math.round(allSuspensions.reduce((sum, s) => sum + (s.durationHours || 0), 0) / allSuspensions.length)
        : 0
    };
  } catch (error) {
    console.error('Error getting city statistics:', error);
    return {
      totalSuspensions: 0,
      recentSuspensions: 0,
      hasActiveSuspension: false,
      activeSuspension: null,
      avgDurationHours: 0
    };
  }
};

export default {
  createSuspension,
  getSuspension,
  getActiveSuspensions,
  getSuspensionHistory,
  hasActiveSuspension,
  liftSuspension,
  extendSuspension,
  reevaluateSuspension,
  updateSuspension,
  deleteSuspension,
  subscribeToActiveSuspensions,
  generateSuspensionRecommendation,
  autoExpireSuspensions,
  getCitySuspensionHistory,
  getSuspensionRecommendation,
  getCityStatistics
};
