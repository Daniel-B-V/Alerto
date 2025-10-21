import { useState, useEffect } from 'react';
import {
  AlertTriangle,
  TrendingUp,
  MapPin,
  Users,
  AlertCircle,
  CheckCircle,
  Info,
  RefreshCw,
  Brain
} from 'lucide-react';
import { analyzeClassSuspensionReports } from '../services/geminiService';

/**
 * AI Reports Analyzer Component
 * Analyzes community reports using Gemini AI for class suspension decisions
 */
const AIReportsAnalyzer = ({ reports = [] }) => {
  const [analysis, setAnalysis] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);

  useEffect(() => {
    if (reports.length > 0) {
      analyzeReportsData();
    }
  }, [reports.length]);

  const analyzeReportsData = async () => {
    if (reports.length === 0) {
      setError('No reports available for analysis');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const result = await analyzeClassSuspensionReports(reports);

      if (result.success) {
        setAnalysis(result.analysis);
        setLastUpdated(new Date());
      } else {
        setError(result.error || 'Analysis failed');
      }
    } catch (err) {
      setError(err.message || 'Failed to analyze reports');
      console.error('AI analysis error:', err);
    } finally {
      setLoading(false);
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'Critical':
        return {
          bg: 'bg-red-500',
          text: 'text-red-600',
          border: 'border-red-500',
          lightBg: 'bg-red-50'
        };
      case 'Medium':
        return {
          bg: 'bg-orange-500',
          text: 'text-orange-600',
          border: 'border-orange-500',
          lightBg: 'bg-orange-50'
        };
      case 'Low':
        return {
          bg: 'bg-green-500',
          text: 'text-green-600',
          border: 'border-green-500',
          lightBg: 'bg-green-50'
        };
      default:
        return {
          bg: 'bg-gray-500',
          text: 'text-gray-600',
          border: 'border-gray-500',
          lightBg: 'bg-gray-50'
        };
    }
  };

  if (reports.length === 0) {
    return (
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
        <div className="flex items-center gap-3 mb-4">
          <Brain className="w-6 h-6 text-blue-600" />
          <h3 className="text-lg font-semibold text-gray-900">AI Reports Analysis</h3>
        </div>
        <div className="text-center py-8">
          <Info className="w-12 h-12 text-gray-400 mx-auto mb-3" />
          <p className="text-gray-500">No community reports available for analysis</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <Brain className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">AI-Powered Reports Analysis</h3>
              <p className="text-sm text-gray-500">
                {analysis && `Last updated: ${lastUpdated?.toLocaleTimeString()}`}
              </p>
            </div>
          </div>

          <button
            onClick={analyzeReportsData}
            disabled={loading}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            {loading ? 'Analyzing...' : 'Refresh Analysis'}
          </button>
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
      </div>

      {loading ? (
        <div className="bg-white rounded-xl p-12 shadow-sm border border-gray-200">
          <div className="flex flex-col items-center justify-center">
            <div className="w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mb-4"></div>
            <p className="text-gray-600 font-medium">Analyzing {reports.length} community reports...</p>
            <p className="text-sm text-gray-500 mt-2">Using AI to classify severity and identify patterns</p>
          </div>
        </div>
      ) : analysis ? (
        <>
          {/* Priority Summary Card */}
          <div className={`rounded-xl p-6 shadow-sm border-2 ${getPriorityColor(analysis.priority).border} ${getPriorityColor(analysis.priority).lightBg}`}>
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className={`w-12 h-12 ${getPriorityColor(analysis.priority).bg} rounded-xl flex items-center justify-center`}>
                  <AlertTriangle className="w-7 h-7 text-white" />
                </div>
                <div>
                  <h4 className="text-2xl font-bold text-gray-900">
                    {analysis.priority} Priority
                  </h4>
                  <p className="text-sm text-gray-600 mt-1">{analysis.summary}</p>
                </div>
              </div>

              {analysis.suspensionAdvised && (
                <span className="px-4 py-2 bg-red-600 text-white rounded-lg font-semibold text-sm">
                  SUSPENSION ADVISED
                </span>
              )}
            </div>

            <div className="bg-white/50 rounded-lg p-4 mt-4">
              <p className="text-gray-700 leading-relaxed">{analysis.recommendation}</p>
            </div>
          </div>

          {/* Statistics Grid */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Total Reports</p>
                  <p className="text-3xl font-bold text-gray-900">{analysis.totalReports}</p>
                </div>
                <Users className="w-8 h-8 text-blue-500" />
              </div>
            </div>

            <div className="bg-white rounded-xl p-5 shadow-sm border border-red-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Critical Alerts</p>
                  <p className="text-3xl font-bold text-red-600">{analysis.criticalCount}</p>
                </div>
                <AlertTriangle className="w-8 h-8 text-red-500" />
              </div>
            </div>

            <div className="bg-white rounded-xl p-5 shadow-sm border border-orange-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Medium Alerts</p>
                  <p className="text-3xl font-bold text-orange-600">{analysis.mediumCount}</p>
                </div>
                <Info className="w-8 h-8 text-orange-500" />
              </div>
            </div>

            <div className="bg-white rounded-xl p-5 shadow-sm border border-green-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Low Priority</p>
                  <p className="text-3xl font-bold text-green-600">{analysis.lowCount}</p>
                </div>
                <CheckCircle className="w-8 h-8 text-green-500" />
              </div>
            </div>
          </div>

          {/* Affected Areas */}
          {analysis.affectedAreas && analysis.affectedAreas.length > 0 && (
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
              <div className="flex items-center gap-2 mb-4">
                <MapPin className="w-5 h-5 text-blue-600" />
                <h4 className="text-lg font-semibold text-gray-900">Affected Areas</h4>
              </div>
              <div className="flex flex-wrap gap-2">
                {analysis.affectedAreas.map((area, index) => (
                  <span
                    key={index}
                    className="px-3 py-1.5 bg-blue-100 text-blue-700 rounded-lg text-sm font-medium"
                  >
                    {area}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Main Threats */}
          {analysis.mainThreats && analysis.mainThreats.length > 0 && (
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
              <div className="flex items-center gap-2 mb-4">
                <TrendingUp className="w-5 h-5 text-orange-600" />
                <h4 className="text-lg font-semibold text-gray-900">Identified Threats</h4>
              </div>
              <div className="flex flex-wrap gap-2">
                {analysis.mainThreats.map((threat, index) => (
                  <span
                    key={index}
                    className="px-3 py-1.5 bg-orange-100 text-orange-700 rounded-lg text-sm font-medium capitalize"
                  >
                    {threat}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Reports by Location */}
          {analysis.reportsByLocation && Object.keys(analysis.reportsByLocation).length > 0 && (
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
              <h4 className="text-lg font-semibold text-gray-900 mb-4">Reports by Location</h4>
              <div className="space-y-3">
                {Object.entries(analysis.reportsByLocation).map(([city, data]) => (
                  <div key={city} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <h5 className="font-semibold text-gray-900">{city}</h5>
                      <span className="text-sm text-gray-500">
                        {data.critical + data.medium + data.low} reports
                      </span>
                    </div>

                    <div className="grid grid-cols-3 gap-3">
                      <div className="bg-red-50 rounded-lg p-3 text-center">
                        <p className="text-2xl font-bold text-red-600">{data.critical}</p>
                        <p className="text-xs text-red-600 mt-1">Critical</p>
                      </div>
                      <div className="bg-orange-50 rounded-lg p-3 text-center">
                        <p className="text-2xl font-bold text-orange-600">{data.medium}</p>
                        <p className="text-xs text-orange-600 mt-1">Medium</p>
                      </div>
                      <div className="bg-green-50 rounded-lg p-3 text-center">
                        <p className="text-2xl font-bold text-green-600">{data.low}</p>
                        <p className="text-xs text-green-600 mt-1">Low</p>
                      </div>
                    </div>

                    {data.mainIssues && data.mainIssues.length > 0 && (
                      <div className="mt-3 pt-3 border-t border-gray-200">
                        <p className="text-xs text-gray-600 mb-2">Main Issues:</p>
                        <div className="flex flex-wrap gap-1.5">
                          {data.mainIssues.map((issue, idx) => (
                            <span
                              key={idx}
                              className="px-2 py-0.5 bg-gray-100 text-gray-700 rounded text-xs"
                            >
                              {issue}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      ) : null}
    </div>
  );
};

export default AIReportsAnalyzer;
