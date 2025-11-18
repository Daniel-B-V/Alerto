/**
 * Suspension History Card
 * Shows past suspensions for the city with statistics and trends
 */

import { useState } from 'react';
import { History, Clock, TrendingUp, Calendar, ChevronDown, ChevronUp, BarChart3 } from 'lucide-react';
import { Badge } from '../../ui/badge';
import { Button } from '../../ui/button';

export function SuspensionHistoryCard({ suspensions = [], className = '' }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [showAll, setShowAll] = useState(false);

  if (!suspensions || suspensions.length === 0) {
    return (
      <div className={`bg-white rounded-2xl border-2 border-gray-200 p-6 ${className}`}>
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-gray-100 rounded-lg">
            <History className="w-5 h-5 text-gray-600" />
          </div>
          <h3 className="text-lg font-bold text-gray-900">Suspension History</h3>
        </div>
        <div className="text-center py-8">
          <div className="text-gray-400 mb-2">
            <Calendar className="w-12 h-12 mx-auto" />
          </div>
          <p className="text-gray-600">No previous suspensions</p>
          <p className="text-sm text-gray-500 mt-1">
            History will appear here once you issue your first suspension
          </p>
        </div>
      </div>
    );
  }

  // Calculate statistics
  const totalSuspensions = suspensions.length;
  const avgDuration = Math.round(
    suspensions.reduce((sum, s) => sum + (s.durationHours || 0), 0) / totalSuspensions
  );

  // Get most common reason
  const reasonCounts = {};
  suspensions.forEach(s => {
    const reason = s.reason || 'Weather conditions';
    reasonCounts[reason] = (reasonCounts[reason] || 0) + 1;
  });
  const mostCommonReason = Object.entries(reasonCounts).sort((a, b) => b[1] - a[1])[0]?.[0];

  // Calculate suspension frequency (per month)
  const oldestDate = new Date(Math.min(...suspensions.map(s => new Date(s.issuedAt).getTime())));
  const monthsDiff = Math.max(1, Math.ceil((Date.now() - oldestDate.getTime()) / (1000 * 60 * 60 * 24 * 30)));
  const perMonth = (totalSuspensions / monthsDiff).toFixed(1);

  // Get recent suspensions (last 10)
  const recentSuspensions = showAll ? suspensions : suspensions.slice(0, 10);

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const formatTime = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  const getLevelBadges = (levels) => {
    if (!levels || levels.length === 0) return null;
    const levelNames = {
      elementary: 'Elementary',
      high_school: 'High School',
      preschool: 'Preschool',
      college: 'College'
    };
    return levels.map((level, i) => (
      <Badge key={i} variant="outline" className="bg-blue-50 text-blue-700 border-blue-300 text-xs">
        {levelNames[level] || level}
      </Badge>
    ));
  };

  return (
    <div className={`bg-white rounded-2xl border-2 border-gray-200 overflow-hidden ${className}`}>
      {/* Header */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <History className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-900">Suspension History & Statistics</h3>
              <p className="text-sm text-gray-600">{totalSuspensions} total suspensions</p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-gray-600 hover:text-gray-900"
          >
            {isExpanded ? (
              <ChevronUp className="w-5 h-5" />
            ) : (
              <ChevronDown className="w-5 h-5" />
            )}
          </Button>
        </div>
      </div>

      {/* Content - Only show when expanded */}
      {isExpanded && (
        <>
          {/* Statistics Grid */}
          <div className="bg-white border-b border-gray-200">
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr' }}>
              <div className="flex flex-col items-center justify-center py-6 px-4 border-r border-gray-300">
                <div className="flex items-center gap-2 mb-2">
                  <Clock className="w-4 h-4 text-blue-600" />
                  <span className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Avg Duration</span>
                </div>
                <div className="text-3xl font-bold text-gray-900">{avgDuration}h</div>
              </div>

              <div className="flex flex-col items-center justify-center py-6 px-4 border-r border-gray-300">
                <div className="flex items-center gap-2 mb-2">
                  <TrendingUp className="w-4 h-4 text-blue-600" />
                  <span className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Frequency</span>
                </div>
                <div className="text-3xl font-bold text-gray-900">{perMonth}</div>
                <div className="text-xs text-gray-500 mt-1">/month</div>
              </div>

              <div className="flex flex-col items-center justify-center py-6 px-4">
                <div className="flex items-center gap-2 mb-2">
                  <BarChart3 className="w-4 h-4 text-blue-600" />
                  <span className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Top Trigger</span>
                </div>
                <div className="text-xl font-bold text-gray-900 truncate px-2" title={mostCommonReason}>
                  {mostCommonReason?.split(' ')[0]}
                </div>
              </div>
            </div>
          </div>

          {/* Recent Suspensions List */}
        <div className="p-6">
          <h4 className="text-sm font-bold text-gray-900 mb-4">Recent Suspensions</h4>
          <div className="space-y-3 max-h-[400px] overflow-y-auto">
            {recentSuspensions.map((suspension, index) => (
              <div
                key={suspension.id || index}
                className="border border-gray-200 rounded-lg p-4 hover:border-blue-300 hover:bg-blue-50/30 transition-all"
              >
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <div className="font-semibold text-gray-900 mb-1">
                      {formatDate(suspension.issuedAt)}
                    </div>
                    <div className="text-xs text-gray-500">
                      {formatTime(suspension.issuedAt)} - {formatTime(suspension.effectiveUntil)}
                    </div>
                  </div>
                  <div className="text-right">
                    <Badge className="bg-blue-100 text-blue-700 border-blue-300">
                      {suspension.durationHours}h
                    </Badge>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2 mb-2">
                  {getLevelBadges(suspension.levels)}
                </div>

                {suspension.reason && (
                  <div className="text-sm text-gray-700 mb-2">
                    <span className="font-medium">Reason:</span> {suspension.reason}
                  </div>
                )}

                {/* Weather data if available */}
                {suspension.criteria && (
                  <div className="flex flex-wrap gap-3 text-xs text-gray-600 mt-2 pt-2 border-t border-gray-200">
                    {suspension.criteria.rainfall > 0 && (
                      <span>🌧️ {suspension.criteria.rainfall}mm/h</span>
                    )}
                    {suspension.criteria.windSpeed > 0 && (
                      <span>💨 {suspension.criteria.windSpeed}km/h</span>
                    )}
                    {suspension.criteria.temperature && (
                      <span>🌡️ {suspension.criteria.temperature}°C</span>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Show More/Less Button */}
          {suspensions.length > 10 && (
            <div className="mt-4 text-center">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowAll(!showAll)}
                className="text-blue-600 border-blue-300 hover:bg-blue-50"
              >
                {showAll ? 'Show Less' : `Show All (${suspensions.length - 10} more)`}
              </Button>
            </div>
          )}
        </div>
        </>
      )}
    </div>
  );
}

export default SuspensionHistoryCard;
