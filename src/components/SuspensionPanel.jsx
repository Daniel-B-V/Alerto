import { useState, useEffect } from "react";
import { X, Check, Clock, AlertTriangle, RefreshCw, MapPin, Cloud } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { getReports } from "../firebase/firestore";
import { getBatangasWeather } from "../services/weatherService";
import { analyzeSuspensionAdvisory } from "../services/geminiService";

export function SuspensionPanel() {
  const [loading, setLoading] = useState(true);
  const [reports, setReports] = useState([]);
  const [weatherData, setWeatherData] = useState([]);
  const [suspensionAnalysis, setSuspensionAnalysis] = useState(null);
  const [lastUpdate, setLastUpdate] = useState(null);

  // Fetch data
  const fetchData = async () => {
    setLoading(true);
    try {
      // Fetch community reports
      const reportsData = await getReports();
      setReports(reportsData || []);

      // Fetch weather data
      const weather = await getBatangasWeather();
      setWeatherData(weather || []);

      // Analyze suspension recommendation
      if (reportsData && weather) {
        const analysis = await analyzeSuspensionAdvisory(weather, reportsData);
        setSuspensionAnalysis(analysis.analysis);
      }

      setLastUpdate(new Date());
    } catch (error) {
      console.error('Error fetching suspension data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();

    // Auto-refresh every 10 minutes
    const interval = setInterval(fetchData, 10 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  // Calculate statistics from real data
  const stats = {
    criticalReports: reports.filter(r => r.severity === 'critical').length,
    highRiskAreas: weatherData.filter(c => c.current?.rainfall > 20 || c.current?.windSpeed > 60).length,
    affectedCities: suspensionAnalysis?.affectedCities?.length || 0,
    totalReports: reports.length
  };

  // Get cities with critical conditions
  const criticalCities = weatherData.filter(city => {
    const rainfall = city.current?.rainfall || 0;
    const windSpeed = city.current?.windSpeed || 0;
    return rainfall > 20 || windSpeed > 60;
  });

  // Get recent critical reports
  const recentCriticalReports = reports
    .filter(r => r.severity === 'critical' || r.severity === 'high')
    .sort((a, b) => {
      const aTime = a.createdAt?.seconds || 0;
      const bTime = b.createdAt?.seconds || 0;
      return bTime - aTime;
    })
    .slice(0, 5);

  // Format timestamp
  const formatTimestamp = (timestamp) => {
    if (!timestamp) return 'Unknown';
    const date = timestamp.seconds ? new Date(timestamp.seconds * 1000) : new Date(timestamp);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffMins < 1440) return `${Math.floor(diffMins / 60)}h ago`;
    return date.toLocaleDateString();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <RefreshCw className="w-12 h-12 text-blue-500 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading suspension analysis...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="mb-6 flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Class Suspension Advisory System
          </h1>
          <p className="text-gray-600">
            AI-powered class suspension recommendations based on real-time weather and community reports
          </p>
          {lastUpdate && (
            <p className="text-sm text-gray-500 mt-1">
              Last updated: {lastUpdate.toLocaleTimeString()} • {stats.totalReports} reports analyzed
            </p>
          )}
        </div>
        <Button
          onClick={fetchData}
          disabled={loading}
          className="flex items-center gap-2 bg-blue-500 hover:bg-blue-600 text-white"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Main Suspension Recommendation */}
      {suspensionAnalysis && (
        <Card className={`border-2 shadow-lg ${
          suspensionAnalysis.suspensionRecommended
            ? 'bg-gradient-to-r from-red-50 to-orange-50 border-red-400'
            : 'bg-gradient-to-r from-green-50 to-blue-50 border-green-400'
        }`}>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {suspensionAnalysis.suspensionRecommended ? (
                  <X className="w-10 h-10 text-red-600" />
                ) : (
                  <Check className="w-10 h-10 text-green-600" />
                )}
                <div>
                  <CardTitle className="text-2xl font-bold">
                    {suspensionAnalysis.suspensionRecommended
                      ? 'Class Suspension Recommended'
                      : 'Classes May Continue'}
                  </CardTitle>
                  <p className="text-sm text-gray-600 mt-1">
                    Risk Level: <span className="font-semibold">{suspensionAnalysis.overallRisk}</span>
                  </p>
                </div>
              </div>
              <div className="text-right">
                <div className={`text-5xl font-bold ${
                  suspensionAnalysis.combinedScore >= 70 ? 'text-red-700' :
                  suspensionAnalysis.combinedScore >= 50 ? 'text-orange-700' :
                  suspensionAnalysis.combinedScore >= 30 ? 'text-yellow-700' :
                  'text-green-700'
                }`}>
                  {suspensionAnalysis.combinedScore}%
                </div>
                <Badge className={`mt-2 ${
                  suspensionAnalysis.combinedScore >= 70 ? 'bg-red-600' :
                  suspensionAnalysis.combinedScore >= 50 ? 'bg-orange-600' :
                  suspensionAnalysis.combinedScore >= 30 ? 'bg-yellow-600' :
                  'bg-green-600'
                } text-white`}>
                  RISK SCORE
                </Badge>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Advisory */}
              <div className={`p-4 rounded-lg ${
                suspensionAnalysis.suspensionRecommended
                  ? 'bg-red-100 border border-red-300'
                  : 'bg-green-100 border border-green-300'
              }`}>
                <h4 className="font-semibold text-gray-900 mb-2">Official Advisory:</h4>
                <p className="text-sm text-gray-700">{suspensionAnalysis.advisory}</p>
              </div>

              {/* Affected Cities */}
              {suspensionAnalysis.affectedCities && suspensionAnalysis.affectedCities.length > 0 && (
                <div>
                  <h4 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                    <MapPin className="w-5 h-5" />
                    Affected Cities ({suspensionAnalysis.affectedCities.length})
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {suspensionAnalysis.affectedCities.map((city, idx) => (
                      <Badge key={idx} variant="outline" className="border-red-400 text-red-700">
                        {city}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Risk Factors */}
              {suspensionAnalysis.riskFactors && suspensionAnalysis.riskFactors.length > 0 && (
                <div>
                  <h4 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                    <AlertTriangle className="w-5 h-5 text-orange-600" />
                    Contributing Factors
                  </h4>
                  <ul className="space-y-1">
                    {suspensionAnalysis.riskFactors.map((factor, idx) => (
                      <li key={idx} className="text-sm text-gray-700 flex items-start gap-2">
                        <span className="text-orange-600 mt-1">•</span>
                        <span>{factor}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Priority Actions */}
              {suspensionAnalysis.priorityActions && suspensionAnalysis.priorityActions.length > 0 && (
                <div>
                  <h4 className="font-semibold text-gray-900 mb-2">Priority Actions:</h4>
                  <ol className="space-y-1">
                    {suspensionAnalysis.priorityActions.map((action, idx) => (
                      <li key={idx} className="text-sm text-gray-700 flex items-start gap-2">
                        <span className="font-semibold text-blue-600">{idx + 1}.</span>
                        <span>{action}</span>
                      </li>
                    ))}
                  </ol>
                </div>
              )}

              {/* Scores */}
              <div className="grid grid-cols-3 gap-4 pt-4 border-t">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">{suspensionAnalysis.weatherScore}</div>
                  <div className="text-xs text-gray-600">Weather Score</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-600">{suspensionAnalysis.reportsScore}</div>
                  <div className="text-xs text-gray-600">Reports Score</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-orange-600">{suspensionAnalysis.combinedScore}</div>
                  <div className="text-xs text-gray-600">Combined Score</div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-red-50/80 to-red-100/80 backdrop-blur-sm border-red-200/50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-red-600 mb-1">Critical Reports</p>
                <p className="text-2xl font-bold text-red-900">{stats.criticalReports}</p>
                <p className="text-xs text-red-500">High Priority</p>
              </div>
              <AlertTriangle className="w-8 h-8 text-red-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-orange-50/80 to-orange-100/80 backdrop-blur-sm border-orange-200/50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-orange-600 mb-1">High-Risk Areas</p>
                <p className="text-2xl font-bold text-orange-900">{stats.highRiskAreas}</p>
                <p className="text-xs text-orange-500">Cities/Municipalities</p>
              </div>
              <Cloud className="w-8 h-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-blue-50/80 to-blue-100/80 backdrop-blur-sm border-blue-200/50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-blue-600 mb-1">Affected Cities</p>
                <p className="text-2xl font-bold text-blue-900">{stats.affectedCities}</p>
                <p className="text-xs text-blue-500">With Alerts</p>
              </div>
              <MapPin className="w-8 h-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-50/80 to-purple-100/80 backdrop-blur-sm border-purple-200/50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-purple-600 mb-1">Total Reports</p>
                <p className="text-2xl font-bold text-purple-900">{stats.totalReports}</p>
                <p className="text-xs text-purple-500">Community Input</p>
              </div>
              <Check className="w-8 h-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Critical Weather Conditions */}
        <Card className="bg-white/70 backdrop-blur-sm border-gray-200/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Cloud className="w-5 h-5 text-red-500" />
              Critical Weather Conditions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {criticalCities.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <Check className="w-12 h-12 text-green-500 mx-auto mb-2" />
                  <p>No critical weather conditions detected</p>
                  <p className="text-sm">All cities have normal weather</p>
                </div>
              ) : (
                criticalCities.map((city, idx) => (
                  <div
                    key={idx}
                    className="p-4 rounded-lg bg-red-50 border-l-4 border-l-red-500"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <MapPin className="w-4 h-4 text-red-600" />
                          <h4 className="font-medium text-gray-900">{city.location.city}</h4>
                        </div>
                        <div className="space-y-1 text-sm text-gray-700">
                          {city.current.rainfall > 20 && (
                            <p>⚠️ Heavy Rainfall: {city.current.rainfall}mm/h</p>
                          )}
                          {city.current.windSpeed > 60 && (
                            <p>💨 Strong Winds: {city.current.windSpeed} km/h</p>
                          )}
                          <p>🌡️ Temperature: {city.current.temperature}°C</p>
                          <p>💧 Humidity: {city.current.humidity}%</p>
                        </div>
                      </div>
                      <Badge variant="destructive">CRITICAL</Badge>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        {/* Recent Critical Reports */}
        <Card className="bg-white/70 backdrop-blur-sm border-gray-200/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-orange-500" />
              Recent Critical Reports
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentCriticalReports.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <Check className="w-12 h-12 text-green-500 mx-auto mb-2" />
                  <p>No critical reports</p>
                  <p className="text-sm">Community has not reported critical incidents</p>
                </div>
              ) : (
                recentCriticalReports.map((report) => (
                  <div
                    key={report.id}
                    className={`p-4 rounded-lg border-l-4 ${
                      report.severity === 'critical'
                        ? 'bg-red-50 border-l-red-500'
                        : 'bg-orange-50 border-l-orange-500'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <MapPin className="w-4 h-4 text-gray-600" />
                          <h4 className="font-medium text-gray-900">
                            {report.location?.city || 'Unknown Location'}
                          </h4>
                        </div>
                        <p className="text-sm text-gray-700 mb-2 line-clamp-2">
                          {report.description}
                        </p>
                        <div className="flex items-center gap-3 text-xs text-gray-500">
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {formatTimestamp(report.createdAt)}
                          </span>
                          <span>By: {report.userName || 'Anonymous'}</span>
                        </div>
                      </div>
                      <Badge
                        className={
                          report.severity === 'critical'
                            ? 'bg-red-600 text-white'
                            : 'bg-orange-600 text-white'
                        }
                      >
                        {report.severity?.toUpperCase()}
                      </Badge>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Expected Conditions */}
      {suspensionAnalysis?.expectedConditions && (
        <Card className="bg-white/70 backdrop-blur-sm border-gray-200/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-blue-500" />
              Expected Conditions (Next 6-12 Hours)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-700">{suspensionAnalysis.expectedConditions}</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
