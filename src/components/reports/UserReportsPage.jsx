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
  Calendar
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { useAuth } from "../../contexts/AuthContext";
import { getUserReports } from "../../firebase/firestore";
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
          <Button
            onClick={() => setShowModal(true)}
            className="bg-blue-500 hover:bg-blue-600 text-white flex items-center gap-2"
          >
            <Plus className="w-5 h-5" />
            Submit Report
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-blue-600 mb-1">Total Reports</p>
                  <p className="text-3xl font-bold text-blue-900">{reports.length}</p>
                </div>
                <FileText className="w-10 h-10 text-blue-500 opacity-50" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-yellow-50 to-yellow-100 border-yellow-200">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-yellow-600 mb-1">Pending</p>
                  <p className="text-3xl font-bold text-yellow-900">
                    {reports.filter(r => r.status === 'pending').length}
                  </p>
                </div>
                <Clock className="w-10 h-10 text-yellow-500 opacity-50" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-blue-50 to-indigo-100 border-blue-200">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-blue-600 mb-1">Under Review</p>
                  <p className="text-3xl font-bold text-blue-900">
                    {reports.filter(r => r.status === 'reviewing').length}
                  </p>
                </div>
                <AlertCircle className="w-10 h-10 text-blue-500 opacity-50" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-green-600 mb-1">Resolved</p>
                  <p className="text-3xl font-bold text-green-900">
                    {reports.filter(r => r.status === 'resolved').length}
                  </p>
                </div>
                <CheckCircle className="w-10 h-10 text-green-500 opacity-50" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Search and Filter */}
        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="space-y-3">
              {/* Search Bar */}
              <div className="relative w-full">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  type="text"
                  placeholder="Search reports..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 h-10 text-sm"
                />
              </div>

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
            </div>
          </CardContent>
        </Card>

        {/* Reports List */}
        {filteredReports.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-700 mb-2">
                {searchQuery || statusFilter !== 'all' ? 'No reports found' : 'No reports yet'}
              </h3>
              <p className="text-gray-500 mb-4">
                {searchQuery || statusFilter !== 'all'
                  ? 'Try adjusting your search or filter criteria'
                  : 'Submit your first report to get started'}
              </p>
              {!searchQuery && statusFilter === 'all' && (
                <Button onClick={() => setShowModal(true)} className="bg-blue-500 hover:bg-blue-600 text-white">
                  <Plus className="w-4 h-4 mr-2" />
                  Submit Report
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
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
                <CardContent className="space-y-3">
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
                </CardContent>
              </Card>
            ))}
          </div>
        )}

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
    </>
  );
}
