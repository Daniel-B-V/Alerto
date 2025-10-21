import { useState, useEffect } from "react";
import {
  Eye,
  Download,
  RefreshCw,
  FileText,
  MapPin,
  AlertTriangle,
  CheckCircle,
  XCircle,
  TrendingUp,
  Users,
  Clock,
  Shield,
  X,
  ChevronLeft
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { subscribeToReports } from "../firebase/firestore";

export function EnhancedReportsPage() {
  const [reports, setReports] = useState([]);
  const [compiledReports, setCompiledReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [showCompiledModal, setShowCompiledModal] = useState(false);
  const [weatherData, setWeatherData] = useState({});
  const [showSuspensionModal, setShowSuspensionModal] = useState(false);

  // Load reports from Firebase
  useEffect(() => {
    const unsubscribe = subscribeToReports((reportsData) => {
      setReports(reportsData);
      compileReportsByLocation(reportsData);
      setLoading(false);
    }, { limit: 200 });

    return () => {
      if (unsubscribe && typeof unsubscribe === 'function') {
        unsubscribe();
      }
    };
  }, []);

  // Compile reports by location
  const compileReportsByLocation = async (reportsData) => {
    const locationGroups = {};

    // Group reports by city
    reportsData.forEach(report => {
      const city = report.location?.city || 'Unknown';
      if (!locationGroups[city]) {
        locationGroups[city] = {
          city,
          reports: [],
          totalReports: 0,
          criticalReports: 0,
          highReports: 0,
          mediumReports: 0,
          verifiedReports: 0,
          pendingReports: 0,
          lastReportTime: null
        };
      }

      locationGroups[city].reports.push(report);
      locationGroups[city].totalReports++;

      // Count by severity
      if (report.severity === 'critical') locationGroups[city].criticalReports++;
      if (report.severity === 'high') locationGroups[city].highReports++;
      if (report.severity === 'medium') locationGroups[city].mediumReports++;

      // Count by status
      if (report.status === 'verified') locationGroups[city].verifiedReports++;
      if (report.status === 'pending') locationGroups[city].pendingReports++;

      // Track latest report time
      const reportTime = report.createdAt?.seconds ? report.createdAt.seconds * 1000 : Date.now();
      if (!locationGroups[city].lastReportTime || reportTime > locationGroups[city].lastReportTime) {
        locationGroups[city].lastReportTime = reportTime;
      }
    });

    const compiled = Object.values(locationGroups).map((group) => {
      // Calculate AI confidence based on factors
      group.aiConfidence = calculateAIConfidence(group);
      group.credibilityStatus = getCredibilityStatus(group);
      return group;
    });

    // Sort by total reports (descending)
    compiled.sort((a, b) => b.totalReports - a.totalReports);
    setCompiledReports(compiled);
  };

  // AI Credibility Logic
  const calculateAIConfidence = (locationGroup) => {
    let confidence = 50; // Base confidence

    const { reports } = locationGroup;
    const reportsInSameArea = reports.length;

    // Factor 1: Number of reports from same area
    if (reportsInSameArea >= 5) {
      confidence += 30;
    } else if (reportsInSameArea >= 3) {
      confidence += 20;
    } else if (reportsInSameArea <= 1) {
      confidence -= 20;
    }

    // Factor 2: Verified reports ratio
    const verifiedRatio = (locationGroup.verifiedReports / reports.length) * 100;
    if (verifiedRatio >= 50) {
      confidence += 15;
    } else if (verifiedRatio >= 25) {
      confidence += 10;
    }

    // Factor 3: Keywords detection
    const keywords = ['flood', 'rain', 'storm', 'typhoon', 'landslide', 'emergency', 'impassable'];
    let keywordMatches = 0;

    reports.forEach(report => {
      const text = `${report.description || ''} ${report.category || ''}`.toLowerCase();
      keywords.forEach(keyword => {
        if (text.includes(keyword)) keywordMatches++;
      });
    });

    if (keywordMatches >= 5) {
      confidence += 10;
    }

    // Cap confidence between 0-100
    return Math.max(0, Math.min(100, Math.round(confidence)));
  };

  // Get credibility status
  const getCredibilityStatus = (locationGroup) => {
    const { aiConfidence, reports } = locationGroup;

    if (aiConfidence >= 85 && reports.length >= 3) {
      return { label: 'Authentic', color: 'bg-green-600', icon: CheckCircle };
    } else if (aiConfidence >= 60) {
      return { label: 'Needs Review', color: 'bg-yellow-600', icon: AlertTriangle };
    } else {
      return { label: 'Low Confidence', color: 'bg-red-600', icon: XCircle };
    }
  };

  // Calculate statistics
  const stats = {
    totalReports: reports.length,
    totalCities: compiledReports.length,
    critical: reports.filter(r => r.severity === 'critical').length,
    high: reports.filter(r => r.severity === 'high').length,
    verified: reports.filter(r => r.status === 'verified').length,
    pending: reports.filter(r => r.status === 'pending').length,
  };

  // Format timestamp
  const formatTimestamp = (timestamp) => {
    if (!timestamp) return 'Unknown';
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffMins < 1440) return `${Math.floor(diffMins / 60)}h ago`;
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
  };

  // Export to CSV
  const exportToCSV = () => {
    const headers = ['Location', 'Total Reports', 'Critical', 'High', 'Medium', 'Verified', 'Pending', 'AI Confidence', 'Status', 'Last Report'];
    const rows = compiledReports.map(loc => [
      loc.city,
      loc.totalReports,
      loc.criticalReports,
      loc.highReports,
      loc.mediumReports,
      loc.verifiedReports,
      loc.pendingReports,
      loc.aiConfidence + '%',
      loc.credibilityStatus.label,
      formatTimestamp(loc.lastReportTime)
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `compiled-reports-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  // Handle view compiled reports
  const handleViewCompiled = (locationGroup) => {
    setSelectedLocation(locationGroup);
    setShowCompiledModal(true);
  };

  // Handle issue suspension
  const handleIssueSuspension = () => {
    setShowSuspensionModal(true);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <RefreshCw className="w-12 h-12 text-blue-500 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading compiled reports...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2 flex items-center gap-3">
            <FileText className="w-8 h-8 text-blue-500" />
            Compiled Reports by Location
          </h1>
          <p className="text-gray-600">
            AI-powered report compilation grouped by city with credibility analysis
          </p>
          <p className="text-sm text-gray-500 mt-1">
            {compiledReports.length} locations • {reports.length} total reports • Last updated: {new Date().toLocaleTimeString()}
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={exportToCSV}
            className="flex items-center gap-2"
          >
            <Download className="w-4 h-4" />
            Export CSV
          </Button>
          <Button
            onClick={() => window.location.reload()}
            className="flex items-center gap-2 bg-blue-500 hover:bg-blue-600 text-white"
          >
            <RefreshCw className="w-4 h-4" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Statistics Cards - 2x2 Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', width: '100%', maxWidth: '1200px', margin: '0 auto 2rem auto' }}>
        <div>
          <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200 h-full">
            <CardContent className="p-6">
              <div className="text-center">
                <div className="text-4xl font-bold text-blue-900">{stats.totalReports}</div>
                <div className="text-sm text-blue-600 mt-2">Total Reports</div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div>
          <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200 h-full">
            <CardContent className="p-6">
              <div className="text-center">
                <div className="text-4xl font-bold text-purple-900">{stats.totalCities}</div>
                <div className="text-sm text-purple-600 mt-2">Locations</div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div>
          <Card className="bg-gradient-to-br from-red-50 to-red-100 border-red-200 h-full">
            <CardContent className="p-6">
              <div className="text-center">
                <div className="text-4xl font-bold text-red-900">{stats.critical}</div>
                <div className="text-sm text-red-600 mt-2">Critical</div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div>
          <Card className="bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200 h-full">
            <CardContent className="p-6">
              <div className="text-center">
                <div className="text-4xl font-bold text-orange-900">{stats.high}</div>
                <div className="text-sm text-orange-600 mt-2">High Priority</div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Top 3 Cities */}
      {compiledReports.length > 0 && (
        <Card className="bg-gradient-to-br from-indigo-50 to-purple-50 border-indigo-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-indigo-900">
              <TrendingUp className="w-5 h-5" />
              Top 3 Cities with Most Reports
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {compiledReports.slice(0, 3).map((city, index) => (
                <div key={index} className="bg-white/70 backdrop-blur-sm rounded-xl p-4 border border-indigo-200">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-3xl font-bold text-indigo-600">#{index + 1}</span>
                    <Badge className={city.credibilityStatus.color + ' text-white'}>
                      {city.aiConfidence}% confident
                    </Badge>
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-1">{city.city}</h3>
                  <p className="text-2xl font-bold text-indigo-600 mb-2">{city.totalReports} reports</p>
                  <div className="text-sm text-gray-600 space-y-1">
                    <div>🚨 {city.criticalReports} Critical</div>
                    <div>⚠️ {city.highReports} High Priority</div>
                    <div>✓ {city.verifiedReports} Verified</div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Compiled Reports Table */}
      <Card>
        <CardHeader>
          <CardTitle>Compiled Reports by Location ({compiledReports.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {compiledReports.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">No reports found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b-2 border-gray-200">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Location</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Number of Reports</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Critical/High</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Status</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">AI Confidence</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Last Report</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {compiledReports.map((location, index) => {
                    const StatusIcon = location.credibilityStatus.icon;
                    return (
                      <tr key={index} className="hover:bg-gray-50 transition-colors">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <MapPin className="w-4 h-4 text-gray-400" />
                            <span className="font-semibold text-gray-900">{location.city}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <Badge variant="secondary" className="text-lg font-bold">
                            {location.totalReports}
                          </Badge>
                        </td>
                        <td className="px-4 py-3">
                          <div className="text-sm">
                            <div className="text-red-600 font-semibold">🚨 {location.criticalReports}</div>
                            <div className="text-orange-600">⚠️ {location.highReports}</div>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="space-y-1">
                            <Badge className={location.credibilityStatus.color + ' text-white flex items-center gap-1 w-fit'}>
                              <StatusIcon className="w-3 h-3" />
                              {location.credibilityStatus.label}
                            </Badge>
                            <div className="text-xs text-gray-500">
                              {location.verifiedReports} verified / {location.pendingReports} pending
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <div className="w-16 bg-gray-200 rounded-full h-2">
                              <div
                                className={`h-2 rounded-full ${
                                  location.aiConfidence >= 85 ? 'bg-green-500' :
                                  location.aiConfidence >= 60 ? 'bg-yellow-500' :
                                  'bg-red-500'
                                }`}
                                style={{ width: `${location.aiConfidence}%` }}
                              ></div>
                            </div>
                            <span className="text-sm font-semibold">{location.aiConfidence}%</span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600">
                          <div className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {formatTimestamp(location.lastReportTime)}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <Button
                            size="sm"
                            onClick={() => handleViewCompiled(location)}
                            className="bg-blue-500 hover:bg-blue-600 text-white flex items-center gap-2"
                          >
                            <Eye className="w-4 h-4" />
                            View Details
                          </Button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Compiled Reports Modal */}
      {showCompiledModal && selectedLocation && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
          onClick={() => setShowCompiledModal(false)}
        >
          <div className="max-w-2xl w-full max-h-[90vh] bg-white rounded-lg shadow-xl flex flex-col" onClick={(e) => e.stopPropagation()}>
            <div className="border-b bg-gradient-to-r from-blue-50 to-indigo-50 p-4 rounded-t-lg flex-shrink-0">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-semibold flex items-center gap-2">
                    <MapPin className="w-5 h-5 text-blue-500" />
                    {selectedLocation.city} - Compiled Report
                  </h3>
                  <p className="text-xs text-gray-600 mt-1">
                    {selectedLocation.totalReports} reports • AI Confidence: {selectedLocation.aiConfidence}%
                  </p>
                </div>
                <Button variant="ghost" size="sm" onClick={() => setShowCompiledModal(false)}>
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </div>

            <div className="p-4 space-y-4">
              {/* AI Analysis */}
              <Card className={`${
                selectedLocation.aiConfidence >= 85 ? 'bg-green-50 border-green-200' :
                selectedLocation.aiConfidence >= 60 ? 'bg-yellow-50 border-yellow-200' :
                'bg-red-50 border-red-200'
              }`}>
                <CardHeader className="p-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Shield className="w-4 h-4" />
                    AI Credibility Analysis
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-3 pt-0">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-semibold">Confidence Score:</span>
                      <Badge className={selectedLocation.credibilityStatus.color + ' text-white text-sm px-3 py-1'}>
                        {selectedLocation.aiConfidence}% - {selectedLocation.credibilityStatus.label}
                      </Badge>
                    </div>
                    <div className="text-xs text-gray-700 space-y-1">
                      <p><strong>Analysis:</strong></p>
                      <ul className="list-disc list-inside space-y-0.5 text-xs">
                        <li>{selectedLocation.reports.length} reports from the same area (
                          {selectedLocation.reports.length >= 5 ? 'High correlation ✓' :
                           selectedLocation.reports.length >= 3 ? 'Moderate correlation' :
                           'Low correlation ⚠️'}
                        )</li>
                        <li>
                          {selectedLocation.verifiedReports > 0
                            ? `${selectedLocation.verifiedReports} reports already verified by admins ✓`
                            : 'No verified reports yet'
                          }
                        </li>
                        <li>Verified rate: {Math.round((selectedLocation.verifiedReports / selectedLocation.reports.length) * 100)}%</li>
                      </ul>
                      {selectedLocation.aiConfidence >= 85 && selectedLocation.criticalReports >= 3 && (
                        <p className="mt-2 p-2 bg-red-100 border border-red-300 rounded-lg font-semibold text-red-900 text-xs">
                          ⚠️ Recommendation: {selectedLocation.criticalReports} critical reports detected.
                          Class suspension strongly recommended for {selectedLocation.city}.
                        </p>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* All Reports List */}
              <div>
                <h3 className="text-base font-semibold mb-2 flex items-center gap-2">
                  <Users className="w-4 h-4 text-gray-600" />
                  All Reports ({selectedLocation.reports.length})
                </h3>
                {/* Scrollable Reports Container */}
                <div className="max-h-[300px] overflow-y-auto border border-gray-200 rounded-lg p-3 bg-gray-50 space-y-2">
                  {selectedLocation.reports.map((report, idx) => (
                    <Card key={idx} className="hover:shadow-md transition-shadow bg-white">
                      <CardContent className="p-3">
                        <div className="flex items-start justify-between mb-1.5">
                          <div className="flex items-center gap-2">
                            <Badge
                              className="text-xs"
                              style={{
                                backgroundColor:
                                  report.severity === 'critical' ? '#dc2626' :
                                  report.severity === 'high' ? '#f97316' :
                                  report.severity === 'medium' ? '#ca8a04' :
                                  '#3b82f6',
                                color: 'white'
                              }}
                            >
                              {report.severity?.toUpperCase() || 'N/A'}
                            </Badge>
                            <span className="text-xs text-gray-600">
                              {report.category?.replace(/_/g, ' ') || 'General'}
                            </span>
                          </div>
                          <Badge variant={report.status === 'verified' ? 'default' : 'secondary'} className="text-xs">
                            {report.status}
                          </Badge>
                        </div>
                        <p className="text-xs text-gray-700 mb-1.5 line-clamp-2">{report.description}</p>
                        <div className="flex items-center justify-between text-xs text-gray-500">
                          <span>{report.userName || 'Anonymous'}</span>
                          <span>{formatTimestamp(report.createdAt?.seconds ? report.createdAt.seconds * 1000 : null)}</span>
                        </div>
                        {report.images && report.images.length > 0 && (
                          <div className="mt-1 text-xs text-gray-500">
                            📷 {report.images.length} image(s) attached
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>

            </div>

            {/* Modal Footer with Action Buttons */}
            <div className="border-t p-3 bg-gray-50 rounded-b-lg flex-shrink-0">
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => setShowCompiledModal(false)}
                  className="flex items-center gap-1.5 text-sm"
                  size="sm"
                >
                  <ChevronLeft className="w-4 h-4" />
                  Back
                </Button>
                <Button
                  onClick={handleIssueSuspension}
                  className="flex-1 bg-red-600 hover:bg-red-700 text-white text-sm font-semibold"
                  disabled={selectedLocation.aiConfidence < 60}
                  size="sm"
                >
                  <AlertTriangle className="w-4 h-4 mr-1.5" />
                  Issue Class Suspension
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Suspension Modal */}
      {showSuspensionModal && selectedLocation && (
        <div
          className="fixed inset-0 bg-black/60 flex items-center justify-center z-[60] p-4"
          onClick={() => setShowSuspensionModal(false)}
        >
          <Card className="max-w-2xl w-full" onClick={(e) => e.stopPropagation()}>
            <CardHeader className="bg-red-50 border-b border-red-200">
              <CardTitle className="text-xl text-red-900 flex items-center gap-2">
                <AlertTriangle className="w-6 h-6" />
                Confirm Class Suspension - {selectedLocation.city}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              <div className="bg-yellow-50 border border-yellow-300 rounded-lg p-4">
                <h3 className="font-semibold text-yellow-900 mb-2">⚠️ AI Justification</h3>
                <p className="text-sm text-yellow-800">
                  <strong>{selectedLocation.criticalReports} critical reports</strong> and
                  <strong> {selectedLocation.verifiedReports} verified reports</strong> detected in {selectedLocation.city}.
                  {selectedLocation.weatherData && selectedLocation.weatherData.rainfall > 10 && (
                    <> Current severe rainfall: <strong>{selectedLocation.weatherData.rainfall}mm/h</strong>.</>
                  )}
                  {selectedLocation.weatherData && selectedLocation.weatherData.windSpeed > 60 && (
                    <> Strong winds detected: <strong>{selectedLocation.weatherData.windSpeed}km/h</strong>.</>
                  )}
                </p>
                <p className="text-sm text-yellow-900 font-semibold mt-2">
                  AI Confidence: {selectedLocation.aiConfidence}% - {selectedLocation.credibilityStatus.label}
                </p>
                <p className="text-sm text-yellow-900 mt-2">
                  ✅ Recommend immediate class suspension for public safety.
                </p>
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-semibold text-gray-700">Suspension Message:</label>
                <textarea
                  className="w-full p-3 border rounded-lg"
                  rows="4"
                  defaultValue={`Class suspension announced for ${selectedLocation.city} due to severe weather conditions. ${selectedLocation.criticalReports} critical reports confirmed. Stay safe and remain indoors.`}
                />
              </div>

              <div className="flex gap-3">
                <Button
                  className="flex-1 bg-red-600 hover:bg-red-700 text-white py-3"
                  onClick={() => {
                    alert(`Class suspension issued for ${selectedLocation.city}`);
                    setShowSuspensionModal(false);
                    setShowCompiledModal(false);
                  }}
                >
                  Confirm & Issue Suspension
                </Button>
                <Button
                  variant="outline"
                  className="flex-1 py-3"
                  onClick={() => setShowSuspensionModal(false)}
                >
                  Cancel
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
