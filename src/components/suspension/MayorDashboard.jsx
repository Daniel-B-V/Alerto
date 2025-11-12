/**
 * Mayor Dashboard
 * City-specific view for mayors to monitor and request suspensions
 */

import React, { useState, useEffect } from 'react';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Alert, AlertDescription } from '../ui/alert';
import {
  AlertTriangle,
  Clock,
  CloudRain,
  Wind,
  CheckCircle,
  Send
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useSuspensions } from '../../hooks/useSuspensions';
import { getUserCity } from '../../utils/permissions';
import { getBatangasWeatherWithSuspensionCriteria } from '../../services/weatherService';
import { submitSuspensionRequest, getRequestsByCity } from '../../services/suspensionRequestService';
import { SUSPENSION_LEVELS } from '../../constants/suspensionCriteria';
import WeatherForecastChart from './WeatherForecastChart';

const MayorDashboard = () => {
  const { user } = useAuth();
  const { activeSuspensions } = useSuspensions();
  const [cityWeather, setCityWeather] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [myRequests, setMyRequests] = useState([]);
  const [selectedLevels, setSelectedLevels] = useState(['k12']);
  const [reason, setReason] = useState('');
  const [durationHours, setDurationHours] = useState(12);
  const [submitting, setSubmitting] = useState(false);

  const userCity = getUserCity(user);

  // Load city weather data
  useEffect(() => {
    const loadCityWeather = async () => {
      try {
        setLoading(true);
        const allWeather = await getBatangasWeatherWithSuspensionCriteria();
        const myCityWeather = allWeather.find(w => w.city === userCity);
        setCityWeather(myCityWeather);
      } catch (error) {
        console.error('Error loading city weather:', error);
      } finally {
        setLoading(false);
      }
    };

    if (userCity) {
      loadCityWeather();
      // Refresh every 5 minutes
      const interval = setInterval(loadCityWeather, 5 * 60 * 1000);
      return () => clearInterval(interval);
    }
  }, [userCity]);

  // Load my requests
  useEffect(() => {
    const loadRequests = async () => {
      if (userCity) {
        const requests = await getRequestsByCity(userCity);
        setMyRequests(requests);
      }
    };

    loadRequests();
  }, [userCity]);

  // Submit suspension request
  const handleSubmitRequest = async () => {
    if (!reason.trim()) {
      alert('Please provide a reason for the suspension request');
      return;
    }

    if (selectedLevels.length === 0) {
      alert('Please select at least one suspension level');
      return;
    }

    setSubmitting(true);
    try {
      await submitSuspensionRequest({
        city: userCity,
        userId: user.uid,
        userName: user.displayName || user.email,
        levels: selectedLevels,
        durationHours,
        reason,
        weatherData: cityWeather?.criteria || {},
        reportCount: 0, // TODO: Get actual report count
        criticalReports: 0
      });

      alert('✅ Suspension request submitted to Governor');
      setShowRequestModal(false);
      setReason('');
      setSelectedLevels(['k12']);
      setDurationHours(12);

      // Reload requests
      const requests = await getRequestsByCity(userCity);
      setMyRequests(requests);
    } catch (error) {
      alert('❌ Failed to submit request: ' + error.message);
    } finally {
      setSubmitting(false);
    }
  };

  const toggleLevel = (levelId) => {
    setSelectedLevels(prev => {
      if (prev.includes(levelId)) {
        return prev.filter(l => l !== levelId);
      } else {
        return [...prev, levelId];
      }
    });
  };

  // Check if city has active suspension
  const activeSuspension = activeSuspensions.find(s => s.city === userCity);

  if (!userCity) {
    return (
      <Card className="p-6">
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            No city assigned to your account. Please contact the administrator.
          </AlertDescription>
        </Alert>
      </Card>
    );
  }

  if (loading) {
    return (
      <Card className="p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-gray-500">Loading {userCity} weather data...</div>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{userCity} Dashboard</h1>
          <p className="text-sm text-gray-500 mt-1">Mayor's Suspension Management</p>
        </div>
        <Badge className="bg-blue-100 text-blue-800 border-blue-200">
          🏛️ Mayor
        </Badge>
      </div>

      {/* Active Suspension Alert */}
      {activeSuspension && (
        <Alert className="bg-red-50 border-red-200">
          <AlertTriangle className="h-4 w-4 text-red-600" />
          <AlertDescription>
            <div className="font-semibold text-red-900">Active Suspension in {userCity}</div>
            <div className="text-sm text-red-700 mt-1">
              Levels: {activeSuspension.levels.join(', ')} •
              Until: {new Date(activeSuspension.effectiveUntil).toLocaleString()}
            </div>
          </AlertDescription>
        </Alert>
      )}

      {/* Weather Summary Card */}
      <Card className="p-6">
        <h2 className="text-lg font-bold mb-4">Current Weather Conditions</h2>

        {cityWeather ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {/* Rainfall */}
            <div className="flex items-start space-x-3">
              <CloudRain className="w-5 h-5 text-blue-500 mt-1" />
              <div>
                <div className="text-xs text-gray-500">Rainfall</div>
                <div className="text-xl font-bold">{cityWeather.criteria.rainfall} mm/h</div>
                {cityWeather.pagasaWarning && (
                  <Badge className={`mt-1 text-xs ${
                    cityWeather.pagasaWarning.id === 'red' ? 'bg-red-100 text-red-700' :
                    cityWeather.pagasaWarning.id === 'orange' ? 'bg-orange-100 text-orange-700' :
                    'bg-yellow-100 text-yellow-700'
                  }`}>
                    {cityWeather.pagasaWarning.label}
                  </Badge>
                )}
              </div>
            </div>

            {/* Wind Speed */}
            <div className="flex items-start space-x-3">
              <Wind className="w-5 h-5 text-gray-500 mt-1" />
              <div>
                <div className="text-xs text-gray-500">Wind Speed</div>
                <div className="text-xl font-bold">{cityWeather.criteria.windSpeed} km/h</div>
              </div>
            </div>

            {/* Temperature */}
            <div className="flex items-start space-x-3">
              <div className="w-5 h-5 text-orange-500 mt-1">🌡️</div>
              <div>
                <div className="text-xs text-gray-500">Temperature</div>
                <div className="text-xl font-bold">{cityWeather.criteria.temperature}°C</div>
              </div>
            </div>

            {/* Humidity */}
            <div className="flex items-start space-x-3">
              <div className="w-5 h-5 text-blue-400 mt-1">💧</div>
              <div>
                <div className="text-xs text-gray-500">Humidity</div>
                <div className="text-xl font-bold">{cityWeather.criteria.humidity}%</div>
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">
            No weather data available for {userCity}
          </div>
        )}
      </Card>

      {/* Weather Forecast Chart */}
      {userCity && (
        <WeatherForecastChart city={userCity} />
      )}

      {/* AI Recommendation */}
      {cityWeather && (
        <Card className="p-6">
          <h2 className="text-lg font-bold mb-4">AI Assessment</h2>

          {cityWeather.autoSuspend.shouldAutoSuspend ? (
            <Alert className="bg-red-50 border-red-200">
              <AlertTriangle className="h-4 w-4 text-red-600" />
              <AlertDescription>
                <div className="font-semibold text-red-900">Auto-Suspend Criteria Met</div>
                <div className="text-sm text-red-700 mt-2">
                  {cityWeather.autoSuspend.triggers.map((trigger, idx) => (
                    <div key={idx}>• {trigger.description}</div>
                  ))}
                </div>
              </AlertDescription>
            </Alert>
          ) : (
            <Alert className="bg-green-50 border-green-200">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <AlertDescription>
                <div className="font-semibold text-green-900">No immediate suspension criteria met</div>
                <div className="text-sm text-green-700 mt-1">
                  Weather conditions are within safe thresholds
                </div>
              </AlertDescription>
            </Alert>
          )}
        </Card>
      )}

      {/* Request Suspension Action */}
      <Card className="p-6">
        <h2 className="text-lg font-bold mb-4">Suspension Request</h2>

        {activeSuspension ? (
          <Alert>
            <Clock className="h-4 w-4" />
            <AlertDescription>
              A suspension is already active for {userCity}.
              Contact the Governor to extend or modify it.
            </AlertDescription>
          </Alert>
        ) : (
          <div>
            <p className="text-sm text-gray-600 mb-4">
              As a Mayor, you can submit a suspension request to the Provincial Governor for approval.
              The Governor will review weather conditions and community reports before making a decision.
            </p>

            <Button
              onClick={() => setShowRequestModal(true)}
              className="bg-blue-600 hover:bg-blue-700"
              disabled={!cityWeather}
            >
              <Send className="w-4 h-4 mr-2" />
              Request Suspension from Governor
            </Button>
          </div>
        )}
      </Card>

      {/* Info Card */}
      <Card className="p-6 bg-blue-50 border-blue-200">
        <h3 className="font-semibold text-blue-900 mb-2">Mayor's Authority</h3>
        <ul className="text-sm text-blue-700 space-y-1">
          <li>• View weather data for {userCity} only</li>
          <li>• Submit suspension requests to the Governor</li>
          <li>• Monitor active suspensions in your city</li>
          <li>• View community reports from your area</li>
        </ul>
        <p className="text-xs text-blue-600 mt-3">
          Only the Provincial Governor can officially issue suspensions.
        </p>
      </Card>

      {/* Pending Requests */}
      {myRequests.length > 0 && (
        <Card className="p-6">
          <h2 className="text-lg font-bold mb-4">My Suspension Requests</h2>
          <div className="space-y-3">
            {myRequests.slice(0, 5).map(request => (
              <div key={request.id} className="border rounded-lg p-4">
                <div className="flex justify-between items-start">
                  <div>
                    <div className="font-medium">{request.city}</div>
                    <div className="text-sm text-gray-600">
                      {request.requestedLevels.join(', ')} • {request.requestedDuration}hrs
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      {request.createdAt?.toLocaleString()}
                    </div>
                  </div>
                  <Badge className={
                    request.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                    request.status === 'approved' ? 'bg-green-100 text-green-800' :
                    request.status === 'rejected' ? 'bg-red-100 text-red-800' :
                    'bg-gray-100 text-gray-800'
                  }>
                    {request.status}
                  </Badge>
                </div>
                {request.governorNotes && (
                  <div className="mt-2 text-sm text-gray-700 bg-gray-50 p-2 rounded">
                    <strong>Governor's Note:</strong> {request.governorNotes}
                  </div>
                )}
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Request Modal */}
      {showRequestModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <Card className="p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <h3 className="text-xl font-bold mb-4">Request Class Suspension</h3>

            {/* Suspension Levels */}
            <div className="mb-4">
              <label className="block text-sm font-medium mb-2">Suspension Levels</label>
              <div className="grid grid-cols-2 gap-2">
                {SUSPENSION_LEVELS.slice(0, 3).map(level => (
                  <label key={level.id} className="flex items-center space-x-2 p-2 border rounded cursor-pointer hover:bg-gray-50">
                    <input
                      type="checkbox"
                      checked={selectedLevels.includes(level.id)}
                      onChange={() => toggleLevel(level.id)}
                      className="rounded"
                    />
                    <span className="text-sm">{level.icon} {level.label}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Duration */}
            <div className="mb-4">
              <label className="block text-sm font-medium mb-2">Duration</label>
              <select
                value={durationHours}
                onChange={(e) => setDurationHours(Number(e.target.value))}
                className="w-full border rounded px-3 py-2"
              >
                <option value={2}>2 hours</option>
                <option value={4}>4 hours</option>
                <option value={6}>6 hours</option>
                <option value={12}>12 hours (Half day)</option>
                <option value={24}>24 hours (Full day)</option>
                <option value={48}>48 hours (2 days)</option>
              </select>
            </div>

            {/* Reason */}
            <div className="mb-4">
              <label className="block text-sm font-medium mb-2">Reason / Justification</label>
              <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Explain why you're requesting this suspension (e.g., heavy rainfall, flooding reports, strong winds)..."
                className="w-full border rounded px-3 py-2 h-24"
              />
            </div>

            {/* Current Weather Summary */}
            {cityWeather && (
              <div className="mb-4 bg-blue-50 p-3 rounded">
                <div className="text-sm font-medium mb-1">Current Conditions:</div>
                <div className="text-xs text-gray-700">
                  Rainfall: {cityWeather.criteria.rainfall}mm/h •
                  Wind: {cityWeather.criteria.windSpeed}km/h •
                  Temp: {cityWeather.criteria.temperature}°C
                </div>
              </div>
            )}

            {/* Buttons */}
            <div className="flex justify-end space-x-2">
              <Button
                onClick={() => setShowRequestModal(false)}
                variant="outline"
                disabled={submitting}
              >
                Cancel
              </Button>
              <Button
                onClick={handleSubmitRequest}
                disabled={submitting || !reason.trim() || selectedLevels.length === 0}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {submitting ? 'Submitting...' : 'Submit Request'}
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
};

export default MayorDashboard;
