/**
 * useSuspensions Hook
 * Custom hook for easier access to suspension context
 */

import { useContext, useState, useEffect, useCallback } from 'react';
import SuspensionContext from '../contexts/SuspensionContext';
import { getActiveSuspensions, getSuspensionHistory } from '../services/suspensionService';

/**
 * Main suspension hook - provides full context
 */
export const useSuspensions = () => {
  const context = useContext(SuspensionContext);

  if (!context) {
    throw new Error('useSuspensions must be used within a SuspensionProvider');
  }

  return context;
};

/**
 * Hook for active suspensions only
 * @param {string} city - Optional city filter
 */
export const useActiveSuspensions = (city = null) => {
  const [suspensions, setSuspensions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadSuspensions = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await getActiveSuspensions(city);
        setSuspensions(data);
      } catch (err) {
        setError(err.message);
        console.error('Error loading active suspensions:', err);
      } finally {
        setLoading(false);
      }
    };

    loadSuspensions();
  }, [city]);

  return { suspensions, loading, error };
};

/**
 * Hook for suspension history
 * @param {string} city - Optional city filter
 * @param {number} limit - Number of records to fetch
 */
export const useSuspensionHistory = (city = null, limit = 20) => {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadHistory = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await getSuspensionHistory(city, limit);
        setHistory(data);
      } catch (err) {
        setError(err.message);
        console.error('Error loading suspension history:', err);
      } finally {
        setLoading(false);
      }
    };

    loadHistory();
  }, [city, limit]);

  return { history, loading, error };
};

/**
 * Hook for checking if specific city has active suspension
 * @param {string} city - City name
 */
export const useCitySuspensionStatus = (city) => {
  const { activeSuspensions, loading } = useSuspensions();

  const citySuspensions = activeSuspensions.filter(s => s.city === city);
  const hasActiveSuspension = citySuspensions.length > 0;
  const latestSuspension = citySuspensions[0] || null;

  return {
    hasActiveSuspension,
    suspension: latestSuspension,
    suspensions: citySuspensions,
    loading
  };
};

/**
 * Hook for managing user city subscriptions
 */
export const useSuspensionSubscriptions = () => {
  const { userSubscriptions, subscribeTo, unsubscribeFrom } = useSuspensions();

  const isSubscribed = useCallback((city) => {
    return userSubscriptions.includes(city) || userSubscriptions.includes('all');
  }, [userSubscriptions]);

  const toggleSubscription = useCallback((city) => {
    if (isSubscribed(city)) {
      unsubscribeFrom(city);
    } else {
      subscribeTo(city);
    }
  }, [isSubscribed, subscribeTo, unsubscribeFrom]);

  return {
    subscriptions: userSubscriptions,
    isSubscribed,
    subscribeTo,
    unsubscribeFrom,
    toggleSubscription
  };
};

/**
 * Hook for notifications
 */
export const useSuspensionNotifications = () => {
  const { notifications, dismissNotification, clearNotifications } = useSuspensions();

  const unreadCount = notifications.length;
  const hasUnread = unreadCount > 0;

  return {
    notifications,
    unreadCount,
    hasUnread,
    dismiss: dismissNotification,
    clearAll: clearNotifications
  };
};

/**
 * Hook for suspension statistics
 */
export const useSuspensionStats = () => {
  const { activeSuspensions, suspensionHistory } = useSuspensions();

  const stats = {
    activeCount: activeSuspensions.length,
    citiesAffected: [...new Set(activeSuspensions.map(s => s.city))].length,
    totalToday: suspensionHistory.filter(s => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      return new Date(s.issuedAt) >= today;
    }).length,
    totalThisWeek: suspensionHistory.filter(s => {
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      return new Date(s.issuedAt) >= weekAgo;
    }).length,
    byStatus: {
      active: suspensionHistory.filter(s => s.status === 'active').length,
      lifted: suspensionHistory.filter(s => s.status === 'lifted').length,
      expired: suspensionHistory.filter(s => s.status === 'expired').length
    },
    byLevel: {
      preschool: activeSuspensions.filter(s => s.levels.includes('preschool')).length,
      k12: activeSuspensions.filter(s => s.levels.includes('k12')).length,
      college: activeSuspensions.filter(s => s.levels.includes('college')).length,
      work: activeSuspensions.filter(s => s.levels.includes('work')).length,
      activities: activeSuspensions.filter(s => s.levels.includes('activities')).length,
      all: activeSuspensions.filter(s => s.levels.includes('all')).length
    }
  };

  return stats;
};

/**
 * Hook for time-based suspension queries
 */
export const useTimeBasedSuspensions = () => {
  const { activeSuspensions } = useSuspensions();

  // Suspensions ending soon (within 2 hours)
  const endingSoon = activeSuspensions.filter(s => {
    const twoHoursFromNow = new Date(Date.now() + 2 * 60 * 60 * 1000);
    return new Date(s.effectiveUntil) <= twoHoursFromNow;
  });

  // Recently issued (within last hour)
  const recentlyIssued = activeSuspensions.filter(s => {
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    return new Date(s.issuedAt) >= oneHourAgo;
  });

  // Long-duration (> 12 hours)
  const longDuration = activeSuspensions.filter(s => s.durationHours > 12);

  return {
    endingSoon,
    recentlyIssued,
    longDuration
  };
};

export default useSuspensions;
