/**
 * Suspension Panel
 * Main admin interface for managing class suspensions
 */

import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import SuspensionAnalytics from './SuspensionAnalytics';
import MayorDashboard from './MayorDashboard';
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
import { AlertCircle, Info, Clock, TrendingUp, CheckCircle, RefreshCw, AlertTriangle, School } from 'lucide-react';
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
  const [selectedLevels, setSelectedLevels] = useState(['elementary', 'high_school']);
  const [customMessage, setCustomMessage] = useState('');
  const [durationHours, setDurationHours] = useState(12);
  const [issuing, setIssuing] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [successCity, setSuccessCity] = useState('');
  const [bulkSuspendDialogOpen, setBulkSuspendDialogOpen] = useState(false);
  const [citiesToBulkSuspend, setCitiesToBulkSuspend] = useState([]);
  const [bulkSuspending, setBulkSuspending] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);

  const handleIssueSuspension = (candidateData) => {
    setSelectedCandidate(candidateData);
    setSelectedLevels(candidateData.levels || ['elementary', 'high_school']);
    setCustomMessage('');
    setDurationHours(12);
    setShowConfirmation(false);
    setIssueDialogOpen(true);
  };

  const handleContinueToReview = () => {
    if (selectedLevels.length === 0) {
      alert('Please select at least one suspension level');
      return;
    }
    setShowConfirmation(true);
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
      setSuccessCity(selectedCandidate.city);
      setSelectedCandidate(null);

      // Show success modal
      setShowSuccessModal(true);
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

  const handleSuspendAll = (cities) => {
    setCitiesToBulkSuspend(cities);
    setBulkSuspendDialogOpen(true);
  };

  const handleConfirmBulkSuspend = async () => {
    setBulkSuspending(true);
    let successCount = 0;

    try {
      for (const candidate of citiesToBulkSuspend) {
        const now = new Date();
        const effectiveUntil = new Date(now.getTime() + 12 * 60 * 60 * 1000); // Default 12 hours

        const suspensionData = {
          city: candidate.city,
          province: 'Batangas',
          status: 'active',
          levels: candidate.levels || ['k12'],

          issuedBy: {
            name: 'Governor/Mayor',
            title: 'Provincial Governor',
            office: 'Office of the Governor',
            role: 'governor'
          },

          criteria: {
            pagasaWarning: candidate.pagasaWarning?.id || null,
            tcws: candidate.tcws?.level || null,
            rainfall: candidate.criteria.rainfall,
            windSpeed: candidate.criteria.windSpeed,
            temperature: candidate.criteria.temperature,
            humidity: candidate.criteria.humidity,
            conditions: candidate.criteria.conditions
          },

          aiAnalysis: {
            recommendation: candidate.aiRecommendation?.shouldSuspend ? 'suspend' : 'monitor',
            confidence: candidate.aiRecommendation?.confidence || 0,
            reportCount: candidate.reportCount || 0,
            criticalReports: candidate.criticalReports || 0,
            summary: candidate.aiRecommendation?.justification || '',
            justification: candidate.aiRecommendation?.reason || '',
            riskLevel: candidate.aiRecommendation?.riskLevel || 'moderate'
          },

          issuedAt: now,
          effectiveFrom: now,
          effectiveUntil,
          durationHours: 12,

          message: generateDefaultMessage(candidate, candidate.levels || ['k12']),
          reason: candidate.pagasaWarning?.description || 'Severe weather conditions',

          isAutoSuspended: false,
          isOverridden: false,

          notificationSent: false,
          notificationChannels: ['in_app']
        };

        await issueSuspension(suspensionData);
        successCount++;
      }

      setBulkSuspendDialogOpen(false);
      setCitiesToBulkSuspend([]);
      setSuccessCity(`${successCount} cities`);
      setShowSuccessModal(true);
    } catch (err) {
      console.error('Failed to issue bulk suspensions:', err);
      alert(`Failed to issue suspensions. ${successCount} of ${citiesToBulkSuspend.length} succeeded.`);
    } finally {
      setBulkSuspending(false);
    }
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
            Governor
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
                    <Badge className="ml-3 bg-red-500 text-white">{stats.activeCount}</Badge>
                  )}
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
              <SuspensionCandidateTable onIssueSuspension={handleIssueSuspension} onSuspendAll={handleSuspendAll} />
            </TabsContent>

            <TabsContent value="active" className="m-0 p-0">
              <ActiveSuspensionsTable />
            </TabsContent>

            <TabsContent value="analytics" className="m-0 p-0">
              <SuspensionAnalytics />
            </TabsContent>
          </Tabs>
        </Card>
      </div>

      {/* Issue Suspension Dialog */}
      <Dialog open={issueDialogOpen} onOpenChange={(open) => {
        setIssueDialogOpen(open);
        if (!open) setShowConfirmation(false);
      }}>
        <DialogContent className="max-h-[85vh] overflow-y-auto" style={{ maxWidth: '768px', width: '90vw', borderRadius: '16px' }}>
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">
              {showConfirmation ? 'Confirm Suspension' : 'Issue Class Suspension'}
            </DialogTitle>
            <DialogDescription className="text-sm">
              {showConfirmation ? 'Review and confirm suspension details' : `Issue official suspension for ${selectedCandidate?.city}`}
            </DialogDescription>
          </DialogHeader>

          {showConfirmation ? (
            /* Confirmation View */
            <div className="space-y-6 py-4">
              {/* Suspension Summary */}
              <div className="bg-gray-50 rounded-xl p-6 space-y-5">
                <h3 className="font-bold text-gray-900 text-lg">Suspension Details</h3>

                {/* City */}
                <div className="leading-relaxed">
                  <div className="text-sm text-gray-600 mb-2 leading-normal">City:</div>
                  <div className="font-semibold text-gray-900 text-base leading-relaxed">{selectedCandidate?.city}</div>
                </div>

                {/* Levels */}
                <div className="leading-relaxed">
                  <div className="text-sm text-gray-600 mb-2 leading-normal">Suspension Levels:</div>
                  <div className="flex flex-wrap gap-2 mt-1">
                    {selectedLevels.map(level => {
                      const levelData = SUSPENSION_LEVELS.find(l => l.id === level);
                      return (
                        <Badge key={level} className="bg-red-100 text-red-700 border-red-300">
                          {levelData?.shortLabel}
                        </Badge>
                      );
                    })}
                  </div>
                </div>

                {/* Duration */}
                <div className="leading-relaxed">
                  <div className="text-sm text-gray-600 mb-2 leading-normal">Duration:</div>
                  <div className="flex items-center gap-2 leading-relaxed">
                    <Clock className="w-4 h-4 text-blue-600" />
                    <span className="font-semibold text-gray-900">{durationHours} hours</span>
                    <span className="text-gray-500">•</span>
                    <span className="text-sm text-gray-600">
                      Until {new Date(Date.now() + durationHours * 60 * 60 * 1000).toLocaleString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        hour: 'numeric',
                        minute: '2-digit',
                        hour12: true
                      })}
                    </span>
                  </div>
                </div>

                {/* Custom Message */}
                <div className="leading-relaxed">
                  <div className="text-sm text-gray-600 mb-2 leading-normal">Message:</div>
                  <div className="bg-white border border-gray-200 rounded-lg p-4 text-sm text-gray-700 leading-relaxed mt-1">
                    {customMessage || (selectedCandidate ? generateDefaultMessage(selectedCandidate, selectedLevels) : '')}
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <DialogFooter className="gap-2 flex justify-end">
                <Button
                  variant="outline"
                  onClick={() => setShowConfirmation(false)}
                  disabled={issuing}
                  size="sm"
                  className="text-sm"
                  style={{ backgroundColor: '#f3f4f6', borderColor: '#d1d5db', color: '#374151' }}
                >
                  Go Back
                </Button>
                <Button
                  onClick={handleConfirmIssue}
                  disabled={issuing}
                  className="text-sm flex items-center gap-2"
                  size="sm"
                  style={{ backgroundColor: '#dc2626', color: 'white' }}
                >
                  {issuing ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                      Issuing...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="w-4 h-4" />
                      Confirm & Issue Suspension
                    </>
                  )}
                </Button>
              </DialogFooter>
            </div>
          ) : (
            /* Setup View */
            <div className="space-y-3 py-2">
            {/* Suspension Levels */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-2">
                Select Suspension Levels *
              </label>
              <div className="space-y-2">
                {SUSPENSION_LEVELS.slice(0, 4).map((level) => (
                  <label
                    key={level.id}
                    className="flex items-center gap-3 p-3 rounded-lg border-2 border-gray-300 hover:bg-gray-50 cursor-pointer transition-colors"
                  >
                    <input
                      type="checkbox"
                      checked={selectedLevels.includes(level.id)}
                      onChange={() => handleLevelToggle(level.id)}
                      className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                    />
                    <School className="w-5 h-5 text-gray-600" />
                    <span className="flex-1 text-sm font-medium text-gray-900">
                      {level.shortLabel}
                    </span>
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
                className="w-full border-2 border-gray-300 rounded-lg px-4 py-3 text-sm font-medium focus:border-blue-500 focus:outline-none"
              >
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
                className="w-full border-2 border-gray-300 rounded-lg px-4 py-3 text-sm focus:border-blue-500 focus:outline-none resize-none"
                rows={4}
                maxLength={500}
              />
              <div className="flex items-center justify-between mt-1">
                <p className="text-xs text-gray-500">
                  This message will be displayed to the public. Leave blank for auto-generated message.
                </p>
                <p className="text-xs text-gray-500">
                  {customMessage.length}/500
                </p>
              </div>
            </div>

            <DialogFooter className="gap-2 flex justify-end pt-4 border-t border-gray-200">
              <Button
                variant="outline"
                onClick={() => setIssueDialogOpen(false)}
                disabled={issuing}
                size="sm"
                className="text-sm"
                style={{ backgroundColor: '#f3f4f6', borderColor: '#d1d5db', color: '#374151' }}
              >
                Cancel
              </Button>
              <Button
                onClick={handleContinueToReview}
                disabled={selectedLevels.length === 0}
                className="text-sm"
                size="sm"
                style={{ backgroundColor: '#2563eb', color: 'white' }}
              >
                Continue to Review
              </Button>
            </DialogFooter>
          </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Success Modal */}
      {showSuccessModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div
            className="bg-white rounded-2xl shadow-2xl p-6 flex flex-col items-center"
            style={{ width: '360px', maxWidth: '90vw' }}
          >
            <CheckCircle className="w-16 h-16 text-green-500 mb-4" />
            <h3 className="text-xl font-bold text-gray-900 mb-2">Success!</h3>
            <p className="text-gray-600 text-center mb-6">
              Suspension issued successfully for {successCity}
            </p>
            <button
              onClick={() => setShowSuccessModal(false)}
              className="w-full py-3 rounded-lg font-semibold"
              style={{ backgroundColor: '#22c55e', color: 'white' }}
            >
              OK
            </button>
          </div>
        </div>
      )}

      {/* Bulk Suspend Confirmation Dialog */}
      {bulkSuspendDialogOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div
            className="bg-white rounded-2xl shadow-2xl overflow-hidden"
            style={{ width: '500px', maxWidth: '90vw', maxHeight: '80vh' }}
          >
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                <AlertTriangle className="w-6 h-6 text-red-500" />
                Confirm Bulk Suspension
              </h3>
              <p className="text-sm text-gray-600 mt-2">
                You are about to suspend {citiesToBulkSuspend.length} cities. This action will immediately notify schools and the public.
              </p>
            </div>

            <div className="p-6 overflow-y-auto" style={{ maxHeight: '300px' }}>
              <p className="text-sm font-semibold text-gray-700 mb-3">Cities to be suspended:</p>
              <div className="space-y-2">
                {citiesToBulkSuspend.map((city, index) => (
                  <div key={index} className="flex items-center gap-2 text-sm">
                    <span className="w-5 h-5 bg-red-100 text-red-600 rounded-full flex items-center justify-center text-xs font-bold">
                      {index + 1}
                    </span>
                    <span className="font-medium">{city.city}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="p-6 border-t border-gray-200 flex gap-3 justify-end">
              <button
                onClick={() => {
                  setBulkSuspendDialogOpen(false);
                  setCitiesToBulkSuspend([]);
                }}
                disabled={bulkSuspending}
                className="px-4 py-2 rounded-lg font-semibold"
                style={{ backgroundColor: '#f3f4f6', color: '#374151' }}
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmBulkSuspend}
                disabled={bulkSuspending}
                className="px-4 py-2 rounded-lg font-semibold flex items-center gap-2"
                style={{ backgroundColor: '#dc2626', color: 'white' }}
              >
                {bulkSuspending ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    Suspending...
                  </>
                ) : (
                  <>
                    <AlertTriangle className="w-4 h-4" />
                    Suspend All {citiesToBulkSuspend.length} Cities
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SuspensionPanel;
