import { useState, useEffect } from "react";
import { X, Check, Clock, AlertTriangle, RefreshCw, MapPin, Cloud, List, Ban, GraduationCap } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { getReports, getWeatherData } from "../firebase/firestore";
import { getBatangasWeather } from "../services/weatherService";
import { analyzeSuspensionAdvisory } from "../services/geminiService";
import { collection, addDoc, serverTimestamp, query, where, getDocs } from 'firebase/firestore';
import { db } from '../firebase/config';
import { useSocket } from '../contexts/SocketContext';

export function SuspensionPanel() {
  const { addNotification } = useSocket();
  const [loading, setLoading] = useState(true);
  const [reports, setReports] = useState([]);
  const [weatherData, setWeatherData] = useState([]);
  const [suspensionAnalysis, setSuspensionAnalysis] = useState(null);
  const [lastUpdate, setLastUpdate] = useState(null);
  const [showSuspensionListModal, setShowSuspensionListModal] = useState(false);
  const [suspendingCity, setSuspendingCity] = useState(null);
  const [suspendedCities, setSuspendedCities] = useState(new Set());
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [selectedCandidate, setSelectedCandidate] = useState(null);
  const [suspendedCityName, setSuspendedCityName] = useState('');

  // Fetch data
  const fetchData = async () => {
    setLoading(true);
    try {
      // Fetch community reports
      const reportsData = await getReports();
      setReports(reportsData || []);

      // Try to fetch weather data from Firestore first (test data)
      let weather = await getWeatherData();

      // If no weather data in Firestore, fall back to API
      if (!weather || weather.length === 0) {
        console.log('No weather data in Firestore, fetching from API...');
        weather = await getBatangasWeather();
      } else {
        console.log(`Using ${weather.length} weather records from Firestore test data`);
      }

      setWeatherData(weather || []);

      // Fetch existing active suspensions
      const suspensionsQuery = query(
        collection(db, 'suspensions'),
        where('status', '==', 'active')
      );
      const suspensionsSnapshot = await getDocs(suspensionsQuery);
      const suspendedCityNames = suspensionsSnapshot.docs.map(doc => doc.data().city);
      setSuspendedCities(new Set(suspendedCityNames));

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

    // Listen for data refresh events
    const handleDataRefresh = () => {
      console.log('Data refresh event received, reloading suspension data...');
      fetchData();
    };

    window.addEventListener('dataRefresh', handleDataRefresh);

    return () => {
      clearInterval(interval);
      window.removeEventListener('dataRefresh', handleDataRefresh);
    };
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

  // Get suspension candidates (cities that meet criteria for suspension)
  const getSuspensionCandidates = () => {
    const candidates = [];

    console.log('=== Getting Suspension Candidates ===');
    console.log('Weather data cities:', weatherData.map(w => w.location?.city));
    console.log('Reports count:', reports.length);

    // Group reports by city
    const reportsByCity = {};
    reports.forEach(report => {
      const city = report.location?.city || 'Unknown';
      if (!reportsByCity[city]) {
        reportsByCity[city] = [];
      }
      reportsByCity[city].push(report);
    });

    // Check each city with reports
    console.log('Cities with reports:', Object.keys(reportsByCity));
    Object.keys(reportsByCity).forEach(cityName => {
      const cityReports = reportsByCity[cityName];
      const criticalCount = cityReports.filter(r => r.severity === 'critical').length;
      const highCount = cityReports.filter(r => r.severity === 'high').length;
      const totalCount = cityReports.length;

      // Find weather data for this city
      const cityWeather = weatherData.find(w => w.location?.city === cityName);
      const rainfall = cityWeather?.current?.rainfall || 0;
      const windSpeed = cityWeather?.current?.windSpeed || 0;

      // Calculate weather risk score with same logic as weather-only candidates
      let weatherRisk = 0;
      if (rainfall > 20 || windSpeed > 60) {
        weatherRisk = 50; // Base score for high-risk weather
        if (rainfall >= 35 || windSpeed >= 55) weatherRisk = 70; // Severe/typhoon conditions
        else if (rainfall >= 30 || windSpeed >= 50) weatherRisk = 60; // Very high risk
      }

      const reportRisk = (criticalCount * 15) + (highCount * 10);
      const totalRisk = weatherRisk + reportRisk;

      console.log(`${cityName}: critical=${criticalCount}, high=${highCount}, total=${totalCount}, weatherRisk=${weatherRisk}, reportRisk=${reportRisk}, totalRisk=${totalRisk}`);

      // If risk score >= 50, add to candidates
      if (totalRisk >= 50 || criticalCount >= 3) {
        console.log(`${cityName}: Added as candidate (with reports)`);
        candidates.push({
          city: cityName,
          criticalReports: criticalCount,
          highReports: highCount,
          totalReports: totalCount,
          rainfall,
          windSpeed,
          riskScore: totalRisk,
          weather: cityWeather,
          hasWeatherRisk: rainfall > 20 || windSpeed > 60
        });
      } else {
        console.log(`${cityName}: Does not meet threshold`);
      }
    });

    // Also check cities with severe weather but no reports
    console.log('Checking weather-only candidates...');
    weatherData.forEach(cityWeather => {
      const cityName = cityWeather.location?.city;
      if (!cityName) {
        console.log('Skipping city with no name');
        return;
      }

      if (reportsByCity[cityName]) {
        console.log(`${cityName}: Already processed with reports, skipping`);
        return;
      }

      const rainfall = cityWeather.current?.rainfall || 0;
      const windSpeed = cityWeather.current?.windSpeed || 0;

      console.log(`${cityName}: rainfall=${rainfall}mm, windSpeed=${windSpeed}km/h`);

      // Check if weather conditions warrant suspension (matches high-risk threshold)
      const isCriticalWeather = rainfall > 20 || windSpeed > 60;

      if (isCriticalWeather) {
        // Calculate weather risk score based on severity
        let weatherRisk = 50; // Base score for high-risk weather (meets threshold)
        if (rainfall >= 35 || windSpeed >= 55) weatherRisk = 70; // Severe/typhoon conditions
        else if (rainfall >= 30 || windSpeed >= 50) weatherRisk = 60; // Very high risk

        console.log(`${cityName}: Added as candidate with risk score ${weatherRisk}`);

        candidates.push({
          city: cityName,
          criticalReports: 0,
          highReports: 0,
          totalReports: 0,
          rainfall,
          windSpeed,
          riskScore: weatherRisk,
          weather: cityWeather,
          hasWeatherRisk: true
        });
      } else {
        console.log(`${cityName}: Does not meet critical weather threshold`);
      }
    });

    // Sort by risk score (descending)
    const sorted = candidates.sort((a, b) => b.riskScore - a.riskScore);
    console.log('Final candidates:', sorted.map(c => `${c.city} (${c.riskScore})`));
    return sorted;
  };

  // Issue class suspension
  const issueSuspension = async (candidate) => {
    setSuspendingCity(candidate.city);
    setShowConfirmModal(false);

    try {
      // Create suspension record in Firestore
      const suspensionData = {
        city: candidate.city,
        province: 'Batangas',
        issuedAt: serverTimestamp(),
        issuedBy: 'Admin User',
        status: 'active',
        reason: 'Critical weather conditions and/or high number of critical reports',
        criticalReports: candidate.criticalReports,
        totalReports: candidate.totalReports,
        rainfall: candidate.rainfall,
        windSpeed: candidate.windSpeed,
        riskScore: candidate.riskScore,
        expectedDuration: '24 hours',
        affectedSchools: 'All schools in ' + candidate.city
      };

      await addDoc(collection(db, 'suspensions'), suspensionData);

      // Create notification
      const notificationData = {
        type: 'suspension',
        title: `Class Suspension - ${candidate.city}`,
        message: `Classes suspended in ${candidate.city} due to ${candidate.hasWeatherRisk ? 'severe weather conditions' : 'critical reports'}. ${candidate.criticalReports} critical reports confirmed.`,
        city: candidate.city,
        severity: 'critical',
        createdAt: serverTimestamp(),
        read: false
      };

      await addDoc(collection(db, 'notifications'), notificationData);

      // Add city to suspended list
      setSuspendedCities(prev => new Set([...prev, candidate.city]));

      // Add notification to bell
      addNotification({
        id: `suspension-${Date.now()}`,
        title: `🚫 Class Suspension - ${candidate.city}`,
        message: `Classes suspended in ${candidate.city}. ${candidate.criticalReports} critical reports confirmed.`,
        severity: 'critical',
        timestamp: new Date().toISOString()
      });

      // Show success modal
      setSuspendedCityName(candidate.city);
      setShowSuccessModal(true);

      // Refresh data to update stats
      await fetchData();

      // Auto-close success modal after 3 seconds
      setTimeout(() => {
        setShowSuccessModal(false);
      }, 3000);

    } catch (error) {
      console.error('Error issuing suspension:', error);
      alert('Failed to issue suspension. Please try again.');
    } finally {
      setSuspendingCity(null);
    }
  };

  const suspensionCandidates = getSuspensionCandidates();

  // Debug log
  console.log('Suspension Candidates:', suspensionCandidates);
  console.log('Total reports:', reports.length);
  console.log('Weather data:', weatherData.length);

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
        <div className="flex gap-2">
          <Button
            onClick={() => setShowSuspensionListModal(true)}
            disabled={suspensionCandidates.length === 0}
            style={{
              backgroundColor: suspensionCandidates.length === 0 ? '#9CA3AF' : '#DC2626',
              color: 'white'
            }}
            className="flex items-center gap-2 hover:opacity-90"
          >
            <List className="w-4 h-4" />
            Suspension Candidates ({suspensionCandidates.length})
          </Button>
          <Button
            onClick={fetchData}
            disabled={loading}
            className="flex items-center gap-2 bg-blue-500 hover:bg-blue-600 text-white"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
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
              <div className="grid grid-cols-3 gap-4 pt-4 border-t" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)' }}>
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

      {/* Suspension Candidates Modal */}
      {showSuspensionListModal && (
        <div
          className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4"
          onClick={() => setShowSuspensionListModal(false)}
        >
          <div
            className="bg-white rounded-lg shadow-xl flex flex-col"
            style={{ maxHeight: '85vh', width: '850px', maxWidth: '90vw' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="border-b bg-gradient-to-r from-red-50 to-orange-50 flex-shrink-0 px-4 pt-4 pb-3">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                    <Ban className="w-5 h-5 text-red-600" />
                    Class Suspension Candidates
                  </h2>
                  <p className="text-xs text-gray-600 mt-1">
                    Cities that meet criteria for class suspension based on weather and reports
                  </p>
                </div>
                <Button variant="ghost" size="sm" onClick={() => setShowSuspensionListModal(false)}>
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </div>

            <div className="overflow-y-auto p-4 flex-1">
              {suspensionCandidates.length === 0 ? (
                <div className="text-center py-12">
                  <Check className="w-16 h-16 text-green-500 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">No Suspension Candidates</h3>
                  <p className="text-gray-600">All cities are safe. No immediate class suspensions needed.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {suspensionCandidates.map((candidate, idx) => (
                    <Card key={idx} className={`border-2 ${
                      candidate.riskScore >= 80 ? 'border-red-400 bg-red-50' :
                      candidate.riskScore >= 60 ? 'border-orange-400 bg-orange-50' :
                      'border-yellow-400 bg-yellow-50'
                    }`}>
                      <CardContent className="p-3">
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <MapPin className="w-4 h-4 text-red-600" />
                              <h3 className="text-lg font-bold text-gray-900">{candidate.city}</h3>
                              <Badge
                                style={{
                                  backgroundColor: candidate.riskScore >= 80 ? '#DC2626' : candidate.riskScore >= 60 ? '#EA580C' : '#CA8A04',
                                  color: 'white'
                                }}
                                className="text-xs font-semibold"
                              >
                                Risk Score: {candidate.riskScore}
                              </Badge>
                            </div>

                            <div className="grid grid-cols-2 gap-3 mb-2">
                              <div>
                                <p className="text-xs font-semibold text-gray-700 mb-1">Weather Conditions:</p>
                                <div className="text-xs text-gray-800 space-y-0.5">
                                  {candidate.rainfall > 0 && (
                                    <div className="flex items-center gap-1.5">
                                      <Cloud className="w-3 h-3 text-blue-600" />
                                      <span>Rainfall: <strong>{candidate.rainfall}mm/h</strong>
                                        {candidate.rainfall > 20 && <span className="text-red-600 ml-1">⚠ HEAVY</span>}
                                      </span>
                                    </div>
                                  )}
                                  {candidate.windSpeed > 0 && (
                                    <div className="flex items-center gap-1.5">
                                      <AlertTriangle className="w-3 h-3 text-orange-600" />
                                      <span>Wind: <strong>{candidate.windSpeed} km/h</strong>
                                        {candidate.windSpeed > 60 && <span className="text-red-600 ml-1">⚠ STRONG</span>}
                                      </span>
                                    </div>
                                  )}
                                  {candidate.rainfall === 0 && candidate.windSpeed === 0 && (
                                    <span className="text-gray-500">No critical weather data</span>
                                  )}
                                </div>
                              </div>

                              <div>
                                <p className="text-xs font-semibold text-gray-700 mb-1">Community Reports:</p>
                                <div className="text-xs text-gray-800 space-y-0.5">
                                  <div>🚨 Critical: <strong className="text-red-700">{candidate.criticalReports}</strong></div>
                                  <div>⚠️ High: <strong className="text-orange-700">{candidate.highReports}</strong></div>
                                  <div>📊 Total: <strong>{candidate.totalReports}</strong> reports</div>
                                </div>
                              </div>
                            </div>

                            <div className="bg-white rounded-lg p-2 border border-gray-200 mt-2">
                              <p className="text-xs text-gray-700">
                                <strong>Recommendation:</strong> {
                                  candidate.riskScore >= 80 ? 'Immediate class suspension strongly recommended' :
                                  candidate.riskScore >= 60 ? 'Class suspension recommended' :
                                  'Monitor closely, consider suspension'
                                }
                              </p>
                            </div>
                          </div>
                        </div>

                        <div className="flex justify-end mt-2">
                          <Button
                            onClick={() => {
                              setSelectedCandidate(candidate);
                              setShowConfirmModal(true);
                            }}
                            disabled={suspendingCity === candidate.city || suspendedCities.has(candidate.city)}
                            style={{
                              backgroundColor: suspendedCities.has(candidate.city) ? '#9CA3AF' : '#DC2626',
                              color: '#FFFFFF',
                              border: 'none'
                            }}
                            className="font-semibold hover:opacity-90 transition-opacity px-4 py-2 rounded-md flex items-center gap-2"
                          >
                            {suspendedCities.has(candidate.city) ? (
                              <>
                                <Check className="w-4 h-4" style={{ color: '#FFFFFF' }} />
                                <span style={{ color: '#FFFFFF' }}>Already Suspended</span>
                              </>
                            ) : suspendingCity === candidate.city ? (
                              <>
                                <RefreshCw className="w-4 h-4 animate-spin" style={{ color: '#FFFFFF' }} />
                                <span style={{ color: '#FFFFFF' }}>Suspending...</span>
                              </>
                            ) : (
                              <>
                                <Ban className="w-4 h-4" style={{ color: '#FFFFFF' }} />
                                <span style={{ color: '#FFFFFF' }}>Suspend Classes</span>
                              </>
                            )}
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Modal */}
      {showConfirmModal && selectedCandidate && (
        <div
          className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4"
          onClick={() => setShowConfirmModal(false)}
        >
          <Card className="max-w-md w-full" onClick={(e) => e.stopPropagation()}>
            <CardHeader className="bg-gradient-to-r from-red-50 to-orange-50">
              <CardTitle className="text-xl flex items-center gap-2">
                <AlertTriangle className="w-6 h-6 text-red-600" />
                Confirm Class Suspension
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <p className="text-gray-700 mb-4">
                Are you sure you want to issue a class suspension for <strong>{selectedCandidate.city}</strong>?
              </p>
              <div className="bg-gray-50 rounded-lg p-4 mb-4">
                <p className="text-sm text-gray-600 mb-2">This action will:</p>
                <ul className="text-sm text-gray-700 space-y-1">
                  <li className="flex items-start gap-2">
                    <span className="text-blue-600">•</span>
                    Create a suspension record in the system
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-blue-600">•</span>
                    Send notifications to all users
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-blue-600">•</span>
                    Update the dashboard statistics
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-blue-600">•</span>
                    Notify affected schools and communities
                  </li>
                </ul>
              </div>
              <div className="flex gap-3">
                <Button
                  onClick={() => setShowConfirmModal(false)}
                  className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-800"
                >
                  Cancel
                </Button>
                <Button
                  onClick={() => issueSuspension(selectedCandidate)}
                  style={{ backgroundColor: '#DC2626', color: 'white' }}
                  className="flex-1 font-semibold hover:opacity-90"
                >
                  <Ban className="w-4 h-4 mr-2" />
                  Confirm Suspension
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Success Modal */}
      {showSuccessModal && (
        <div
          className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4"
          onClick={() => setShowSuccessModal(false)}
        >
          <div
<<<<<<< HEAD
            className="bg-white rounded-xl shadow-xl overflow-hidden"
            style={{ width: '420px', maxWidth: '90vw' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="bg-green-500 py-6 flex items-center justify-center">
              <Check className="w-12 h-12 text-white stroke-[3]" />
            </div>
            <div className="px-6 py-6 text-center">
              <h3 className="text-2xl font-bold text-gray-900 mb-3">Area Suspended!</h3>
              <p className="text-sm text-gray-600 leading-relaxed">
                Class suspension has been issued for <span className="font-bold text-gray-900">{suspendedCityName}</span>. Notifications have been sent to all users.
              </p>
=======
            className="bg-white rounded-2xl shadow-2xl overflow-hidden"
            style={{ width: '600px', maxWidth: '90vw' }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Success Header */}
            <div className="bg-gradient-to-r from-green-500 to-emerald-500 py-8 flex items-center justify-center relative">
              <div className="text-center">
                <div className="bg-white/20 rounded-full p-4 inline-block mb-3">
                  <Check className="w-16 h-16 text-white stroke-[3]" />
                </div>
                <h3 className="text-3xl font-bold text-white">Class Suspension Issued</h3>
              </div>
            </div>

            {/* Content */}
            <div className="px-8 py-8">
              <div className="bg-green-50 border-l-4 border-green-500 rounded-lg p-6 mb-6">
                <div className="flex items-start gap-3">
                  <GraduationCap className="w-6 h-6 text-green-600 mt-1 flex-shrink-0" />
                  <div>
                    <h4 className="text-lg font-semibold text-green-900 mb-2">
                      {suspendedCityName}
                    </h4>
                    <p className="text-green-800 leading-relaxed">
                      Classes have been officially suspended. All registered users and community members have been notified via real-time alerts.
                    </p>
                  </div>
                </div>
              </div>

              {/* Info Box */}
              <div className="bg-blue-50 rounded-lg p-4 mb-6">
                <div className="flex items-center gap-2 text-sm text-blue-900">
                  <AlertTriangle className="w-4 h-4 text-blue-600" />
                  <p>This suspension is now active and visible to all users on the platform.</p>
                </div>
              </div>

              {/* Close Button */}
              <Button
                onClick={() => setShowSuccessModal(false)}
                className="w-full bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white py-3 text-lg font-semibold shadow-lg"
              >
                Done
              </Button>
>>>>>>> d8fed4363f53ed32c3448c2f822b2d1c61003ffe
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
