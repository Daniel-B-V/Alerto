import { useState, useEffect } from 'react';
import {
  Shield,
  AlertTriangle,
  CloudRain,
  Wind,
  Thermometer,
  Users,
  CheckCircle,
  XCircle,
  Clock,
  RefreshCw,
  TrendingUp,
  MapPin,
  AlertCircle,
  Sparkles
} from 'lucide-react';
import { analyzeSuspensionAdvisory } from '../../services/geminiService';

/**
 * Suspension Advisory System
 * Combines AI analysis of weather data and community reports
 * to generate comprehensive class suspension recommendations
 */
const SuspensionAdvisorySystem = ({ weatherData = [], reports = [] }) => {
  const [advisory, setAdvisory] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [autoRefresh, setAutoRefresh] = useState(true);

  useEffect(() => {
    if (weatherData.length > 0 && reports.length > 0) {
      generateAdvisory();
    }
  }, [weatherData.length, reports.length]);

  // Auto-refresh every 10 minutes
  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(() => {
      if (weatherData.length > 0 && reports.length > 0) {
        generateAdvisory();
      }
    }, 10 * 60 * 1000);

    return () => clearInterval(interval);
  }, [autoRefresh, weatherData.length, reports.length]);

  const generateAdvisory = async () => {
    setLoading(true);
    setError(null);

    try {
      const result = await analyzeSuspensionAdvisory(weatherData, reports);

      if (result.success) {
        setAdvisory(result.analysis);
        setLastUpdated(new Date());
      } else {
        setError(result.error || 'Advisory generation failed');
      }
    } catch (err) {
      setError(err.message || 'Failed to generate advisory');
      console.error('Advisory generation error:', err);
    } finally {
      setLoading(false);
    }
  };

  const getRiskColor = (risk) => {
    switch (risk) {
      case 'Critical':
        return {
          bg: 'bg-red-600',
          lightBg: 'bg-red-50',
          border: 'border-red-600',
          text: 'text-red-600',
          icon: 'text-red-600'
        };
      case 'High':
        return {
          bg: 'bg-orange-600',
          lightBg: 'bg-orange-50',
          border: 'border-orange-600',
          text: 'text-orange-600',
          icon: 'text-orange-600'
        };
      case 'Moderate':
        return {
          bg: 'bg-yellow-600',
          lightBg: 'bg-yellow-50',
          border: 'border-yellow-600',
          text: 'text-yellow-600',
          icon: 'text-yellow-600'
        };
      case 'Low':
        return {
          bg: 'bg-green-600',
          lightBg: 'bg-green-50',
          border: 'border-green-600',
          text: 'text-green-600',
          icon: 'text-green-600'
        };
      default:
        return {
          bg: 'bg-gray-600',
          lightBg: 'bg-gray-50',
          border: 'border-gray-600',
          text: 'text-gray-600',
          icon: 'text-gray-600'
        };
    }
  };

  if (weatherData.length === 0 || reports.length === 0) {
    return (
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
        <div className="flex items-center gap-3 mb-4">
          <Shield className="w-6 h-6 text-blue-600" />
          <h3 className="text-lg font-semibold text-gray-900">Class Suspension Advisory System</h3>
        </div>
        <div className="text-center py-8">
          <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-3" />
          <p className="text-gray-500">
            {weatherData.length === 0
              ? 'Waiting for weather data...'
              : 'Waiting for community reports...'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Main Advisory Card */}
      <div className={`rounded-xl p-6 shadow-lg border-2 ${advisory ? getRiskColor(advisory.overallRisk).border : 'border-gray-300'} ${advisory ? getRiskColor(advisory.overallRisk).lightBg : 'bg-white'}`}>
        <div className="flex items-start justify-between mb-6">
          <div className="flex items-center gap-4">
            <div className={`w-16 h-16 ${advisory ? getRiskColor(advisory.overallRisk).bg : 'bg-gray-400'} rounded-2xl flex items-center justify-center shadow-lg`}>
              <Shield className="w-10 h-10 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <h3 className="text-2xl font-bold text-gray-900">
                  Class Suspension Advisory
                </h3>
                <Sparkles className="w-5 h-5 text-yellow-500" />
              </div>
              <p className="text-sm text-gray-600 flex items-center gap-2">
                <Clock className="w-4 h-4" />
                {lastUpdated
                  ? `Last updated: ${lastUpdated.toLocaleTimeString()}`
                  : 'Generating advisory...'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <label className="flex items-center gap-2 text-sm text-gray-600">
              <input
                type="checkbox"
                checked={autoRefresh}
                onChange={(e) => setAutoRefresh(e.target.checked)}
                className="rounded"
              />
              Auto-refresh
            </label>
            <button
              onClick={generateAdvisory}
              disabled={loading}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center gap-2"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              {loading ? 'Analyzing...' : 'Refresh'}
            </button>
          </div>
        </div>

        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-red-800">Analysis Error</p>
              <p className="text-sm text-red-600">{error}</p>
            </div>
          </div>
        )}

        {loading ? (
          <div className="py-12">
            <div className="flex flex-col items-center justify-center">
              <div className="w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mb-4"></div>
              <p className="text-gray-700 font-medium">Analyzing weather data and community reports...</p>
              <p className="text-sm text-gray-500 mt-2">Generating AI-powered advisory</p>
            </div>
          </div>
        ) : advisory ? (
          <>
            {/* Risk Level & Recommendation */}
            <div className="bg-white rounded-xl p-6 shadow-sm mb-6" style={{ backgroundColor: 'white' }}>
              <div className="flex items-start justify-between mb-4">
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <span className={`text-3xl font-bold ${getRiskColor(advisory.overallRisk).text}`}>
                      {advisory.overallRisk} Risk
                    </span>
                    {advisory.suspensionRecommended ? (
                      <span className="px-4 py-1.5 bg-red-600 text-white rounded-lg font-semibold text-sm flex items-center gap-2">
                        <XCircle className="w-4 h-4" />
                        SUSPENSION RECOMMENDED
                      </span>
                    ) : (
                      <span className="px-4 py-1.5 bg-green-600 text-white rounded-lg font-semibold text-sm flex items-center gap-2">
                        <CheckCircle className="w-4 h-4" />
                        CLASSES MAY PROCEED
                      </span>
                    )}
                  </div>
                  <p className="text-gray-700 leading-relaxed text-lg">{advisory.advisory}</p>
                </div>
              </div>
            </div>

            {/* Score Breakdown */}
            <div className="grid grid-cols-3 gap-4 mb-6">
              <div className="bg-white rounded-xl p-5 shadow-sm border-2 border-blue-200">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <CloudRain className="w-5 h-5 text-blue-600" />
                    <p className="text-sm font-medium text-gray-700">Weather Score</p>
                  </div>
                  <span className="text-2xl font-bold text-blue-600">{advisory.weatherScore}</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-blue-600 h-2 rounded-full transition-all"
                    style={{ width: `${advisory.weatherScore}%` }}
                  ></div>
                </div>
              </div>

              <div className="bg-white rounded-xl p-5 shadow-sm border-2 border-purple-200">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Users className="w-5 h-5 text-purple-600" />
                    <p className="text-sm font-medium text-gray-700">Reports Score</p>
                  </div>
                  <span className="text-2xl font-bold text-purple-600">{advisory.reportsScore}</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-purple-600 h-2 rounded-full transition-all"
                    style={{ width: `${advisory.reportsScore}%` }}
                  ></div>
                </div>
              </div>

              <div className={`rounded-xl p-5 shadow-sm border-2 ${getRiskColor(advisory.overallRisk).border}`}>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <TrendingUp className={`w-5 h-5 ${getRiskColor(advisory.overallRisk).icon}`} />
                    <p className="text-sm font-medium text-gray-700">Combined Score</p>
                  </div>
                  <span className={`text-2xl font-bold ${getRiskColor(advisory.overallRisk).text}`}>
                    {advisory.combinedScore}
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className={`${getRiskColor(advisory.overallRisk).bg} h-2 rounded-full transition-all`}
                    style={{ width: `${advisory.combinedScore}%` }}
                  ></div>
                </div>
              </div>
            </div>

            {/* Risk Factors */}
            {advisory.riskFactors && advisory.riskFactors.length > 0 && (
              <div className="bg-white rounded-xl p-6 shadow-sm mb-6">
                <div className="flex items-center gap-2 mb-4">
                  <AlertTriangle className="w-5 h-5 text-orange-600" />
                  <h4 className="text-lg font-semibold text-gray-900">Risk Factors</h4>
                </div>
                <div className="space-y-2">
                  {advisory.riskFactors.map((factor, index) => (
                    <div
                      key={index}
                      className="flex items-start gap-3 p-3 bg-orange-50 rounded-lg border border-orange-200"
                    >
                      <AlertCircle className="w-5 h-5 text-orange-600 flex-shrink-0 mt-0.5" />
                      <p className="text-gray-700">{factor}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Affected Cities */}
            {advisory.affectedCities && advisory.affectedCities.length > 0 && (
              <div className="bg-white rounded-xl p-6 shadow-sm mb-6">
                <div className="flex items-center gap-2 mb-4">
                  <MapPin className="w-5 h-5 text-red-600" />
                  <h4 className="text-lg font-semibold text-gray-900">Affected Areas</h4>
                </div>
                <div className="flex flex-wrap gap-2">
                  {advisory.affectedCities.map((city, index) => (
                    <span
                      key={index}
                      className="px-4 py-2 bg-red-100 text-red-700 rounded-lg font-medium border border-red-300"
                    >
                      {city}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Priority Actions */}
            {advisory.priorityActions && advisory.priorityActions.length > 0 && (
              <div className="bg-white rounded-xl p-6 shadow-sm mb-6">
                <h4 className="text-lg font-semibold text-gray-900 mb-4">Recommended Actions</h4>
                <div className="space-y-2">
                  {advisory.priorityActions.map((action, index) => (
                    <div
                      key={index}
                      className="flex items-start gap-3 p-3 bg-blue-50 rounded-lg border border-blue-200"
                    >
                      <div className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center flex-shrink-0 text-sm font-bold">
                        {index + 1}
                      </div>
                      <p className="text-gray-700 pt-0.5">{action}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Expected Conditions */}
            {advisory.expectedConditions && (
              <div className="bg-white rounded-xl p-6 shadow-sm">
                <div className="flex items-center gap-2 mb-3">
                  <Clock className="w-5 h-5 text-blue-600" />
                  <h4 className="text-lg font-semibold text-gray-900">Expected Conditions</h4>
                </div>
                <p className="text-gray-700 leading-relaxed">{advisory.expectedConditions}</p>
              </div>
            )}
          </>
        ) : null}
      </div>

      {/* Data Sources Info */}
      <div className="bg-blue-50 rounded-xl p-4 border border-blue-200">
        <div className="flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-blue-800">
            <p className="font-medium mb-1">AI-Powered Analysis</p>
            <p>
              This advisory combines real-time weather data from OpenWeather API ({weatherData.length} cities)
              and {reports.length} community reports using Gemini AI to provide intelligent
              class suspension recommendations.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SuspensionAdvisorySystem;
