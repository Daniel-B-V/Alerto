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
  Image as ImageIcon,
  X,
  Upload
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { useAuth } from "../contexts/AuthContext";
import { createReport, getUserReports } from "../firebase/firestore";
import { uploadMultipleImages } from "../firebase/storage";

export function UserReportsPage() {
  const { user } = useAuth();
  const [reports, setReports] = useState([]);
  const [filteredReports, setFilteredReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [submitting, setSubmitting] = useState(false);
  const [selectedImages, setSelectedImages] = useState([]);
  const [imagePreviews, setImagePreviews] = useState([]);

  // Form state
  const [formData, setFormData] = useState({
    type: "",
    title: "",
    description: "",
    location: "",
    severity: "medium"
  });

  const reportTypes = [
    { value: "flooding", label: "Flooding" },
    { value: "power_outage", label: "Power Outage" },
    { value: "road_accident", label: "Road Accident" },
    { value: "fire", label: "Fire Incident" },
    { value: "landslide", label: "Landslide" },
    { value: "other", label: "Other" }
  ];

  const severityLevels = [
    { value: "low", label: "Low", color: "bg-blue-500" },
    { value: "medium", label: "Medium", color: "bg-yellow-500" },
    { value: "high", label: "High", color: "bg-orange-500" },
    { value: "critical", label: "Critical", color: "bg-red-500" }
  ];

  // Fetch user's reports
  const fetchReports = async () => {
    if (!user) return;

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

  // Apply filters
  useEffect(() => {
    let filtered = [...reports];

    // Search filter
    if (searchQuery.trim()) {
      filtered = filtered.filter(report =>
        report.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        report.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        report.location?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Status filter
    if (statusFilter !== "all") {
      filtered = filtered.filter(report => report.status === statusFilter);
    }

    setFilteredReports(filtered);
  }, [searchQuery, statusFilter, reports]);

  // Handle image selection
  const handleImageSelect = (e) => {
    const files = Array.from(e.target.files);
    if (files.length + selectedImages.length > 4) {
      alert('You can only upload up to 4 images');
      return;
    }

    setSelectedImages(prev => [...prev, ...files]);

    // Create previews
    files.forEach(file => {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreviews(prev => [...prev, reader.result]);
      };
      reader.readAsDataURL(file);
    });
  };

  // Remove image
  const removeImage = (index) => {
    setSelectedImages(prev => prev.filter((_, i) => i !== index));
    setImagePreviews(prev => prev.filter((_, i) => i !== index));
  };

  // Handle form submit
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!user) return;

    setSubmitting(true);
    try {
      // Upload images if any
      let imageUrls = [];
      if (selectedImages.length > 0) {
        const uploadedImages = await uploadMultipleImages(selectedImages, 'reports');
        imageUrls = uploadedImages.map(img => img.url);
      }

      const reportData = {
        ...formData,
        title: formData.title || `${formData.type} Report`,
        category: formData.type,
        severity: formData.severity,
        location: formData.location || user.province || 'Batangas',
        userName: user.displayName || user.email || 'Anonymous',
        userPhotoURL: user.photoURL || null,
        userEmail: user.email,
        images: imageUrls
      };

      const createdReport = await createReport(reportData, user.uid);
      console.log('Report created successfully:', createdReport);

      // Reset form
      setFormData({
        type: "",
        title: "",
        description: "",
        location: "",
        severity: "medium"
      });
      setSelectedImages([]);
      setImagePreviews([]);

      setShowModal(false);
      fetchReports();

      // Show success message
      alert('Report submitted successfully!');
    } catch (error) {
      console.error('Error submitting report:', error);
      alert('Failed to submit report. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

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
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 p-6">
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
            onClick={() => {
              setShowModal(true);
              setSelectedImages([]);
              setImagePreviews([]);
            }}
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
            <div className="flex flex-col md:flex-row gap-3">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <Input
                  type="text"
                  placeholder="Search reports..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>

              <div className="flex gap-2">
                <Button
                  onClick={() => setStatusFilter("all")}
                  className="flex-1 md:flex-none font-semibold"
                  style={{
                    backgroundColor: statusFilter === "all" ? '#E5E7EB' : '#000000',
                    color: statusFilter === "all" ? '#000000' : '#ffffff'
                  }}
                >
                  All
                </Button>
                <Button
                  onClick={() => setStatusFilter("pending")}
                  className="flex-1 md:flex-none font-semibold"
                  style={{
                    backgroundColor: statusFilter === "pending" ? '#FEF3C7' : '#EAB308',
                    color: statusFilter === "pending" ? '#854D0E' : '#ffffff'
                  }}
                >
                  Pending
                </Button>
                <Button
                  onClick={() => setStatusFilter("resolved")}
                  className="flex-1 md:flex-none font-semibold"
                  style={{
                    backgroundColor: statusFilter === "resolved" ? '#BBF7D0' : '#16A34A',
                    color: statusFilter === "resolved" ? '#16A34A' : '#ffffff'
                  }}
                >
                  Resolved
                </Button>
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
                      {report.location}
                    </div>
                  )}

                  <p className="text-sm text-gray-700 line-clamp-3">
                    {report.description}
                  </p>

                  {/* Images Gallery */}
                  {report.images && report.images.length > 0 && (
                    <div className={`grid gap-2 rounded-lg overflow-hidden ${
                      report.images.length === 1 ? 'grid-cols-1' :
                      report.images.length === 2 ? 'grid-cols-2' :
                      'grid-cols-2'
                    }`}>
                      {report.images.slice(0, 4).map((img, idx) => (
                        <div
                          key={idx}
                          className="relative group cursor-pointer overflow-hidden bg-gray-100"
                          style={{ aspectRatio: report.images.length === 1 ? '16/9' : '1/1' }}
                        >
                          <img
                            src={img}
                            alt={`Report image ${idx + 1}`}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                          {idx === 3 && report.images.length > 4 && (
                            <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                              <span className="text-white text-xl font-bold">
                                +{report.images.length - 4}
                              </span>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}

                  {report.severity && (
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-gray-500">Severity:</span>
                      <Badge className={`${
                        severityLevels.find(s => s.value === report.severity)?.color || 'bg-gray-500'
                      } text-white text-xs`}>
                        {report.severity.toUpperCase()}
                      </Badge>
                    </div>
                  )}
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

      {/* Submit Report Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-900">Submit Report</h2>
                <button
                  onClick={() => {
                    setShowModal(false);
                    setSelectedImages([]);
                    setImagePreviews([]);
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Report Type */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Report Type *
                  </label>
                  <select
                    required
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Select type...</option>
                    {reportTypes.map(type => (
                      <option key={type.value} value={type.value}>
                        {type.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Title */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Title (Optional)
                  </label>
                  <Input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="Brief title for your report"
                  />
                </div>

                {/* Description */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Description *
                  </label>
                  <textarea
                    required
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    rows="4"
                    placeholder="Describe the incident in detail..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                {/* Location */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Location (Optional)
                  </label>
                  <Input
                    type="text"
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    placeholder="Specific location or address"
                  />
                </div>

                {/* Severity */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Severity Level
                  </label>
                  <select
                    value={formData.severity}
                    onChange={(e) => setFormData({ ...formData, severity: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    {severityLevels.map(level => (
                      <option key={level.value} value={level.value}>
                        {level.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Image Upload */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Images (Optional - Max 4)
                  </label>
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-4">
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={handleImageSelect}
                      className="hidden"
                      id="image-upload"
                      disabled={selectedImages.length >= 4}
                    />
                    <label
                      htmlFor="image-upload"
                      className={`flex flex-col items-center justify-center cursor-pointer ${
                        selectedImages.length >= 4 ? 'opacity-50 cursor-not-allowed' : ''
                      }`}
                    >
                      <Upload className="w-8 h-8 text-gray-400 mb-2" />
                      <span className="text-sm text-gray-600">
                        {selectedImages.length >= 4
                          ? 'Maximum images reached'
                          : 'Click to upload images'}
                      </span>
                      <span className="text-xs text-gray-500 mt-1">
                        {selectedImages.length}/4 images selected
                      </span>
                    </label>

                    {/* Image Previews */}
                    {imagePreviews.length > 0 && (
                      <div className="grid grid-cols-2 gap-2 mt-4">
                        {imagePreviews.map((preview, index) => (
                          <div key={index} className="relative group">
                            <img
                              src={preview}
                              alt={`Preview ${index + 1}`}
                              className="w-full h-24 object-cover rounded-lg"
                            />
                            <button
                              type="button"
                              onClick={() => removeImage(index)}
                              className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-3 pt-4">
                  <Button
                    type="button"
                    onClick={() => {
                      setShowModal(false);
                      setSelectedImages([]);
                      setImagePreviews([]);
                    }}
                    className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={submitting}
                    className="flex-1 bg-blue-500 hover:bg-blue-600 text-white"
                  >
                    {submitting ? 'Submitting...' : 'Submit Report'}
                  </Button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
