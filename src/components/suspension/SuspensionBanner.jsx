/**
 * Suspension Banner
 * Public-facing banner that shows active class suspensions
 */

import React, { useState, useEffect } from 'react';
import { AlertCircle, X, ChevronDown, ChevronUp, Clock, AlertTriangle, Info } from 'lucide-react';
import { useSuspensions } from '../../hooks/useSuspensions';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';

const SuspensionBanner = ({ position = 'top' }) => {
  const { activeSuspensions, loading } = useSuspensions();
  const [dismissed, setDismissed] = useState(false);
  const [expanded, setExpanded] = useState(false);

  // Check if banner was dismissed in localStorage
  useEffect(() => {
    const dismissedTime = localStorage.getItem('suspension_banner_dismissed');
    if (dismissedTime) {
      const timeSinceDismissed = Date.now() - parseInt(dismissedTime);
      // Auto-undismiss after 1 hour
      if (timeSinceDismissed > 60 * 60 * 1000) {
        localStorage.removeItem('suspension_banner_dismissed');
        setDismissed(false);
      } else {
        setDismissed(true);
      }
    }
  }, []);

  // Reset dismissed state when new suspension is added
  useEffect(() => {
    if (activeSuspensions.length > 0 && dismissed) {
      const lastSuspensionTime = Math.max(
        ...activeSuspensions.map(s => new Date(s.issuedAt).getTime())
      );
      const dismissedTime = localStorage.getItem('suspension_banner_dismissed');

      if (dismissedTime && lastSuspensionTime > parseInt(dismissedTime)) {
        setDismissed(false);
        localStorage.removeItem('suspension_banner_dismissed');
      }
    }
  }, [activeSuspensions, dismissed]);

  const handleDismiss = () => {
    setDismissed(true);
    localStorage.setItem('suspension_banner_dismissed', Date.now().toString());
  };

  const toggleExpanded = () => {
    setExpanded(!expanded);
  };

  const getTimeRemaining = (effectiveUntil) => {
    const now = new Date();
    const end = new Date(effectiveUntil);
    const diff = end - now;

    if (diff <= 0) return 'Expired';

    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

    if (hours === 0) {
      return `${minutes} minutes`;
    }

    return `${hours}h ${minutes}m`;
  };

  const getLevelsDisplay = (levels) => {
    const levelMap = {
      preschool: 'Preschool',
      elementary: 'Elementary',
      high_school: 'High School',
      college: 'College',
      work: 'Government Work',
      activities: 'Public Activities',
      all: 'All Levels'
    };

    if (levels.includes('all')) {
      return 'All Levels';
    }

    return levels.map(level => levelMap[level] || level).join(', ');
  };

  // Don't show banner if dismissed or no suspensions
  if (dismissed || loading || activeSuspensions.length === 0) {
    return null;
  }

  const citiesCount = [...new Set(activeSuspensions.map(s => s.city))].length;

  return (
    <div
      className={`
        fixed ${position === 'top' ? 'top-0' : 'bottom-0'} left-0 right-0 z-50
        bg-red-600 text-white shadow-lg
        border-b-4 border-red-800
      `}
      role="alert"
      aria-live="assertive"
      aria-atomic="true"
    >
      {/* Main Banner Content */}
      <div className="container mx-auto px-4 py-3">
        <div className="flex items-center justify-between">
          {/* Left: Alert Icon & Message */}
          <div className="flex items-center flex-1 min-w-0">
            <AlertCircle className="w-6 h-6 flex-shrink-0 mr-3 animate-pulse" />
            <div className="flex-1 min-w-0">
              <div className="flex items-center flex-wrap gap-2">
                <span className="font-bold text-lg">
                  🚨 CLASS SUSPENSION ACTIVE
                </span>
                <Badge className="bg-white text-red-700 hover:bg-white">
                  {citiesCount} {citiesCount === 1 ? 'City' : 'Cities'}
                </Badge>
              </div>
              <p className="text-sm text-red-100 mt-1">
                {activeSuspensions.length === 1 ? (
                  <span>
                    {activeSuspensions[0].city} - {getLevelsDisplay(activeSuspensions[0].levels)}
                  </span>
                ) : (
                  <span>
                    Multiple cities affected - Click to view details
                  </span>
                )}
              </p>
            </div>
          </div>

          {/* Right: Actions */}
          <div className="flex items-center space-x-2 ml-4">
            <Button
              onClick={toggleExpanded}
              variant="ghost"
              size="sm"
              className="text-white hover:bg-red-700"
            >
              {expanded ? (
                <>
                  <ChevronUp className="w-4 h-4 mr-1" />
                  Hide Details
                </>
              ) : (
                <>
                  <ChevronDown className="w-4 h-4 mr-1" />
                  View Details
                </>
              )}
            </Button>
            <button
              onClick={handleDismiss}
              className="text-white hover:bg-red-700 rounded-full p-1 transition-colors"
              aria-label="Dismiss alert"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Expanded Details */}
        {expanded && (
          <div className="mt-4 pt-4 border-t border-red-500">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {activeSuspensions.map((suspension) => (
                <div
                  key={suspension.id}
                  className="bg-red-700 rounded-lg p-4 text-sm"
                >
                  {/* City Header */}
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-bold text-base">{suspension.city}</h3>
                    <Badge className="bg-red-800 text-white text-xs">
                      {getLevelsDisplay(suspension.levels)}
                    </Badge>
                  </div>

                  {/* Reason */}
                  <div className="mb-3">
                    <div className="flex items-start">
                      <AlertTriangle className="w-4 h-4 mr-2 flex-shrink-0 mt-0.5" />
                      <p className="text-red-100 text-xs">
                        {suspension.reason}
                      </p>
                    </div>
                  </div>

                  {/* Time Info */}
                  <div className="flex items-center text-xs text-red-100 mb-2">
                    <Clock className="w-3 h-3 mr-1" />
                    <span>Ends in {getTimeRemaining(suspension.effectiveUntil)}</span>
                  </div>

                  {/* Issued By */}
                  <div className="flex items-center text-xs text-red-100">
                    <Info className="w-3 h-3 mr-1" />
                    <span>
                      Issued by: {suspension.issuedBy.name}
                    </span>
                  </div>

                  {/* Message */}
                  {suspension.message && (
                    <div className="mt-3 pt-3 border-t border-red-600">
                      <p className="text-xs text-red-50">
                        "{suspension.message}"
                      </p>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Advisory Footer */}
            <div className="mt-4 pt-3 border-t border-red-500 text-center">
              <p className="text-sm text-red-100">
                <span className="font-semibold">⚠️ Stay Safe:</span> Monitor weather updates and follow official announcements from your local government.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Screen Reader Announcement */}
      <div className="sr-only" role="status" aria-live="polite">
        {activeSuspensions.length === 1 ? (
          <span>
            Class suspension active for {activeSuspensions[0].city}.
            {getLevelsDisplay(activeSuspensions[0].levels)} suspended.
            Reason: {activeSuspensions[0].reason}.
            Ends in {getTimeRemaining(activeSuspensions[0].effectiveUntil)}.
          </span>
        ) : (
          <span>
            Class suspensions active in {citiesCount} cities across Batangas Province.
            Expand for details.
          </span>
        )}
      </div>
    </div>
  );
};

export default SuspensionBanner;
