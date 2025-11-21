/**
 * Active Suspension Banner
 * Top banner showing current active suspension with countdown and quick actions
 */

import { useState, useEffect } from 'react';
import { AlertTriangle, Clock, School, Edit3, Plus, X as XIcon } from 'lucide-react';
import { Button } from '../../ui/button';
import { Badge } from '../../ui/badge';

export function ActiveSuspensionBanner({
  suspension,
  onExtend,
  onLift,
  onEditMessage,
  className = ''
}) {
  const [timeRemaining, setTimeRemaining] = useState('');
  const [percentRemaining, setPercentRemaining] = useState(100);

  useEffect(() => {
    if (!suspension) return;

    const updateTimer = () => {
      const now = new Date();
      const end = new Date(suspension.effectiveUntil);
      const start = new Date(suspension.effectiveFrom);
      const totalDuration = end - start;
      const remaining = end - now;

      if (remaining <= 0) {
        setTimeRemaining('Expired');
        setPercentRemaining(0);
        return;
      }

      // Calculate time remaining
      const hours = Math.floor(remaining / (1000 * 60 * 60));
      const minutes = Math.floor((remaining % (1000 * 60 * 60)) / (1000 * 60));

      if (hours > 0) {
        setTimeRemaining(`${hours}h ${minutes}m`);
      } else {
        setTimeRemaining(`${minutes}m`);
      }

      // Calculate percentage
      const percent = Math.round((remaining / totalDuration) * 100);
      setPercentRemaining(Math.max(0, Math.min(100, percent)));
    };

    updateTimer();
    const interval = setInterval(updateTimer, 60000); // Update every minute

    return () => clearInterval(interval);
  }, [suspension]);

  if (!suspension) return null;

  const getLevelsText = () => {
    const levels = suspension.levels || [];
    const levelNames = {
      elementary: 'Elementary',
      high_school: 'High School',
      preschool: 'Preschool',
      college: 'College'
    };
    return levels.map(l => levelNames[l] || l).join(', ');
  };

  const getProgressColor = () => {
    if (percentRemaining > 50) return 'bg-green-500';
    if (percentRemaining > 25) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  return (
    <div className={`border-2 border-red-300 rounded-2xl shadow-lg ${className}`} style={{ backgroundColor: 'white' }}>
      <div className="p-6">
        {/* Header Row */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-start gap-3 flex-1">
            <div className="p-2 bg-red-100 rounded-lg">
              <AlertTriangle className="w-6 h-6 text-red-600" />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-3 flex-wrap mb-1">
                <h3 className="text-xl font-bold text-gray-900">Active City-Wide Suspension</h3>
                <Badge className="bg-red-600 text-white">
                  ACTIVE
                </Badge>
              </div>
              <p className="text-sm text-gray-700">
                Issued on {new Date(suspension.issuedAt).toLocaleString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  hour: 'numeric',
                  minute: '2-digit',
                  hour12: true
                })}
              </p>
            </div>
          </div>

          {/* Time Remaining */}
          <div className="text-right">
            <div className="text-sm text-gray-600 mb-1">Time Remaining</div>
            <div className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-red-600" />
              <span className="text-2xl font-bold text-gray-900">{timeRemaining}</span>
            </div>
            <div className="text-xs text-gray-500 mt-1">
              Until {new Date(suspension.effectiveUntil).toLocaleString('en-US', {
                month: 'short',
                day: 'numeric',
                hour: 'numeric',
                minute: '2-digit',
                hour12: true
              })}
            </div>
          </div>
        </div>

        {/* Suspension Details Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          {/* Levels */}
          <div className="p-3" style={{ backgroundColor: 'white', borderRadius: '12px', border: '1px solid #e5e7eb' }}>
            <div className="flex items-center gap-2 mb-2">
              <School className="w-4 h-4 text-red-600" />
              <span className="text-xs font-semibold text-gray-600 uppercase">Levels</span>
            </div>
            <div className="font-bold text-gray-900">{getLevelsText()}</div>
          </div>

          {/* Duration */}
          <div className="p-3" style={{ backgroundColor: 'white', borderRadius: '12px', border: '1px solid #e5e7eb' }}>
            <div className="flex items-center gap-2 mb-2">
              <Clock className="w-4 h-4 text-red-600" />
              <span className="text-xs font-semibold text-gray-600 uppercase">Duration</span>
            </div>
            <div className="font-bold text-gray-900">{suspension.durationHours} hours</div>
          </div>

          {/* Reason */}
          <div className="p-3" style={{ backgroundColor: 'white', borderRadius: '12px', border: '1px solid #e5e7eb' }}>
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle className="w-4 h-4 text-red-600" />
              <span className="text-xs font-semibold text-gray-600 uppercase">Reason</span>
            </div>
            <div className="font-bold text-gray-900 truncate" title={suspension.reason}>
              {suspension.reason || 'Weather conditions'}
            </div>
          </div>
        </div>

        {/* Message */}
        {suspension.message && (
          <div className="p-4 mb-4" style={{ backgroundColor: 'white', borderRadius: '12px', border: '1px solid #e5e7eb' }}>
            <div className="text-xs font-semibold text-gray-600 uppercase mb-2">Public Message</div>
            <div className="text-sm text-gray-800">{suspension.message}</div>
          </div>
        )}

        {/* Quick Actions */}
        <div className="flex flex-wrap gap-3">
          <Button
            onClick={onExtend}
            variant="outline"
            className="flex items-center gap-2 border-blue-400 text-blue-700 hover:bg-blue-50"
          >
            <Plus className="w-4 h-4" />
            Extend Suspension
          </Button>

          <Button
            onClick={onEditMessage}
            variant="outline"
            className="flex items-center gap-2 border-gray-300 text-gray-700 hover:bg-gray-50"
          >
            <Edit3 className="w-4 h-4" />
            Edit Message
          </Button>

          <Button
            onClick={onLift}
            variant="outline"
            className="flex items-center gap-2 border-red-400 text-red-700 hover:bg-red-50"
          >
            <XIcon className="w-4 h-4" />
            Lift Suspension
          </Button>
        </div>
      </div>
    </div>
  );
}

export default ActiveSuspensionBanner;
