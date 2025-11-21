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
  XCircle,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  TrendingUp,
  Users,
  Eye,
  Shield,
  Megaphone
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { getReports, toggleLike, subscribeToReports, updateReport, rejectReport } from "../../firebase";
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../firebase/config';
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
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [displayLimit, setDisplayLimit] = useState(10); // Show 10 reports initially
  const [filters, setFilters] = useState({
    category: 'all',
    location: 'all',
    status: 'all',
    sortBy: 'latest',
    limit: 500
  });
  const { user, isAuthenticated } = useAuth();

  // Check if user is admin/governor or mayor
  const isAdmin = isGovernor(user);
  const isMayorUser = isMayor(user);
  const userCity = getUserCity(user);

  // Announcement state
  const [showAnnouncementModal, setShowAnnouncementModal] = useState(false);
  const [announcementTitle, setAnnouncementTitle] = useState('');
  const [announcementMessage, setAnnouncementMessage] = useState('');
  const [announcementPriority, setAnnouncementPriority] = useState('normal');
  const [issuingAnnouncement, setIssuingAnnouncement] = useState(false);

  // Handle verify report
  const handleVerifyReport = async (reportId) => {
    try {
      const verifierRole = isAdmin ? 'Governor' : isMayorUser ? `Mayor of ${userCity}` : 'Admin';
      await updateReport(reportId, {
        status: 'verified',
        verifiedBy: `${verifierRole} (${user?.displayName || user?.email})`,
        verifiedAt: new Date()
      });
      console.log('Report verified successfully by', verifierRole);
    } catch (error) {
      console.error('Error verifying report:', error);
      alert('Failed to verify report');
    }
  };

  // Handle reject report
  const handleRejectReport = async (reportId) => {
    try {
      const rejectorRole = isAdmin ? 'Governor' : isMayorUser ? `Mayor of ${userCity}` : 'Admin';
      await rejectReport(
        reportId,
        `${rejectorRole} (${user?.displayName || user?.email})`,
        'Marked as spam/inappropriate content'
      );
      console.log('Report rejected successfully by', rejectorRole);
    } catch (error) {
      console.error('Error rejecting report:', error);
      alert('Failed to reject report');
    }
  };

  // Handle issue announcement
  const handleIssueAnnouncement = async () => {
    if (!announcementTitle.trim() || !announcementMessage.trim()) {
      alert('Please fill in all required fields');
      return;
    }

    try {
      setIssuingAnnouncement(true);

      // Determine announcement type and location based on role
      const announcementType = isAdmin ? 'governor_announcement' : 'mayor_announcement';
      const announcementCity = isAdmin ? 'Batangas Province' : userCity;
      const announcerRole = isAdmin ? 'Governor' : 'Mayor';

      // Create announcement in Firestore
      const announcementsRef = collection(db, 'announcements');
      await addDoc(announcementsRef, {
        city: announcementCity,
        title: announcementTitle.trim(),
        message: announcementMessage.trim(),
        priority: announcementPriority,
        issuedBy: user?.displayName || user?.email || announcerRole,
        issuedAt: serverTimestamp(),
        createdAt: serverTimestamp(),
        active: true,
        type: announcementType
      });

      // Reset form and close modal
      setAnnouncementTitle('');
      setAnnouncementMessage('');
      setAnnouncementPriority('normal');
      setShowAnnouncementModal(false);

      alert('Announcement posted successfully!');
    } catch (error) {
      console.error('Error posting announcement:', error);
      alert('Failed to post announcement. Please try again.');
    } finally {
      setIssuingAnnouncement(false);
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

    // Filter by status
    if (filters.status !== 'all') {
      if (filters.status === 'pending' && report.status !== 'pending' && report.status !== 'under_review' && report.status) {
        return false;
      }
      if (filters.status === 'verified' && report.status !== 'verified') {
        return false;
      }
      if (filters.status === 'flagged' && report.status !== 'flagged') {
        return false;
      }
    }

    return true;
  }).sort((a, b) => {
    // Sort reports based on selected sort option
    switch (filters.sortBy) {
      case 'latest':
        return (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0);
      case 'oldest':
        return (a.createdAt?.seconds || 0) - (b.createdAt?.seconds || 0);
      case 'highCredibility':
        return (b.aiCredibility || b.imageAnalysis?.confidence || 0) - (a.aiCredibility || a.imageAnalysis?.confidence || 0);
      case 'lowCredibility':
        return (a.aiCredibility || a.imageAnalysis?.confidence || 0) - (b.aiCredibility || b.imageAnalysis?.confidence || 0);
      default:
        return (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0);
    }
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

    // Check if date is valid
    if (isNaN(date.getTime())) return 'Date unavailable';

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
            <div className="flex gap-2">
              {(isMayorUser || isAdmin) && (
                <Button
                  onClick={() => setShowAnnouncementModal(true)}
                  className="flex items-center gap-2 bg-green-500 hover:bg-green-600 text-white"
                >
                  <Megaphone className="w-5 h-5" />
                  Make Announcement
                </Button>
              )}
              {isAuthenticated && user?.role !== 'admin' && user?.role !== 'super_admin' && user?.role !== 'mayor' && user?.role !== 'governor' && (
                <Button
                  onClick={() => setShowSubmitModal(true)}
                  className="flex items-center gap-2 bg-blue-500 hover:bg-blue-600 text-white"
                >
                  <Plus className="w-5 h-5" />
                  Submit Report
                </Button>
              )}
            </div>
          </div>

          {/* Role Scope Indicator */}
          {(isMayorUser || isAdmin) && (
            <Card className="mb-6 !bg-gradient-to-r !from-indigo-50 !to-purple-50 border-indigo-200">
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
                        <p className="text-xs text-blue-600 mt-0.5">Mayor access - Only reports from your assigned city</p>
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
                        <p className="text-xs text-purple-600 mt-0.5">Governor access - All cities and municipalities</p>
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

                <Select
                  value={filters.status}
                  onValueChange={(value) => setFilters(prev => ({ ...prev, status: value }))}
                >
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="All Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="verified">Verified</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="flagged">Spam</SelectItem>
                  </SelectContent>
                </Select>

                <Select
                  value={filters.sortBy}
                  onValueChange={(value) => setFilters(prev => ({ ...prev, sortBy: value }))}
                >
                  <SelectTrigger className="w-52 ml-auto">
                    <SelectValue placeholder="Sort by" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="latest">Latest First</SelectItem>
                    <SelectItem value="oldest">Oldest First</SelectItem>
                    <SelectItem value="highCredibility">High Credibility</SelectItem>
                    <SelectItem value="lowCredibility">Low Credibility</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Reports Feed */}
        <div className="space-y-4">
          {filteredReports.length === 0 ? (
            <Card style={{ minHeight: '400px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
              <CardContent className="p-12 text-center flex flex-col items-center justify-center">
                <MessageCircle className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-700 mb-2">
                  {reports.length === 0 ? 'No reports yet' : 'No reports match your filters'}
                </h3>
                <p className="text-gray-500 mb-4">
                  {reports.length === 0
                    ? (user?.role === 'admin' || user?.role === 'super_admin' || user?.role === 'mayor' || user?.role === 'governor'
                        ? 'No reports submitted by the community yet.'
                        : 'Be the first to submit a weather report!')
                    : 'Try adjusting your filters to see more reports.'}
                </p>
                {isAuthenticated && user?.role !== 'admin' && user?.role !== 'super_admin' && user?.role !== 'mayor' && user?.role !== 'governor' && reports.length === 0 && (
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

              return (
                <Card key={report.id} className="overflow-hidden hover:shadow-lg transition-all duration-200">
                  <CardContent className="p-4">
                    {/* Top Row: Reporter info (left) + Status/Monitoring Tags (right) */}
                    <div className="flex items-start justify-between gap-3 mb-2">
                      {/* Left: Profile + Name + Location */}
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        <div
                          className="flex-shrink-0"
                          style={{
                            width: '40px',
                            height: '40px',
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
                                fontSize: '16px'
                              }}
                            >
                              {report.userName?.split(' ').map(n => n[0]).join('').toUpperCase() || 'U'}
                            </div>
                          )}
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="font-semibold text-gray-900 text-base">{report.userName || 'Anonymous User'}</div>
                          <div className="flex items-center gap-1 text-xs text-gray-500">
                            <MapPin className="w-3 h-3" />
                            <span>{report.location?.barangay ? `${report.location.barangay}, ${report.location.city}` : (report.location?.city || 'Unknown')}</span>
                          </div>
                        </div>
                      </div>

                      {/* Right: Status Badge */}
                      <div className="flex items-center gap-2 flex-shrink-0">
                        {/* Status Badge - Verified, Pending, Spam, or Rejected */}
                        <Badge
                          className={`text-xs px-2.5 py-1 font-medium ${
                            report.status === 'verified'
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : report.status === 'spam' || report.status === 'flagged'
                              ? 'bg-red-50 text-red-700 border border-red-200'
                              : report.status === 'rejected'
                              ? 'bg-orange-50 text-orange-700 border border-orange-200'
                              : 'bg-slate-50 text-slate-700 border border-slate-200'
                          }`}
                        >
                          {report.status === 'verified' ? '✓ Verified'
                            : report.status === 'spam' || report.status === 'flagged' ? '🚫 Spam'
                            : report.status === 'rejected' ? '✕ Rejected'
                            : 'Pending'}
                        </Badge>
                      </div>
                    </div>

                    {/* Title and Content Row: Description (left) + Image (right) */}
                    <div className="flex gap-4 mb-3">
                      {/* Left: Title + Description */}
                      <div className="flex-1 min-w-0">
                        {/* Report Title */}
                        {report.title && (
                          <h3 className="text-lg font-bold text-gray-900 mb-1.5">{report.title}</h3>
                        )}

                        {/* Report Description */}
                        <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">
                          {report.description}
                        </p>
                      </div>

                      {/* Right: Image Thumbnails - Horizontal Layout */}
                      {report.images && report.images.length > 0 && (
                        <div
                          className="flex-shrink-0"
                          style={{
                            display: 'flex',
                            flexDirection: 'row',
                            gap: '8px',
                            alignItems: 'flex-start',
                            flexWrap: 'nowrap'
                          }}
                        >
                          {report.images.slice(0, 5).map((image, idx) => (
                            <div
                              key={idx}
                              onClick={() => setSelectedImage({ images: report.images, index: idx })}
                              className="cursor-pointer hover:opacity-90 transition-opacity"
                              style={{
                                position: 'relative',
                                width: '100px',
                                height: '100px',
                                backgroundColor: '#f3f4f6',
                                borderRadius: '8px',
                                overflow: 'hidden',
                                flexShrink: 0,
                                transform: 'none',
                                rotate: 'none',
                                scale: 'none',
                                translate: 'none'
                              }}
                            >
                              <img
                                src={typeof image === 'string' ? image : image.url}
                                alt={`Report image ${idx + 1}`}
                                style={{
                                  width: '100%',
                                  height: '100%',
                                  objectFit: 'cover',
                                  transform: 'none',
                                  rotate: 'none',
                                  scale: 'none',
                                  translate: 'none'
                                }}
                              />
                              {idx === 4 && report.images.length > 5 && (
                                <div className="absolute inset-0 bg-black/70 flex items-center justify-center">
                                  <span className="text-white text-lg font-bold">
                                    +{report.images.length - 5}
                                  </span>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Bottom Section: Divider Line + AI Credibility (left) + Admin Buttons (right) */}
                    <div className="pt-3 border-t border-gray-100">
                      <div className="flex items-center justify-between gap-2">
                        {/* Left: AI Credibility Badge with % */}
                        <div className="flex items-center gap-2">
                          {(report.imageAnalysis || report.aiCredibility !== null) && (
                            <Badge
                              className={`text-xs px-2.5 py-1 flex items-center gap-1.5 font-medium border ${
                                report.aiCredibility >= 70 || (report.imageAnalysis && report.imageAnalysis.confidence >= 70)
                                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                  : report.aiCredibility >= 40 || (report.imageAnalysis && report.imageAnalysis.confidence >= 40)
                                  ? 'bg-amber-50 text-amber-700 border-amber-200'
                                  : 'bg-red-50 text-red-700 border-red-200'
                              }`}
                              title={report.imageAnalysis?.reason || report.aiReason || 'AI-analyzed report'}
                            >
                              <Shield className="w-3.5 h-3.5" />
                              {report.aiCredibility >= 70 || (report.imageAnalysis && report.imageAnalysis.confidence >= 70)
                                ? `Credible (${report.aiCredibility || report.imageAnalysis?.confidence || 0}%)`
                                : report.aiCredibility >= 40 || (report.imageAnalysis && report.imageAnalysis.confidence >= 40)
                                ? `Suspicious (${report.aiCredibility || report.imageAnalysis?.confidence || 0}%)`
                                : `Spam (${report.aiCredibility || report.imageAnalysis?.confidence || 0}%)`
                              }
                            </Badge>
                          )}
                          <span className="text-xs text-gray-500">{formatTimestamp(report.createdAt)}</span>
                        </div>

                        {/* Right: Admin Actions - Verify & Reject Buttons */}
                        {(isAdmin || isMayorUser) &&
                         report.status !== 'verified' &&
                         report.status !== 'rejected' &&
                         report.status !== 'flagged' && (
                          <div className="flex items-center gap-2">
                            <Button
                              onClick={() => handleVerifyReport(report.id)}
                              size="sm"
                              variant="outline"
                              className="text-xs px-3 py-1.5 h-auto font-medium"
                            >
                              <CheckCircle className="w-3.5 h-3.5 mr-1" />
                              Verify
                            </Button>
                            <Button
                              onClick={() => handleRejectReport(report.id)}
                              size="sm"
                              variant="outline"
                              className="text-xs px-3 py-1.5 h-auto font-medium"
                            >
                              <XCircle className="w-3.5 h-3.5 mr-1" />
                              Reject
                            </Button>
                          </div>
                        )}
                      </div>
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

      {/* Announcement Modal */}
      {showAnnouncementModal && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
          onClick={() => setShowAnnouncementModal(false)}
        >
          <div
            className="bg-white rounded-2xl shadow-2xl flex flex-col"
            style={{ width: '600px', maxWidth: '90vw', maxHeight: '85vh' }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex-shrink-0 bg-white border-b border-gray-200 p-6 flex items-center justify-between rounded-t-2xl">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Make Announcement</h2>
                <p className="text-sm text-gray-600 mt-1">
                  {isAdmin
                    ? 'Send an announcement to all residents in Batangas Province'
                    : `Send an announcement to all residents in ${userCity}`
                  }
                </p>
              </div>
              <button
                onClick={() => setShowAnnouncementModal(false)}
                disabled={issuingAnnouncement}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            {/* Content */}
            <div className="p-6 space-y-5 overflow-y-auto flex-1">
              {/* Priority */}
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">
                  Priority Level
                </label>
                <select
                  value={announcementPriority}
                  onChange={(e) => setAnnouncementPriority(e.target.value)}
                  style={{ border: '2px solid #d1d5db' }}
                  className="w-full px-4 py-3 rounded-lg focus:border-blue-500 focus:outline-none font-medium text-gray-700 bg-white"
                >
                  <option value="normal">Normal - General information</option>
                  <option value="important">Important - Requires attention</option>
                  <option value="urgent">Urgent - Critical announcement</option>
                </select>
              </div>

              {/* Title */}
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">
                  Announcement Title <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={announcementTitle}
                  onChange={(e) => setAnnouncementTitle(e.target.value)}
                  placeholder="e.g., Road Closure Notice, Community Meeting"
                  maxLength={100}
                  style={{ border: '2px solid #d1d5db' }}
                  className="w-full px-4 py-3 rounded-lg focus:border-blue-500 focus:outline-none"
                />
                <div className="mt-1 text-xs text-gray-500 text-right">
                  {announcementTitle.length}/100 characters
                </div>
              </div>

              {/* Message */}
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">
                  Message <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={announcementMessage}
                  onChange={(e) => setAnnouncementMessage(e.target.value)}
                  placeholder="Enter your announcement message here..."
                  rows={6}
                  maxLength={500}
                  style={{ border: '2px solid #d1d5db' }}
                  className="w-full px-4 py-3 rounded-lg focus:border-blue-500 focus:outline-none resize-none"
                />
                <div className="mt-1 text-xs text-gray-500 text-right">
                  {announcementMessage.length}/500 characters
                </div>
              </div>

              {/* Info Box */}
              <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-4">
                <p className="text-sm text-blue-800">
                  <strong>Note:</strong> This announcement will be visible to all residents in {isAdmin ? 'Batangas Province' : userCity} on their dashboard and notifications.
                </p>
              </div>
            </div>

            {/* Footer */}
            <div className="flex-shrink-0 border-t border-gray-200 p-4 flex gap-3">
              <Button
                onClick={() => setShowAnnouncementModal(false)}
                variant="outline"
                disabled={issuingAnnouncement}
                className="flex-1"
                style={{ backgroundColor: '#f3f4f6', borderColor: '#d1d5db', color: '#374151' }}
              >
                Cancel
              </Button>
              <Button
                onClick={handleIssueAnnouncement}
                disabled={issuingAnnouncement || !announcementTitle.trim() || !announcementMessage.trim()}
                className="flex-1"
                style={{ backgroundColor: '#10b981', color: 'white' }}
              >
                {issuingAnnouncement ? (
                  <span className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    Posting...
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    <Megaphone className="w-4 h-4" />
                    Post Announcement
                  </span>
                )}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
