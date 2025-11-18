/**
 * Suspension Notification Card
 * Modern card-based notification for active class suspensions
 * Can be embedded within dashboard content
 */

import React, { useState } from 'react';
import { AlertCircle, Clock, MapPin, Info, ChevronRight, X } from 'lucide-react';
import { useSuspensions } from '../../hooks/useSuspensions';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';

export function SuspensionNotificationCard({ className = '' }) {
  const { activeSuspensions, loading } = useSuspensions();
  const [dismissed, setDismissed] = useState(false);

  const getTimeRemaining = (effectiveUntil) => {
    const now = new Date();
    const end = new Date(effectiveUntil);
    const diff = end - now;

    if (diff <= 0) return 'Expired';

    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

    if (hours === 0) {
      return `${minutes}m`;
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

  const getSeverityColor = (suspension) => {
    // Determine severity based on levels affected
    if (suspension.levels.includes('all')) {
      return 'critical';
    } else if (suspension.levels.length >= 3) {
      return 'high';
    }
    return 'medium';
  };

  const getSeverityStyles = (severity) => {
    switch (severity) {
      case 'critical':
        return {
          bg: 'bg-gradient-to-r from-purple-600 to-purple-700',
          border: 'border-purple-500',
          badge: 'bg-purple-800',
          text: 'text-purple-100'
        };
      case 'high':
        return {
          bg: 'bg-gradient-to-r from-red-600 to-red-700',
          border: 'border-red-500',
          badge: 'bg-red-800',
          text: 'text-red-100'
        };
      default:
        return {
          bg: 'bg-gradient-to-r from-orange-600 to-orange-700',
          border: 'border-orange-500',
          badge: 'bg-orange-800',
          text: 'text-orange-100'
        };
    }
  };

  if (loading || dismissed || activeSuspensions.length === 0) {
    return null;
  }

  const citiesCount = [...new Set(activeSuspensions.map(s => s.city))].length;

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Summary Card */}
      <Card className="border-2 border-red-500 shadow-lg overflow-hidden">
        <div className="bg-gradient-to-r from-red-600 to-red-700 text-white p-4">
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-3 flex-1">
              <div className="bg-white/20 p-2 rounded-lg">
                <AlertCircle className="w-6 h-6 animate-pulse" />
              </div>
              <div className="flex-1">
                <h3 className="text-xl font-bold mb-1 flex items-center gap-2">
                  🚨 CLASS SUSPENSION ACTIVE
                  <Badge className="bg-white text-red-700 hover:bg-white">
                    {citiesCount} {citiesCount === 1 ? 'City' : 'Cities'}
                  </Badge>
                </h3>
                <p className="text-red-100 text-sm">
                  {activeSuspensions.length === 1 
                    ? `${activeSuspensions[0].city} - ${getLevelsDisplay(activeSuspensions[0].levels)}`
                    : `Multiple cities affected across Batangas Province`
                  }
                </p>
              </div>
            </div>
            <button
              onClick={() => setDismissed(true)}
              className="text-white hover:bg-white/20 rounded-full p-1 transition-colors ml-2"
              aria-label="Dismiss notification"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <CardContent className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {activeSuspensions.map((suspension) => {
              const severity = getSeverityColor(suspension);
              const styles = getSeverityStyles(severity);

              return (
                <div
                  key={suspension.id}
                  className={`${styles.bg} text-white rounded-lg p-4 border-2 ${styles.border} shadow-md hover:shadow-lg transition-all duration-200`}
                >
                  {/* Header */}
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <MapPin className="w-5 h-5 flex-shrink-0" />
                      <h4 className="font-bold text-lg">{suspension.city}</h4>
                    </div>
                    <Badge className={`${styles.badge} text-white text-xs`}>
                      {severity.toUpperCase()}
                    </Badge>
                  </div>

                  {/* Levels */}
                  <div className="mb-3">
                    <p className="text-sm font-semibold mb-1">Affected Levels:</p>
                    <p className={`text-sm ${styles.text}`}>
                      {getLevelsDisplay(suspension.levels)}
                    </p>
                  </div>

                  {/* Reason */}
                  <div className="mb-3 pb-3 border-b border-white/20">
                    <p className="text-sm font-semibold mb-1">Reason:</p>
                    <p className={`text-sm ${styles.text}`}>
                      {suspension.reason}
                    </p>
                  </div>

                  {/* Time & Issuer */}
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm">
                      <Clock className="w-4 h-4" />
                      <span>Ends in {getTimeRemaining(suspension.effectiveUntil)}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Info className="w-4 h-4" />
                      <span>Issued by: {suspension.issuedBy.name}</span>
                    </div>
                  </div>

                  {/* Message */}
                  {suspension.message && (
                    <div className="mt-3 pt-3 border-t border-white/20">
                      <p className="text-sm italic">
                        "{suspension.message}"
                      </p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Safety Advisory */}
          <div className="mt-4 pt-4 border-t border-gray-200">
            <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded">
              <div className="flex items-start">
                <div className="flex-shrink-0">
                  <AlertCircle className="w-5 h-5 text-yellow-600" />
                </div>
                <div className="ml-3">
                  <p className="text-sm text-yellow-800">
                    <span className="font-semibold">⚠️ Stay Safe:</span> Monitor weather updates and follow official announcements from your local government.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
