import { Heart, MessageCircle, Share, MapPin, Clock, CheckCircle, Filter, Plus, AlertCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { ImageWithFallback } from "./figma/ImageWithFallback";
import { useState, useEffect } from "react";
import { getReports, toggleLike, subscribeToReports } from "../firebase";
import { useAuth } from "../contexts/AuthContext";

export function CommunityFeed() {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({
    status: 'verified',
    severity: '',
    category: '',
    page: 1,
    limit: 10
  });
  const [pagination, setPagination] = useState({});
  const { user, isAuthenticated } = useAuth();

  // Fetch reports from Firebase
  const fetchReports = async () => {
    try {
      setLoading(true);
      setError(null);

      const firebaseFilters = {
        status: filters.status || undefined,
        severity: filters.severity || undefined,
        category: filters.category || undefined,
        limit: filters.limit || 10
      };

      const reportsData = await getReports(firebaseFilters);
      setReports(reportsData);
      setPagination({
        total: reportsData.length,
        current: 1,
        pages: 1,
        hasPrev: false,
        hasNext: false
      });
    } catch (err) {
      console.error('Error fetching reports:', err);
      setError(err.message || 'Failed to fetch reports');
    } finally {
      setLoading(false);
    }
  };

  // Load reports on component mount and filter changes
  // Use real-time listener for live updates
  useEffect(() => {
    const firebaseFilters = {
      status: filters.status || undefined,
      limit: filters.limit || 10
    };

    // Subscribe to real-time updates
    const unsubscribe = subscribeToReports((reportsData) => {
      setReports(reportsData);
      setPagination({
        total: reportsData.length,
        current: 1,
        pages: 1,
        hasPrev: false,
        hasNext: false
      });
      setLoading(false);
    }, firebaseFilters);

    // Cleanup subscription on unmount
    return () => unsubscribe();
  }, [filters.status, filters.limit]);

  // Handle filter changes
  const handleFilterChange = (key, value) => {
    setFilters(prev => ({
      ...prev,
      [key]: value,
      page: 1 // Reset to first page when filters change
    }));
  };

  // Handle pagination
  const handlePageChange = (newPage) => {
    setFilters(prev => ({
      ...prev,
      page: newPage
    }));
  };

  // Handle like/unlike
  const handleLike = async (reportId) => {
    if (!isAuthenticated || !user) {
      console.log('Must be logged in to like reports');
      return;
    }

    try {
      await toggleLike(reportId, user.uid);
      // The real-time listener will automatically update the UI
    } catch (err) {
      console.error('Error liking report:', err);
    }
  };

  // Format timestamp
  const formatTimestamp = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInMinutes = Math.floor((now - date) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes} minutes ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)} hours ago`;
    return `${Math.floor(diffInMinutes / 1440)} days ago`;
  };

  // Get severity color
  const getSeverityColor = (severity) => {
    switch (severity) {
      case 'critical': return 'destructive';
      case 'high': return 'destructive';
      case 'medium': return 'default';
      case 'low': return 'secondary';
      default: return 'secondary';
    }
  };

  if (loading && reports.length === 0) {
    return (
      <div className="space-y-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
              <span className="ml-2">Loading reports...</span>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-center text-red-500">
              <AlertCircle className="w-5 h-5 mr-2" />
              <span>{error}</span>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }
  return (
    <div className="space-y-6">
      {/* Feed Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <MessageCircle className="w-5 h-5 text-blue-500" />
              Community Reports
              <Badge variant="secondary">{pagination.total || 0} reports</Badge>
            </CardTitle>
            <div className="flex items-center gap-2">
              <Select 
                value={filters.status} 
                onValueChange={(value) => handleFilterChange('status', value)}
              >
                <SelectTrigger className="w-40">
                  <Filter className="w-4 h-4 mr-2" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="verified">Verified Only</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="investigating">Investigating</SelectItem>
                  <SelectItem value="resolved">Resolved</SelectItem>
                  <SelectItem value="">All Reports</SelectItem>
                </SelectContent>
              </Select>
              
              <Select 
                value={filters.severity} 
                onValueChange={(value) => handleFilterChange('severity', value)}
              >
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="Severity" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All Severity</SelectItem>
                  <SelectItem value="critical">Critical</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="low">Low</SelectItem>
                </SelectContent>
              </Select>

              {isAuthenticated && (
                <Button size="sm" className="flex items-center gap-2">
                  <Plus className="w-4 h-4" />
                  New Report
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Community Posts */}
      <div className="space-y-4">
        {reports.length === 0 ? (
          <Card>
            <CardContent className="p-6 text-center">
              <MessageCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No reports found</h3>
              <p className="text-gray-500 mb-4">
                {filters.status || filters.severity || filters.category 
                  ? 'Try adjusting your filters to see more reports.'
                  : 'Be the first to submit a community report!'
                }
              </p>
              {isAuthenticated && (
                <Button className="flex items-center gap-2">
                  <Plus className="w-4 h-4" />
                  Submit Report
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          reports.map((report) => (
            <Card key={report.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                {/* Post Header */}
                <div className="flex items-start gap-3 mb-4">
                  <Avatar className="w-10 h-10">
                    <AvatarImage src={report.userPhotoURL} />
                    <AvatarFallback className="bg-blue-100 text-blue-600">
                      {report.userName?.split(' ').map(n => n[0]).join('') || 'U'}
                    </AvatarFallback>
                  </Avatar>

                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium text-gray-900">{report.userName || 'Anonymous'}</span>
                      {report.userVerified && (
                        <CheckCircle className="w-4 h-4 text-blue-500" />
                      )}
                      <Badge 
                        variant={getSeverityColor(report.severity)}
                        className="text-xs"
                      >
                        {report.severity} priority
                      </Badge>
                      <Badge variant="outline" className="text-xs">
                        {report.status}
                      </Badge>
                    </div>
                    
                    <div className="flex items-center gap-4 text-sm text-gray-500">
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3 h-3" />
                        {report.location?.barangay || 'Location'}, {report.location?.city || 'Unknown'}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {report.createdAt?.seconds ? formatTimestamp(new Date(report.createdAt.seconds * 1000)) : 'Recently'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Post Content with Image */}
                <div className="flex gap-4 mb-4">
                  {/* Post Image */}
                  {report.images && report.images.length > 0 && (
                    <div className="flex-shrink-0">
                      <ImageWithFallback
                        src={typeof report.images[0] === 'string' ? report.images[0] : report.images[0].url}
                        alt="Community report image"
                        className="w-32 h-24 object-cover rounded-lg border border-gray-200"
                      />
                    </div>
                  )}
                  
                  {/* Post Text */}
                  <div className="flex-1">
                    <h4 className="font-medium text-gray-900 mb-2">{report.title}</h4>
                    <p className="text-gray-700 leading-relaxed">{report.description}</p>
                  </div>
                </div>

                {/* Tags */}
                {report.tags && report.tags.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-4">
                    {report.tags.map((tag) => (
                      <Badge key={tag} variant="outline" className="text-xs">
                        #{tag}
                      </Badge>
                    ))}
                  </div>
                )}

                {/* Post Actions */}
                <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                  <div className="flex items-center gap-6">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="flex items-center gap-2"
                      onClick={() => handleLike(report.id)}
                      disabled={!isAuthenticated}
                    >
                      <Heart className={`w-4 h-4 ${
                        report.likes?.includes(user?.uid) ? 'text-red-500 fill-current' : ''
                      }`} />
                      <span>{report.likes?.length || 0}</span>
                    </Button>
                    <Button variant="ghost" size="sm" className="flex items-center gap-2">
                      <MessageCircle className="w-4 h-4" />
                      <span>{report.commentsCount || 0}</span>
                    </Button>
                    <Button variant="ghost" size="sm" className="flex items-center gap-2">
                      <Share className="w-4 h-4" />
                      <span>0</span>
                    </Button>
                  </div>
                  
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm">
                      View Details
                    </Button>
                    {isAuthenticated && report.userId === user?.uid && (
                      <Button variant="ghost" size="sm">
                        Edit
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Pagination */}
      {pagination.pages > 1 && (
        <div className="flex justify-center items-center gap-2">
          <Button 
            variant="outline" 
            size="sm"
            disabled={!pagination.hasPrev}
            onClick={() => handlePageChange(pagination.current - 1)}
          >
            Previous
          </Button>
          
          <span className="text-sm text-gray-500">
            Page {pagination.current} of {pagination.pages}
          </span>
          
          <Button 
            variant="outline" 
            size="sm"
            disabled={!pagination.hasNext}
            onClick={() => handlePageChange(pagination.current + 1)}
          >
            Next
          </Button>
        </div>
      )}
    </div>
  );
}