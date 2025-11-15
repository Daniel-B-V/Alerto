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
  ChevronLeft,
  ChevronDown,
  ChevronUp,
  Sparkles,
  Loader2,
  AlertOctagon,
  Target,
  Filter
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { subscribeToReports } from "../../firebase/firestore";
import { analyzeCompiledLocationReports, analyzeIndividualReportCredibility } from "../../services/geminiService";
import { useSuspensions } from "../../hooks/useSuspensions";
import { getWeatherAssessmentForSuspension } from "../../services/weatherService";
import { SUSPENSION_LEVELS } from "../../constants/suspensionCriteria";

export function EnhancedReportsPage() {
  const [reports, setReports] = useState([]);
  const [compiledReports, setCompiledReports] = useState([]);
  const [filteredCompiledReports, setFilteredCompiledReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [showCompiledModal, setShowCompiledModal] = useState(false);
  const [weatherData, setWeatherData] = useState({});
  const [showSuspensionModal, setShowSuspensionModal] = useState(false);
  const [aiAnalysis, setAiAnalysis] = useState(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [reportCredibility, setReportCredibility] = useState({});  // Store credibility for each report
  const [credibilityLoading, setCredibilityLoading] = useState(false);
  const [expandedReports, setExpandedReports] = useState({});  // Track expanded state for each report
  const [locationFilters, setLocationFilters] = useState({
    minReports: 'all',
    credibilityStatus: 'all',
    minConfidence: 'all',
    sortBy: 'reports-desc'
  });

  // Suspension system integration
  const { issueSuspension } = useSuspensions();
  const [suspensionData, setSuspensionData] = useState(null);
  const [selectedLevels, setSelectedLevels] = useState(['k12']);
  const [suspensionMessage, setSuspensionMessage] = useState('');
  const [durationHours, setDurationHours] = useState(12);
  const [issuing, setIssuing] = useState(false);

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
          investigatingReports: 0,
          lastReportTime: null
        };
      }

      locationGroups[city].reports.push(report);
      locationGroups[city].totalReports++;

      // Count by severity
      if (report.severity === 'critical') locationGroups[city].criticalReports++;
      if (report.severity === 'high') locationGroups[city].highReports++;
      if (report.severity === 'medium') locationGroups[city].mediumReports++;

      // Count by status (all reports are verified, tracking investigating separately)
      if (report.status === 'verified') locationGroups[city].verifiedReports++;
      if (report.status === 'investigating') locationGroups[city].investigatingReports++;

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
    setFilteredCompiledReports(compiled);
  };

  // Apply filters to compiled reports
  useEffect(() => {
    let filtered = [...compiledReports];

    // Filter by minimum reports
    if (locationFilters.minReports !== 'all') {
      const minCount = parseInt(locationFilters.minReports);
      filtered = filtered.filter(loc => loc.totalReports >= minCount);
    }

    // Filter by credibility status
    if (locationFilters.credibilityStatus !== 'all') {
      filtered = filtered.filter(loc => loc.credibilityStatus.label === locationFilters.credibilityStatus);
    }

    // Filter by minimum AI confidence
    if (locationFilters.minConfidence !== 'all') {
      const minConf = parseInt(locationFilters.minConfidence);
      filtered = filtered.filter(loc => loc.aiConfidence >= minConf);
    }

    // Sort
    switch (locationFilters.sortBy) {
      case 'reports-desc':
        filtered.sort((a, b) => b.totalReports - a.totalReports);
        break;
      case 'reports-asc':
        filtered.sort((a, b) => a.totalReports - b.totalReports);
        break;
      case 'confidence-desc':
        filtered.sort((a, b) => b.aiConfidence - a.aiConfidence);
        break;
      case 'confidence-asc':
        filtered.sort((a, b) => a.aiConfidence - b.aiConfidence);
        break;
      case 'critical-desc':
        filtered.sort((a, b) => b.criticalReports - a.criticalReports);
        break;
      case 'city-asc':
        filtered.sort((a, b) => a.city.localeCompare(b.city));
        break;
      default:
        break;
    }

    setFilteredCompiledReports(filtered);
  }, [compiledReports, locationFilters]);

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

  // Get attention level based on reports and AI confidence
  const getAttentionLevel = (location) => {
    const { totalReports, aiConfidence } = location;

    // High attention: Many reports AND high confidence
    if (totalReports >= 10 && aiConfidence >= 75) {
      return {
        level: 'High',
        bgColor: '#DC2626' // red-600
      };
    }
    // High attention: Moderate reports but very high confidence
    else if (totalReports >= 5 && aiConfidence >= 85) {
      return {
        level: 'High',
        bgColor: '#DC2626' // red-600
      };
    }
    // Medium attention: Moderate reports and confidence
    else if (totalReports >= 5 && aiConfidence >= 50) {
      return {
        level: 'Medium',
        bgColor: '#F97316' // orange-500
      };
    }
    // Medium attention: Few reports but high confidence
    else if (totalReports >= 3 && aiConfidence >= 75) {
      return {
        level: 'Medium',
        bgColor: '#F97316' // orange-500
      };
    }
    // Low attention: Few reports or low confidence
    else {
      return {
        level: 'Low',
        bgColor: '#EAB308' // yellow-500
      };
    }
  };

  // Calculate statistics
  const stats = {
    totalReports: reports.length,
    totalCities: compiledReports.length,
    critical: reports.filter(r => r.severity === 'critical').length,
    high: reports.filter(r => r.severity === 'high').length,
    verified: reports.filter(r => r.status === 'verified').length,
    investigating: reports.filter(r => r.status === 'investigating').length,
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
    const headers = ['Location', 'Total Reports', 'Attention Level', 'Verified', 'Investigating', 'AI Confidence', 'Status', 'Last Report'];
    const rows = compiledReports.map(loc => {
      const attentionLevel = getAttentionLevel(loc);
      return [
      loc.city,
      loc.totalReports,
      attentionLevel.level,
      loc.verifiedReports,
      loc.investigatingReports,
      loc.aiConfidence + '%',
      loc.credibilityStatus.label,
      formatTimestamp(loc.lastReportTime)
    ];
    });

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

  // Toggle individual report expansion
  const toggleReportExpansion = (reportId) => {
    setExpandedReports(prev => ({
      ...prev,
      [reportId]: !prev[reportId]
    }));
  };

  // Handle view compiled reports
  const handleViewCompiled = async (locationGroup) => {
    setSelectedLocation(locationGroup);
    setShowCompiledModal(true);
    setAiAnalysis(null);
    setAiLoading(true);
    setReportCredibility({});
    setCredibilityLoading(true);
    setExpandedReports({});  // Reset expanded state

    // Trigger AI analysis automatically
    try {
      const result = await analyzeCompiledLocationReports(locationGroup);
      if (result.success) {
        setAiAnalysis(result.analysis);
      } else {
        console.error('AI analysis failed:', result.error);
      }
    } catch (error) {
      console.error('Error during AI analysis:', error);
    } finally {
      setAiLoading(false);
    }

    // Analyze each individual report for credibility
    try {
      const credibilityResults = {};
      const allReports = locationGroup.reports;

      // Analyze reports in batches to avoid overwhelming the API
      for (const report of allReports) {
        try {
          const credibility = await analyzeIndividualReportCredibility(report, allReports);
          credibilityResults[report.id] = credibility;
        } catch (error) {
          console.error(`Error analyzing report ${report.id}:`, error);
          // Use fallback for failed analyses
          credibilityResults[report.id] = {
            success: false,
            credibilityScore: 50,
            category: 'REVIEW_MANUALLY',
            spamReason: 'Analysis unavailable'
          };
        }
      }

      setReportCredibility(credibilityResults);
    } catch (error) {
      console.error('Error during individual credibility analysis:', error);
    } finally {
      setCredibilityLoading(false);
    }
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

      {/* Statistics Cards - 4 Columns */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem', width: '100%', margin: '0 0 2rem 0' }}>
        <div>
          <Card className="h-full !border-2 !border-blue-500" style={{ background: 'white' }}>
            <CardContent className="p-6">
              <div className="text-center">
                <div className="text-4xl font-bold text-gray-900">{stats.totalReports}</div>
                <div className="text-sm text-blue-600 mt-2">Total Reports</div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div>
          <Card className="h-full !border-2 !border-purple-500" style={{ background: 'white' }}>
            <CardContent className="p-6">
              <div className="text-center">
                <div className="text-4xl font-bold text-gray-900">{stats.totalCities}</div>
                <div className="text-sm text-purple-600 mt-2">Locations</div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div>
          <Card className="h-full !border-2 !border-red-500" style={{ background: 'white' }}>
            <CardContent className="p-6">
              <div className="text-center">
                <div className="text-4xl font-bold text-gray-900">{stats.critical}</div>
                <div className="text-sm text-red-600 mt-2">Critical</div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div>
          <Card className="h-full !border-2 !border-orange-500" style={{ background: 'white' }}>
            <CardContent className="p-6">
              <div className="text-center">
                <div className="text-4xl font-bold text-gray-900">{stats.high}</div>
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
              {compiledReports.slice(0, 3).map((city, index) => {
                const attentionLevel = getAttentionLevel(city);
                return (
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
                    <Badge
                      className="text-white text-xs"
                      style={{ backgroundColor: attentionLevel.bgColor }}
                    >
                      {attentionLevel.level}
                    </Badge>
                    <div>✓ {city.verifiedReports} Verified{city.investigatingReports > 0 ? ` / ${city.investigatingReports} Under Investigation` : ''}</div>
                  </div>
                </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Filters for Compiled Reports */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-wrap items-center gap-3">
            <Filter className="w-5 h-5 text-gray-500" />
            <span className="text-sm font-semibold text-gray-700">Filters:</span>

            <Select
              value={locationFilters.minReports}
              onValueChange={(value) => setLocationFilters(prev => ({ ...prev, minReports: value }))}
            >
              <SelectTrigger className="w-44">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Report Counts</SelectItem>
                <SelectItem value="3">3+ Reports</SelectItem>
                <SelectItem value="5">5+ Reports</SelectItem>
                <SelectItem value="10">10+ Reports</SelectItem>
                <SelectItem value="20">20+ Reports</SelectItem>
              </SelectContent>
            </Select>

            <Select
              value={locationFilters.credibilityStatus}
              onValueChange={(value) => setLocationFilters(prev => ({ ...prev, credibilityStatus: value }))}
            >
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="Authentic">✓ Authentic</SelectItem>
                <SelectItem value="Needs Review">⚠ Needs Review</SelectItem>
                <SelectItem value="Low Confidence">✗ Low Confidence</SelectItem>
              </SelectContent>
            </Select>

            <Select
              value={locationFilters.minConfidence}
              onValueChange={(value) => setLocationFilters(prev => ({ ...prev, minConfidence: value }))}
            >
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Confidence</SelectItem>
                <SelectItem value="85">85%+ Confidence</SelectItem>
                <SelectItem value="70">70%+ Confidence</SelectItem>
                <SelectItem value="60">60%+ Confidence</SelectItem>
                <SelectItem value="50">50%+ Confidence</SelectItem>
              </SelectContent>
            </Select>

            <Select
              value={locationFilters.sortBy}
              onValueChange={(value) => setLocationFilters(prev => ({ ...prev, sortBy: value }))}
            >
              <SelectTrigger className="w-52">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="reports-desc">Most Reports First</SelectItem>
                <SelectItem value="reports-asc">Least Reports First</SelectItem>
                <SelectItem value="confidence-desc">Highest Confidence</SelectItem>
                <SelectItem value="confidence-asc">Lowest Confidence</SelectItem>
                <SelectItem value="critical-desc">Most Critical</SelectItem>
                <SelectItem value="city-asc">City (A-Z)</SelectItem>
              </SelectContent>
            </Select>

            {(locationFilters.minReports !== 'all' ||
              locationFilters.credibilityStatus !== 'all' ||
              locationFilters.minConfidence !== 'all' ||
              locationFilters.sortBy !== 'reports-desc') && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setLocationFilters({
                  minReports: 'all',
                  credibilityStatus: 'all',
                  minConfidence: 'all',
                  sortBy: 'reports-desc'
                })}
                className="text-blue-600"
              >
                Clear Filters
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Compiled Reports Table */}
      <Card>
        <CardHeader>
          <CardTitle>Compiled Reports by Location ({filteredCompiledReports.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {filteredCompiledReports.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">No reports found</p>
            </div>
          ) : (
            <div
              className="overflow-auto scrollbar-thin"
              style={{
                maxHeight: '600px',
                scrollbarWidth: 'thin',
                scrollbarColor: '#CBD5E1 #F1F5F9'
              }}
            >
              <style jsx>{`
                div::-webkit-scrollbar {
                  width: 6px;
                }
                div::-webkit-scrollbar-track {
                  background: #F1F5F9;
                  border-radius: 10px;
                }
                div::-webkit-scrollbar-thumb {
                  background: #CBD5E1;
                  border-radius: 10px;
                }
                div::-webkit-scrollbar-thumb:hover {
                  background: #94A3B8;
                }
                div::-webkit-scrollbar-button {
                  display: none;
                }
              `}</style>
              <table className="w-full">
                <thead className="bg-gray-50 border-b-2 border-gray-200" style={{ position: 'sticky', top: 0, zIndex: 10 }}>
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Location</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Number of Reports</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Attention Level</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Status</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">AI Confidence</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Last Report</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y-2 divide-gray-300">
                  {filteredCompiledReports.map((location, index) => {
                    const StatusIcon = location.credibilityStatus.icon;
                    const attentionLevel = getAttentionLevel(location);
                    return (
                      <tr key={index} className="hover:bg-gray-50 transition-colors border-b border-gray-200">
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
                          <Badge
                            className="text-white font-semibold w-fit"
                            style={{ backgroundColor: attentionLevel.bgColor }}
                          >
                            {attentionLevel.level}
                          </Badge>
                        </td>
                        <td className="px-4 py-3">
                          <div className="space-y-1">
                            <Badge className={location.credibilityStatus.color + ' text-white flex items-center gap-1 w-fit'}>
                              <StatusIcon className="w-3 h-3" />
                              {location.credibilityStatus.label}
                            </Badge>
                            <div className="text-xs text-gray-500">
                              {location.verifiedReports} verified{location.investigatingReports > 0 ? ` / ${location.investigatingReports} investigating` : ''}
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
          <div
            className="bg-white rounded-2xl shadow-2xl flex flex-col overflow-hidden"
            style={{ width: '1000px', height: '85vh', maxWidth: '95vw', maxHeight: '90vh' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="border-b bg-gradient-to-r from-blue-50 to-indigo-50 p-4 flex-shrink-0 rounded-t-2xl">
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

            <div className="overflow-y-auto p-4 space-y-4 flex-1">
              {/* Gemini AI Compiled Summary */}
              {aiLoading && (
                <Card className="bg-gradient-to-br from-purple-50 to-blue-50 border-2 border-purple-200">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-center gap-3">
                      <Loader2 className="w-5 h-5 text-purple-600 animate-spin" />
                      <p className="text-sm font-medium text-purple-900">
                        Gemini AI is analyzing {selectedLocation.totalReports} reports for credibility and patterns...
                      </p>
                    </div>
                  </CardContent>
                </Card>
              )}

              {!aiLoading && aiAnalysis && (
                <Card className="bg-gradient-to-br from-purple-50 to-blue-50 border-2 border-purple-300 shadow-lg">
                  <CardHeader className="p-4 pb-3 bg-gradient-to-r from-purple-100 to-blue-100 border-b border-purple-200">
                    <CardTitle className="text-lg flex items-center gap-2 text-purple-900">
                      <Sparkles className="w-5 h-5 text-purple-600" />
                      AI Analysis
                      <Badge className="ml-auto bg-purple-600 text-white text-xs">
                        Credibility: {aiAnalysis.credibilityScore}%
                      </Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-4">
                    {/* Executive Summary */}
                    <div className="bg-white rounded-lg p-4 border border-purple-200">
                      <h4 className="font-semibold text-base text-purple-900 mb-3 flex items-center gap-2">
                        <FileText className="w-5 h-5" />
                        Executive Summary
                      </h4>
                      <p className="text-sm text-gray-800 leading-relaxed">
                        {aiAnalysis.compiledSummary}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Summary Cards - Report Categories */}
              <div>
                <h3 className="text-base font-semibold mb-3 flex items-center gap-2">
                  <Target className="w-4 h-4 text-gray-600" />
                  Report Summary by Category
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
                  {(() => {
                    const categoryCounts = {};
                    selectedLocation.reports.forEach(report => {
                      const category = report.category || 'general';
                      categoryCounts[category] = (categoryCounts[category] || 0) + 1;
                    });

                    return Object.entries(categoryCounts).map(([category, count]) => (
                      <Card key={category} className="bg-gray-100 border-gray-300">
                        <CardContent className="p-3">
                          <div className="text-center">
                            <div className="text-2xl font-bold text-gray-900 mb-1">{count}</div>
                            <div className="text-xs text-gray-600 capitalize">
                              {category.replace(/_/g, ' ')}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ));
                  })()}
                </div>
              </div>

              {/* All Reports List */}
              <div>
                <h3 className="text-base font-semibold mb-2 flex items-center gap-2">
                  <Users className="w-4 h-4 text-gray-600" />
                  All Reports ({selectedLocation.reports.length})
                  {credibilityLoading && (
                    <span className="text-xs text-purple-600 flex items-center gap-1">
                      <Loader2 className="w-3 h-3 animate-spin" />
                      Analyzing credibility...
                    </span>
                  )}
                </h3>
                {/* Scrollable Reports Container */}
                <div className="max-h-[300px] overflow-y-auto border border-gray-200 rounded-lg p-3 bg-gray-50 space-y-2">
                  {selectedLocation.reports.map((report, idx) => {
                    const credibility = reportCredibility[report.id];
                    const isExpanded = expandedReports[report.id];

                    return (
                      <Card key={idx} className="hover:shadow-md transition-shadow bg-white">
                        <CardContent className="p-3">
                          <div className="flex items-start justify-between mb-2">
                            <span className="text-xs text-gray-600 font-medium">
                              {report.category?.replace(/_/g, ' ') || 'General'}
                            </span>
                            <Badge
                              className="text-xs"
                              style={{
                                backgroundColor: report.status === 'verified' ? '#16a34a' : '#eab308',
                                color: 'white'
                              }}
                            >
                              {report.status === 'verified' ? '✓ Verified' : report.status === 'investigating' ? '🔍 Investigating' : report.status}
                            </Badge>
                          </div>
                          <p className="text-sm text-gray-800 mb-2">
                            {isExpanded ? report.description : (report.description?.length > 100 ? report.description.substring(0, 100) + '...' : report.description)}
                          </p>

                          {/* AI Credibility Badge */}
                          {credibility && (
                            <div className="mt-2 mb-2">
                              <div className="flex items-center gap-2 flex-wrap">
                                <Badge
                                  className="text-xs flex items-center gap-1"
                                  style={{
                                    backgroundColor:
                                      credibility.category === 'SPAM' || credibility.category === 'LIKELY_SPAM' ? '#dc2626' :
                                      credibility.category === 'SUSPICIOUS' ? '#f97316' :
                                      credibility.category === 'LIKELY_CREDIBLE' ? '#ca8a04' :
                                      '#16a34a',
                                    color: 'white'
                                  }}
                                >
                                  <Shield className="w-3 h-3" />
                                  {credibility.category === 'SPAM' && '🚫 SPAM'}
                                  {credibility.category === 'LIKELY_SPAM' && '⚠️ Likely Spam'}
                                  {credibility.category === 'SUSPICIOUS' && '❓ Suspicious'}
                                  {credibility.category === 'LIKELY_CREDIBLE' && '✓ Likely Credible'}
                                  {credibility.category === 'CREDIBLE' && '✓ Credible'}
                                </Badge>
                                <span className="text-xs text-gray-600">
                                  {credibility.credibilityScore}% credible
                                </span>
                              </div>
                              <p className="text-xs text-gray-600 mt-1 italic">
                                {credibility.spamReason}
                              </p>
                            </div>
                          )}

                          <div className="flex items-center justify-between text-xs text-gray-500">
                            <span>{report.userName || 'Anonymous'}</span>
                            <span>{formatTimestamp(report.createdAt?.seconds ? report.createdAt.seconds * 1000 : null)}</span>
                          </div>
                          
                          {/* Images Section */}
                          {report.images && report.images.length > 0 && (
                            <div className="mt-2">
                              {isExpanded ? (
                                <div className="flex flex-wrap gap-1.5">
                                  {report.images.map((image, imgIdx) => (
                                    <img
                                      key={imgIdx}
                                      src={typeof image === 'string' ? image : image.url}
                                      alt={`Report image ${imgIdx + 1}`}
                                      className="w-16 h-16 object-cover rounded border border-gray-300 cursor-pointer hover:opacity-80 transition-opacity"
                                    />
                                  ))}
                                </div>
                              ) : (
                                <div className="text-xs text-gray-500">
                                  📷 {report.images.length} image(s) attached
                                </div>
                              )}
                            </div>
                          )}

                          {/* View Full Report Button */}
                          <div className="mt-2 pt-2 border-t border-gray-200">
                            <Button
                              onClick={() => toggleReportExpansion(report.id)}
                              variant="ghost"
                              size="sm"
                              className="w-full text-blue-600 hover:text-blue-700 hover:bg-blue-50 text-xs h-7 gap-1"
                            >
                              <Eye className="w-3 h-3" />
                              {isExpanded ? 'Show Less' : 'View Full Report'}
                              {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </div>

            </div>

            {/* Modal Footer with Action Buttons */}
            <div className="border-t p-3 bg-gray-50 flex-shrink-0">
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

      {/* Enhanced Suspension Modal */}
      {showSuspensionModal && selectedLocation && (
        <div
          className="fixed inset-0 bg-black/60 flex items-center justify-center z-[60] p-4 overflow-y-auto"
          onClick={() => setShowSuspensionModal(false)}
        >
          <Card className="max-w-3xl w-full my-8" onClick={(e) => e.stopPropagation()}>
            <CardHeader className="bg-red-50 border-b border-red-200">
              <CardTitle className="text-xl text-red-900 flex items-center gap-2">
                <AlertTriangle className="w-6 h-6" />
                Issue Class Suspension - {selectedLocation.city}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              {/* Weather & AI Summary */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h3 className="font-semibold text-blue-900 mb-3 flex items-center gap-2">
                  <Sparkles className="w-5 h-5" />
                  AI Analysis Summary
                </h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-blue-700 font-medium">AI Confidence:</span>
                    <div className="text-blue-900 font-bold text-lg">{selectedLocation.aiConfidence}%</div>
                    <Badge className={
                      selectedLocation.aiConfidence >= 85 ? 'bg-green-100 text-green-800' :
                      selectedLocation.aiConfidence >= 70 ? 'bg-yellow-100 text-yellow-800' :
                      'bg-orange-100 text-orange-800'
                    }>
                      {selectedLocation.credibilityStatus?.label || 'Needs Review'}
                    </Badge>
                  </div>
                  <div>
                    <span className="text-blue-700 font-medium">Community Reports:</span>
                    <div className="text-blue-900 font-bold text-lg">
                      {selectedLocation.totalReports} total
                    </div>
                    <div className="text-sm text-blue-700">
                      {selectedLocation.criticalReports} critical, {selectedLocation.verifiedReports} verified
                    </div>
                  </div>
                </div>

                {selectedLocation.weatherData && (
                  <div className="mt-3 pt-3 border-t border-blue-200">
                    <span className="text-blue-700 font-medium text-sm">Weather Conditions:</span>
                    <div className="flex gap-4 mt-1 text-sm text-blue-900">
                      {selectedLocation.weatherData.rainfall > 0 && (
                        <span>🌧️ Rainfall: <strong>{selectedLocation.weatherData.rainfall}mm/h</strong></span>
                      )}
                      {selectedLocation.weatherData.windSpeed > 0 && (
                        <span>💨 Wind: <strong>{selectedLocation.weatherData.windSpeed}km/h</strong></span>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Suspension Levels */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-3">
                  Select Suspension Levels: *
                </label>
                <div className="space-y-2">
                  {SUSPENSION_LEVELS.slice(0, 3).map((level) => (
                    <label
                      key={level.id}
                      className="flex items-center space-x-3 p-3 border rounded-lg cursor-pointer hover:bg-gray-50 transition"
                    >
                      <input
                        type="checkbox"
                        checked={selectedLevels.includes(level.id)}
                        onChange={() => {
                          setSelectedLevels(prev =>
                            prev.includes(level.id)
                              ? prev.filter(l => l !== level.id)
                              : [...prev, level.id]
                          );
                        }}
                        className="w-4 h-4 text-red-600 rounded focus:ring-red-500"
                      />
                      <span className="text-2xl">{level.icon}</span>
                      <div className="flex-1">
                        <p className="font-medium text-sm">{level.label}</p>
                        <p className="text-xs text-gray-500">{level.description}</p>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              {/* Duration */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Duration: *
                </label>
                <select
                  value={durationHours}
                  onChange={(e) => setDurationHours(parseInt(e.target.value))}
                  className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-red-500"
                >
                  <option value={2}>2 hours</option>
                  <option value={6}>6 hours</option>
                  <option value={12}>12 hours (Half day)</option>
                  <option value={24}>24 hours (Full day)</option>
                  <option value={48}>48 hours (2 days)</option>
                </select>
                <p className="text-xs text-gray-500 mt-1">
                  Suspension ends: {new Date(Date.now() + durationHours * 60 * 60 * 1000).toLocaleString()}
                </p>
              </div>

              {/* Custom Message */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Public Announcement Message: *
                </label>
                <textarea
                  className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-red-500"
                  rows="4"
                  value={suspensionMessage}
                  onChange={(e) => setSuspensionMessage(e.target.value)}
                  placeholder={`Class suspension announced for ${selectedLocation.city} due to severe weather conditions. ${selectedLocation.criticalReports} critical reports confirmed. Stay safe and remain indoors.`}
                />
                <p className="text-xs text-gray-500 mt-1">
                  This message will be displayed to the public via the suspension banner.
                </p>
              </div>

              {/* Preview */}
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <h3 className="font-semibold text-red-900 mb-2">📢 Preview</h3>
                <p className="text-sm text-red-800">
                  {suspensionMessage || `Class suspension announced for ${selectedLocation.city} due to severe weather conditions. ${selectedLocation.criticalReports} critical reports confirmed. Stay safe and remain indoors.`}
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-2">
                <Button
                  className="flex-1 bg-red-600 hover:bg-red-700 text-white py-3 font-semibold"
                  onClick={async () => {
                    if (selectedLevels.length === 0) {
                      alert('Please select at least one suspension level');
                      return;
                    }

                    setIssuing(true);
                    try {
                      // Get weather assessment
                      const weatherAssessment = await getWeatherAssessmentForSuspension(selectedLocation.city);

                      const now = new Date();
                      const effectiveUntil = new Date(now.getTime() + durationHours * 60 * 60 * 1000);

                      const newSuspension = {
                        city: selectedLocation.city,
                        province: 'Batangas',
                        status: 'active',
                        levels: selectedLevels,

                        issuedBy: {
                          name: 'Governor/Mayor', // TODO: Get from auth
                          title: 'Provincial Governor',
                          office: 'Office of the Governor',
                          role: 'governor'
                        },

                        criteria: {
                          pagasaWarning: weatherAssessment?.pagasaWarning?.id || null,
                          tcws: weatherAssessment?.tcws?.level || null,
                          rainfall: selectedLocation.weatherData?.rainfall || 0,
                          windSpeed: selectedLocation.weatherData?.windSpeed || 0,
                          temperature: selectedLocation.weatherData?.temperature || null,
                          humidity: selectedLocation.weatherData?.humidity || null,
                          conditions: selectedLocation.weatherData?.conditions || 'Severe weather'
                        },

                        aiAnalysis: {
                          recommendation: 'suspend',
                          confidence: selectedLocation.aiConfidence || 0,
                          reportCount: selectedLocation.totalReports || 0,
                          criticalReports: selectedLocation.criticalReports || 0,
                          summary: `AI-assessed based on ${selectedLocation.totalReports} community reports`,
                          justification: suspensionMessage || `Severe weather conditions in ${selectedLocation.city}`,
                          riskLevel: selectedLocation.aiConfidence >= 85 ? 'critical' : 'high'
                        },

                        issuedAt: now,
                        effectiveFrom: now,
                        effectiveUntil,
                        durationHours,

                        message: suspensionMessage || `Class suspension announced for ${selectedLocation.city} due to severe weather conditions. ${selectedLocation.criticalReports} critical reports confirmed. Stay safe and remain indoors.`,
                        reason: `${selectedLocation.criticalReports} critical reports and severe weather conditions`,

                        isAutoSuspended: false,
                        isOverridden: false,

                        notificationSent: true,
                        notificationChannels: ['in_app']
                      };

                      await issueSuspension(newSuspension);

                      alert(`✅ Class suspension successfully issued for ${selectedLocation.city}`);
                      setShowSuspensionModal(false);
                      setShowCompiledModal(false);
                      setSelectedLevels(['k12']);
                      setSuspensionMessage('');
                    } catch (error) {
                      console.error('Failed to issue suspension:', error);
                      alert(`❌ Failed to issue suspension: ${error.message}`);
                    } finally {
                      setIssuing(false);
                    }
                  }}
                  disabled={issuing || selectedLevels.length === 0}
                >
                  {issuing ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Issuing...
                    </>
                  ) : (
                    <>
                      <AlertTriangle className="w-4 h-4 mr-2" />
                      Confirm & Issue Suspension
                    </>
                  )}
                </Button>
                <Button
                  variant="outline"
                  className="flex-1 py-3"
                  onClick={() => {
                    setShowSuspensionModal(false);
                    setSelectedLevels(['k12']);
                    setSuspensionMessage('');
                  }}
                  disabled={issuing}
                >
                  Cancel
                </Button>
              </div>

              {selectedLevels.length === 0 && (
                <p className="text-sm text-red-600 text-center">
                  ⚠️ Please select at least one suspension level to continue
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
