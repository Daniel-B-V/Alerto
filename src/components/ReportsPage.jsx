import { useState, useEffect } from "react";
import {
  AlertTriangle,
  MapPin,
  Clock,
  Filter,
  Eye,
  Download,
  RefreshCw,
  TrendingUp,
  Users,
  FileText,
  BarChart3
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { subscribeToReports } from "../firebase/firestore";

export function ReportsPage() {
  const [reports, setReports] = useState([]);
  const [filteredReports, setFilteredReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    severity: 'all',
    category: 'all',
    city: 'all',
    status: 'all',
    timeRange: '24h'
  });
  const [selectedReport, setSelectedReport] = useState(null);

  // Load reports from Firebase
  useEffect(() => {
    const unsubscribe = subscribeToReports((reportsData) => {
      setReports(reportsData);
      setLoading(false);
    }, { limit: 100 });

    return () => {
      if (unsubscribe && typeof unsubscribe === 'function') {
        unsubscribe();
      }
    };
  }, []);

  // Apply filters
  useEffect(() => {
    let filtered = [...reports];

    // Filter by severity
    if (filters.severity !== 'all') {
      filtered = filtered.filter(r => r.severity === filters.severity);
    }

    // Filter by category
    if (filters.category !== 'all') {
      filtered = filtered.filter(r => r.category === filters.category);
    }

    // Filter by city
    if (filters.city !== 'all') {
      filtered = filtered.filter(r => r.location?.city === filters.city);
    }

    // Filter by status
    if (filters.status !== 'all') {
      filtered = filtered.filter(r => r.status === filters.status);
    }

    // Filter by time range
    if (filters.timeRange !== 'all') {
      const now = Date.now();
      const timeRanges = {
        '1h': 60 * 60 * 1000,
        '6h': 6 * 60 * 60 * 1000,
        '24h': 24 * 60 * 60 * 1000,
        '7d': 7 * 24 * 60 * 60 * 1000
      };

      const range = timeRanges[filters.timeRange];
      if (range) {
        filtered = filtered.filter(r => {
          const reportTime = r.createdAt?.seconds ? r.createdAt.seconds * 1000 : 0;
          return now - reportTime <= range;
        });
      }
    }

    setFilteredReports(filtered);
  }, [reports, filters]);

  // Calculate statistics
  const stats = {
    total: filteredReports.length,
    critical: filteredReports.filter(r => r.severity === 'critical').length,
    high: filteredReports.filter(r => r.severity === 'high').length,
    medium: filteredReports.filter(r => r.severity === 'medium').length,
    low: filteredReports.filter(r => r.severity === 'low').length,
    pending: filteredReports.filter(r => r.status === 'pending').length,
    verified: filteredReports.filter(r => r.status === 'verified').length,
    uniqueCities: new Set(filteredReports.map(r => r.location?.city).filter(Boolean)).size,
    uniqueReporters: new Set(filteredReports.map(r => r.userId).filter(Boolean)).size
  };

  // Get severity badge style
  const getSeverityStyle = (severity) => {
    const styles = {
      critical: 'bg-red-600 text-white',
      high: 'bg-orange-500 text-white',
      medium: 'bg-yellow-500 text-white',
      low: 'bg-blue-500 text-white'
    };
    return styles[severity] || styles.medium;
  };

  // Format timestamp
  const formatTimestamp = (timestamp) => {
    if (!timestamp) return 'Unknown';
    const date = timestamp.seconds ? new Date(timestamp.seconds * 1000) : new Date(timestamp);
    return date.toLocaleString();
  };

  // Get unique cities for filter
  const uniqueCities = [...new Set(reports.map(r => r.location?.city).filter(Boolean))].sort();

  // Export to CSV
  const exportToCSV = () => {
    const headers = ['Timestamp', 'Category', 'Severity', 'City', 'Barangay', 'Description', 'Status', 'Reporter'];
    const rows = filteredReports.map(r => [
      formatTimestamp(r.createdAt),
      r.category || '',
      r.severity || '',
      r.location?.city || '',
      r.location?.barangay || '',
      r.description?.replace(/,/g, ';') || '',
      r.status || '',
      r.userName || 'Anonymous'
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `weather-reports-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <RefreshCw className="w-12 h-12 text-blue-500 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading reports...</p>
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
            Community Reports Data Collection
          </h1>
          <p className="text-gray-600">
            Centralized real-time weather and disaster reports from community members
          </p>
          <p className="text-sm text-gray-500 mt-1">
            {filteredReports.length} of {reports.length} reports displayed • Last updated: {new Date().toLocaleTimeString()}
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

      {/* Statistics Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-3">
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
          <CardContent className="p-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-900">{stats.total}</div>
              <div className="text-xs text-blue-600 mt-1">Total Reports</div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-red-50 to-red-100 border-red-200">
          <CardContent className="p-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-red-900">{stats.critical}</div>
              <div className="text-xs text-red-600 mt-1">Critical</div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200">
          <CardContent className="p-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-900">{stats.high}</div>
              <div className="text-xs text-orange-600 mt-1">High Priority</div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-yellow-50 to-yellow-100 border-yellow-200">
          <CardContent className="p-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-yellow-900">{stats.medium}</div>
              <div className="text-xs text-yellow-600 mt-1">Medium</div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
          <CardContent className="p-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-900">{stats.verified}</div>
              <div className="text-xs text-green-600 mt-1">Verified</div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
          <CardContent className="p-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-900">{stats.pending}</div>
              <div className="text-xs text-purple-600 mt-1">Pending</div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-indigo-50 to-indigo-100 border-indigo-200">
          <CardContent className="p-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-indigo-900">{stats.uniqueCities}</div>
              <div className="text-xs text-indigo-600 mt-1">Cities</div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-pink-50 to-pink-100 border-pink-200">
          <CardContent className="p-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-pink-900">{stats.uniqueReporters}</div>
              <div className="text-xs text-pink-600 mt-1">Reporters</div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-wrap items-center gap-3">
            <Filter className="w-5 h-5 text-gray-500" />
            <span className="text-sm font-semibold text-gray-700">Filters:</span>

            <Select value={filters.timeRange} onValueChange={(value) => setFilters(prev => ({ ...prev, timeRange: value }))}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1h">Last Hour</SelectItem>
                <SelectItem value="6h">Last 6 Hours</SelectItem>
                <SelectItem value="24h">Last 24 Hours</SelectItem>
                <SelectItem value="7d">Last 7 Days</SelectItem>
                <SelectItem value="all">All Time</SelectItem>
              </SelectContent>
            </Select>

            <Select value={filters.severity} onValueChange={(value) => setFilters(prev => ({ ...prev, severity: value }))}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Severity" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Severity</SelectItem>
                <SelectItem value="critical">🚨 Critical</SelectItem>
                <SelectItem value="high">⚠️ High</SelectItem>
                <SelectItem value="medium">📋 Medium</SelectItem>
                <SelectItem value="low">ℹ️ Low</SelectItem>
              </SelectContent>
            </Select>

            <Select value={filters.status} onValueChange={(value) => setFilters(prev => ({ ...prev, status: value }))}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="verified">Verified</SelectItem>
                <SelectItem value="investigating">Investigating</SelectItem>
                <SelectItem value="resolved">Resolved</SelectItem>
              </SelectContent>
            </Select>

            <Select value={filters.city} onValueChange={(value) => setFilters(prev => ({ ...prev, city: value }))}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="City" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Cities</SelectItem>
                {uniqueCities.map(city => (
                  <SelectItem key={city} value={city}>{city}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            {(filters.severity !== 'all' || filters.status !== 'all' || filters.city !== 'all' || filters.timeRange !== '24h') && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setFilters({ severity: 'all', category: 'all', city: 'all', status: 'all', timeRange: '24h' })}
                className="text-blue-600"
              >
                Clear Filters
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Reports Table */}
      <Card>
        <CardHeader>
          <CardTitle>Reports Data ({filteredReports.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {filteredReports.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">No reports found matching the filters</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b-2 border-gray-200">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Time</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Severity</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Category</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Location</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Description</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Status</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Reporter</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">AI</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredReports.map((report) => (
                    <tr key={report.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3 text-sm text-gray-600 whitespace-nowrap">
                        {formatTimestamp(report.createdAt)}
                      </td>
                      <td className="px-4 py-3">
                        <Badge className={getSeverityStyle(report.severity)}>
                          {report.severity?.toUpperCase() || 'N/A'}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-700">
                        {report.category || 'N/A'}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-700">
                        <div className="flex items-start gap-1">
                          <MapPin className="w-4 h-4 text-gray-400 mt-0.5" />
                          <div>
                            <div className="font-medium">{report.location?.city || 'Unknown'}</div>
                            {report.location?.barangay && (
                              <div className="text-xs text-gray-500">{report.location.barangay}</div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-700 max-w-xs">
                        <div className="line-clamp-2">
                          {report.description || 'No description'}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant={report.status === 'verified' ? 'default' : 'secondary'} className="text-xs">
                          {report.status || 'pending'}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-700">
                        {report.userName || 'Anonymous'}
                      </td>
                      <td className="px-4 py-3 text-sm">
                        {report.aiAnalysis ? (
                          <Badge variant="outline" className="text-xs">
                            {report.aiAnalysis.confidence}%
                          </Badge>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => setSelectedReport(report)}
                          className="text-blue-600 hover:text-blue-700"
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Report Details Modal */}
      {selectedReport && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
          onClick={() => setSelectedReport(null)}
        >
          <Card className="max-w-4xl w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <CardHeader className="border-b">
              <div className="flex items-center justify-between">
                <CardTitle className="text-xl">Report Details</CardTitle>
                <Button variant="ghost" size="sm" onClick={() => setSelectedReport(null)}>
                  ✕
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-semibold text-gray-600">Report ID</label>
                  <p className="text-sm text-gray-900">{selectedReport.id}</p>
                </div>
                <div>
                  <label className="text-sm font-semibold text-gray-600">Timestamp</label>
                  <p className="text-sm text-gray-900">{formatTimestamp(selectedReport.createdAt)}</p>
                </div>
                <div>
                  <label className="text-sm font-semibold text-gray-600">Category</label>
                  <p className="text-sm text-gray-900">{selectedReport.category}</p>
                </div>
                <div>
                  <label className="text-sm font-semibold text-gray-600">Severity</label>
                  <Badge className={getSeverityStyle(selectedReport.severity)}>
                    {selectedReport.severity?.toUpperCase()}
                  </Badge>
                </div>
              </div>

              <div>
                <label className="text-sm font-semibold text-gray-600">Location</label>
                <p className="text-sm text-gray-900">
                  {selectedReport.location?.barangay && `${selectedReport.location.barangay}, `}
                  {selectedReport.location?.city}
                  {selectedReport.location?.specificLocation && ` - ${selectedReport.location.specificLocation}`}
                </p>
              </div>

              <div>
                <label className="text-sm font-semibold text-gray-600">Description</label>
                <p className="text-sm text-gray-900 whitespace-pre-wrap">{selectedReport.description}</p>
              </div>

              {selectedReport.aiAnalysis && (
                <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                  <label className="text-sm font-semibold text-blue-900">AI Analysis</label>
                  <div className="mt-2 space-y-2 text-sm">
                    <p><span className="font-medium">Confidence:</span> {selectedReport.aiAnalysis.confidence}%</p>
                    <p><span className="font-medium">Assessment:</span> {selectedReport.aiAnalysis.assessment}</p>
                    <p><span className="font-medium">Authentic:</span> {selectedReport.aiAnalysis.isAuthentic ? 'Yes' : 'No'}</p>
                  </div>
                </div>
              )}

              {selectedReport.images && selectedReport.images.length > 0 && (
                <div>
                  <label className="text-sm font-semibold text-gray-600 mb-2 block">Images ({selectedReport.images.length})</label>
                  <div className="grid grid-cols-3 gap-2">
                    {selectedReport.images.map((img, idx) => (
                      <img
                        key={idx}
                        src={img}
                        alt={`Report ${idx + 1}`}
                        className="w-full h-32 object-cover rounded-lg cursor-pointer hover:opacity-80 transition-opacity"
                        onClick={() => window.open(img, '_blank')}
                      />
                    ))}
                  </div>
                </div>
              )}

              <div>
                <label className="text-sm font-semibold text-gray-600">Reporter</label>
                <p className="text-sm text-gray-900">{selectedReport.userName || 'Anonymous'}</p>
                {selectedReport.userEmail && (
                  <p className="text-xs text-gray-500">{selectedReport.userEmail}</p>
                )}
              </div>

              <div className="flex gap-2 pt-4 border-t">
                <Button
                  onClick={() => setSelectedReport(null)}
                  className="flex-1"
                  variant="outline"
                >
                  Close
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
