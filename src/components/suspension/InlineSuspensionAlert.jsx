/**
 * Inline Suspension Alert
 * Compact, modern inline notification for active class suspensions
 * Perfect for embedding in dashboard sections
 */

import React, { useState } from 'react';
import { AlertTriangle, Clock, MapPin, ChevronDown, ChevronUp, X } from 'lucide-react';
import { useSuspensions } from '../../hooks/useSuspensions';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';

export function InlineSuspensionAlert({ className = '', showDismiss = true }) {
  const { activeSuspensions, loading } = useSuspensions();
  const [dismissed, setDismissed] = useState(false);
  const [expanded, setExpanded] = useState(false);

  const getTimeRemaining = (effectiveUntil) => {
    const now = new Date();
    const end = new Date(effectiveUntil);
    const diff = end - now;

    if (diff <= 0) return 'Expired';

    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

    if (hours === 0) return `${minutes}m`;
    return `${hours}h ${minutes}m`;
  };

  const getLevelsDisplay = (levels) => {
    const levelMap = {
      preschool: 'Preschool',
      elementary: 'Elementary',
      high_school: 'High School',
      college: 'College',
      work: 'Gov Work',
      activities: 'Activities',
      all: 'All Levels'
    };

    if (levels.includes('all')) return 'All Levels';
    return levels.map(level => levelMap[level] || level).join(', ');
  };

  if (loading || dismissed || activeSuspensions.length === 0) {
    return null;
  }

  const citiesCount = [...new Set(activeSuspensions.map(s => s.city))].length;

  return (
    <div className={`${className}`}>
      {/* Compact Alert Bar */}
      <div className="bg-gradient-to-r from-red-500 via-red-600 to-red-700 rounded-lg shadow-lg overflow-hidden border-2 border-red-400">
        <div className="px-4 py-3">
          <div className="flex items-center justify-between gap-3">
            {/* Left: Icon & Message */}
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <div className="flex-shrink-0">
                <div className="bg-white/20 backdrop-blur-sm p-2 rounded-full">
                  <AlertTriangle className="w-5 h-5 text-white animate-pulse" />
                </div>
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="text-white font-bold text-sm md:text-base">
                    🚨 Class Suspension Active
                  </h3>
                  <Badge className="bg-white text-red-700 hover:bg-white text-xs">
                    {citiesCount} {citiesCount === 1 ? 'City' : 'Cities'}
                  </Badge>
                </div>
                
                {!expanded && (
                  <p className="text-red-100 text-xs md:text-sm mt-0.5 truncate">
                    {activeSuspensions.length === 1 
                      ? `${activeSuspensions[0].city} - ${getLevelsDisplay(activeSuspensions[0].levels)}`
                      : `${activeSuspensions.map(s => s.city).join(', ')}`
                    }
                  </p>
                )}
              </div>
            </div>

            {/* Right: Actions */}
            <div className="flex items-center gap-2 flex-shrink-0">
              <Button
                onClick={() => setExpanded(!expanded)}
                size="sm"
                variant="ghost"
                className="text-white hover:bg-white/20 h-8 px-3"
              >
                {expanded ? (
                  <>
                    <ChevronUp className="w-4 h-4 mr-1" />
                    <span className="hidden sm:inline">Hide</span>
                  </>
                ) : (
                  <>
                    <ChevronDown className="w-4 h-4 mr-1" />
                    <span className="hidden sm:inline">Details</span>
                  </>
                )}
              </Button>
              
              {showDismiss && (
                <button
                  onClick={() => setDismissed(true)}
                  className="text-white hover:bg-white/20 rounded-full p-1.5 transition-colors"
                  aria-label="Dismiss"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>

          {/* Expanded Details */}
          {expanded && (
            <div className="mt-4 pt-4 border-t border-red-400/50">
              <div className="space-y-3">
                {activeSuspensions.map((suspension, index) => (
                  <div
                    key={suspension.id}
                    className="bg-white/10 backdrop-blur-sm rounded-lg p-3 border border-white/20"
                  >
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <div className="flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-white flex-shrink-0" />
                        <span className="text-white font-bold text-sm">
                          {suspension.city}
                        </span>
                      </div>
                      <Badge className="bg-red-800 text-white text-xs">
                        {getLevelsDisplay(suspension.levels)}
                      </Badge>
                    </div>

                    <p className="text-red-100 text-xs mb-2">
                      {suspension.reason}
                    </p>

                    <div className="flex items-center justify-between text-xs text-red-100">
                      <div className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        <span>Ends in {getTimeRemaining(suspension.effectiveUntil)}</span>
                      </div>
                      <span className="text-red-200">
                        By: {suspension.issuedBy.name}
                      </span>
                    </div>

                    {suspension.message && (
                      <div className="mt-2 pt-2 border-t border-white/20">
                        <p className="text-xs text-red-50 italic">
                          "{suspension.message}"
                        </p>
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* Safety Message */}
              <div className="mt-3 pt-3 border-t border-red-400/50">
                <p className="text-xs text-red-100 text-center">
                  <span className="font-semibold">⚠️ Stay Safe:</span> Monitor weather updates and follow official announcements.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
