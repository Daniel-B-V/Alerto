import { useState, useEffect } from "react";
import {
  Plus,
  Search,
  Filter,
  AlertCircle,
  Clock,
  CheckCircle,
  XCircle,
  FileText,
  MapPin,
  Calendar,
  Trash2
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { useAuth } from "../../contexts/AuthContext";
import { getUserReports, deleteReport } from "../../firebase/firestore";
import { ReportSubmissionModal } from "../community/ReportSubmissionModal";
import { CATEGORY_CONFIG } from "../../constants/categorization";

export function UserReportsPage() {
  const { user } = useAuth();
  const [reports, setReports] = useState([]);
  const [filteredReports, setFilteredReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [reportToDelete, setReportToDelete] = useState(null);

  // Helper function to convert location to string
  const getLocationString = (location) => {
    if (!location) return '';
    if (typeof location === 'string') return location;
    if (typeof location === 'object') {
      return location.province || location.city || location.country || '';
    }
    return String(location);
  };

  // Fetch user's reports
  const fetchReports = async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const userReports = await getUserReports(user.uid);
      setReports(userReports);
      setFilteredReports(userReports);
    } catch (error) {
      console.error('Error fetching reports:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, [user]);

  // Refresh reports after submission
  const handleSubmitSuccess = () => {
    fetchReports(); // Refresh the list
  };

  // Delete report handler
  const handleDeleteClick = (report) => {
    setReportToDelete(report);
    setShowDeleteModal(true);
  };

  const confirmDeleteReport = async () => {
    if (!reportToDelete) return;

    try {
      await deleteReport(reportToDelete.id);
      // Refresh the list after deletion
      fetchReports();
      setShowDeleteModal(false);
      setReportToDelete(null);
    } catch (error) {
      console.error('Error deleting report:', error);
      alert('Failed to delete report. Please try again.');
    }
  };

  const cancelDelete = () => {
    setShowDeleteModal(false);
    setReportToDelete(null);
  };

  // Apply filters
  useEffect(() => {
    let filtered = [...reports];

    // Search filter
    if (searchQuery.trim()) {
      filtered = filtered.filter(report => {
        const locationStr = getLocationString(report.location);
        return (
          report.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          report.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          locationStr.toLowerCase().includes(searchQuery.toLowerCase())
        );
      });
    }

    // Status filter
    if (statusFilter !== "all") {
      filtered = filtered.filter(report => report.status === statusFilter);
    }

    setFilteredReports(filtered);
  }, [searchQuery, statusFilter, reports]);

  const getStatusBadge = (status) => {
    const statusConfig = {
      pending: { color: 'bg-yellow-500', icon: Clock, label: 'Pending' },
      reviewing: { color: 'bg-blue-500', icon: AlertCircle, label: 'Under Review' },
      resolved: { color: 'bg-green-500', icon: CheckCircle, label: 'Resolved' },
      rejected: { color: 'bg-red-500', icon: XCircle, label: 'Rejected' }
    };

    const config = statusConfig[status] || statusConfig.pending;
    const Icon = config.icon;

    return (
      <Badge className={`${config.color} text-white flex items-center gap-1`}>
        <Icon className="w-3 h-3" />
        {config.label}
      </Badge>
    );
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return 'Unknown';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleString();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your reports...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6 flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2 flex items-center gap-3">
              <FileText className="w-8 h-8 text-blue-500" />
              My Reports
            </h1>
            <p className="text-gray-600">
              Submit and track your incident reports
            </p>
          </div>
          {user?.role !== 'mayor' && user?.role !== 'governor' && (
            <Button
              onClick={() => setShowModal(true)}
              className="bg-blue-500 hover:bg-blue-600 text-white flex items-center gap-2"
            >
              <Plus className="w-5 h-5" />
              Submit Report
            </Button>
          )}
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card className="bg-white !border-4 !border-blue-500 shadow-lg shadow-blue-200 hover:shadow-xl hover:shadow-blue-300 hover:scale-105 transition-all duration-300 cursor-pointer">
            <CardContent className="p-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-900">{reports.length}</div>
                <div className="text-sm text-gray-600">Total Reports</div>
                <div className="text-xs text-gray-500">Submitted</div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white !border-4 !border-yellow-500 shadow-lg shadow-yellow-200 hover:shadow-xl hover:shadow-yellow-300 hover:scale-105 transition-all duration-300 cursor-pointer">
            <CardContent className="p-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-900">
                  {reports.filter(r => r.status === 'pending').length}
                </div>
                <div className="text-sm text-gray-600">Pending</div>
                <div className="text-xs text-gray-500">Awaiting Review</div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white !border-4 !border-blue-500 shadow-lg shadow-blue-200 hover:shadow-xl hover:shadow-blue-300 hover:scale-105 transition-all duration-300 cursor-pointer">
            <CardContent className="p-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-900">
                  {reports.filter(r => r.status === 'reviewing' || r.status === 'under_review').length}
                </div>
                <div className="text-sm text-gray-600">Under Review</div>
                <div className="text-xs text-gray-500">Being Verified</div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white !border-4 !border-green-500 shadow-lg shadow-green-200 hover:shadow-xl hover:shadow-green-300 hover:scale-105 transition-all duration-300 cursor-pointer">
            <CardContent className="p-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-900">
                  {reports.filter(r => r.status === 'resolved' || r.status === 'verified').length}
                </div>
                <div className="text-sm text-gray-600">Resolved</div>
                <div className="text-xs text-gray-500">Completed</div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Search, Filter and Reports List */}
        <Card className="mb-6">
          {/* Filter Header */}
          <CardContent className="p-4 border-b border-gray-100">
            {/* Filter Buttons */}
            <div className="flex gap-1.5">
              <button
                onClick={() => setStatusFilter("all")}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                  statusFilter === "all"
                    ? 'bg-gray-100 text-gray-900 border border-gray-300'
                    : 'text-gray-600 border border-transparent hover:bg-gray-50'
                }`}
              >
                All
              </button>
              <button
                onClick={() => setStatusFilter("pending")}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                  statusFilter === "pending"
                    ? 'bg-yellow-50 text-yellow-700 border border-yellow-200'
                    : 'text-gray-600 border border-transparent hover:bg-gray-50'
                }`}
              >
                Pending
              </button>
              <button
                onClick={() => setStatusFilter("resolved")}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                  statusFilter === "resolved"
                    ? 'bg-green-50 text-green-700 border border-green-200'
                    : 'text-gray-600 border border-transparent hover:bg-gray-50'
                }`}
              >
                Resolved
              </button>
            </div>
          </CardContent>

          {/* Reports Content */}
          {filteredReports.length === 0 ? (
            <CardContent className="p-12 text-center">
              <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-700 mb-2">
                {statusFilter !== 'all' ? 'No reports found' : 'No reports yet'}
              </h3>
              <p className="text-gray-500 mb-4">
                {statusFilter !== 'all'
                  ? 'Try adjusting your filter criteria'
                  : 'Submit your first report to get started'}
              </p>
              {statusFilter === 'all' && user?.role !== 'mayor' && user?.role !== 'governor' && (
                <Button onClick={() => setShowModal(true)} className="bg-blue-500 hover:bg-blue-600 text-white">
                  <Plus className="w-4 h-4 mr-2" />
                  Submit Report
                </Button>
              )}
            </CardContent>
          ) : (
            <CardContent className="p-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredReports.map((report) => (
                  <Card key={report.id} className="hover:shadow-lg transition-shadow">
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between mb-2">
                        <CardTitle className="text-lg font-bold text-gray-900">
                          {report.title || report.category}
                        </CardTitle>
                        {getStatusBadge(report.status)}
                      </div>
                      <div className="flex items-center gap-4 text-xs text-gray-500">
                        <div className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {formatDate(report.createdAt)}
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-3 relative pb-12">
                      {report.location && (
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <MapPin className="w-4 h-4 text-gray-400" />
                          {getLocationString(report.location)}
                        </div>
                      )}

                      {/* Display categories */}
                      {report.categories && report.categories.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {report.categories.map((cat, idx) => {
                            const categoryLabel = CATEGORY_CONFIG[cat]?.label || cat;
                            return (
                              <Badge key={idx} className="bg-blue-100 text-blue-700 text-xs">
                                {categoryLabel}
                              </Badge>
                            );
                          })}
                        </div>
                      )}

                      <p className="text-sm text-gray-700 line-clamp-3">
                        {report.description}
                      </p>

                      {/* Delete Button - Bottom Right */}
                      <button
                        onClick={() => handleDeleteClick(report)}
                        className="absolute bottom-4 right-3 p-2 rounded-full hover:bg-red-50 text-gray-400 hover:text-red-600 transition-colors group"
                        title="Delete report"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          )}
        </Card>

        {/* Results Count */}
        {filteredReports.length > 0 && (
          <div className="mt-6 text-center text-sm text-gray-600">
            Showing {filteredReports.length} of {reports.length} reports
          </div>
        )}
      </div>

      {/* Submit Report Modal - Using Shared Component */}
      <ReportSubmissionModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        onSubmitSuccess={handleSubmitSuccess}
      />

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 bg-red-100 rounded-full flex-shrink-0">
                <Trash2 className="w-6 h-6 text-red-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900">Delete Report</h3>
            </div>

            <p className="text-gray-600 mb-2">
              Are you sure you want to delete this report?
            </p>

            {reportToDelete && (
              <div className="bg-gray-50 rounded-lg p-3 mb-4">
                <p className="font-semibold text-gray-900 break-words">
                  {reportToDelete.title || reportToDelete.category}
                </p>
                <p className="text-sm text-gray-600 mt-1 line-clamp-2 break-words">
                  {reportToDelete.description}
                </p>
              </div>
            )}

            <p className="text-sm text-red-600 font-medium mb-6">
              This action cannot be undone.
            </p>

            <div style={{ display: 'flex', gap: '12px', width: '100%' }}>
              <button
                onClick={cancelDelete}
                style={{
                  flex: 1,
                  padding: '10px 16px',
                  backgroundColor: '#f3f4f6',
                  color: '#374151',
                  fontWeight: '500',
                  borderRadius: '6px',
                  border: 'none',
                  cursor: 'pointer',
                  transition: 'background-color 0.2s'
                }}
                onMouseOver={(e) => e.target.style.backgroundColor = '#e5e7eb'}
                onMouseOut={(e) => e.target.style.backgroundColor = '#f3f4f6'}
              >
                Cancel
              </button>
              <button
                onClick={confirmDeleteReport}
                style={{
                  flex: 1,
                  padding: '10px 16px',
                  backgroundColor: '#dc2626',
                  color: 'white',
                  fontWeight: '500',
                  borderRadius: '6px',
                  border: 'none',
                  cursor: 'pointer',
                  transition: 'background-color 0.2s'
                }}
                onMouseOver={(e) => e.target.style.backgroundColor = '#b91c1c'}
                onMouseOut={(e) => e.target.style.backgroundColor = '#dc2626'}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
