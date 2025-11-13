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
  Send,
  Activity
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useSuspensions } from '../../hooks/useSuspensions';
import { getUserCity } from '../../utils/permissions';
import { getBatangasWeatherWithSuspensionCriteria } from '../../services/weatherService';
import { submitSuspensionRequest, getRequestsByCity } from '../../services/suspensionRequestService';
import { SUSPENSION_LEVELS } from '../../constants/suspensionCriteria';
import WeatherForecastChart from './WeatherForecastChart';
import BarangayInsightsPanel from '../dashboard/mayor/BarangayInsightsPanel';
import { DashboardAnnouncementCard } from './DashboardAnnouncementCard';

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
      <div className="mb-6 flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            {userCity} Dashboard
          </h1>
          <p className="text-gray-600">
            Mayor's Weather Monitoring & Suspension Management
          </p>
        </div>
        <Badge className="bg-gradient-to-r from-blue-500 to-indigo-500 text-white px-4 py-2 text-sm font-semibold">
          🏛️ Mayor
        </Badge>
      </div>

      {/* Class Suspension Announcement */}
      <DashboardAnnouncementCard />

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

      {/* Current Weather Data Cards */}
      {cityWeather && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Rainfall */}
          <Card className="bg-white !border-2 !border-blue-500 shadow-sm hover:shadow-md transition-all duration-200">
            <div className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Rainfall</p>
                  <p className="text-2xl font-bold text-gray-900">{cityWeather.criteria.rainfall} mm/h</p>
                  {cityWeather.pagasaWarning && (
                    <Badge className={`mt-2 text-xs ${
                      cityWeather.pagasaWarning.id === 'red' ? 'bg-red-500 text-white' :
                      cityWeather.pagasaWarning.id === 'orange' ? 'bg-orange-500 text-white' :
                      'bg-yellow-500 text-white'
                    }`}>
                      {cityWeather.pagasaWarning.label}
                    </Badge>
                  )}
                </div>
                <CloudRain className="w-8 h-8 text-blue-500" />
              </div>
            </div>
          </Card>

          {/* Wind Speed */}
          <Card className="bg-white !border-2 !border-purple-500 shadow-sm hover:shadow-md transition-all duration-200">
            <div className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Wind Speed</p>
                  <p className="text-2xl font-bold text-gray-900">{cityWeather.criteria.windSpeed} km/h</p>
                  <p className="text-xs text-gray-500 mt-1">
                    {cityWeather.criteria.windSpeed > 30 ? 'Gusty winds' :
                     cityWeather.criteria.windSpeed > 15 ? 'Moderate' : 'Light'}
                  </p>
                </div>
                <Wind className="w-8 h-8 text-purple-500" />
              </div>
            </div>
          </Card>

          {/* Temperature */}
          <Card className="bg-white !border-2 !border-orange-500 shadow-sm hover:shadow-md transition-all duration-200">
            <div className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Temperature</p>
                  <p className="text-2xl font-bold text-gray-900">{cityWeather.criteria.temperature}°C</p>
                  <p className="text-xs text-gray-500 mt-1">Current temp</p>
                </div>
                <div className="text-4xl">🌡️</div>
              </div>
            </div>
          </Card>

          {/* Humidity */}
          <Card className="bg-white !border-2 !border-cyan-500 shadow-sm hover:shadow-md transition-all duration-200">
            <div className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Humidity</p>
                  <p className="text-2xl font-bold text-gray-900">{cityWeather.criteria.humidity}%</p>
                  <p className="text-xs text-gray-500 mt-1">
                    {cityWeather.criteria.humidity > 80 ? 'Very High' :
                     cityWeather.criteria.humidity > 60 ? 'High' : 'Normal'}
                  </p>
                </div>
                <div className="text-4xl">💧</div>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Weather Forecast Chart */}
      {userCity && (
        <WeatherForecastChart city={userCity} />
      )}

      {/* Barangay Insights Panel */}
      <BarangayInsightsPanel />

      {/* AI Recommendation */}
      {cityWeather && (
        <Card className="bg-white/70 backdrop-blur-sm border-gray-200/50 shadow-sm hover:shadow-md transition-all duration-200">
          <div className="p-6">
            <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
              <div className="p-2 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg">
                <Activity className="w-5 h-5 text-white" />
              </div>
              AI Assessment
            </h2>

            {cityWeather.autoSuspend.shouldAutoSuspend ? (
              <Alert className="!border-2 !border-red-500 bg-gradient-to-r from-red-50 to-orange-50">
                <AlertTriangle className="h-5 w-5 text-red-600" />
                <AlertDescription>
                  <div className="font-semibold text-red-900 text-base">Auto-Suspend Criteria Met</div>
                  <div className="text-sm text-red-700 mt-2 space-y-1">
                    {cityWeather.autoSuspend.triggers.map((trigger, idx) => (
                      <div key={idx} className="flex items-start gap-2">
                        <span className="text-red-500 mt-0.5">•</span>
                        <span>{trigger.description}</span>
                      </div>
                    ))}
                  </div>
                </AlertDescription>
              </Alert>
            ) : (
              <Alert className="!border-2 !border-green-500 bg-gradient-to-r from-green-50 to-emerald-50">
                <CheckCircle className="h-5 w-5 text-green-600" />
                <AlertDescription>
                  <div className="font-semibold text-green-900 text-base">No immediate suspension criteria met</div>
                  <div className="text-sm text-green-700 mt-1">
                    Weather conditions are within safe thresholds
                  </div>
                </AlertDescription>
              </Alert>
            )}
          </div>
        </Card>
      )}

      {/* Request Suspension Action */}
      <Card className="bg-white/70 backdrop-blur-sm border-gray-200/50 shadow-sm hover:shadow-md transition-all duration-200">
        <div className="p-6">
          <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
            <div className="p-2 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-lg">
              <Send className="w-5 h-5 text-white" />
            </div>
            Suspension Request
          </h2>

          {activeSuspension ? (
            <Alert className="!border-2 !border-yellow-500 bg-gradient-to-r from-yellow-50 to-amber-50">
              <Clock className="h-5 w-5 text-yellow-600" />
              <AlertDescription>
                <div className="font-semibold text-yellow-900">
                  A suspension is already active for {userCity}.
                </div>
                <div className="text-sm text-yellow-700 mt-1">
                  Contact the Governor to extend or modify it.
                </div>
              </AlertDescription>
            </Alert>
          ) : (
            <div>
              <p className="text-sm text-gray-600 mb-4">
                As a Mayor, you can submit a <strong>city-wide suspension request</strong> to the Provincial Governor for approval.
                The suspension will affect all barangays in {userCity}. The Governor will review weather conditions and community reports before making a decision.
              </p>

              <Button
                onClick={() => setShowRequestModal(true)}
                className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-md hover:shadow-lg transition-all duration-200"
                disabled={!cityWeather}
              >
                <Send className="w-4 h-4 mr-2" />
                Request City-Wide Suspension
              </Button>
            </div>
          )}
        </div>
      </Card>

      {/* Info Card */}
      <Card className="!border-2 !border-blue-500 bg-gradient-to-r from-blue-50 to-indigo-50 shadow-sm hover:shadow-md transition-all duration-200">
        <div className="p-6">
          <h3 className="font-semibold text-blue-900 mb-3 text-lg flex items-center gap-2">
            <div className="p-1.5 bg-blue-500 rounded-lg">
              <CheckCircle className="w-4 h-4 text-white" />
            </div>
            Mayor's Authority
          </h3>
          <ul className="text-sm text-blue-700 space-y-2">
            <li className="flex items-start gap-2">
              <span className="text-blue-500 mt-0.5">•</span>
              <span>View weather data for {userCity} only</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-500 mt-0.5">•</span>
              <span>Submit suspension requests to the Governor</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-500 mt-0.5">•</span>
              <span>Monitor active suspensions in your city</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-500 mt-0.5">•</span>
              <span>View community reports from your area</span>
            </li>
          </ul>
          <div className="mt-4 p-3 bg-white/50 rounded-lg">
            <p className="text-xs text-blue-800 font-medium">
              ℹ️ Only the Provincial Governor can officially issue suspensions.
            </p>
          </div>
        </div>
      </Card>

      {/* Pending Requests */}
      {myRequests.length > 0 && (
        <Card className="bg-white/70 backdrop-blur-sm border-gray-200/50 shadow-sm hover:shadow-md transition-all duration-200">
          <div className="p-6">
            <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
              <div className="p-2 bg-gradient-to-r from-green-500 to-emerald-500 rounded-lg">
                <Clock className="w-5 h-5 text-white" />
              </div>
              My Suspension Requests
            </h2>
            <div className="space-y-3">
              {myRequests.slice(0, 5).map(request => (
                <div key={request.id} className="border-2 border-gray-200 rounded-lg p-4 bg-white hover:border-blue-300 transition-all duration-200">
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="font-semibold text-gray-900">{request.city}</div>
                      <div className="text-sm text-gray-600 mt-1">
                        {request.requestedLevels.join(', ')} • {request.requestedDuration}hrs
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        {request.createdAt?.toLocaleString()}
                      </div>
                    </div>
                    <Badge className={
                      request.status === 'pending' ? 'bg-yellow-500 text-white' :
                      request.status === 'approved' ? 'bg-green-500 text-white' :
                      request.status === 'rejected' ? 'bg-red-500 text-white' :
                      'bg-gray-500 text-white'
                    }>
                      {request.status}
                    </Badge>
                  </div>
                  {request.governorNotes && (
                    <div className="mt-3 text-sm text-gray-700 bg-gradient-to-r from-gray-50 to-blue-50 p-3 rounded-lg border border-gray-200">
                      <strong className="text-gray-900">Governor's Note:</strong> {request.governorNotes}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </Card>
      )}

      {/* Request Modal */}
      {showRequestModal && (
        <div className="fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <Card className="!border-2 !border-blue-500 shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto bg-white">
            <div className="p-6">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-lg">
                  <Send className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900">Request City-Wide Class Suspension</h3>
              </div>
              <p className="text-sm text-gray-600 mb-6 ml-14">This will affect all barangays in {userCity}</p>

              {/* Suspension Levels */}
              <div className="mb-6">
                <label className="block text-sm font-semibold text-gray-900 mb-3">Suspension Levels</label>
                <div className="grid grid-cols-2 gap-3">
                  {SUSPENSION_LEVELS.slice(0, 3).map(level => (
                    <label key={level.id} className="flex items-center space-x-3 p-3 border-2 rounded-lg cursor-pointer hover:bg-blue-50 hover:border-blue-400 transition-all duration-200">
                      <input
                        type="checkbox"
                        checked={selectedLevels.includes(level.id)}
                        onChange={() => toggleLevel(level.id)}
                        className="rounded w-4 h-4"
                      />
                      <span className="text-sm font-medium">{level.icon} {level.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Duration */}
              <div className="mb-6">
                <label className="block text-sm font-semibold text-gray-900 mb-3">Duration</label>
                <select
                  value={durationHours}
                  onChange={(e) => setDurationHours(Number(e.target.value))}
                  className="w-full border-2 border-gray-300 rounded-lg px-4 py-3 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200"
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
              <div className="mb-6">
                <label className="block text-sm font-semibold text-gray-900 mb-3">Reason / Justification</label>
                <textarea
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="Explain why you're requesting this suspension (e.g., heavy rainfall, flooding reports, strong winds)..."
                  className="w-full border-2 border-gray-300 rounded-lg px-4 py-3 h-32 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200"
                />
              </div>

              {/* Current Weather Summary */}
              {cityWeather && (
                <div className="mb-6 bg-gradient-to-r from-blue-50 to-indigo-50 p-4 rounded-lg border-2 border-blue-200">
                  <div className="text-sm font-semibold text-blue-900 mb-2">Current Conditions:</div>
                  <div className="text-sm text-blue-800 flex flex-wrap gap-4">
                    <span className="flex items-center gap-1">
                      <CloudRain className="w-4 h-4" />
                      Rainfall: {cityWeather.criteria.rainfall}mm/h
                    </span>
                    <span className="flex items-center gap-1">
                      <Wind className="w-4 h-4" />
                      Wind: {cityWeather.criteria.windSpeed}km/h
                    </span>
                    <span>Temp: {cityWeather.criteria.temperature}°C</span>
                  </div>
                </div>
              )}

              {/* Buttons */}
              <div className="flex justify-end space-x-3">
                <Button
                  onClick={() => setShowRequestModal(false)}
                  variant="outline"
                  disabled={submitting}
                  className="px-6 border-2 hover:bg-gray-100 transition-all duration-200"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleSubmitRequest}
                  disabled={submitting || !reason.trim() || selectedLevels.length === 0}
                  className="px-6 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-md hover:shadow-lg transition-all duration-200"
                >
                  {submitting ? 'Submitting...' : 'Submit Request'}
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
};

export default MayorDashboard;
