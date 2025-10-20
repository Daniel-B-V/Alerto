import { useState, useEffect } from "react";
import {
  AlertTriangle,
  CheckCircle,
  Eye,
  MessageSquare,
  Image as ImageIcon,
  MapPin,
  Clock,
  TrendingUp,
  FileText,
  RefreshCw,
  Flag
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { compileReports, groupReportsByLocationAndTime, getSeverityColor } from "../services/geminiService";
import { collection, query, where, orderBy, getDocs, limit } from "firebase/firestore";
import { db } from "../firebase/config";

export function LGUReportsPanel() {
  const [compiledReports, setCompiledReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [compiling, setCompiling] = useState(false);
  const [selectedReport, setSelectedReport] = useState(null);
  const [lastUpdate, setLastUpdate] = useState(null);

  // Fetch community reports from Firebase and compile them
  const fetchAndCompileReports = async () => {
    setCompiling(true);
    try {
      // Fetch recent reports from Firebase (last 24 hours)
      const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
      const reportsQuery = query(
        collection(db, 'reports'),
        where('timestamp', '>=', twentyFourHoursAgo),
        orderBy('timestamp', 'desc'),
        limit(100)
      );

      const querySnapshot = await getDocs(reportsQuery);
      const reports = [];

      querySnapshot.forEach((doc) => {
        reports.push({
          id: doc.id,
          ...doc.data()
        });
      });

      if (reports.length === 0) {
        setCompiledReports([]);
        setLastUpdate(new Date());
        return;
      }

      // Group reports by location and time
      const groupedReports = groupReportsByLocationAndTime(reports, 60); // 60 minutes window

      // Compile each group using Gemini AI
      const compiledPromises = groupedReports.map(async (reportGroup) => {
        if (reportGroup.length >= 1) { // Compile if at least 1 report
          try {
            const compiled = await compileReports(reportGroup);
            return compiled;
          } catch (error) {
            console.error('Error compiling report group:', error);
            // Return fallback compiled report
            return {
              id: `fallback_${Date.now()}_${Math.random()}`,
              severity: reportGroup.length > 3 ? 'high' : 'medium',
              confidence: 65,
              summary: `${reportGroup.length} reports from ${reportGroup[0].location}. Manual review recommended.`,
              location: reportGroup[0].location,
              sources: reportGroup.length,
              images: reportGroup[0].images || [],
              timestamp: new Date().toISOString(),
              originalReports: reportGroup.map(r => ({ id: r.id, location: r.location })),
              verified: false,
              keyPoints: ['Multiple reports received', 'AI compilation failed', 'Manual review needed']
            };
          }
        }
        return null;
      });

      const compiled = await Promise.all(compiledPromises);
      const validCompiled = compiled.filter(r => r !== null);

      // Sort by severity (critical > high > medium > low)
      const severityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
      validCompiled.sort((a, b) => severityOrder[a.severity] - severityOrder[b.severity]);

      setCompiledReports(validCompiled);
      setLastUpdate(new Date());

    } catch (error) {
      console.error('Error fetching and compiling reports:', error);
    } finally {
      setCompiling(false);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAndCompileReports();

    // Auto-refresh every 10 minutes
    const interval = setInterval(() => {
      fetchAndCompileReports();
    }, 10 * 60 * 1000);

    return () => clearInterval(interval);
  }, []);

  // Get severity icon and styling
  const getSeverityIcon = (severity) => {
    switch (severity) {
      case 'critical':
        return <AlertTriangle className="w-5 h-5 text-red-500" />;
      case 'high':
        return <AlertTriangle className="w-5 h-5 text-orange-500" />;
      case 'medium':
        return <Flag className="w-5 h-5 text-yellow-500" />;
      case 'low':
        return <CheckCircle className="w-5 h-5 text-blue-500" />;
      default:
        return <Flag className="w-5 h-5 text-gray-500" />;
    }
  };

  // Statistics
  const stats = {
    total: compiledReports.length,
    critical: compiledReports.filter(r => r.severity === 'critical').length,
    high: compiledReports.filter(r => r.severity === 'high').length,
    medium: compiledReports.filter(r => r.severity === 'medium').length,
    totalSources: compiledReports.reduce((sum, r) => sum + r.sources, 0)
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <RefreshCw className="w-12 h-12 text-blue-500 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Compiling reports with AI...</p>
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
            LGU Compiled Reports
          </h1>
          <p className="text-gray-600">
            AI-powered report compilation for quick decision making on class suspensions
          </p>
          {lastUpdate && (
            <p className="text-xs text-gray-500 mt-1">
              Last compiled: {lastUpdate.toLocaleTimeString()} • {stats.totalSources} community reports analyzed
            </p>
          )}
        </div>
        <button
          onClick={fetchAndCompileReports}
          disabled={compiling}
          className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 transition-colors"
        >
          <RefreshCw className={`w-4 h-4 ${compiling ? 'animate-spin' : ''}`} />
          Recompile
        </button>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card className="bg-gradient-to-br from-blue-50/80 to-blue-100/80 backdrop-blur-sm border-blue-200/50">
          <CardContent className="p-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-900">{stats.total}</div>
              <div className="text-sm text-blue-600">Compiled Reports</div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-red-50/80 to-red-100/80 backdrop-blur-sm border-red-200/50">
          <CardContent className="p-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-red-900">{stats.critical}</div>
              <div className="text-sm text-red-600">Critical Alerts</div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-orange-50/80 to-orange-100/80 backdrop-blur-sm border-orange-200/50">
          <CardContent className="p-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-900">{stats.high}</div>
              <div className="text-sm text-orange-600">High Priority</div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-yellow-50/80 to-yellow-100/80 backdrop-blur-sm border-yellow-200/50">
          <CardContent className="p-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-yellow-900">{stats.medium}</div>
              <div className="text-sm text-yellow-600">Medium Priority</div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Compiled Reports List */}
      <div className="space-y-4">
        {compiledReports.length === 0 ? (
          <Card className="bg-white/70 backdrop-blur-sm">
            <CardContent className="p-8 text-center">
              <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">No reports to compile in the last 24 hours</p>
            </CardContent>
          </Card>
        ) : (
          compiledReports.map((report) => {
            const severityColor = getSeverityColor(report.severity);

            return (
              <Card
                key={report.id}
                className="bg-white/70 backdrop-blur-sm border-l-4 hover:shadow-lg transition-all duration-200"
                style={{ borderLeftColor: severityColor.bg.replace('bg-', '#') }}
              >
                <CardContent className="p-6">
                  {/* Header */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      {getSeverityIcon(report.severity)}
                      <div>
                        <Badge
                          variant={report.severity === 'critical' ? 'destructive' : 'default'}
                          className="uppercase text-xs font-semibold"
                        >
                          {report.severity}
                        </Badge>
                        {report.verified && (
                          <Badge variant="secondary" className="ml-2">
                            <CheckCircle className="w-3 h-3 mr-1" />
                            {report.confidence}% confidence
                          </Badge>
                        )}
                      </div>
                    </div>
                    <div className="text-right text-sm text-gray-500">
                      <div className="flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        {new Date(report.timestamp).toLocaleTimeString()}
                      </div>
                    </div>
                  </div>

                  {/* Title */}
                  <h3 className="text-lg font-bold text-gray-900 mb-2">
                    {report.summary.split('.')[0]}
                  </h3>

                  {/* Location and Meta */}
                  <div className="flex items-center gap-4 text-sm text-gray-600 mb-3">
                    <span className="flex items-center gap-1">
                      <MapPin className="w-4 h-4" />
                      {report.location}
                    </span>
                    <span>•</span>
                    <span>{report.sources} sources</span>
                    {report.compressed && (
                      <>
                        <span>•</span>
                        <span className="text-xs">{report.compressed}</span>
                      </>
                    )}
                  </div>

                  {/* Summary */}
                  <p className="text-gray-700 mb-4 leading-relaxed">
                    {report.summary}
                  </p>

                  {/* Key Points */}
                  {report.keyPoints && report.keyPoints.length > 0 && (
                    <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                      <h4 className="text-sm font-semibold text-gray-700 mb-2">Key Points:</h4>
                      <ul className="list-disc list-inside space-y-1 text-sm text-gray-600">
                        {report.keyPoints.map((point, idx) => (
                          <li key={idx}>{point}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Images */}
                  {report.images && report.images.length > 0 && (
                    <div className="mb-4">
                      <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
                        <ImageIcon className="w-4 h-4" />
                        <span>{report.images.length} images attached</span>
                      </div>
                      <div className="grid grid-cols-4 gap-2">
                        {report.images.slice(0, 4).map((img, idx) => (
                          <img
                            key={idx}
                            src={img}
                            alt={`Report image ${idx + 1}`}
                            className="w-full h-24 object-cover rounded-lg"
                          />
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Recommendation */}
                  {report.recommendation && (
                    <div className={`p-3 rounded-lg mb-4 ${
                      report.severity === 'critical' || report.severity === 'high'
                        ? 'bg-red-50 border border-red-200'
                        : 'bg-blue-50 border border-blue-200'
                    }`}>
                      <h4 className="text-sm font-semibold text-gray-700 mb-1">Recommendation:</h4>
                      <p className="text-sm text-gray-700">{report.recommendation}</p>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex gap-2 pt-3 border-t border-gray-200">
                    <button
                      onClick={() => setSelectedReport(report)}
                      className="flex items-center gap-2 px-4 py-2 text-sm bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                    >
                      <Eye className="w-4 h-4" />
                      View Full Report
                    </button>
                    <button className="flex items-center gap-2 px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
                      <MessageSquare className="w-4 h-4" />
                      Contact Reporter
                    </button>
                    <button className="flex items-center gap-2 px-4 py-2 text-sm bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors ml-auto">
                      <Flag className="w-4 h-4" />
                      Issue Suspension
                    </button>
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>

      {/* View Full Report Modal (simplified for now) */}
      {selectedReport && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
          onClick={() => setSelectedReport(null)}
        >
          <Card
            className="max-w-4xl w-full max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <CardHeader>
              <CardTitle>Full Report Details</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <h3 className="font-semibold mb-2">Original Reports ({selectedReport.originalReports.length}):</h3>
                  <ul className="space-y-2">
                    {selectedReport.originalReports.map((orig, idx) => (
                      <li key={idx} className="text-sm p-2 bg-gray-50 rounded">
                        Report ID: {orig.id} - {orig.location}
                      </li>
                    ))}
                  </ul>
                </div>
                <button
                  onClick={() => setSelectedReport(null)}
                  className="w-full py-2 bg-gray-200 hover:bg-gray-300 rounded-lg transition-colors"
                >
                  Close
                </button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
