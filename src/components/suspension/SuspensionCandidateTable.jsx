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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../ui/table';
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
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            🛑 Suspension Candidates
          </h2>
          <p className="text-sm text-gray-600 mt-2 font-medium">
            AI-assessed cities based on weather conditions and community reports
            {suspensionCandidates.length > 0 && (
              <span className="ml-2 text-gray-500">
                • Last updated: {new Date(suspensionCandidates[0]?.lastUpdated).toLocaleTimeString()}
              </span>
            )}
          </p>
        </div>
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

      {suspensionCandidates.length === 0 ? (
        <div className="text-center py-16 text-gray-500 bg-gray-50 rounded-lg">
          <AlertCircle className="w-16 h-16 mx-auto mb-4 text-gray-300" />
          <p className="text-lg font-semibold text-gray-700">No candidates available</p>
          <p className="text-sm mt-2 text-gray-600">Weather conditions are safe across all cities</p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-gray-200">
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-100 hover:bg-gray-100">
                <TableHead className="font-bold text-gray-900">City</TableHead>
                <TableHead className="font-bold text-gray-900">PAGASA Warning</TableHead>
                <TableHead className="font-bold text-gray-900 text-right">Rainfall</TableHead>
                <TableHead className="font-bold text-gray-900 text-right">Wind</TableHead>
                <TableHead className="font-bold text-gray-900 text-center">Reports</TableHead>
                <TableHead className="font-bold text-gray-900">AI Action</TableHead>
                <TableHead className="font-bold text-gray-900">Suspension Levels</TableHead>
                <TableHead className="font-bold text-gray-900 text-center">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {suspensionCandidates.map((candidate) => (
                <TableRow
                  key={candidate.city}
                  className={
                    candidate.hasActiveSuspension
                      ? 'bg-red-50 hover:bg-red-100'
                      : candidate.autoSuspend.shouldAutoSuspend
                      ? 'bg-orange-50 hover:bg-orange-100'
                      : 'hover:bg-gray-50'
                  }
                >
                  {/* City */}
                  <TableCell className="font-semibold text-gray-900">
                    <div className="flex items-center gap-2">
                      <span>{candidate.city}</span>
                      {candidate.hasActiveSuspension && (
                        <Badge variant="outline" className="bg-red-100 text-red-700 border-red-300 text-xs font-bold">
                          ACTIVE
                        </Badge>
                      )}
                    </div>
                  </TableCell>

                  {/* PAGASA Warning */}
                  <TableCell>
                    <div className="flex flex-col gap-1">
                      {getPAGASABadge(candidate.pagasaWarning)}
                      {candidate.tcws && (
                        <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200 font-medium">
                          🌀 TCWS #{candidate.tcws.level}
                        </Badge>
                      )}
                    </div>
                  </TableCell>

                  {/* Rainfall */}
                  <TableCell className="text-right">
                    <div className="flex flex-col items-end">
                      <span className="font-bold text-gray-900">{candidate.criteria.rainfall} mm/h</span>
                      {candidate.criteria.rainfall >= 30 && (
                        <span className="text-xs text-red-600 font-bold">Heavy</span>
                      )}
                      {candidate.criteria.rainfall >= 15 && candidate.criteria.rainfall < 30 && (
                        <span className="text-xs text-orange-600 font-bold">Moderate</span>
                      )}
                    </div>
                  </TableCell>

                  {/* Wind Speed */}
                  <TableCell className="text-right">
                    <div className="flex flex-col items-end">
                      <span className="font-bold text-gray-900">{candidate.criteria.windSpeed} km/h</span>
                      {candidate.criteria.windSpeed >= 55 && (
                        <span className="text-xs text-red-600 font-bold">Strong</span>
                      )}
                    </div>
                  </TableCell>

                  {/* Reports */}
                  <TableCell className="text-center">
                    <div className="flex flex-col items-center">
                      <span className="font-bold text-gray-900">{candidate.reportCount}</span>
                      {candidate.criticalReports > 0 && (
                        <span className="text-xs text-red-600 font-bold">
                          ({candidate.criticalReports} critical)
                        </span>
                      )}
                    </div>
                  </TableCell>

                  {/* AI Action */}
                  <TableCell>
                    {getAIActionBadge(candidate.aiRecommendation)}
                  </TableCell>

                  {/* Suspension Levels */}
                  <TableCell>
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
                  </TableCell>

                  {/* Action Buttons */}
                  <TableCell className="text-center">
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
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Legend */}
      <div className="mt-6 pt-4 border-t border-gray-200 bg-gray-50 -mx-6 -mb-6 px-6 py-4 rounded-b-lg">
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
    </div>
  );
};

export default SuspensionCandidateTable;
