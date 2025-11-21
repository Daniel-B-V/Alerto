/**
 * Dashboard Announcement Card
 * Compact summary of active class suspensions for the dashboard
 */

import React from 'react';
import { AlertCircle, Clock, MapPin } from 'lucide-react';
import { useSuspensions } from '../../hooks/useSuspensions';
import { useUserLocation } from '../../hooks/useUserLocation';
import { Badge } from '../ui/badge';

export function DashboardAnnouncementCard({ className = '' }) {
  const { activeSuspensions, loading } = useSuspensions();
  const { detectedCity } = useUserLocation();

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

  // Filter suspensions to only show those for the user's detected city
  const relevantSuspensions = activeSuspensions.filter(suspension => {
    // If no city detected yet, don't show any suspensions
    if (!detectedCity) return false;

    // Show suspension if it matches the user's city
    return suspension.city === detectedCity;
  });

  if (loading || relevantSuspensions.length === 0) {
    return null;
  }

  return (
    <div className={className}>
      {relevantSuspensions.map((suspension) => (
        <div
          key={suspension.id}
          className="p-6 shadow-sm hover:shadow-md transition-all duration-200 mb-6"
          style={{
            border: '1px solid #dc2626',
            backgroundColor: 'white',
            borderRadius: '20px'
          }}
        >
          <div className="flex items-start justify-between gap-6">
            {/* Left: Icon & Info */}
            <div className="flex items-start gap-4 flex-1">
              <div className="p-3 rounded-lg flex-shrink-0" style={{ backgroundColor: '#fee2e2' }}>
                <AlertCircle className="w-6 h-6 text-red-600" />
              </div>

              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <span className="font-bold text-lg text-black">🚨 CLASS SUSPENSION</span>
                  <span className="text-sm text-gray-600">
                    {suspension.city}
                  </span>
                </div>
                <p className="text-sm text-black mb-2">
                  {getLevelsDisplay(suspension.levels)} • {suspension.reason}
                </p>
                {suspension.message && (
                  <p className="text-sm text-gray-700">
                    {suspension.message}
                  </p>
                )}
              </div>
            </div>

            {/* Right: Time */}
            <div className="flex items-center gap-3 px-4 py-3 rounded-lg flex-shrink-0 border-2" style={{ backgroundColor: '#fef2f2', borderColor: '#dc2626' }}>
              <Clock className="w-5 h-5 text-red-600" />
              <div className="text-right">
                <p className="text-xs text-gray-600 mb-1">Ends in</p>
                <p className="text-xl font-bold text-red-600">{getTimeRemaining(suspension.effectiveUntil)}</p>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
