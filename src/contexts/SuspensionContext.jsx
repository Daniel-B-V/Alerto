/**
 * Suspension Context
 * Provides global state management for suspension system
 */

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import {
  getActiveSuspensions,
  getSuspensionHistory,
  hasActiveSuspension,
  createSuspension,
  liftSuspension,
  extendSuspension,
  updateSuspension,
  subscribeToActiveSuspensions,
  generateSuspensionRecommendation,
  autoExpireSuspensions
} from '../services/suspensionService';
import { getBatangasWeatherWithSuspensionCriteria } from '../services/weatherService';
import { startReevaluationService, stopReevaluationService } from '../services/reevaluationService';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../firebase/config';

const SuspensionContext = createContext();

export const useSuspensionContext = () => {
  const context = useContext(SuspensionContext);
  if (!context) {
    throw new Error('useSuspensionContext must be used within a SuspensionProvider');
  }
  return context;
};

export const SuspensionProvider = ({ children }) => {
  // State
  const [activeSuspensions, setActiveSuspensions] = useState([]);
  const [suspensionHistory, setSuspensionHistory] = useState([]);
  const [suspensionCandidates, setSuspensionCandidates] = useState([]);
  const [userSubscriptions, setUserSubscriptions] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false); // Changed to false - each operation manages its own loading
  const [candidatesLoading, setCandidatesLoading] = useState(false);
  const [error, setError] = useState(null);

  // Auto-expire suspensions and start reevaluation service on mount
  useEffect(() => {
    autoExpireSuspensions().catch(err => {
      console.error('Failed to auto-expire suspensions:', err);
    });

    // Start automatic reevaluation service
    startReevaluationService();

    // Cleanup on unmount
    return () => {
      stopReevaluationService();
    };
  }, []);

  // Subscribe to active suspensions (real-time updates)
  useEffect(() => {
    const unsubscribe = subscribeToActiveSuspensions((suspensions) => {
      setActiveSuspensions(suspensions);

      // Check for new suspensions and create notifications
      checkForNewSuspensions(suspensions);
    });

    return () => unsubscribe();
  }, []);

  // Load suspension history on mount
  useEffect(() => {
    const loadHistory = async () => {
      try {
        const history = await getSuspensionHistory(null, 20);
        setSuspensionHistory(history);
      } catch (err) {
        console.error('Failed to load suspension history:', err);
      }
    };

    loadHistory();
  }, []);

  // Load user subscriptions from localStorage
  useEffect(() => {
    const storedSubs = localStorage.getItem('suspension_subscriptions');
    if (storedSubs) {
      try {
        setUserSubscriptions(JSON.parse(storedSubs));
      } catch (err) {
        console.error('Failed to parse subscriptions:', err);
      }
    }
  }, []);

  // Check for new suspensions and notify user
  const checkForNewSuspensions = useCallback((suspensions) => {
    const lastCheckStr = localStorage.getItem('last_suspension_check');
    const lastCheck = lastCheckStr ? new Date(lastCheckStr) : new Date(0);

    const newSuspensions = suspensions.filter(s =>
      new Date(s.issuedAt) > lastCheck
    );

    if (newSuspensions.length > 0) {
      newSuspensions.forEach(suspension => {
        // Check if user is subscribed to this city or subscribed to all
        const isSubscribed = userSubscriptions.length === 0 ||
          userSubscriptions.includes(suspension.city) ||
          userSubscriptions.includes('all');

        if (isSubscribed) {
          addNotification({
            id: `suspension_${suspension.id}`,
            type: 'suspension',
            city: suspension.city,
            message: `Class suspension issued for ${suspension.city}`,
            data: suspension,
            timestamp: new Date()
          });
        }
      });

      localStorage.setItem('last_suspension_check', new Date().toISOString());
    }
  }, [userSubscriptions]);

  // Add notification
  const addNotification = useCallback((notification) => {
    setNotifications(prev => {
      // Avoid duplicates
      if (prev.some(n => n.id === notification.id)) {
        return prev;
      }
      return [notification, ...prev];
    });
  }, []);

  // Dismiss notification
  const dismissNotification = useCallback((notificationId) => {
    setNotifications(prev => prev.filter(n => n.id !== notificationId));
  }, []);

  // Clear all notifications
  const clearNotifications = useCallback(() => {
    setNotifications([]);
  }, []);

  // Subscribe to a city
  const subscribeTo = useCallback((city) => {
    setUserSubscriptions(prev => {
      if (prev.includes(city)) return prev;
      const newSubs = [...prev, city];
      localStorage.setItem('suspension_subscriptions', JSON.stringify(newSubs));
      return newSubs;
    });
  }, []);

  // Unsubscribe from a city
  const unsubscribeFrom = useCallback((city) => {
    setUserSubscriptions(prev => {
      const newSubs = prev.filter(c => c !== city);
      localStorage.setItem('suspension_subscriptions', JSON.stringify(newSubs));
      return newSubs;
    });
  }, []);

  // Issue a new suspension
  const issueSuspension = useCallback(async (suspensionData) => {
    try {
      setError(null);
      const suspensionId = await createSuspension(suspensionData);

      // Refresh history
      const history = await getSuspensionHistory(null, 20);
      setSuspensionHistory(history);

      return suspensionId;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  }, []);

  // Lift a suspension
  const liftSuspensionById = useCallback(async (suspensionId, liftData) => {
    try {
      setError(null);
      await liftSuspension(suspensionId, liftData);

      // Refresh history
      const history = await getSuspensionHistory(null, 20);
      setSuspensionHistory(history);
    } catch (err) {
      setError(err.message);
      throw err;
    }
  }, []);

  // Extend a suspension
  const extendSuspensionById = useCallback(async (suspensionId, extensionData) => {
    try {
      setError(null);
      await extendSuspension(suspensionId, extensionData);
    } catch (err) {
      setError(err.message);
      throw err;
    }
  }, []);

  // Update a suspension
  const updateSuspensionById = useCallback(async (suspensionId, updates) => {
    try {
      setError(null);
      await updateSuspension(suspensionId, updates);
    } catch (err) {
      setError(err.message);
      throw err;
    }
  }, []);

  // Check if a city has active suspension
  const checkCityHasSuspension = useCallback(async (city) => {
    return await hasActiveSuspension(city);
  }, []);

  // Load suspension candidates (cities to monitor)
  const loadSuspensionCandidates = useCallback(async () => {
    try {
      setCandidatesLoading(true);
      setError(null);
      console.log('🔍 Loading suspension candidates...');

      // Get all Batangas weather with suspension criteria
      const weatherAssessments = await getBatangasWeatherWithSuspensionCriteria();
      console.log(`📊 Got ${weatherAssessments.length} weather assessments`);

      // Get community reports for each city
      const reportsRef = collection(db, 'reports');

      const candidatesWithReports = await Promise.all(
        weatherAssessments.map(async (assessment) => {
          try {
            console.log(`  📍 Processing ${assessment.city}...`);

            // Query reports for this city (all time for now, to avoid timestamp issues)
            const reportsQuery = query(
              reportsRef,
              where('location.city', '==', assessment.city)
            );

            const reportsSnapshot = await getDocs(reportsQuery);
            const reports = reportsSnapshot.docs.map(doc => ({
              id: doc.id,
              ...doc.data()
            }));

            const criticalReports = reports.filter(r => r.severity === 'critical').length;
            const highReports = reports.filter(r => r.severity === 'high').length;

            console.log(`  ✓ ${assessment.city}: ${reports.length} reports (${criticalReports} critical)`);

            // Determine if city already has active suspension
            const hasActive = await hasActiveSuspension(assessment.city);

            // Create basic AI recommendation based on weather criteria (skip Gemini call for now for speed)
            const aiRecommendation = {
              shouldSuspend: assessment.autoSuspend.shouldAutoSuspend,
              confidence: assessment.autoSuspend.shouldAutoSuspend ? 85 : (criticalReports > 0 ? 70 : 50),
              reason: assessment.autoSuspend.triggers.map(t => t.description).join(', ') || 'No immediate concerns',
              riskLevel: assessment.autoSuspend.shouldAutoSuspend ? 'critical' : (criticalReports > 5 ? 'high' : 'moderate')
            };

            return {
              city: assessment.city,
              pagasaWarning: assessment.pagasaWarning,
              tcws: assessment.tcws,
              criteria: assessment.criteria,
              autoSuspend: assessment.autoSuspend,
              reportCount: reports.length,
              criticalReports,
              highReports,
              aiRecommendation,
              hasActiveSuspension: hasActive,
              lastUpdated: new Date()
            };
          } catch (err) {
            console.error(`Error loading candidate data for ${assessment.city}:`, err);
            return null;
          }
        })
      );

      // Filter out null results and sort by risk level
      const validCandidates = candidatesWithReports
        .filter(c => c !== null)
        .sort((a, b) => {
          // Sort by: auto-suspend trigger > AI confidence > critical reports
          if (a.autoSuspend.shouldAutoSuspend && !b.autoSuspend.shouldAutoSuspend) return -1;
          if (!a.autoSuspend.shouldAutoSuspend && b.autoSuspend.shouldAutoSuspend) return 1;
          if (a.aiRecommendation?.confidence > b.aiRecommendation?.confidence) return -1;
          if (a.aiRecommendation?.confidence < b.aiRecommendation?.confidence) return 1;
          return b.criticalReports - a.criticalReports;
        });

      console.log(`✅ Loaded ${validCandidates.length} suspension candidates`);
      setSuspensionCandidates(validCandidates);
      return validCandidates;
    } catch (err) {
      console.error('❌ Failed to load suspension candidates:', err);
      setError(err.message);
      // Return empty array on error to prevent infinite loading
      setSuspensionCandidates([]);
      return [];
    } finally {
      setCandidatesLoading(false);
    }
  }, []);

  // Get active suspensions for specific city
  const getActiveSuspensionsForCity = useCallback((city) => {
    return activeSuspensions.filter(s => s.city === city);
  }, [activeSuspensions]);

  // Get all cities with active suspensions
  const getCitiesWithSuspensions = useCallback(() => {
    return [...new Set(activeSuspensions.map(s => s.city))];
  }, [activeSuspensions]);

  const value = {
    // State
    activeSuspensions,
    suspensionHistory,
    suspensionCandidates,
    userSubscriptions,
    notifications,
    loading,
    candidatesLoading,
    error,

    // Actions
    issueSuspension,
    liftSuspension: liftSuspensionById,
    extendSuspension: extendSuspensionById,
    updateSuspension: updateSuspensionById,
    checkCityHasSuspension: checkCityHasSuspension,
    loadSuspensionCandidates,

    // Notifications
    addNotification,
    dismissNotification,
    clearNotifications,

    // Subscriptions
    subscribeTo,
    unsubscribeFrom,

    // Helpers
    getActiveSuspensionsForCity,
    getCitiesWithSuspensions
  };

  return (
    <SuspensionContext.Provider value={value}>
      {children}
    </SuspensionContext.Provider>
  );
};

export default SuspensionContext;
