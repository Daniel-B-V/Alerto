/**
 * Dashboard Announcement Card
 * Compact summary of active class suspensions for the dashboard
 */

import React from 'react';
import { AlertCircle, Clock, MapPin } from 'lucide-react';
import { useSuspensions } from '../../hooks/useSuspensions';
import { Badge } from '../ui/badge';

export function DashboardAnnouncementCard({ className = '' }) {
  const { activeSuspensions, loading } = useSuspensions();

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
      k12: 'K-12',
      college: 'College',
      work: 'Gov Work',
      activities: 'Activities',
      all: 'All Levels'
    };

    if (levels.includes('all')) return 'All Levels';
    return levels.map(level => levelMap[level] || level).join(', ');
  };

  if (loading || activeSuspensions.length === 0) {
    return null;
  }

  return (
    <div className={className}>
      {activeSuspensions.map((suspension) => (
        <div 
          key={suspension.id} 
          className="rounded-lg p-4 shadow-sm hover:shadow-md transition-all duration-200 border-2 bg-white"
          style={{
            borderColor: '#dc2626'
          }}
        >
          <div className="flex items-center justify-between gap-4">
            {/* Left: Icon & Info */}
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <div className="p-2 rounded-lg flex-shrink-0" style={{ backgroundColor: '#fee2e2' }}>
                <AlertCircle className="w-5 h-5 text-red-600" />
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-bold text-sm text-black">🚨 CLASS SUSPENSION</span>
                  <Badge className="bg-red-600 text-white hover:bg-red-700 text-xs">
                    {suspension.city}
                  </Badge>
                </div>
                <p className="text-xs text-black truncate">
                  {getLevelsDisplay(suspension.levels)} • {suspension.reason}
                </p>
              </div>
            </div>

            {/* Right: Time */}
            <div className="flex items-center gap-2 px-3 py-2 rounded-lg flex-shrink-0 border-2" style={{ backgroundColor: '#fef2f2', borderColor: '#dc2626' }}>
              <Clock className="w-4 h-4 text-red-600" />
              <div className="text-right">
                <p className="text-xs text-black">Ends in</p>
                <p className="text-sm font-bold text-black">{getTimeRemaining(suspension.effectiveUntil)}</p>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
