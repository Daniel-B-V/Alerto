/**
 * Suspension Forecast Card - ARIMA Predictions (Descriptive Version)
 * Shows 7-day suspension probability forecast with descriptive text
 */

import { useState, useEffect } from 'react';
import {
  AlertTriangle,
  CheckCircle,
  Loader2,
  Brain,
  Calendar,
  TrendingUp,
  AlertCircle,
  Info
} from 'lucide-react';
import { Card } from '../ui/card';
import { Badge } from '../ui/badge';

export function SuspensionForecastCard({ city = 'Batangas City' }) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [forecast, setForecast] = useState(null);

  useEffect(() => {
    fetchForecast();
  }, [city]);

  const fetchForecast = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(
        `http://localhost:5000/api/predictions/suspension-forecast?city=${encodeURIComponent(city)}&days=7`
      );

      if (!response.ok) {
        throw new Error(`API Error: ${response.status}`);
      }

      const data = await response.json();
      setForecast(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const getRiskColor = (riskLevel) => {
    switch (riskLevel) {
      case 'critical': return 'bg-red-100 text-red-800 border-red-300';
      case 'high': return 'bg-orange-100 text-orange-800 border-orange-300';
      case 'moderate': return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'low': return 'bg-green-100 text-green-800 border-green-300';
      default: return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  const getRiskEmoji = (riskLevel) => {
    switch (riskLevel) {
      case 'critical': return '🔴';
      case 'high': return '🟠';
      case 'moderate': return '🟡';
      case 'low': return '🟢';
      default: return '⚪';
    }
  };

  const getRiskText = (riskLevel) => {
    switch (riskLevel) {
      case 'critical': return 'CRITICAL RISK';
      case 'high': return 'HIGH RISK';
      case 'moderate': return 'MODERATE RISK';
      case 'low': return 'LOW RISK';
      default: return 'UNKNOWN';
    }
  };

  const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' });
  };

  const formatShortDate = (dateStr) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
  };

  if (loading) {
    return (
      <Card className="p-6 bg-white border-2 border-blue-200">
        <div className="flex items-center gap-3">
          <Loader2 className="w-6 h-6 text-blue-500 animate-spin" />
          <div>
            <p className="font-semibold text-gray-900">Loading AI Forecast...</p>
            <p className="text-xs text-gray-500">Training ARIMA model</p>
          </div>
        </div>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="p-4 bg-red-50 border-2 border-red-200">
        <div className="flex items-start gap-2">
          <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm font-semibold text-red-900">Prediction Service Offline</p>
            <p className="text-xs text-red-700 mt-1">Make sure Flask API is running: <code className="bg-red-100 px-1 rounded">python prediction_service/app.py</code></p>
          </div>
        </div>
      </Card>
    );
  }

  if (!forecast) return null;

  // Find highest risk day
  const highestRiskDay = forecast.forecast.reduce((max, day) =>
    day.probability > max.probability ? day : max
  );

  const highRiskDays = forecast.forecast.filter(
    day => day.risk_level === 'critical' || day.risk_level === 'high'
  );

  const criticalDays = forecast.forecast.filter(day => day.risk_level === 'critical');

  // Get upcoming 3 days for quick view
  const upcomingDays = forecast.forecast.slice(0, 3);

  return (
    <Card className="p-6 bg-gradient-to-br from-blue-50 to-indigo-50 border-2 border-blue-300 shadow-lg">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-blue-600 rounded-lg">
          <Brain className="w-6 h-6 text-white" />
        </div>
        <div className="flex-1">
          <h3 className="text-xl font-bold text-gray-900">AI Suspension Forecast</h3>
          <p className="text-sm text-gray-600">7-Day ARIMA Prediction for {city}</p>
        </div>
        <Badge className="bg-blue-600 text-white text-xs">
          {forecast.accuracy ? `${(forecast.accuracy.accuracy * 100).toFixed(0)}% Accurate` : 'Learning'}
        </Badge>
      </div>

      {/* Main Recommendation */}
      <div className={`rounded-xl p-4 mb-6 border-2 ${
        forecast.recommendation.action === 'issue_now' ? 'bg-red-50 border-red-300' :
        forecast.recommendation.action === 'prepare' ? 'bg-orange-50 border-orange-300' :
        forecast.recommendation.action === 'monitor_closely' ? 'bg-yellow-50 border-yellow-300' :
        'bg-green-50 border-green-300'
      }`}>
        <div className="flex items-start gap-3">
          <div className="text-3xl">
            {forecast.recommendation.action === 'issue_now' && '🚨'}
            {forecast.recommendation.action === 'prepare' && '⚠️'}
            {forecast.recommendation.action === 'monitor_closely' && '👀'}
            {forecast.recommendation.action === 'monitor' && '✅'}
          </div>
          <div className="flex-1">
            <h4 className={`text-lg font-bold mb-2 ${
              forecast.recommendation.action === 'issue_now' ? 'text-red-900' :
              forecast.recommendation.action === 'prepare' ? 'text-orange-900' :
              forecast.recommendation.action === 'monitor_closely' ? 'text-yellow-900' :
              'text-green-900'
            }`}>
              {forecast.recommendation.action === 'issue_now' && 'URGENT: Issue Suspension Immediately'}
              {forecast.recommendation.action === 'prepare' && 'High Alert: Prepare for Suspension'}
              {forecast.recommendation.action === 'monitor_closely' && 'Watch Closely: Developing Conditions'}
              {forecast.recommendation.action === 'monitor' && 'All Clear: Continue Monitoring'}
            </h4>
            <p className={`text-sm ${
              forecast.recommendation.action === 'issue_now' ? 'text-red-800' :
              forecast.recommendation.action === 'prepare' ? 'text-orange-800' :
              forecast.recommendation.action === 'monitor_closely' ? 'text-yellow-800' :
              'text-green-800'
            }`}>
              {forecast.recommendation.message}
            </p>
          </div>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-lg p-4 text-center border-2 border-gray-200">
          <div className="text-3xl font-bold text-blue-600 mb-1">
            {(highestRiskDay.probability * 100).toFixed(0)}%
          </div>
          <div className="text-xs text-gray-600 font-medium">Peak Risk</div>
          <div className="text-xs text-gray-500 mt-1">{formatShortDate(highestRiskDay.date)}</div>
        </div>

        <div className="bg-white rounded-lg p-4 text-center border-2 border-gray-200">
          <div className="text-3xl font-bold text-orange-600 mb-1">
            {highRiskDays.length}
          </div>
          <div className="text-xs text-gray-600 font-medium">High Risk Days</div>
          <div className="text-xs text-gray-500 mt-1">Out of 7 Days</div>
        </div>

        <div className="bg-white rounded-lg p-4 text-center border-2 border-gray-200">
          <div className="text-3xl font-bold text-red-600 mb-1">
            {criticalDays.length}
          </div>
          <div className="text-xs text-gray-600 font-medium">Critical Days</div>
          <div className="text-xs text-gray-500 mt-1">Immediate Action</div>
        </div>
      </div>

      {/* Upcoming 3 Days Preview */}
      <div className="bg-white rounded-lg p-4 mb-4 border-2 border-gray-200">
        <div className="flex items-center gap-2 mb-3">
          <Calendar className="w-4 h-4 text-gray-600" />
          <h4 className="font-semibold text-gray-900 text-sm">Next 3 Days Outlook</h4>
        </div>
        <div className="space-y-2">
          {upcomingDays.map((day, index) => (
            <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-3">
                <span className="text-lg">{getRiskEmoji(day.risk_level)}</span>
                <div>
                  <div className="font-medium text-sm text-gray-900">{formatShortDate(day.date)}</div>
                  <div className="text-xs text-gray-600">{getRiskText(day.risk_level)}</div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-lg font-bold text-gray-900">{(day.probability * 100).toFixed(0)}%</div>
                <div className="text-xs text-gray-500">Probability</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Full 7-Day Breakdown */}
      <div className="bg-white rounded-lg p-4 border-2 border-gray-200">
        <div className="flex items-center gap-2 mb-3">
          <TrendingUp className="w-4 h-4 text-gray-600" />
          <h4 className="font-semibold text-gray-900 text-sm">Complete 7-Day Forecast</h4>
        </div>
        <div className="space-y-1">
          {forecast.forecast.map((day, index) => (
            <div key={index} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
              <div className="flex items-center gap-2">
                <span className="text-base">{getRiskEmoji(day.risk_level)}</span>
                <span className="text-sm text-gray-700 font-medium min-w-[100px]">{formatShortDate(day.date)}</span>
                <Badge className={`text-xs px-2 py-0.5 ${getRiskColor(day.risk_level)}`}>
                  {day.risk_level.toUpperCase()}
                </Badge>
              </div>
              <div className="text-sm font-bold text-gray-900">
                {(day.probability * 100).toFixed(0)}%
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* What This Means */}
      {highRiskDays.length > 0 && (
        <div className="mt-4 bg-blue-50 rounded-lg p-4 border border-blue-200">
          <div className="flex items-start gap-2">
            <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="font-semibold text-blue-900 text-sm mb-2">What This Means:</h4>
              <ul className="text-xs text-blue-800 space-y-1">
                {criticalDays.length > 0 && (
                  <li>• <strong>{criticalDays.length} critical day(s)</strong> detected - prepare for likely suspension</li>
                )}
                {highRiskDays.length > 0 && (
                  <li>• <strong>{highRiskDays.length} high-risk day(s)</strong> - monitor weather closely and prepare resources</li>
                )}
                <li>• AI model has <strong>{forecast.accuracy ? `${(forecast.accuracy.accuracy * 100).toFixed(0)}%` : 'learning'}</strong> accuracy based on historical patterns</li>
                <li>• Recommendations update every 6 hours with latest weather data</li>
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="mt-4 pt-3 border-t border-blue-200 flex items-center justify-between text-xs text-gray-600">
        <span>Model: ARIMA(5,1,2) • {forecast.model_info.training_days} days training</span>
        <span>Updated: {new Date(forecast.generated_at).toLocaleTimeString()}</span>
      </div>
    </Card>
  );
}
