/**
 * Quick Suspend Modal
 * Modal for mayors to issue city-wide suspension with confirmation
 */

import { useState } from 'react';
import { X, AlertTriangle, Clock, School, CheckCircle } from 'lucide-react';
import { Button } from '../../ui/button';
import { Badge } from '../../ui/badge';
import { Checkbox } from '../../ui/checkbox';

const DURATION_OPTIONS = [
  { value: 12, label: '12 hours' },
  { value: 24, label: '24 hours' },
  { value: 48, label: '48 hours' },
  { value: -1, label: 'Custom' }
];

export function QuickSuspendModal({
  isOpen,
  onClose,
  onConfirm,
  cityName,
  weatherData,
  aiRecommendation,
  isLoading = false
}) {
  const [selectedLevels, setSelectedLevels] = useState(['elementary', 'high_school']);
  const [durationHours, setDurationHours] = useState(12);
  const [customDuration, setCustomDuration] = useState('');
  const [customMessage, setCustomMessage] = useState('');
  const [showConfirmation, setShowConfirmation] = useState(false);

  if (!isOpen) return null;

  const handleLevelToggle = (level) => {
    setSelectedLevels(prev =>
      prev.includes(level)
        ? prev.filter(l => l !== level)
        : [...prev, level]
    );
  };

  const handleDurationChange = (value) => {
    setDurationHours(value);
    if (value !== -1) {
      setCustomDuration('');
    }
  };

  const getEffectiveTime = () => {
    const hours = durationHours === -1 ? parseInt(customDuration) || 0 : durationHours;
    const effectiveUntil = new Date(Date.now() + hours * 60 * 60 * 1000);
    return {
      hours,
      endTime: effectiveUntil.toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
      })
    };
  };

  const handleSubmit = () => {
    if (selectedLevels.length === 0) {
      alert('Please select at least one suspension level');
      return;
    }

    const hours = durationHours === -1 ? parseInt(customDuration) : durationHours;
    if (!hours || hours <= 0) {
      alert('Please enter a valid duration');
      return;
    }

    setShowConfirmation(true);
  };

  const handleConfirm = () => {
    const hours = durationHours === -1 ? parseInt(customDuration) : durationHours;
    onConfirm({
      levels: selectedLevels,
      durationHours: hours,
      customMessage: customMessage.trim()
    });
  };

  const { hours, endTime } = getEffectiveTime();

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl flex flex-col" style={{ width: '768px', maxWidth: '90vw', maxHeight: '85vh' }}>
        {/* Header */}
        <div className="flex-shrink-0 bg-white border-b border-gray-200 p-6 flex items-center justify-between rounded-t-2xl">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Issue City-Wide Suspension</h2>
            <p className="text-sm text-gray-600 mt-1">
              {cityName} • {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
            </p>
          </div>
          <button
            onClick={onClose}
            disabled={isLoading}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <div className="p-6 space-y-6 overflow-y-auto flex-1">
          {/* Confirmation View */}
          {showConfirmation ? (
            <div className="space-y-6">
              {/* Warning Alert */}
              <div className="bg-amber-50 border-2 border-amber-300 rounded-xl p-4">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="w-6 h-6 text-amber-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <h3 className="font-bold text-amber-900 mb-1">Confirm Suspension</h3>
                    <p className="text-sm text-amber-800">
                      You are about to issue a city-wide suspension for {cityName}.
                      This action will immediately notify schools and the public.
                    </p>
                  </div>
                </div>
              </div>

              {/* Suspension Summary */}
              <div className="bg-gray-50 rounded-xl p-5 space-y-4">
                <h3 className="font-bold text-gray-900">Suspension Details</h3>

                {/* Levels */}
                <div>
                  <div className="text-sm text-gray-600 mb-2">Suspension Levels:</div>
                  <div className="flex flex-wrap gap-2">
                    {selectedLevels.map(level => (
                      <Badge key={level} className="bg-red-100 text-red-700 border-red-300">
                        {level === 'elementary' && 'Elementary'}
                        {level === 'high_school' && 'High School'}
                        {level === 'preschool' && 'Preschool'}
                        {level === 'college' && 'College'}
                      </Badge>
                    ))}
                  </div>
                </div>

                {/* Duration */}
                <div>
                  <div className="text-sm text-gray-600 mb-2">Duration:</div>
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-blue-600" />
                    <span className="font-semibold text-gray-900">{hours} hours</span>
                    <span className="text-gray-500">•</span>
                    <span className="text-sm text-gray-600">Until {endTime}</span>
                  </div>
                </div>

                {/* Custom Message */}
                {customMessage && (
                  <div>
                    <div className="text-sm text-gray-600 mb-2">Message:</div>
                    <div className="bg-white border border-gray-200 rounded-lg p-3 text-sm text-gray-700">
                      {customMessage}
                    </div>
                  </div>
                )}

                {/* Weather Context */}
                {weatherData && (
                  <div>
                    <div className="text-sm text-gray-600 mb-2">Weather Conditions:</div>
                    <div className="grid grid-cols-2 gap-3">
                      {weatherData.rainfall > 0 && (
                        <div className="text-sm">
                          <span className="text-gray-600">Rainfall:</span>
                          <span className="ml-2 font-semibold text-gray-900">{weatherData.rainfall} mm/h</span>
                        </div>
                      )}
                      {weatherData.windSpeed > 0 && (
                        <div className="text-sm">
                          <span className="text-gray-600">Wind:</span>
                          <span className="ml-2 font-semibold text-gray-900">{weatherData.windSpeed} km/h</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3">
                <Button
                  onClick={() => setShowConfirmation(false)}
                  variant="outline"
                  disabled={isLoading}
                  className="flex-1"
                  style={{ backgroundColor: '#f3f4f6', borderColor: '#d1d5db', color: '#374151' }}
                >
                  Go Back
                </Button>
                <Button
                  onClick={handleConfirm}
                  disabled={isLoading}
                  className="flex-1"
                  style={{ backgroundColor: '#dc2626', color: 'white' }}
                >
                  {isLoading ? (
                    <span className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                      Issuing...
                    </span>
                  ) : (
                    <span className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4" />
                      Confirm & Issue Suspension
                    </span>
                  )}
                </Button>
              </div>
            </div>
          ) : (
            /* Setup View */
            <div className="space-y-6">
              {/* Weather Conditions */}
              {weatherData && (
                <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                  <h3 className="font-bold text-gray-900 mb-3">Weather Conditions</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">PAGASA Warning:</span>
                      <span className="font-semibold text-gray-900">
                        {weatherData.pagasaWarning || 'None'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">Rainfall:</span>
                      <span className="font-semibold text-gray-900">
                        {weatherData.rainfall || 0} mm/h
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">Wind Speed:</span>
                      <span className="font-semibold text-gray-900">
                        {weatherData.windSpeed || 0} km/h
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">Reports:</span>
                      <span className="font-semibold text-gray-900">
                        {weatherData.criticalReports || 0} (0 critical)
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* AI Recommendation */}
              {aiRecommendation && (
                <div className="bg-blue-50 rounded-xl p-4 border border-blue-200">
                  <h3 className="font-bold text-gray-900 mb-1">
                    AI Recommendation {aiRecommendation.confidence && `(${aiRecommendation.confidence}% confidence)`}
                  </h3>
                  <p className="text-sm text-gray-700">
                    {aiRecommendation.summary || (aiRecommendation.shouldSuspend
                      ? 'Current weather conditions meet suspension criteria.'
                      : 'Weather conditions do not currently warrant suspension.')}
                  </p>
                </div>
              )}

              {/* Suspension Levels */}
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-3">
                  Suspension Levels <span className="text-red-500">*</span>
                </label>
                <div className="space-y-2">
                  {[
                    { value: 'preschool', label: 'Preschool', icon: School },
                    { value: 'elementary', label: 'Elementary', icon: School },
                    { value: 'high_school', label: 'High School', icon: School },
                    { value: 'college', label: 'College', icon: School }
                  ].map(({ value, label, icon: Icon }) => (
                    <label
                      key={value}
                      className="flex items-center gap-3 p-3 rounded-lg border-2 border-gray-300 hover:bg-gray-50 cursor-pointer transition-colors"
                    >
                      <input
                        type="checkbox"
                        checked={selectedLevels.includes(value)}
                        onChange={() => handleLevelToggle(value)}
                        className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                      />
                      <Icon className="w-5 h-5 text-gray-600" />
                      <span className="flex-1 text-sm font-medium text-gray-900">{label}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Duration */}
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-3">
                  Duration <span className="text-red-500">*</span>
                </label>
                <select
                  value={durationHours}
                  onChange={(e) => handleDurationChange(Number(e.target.value))}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none font-medium text-gray-700 bg-white"
                >
                  {DURATION_OPTIONS.map(({ value, label }) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>

                {durationHours === -1 && (
                  <input
                    type="number"
                    value={customDuration}
                    onChange={(e) => setCustomDuration(e.target.value)}
                    placeholder="Enter hours (e.g., 8)"
                    min="1"
                    max="120"
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none mt-3"
                  />
                )}

                {hours > 0 && (
                  <div className="mt-3 text-sm text-gray-600">
                    Suspension will end on <span className="font-semibold text-gray-900">{endTime}</span>
                  </div>
                )}
              </div>

              {/* Custom Message */}
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">
                  Custom Message (Optional)
                </label>
                <textarea
                  value={customMessage}
                  onChange={(e) => setCustomMessage(e.target.value)}
                  placeholder="Add a message to be included in the suspension announcement..."
                  rows={4}
                  maxLength={500}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none resize-none"
                />
                <div className="mt-1 text-xs text-gray-500 text-right">
                  {customMessage.length}/500 characters
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-4 border-t border-gray-200">
                <Button
                  onClick={onClose}
                  variant="outline"
                  disabled={isLoading}
                  className="flex-1"
                  style={{ backgroundColor: '#f3f4f6', borderColor: '#d1d5db', color: '#374151' }}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleSubmit}
                  disabled={isLoading || selectedLevels.length === 0 || hours <= 0}
                  className="flex-1"
                  style={{ backgroundColor: '#2563eb', color: 'white' }}
                >
                  Continue to Review
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default QuickSuspendModal;
