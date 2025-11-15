/**
 * Suspension Candidate Table
 * Shows cities that may need suspensions with AI recommendations
 */

import React, { useState, useEffect } from 'react';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Checkbox } from '../ui/checkbox';
import { Card } from '../ui/card';
import {
  AlertTriangle,
  Eye,
  CheckCircle2,
  AlertCircle,
  TrendingUp,
  TrendingDown,
  Minus,
  RefreshCw
} from 'lucide-react';
import { useSuspensions } from '../../hooks/useSuspensions';
import { SUSPENSION_LEVELS, AI_ACTIONS, SUSPENSION_STATUS } from '../../constants/suspensionCriteria';

const SuspensionCandidateTable = ({ onIssueSuspension }) => {
  const { suspensionCandidates, loadSuspensionCandidates, candidatesLoading } = useSuspensions();
  const [selectedCities, setSelectedCities] = useState({});
  const [refreshing, setRefreshing] = useState(false);

  // Load candidates on mount
  useEffect(() => {
    loadSuspensionCandidates();
  }, [loadSuspensionCandidates]);

  // Auto-refresh every 5 minutes
  useEffect(() => {
    const interval = setInterval(() => {
      loadSuspensionCandidates();
    }, 5 * 60 * 1000);

    return () => clearInterval(interval);
  }, [loadSuspensionCandidates]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadSuspensionCandidates();
    setRefreshing(false);
  };

  const handleLevelToggle = (city, level) => {
    setSelectedCities(prev => ({
      ...prev,
      [city]: {
        ...prev[city],
        levels: prev[city]?.levels?.includes(level)
          ? prev[city].levels.filter(l => l !== level)
          : [...(prev[city]?.levels || []), level]
      }
    }));
  };

  const handleIssueSuspension = (candidate) => {
    const levels = selectedCities[candidate.city]?.levels || ['k12'];

    onIssueSuspension({
      city: candidate.city,
      levels,
      criteria: candidate.criteria,
      pagasaWarning: candidate.pagasaWarning,
      tcws: candidate.tcws,
      aiRecommendation: candidate.aiRecommendation,
      reportCount: candidate.reportCount,
      criticalReports: candidate.criticalReports
    });
  };

  const getPAGASABadge = (warning) => {
    if (!warning) {
      return (
        <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 font-medium">
          🟢 No Warning
        </Badge>
      );
    }

    const colors = {
      yellow: 'bg-yellow-50 text-yellow-700 border-yellow-200',
      orange: 'bg-orange-50 text-orange-700 border-orange-200',
      red: 'bg-red-50 text-red-700 border-red-200'
    };

    const icons = {
      yellow: '🟡',
      orange: '🟠',
      red: '🔴'
    };

    return (
      <Badge variant="outline" className={`${colors[warning.id]} font-medium`}>
        {icons[warning.id]} {warning.label}
      </Badge>
    );
  };

  const getAIActionBadge = (aiRecommendation) => {
    if (!aiRecommendation) {
      return (
        <div className="flex flex-col gap-1">
          <Badge variant="outline" className="bg-gray-50 text-gray-600 font-medium">
            ⚪ No Data
          </Badge>
        </div>
      );
    }

    if (aiRecommendation.shouldSuspend) {
      return (
        <div className="flex flex-col gap-1">
          <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200 font-bold">
            🔴 SUSPEND
          </Badge>
          <span className="text-xs text-gray-600">
            {aiRecommendation.confidence}% {aiRecommendation.riskLevel || 'High'}
          </span>
        </div>
      );
    }

    if (aiRecommendation.confidence > 50) {
      return (
        <div className="flex flex-col gap-1">
          <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200 font-medium">
            🟡 MONITOR
          </Badge>
          <span className="text-xs text-gray-600">
            {aiRecommendation.confidence}% Med
          </span>
        </div>
      );
    }

    return (
      <div className="flex flex-col gap-1">
        <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 font-medium">
          🟢 SAFE
        </Badge>
        <span className="text-xs text-gray-600">
          {aiRecommendation.confidence}% Low
        </span>
      </div>
    );
  };


  if (candidatesLoading && suspensionCandidates.length === 0) {
    return (
      <Card className="p-6">
        <div className="flex items-center justify-center h-64">
          <RefreshCw className="w-6 h-6 animate-spin text-gray-400" />
          <span className="ml-2 text-gray-500">Loading suspension candidates...</span>
        </div>
      </Card>
    );
  }

  return (
    <>
      {/* Header Section */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">
            Suspension Candidates ({suspensionCandidates.length})
          </h3>
          <Button
            onClick={handleRefresh}
            disabled={refreshing}
            variant="outline"
            size="sm"
            className="border-blue-400 text-blue-700 hover:bg-blue-50 hover:border-blue-500 font-medium shadow-sm"
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Table Section */}
      <div className="p-6">
        {suspensionCandidates.length === 0 ? (
          <div className="text-center py-12">
            <AlertCircle className="w-16 h-16 mx-auto mb-4 text-gray-300" />
            <p className="text-gray-500">No candidates available</p>
          </div>
        ) : (
          <div
            className="overflow-auto scrollbar-thin"
            style={{
              maxHeight: '600px',
              scrollbarWidth: 'thin',
              scrollbarColor: '#CBD5E1 #F1F5F9'
            }}
          >
            <style jsx>{`
              div::-webkit-scrollbar {
                width: 6px;
              }
              div::-webkit-scrollbar-track {
                background: #F1F5F9;
                border-radius: 10px;
              }
              div::-webkit-scrollbar-thumb {
                background: #CBD5E1;
                border-radius: 10px;
              }
              div::-webkit-scrollbar-thumb:hover {
                background: #94A3B8;
              }
              div::-webkit-scrollbar-button {
                display: none;
              }
            `}</style>
            <table className="w-full">
              <thead className="bg-gray-50 border-b-2 border-gray-200" style={{ position: 'sticky', top: 0, zIndex: 10 }}>
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">City</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">PAGASA Warning</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase">Rainfall</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase">Wind</th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase">Reports</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">AI Action</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Suspension Levels</th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase">Action</th>
                </tr>
              </thead>
            <tbody className="divide-y-2 divide-gray-300">
              {suspensionCandidates.map((candidate) => (
                <tr
                  key={candidate.city}
                  className={`border-b border-gray-200 ${
                    candidate.hasActiveSuspension
                      ? 'bg-red-50 hover:bg-red-100'
                      : candidate.autoSuspend.shouldAutoSuspend
                      ? 'bg-orange-50 hover:bg-orange-100'
                      : 'hover:bg-gray-50'
                  }`}
                >
                  {/* City */}
                  <td className="px-4 py-3 font-semibold text-gray-900">
                    <div className="flex items-center gap-2">
                      <span>{candidate.city}</span>
                      {candidate.hasActiveSuspension && (
                        <Badge variant="outline" className="bg-red-100 text-red-700 border-red-300 text-xs font-bold">
                          ACTIVE
                        </Badge>
                      )}
                    </div>
                  </td>

                  {/* PAGASA Warning */}
                  <td className="px-4 py-3">
                    <div className="flex flex-col gap-1">
                      {getPAGASABadge(candidate.pagasaWarning)}
                      {candidate.tcws && (
                        <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200 font-medium">
                          🌀 TCWS #{candidate.tcws.level}
                        </Badge>
                      )}
                    </div>
                  </td>

                  {/* Rainfall */}
                  <td className="px-4 py-3 text-right">
                    <div className="flex flex-col items-end">
                      <span className="font-bold text-gray-900">{candidate.criteria.rainfall} mm/h</span>
                      {candidate.criteria.rainfall >= 30 && (
                        <span className="text-xs text-red-600 font-bold">Heavy</span>
                      )}
                      {candidate.criteria.rainfall >= 15 && candidate.criteria.rainfall < 30 && (
                        <span className="text-xs text-orange-600 font-bold">Moderate</span>
                      )}
                    </div>
                  </td>

                  {/* Wind Speed */}
                  <td className="px-4 py-3 text-right">
                    <div className="flex flex-col items-end">
                      <span className="font-bold text-gray-900">{candidate.criteria.windSpeed} km/h</span>
                      {candidate.criteria.windSpeed >= 55 && (
                        <span className="text-xs text-red-600 font-bold">Strong</span>
                      )}
                    </div>
                  </td>

                  {/* Reports */}
                  <td className="px-4 py-3 text-center">
                    <div className="flex flex-col items-center">
                      <span className="font-bold text-gray-900">{candidate.reportCount}</span>
                      {candidate.criticalReports > 0 && (
                        <span className="text-xs text-red-600 font-bold">
                          ({candidate.criticalReports} critical)
                        </span>
                      )}
                    </div>
                  </td>

                  {/* AI Action */}
                  <td className="px-4 py-3">
                    {getAIActionBadge(candidate.aiRecommendation)}
                  </td>

                  {/* Suspension Levels */}
                  <td className="px-4 py-3">
                    <div className="flex flex-col space-y-1.5">
                      {SUSPENSION_LEVELS.slice(0, 5).map((level) => (
                        <label
                          key={level.id}
                          className="flex items-center space-x-2 text-sm cursor-pointer hover:bg-gray-50 p-1 rounded"
                        >
                          <Checkbox
                            checked={selectedCities[candidate.city]?.levels?.includes(level.id) || false}
                            onCheckedChange={() => handleLevelToggle(candidate.city, level.id)}
                            disabled={candidate.hasActiveSuspension}
                            className="border-gray-400"
                          />
                          <span className="text-xs font-medium">{level.icon} {level.shortLabel}</span>
                        </label>
                      ))}
                    </div>
                  </td>

                  {/* Action Buttons */}
                  <td className="px-4 py-3 text-center">
                    {candidate.hasActiveSuspension ? (
                      <Badge variant="outline" className="bg-gray-100 text-gray-600 font-medium">
                        ✅ Already Active
                      </Badge>
                    ) : (
                      <div className="flex flex-col items-center space-y-2">
                        <Button
                          size="sm"
                          onClick={() => handleIssueSuspension(candidate)}
                          className="bg-blue-500 hover:bg-blue-600 text-white font-medium shadow-sm hover:shadow-md transition-all whitespace-nowrap"
                        >
                          <span className="flex items-center gap-1">
                            ⚠️ <span>Suspend</span>
                          </span>
                        </Button>
                        {candidate.aiRecommendation?.confidence < 60 && candidate.aiRecommendation?.shouldSuspend && (
                          <span className="text-xs text-gray-500">
                            Low confidence
                          </span>
                        )}
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        )}

        {/* Legend */}
        {suspensionCandidates.length > 0 && (
          <div className="mt-6">
            <p className="text-xs font-bold text-gray-700 mb-3">Legend:</p>
            <div className="flex flex-wrap gap-6 text-xs text-gray-700">
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 bg-red-50 border-2 border-red-300 rounded"></div>
                <span className="font-medium">Active suspension</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 bg-orange-50 border-2 border-orange-300 rounded"></div>
                <span className="font-medium">Auto-suspend criteria met</span>
              </div>
              <div className="flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-red-600" />
                <span className="font-medium">Critical reports present</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default SuspensionCandidateTable;
