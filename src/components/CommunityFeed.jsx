import { useState, useEffect } from "react";
import {
  Heart,
  MessageCircle,
  Share2,
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
  MoreVertical,
  Bookmark,
  TrendingUp,
  Users,
  Shield
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { getReports, toggleLike, subscribeToReports } from "../firebase";
import { useAuth } from "../contexts/AuthContext";
import { ReportSubmissionModal } from "./ReportSubmissionModal";

export function CommunityFeed() {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedPost, setSelectedPost] = useState(null);
  const [commentText, setCommentText] = useState({});
  const [showComments, setShowComments] = useState({});
  const [selectedImage, setSelectedImage] = useState(null);
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [filters, setFilters] = useState({
    status: 'all',
    severity: 'all',
    location: '',
    limit: 20
  });
  const { user, isAuthenticated } = useAuth();

  // Load reports on component mount
  useEffect(() => {
    const firebaseFilters = {
      status: filters.status === 'all' ? undefined : filters.status || undefined,
      limit: filters.limit || 20
    };

    try {
      const unsubscribe = subscribeToReports((reportsData) => {
        // Sort by timestamp client-side
        const sorted = reportsData.sort((a, b) => {
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
  }, [filters.status, filters.limit]);

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

  // Get severity badge style
  const getSeverityBadge = (severity) => {
    const styles = {
      critical: { bg: 'bg-red-500', text: 'text-white', label: '🚨 Critical' },
      high: { bg: 'bg-orange-500', text: 'text-white', label: '⚠️ High Priority' },
      medium: { bg: 'bg-yellow-500', text: 'text-white', label: '📋 Medium' },
      low: { bg: 'bg-blue-500', text: 'text-white', label: 'ℹ️ Low' },
    };
    return styles[severity] || styles.low;
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

  if (loading && reports.length === 0) {
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
            {isAuthenticated && (
              <Button
                onClick={() => setShowSubmitModal(true)}
                className="flex items-center gap-2 bg-blue-500 hover:bg-blue-600 text-white"
              >
                <Plus className="w-5 h-5" />
                Submit Report
              </Button>
            )}
          </div>

          {/* Filters */}
          <Card className="mb-6">
            <CardContent className="p-4">
              <div className="flex flex-wrap items-center gap-3">
                <Filter className="w-5 h-5 text-gray-500" />
                <Select
                  value={filters.status}
                  onValueChange={(value) => setFilters(prev => ({ ...prev, status: value === 'all' ? '' : value }))}
                >
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="All Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="verified">✓ Verified</SelectItem>
                    <SelectItem value="pending">⏳ Pending</SelectItem>
                    <SelectItem value="investigating">🔍 Investigating</SelectItem>
                    <SelectItem value="resolved">✅ Resolved</SelectItem>
                  </SelectContent>
                </Select>

                <Select
                  value={filters.severity}
                  onValueChange={(value) => setFilters(prev => ({ ...prev, severity: value === 'all' ? '' : value }))}
                >
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="All Severity" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Severity</SelectItem>
                    <SelectItem value="critical">🚨 Critical</SelectItem>
                    <SelectItem value="high">⚠️ High</SelectItem>
                    <SelectItem value="medium">📋 Medium</SelectItem>
                    <SelectItem value="low">ℹ️ Low</SelectItem>
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
          {reports.length === 0 ? (
            <Card>
              <CardContent className="p-12 text-center">
                <MessageCircle className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-700 mb-2">No reports yet</h3>
                <p className="text-gray-500 mb-4">Be the first to submit a weather report!</p>
                {isAuthenticated && (
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
            reports.map((report) => {
              const severityBadge = getSeverityBadge(report.severity);
              const isLiked = report.likes?.includes(user?.uid);
              const likesCount = report.likes?.length || 0;

              return (
                <Card key={report.id} className="overflow-hidden hover:shadow-lg transition-all duration-200">
                  {/* Report Header */}
                  <CardHeader className="pb-3">
                    <div className="flex items-center gap-3">
                      <Avatar className="w-12 h-12 border-2 border-blue-100">
                        <AvatarImage src={report.userPhotoURL} />
                        <AvatarFallback className="bg-gradient-to-br from-blue-400 to-blue-600 text-white font-semibold">
                          {report.userName?.split(' ').map(n => n[0]).join('') || 'U'}
                        </AvatarFallback>
                      </Avatar>

                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-gray-900">{report.userName || 'Anonymous User'}</span>
                          {report.userVerified && (
                            <CheckCircle className="w-4 h-4 text-blue-500" fill="currentColor" />
                          )}
                        </div>
                        <div className="flex items-center gap-2 text-sm text-gray-500">
                          <span>{formatTimestamp(report.createdAt)}</span>
                          <span>•</span>
                          <span>
                            {report.location?.barangay || 'Location'}, {report.location?.city || 'Unknown'}
                          </span>
                        </div>
                      </div>
                    </div>
                  </CardHeader>

                  <CardContent className="pt-0">
                    {/* Report Title */}
                    {report.title && (
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">{report.title}</h3>
                    )}

                    {/* Report Description */}
                    <p className="text-gray-700 mb-4 leading-relaxed whitespace-pre-wrap">
                      {report.description}
                    </p>

                    {/* Status Badge & AI Verification */}
                    <div className="flex items-center gap-2 mb-4 flex-wrap">
                      <Badge
                        variant={report.status === 'verified' ? 'default' : 'secondary'}
                        className="text-xs"
                      >
                        {report.status === 'verified' && '✓ '}
                        {report.status}
                      </Badge>

                      {/* AI Credibility Badge */}
                      {report.aiAnalysis && (
                        <Badge
                          className={`text-xs ${
                            report.aiAnalysis.confidence >= 85 ? 'bg-green-600 text-white' :
                            report.aiAnalysis.confidence >= 60 ? 'bg-yellow-600 text-white' :
                            'bg-red-600 text-white'
                          }`}
                        >
                          AI: {report.aiAnalysis.confidence}% {
                            report.aiAnalysis.confidence >= 85 ? 'Authentic' :
                            report.aiAnalysis.confidence >= 60 ? 'Needs Review' :
                            'Low Confidence'
                          }
                        </Badge>
                      )}

                      {report.tags?.map((tag) => (
                        <Badge key={tag} variant="outline" className="text-xs">
                          #{tag}
                        </Badge>
                      ))}
                    </div>

                    {/* AI Analysis Card (if available) */}
                    {report.aiAnalysis && report.aiAnalysis.assessment && (
                      <div className={`mb-4 p-3 rounded-lg border inline-block ${
                        report.aiAnalysis.confidence >= 85 ? 'bg-green-50 border-green-200' :
                        report.aiAnalysis.confidence >= 60 ? 'bg-yellow-50 border-yellow-200' :
                        'bg-red-50 border-red-200'
                      }`}>
                        <div className="flex items-start gap-2">
                          <Shield className={`w-4 h-4 mt-0.5 flex-shrink-0 ${
                            report.aiAnalysis.confidence >= 85 ? 'text-green-600' :
                            report.aiAnalysis.confidence >= 60 ? 'text-yellow-600' :
                            'text-red-600'
                          }`} />
                          <div>
                            <p className="text-xs font-semibold mb-1">AI Credibility Analysis</p>
                            <p className="text-xs text-gray-700">{report.aiAnalysis.assessment}</p>
                            {report.aiAnalysis.credibilityReason && (
                              <p className="text-xs text-gray-600 mt-1 italic">
                                {report.aiAnalysis.credibilityReason}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Images Gallery */}
                    {report.images && report.images.length > 0 && (
                      <div className={`grid gap-2 mb-4 rounded-lg overflow-hidden ${
                        report.images.length === 1 ? 'grid-cols-1' :
                        report.images.length === 2 ? 'grid-cols-2' :
                        report.images.length === 3 ? 'grid-cols-3' :
                        'grid-cols-2'
                      }`}>
                        {report.images.slice(0, 4).map((img, idx) => (
                          <div
                            key={idx}
                            className="relative group cursor-pointer overflow-hidden bg-gray-100"
                            style={{ aspectRatio: report.images.length === 1 ? '16/9' : '1/1' }}
                            onClick={() => setSelectedImage({ images: report.images, index: idx })}
                          >
                            <img
                              src={typeof img === 'string' ? img : img.url}
                              alt={`Report image ${idx + 1}`}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                            />
                            {idx === 3 && report.images.length > 4 && (
                              <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                                <span className="text-white text-2xl font-bold">
                                  +{report.images.length - 4}
                                </span>
                              </div>
                            )}
                            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-200" />
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })
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
