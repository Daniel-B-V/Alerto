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
import { useAuth } from "../../contexts/AuthContext";
import { getUserCity } from "../../utils/permissions";

export function MayorReportsPage() {
  const { user } = useAuth();
  const userCity = getUserCity(user);

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

  // Load reports from Firebase (filtered by mayor's city)
  useEffect(() => {
    if (!userCity) {
      setLoading(false);
      return;
    }

    const unsubscribe = subscribeToReports((reportsData) => {
      // Filter reports to only show mayor's assigned city
      const cityReports = reportsData.filter(
        report => report.location?.city === userCity || report.city === userCity
      );
      setReports(cityReports);
      compileReportsByLocation(cityReports);
      setLoading(false);
    }, { city: userCity, limit: 200 });

    return () => {
      if (unsubscribe && typeof unsubscribe === 'function') {
        unsubscribe();
      }
    };
  }, [userCity]);

  // Compile reports by barangay (within mayor's city)
  const compileReportsByLocation = async (reportsData) => {
    const locationGroups = {};

    // Group reports by barangay
    reportsData.forEach(report => {
      const barangay = report.location?.barangay || 'Unknown';
      if (!locationGroups[barangay]) {
        locationGroups[barangay] = {
          barangay,
          city: userCity, // Keep city reference
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

      locationGroups[barangay].reports.push(report);
      locationGroups[barangay].totalReports++;

      // Count by severity
      if (report.severity === 'critical') locationGroups[barangay].criticalReports++;
      if (report.severity === 'high') locationGroups[barangay].highReports++;
      if (report.severity === 'medium') locationGroups[barangay].mediumReports++;

      // Count by status (all reports are verified, tracking investigating separately)
      if (report.status === 'verified') locationGroups[barangay].verifiedReports++;
      if (report.status === 'investigating') locationGroups[barangay].investigatingReports++;

      // Track latest report time
      const reportTime = report.createdAt?.seconds ? report.createdAt.seconds * 1000 : Date.now();
      if (!locationGroups[barangay].lastReportTime || reportTime > locationGroups[barangay].lastReportTime) {
        locationGroups[barangay].lastReportTime = reportTime;
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
      case 'barangay-asc':
        filtered.sort((a, b) => a.barangay.localeCompare(b.barangay));
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
    totalBarangays: compiledReports.length,
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
    const headers = ['Barangay', 'City', 'Total Reports', 'Attention Level', 'Verified', 'Investigating', 'AI Confidence', 'Status', 'Last Report'];
    const rows = compiledReports.map(loc => {
      const attentionLevel = getAttentionLevel(loc);
      return [
      loc.barangay,
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
    a.download = `barangay-reports-${userCity}-${new Date().toISOString().split('T')[0]}.csv`;
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

  // Handle issue suspension (mayors request city-wide suspension from governor)
  const handleIssueSuspension = () => {
    setShowSuspensionModal(true);
  };

  if (!userCity) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <AlertTriangle className="w-12 h-12 text-orange-500 mx-auto mb-4" />
          <p className="text-gray-600">No city assigned to your account. Please contact the administrator.</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <RefreshCw className="w-12 h-12 text-blue-500 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading barangay reports for {userCity}...</p>
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
            Compiled Reports by Barangay
          </h1>
          <p className="text-gray-600">
            AI-powered report compilation grouped by barangay in {userCity}
          </p>
          <p className="text-sm text-gray-500 mt-1">
            {compiledReports.length} barangays • {reports.length} total reports • Last updated: {new Date().toLocaleTimeString()}
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
                <div className="text-4xl font-bold text-gray-900">{stats.totalBarangays}</div>
                <div className="text-sm text-purple-600 mt-2">Barangays</div>
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

      {/* Top 3 Barangays */}
      {compiledReports.length > 0 && (
        <Card className="bg-gradient-to-br from-indigo-50 to-purple-50 border-indigo-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-indigo-900">
              <TrendingUp className="w-5 h-5" />
              Top 3 Barangays with Most Reports
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {compiledReports.slice(0, 3).map((barangay, index) => {
                const attentionLevel = getAttentionLevel(barangay);
                return (
                <div key={index} className="bg-white/70 backdrop-blur-sm rounded-xl p-4 border border-indigo-200">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-3xl font-bold text-indigo-600">#{index + 1}</span>
                    <Badge className={barangay.credibilityStatus.color + ' text-white'}>
                      {barangay.aiConfidence}% confident
                    </Badge>
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-1">{barangay.barangay}</h3>
                  <p className="text-2xl font-bold text-indigo-600 mb-2">{barangay.totalReports} reports</p>
                  <div className="text-sm text-gray-600 space-y-1">
                    <Badge
                      className="text-white text-xs"
                      style={{ backgroundColor: attentionLevel.bgColor }}
                    >
                      {attentionLevel.level}
                    </Badge>
                    <div>✓ {barangay.verifiedReports} Verified{barangay.investigatingReports > 0 ? ` / ${barangay.investigatingReports} Under Investigation` : ''}</div>
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
                <SelectItem value="barangay-asc">Barangay (A-Z)</SelectItem>
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
          <CardTitle>Compiled Reports by Barangay ({filteredCompiledReports.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {filteredCompiledReports.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">No reports found in {userCity}</p>
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
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Barangay</th>
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
                            <span className="font-semibold text-gray-900">{location.barangay}</span>
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
                    {selectedLocation.barangay}, {selectedLocation.city} - Compiled Report
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
                      Gemini AI Compiled Analysis
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
                <div className="flex-1 bg-blue-50 border border-blue-200 rounded px-3 py-2">
                  <p className="text-xs text-blue-800">
                    💡 <strong>Mayor Note:</strong> To request a city-wide class suspension based on these reports, go to the Suspension section in the sidebar.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
