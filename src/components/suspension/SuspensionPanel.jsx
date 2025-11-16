/**
 * Suspension Panel
 * Main admin interface for managing class suspensions
 */

import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import SuspensionAnalytics from './SuspensionAnalytics';
import MayorDashboard from './MayorDashboard';
import PendingRequestsTable from './PendingRequestsTable';
import { Card } from '../ui/card';
import { Badge } from '../ui/badge';
import { Alert, AlertDescription } from '../ui/alert';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../ui/dialog';
import { Button } from '../ui/button';
import { AlertCircle, Info, Clock, TrendingUp } from 'lucide-react';
import SuspensionCandidateTable from './SuspensionCandidateTable';
import ActiveSuspensionsTable from './ActiveSuspensionsTable';
import { useSuspensions, useSuspensionStats } from '../../hooks/useSuspensions';
import { SUSPENSION_LEVELS } from '../../constants/suspensionCriteria';
import { useAuth } from '../../contexts/AuthContext';
import { isGovernor, isMayor } from '../../utils/permissions';

const SuspensionPanel = () => {
  const { user } = useAuth();
  const { issueSuspension, error } = useSuspensions();
  const stats = useSuspensionStats();

  const [issueDialogOpen, setIssueDialogOpen] = useState(false);
  const [selectedCandidate, setSelectedCandidate] = useState(null);
  const [selectedLevels, setSelectedLevels] = useState(['k12']);
  const [customMessage, setCustomMessage] = useState('');
  const [durationHours, setDurationHours] = useState(12);
  const [issuing, setIssuing] = useState(false);

  const handleIssueSuspension = (candidateData) => {
    setSelectedCandidate(candidateData);
    setSelectedLevels(candidateData.levels || ['k12']);
    setCustomMessage('');
    setDurationHours(12);
    setIssueDialogOpen(true);
  };

  const handleConfirmIssue = async () => {
    if (!selectedCandidate) return;

    setIssuing(true);
    try {
      const now = new Date();
      const effectiveUntil = new Date(now.getTime() + durationHours * 60 * 60 * 1000);

      const suspensionData = {
        city: selectedCandidate.city,
        province: 'Batangas',
        status: 'active',
        levels: selectedLevels,

        issuedBy: {
          name: 'Governor/Mayor', // TODO: Get from auth context
          title: 'Provincial Governor',
          office: 'Office of the Governor',
          role: 'governor'
        },

        criteria: {
          pagasaWarning: selectedCandidate.pagasaWarning?.id || null,
          tcws: selectedCandidate.tcws?.level || null,
          rainfall: selectedCandidate.criteria.rainfall,
          windSpeed: selectedCandidate.criteria.windSpeed,
          temperature: selectedCandidate.criteria.temperature,
          humidity: selectedCandidate.criteria.humidity,
          conditions: selectedCandidate.criteria.conditions
        },

        aiAnalysis: {
          recommendation: selectedCandidate.aiRecommendation?.shouldSuspend ? 'suspend' : 'monitor',
          confidence: selectedCandidate.aiRecommendation?.confidence || 0,
          reportCount: selectedCandidate.reportCount || 0,
          criticalReports: selectedCandidate.criticalReports || 0,
          summary: selectedCandidate.aiRecommendation?.justification || '',
          justification: selectedCandidate.aiRecommendation?.reason || '',
          riskLevel: selectedCandidate.aiRecommendation?.riskLevel || 'moderate'
        },

        issuedAt: now,
        effectiveFrom: now,
        effectiveUntil,
        durationHours,

        message: customMessage || generateDefaultMessage(selectedCandidate, selectedLevels),
        reason: selectedCandidate.aiRecommendation?.reason ||
          `${selectedCandidate.pagasaWarning?.description || 'Severe weather conditions'}`,

        isAutoSuspended: selectedCandidate.autoSuspend?.shouldAutoSuspend || false,
        isOverridden: false,

        notificationSent: false,
        notificationChannels: ['in_app']
      };

      await issueSuspension(suspensionData);
      setIssueDialogOpen(false);
      setSelectedCandidate(null);

      // Show success message
      alert(`Suspension issued successfully for ${selectedCandidate.city}`);
    } catch (err) {
      console.error('Failed to issue suspension:', err);
      alert(`Failed to issue suspension: ${err.message}`);
    } finally {
      setIssuing(false);
    }
  };

  const generateDefaultMessage = (candidate, levels) => {
    const levelText = levels.includes('all') ? 'all levels' : levels.map(l => {
      const level = SUSPENSION_LEVELS.find(sl => sl.id === l);
      return level?.label || l;
    }).join(', ');

    return `Class suspension for ${levelText} in ${candidate.city} due to ${candidate.pagasaWarning?.label || 'severe weather conditions'}. Stay indoors and monitor updates.`;
  };

  const handleLevelToggle = (levelId) => {
    setSelectedLevels(prev => {
      if (prev.includes(levelId)) {
        return prev.filter(l => l !== levelId);
      }
      return [...prev, levelId];
    });
  };

  // If user is Mayor, show Mayor dashboard instead
  if (isMayor(user)) {
    return <MayorDashboard />;
  }

  // Governor view (full access)
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
              🛑 Alerto: Class Suspension Decision System
            </h1>
            <p className="text-gray-600 text-base mt-1">
              Monitor weather conditions and manage class suspensions across Batangas Province
            </p>
          </div>
          <Badge className="bg-purple-100 text-purple-800 border-purple-200 font-semibold px-4 py-2">
            👑 Governor
          </Badge>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Active Suspensions</p>
                  <p className="text-2xl font-bold text-red-600">{stats.activeCount}</p>
                </div>
                <AlertCircle className="w-8 h-8 text-red-600" />
              </div>
            </Card>

            <Card className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Cities Affected</p>
                  <p className="text-2xl font-bold text-orange-600">{stats.citiesAffected}</p>
                </div>
                <TrendingUp className="w-8 h-8 text-orange-600" />
              </div>
            </Card>

            <Card className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Today's Suspensions</p>
                  <p className="text-2xl font-bold text-blue-600">{stats.totalToday}</p>
                </div>
                <Clock className="w-8 h-8 text-blue-600" />
              </div>
            </Card>

            <Card className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">This Week</p>
                  <p className="text-2xl font-bold text-gray-600">{stats.totalThisWeek}</p>
                </div>
                <Info className="w-8 h-8 text-gray-600" />
              </div>
            </Card>
        </div>

        {/* Error Alert */}
        {error && (
          <Alert variant="destructive" className="bg-red-50 border-red-200">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="text-red-800">{error}</AlertDescription>
          </Alert>
        )}

        {/* Main Content Tabs */}
        <Card className="bg-white shadow-sm">
          <Tabs defaultValue="candidates" className="w-full">
            <div className="border-b border-gray-200">
              <TabsList className="inline-flex h-auto p-0 bg-transparent w-auto gap-0">
                <TabsTrigger
                  value="candidates"
                  className="data-[state=active]:border-b-2 data-[state=active]:border-red-500 data-[state=active]:text-red-600 text-gray-600 rounded-none border-b-2 border-transparent px-6 py-3 font-medium hover:text-gray-900 transition-colors"
                >
                  Suspension Candidates
                </TabsTrigger>
                <TabsTrigger
                  value="active"
                  className="data-[state=active]:border-b-2 data-[state=active]:border-red-500 data-[state=active]:text-red-600 text-gray-600 rounded-none border-b-2 border-transparent px-6 py-3 font-medium hover:text-gray-900 transition-colors"
                >
                  Active Suspensions
                  {stats.activeCount > 0 && (
                    <Badge className="ml-2 bg-red-500 text-white">{stats.activeCount}</Badge>
                  )}
                </TabsTrigger>
                <TabsTrigger
                  value="requests"
                  className="data-[state=active]:border-b-2 data-[state=active]:border-red-500 data-[state=active]:text-red-600 text-gray-600 rounded-none border-b-2 border-transparent px-6 py-3 font-medium hover:text-gray-900 transition-colors"
                >
                  Mayor Requests
                </TabsTrigger>
                <TabsTrigger
                  value="analytics"
                  className="data-[state=active]:border-b-2 data-[state=active]:border-red-500 data-[state=active]:text-red-600 text-gray-600 rounded-none border-b-2 border-transparent px-6 py-3 font-medium hover:text-gray-900 transition-colors"
                >
                  Analytics
                </TabsTrigger>
              </TabsList>
            </div>

            <TabsContent value="candidates" className="m-0 p-0">
              <SuspensionCandidateTable onIssueSuspension={handleIssueSuspension} />
            </TabsContent>

            <TabsContent value="active" className="m-0 p-0">
              <ActiveSuspensionsTable />
            </TabsContent>

            <TabsContent value="requests" className="m-0 p-0">
              <PendingRequestsTable />
            </TabsContent>

            <TabsContent value="analytics" className="m-0 p-0">
              <SuspensionAnalytics />
            </TabsContent>
          </Tabs>
        </Card>
      </div>

      {/* Issue Suspension Dialog */}
      <Dialog open={issueDialogOpen} onOpenChange={setIssueDialogOpen}>
        <DialogContent className="max-h-[85vh] overflow-y-auto" style={{ maxWidth: '800px', width: '95vw' }}>
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">Issue Class Suspension</DialogTitle>
            <DialogDescription className="text-sm">
              Issue official suspension for {selectedCandidate?.city}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-2">
            {/* Weather Summary */}
            <div className="bg-gray-50 p-3 rounded-lg space-y-1.5">
              <h3 className="font-semibold text-sm text-gray-700 mb-2">Weather Conditions</h3>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <span className="text-gray-600">PAGASA Warning:</span>
                  <span className="ml-2 font-medium">
                    {selectedCandidate?.pagasaWarning?.label || 'None'}
                  </span>
                </div>
                <div>
                  <span className="text-gray-600">Rainfall:</span>
                  <span className="ml-2 font-medium">
                    {selectedCandidate?.criteria.rainfall} mm/h
                  </span>
                </div>
                <div>
                  <span className="text-gray-600">Wind Speed:</span>
                  <span className="ml-2 font-medium">
                    {selectedCandidate?.criteria.windSpeed} km/h
                  </span>
                </div>
                <div>
                  <span className="text-gray-600">Reports:</span>
                  <span className="ml-2 font-medium">
                    {selectedCandidate?.reportCount} ({selectedCandidate?.criticalReports} critical)
                  </span>
                </div>
              </div>
            </div>

            {/* AI Recommendation */}
            {selectedCandidate?.aiRecommendation && (
              <div className="bg-blue-50 p-3 rounded-lg">
                <h3 className="font-semibold text-xs text-gray-700 mb-1.5">
                  AI Recommendation ({selectedCandidate.aiRecommendation.confidence}% confidence)
                </h3>
                <p className="text-xs text-gray-700 leading-relaxed">
                  {selectedCandidate.aiRecommendation.justification}
                </p>
              </div>
            )}

            {/* Suspension Levels */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-2">
                Select Suspension Levels *
              </label>
              <div className="space-y-1.5">
                {SUSPENSION_LEVELS.slice(0, 3).map((level) => (
                  <label
                    key={level.id}
                    className="flex items-center space-x-2 p-2 border rounded-lg cursor-pointer hover:bg-gray-50"
                  >
                    <input
                      type="checkbox"
                      checked={selectedLevels.includes(level.id)}
                      onChange={() => handleLevelToggle(level.id)}
                      className="w-4 h-4 text-blue-600 rounded"
                    />
                    <span className="text-xl">{level.icon}</span>
                    <div>
                      <p className="font-medium text-xs">{level.label}</p>
                      <p className="text-xs text-gray-500">{level.description}</p>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            {/* Duration */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                Duration *
              </label>
              <select
                value={durationHours}
                onChange={(e) => setDurationHours(parseInt(e.target.value))}
                className="w-full border border-gray-300 rounded-md p-2 text-sm"
              >
                <option value={2}>2 hours</option>
                <option value={6}>6 hours</option>
                <option value={12}>12 hours (Half day)</option>
                <option value={24}>24 hours (Full day)</option>
                <option value={48}>48 hours (2 days)</option>
              </select>
              <p className="text-xs text-gray-500 mt-1">
                Ends: {new Date(Date.now() + durationHours * 60 * 60 * 1000).toLocaleString()}
              </p>
            </div>

            {/* Custom Message */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                Public Message *
              </label>
              <textarea
                value={customMessage}
                onChange={(e) => setCustomMessage(e.target.value)}
                placeholder={selectedCandidate ? generateDefaultMessage(selectedCandidate, selectedLevels) : ''}
                className="w-full border border-gray-300 rounded-md p-2 text-xs"
                rows={3}
              />
              <p className="text-xs text-gray-500 mt-1">
                This message will be displayed to the public. Leave blank for auto-generated message.
              </p>
            </div>

            {/* Preview */}
            <div className="bg-red-50 border border-red-200 p-3 rounded-lg">
              <h3 className="font-semibold text-xs text-red-900 mb-1.5">Preview:</h3>
              <p className="text-xs text-red-800 leading-relaxed">
                {customMessage || (selectedCandidate ? generateDefaultMessage(selectedCandidate, selectedLevels) : '')}
              </p>
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => setIssueDialogOpen(false)}
              disabled={issuing}
              size="sm"
              className="text-sm"
            >
              Cancel
            </Button>
            <Button
              onClick={handleConfirmIssue}
              disabled={issuing || selectedLevels.length === 0}
              className="bg-red-600 hover:bg-red-700 text-sm"
              size="sm"
            >
              {issuing ? 'Issuing...' : 'Issue Suspension'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default SuspensionPanel;
