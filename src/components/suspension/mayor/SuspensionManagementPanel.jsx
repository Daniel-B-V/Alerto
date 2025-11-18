/**
 * Suspension Management Panel
 * Modal for extending, editing message, or lifting active suspensions
 */

import { useState } from 'react';
import { X, Plus, Edit3, XCircle, AlertTriangle, Clock, CheckCircle } from 'lucide-react';
import { Button } from '../../ui/button';
import { Badge } from '../../ui/badge';

const EXTEND_OPTIONS = [
  { value: 2, label: '2 hours' },
  { value: 6, label: '6 hours' },
  { value: 12, label: '12 hours' },
  { value: 24, label: '24 hours' }
];

export function SuspensionManagementPanel({
  isOpen,
  onClose,
  suspension,
  action, // 'extend', 'edit', or 'lift'
  onConfirm,
  isLoading = false
}) {
  const [extendHours, setExtendHours] = useState(6);
  const [editedMessage, setEditedMessage] = useState(suspension?.message || '');
  const [liftReason, setLiftReason] = useState('');

  if (!isOpen || !suspension) return null;

  const handleConfirm = () => {
    if (action === 'extend') {
      onConfirm({ extendHours });
    } else if (action === 'edit') {
      onConfirm({ newMessage: editedMessage.trim() });
    } else if (action === 'lift') {
      onConfirm({ reason: liftReason.trim() });
    }
  };

  const getNewEndTime = () => {
    if (action !== 'extend') return null;
    const currentEnd = new Date(suspension.effectiveUntil);
    const newEnd = new Date(currentEnd.getTime() + extendHours * 60 * 60 * 1000);
    return newEnd.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  const renderExtendContent = () => (
    <>
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
        <div className="flex items-start gap-3">
          <Plus className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <div>
            <h4 className="font-bold text-blue-900 mb-1">Extend Suspension</h4>
            <p className="text-sm text-blue-800">
              Add more time to the current suspension. The new end time will be adjusted accordingly.
            </p>
          </div>
        </div>
      </div>

      {/* Current Info */}
      <div className="bg-gray-50 rounded-lg p-4 mb-6">
        <div className="text-sm text-gray-600 mb-2">Current End Time:</div>
        <div className="font-bold text-gray-900">
          {new Date(suspension.effectiveUntil).toLocaleString('en-US', {
            month: 'short',
            day: 'numeric',
            hour: 'numeric',
            minute: '2-digit',
            hour12: true
          })}
        </div>
      </div>

      {/* Extension Options */}
      <div className="mb-6">
        <label className="block text-sm font-semibold text-gray-900 mb-3">
          Extend By:
        </label>
        <div className="grid grid-cols-2 gap-3">
          {EXTEND_OPTIONS.map(({ value, label }) => (
            <button
              key={value}
              onClick={() => setExtendHours(value)}
              className={`p-4 border-2 rounded-lg font-medium transition-all ${
                extendHours === value
                  ? 'border-blue-500 bg-blue-50 text-blue-700'
                  : 'border-gray-200 hover:border-gray-300 text-gray-700'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* New End Time Preview */}
      <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
        <div className="flex items-start gap-3">
          <Clock className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <div className="text-sm text-green-700 mb-1">New End Time:</div>
            <div className="font-bold text-green-900 text-lg">{getNewEndTime()}</div>
          </div>
        </div>
      </div>
    </>
  );

  const renderEditContent = () => (
    <>
      <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6">
        <div className="flex items-start gap-3">
          <Edit3 className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
          <div>
            <h4 className="font-bold text-amber-900 mb-1">Edit Public Message</h4>
            <p className="text-sm text-amber-800">
              Update the message that will be shown to schools and the public.
            </p>
          </div>
        </div>
      </div>

      {/* Current Message */}
      <div className="mb-4">
        <label className="block text-sm font-semibold text-gray-900 mb-2">
          Current Message:
        </label>
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 text-sm text-gray-700">
          {suspension.message || 'No message set'}
        </div>
      </div>

      {/* New Message Input */}
      <div className="mb-6">
        <label className="block text-sm font-semibold text-gray-900 mb-2">
          New Message:
        </label>
        <textarea
          value={editedMessage}
          onChange={(e) => setEditedMessage(e.target.value)}
          placeholder="Enter updated message..."
          rows={5}
          maxLength={500}
          className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:outline-none resize-none"
        />
        <div className="mt-1 text-xs text-gray-500 text-right">
          {editedMessage.length}/500 characters
        </div>
      </div>
    </>
  );

  const renderLiftContent = () => (
    <>
      <div className="bg-red-50 border-2 border-red-300 rounded-lg p-4 mb-6">
        <div className="flex items-start gap-3">
          <AlertTriangle className="w-6 h-6 text-red-600 flex-shrink-0 mt-0.5" />
          <div>
            <h4 className="font-bold text-red-900 mb-1">Lift Suspension Early</h4>
            <p className="text-sm text-red-800">
              You are about to end this suspension before its scheduled end time. This action will immediately notify schools and the public.
            </p>
          </div>
        </div>
      </div>

      {/* Suspension Details */}
      <div className="bg-gray-50 rounded-lg p-4 mb-6">
        <div className="space-y-3">
          <div>
            <div className="text-sm text-gray-600 mb-1">Issued:</div>
            <div className="font-semibold text-gray-900">
              {new Date(suspension.issuedAt).toLocaleString('en-US', {
                month: 'short',
                day: 'numeric',
                hour: 'numeric',
                minute: '2-digit',
                hour12: true
              })}
            </div>
          </div>
          <div>
            <div className="text-sm text-gray-600 mb-1">Scheduled End:</div>
            <div className="font-semibold text-gray-900">
              {new Date(suspension.effectiveUntil).toLocaleString('en-US', {
                month: 'short',
                day: 'numeric',
                hour: 'numeric',
                minute: '2-digit',
                hour12: true
              })}
            </div>
          </div>
          <div>
            <div className="text-sm text-gray-600 mb-1">Duration:</div>
            <div className="font-semibold text-gray-900">{suspension.durationHours} hours</div>
          </div>
        </div>
      </div>

      {/* Reason for Lifting */}
      <div className="mb-6">
        <label className="block text-sm font-semibold text-gray-900 mb-2">
          Reason for Early Lift (Optional):
        </label>
        <textarea
          value={liftReason}
          onChange={(e) => setLiftReason(e.target.value)}
          placeholder="e.g., Weather conditions have improved significantly..."
          rows={4}
          maxLength={300}
          className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:outline-none resize-none"
        />
        <div className="mt-1 text-xs text-gray-500 text-right">
          {liftReason.length}/300 characters
        </div>
      </div>
    </>
  );

  const getTitleInfo = () => {
    if (action === 'extend') return { title: 'Extend Suspension', icon: Plus, color: 'blue' };
    if (action === 'edit') return { title: 'Edit Message', icon: Edit3, color: 'amber' };
    if (action === 'lift') return { title: 'Lift Suspension', icon: XCircle, color: 'red' };
    return { title: 'Manage Suspension', icon: AlertTriangle, color: 'gray' };
  };

  const titleInfo = getTitleInfo();
  const TitleIcon = titleInfo.icon;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 p-6 flex items-center justify-between rounded-t-2xl">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg ${
              titleInfo.color === 'blue' ? 'bg-blue-100' :
              titleInfo.color === 'amber' ? 'bg-amber-100' :
              titleInfo.color === 'red' ? 'bg-red-100' :
              'bg-gray-100'
            }`}>
              <TitleIcon className={`w-6 h-6 ${
                titleInfo.color === 'blue' ? 'text-blue-600' :
                titleInfo.color === 'amber' ? 'text-amber-600' :
                titleInfo.color === 'red' ? 'text-red-600' :
                'text-gray-600'
              }`} />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900">{titleInfo.title}</h2>
              <p className="text-sm text-gray-600 mt-1">
                {suspension.city} • Active Suspension
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={isLoading}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {action === 'extend' && renderExtendContent()}
          {action === 'edit' && renderEditContent()}
          {action === 'lift' && renderLiftContent()}

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4 border-t border-gray-200">
            <Button
              onClick={onClose}
              variant="outline"
              disabled={isLoading}
              className="flex-1 border-gray-300"
            >
              Cancel
            </Button>
            <Button
              onClick={handleConfirm}
              disabled={isLoading || (action === 'edit' && !editedMessage.trim())}
              className={`flex-1 text-white ${
                action === 'extend' ? 'bg-blue-600 hover:bg-blue-700' :
                action === 'edit' ? 'bg-amber-600 hover:bg-amber-700' :
                'bg-red-600 hover:bg-red-700'
              }`}
            >
              {isLoading ? (
                <span className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  Processing...
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4" />
                  {action === 'extend' && 'Confirm Extension'}
                  {action === 'edit' && 'Update Message'}
                  {action === 'lift' && 'Lift Suspension'}
                </span>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default SuspensionManagementPanel;
