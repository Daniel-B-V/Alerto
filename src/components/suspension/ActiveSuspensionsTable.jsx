/**
 * Active Suspensions Table
 * Shows currently active suspensions with management options
 */

import React, { useState } from 'react';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../ui/dialog';
import {
  AlertCircle,
  TrendingUp,
  TrendingDown,
  Minus,
  Clock,
  CheckCircle2,
  Plus,
  Edit2,
  XCircle
} from 'lucide-react';
import { useSuspensions } from '../../hooks/useSuspensions';
import { SUSPENSION_LEVELS, formatDuration } from '../../constants/suspensionCriteria';

const ActiveSuspensionsTable = () => {
  const { activeSuspensions, liftSuspension, extendSuspension, loading } = useSuspensions();
  const [liftDialogOpen, setLiftDialogOpen] = useState(false);
  const [extendDialogOpen, setExtendDialogOpen] = useState(false);
  const [selectedSuspension, setSelectedSuspension] = useState(null);
  const [liftReason, setLiftReason] = useState('');
  const [extendHours, setExtendHours] = useState(6);
  const [extendReason, setExtendReason] = useState('');
  const [processing, setProcessing] = useState(false);

  const handleLiftClick = (suspension) => {
    setSelectedSuspension(suspension);
    setLiftReason('');
    setLiftDialogOpen(true);
  };

  const handleExtendClick = (suspension) => {
    setSelectedSuspension(suspension);
    setExtendHours(6);
    setExtendReason('');
    setExtendDialogOpen(true);
  };

  const handleLiftConfirm = async () => {
    if (!selectedSuspension) return;

    setProcessing(true);
    try {
      await liftSuspension(selectedSuspension.id, {
        updates: [{
          updatedAt: new Date(),
          field: 'status',
          oldValue: 'active',
          newValue: 'lifted',
          updatedBy: 'Current User', // TODO: Get from auth
          reason: liftReason || 'Weather conditions improved'
        }]
      });

      setLiftDialogOpen(false);
      setSelectedSuspension(null);
    } catch (error) {
      console.error('Failed to lift suspension:', error);
      alert('Failed to lift suspension. Please try again.');
    } finally {
      setProcessing(false);
    }
  };

  const handleExtendConfirm = async () => {
    if (!selectedSuspension) return;

    setProcessing(true);
    try {
      const newEffectiveUntil = new Date(
        new Date(selectedSuspension.effectiveUntil).getTime() + extendHours * 60 * 60 * 1000
      );

      await extendSuspension(selectedSuspension.id, {
        newEffectiveUntil,
        reason: extendReason || 'Weather conditions remain severe',
        extendedBy: 'Current User' // TODO: Get from auth
      });

      setExtendDialogOpen(false);
      setSelectedSuspension(null);
    } catch (error) {
      console.error('Failed to extend suspension:', error);
      alert('Failed to extend suspension. Please try again.');
    } finally {
      setProcessing(false);
    }
  };

  const getTimeRemaining = (effectiveUntil) => {
    const now = new Date();
    const end = new Date(effectiveUntil);
    const diff = end - now;

    if (diff <= 0) return 'Expired';

    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

    if (hours === 0) {
      return `${minutes}m remaining`;
    }

    return `${hours}h ${minutes}m remaining`;
  };

  const getWeatherStatusBadge = (status) => {
    if (!status) return null;

    const icons = {
      improving: <TrendingDown className="w-3 h-3" />,
      stable: <Minus className="w-3 h-3" />,
      worsening: <TrendingUp className="w-3 h-3" />
    };

    const colors = {
      improving: 'bg-green-50 text-green-700 border-green-200',
      stable: 'bg-yellow-50 text-yellow-700 border-yellow-200',
      worsening: 'bg-red-50 text-red-700 border-red-200'
    };

    const labels = {
      improving: 'Improving',
      stable: 'Stable',
      worsening: 'Worsening'
    };

    return (
      <Badge variant="outline" className={colors[status]}>
        {icons[status]}
        <span className="ml-1">{labels[status]}</span>
      </Badge>
    );
  };

  const getLevelsDisplay = (levels) => {
    const levelMap = {
      preschool: { label: 'Preschool', color: 'bg-gray-100 text-gray-700 border-gray-300' },
      elementary: { label: 'Elementary', color: 'bg-gray-100 text-gray-700 border-gray-300' },
      high_school: { label: 'High School', color: 'bg-gray-100 text-gray-700 border-gray-300' },
      college: { label: 'College', color: 'bg-gray-100 text-gray-700 border-gray-300' },
      work: { label: 'Work', color: 'bg-gray-100 text-gray-700 border-gray-300' },
      activities: { label: 'Activities', color: 'bg-gray-100 text-gray-700 border-gray-300' },
      all: { label: 'All Levels', color: 'bg-gray-100 text-gray-700 border-gray-300' }
    };

    if (levels.includes('all')) {
      return (
        <Badge className="bg-gray-100 text-gray-700 border-gray-300">
          All Levels
        </Badge>
      );
    }

    return (
      <div className="flex flex-wrap gap-1.5">
        {levels.map(level => {
          const levelData = levelMap[level];
          return levelData ? (
            <Badge key={level} className={levelData.color}>
              {levelData.label}
            </Badge>
          ) : null;
        })}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-32">
        <span className="text-gray-500">Loading active suspensions...</span>
      </div>
    );
  }

  if (activeSuspensions.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500">
        <CheckCircle2 className="w-12 h-12 mx-auto mb-3 text-green-500" />
        <p className="text-lg font-medium text-gray-700">No Active Suspensions</p>
        <p className="text-sm mt-1 mb-32">All cities have normal class operations</p>
      </div>
    );
  }

  return (
    <>
      <div className="p-6">
        <div className="mb-4">
          <h2 className="text-xl font-bold text-gray-900">Active Suspensions ({activeSuspensions.length})</h2>
          <p className="text-sm text-gray-500 mt-1">
            Currently active class suspensions across Batangas Province
          </p>
        </div>

        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="border-b-2 border-gray-300 bg-gray-50">
                <TableHead className="font-bold text-left w-32">City</TableHead>
                <TableHead className="font-bold text-left w-80">Levels Suspended</TableHead>
                <TableHead className="font-bold text-left w-40">Issued By</TableHead>
                <TableHead className="font-bold text-left w-40">Issued At</TableHead>
                <TableHead className="font-bold text-left w-48">Time Remaining</TableHead>
                <TableHead className="font-bold text-left w-32">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {activeSuspensions.map((suspension) => {
                const timeRemaining = getTimeRemaining(suspension.effectiveUntil);
                const isEndingSoon = timeRemaining.includes('h') &&
                  parseInt(timeRemaining) <= 2;

                return (
                  <TableRow key={suspension.id} className="h-24 border-b border-gray-200">
                    {/* City */}
                    <TableCell className="p-4">
                      <div className="flex items-center gap-2">
                        <AlertCircle className="w-4 h-4 text-red-600" />
                        <span className="font-medium">{suspension.city}</span>
                      </div>
                    </TableCell>

                    {/* Levels */}
                    <TableCell className="p-4">
                      {getLevelsDisplay(suspension.levels)}
                    </TableCell>

                    {/* Issued By */}
                    <TableCell className="p-4">
                      <div>
                        <div className="font-medium text-sm">Governor/Mayor</div>
                        <div className="text-xs text-gray-500">Provincial Governor</div>
                      </div>
                    </TableCell>

                    {/* Issued At */}
                    <TableCell className="p-4">
                      <div>
                        <div className="text-sm">{new Date(suspension.issuedAt).toLocaleDateString()}</div>
                        <div className="text-xs text-gray-500">{new Date(suspension.issuedAt).toLocaleTimeString()}</div>
                      </div>
                    </TableCell>

                    {/* Time Remaining */}
                    <TableCell className="p-4">
                      <div className="flex flex-col gap-1.5">
                        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border-2 w-fit" style={{ backgroundColor: '#fef2f2', borderColor: '#dc2626' }}>
                          <Clock className="w-4 h-4 text-red-600" />
                          <div>
                            <p className="text-xs text-gray-600">Ends in</p>
                            <p className="text-sm font-bold text-red-600">{timeRemaining.replace(' remaining', '')}</p>
                          </div>
                        </div>
                        {isEndingSoon && (
                          <Badge variant="outline" className="bg-orange-50 text-orange-700 text-xs w-fit">
                            Ending Soon
                          </Badge>
                        )}
                      </div>
                    </TableCell>

                    {/* Actions */}
                    <TableCell className="p-4">
                      <div className="flex flex-col gap-1.5">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleExtendClick(suspension)}
                          className="text-xs w-20 h-8"
                        >
                          <Plus className="w-3 h-3 mr-1" />
                          Extend
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleLiftClick(suspension)}
                          className="text-xs text-green-700 border-green-200 hover:bg-green-50 w-20 h-8"
                        >
                          <CheckCircle2 className="w-3 h-3 mr-1" />
                          Lift
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Lift Suspension Dialog */}
      <Dialog open={liftDialogOpen} onOpenChange={setLiftDialogOpen}>
        <DialogContent style={{ maxWidth: '500px', width: '90vw', borderRadius: '16px' }}>
          <DialogHeader>
            <DialogTitle>Lift Suspension</DialogTitle>
            <DialogDescription>
              Are you sure you want to lift the suspension for {selectedSuspension?.city}?
            </DialogDescription>
          </DialogHeader>

          <div className="py-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Reason for lifting (optional)
            </label>
            <textarea
              className="w-full border border-gray-300 rounded-md p-2 text-sm"
              rows={3}
              placeholder="e.g., Weather conditions have improved, no longer raining..."
              value={liftReason}
              onChange={(e) => setLiftReason(e.target.value)}
            />
          </div>

          <DialogFooter className="gap-2 flex justify-end">
            <Button
              variant="outline"
              onClick={() => setLiftDialogOpen(false)}
              disabled={processing}
              style={{ backgroundColor: '#f3f4f6', borderColor: '#d1d5db', color: '#374151' }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleLiftConfirm}
              disabled={processing}
              style={{ backgroundColor: '#22c55e', color: 'white' }}
            >
              {processing ? 'Lifting...' : 'Confirm Lift'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Extend Suspension Dialog */}
      <Dialog open={extendDialogOpen} onOpenChange={setExtendDialogOpen}>
        <DialogContent style={{ maxWidth: '500px', width: '90vw', borderRadius: '16px' }}>
          <DialogHeader>
            <DialogTitle>Extend Suspension</DialogTitle>
            <DialogDescription>
              Extend the suspension for {selectedSuspension?.city}
            </DialogDescription>
          </DialogHeader>

          <div className="py-4 space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Extend by (hours)
              </label>
              <select
                className="w-full border border-gray-300 rounded-md p-2 text-sm"
                value={extendHours}
                onChange={(e) => setExtendHours(parseInt(e.target.value))}
              >
                <option value={2}>2 hours</option>
                <option value={4}>4 hours</option>
                <option value={6}>6 hours</option>
                <option value={12}>12 hours</option>
                <option value={24}>24 hours</option>
              </select>
              {selectedSuspension && (
                <p className="text-xs text-gray-500 mt-1">
                  New end time: {new Date(
                    new Date(selectedSuspension.effectiveUntil).getTime() + extendHours * 60 * 60 * 1000
                  ).toLocaleString()}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Reason for extension (optional)
              </label>
              <textarea
                className="w-full border border-gray-300 rounded-md p-2 text-sm"
                rows={3}
                placeholder="e.g., Weather conditions remain severe, continued heavy rainfall..."
                value={extendReason}
                onChange={(e) => setExtendReason(e.target.value)}
              />
            </div>
          </div>

          <DialogFooter className="gap-2 flex justify-end">
            <Button
              variant="outline"
              onClick={() => setExtendDialogOpen(false)}
              disabled={processing}
              style={{ backgroundColor: '#f3f4f6', borderColor: '#d1d5db', color: '#374151' }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleExtendConfirm}
              disabled={processing}
              style={{ backgroundColor: '#f97316', color: 'white' }}
            >
              {processing ? 'Extending...' : 'Confirm Extension'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default ActiveSuspensionsTable;
