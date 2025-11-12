import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { CloudRain, AlertTriangle, RefreshCw, TrendingUp, MapPin } from 'lucide-react';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { getCombinedForecast, getRainfallAlerts } from '../../services/pagasaService';

export function PAGASAForecastCard() {
  const [forecastData, setForecastData] = useState(null);
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdate, setLastUpdate] = useState(null);

  const fetchPAGASAData = async () => {
    setLoading(true);
    setError(null);
    try {
      console.log('🔄 Starting PAGASA data fetch...');

      const [forecast, rainfallAlerts] = await Promise.all([
        getCombinedForecast(),
        getRainfallAlerts()
      ]);

      console.log('✅ PAGASA data fetched successfully:', { forecast, rainfallAlerts });

      setForecastData(forecast);
      setAlerts(rainfallAlerts);
      setLastUpdate(new Date());
    } catch (err) {
      console.error('❌ Failed to fetch PAGASA data:', err);
      console.error('Error details:', {
        message: err.message,
        stack: err.stack
      });

      // Check if it's a network error (backend not running)
      if (err.message.includes('fetch') || err.message.includes('Failed to fetch')) {
        setError('Cannot connect to PAGASA server. Please start the backend server with: cd backend && npm run pagasa:dev');
      } else {
        setError(err.message);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPAGASAData();

    // Auto-refresh every 30 minutes (PAGASA data updates less frequently)
    const interval = setInterval(fetchPAGASAData, 30 * 60 * 1000);

    return () => clearInterval(interval);
  }, []);

  if (loading && !forecastData) {
    return (
      <Card className="col-span-full">
        <CardContent className="p-12 flex flex-col items-center justify-center">
          <RefreshCw className="w-12 h-12 text-blue-500 animate-spin mb-4" />
          <p className="text-gray-600">Loading PAGASA rainfall forecast...</p>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="col-span-full border-red-200 bg-red-50/50">
        <CardContent className="p-6">
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-6 h-6 text-red-600" />
            <div>
              <p className="font-semibold text-red-900">Failed to load PAGASA forecast</p>
              <p className="text-sm text-red-700">{error}</p>
              <button
                onClick={fetchPAGASAData}
                className="mt-2 text-sm text-red-600 hover:text-red-800 underline"
              >
                Try again
              </button>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!forecastData) return null;

  const { statistics, cities } = forecastData;

  // Prepare chart data
  const cityRainfallData = cities
    .sort((a, b) => b.summary.maxRainfall - a.summary.maxRainfall)
    .slice(0, 8)
    .map(city => ({
      city: city.city.replace(' City', ''),
      rainfall: city.summary.maxRainfall,
      total: city.summary.totalRainfall
    }));

  // Risk level colors
  const getRiskColor = (level) => {
    const colors = {
      critical: 'bg-red-600 text-white',
      high: 'bg-orange-500 text-white',
      medium: 'bg-yellow-500 text-white',
      low: 'bg-blue-500 text-white'
    };
    return colors[level] || 'bg-gray-500 text-white';
  };

  const getRiskBorderColor = (level) => {
    const colors = {
      critical: 'border-red-500',
      high: 'border-orange-500',
      medium: 'border-yellow-500',
      low: 'border-blue-500'
    };
    return colors[level] || 'border-gray-500';
  };

  return (
    <>
      {/* PAGASA Forecast Header */}
      <div className="col-span-full">
        <Card className="bg-gradient-to-r from-blue-600 to-blue-800 text-white border-0 shadow-lg">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <CloudRain className="w-8 h-8" />
                <div>
                  <CardTitle className="text-2xl font-bold text-white mb-1">
                    PAGASA Rainfall Forecast
                  </CardTitle>
                  <p className="text-blue-100 text-sm">
                    Official weather forecast for Batangas Province
                  </p>
                  {lastUpdate && (
                    <p className="text-xs text-blue-200 mt-1">
                      Last updated: {lastUpdate.toLocaleString()}
                    </p>
                  )}
                </div>
              </div>
              <button
                onClick={fetchPAGASAData}
                disabled={loading}
                className="flex items-center gap-2 px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg transition-colors disabled:opacity-50"
              >
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                Refresh
              </button>
            </div>
          </CardHeader>
        </Card>
      </div>

      {/* Statistics Cards */}
      <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-blue-600 font-semibold mb-1">Total Expected Rainfall</p>
              <p className="text-3xl font-bold text-blue-900">{statistics.totalExpectedRainfall.toFixed(1)} mm</p>
              <p className="text-xs text-blue-600 mt-1">Across all monitored areas</p>
            </div>
            <CloudRain className="w-12 h-12 text-blue-500" />
          </div>
        </CardContent>
      </Card>

      <Card className="bg-gradient-to-br from-red-50 to-red-100 border-red-200">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-red-600 font-semibold mb-1">Critical Areas</p>
              <p className="text-3xl font-bold text-red-900">{statistics.criticalAreas + statistics.highRiskAreas}</p>
              <p className="text-xs text-red-600 mt-1">High risk of flooding</p>
            </div>
            <AlertTriangle className="w-12 h-12 text-red-500" />
          </div>
        </CardContent>
      </Card>

      <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-green-600 font-semibold mb-1">Average Rainfall</p>
              <p className="text-3xl font-bold text-green-900">{statistics.averageRainfall} mm</p>
              <p className="text-xs text-green-600 mt-1">Per monitored city</p>
            </div>
            <TrendingUp className="w-12 h-12 text-green-500" />
          </div>
        </CardContent>
      </Card>

      <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-purple-600 font-semibold mb-1">Cities Monitored</p>
              <p className="text-3xl font-bold text-purple-900">{statistics.totalCities}</p>
              <p className="text-xs text-purple-600 mt-1">Real-time coverage</p>
            </div>
            <MapPin className="w-12 h-12 text-purple-500" />
          </div>
        </CardContent>
      </Card>

      {/* Rainfall by City Chart */}
      <Card className="col-span-full lg:col-span-2">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart className="w-5 h-5" />
            Expected Rainfall by City
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={cityRainfallData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="city" angle={-45} textAnchor="end" height={80} />
              <YAxis label={{ value: 'Rainfall (mm)', angle: -90, position: 'insideLeft' }} />
              <Tooltip />
              <Legend />
              <Bar dataKey="rainfall" fill="#3b82f6" name="Max Rainfall (mm)" />
              <Bar dataKey="total" fill="#93c5fd" name="Total Rainfall (mm)" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Rainfall Alerts */}
      <Card className="col-span-full lg:col-span-2">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5" />
            Rainfall Alerts ({alerts.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 max-h-[300px] overflow-y-auto">
            {alerts.length === 0 ? (
              <p className="text-gray-500 text-center py-8">No rainfall alerts at this time</p>
            ) : (
              alerts.map((alert, index) => (
                <div
                  key={index}
                  className={`p-4 rounded-lg border-l-4 ${getRiskBorderColor(alert.riskLevel)} bg-gray-50`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <MapPin className="w-4 h-4 text-gray-600" />
                        <span className="font-semibold text-gray-900">{alert.city}</span>
                        <Badge className={getRiskColor(alert.riskLevel)}>
                          {alert.riskLevel.toUpperCase()}
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-700">{alert.message}</p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {/* Risk Distribution */}
      <Card className="col-span-full">
        <CardHeader>
          <CardTitle>Risk Level Distribution</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-red-50 rounded-lg border border-red-200">
              <div className="text-3xl font-bold text-red-900">{statistics.criticalAreas}</div>
              <div className="text-sm text-red-600 font-medium">Critical</div>
            </div>
            <div className="text-center p-4 bg-orange-50 rounded-lg border border-orange-200">
              <div className="text-3xl font-bold text-orange-900">{statistics.highRiskAreas}</div>
              <div className="text-sm text-orange-600 font-medium">High Risk</div>
            </div>
            <div className="text-center p-4 bg-yellow-50 rounded-lg border border-yellow-200">
              <div className="text-3xl font-bold text-yellow-900">{statistics.mediumRiskAreas}</div>
              <div className="text-sm text-yellow-600 font-medium">Medium Risk</div>
            </div>
            <div className="text-center p-4 bg-blue-50 rounded-lg border border-blue-200">
              <div className="text-3xl font-bold text-blue-900">{statistics.lowRiskAreas}</div>
              <div className="text-sm text-blue-600 font-medium">Low Risk</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </>
  );
}
