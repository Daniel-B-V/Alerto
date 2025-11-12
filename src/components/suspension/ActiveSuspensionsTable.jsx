/**
 * Active Suspensions Table
 * Shows currently active suspensions with management options
 */

import React, { useState } from 'react';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
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
      preschool: { label: 'Preschool', icon: '👶' },
      k12: { label: 'K-12', icon: '🎒' },
      college: { label: 'College', icon: '🎓' },
      work: { label: 'Work', icon: '💼' },
      activities: { label: 'Activities', icon: '🏃' },
      all: { label: 'All Levels', icon: '🚨' }
    };

    if (levels.includes('all')) {
      return <span>🚨 All Levels</span>;
    }

    return levels.map(level => levelMap[level]?.icon || level).join(' ');
  };

  if (loading) {
    return (
      <Card className="p-6">
        <div className="flex items-center justify-center h-32">
          <span className="text-gray-500">Loading active suspensions...</span>
        </div>
      </Card>
    );
  }

  if (activeSuspensions.length === 0) {
    return (
      <Card className="p-6">
        <div className="text-center py-12 text-gray-500">
          <CheckCircle2 className="w-12 h-12 mx-auto mb-3 text-green-500" />
          <p className="text-lg font-medium text-gray-700">No Active Suspensions</p>
          <p className="text-sm mt-1">All cities have normal class operations</p>
        </div>
      </Card>
    );
  }

  return (
    <>
      <Card className="p-6">
        <div className="mb-4">
          <h2 className="text-xl font-bold text-gray-900">Active Suspensions ({activeSuspensions.length})</h2>
          <p className="text-sm text-gray-500 mt-1">
            Currently active class suspensions across Batangas Province
          </p>
        </div>

        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="font-bold">City</TableHead>
                <TableHead className="font-bold">Levels Suspended</TableHead>
                <TableHead className="font-bold">Issued By</TableHead>
                <TableHead className="font-bold">Issued At</TableHead>
                <TableHead className="font-bold">Time Remaining</TableHead>
                <TableHead className="font-bold">Weather Status</TableHead>
                <TableHead className="font-bold text-center">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {activeSuspensions.map((suspension) => {
                const timeRemaining = getTimeRemaining(suspension.effectiveUntil);
                const isEndingSoon = timeRemaining.includes('h') &&
                  parseInt(timeRemaining) <= 2;

                return (
                  <TableRow key={suspension.id}>
                    {/* City */}
                    <TableCell className="font-medium">
                      <div className="flex items-center">
                        <AlertCircle className="w-4 h-4 text-red-600 mr-2" />
                        {suspension.city}
                      </div>
                    </TableCell>

                    {/* Levels */}
                    <TableCell>
                      <div className="flex items-center">
                        {getLevelsDisplay(suspension.levels)}
                      </div>
                    </TableCell>

                    {/* Issued By */}
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="font-medium text-sm">{suspension.issuedBy.name}</span>
                        <span className="text-xs text-gray-500">{suspension.issuedBy.title}</span>
                      </div>
                    </TableCell>

                    {/* Issued At */}
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="text-sm">
                          {new Date(suspension.issuedAt).toLocaleDateString()}
                        </span>
                        <span className="text-xs text-gray-500">
                          {new Date(suspension.issuedAt).toLocaleTimeString()}
                        </span>
                      </div>
                    </TableCell>

                    {/* Time Remaining */}
                    <TableCell>
                      <div className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border-2 bg-white" style={{ backgroundColor: '#fef2f2', borderColor: '#dc2626' }}>
                        <Clock className="w-4 h-4 text-red-600" />
                        <div>
                          <p className="text-xs text-black">Ends in</p>
                          <p className="text-sm font-bold text-black">{timeRemaining.replace(' remaining', '')}</p>
                        </div>
                      </div>
                      {isEndingSoon && (
                        <Badge variant="outline" className="mt-1 bg-orange-50 text-orange-700 text-xs">
                          Ending Soon
                        </Badge>
                      )}
                    </TableCell>

                    {/* Weather Status */}
                    <TableCell>
                      {getWeatherStatusBadge(suspension.weatherConditionStatus)}
                      {suspension.reevaluationCount > 0 && (
                        <div className="text-xs text-gray-500 mt-1">
                          Checked {suspension.reevaluationCount}x
                        </div>
                      )}
                    </TableCell>

                    {/* Actions */}
                    <TableCell className="text-center">
                      <div className="flex flex-col space-y-1">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleExtendClick(suspension)}
                          className="text-xs"
                        >
                          <Plus className="w-3 h-3 mr-1" />
                          Extend
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleLiftClick(suspension)}
                          className="text-xs text-green-700 border-green-200 hover:bg-green-50"
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
      </Card>

      {/* Lift Suspension Dialog */}
      <Dialog open={liftDialogOpen} onOpenChange={setLiftDialogOpen}>
        <DialogContent>
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

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setLiftDialogOpen(false)}
              disabled={processing}
            >
              Cancel
            </Button>
            <Button
              onClick={handleLiftConfirm}
              disabled={processing}
              className="bg-green-600 hover:bg-green-700"
            >
              {processing ? 'Lifting...' : 'Confirm Lift'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Extend Suspension Dialog */}
      <Dialog open={extendDialogOpen} onOpenChange={setExtendDialogOpen}>
        <DialogContent>
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

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setExtendDialogOpen(false)}
              disabled={processing}
            >
              Cancel
            </Button>
            <Button
              onClick={handleExtendConfirm}
              disabled={processing}
              className="bg-orange-600 hover:bg-orange-700"
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
