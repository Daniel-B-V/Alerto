/**
 * Suspension Candidate Table
 * Shows cities that may need suspensions with AI recommendations
 */

import React, { useState, useEffect } from 'react';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Checkbox } from '../ui/checkbox';
import { Card } from '../ui/card';
import { Input } from '../ui/input';
import {
  AlertTriangle,
  Eye,
  CheckCircle2,
  AlertCircle,
  TrendingUp,
  TrendingDown,
  Minus,
  RefreshCw,
  Search
} from 'lucide-react';
import { useSuspensions } from '../../hooks/useSuspensions';
import { SUSPENSION_LEVELS, AI_ACTIONS, SUSPENSION_STATUS } from '../../constants/suspensionCriteria';

const SuspensionCandidateTable = ({ onIssueSuspension }) => {
  const { suspensionCandidates, loadSuspensionCandidates, candidatesLoading } = useSuspensions();
  const [selectedCities, setSelectedCities] = useState({});
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

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

  const handleSuspendAll = () => {
    // Filter out cities that already have active suspensions
    const citiesToSuspend = filteredCandidates.filter(c => !c.hasActiveSuspension);

    if (citiesToSuspend.length === 0) {
      alert('All cities already have active suspensions.');
      return;
    }

    if (window.confirm(`Are you sure you want to suspend ${citiesToSuspend.length} cities?`)) {
      citiesToSuspend.forEach(candidate => {
        handleIssueSuspension(candidate);
      });
    }
  };

  // Filter candidates based on search query
  const filteredCandidates = suspensionCandidates.filter(candidate =>
    candidate.city.toLowerCase().includes(searchQuery.toLowerCase())
  );

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
          <div className="flex items-center gap-3">
            <h3 className="text-lg font-semibold text-gray-900">
              Suspension Candidates
            </h3>
            {/* Search Bar */}
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 transform -translate-y-1/2 w-3 h-3 text-gray-400" />
              <Input
                type="text"
                placeholder="Search cities..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-7 h-8 w-56 text-sm shadow-none border-gray-300"
              />
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Button
              onClick={handleSuspendAll}
              disabled={filteredCandidates.filter(c => !c.hasActiveSuspension).length === 0}
              variant="outline"
              size="sm"
              className="border-red-400 text-red-700 hover:bg-red-50 hover:border-red-500 font-semibold shadow-sm"
            >
              <AlertTriangle className="w-4 h-4 mr-2" />
              Suspend All
            </Button>
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
      </div>

      {/* Table Section */}
      <div className="p-6">
        {suspensionCandidates.length === 0 ? (
          <div className="text-center py-12">
            <AlertCircle className="w-16 h-16 mx-auto mb-4 text-gray-300" />
            <p className="text-gray-500">No candidates available</p>
          </div>
        ) : filteredCandidates.length === 0 ? (
          <div className="text-center py-12">
            <Search className="w-16 h-16 mx-auto mb-4 text-gray-300" />
            <p className="text-gray-500">No cities found matching "{searchQuery}"</p>
            <Button
              onClick={() => setSearchQuery('')}
              variant="outline"
              size="sm"
              className="mt-4"
            >
              Clear Search
            </Button>
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
              .tabular-nums {
                font-variant-numeric: tabular-nums;
              }
              .group:hover .group-hover\:block {
                display: block;
                animation: fadeIn 0.2s ease-in;
              }
              @keyframes fadeIn {
                from {
                  opacity: 0;
                  transform: translateY(-4px);
                }
                to {
                  opacity: 1;
                  transform: translateY(0);
                }
              }
            `}</style>
            <table className="w-full">
              <thead className="bg-gray-50 border-b-2 border-gray-200" style={{ position: 'sticky', top: 0, zIndex: 10 }}>
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">City</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">
                    <div className="flex items-center gap-1.5">
                      <span>Rainfall Alert</span>
                      <div className="group relative inline-block">
                        <AlertCircle className="w-3.5 h-3.5 text-gray-400 cursor-help" />
                        <div className="hidden group-hover:block absolute z-50 w-72 p-3 bg-gray-900 text-white text-xs rounded-lg shadow-lg left-0 top-6 whitespace-normal">
                          <p className="mb-2 font-semibold">Data Source & Calculation</p>
                          <p className="mb-2">
                            Warning levels are calculated from current weather data using official PAGASA thresholds:
                          </p>
                          <ul className="space-y-1 ml-3">
                            <li>• Yellow: 7.5-15 mm/h rainfall</li>
                            <li>• Orange: 15-30 mm/h rainfall</li>
                            <li>• Red: 30+ mm/h rainfall</li>
                          </ul>
                          <p className="mt-2 text-gray-300 text-[10px]">
                            Based on DepEd Order No. 022, s. 2024
                          </p>
                        </div>
                      </div>
                    </div>
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase w-28">Rainfall</th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase w-28">Wind</th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase">Reports</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">AI Action</th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase w-32">Action</th>
                </tr>
              </thead>
            <tbody className="divide-y-2 divide-gray-300">
              {filteredCandidates.map((candidate) => (
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
                  <td className="px-4 py-3 text-center w-28">
                    <div className="flex flex-col items-center gap-0.5">
                      <span className="font-bold text-gray-900 tabular-nums">{candidate.criteria.rainfall} mm/h</span>
                      {candidate.criteria.rainfall >= 30 && (
                        <span className="text-xs text-red-600 font-bold">Heavy</span>
                      )}
                      {candidate.criteria.rainfall >= 15 && candidate.criteria.rainfall < 30 && (
                        <span className="text-xs text-orange-600 font-bold">Moderate</span>
                      )}
                      {candidate.criteria.rainfall > 0 && candidate.criteria.rainfall < 15 && (
                        <span className="text-xs text-gray-500">Light</span>
                      )}
                    </div>
                  </td>

                  {/* Wind Speed */}
                  <td className="px-4 py-3 text-center w-28">
                    <div className="flex flex-col items-center gap-0.5">
                      <span className="font-bold text-gray-900 tabular-nums">{candidate.criteria.windSpeed} km/h</span>
                      {candidate.criteria.windSpeed >= 55 && (
                        <span className="text-xs text-red-600 font-bold">Strong</span>
                      )}
                      {candidate.criteria.windSpeed >= 39 && candidate.criteria.windSpeed < 55 && (
                        <span className="text-xs text-orange-600 font-bold">Moderate</span>
                      )}
                      {candidate.criteria.windSpeed > 0 && candidate.criteria.windSpeed < 39 && (
                        <span className="text-xs text-gray-500">Light</span>
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
                          className="bg-red-500 hover:bg-red-600 text-white font-semibold shadow-sm hover:shadow-md transition-all whitespace-nowrap px-6"
                        >
                          Suspend
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
        {filteredCandidates.length > 0 && (
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
