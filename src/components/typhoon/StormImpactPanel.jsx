import { useEffect, useState } from 'react';
import { AlertTriangle, Users, MapPin, Clock, TrendingUp, Shield } from 'lucide-react';
import { getStormImpact } from '../../services/enhancedTyphoonService';

/**
 * Storm Impact Panel Component
 * Displays landfall predictions, affected areas, and population at risk
 */
export function StormImpactPanel({ typhoon }) {
  const [impactData, setImpactData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!typhoon || !typhoon.id) {
      setLoading(false);
      return;
    }

    loadImpactData();
  }, [typhoon?.id]);

  const loadImpactData = async () => {
    try {
      setLoading(true);
      setError(null);

      const data = await getStormImpact(typhoon.id);

      if (data.error) {
        setError(data.error);
      } else {
        setImpactData(data);
      }
    } catch (err) {
      setError('Failed to load impact data');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (!typhoon) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <p className="text-gray-500 text-center">Select a typhoon to view impact predictions</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-gray-200 rounded w-3/4"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          <div className="h-4 bg-gray-200 rounded w-2/3"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center gap-2 text-red-600">
          <AlertTriangle className="w-5 h-5" />
          <p>{error}</p>
        </div>
        <button
          onClick={loadImpactData}
          className="mt-4 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
        >
          Retry
        </button>
      </div>
    );
  }

  const { landfall, affectedAreas } = impactData || {};

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-red-500 to-orange-500 text-white p-4">
        <h3 className="text-xl font-bold flex items-center gap-2">
          <AlertTriangle className="w-6 h-6" />
          Storm Impact Analysis
        </h3>
        <p className="text-sm opacity-90 mt-1">{typhoon.name} - {typhoon.current?.categoryName}</p>
      </div>

      <div className="p-6 space-y-6">
        {/* Landfall Prediction */}
        {landfall && !landfall.error && landfall.willMakeLandfall && (
          <div className="border-l-4 border-red-500 pl-4 py-2">
            <h4 className="font-bold text-lg mb-3 flex items-center gap-2">
              <MapPin className="w-5 h-5 text-red-500" />
              Landfall Prediction
            </h4>

            <div className="grid grid-cols-2 gap-4">
              <div className="bg-gray-50 rounded-lg p-3">
                <p className="text-xs text-gray-600 mb-1">Confidence</p>
                <p className="text-lg font-semibold capitalize">{landfall.confidence}</p>
              </div>

              <div className="bg-gray-50 rounded-lg p-3">
                <p className="text-xs text-gray-600 mb-1">Impact Level</p>
                <p className={`text-lg font-semibold capitalize ${getImpactColor(landfall.impactIntensity)}`}>
                  {landfall.impactIntensity}
                </p>
              </div>

              {landfall.location && (
                <div className="bg-gray-50 rounded-lg p-3 col-span-2">
                  <p className="text-xs text-gray-600 mb-1">Expected Landfall Location</p>
                  <p className="text-md font-semibold">{landfall.location.name}</p>
                  <p className="text-xs text-gray-500 mt-1">
                    {landfall.location.lat.toFixed(2)}°N, {landfall.location.lon.toFixed(2)}°E
                  </p>
                </div>
              )}

              {landfall.estimatedTime && (
                <div className="bg-gray-50 rounded-lg p-3">
                  <p className="text-xs text-gray-600 mb-1 flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    Estimated Time
                  </p>
                  <p className="text-md font-semibold">
                    {new Date(landfall.estimatedTime).toLocaleString()}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    ~{landfall.hoursUntilLandfall} hours from now
                  </p>
                </div>
              )}

              <div className="bg-gray-50 rounded-lg p-3">
                <p className="text-xs text-gray-600 mb-1 flex items-center gap-1">
                  <TrendingUp className="w-3 h-3" />
                  Approach Speed
                </p>
                <p className="text-md font-semibold">{landfall.approachSpeed} km/h</p>
                <p className="text-xs text-gray-500 mt-1">
                  Bearing: {landfall.approachBearing}°
                </p>
              </div>
            </div>
          </div>
        )}

        {landfall && !landfall.willMakeLandfall && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-blue-800 font-medium">
              {landfall.reason || 'No immediate landfall threat detected'}
            </p>
            {landfall.currentDistanceKm && (
              <p className="text-sm text-blue-600 mt-1">
                Current distance from land: {landfall.currentDistanceKm} km
              </p>
            )}
          </div>
        )}

        {/* Affected Areas */}
        {affectedAreas && !affectedAreas.error && affectedAreas.affectedCityCount > 0 && (
          <div className="border-l-4 border-orange-500 pl-4 py-2">
            <h4 className="font-bold text-lg mb-3 flex items-center gap-2">
              <Users className="w-5 h-5 text-orange-500" />
              Affected Areas
            </h4>

            <div className="grid grid-cols-2 gap-4 mb-4">
              <div className="bg-orange-50 rounded-lg p-3">
                <p className="text-xs text-gray-600 mb-1">Cities at Risk</p>
                <p className="text-2xl font-bold text-orange-600">
                  {affectedAreas.affectedCityCount}
                </p>
              </div>

              <div className="bg-orange-50 rounded-lg p-3">
                <p className="text-xs text-gray-600 mb-1">Population</p>
                <p className="text-2xl font-bold text-orange-600">
                  {affectedAreas.totalPopulationAtRisk.toLocaleString()}
                </p>
              </div>
            </div>

            {/* Impact Details Table */}
            <div className="max-h-96 overflow-y-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-100 sticky top-0">
                  <tr>
                    <th className="text-left p-2">City</th>
                    <th className="text-center p-2">Impact</th>
                    <th className="text-center p-2">Time</th>
                    <th className="text-right p-2">Population</th>
                  </tr>
                </thead>
                <tbody>
                  {affectedAreas.impactDetails.map((detail, index) => (
                    <tr key={index} className="border-b border-gray-200 hover:bg-gray-50">
                      <td className="p-2">
                        <div className="font-medium">{detail.city}</div>
                        <div className="text-xs text-gray-500">
                          {detail.distanceKm} km away
                          {detail.isCoastal && ' • Coastal'}
                        </div>
                      </td>
                      <td className="text-center p-2">
                        <span className={`px-2 py-1 rounded text-xs font-semibold ${getImpactBadgeColor(detail.impactLevel)}`}>
                          {detail.impactLevel}
                        </span>
                      </td>
                      <td className="text-center p-2 text-xs">{detail.timeframe}</td>
                      <td className="text-right p-2 text-xs">
                        {detail.population.toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Recommendations */}
        {affectedAreas?.recommendations && affectedAreas.recommendations.length > 0 && (
          <div className="border-l-4 border-blue-500 pl-4 py-2">
            <h4 className="font-bold text-lg mb-3 flex items-center gap-2">
              <Shield className="w-5 h-5 text-blue-500" />
              Recommendations
            </h4>

            <div className="space-y-3">
              {affectedAreas.recommendations.map((rec, index) => (
                <div
                  key={index}
                  className={`p-3 rounded-lg ${getPriorityBgColor(rec.priority)}`}
                >
                  <div className="flex items-start gap-2">
                    <div className={`mt-1 w-2 h-2 rounded-full flex-shrink-0 ${getPriorityDotColor(rec.priority)}`}></div>
                    <div className="flex-1">
                      <p className="font-semibold text-sm">{rec.action}</p>
                      <p className="text-xs text-gray-600 mt-1">{rec.reason}</p>
                      {rec.areas && rec.areas.length > 0 && (
                        <p className="text-xs text-gray-500 mt-2">
                          <strong>Areas:</strong> {rec.areas.join(', ')}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// Helper functions for styling
function getImpactColor(impact) {
  const colors = {
    catastrophic: 'text-purple-700',
    extreme: 'text-red-700',
    severe: 'text-orange-700',
    high: 'text-orange-600',
    moderate: 'text-yellow-600',
    low: 'text-green-600'
  };
  return colors[impact] || 'text-gray-600';
}

function getImpactBadgeColor(impact) {
  const colors = {
    extreme: 'bg-red-200 text-red-900',
    high: 'bg-orange-200 text-orange-900',
    moderate: 'bg-yellow-200 text-yellow-900',
    low: 'bg-green-200 text-green-900'
  };
  return colors[impact] || 'bg-gray-200 text-gray-900';
}

function getPriorityBgColor(priority) {
  const colors = {
    critical: 'bg-red-50 border border-red-200',
    high: 'bg-orange-50 border border-orange-200',
    medium: 'bg-yellow-50 border border-yellow-200',
    low: 'bg-blue-50 border border-blue-200'
  };
  return colors[priority] || 'bg-gray-50 border border-gray-200';
}

function getPriorityDotColor(priority) {
  const colors = {
    critical: 'bg-red-600',
    high: 'bg-orange-600',
    medium: 'bg-yellow-600',
    low: 'bg-blue-600'
  };
  return colors[priority] || 'bg-gray-600';
}

export default StormImpactPanel;
