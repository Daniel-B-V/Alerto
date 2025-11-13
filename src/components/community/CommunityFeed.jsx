import { useState, useEffect } from "react";
import {
  MessageCircle,
  MapPin,
  Clock,
  CheckCircle,
  Filter,
  Plus,
  AlertCircle,
  Image as ImageIcon,
  Send,
  X,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  TrendingUp,
  Users,
  Eye
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { getReports, toggleLike, subscribeToReports, updateReport } from "../../firebase";
import { useAuth } from "../../contexts/AuthContext";
import { ReportSubmissionModal } from "./ReportSubmissionModal";
import { CATEGORY_CONFIG } from "../../constants/categorization";
import { getCredibilityBadge } from "../../services/imageAnalysisService";
import { isGovernor, isMayor, getUserCity, canViewCity } from "../../utils/permissions";

// Convert centralized categories to format needed for this component
const REPORT_CATEGORIES = Object.entries(CATEGORY_CONFIG).map(([value, config]) => ({
  value,
  label: config.label,
  icon: config.emoji
}));

const BATANGAS_CITIES = [
  'Batangas City', 'Lipa City', 'Tanauan City', 'Sto. Tomas',
  'Calamba', 'San Pablo', 'Taal', 'Lemery', 'Balayan',
  'Bauan', 'Mabini', 'San Juan', 'Rosario', 'Taysan',
  'Lobo', 'Mataas na Kahoy', 'Cuenca', 'Alitagtag',
  'Malvar', 'Laurel', 'Agoncillo', 'San Nicolas', 'Santa Teresita',
  'Talisay', 'San Luis', 'Ibaan', 'Padre Garcia', 'Tingloy',
  'Calatagan', 'Lian', 'Nasugbu', 'Other'
];

export function CommunityFeed() {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [commentText, setCommentText] = useState({});
  const [showComments, setShowComments] = useState({});
  const [selectedImage, setSelectedImage] = useState(null);
  const [expandedReports, setExpandedReports] = useState({});
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [displayLimit, setDisplayLimit] = useState(10); // Show 10 reports initially
  const [filters, setFilters] = useState({
    category: 'all',
    location: 'all',
    limit: 20
  });
  const { user, isAuthenticated } = useAuth();

  // Check if user is admin/governor or mayor
  const isAdmin = isGovernor(user);
  const isMayorUser = isMayor(user);
  const userCity = getUserCity(user);

  // Handle verify report
  const handleVerifyReport = async (reportId) => {
    try {
      await updateReport(reportId, { status: 'verified' });
      console.log('Report verified successfully');
    } catch (error) {
      console.error('Error verifying report:', error);
      alert('Failed to verify report');
    }
  };

  // Load reports on component mount with role-based filtering
  useEffect(() => {
    const firebaseFilters = {
      limit: filters.limit || 20
    };

    // Add role-based filtering
    if (isMayorUser && userCity) {
      // Mayors only see reports from their assigned city
      firebaseFilters.city = userCity;
      console.log(`🏛️ Mayor filtering: Only showing reports from ${userCity}`);
    } else if (isAdmin) {
      // Governors see all reports from the province
      firebaseFilters.province = 'Batangas';
      console.log('👑 Governor viewing: All reports from Batangas Province');
    }

    try {
      const unsubscribe = subscribeToReports((reportsData) => {
        console.log(`Role-based reports received: ${reportsData.length} reports`, reportsData);

        // Additional client-side filtering for extra security
        let filteredData = reportsData;
        if (isMayorUser && userCity) {
          // Double-check that mayors only see their city's reports
          filteredData = reportsData.filter(report =>
            report.location?.city === userCity || report.city === userCity
          );
          console.log(`🔒 Client-side filter: ${filteredData.length} reports from ${userCity}`);
        }

        // Sort by timestamp client-side
        const sorted = filteredData.sort((a, b) => {
          const aTime = a.createdAt?.seconds || 0;
          const bTime = b.createdAt?.seconds || 0;
          return bTime - aTime;
        });
        setReports(sorted);
        setLoading(false);
      }, firebaseFilters);

      return () => {
        if (unsubscribe && typeof unsubscribe === 'function') {
          unsubscribe();
        }
      };
    } catch (err) {
      console.error('Error subscribing to reports:', err);
      setError('Failed to load reports. Please refresh the page.');
      setLoading(false);
    }
  }, [filters.limit, userCity, isMayorUser, isAdmin]); // Re-subscribe if role changes

  // Filter reports based on selected filters
  const filteredReports = reports.filter(report => {
    // Filter by category
    if (filters.category !== 'all' && report.category !== filters.category) {
      return false;
    }

    // Filter by location
    if (filters.location !== 'all' && report.location?.city !== filters.location) {
      return false;
    }

    return true;
  });

  // Handle like/unlike
  const handleLike = async (reportId) => {
    if (!isAuthenticated || !user) {
      alert('Please log in to like posts');
      return;
    }

    try {
      await toggleLike(reportId, user.uid);
    } catch (err) {
      console.error('Error liking report:', err);
    }
  };

  // Generate color for user avatar based on name
  const getUserColor = (userName) => {
    if (!userName) return '#6B7280'; // gray

    const colors = [
      '#3B82F6', // blue
      '#8B5CF6', // purple
      '#EC4899', // pink
      '#EF4444', // red
      '#F97316', // orange
      '#EAB308', // yellow
      '#10B981', // green
      '#14B8A6', // teal
      '#06B6D4', // cyan
      '#6366F1', // indigo
    ];

    // Use first character of name to determine color
    const charCode = userName.charCodeAt(0);
    const index = charCode % colors.length;
    return colors[index];
  };

  // Format timestamp
  const formatTimestamp = (timestamp) => {
    if (!timestamp) return 'Just now';
    const date = timestamp.seconds ? new Date(timestamp.seconds * 1000) : new Date(timestamp);
    const now = new Date();
    const diffInMinutes = Math.floor((now - date) / (1000 * 60));

    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
    if (diffInMinutes < 10080) return `${Math.floor(diffInMinutes / 1440)}d ago`;
    return date.toLocaleDateString();
  };

  // Toggle comments section
  const toggleComments = (reportId) => {
    setShowComments(prev => ({
      ...prev,
      [reportId]: !prev[reportId]
    }));
  };

  // Toggle report expansion
  const toggleReportExpansion = (reportId) => {
    setExpandedReports(prev => ({
      ...prev,
      [reportId]: !prev[reportId]
    }));
  };

  // Handle comment submit
  const handleCommentSubmit = (reportId) => {
    if (!isAuthenticated || !user) {
      alert('Please log in to comment');
      return;
    }

    const comment = commentText[reportId];
    if (!comment?.trim()) return;

    console.log('Adding comment:', comment, 'to report:', reportId);
    // TODO: Implement addComment from Firebase
    setCommentText(prev => ({ ...prev, [reportId]: '' }));
  };

  if (loading && filteredReports.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading community posts...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <Card className="bg-red-50 border-red-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-center text-red-600">
              <AlertCircle className="w-5 h-5 mr-2" />
              <span>{error}</span>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
      <div className="max-w-6xl mx-auto px-4 py-6">
        {/* Header Section */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2 flex items-center gap-3">
                <Users className="w-8 h-8 text-blue-500" />
                Weather Reports
              </h1>
              <p className="text-gray-600">Real-time weather reports from the community</p>
            </div>
            {isAuthenticated && user?.role !== 'admin' && user?.role !== 'super_admin' && (
              <Button
                onClick={() => setShowSubmitModal(true)}
                className="flex items-center gap-2 bg-blue-500 hover:bg-blue-600 text-white"
              >
                <Plus className="w-5 h-5" />
                Submit Report
              </Button>
            )}
          </div>

          {/* Role Scope Indicator */}
          {(isMayorUser || isAdmin) && (
            <Card className="mb-6 bg-gradient-to-r from-indigo-50 to-purple-50 border-indigo-200">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  {isMayorUser ? (
                    <>
                      <div className="p-2 bg-blue-500 rounded-full">
                        <MapPin className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Viewing reports from</p>
                        <p className="text-lg font-bold text-gray-900">{userCity || 'Your City'}</p>
                        <p className="text-xs text-blue-600 mt-0.5">
                          🏛️ Mayor access - Only reports from your assigned city
                        </p>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="p-2 bg-purple-500 rounded-full">
                        <Users className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Viewing reports from</p>
                        <p className="text-lg font-bold text-gray-900">Batangas Province</p>
                        <p className="text-xs text-purple-600 mt-0.5">
                          👑 Governor access - All cities and municipalities
                        </p>
                      </div>
                    </>
                  )}
                  <div className="ml-auto">
                    <Badge variant="outline" className="text-xs">
                      {filteredReports.length} reports visible
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Filters */}
          <Card className="mb-6">
            <CardContent className="p-4">
              <div className="flex flex-wrap items-center gap-3">
                <Filter className="w-5 h-5 text-gray-500" />

                <Select
                  value={filters.category}
                  onValueChange={(value) => setFilters(prev => ({ ...prev, category: value }))}
                >
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="All Categories" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    {REPORT_CATEGORIES.map(cat => (
                      <SelectItem key={cat.value} value={cat.value}>
                        {cat.icon} {cat.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select
                  value={filters.location}
                  onValueChange={(value) => setFilters(prev => ({ ...prev, location: value }))}
                >
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="All Locations" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Locations</SelectItem>
                    {BATANGAS_CITIES.map(city => (
                      <SelectItem key={city} value={city}>
                        {city}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <div className="ml-auto flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-gray-500" />
                  <span className="text-sm text-gray-600">Sorted by: Latest</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Reports Feed */}
        <div className="space-y-4">
          {filteredReports.length === 0 ? (
            <Card>
              <CardContent className="p-12 text-center">
                <MessageCircle className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-700 mb-2">
                  {reports.length === 0 ? 'No reports yet' : 'No reports match your filters'}
                </h3>
                <p className="text-gray-500 mb-4">
                  {reports.length === 0
                    ? (user?.role === 'admin' || user?.role === 'super_admin'
                        ? 'No reports submitted by the community yet.'
                        : 'Be the first to submit a weather report!')
                    : 'Try adjusting your filters to see more reports.'}
                </p>
                {isAuthenticated && user?.role !== 'admin' && user?.role !== 'super_admin' && reports.length === 0 && (
                  <Button
                    onClick={() => setShowSubmitModal(true)}
                    className="bg-blue-500 hover:bg-blue-600"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Submit First Report
                  </Button>
                )}
              </CardContent>
            </Card>
          ) : (
            <>
            {filteredReports.slice(0, displayLimit).map((report) => {
              const isLiked = report.likes?.includes(user?.uid);
              const likesCount = report.likes?.length || 0;
              const isExpanded = expandedReports[report.id];

              return (
                <Card key={report.id} className="overflow-hidden hover:shadow-lg transition-all duration-200">
                  {/* Report Header */}
                  <CardHeader className="pb-2">
                    <div className="flex items-center gap-2">
                      <div 
                        className="flex-shrink-0"
                        style={{
                          width: '36px',
                          height: '36px',
                          borderRadius: '50%',
                          overflow: 'hidden',
                          border: '2px solid #e5e7eb',
                          boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
                        }}
                      >
                        {report.userPhotoURL ? (
                          <img 
                            src={report.userPhotoURL} 
                            alt={report.userName}
                            style={{
                              width: '100%',
                              height: '100%',
                              objectFit: 'cover'
                            }}
                          />
                        ) : (
                          <div
                            style={{
                              width: '100%',
                              height: '100%',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              backgroundColor: getUserColor(report.userName),
                              backgroundImage: `linear-gradient(to bottom right, ${getUserColor(report.userName)}, ${getUserColor(report.userName)}dd)`,
                              color: 'white',
                              fontWeight: 'bold',
                              fontSize: '14px'
                            }}
                          >
                            {report.userName?.split(' ').map(n => n[0]).join('').toUpperCase() || 'U'}
                          </div>
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="font-semibold text-gray-900 text-sm">{report.userName || 'Anonymous User'}</span>
                          <span className="text-xs text-gray-500">•</span>
                          <span className="text-xs text-gray-500">{formatTimestamp(report.createdAt)}</span>
                          <span className="text-xs text-gray-500">•</span>
                          <span className="flex items-center gap-0.5 text-xs text-gray-500">
                            <MapPin className="w-3 h-3" />
                            {report.location?.city || 'Unknown'}
                          </span>
                        </div>
                      </div>
                    </div>
                  </CardHeader>

                  <CardContent className="pt-0 pb-3">
                    {/* Report Title */}
                    {report.title && (
                      <h3 className="text-base font-semibold text-gray-900 mb-1">{report.title}</h3>
                    )}

                    {/* Report Description */}
                    <p className="text-sm text-gray-700 mb-2 leading-snug whitespace-pre-wrap">
                      {isExpanded ? report.description : (report.description?.length > 100 ? report.description.substring(0, 100) + '...' : report.description)}
                    </p>

                    {/* Report Images */}
                    {report.images && report.images.length > 0 && (
                      <div className="mb-2">
                        <div className="flex flex-wrap gap-1.5">
                          {report.images.slice(0, isExpanded ? report.images.length : 5).map((image, idx) => (
                            <div
                              key={idx}
                              className="relative cursor-pointer group overflow-hidden rounded-md"
                              style={{ width: '70px', height: '70px' }}
                              onClick={() => setSelectedImage({ images: report.images, index: idx })}
                            >
                              <img
                                src={typeof image === 'string' ? image : image.url}
                                alt={`Report image ${idx + 1}`}
                                style={{
                                  width: '70px',
                                  height: '70px',
                                  objectFit: 'cover'
                                }}
                                className="transition-transform group-hover:scale-105"
                              />
                              {!isExpanded && idx === 4 && report.images.length > 5 && (
                                <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                                  <span className="text-white text-sm font-bold">
                                    +{report.images.length - 5}
                                  </span>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Status Badge & Tags */}
                    <div className="flex items-center justify-between gap-1.5 flex-wrap">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <Badge
                          variant={report.status === 'verified' ? 'default' : 'secondary'}
                          className="text-[10px] px-1.5 py-0.5 h-5"
                        >
                          {report.status === 'verified' && '✓ '}
                          {report.status}
                        </Badge>

                        {/* AI Credibility Badge */}
                        {report.imageAnalysis && (
                          <Badge
                            className={`text-[10px] px-1.5 py-0.5 h-5 ${getCredibilityBadge(report.imageAnalysis).color} text-white`}
                            title={report.imageAnalysis.reason}
                          >
                            {getCredibilityBadge(report.imageAnalysis).text} {report.imageAnalysis.confidence}%
                          </Badge>
                        )}

                        {report.tags?.map((tag) => (
                          <Badge key={tag} variant="outline" className="text-[10px] px-1.5 py-0.5 h-5">
                            #{tag}
                          </Badge>
                        ))}
                      </div>

                      {/* Verify Button (Admin Only) */}
                      {isAdmin && report.status !== 'verified' && (
                        <Button
                          onClick={() => handleVerifyReport(report.id)}
                          size="sm"
                          className="bg-green-500 hover:bg-green-600 text-white text-[11px] px-2 py-1 h-6"
                        >
                          <CheckCircle className="w-3 h-3 mr-0.5" />
                          Verify
                        </Button>
                      )}
                    </div>

                    {/* View Full Report Button */}
                    <div className="mt-2 pt-2 border-t border-gray-100">
                      <Button
                        onClick={() => toggleReportExpansion(report.id)}
                        variant="ghost"
                        size="sm"
                        className="w-full text-blue-600 hover:text-blue-700 hover:bg-blue-50 text-[11px] h-6 gap-1"
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

            {/* Load More Button */}
            {filteredReports.length > displayLimit && (
              <div className="flex justify-center mt-6 mb-4">
                <Button
                  onClick={() => setDisplayLimit(prev => prev + 10)}
                  className="bg-blue-500 hover:bg-blue-600 text-white px-8"
                >
                  <TrendingUp className="w-4 h-4 mr-2" />
                  Load More Reports ({filteredReports.length - displayLimit} remaining)
                </Button>
              </div>
            )}

            {filteredReports.length <= displayLimit && filteredReports.length > 0 && (
              <div className="text-center text-gray-500 py-6">
                <p className="text-sm">You've reached the end of the reports</p>
              </div>
            )}
            </>
          )}
        </div>
      </div>

      {/* Image Lightbox */}
      {selectedImage && (
        <div
          className="fixed inset-0 bg-black/95 z-50 flex items-center justify-center p-4"
          onClick={() => setSelectedImage(null)}
        >
          <button
            className="absolute top-4 right-4 text-white hover:bg-white/10 rounded-full p-2"
            onClick={() => setSelectedImage(null)}
          >
            <X className="w-6 h-6" />
          </button>

          {selectedImage.index > 0 && (
            <button
              className="absolute left-4 text-white hover:bg-white/10 rounded-full p-2"
              onClick={(e) => {
                e.stopPropagation();
                setSelectedImage(prev => ({ ...prev, index: prev.index - 1 }));
              }}
            >
              <ChevronLeft className="w-8 h-8" />
            </button>
          )}

          {selectedImage.index < selectedImage.images.length - 1 && (
            <button
              className="absolute right-4 text-white hover:bg-white/10 rounded-full p-2"
              onClick={(e) => {
                e.stopPropagation();
                setSelectedImage(prev => ({ ...prev, index: prev.index + 1 }));
              }}
            >
              <ChevronRight className="w-8 h-8" />
            </button>
          )}

          <img
            src={typeof selectedImage.images[selectedImage.index] === 'string'
              ? selectedImage.images[selectedImage.index]
              : selectedImage.images[selectedImage.index].url}
            alt="Full size"
            className="max-w-full max-h-full object-contain"
            onClick={(e) => e.stopPropagation()}
          />

          <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 text-white text-sm">
            {selectedImage.index + 1} / {selectedImage.images.length}
          </div>
        </div>
      )}

      {/* Report Submission Modal */}
      <ReportSubmissionModal
        isOpen={showSubmitModal}
        onClose={() => setShowSubmitModal(false)}
        onSubmitSuccess={() => {
          // Reports will auto-update via real-time listener
          console.log('Report submitted successfully');
        }}
      />
    </div>
  );
}
