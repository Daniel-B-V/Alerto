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
  X,
  Upload,
  Loader
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { useAuth } from "../contexts/AuthContext";
import { createReport, getUserReports } from "../firebase/firestore";

export function UserReportsPage() {
  const { user } = useAuth();
  const [reports, setReports] = useState([]);
  const [filteredReports, setFilteredReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [submitting, setSubmitting] = useState(false);

  // Helper function to convert location to string
  const getLocationString = (location) => {
    if (!location) return '';
    if (typeof location === 'string') return location;
    if (typeof location === 'object') {
      return location.province || location.city || location.country || '';
    }
    return String(location);
  };

  // Form state
  const [formData, setFormData] = useState({
    types: [], // Changed back to array for multiple selection
    title: "",
    description: "",
    location: "",
    images: []
  });
  const [imagePreview, setImagePreview] = useState([]);

  const reportTypes = [
    { value: "flooding", label: "Flooding" },
    { value: "power_outage", label: "Power Outage" },
    { value: "road_accident", label: "Road Accident" },
    { value: "fire", label: "Fire Incident" },
    { value: "landslide", label: "Landslide" },
    { value: "heavy_rain", label: "Heavy Rain" },
    { value: "strong_wind", label: "Strong Wind" },
    { value: "other", label: "Other" }
  ];

  const batangasCities = [
    "Agoncillo", "Alitagtag", "Balayan", "Balete", "Batangas City", "Bauan",
    "Calaca", "Calatagan", "Cuenca", "Ibaan", "Laurel", "Lemery",
    "Lian", "Lipa City", "Lobo", "Mabini", "Malvar", "Mataasnakahoy",
    "Nasugbu", "Padre Garcia", "Rosario", "San Jose", "San Juan",
    "San Luis", "San Nicolas", "San Pascual", "Santa Teresita", "Santo Tomas",
    "Taal", "Talisay", "Tanauan City", "Taysan", "Tingloy", "Tuy"
  ];

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

  // Handle category checkbox change
  const handleCategoryChange = (categoryValue) => {
    setFormData(prev => {
      const types = prev.types.includes(categoryValue)
        ? prev.types.filter(t => t !== categoryValue)
        : [...prev.types, categoryValue];
      return { ...prev, types };
    });
  };

  // Handle image selection
  const handleImageChange = (e) => {
    const files = Array.from(e.target.files);
    if (files.length + imagePreview.length > 5) {
      alert('Maximum 5 images allowed');
      return;
    }

    setFormData(prev => ({ ...prev, images: [...prev.images, ...files] }));

    // Create previews
    files.forEach(file => {
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreview(prev => [...prev, { file, url: e.target.result }]);
      };
      reader.readAsDataURL(file);
    });
  };

  // Remove image
  const removeImage = (index) => {
    setFormData(prev => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index)
    }));
    setImagePreview(prev => prev.filter((_, i) => i !== index));
  };

  // Handle form submit
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!user) return;

    // Validate at least one category is selected
    if (formData.types.length === 0) {
      alert('Please select at least one report category.');
      return;
    }

    setSubmitting(true);
    try {
      // Validate location is selected
      if (!formData.location) {
        alert('Please select a city/municipality.');
        setSubmitting(false);
        return;
      }

      // Create title from selected categories if not provided
      const categoryLabels = formData.types.map(type =>
        reportTypes.find(rt => rt.value === type)?.label || type
      ).join(', ');

      const reportData = {
        title: formData.title || `${categoryLabels} in ${formData.location}`,
        description: formData.description,
        category: formData.types[0], // Primary category
        categories: formData.types, // All selected categories
        location: {
          city: formData.location,
          province: 'Batangas',
          country: 'Philippines'
        },
        tags: [...formData.types, formData.location],
        status: 'pending',
        userName: user.displayName || user.email || 'Anonymous',
        userPhotoURL: user.photoURL || null,
        userEmail: user.email,
        userVerified: user.emailVerified || false
      };

      const createdReport = await createReport(reportData, user.uid);
      console.log('Report created successfully:', createdReport);

      // Reset form
      setFormData({
        types: [],
        title: "",
        description: "",
        location: "",
        images: []
      });
      setImagePreview([]);

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
                        const categoryLabel = reportTypes.find(rt => rt.value === cat)?.label || cat;
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

      {/* Submit Report Modal */}
      {showModal && (
        <div
          className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4"
          onClick={() => setShowModal(false)}
        >
          <div
            className="bg-white rounded-xl shadow-xl flex flex-col overflow-hidden"
            style={{ width: '850px', maxWidth: '90vw', maxHeight: '90vh' }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="border-b-2 bg-gradient-to-r from-blue-600 to-blue-700 flex-shrink-0 px-6 pt-5 pb-4 shadow-lg">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-white">Submit Report</h2>
                <button
                  onClick={() => setShowModal(false)}
                  className="text-white hover:bg-white/20 rounded-full p-2 transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
              <p className="text-sm text-blue-100 mt-1">
                Help your community by reporting incidents
              </p>
            </div>

            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto p-6">
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Report Categories - Two Columns with Checkboxes */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Report Categories * (Select all that apply)
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    {reportTypes.map((type) => (
                      <label
                        key={type.value}
                        className="flex items-center gap-2 p-3 border border-gray-300 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
                      >
                        <input
                          type="checkbox"
                          checked={formData.types.includes(type.value)}
                          onChange={() => handleCategoryChange(type.value)}
                          className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                        />
                        <span className="text-sm text-gray-700">{type.label}</span>
                      </label>
                    ))}
                  </div>
                  {formData.types.length > 0 && (
                    <p className="text-xs text-gray-500 mt-2">
                      Selected: {formData.types.map(t => reportTypes.find(rt => rt.value === t)?.label).join(', ')}
                    </p>
                  )}
                </div>

                {/* City/Municipality */}
                <div>
                  <label className="block text-sm font-semibold text-gray-800 mb-2">
                    City/Municipality <span className="text-red-500">*</span>
                  </label>
                  <select
                    required
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    className="w-full px-4 py-3 text-sm border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Select location...</option>
                    {batangasCities.map(city => (
                      <option key={city} value={city}>
                        {city}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Title */}
                <div>
                  <label className="block text-sm font-semibold text-gray-800 mb-2">
                    Title (Optional)
                  </label>
                  <Input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="Brief title for your report"
                    className="w-full px-4 py-3 text-sm border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <p className="text-xs text-gray-500 mt-1.5">
                    Leave blank to auto-generate from selected categories
                  </p>
                </div>

                {/* Description */}
                <div>
                  <label className="block text-sm font-semibold text-gray-800 mb-2">
                    Description <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    required
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    rows="4"
                    placeholder="Describe the incident in detail..."
                    className="w-full px-4 py-3 text-sm border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                  />
                </div>

                {/* Image Upload */}
                <div>
                  <label className="block text-sm font-semibold text-gray-800 mb-2">
                    Add Images (Optional)
                  </label>
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-blue-400 hover:bg-blue-50/30 transition-all cursor-pointer">
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={handleImageChange}
                      className="hidden"
                      id="image-upload"
                      disabled={imagePreview.length >= 5}
                    />
                    <label
                      htmlFor="image-upload"
                      className="cursor-pointer flex flex-col items-center"
                    >
                      <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center mb-3">
                        <Upload className="w-6 h-6 text-blue-600" />
                      </div>
                      <p className="text-sm font-medium text-gray-700 mb-1">
                        Click to upload images
                      </p>
                      <p className="text-xs text-gray-500">
                        PNG, JPG up to 10MB • {imagePreview.length}/5 uploaded
                      </p>
                    </label>
                  </div>

                  {/* Image Previews */}
                  {imagePreview.length > 0 && (
                    <div className="grid grid-cols-5 gap-3 mt-4">
                      {imagePreview.map((img, idx) => (
                        <div key={idx} className="relative group">
                          <img
                            src={img.url}
                            alt={`Preview ${idx + 1}`}
                            className="w-full h-20 object-cover rounded-lg border-2 border-gray-200"
                          />
                          <button
                            type="button"
                            onClick={() => removeImage(idx)}
                            className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1.5 opacity-0 group-hover:opacity-100 transition-opacity shadow-lg hover:bg-red-600"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="flex gap-3 pt-6 border-t-2 border-gray-100 mt-6">
                  <Button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="flex-1 h-12 bg-gray-500 hover:bg-gray-600 text-white font-medium"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={submitting || formData.types.length === 0 || !formData.description || !formData.location}
                    className="flex-1 h-12 bg-blue-500 hover:bg-blue-600 text-white font-medium shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {submitting ? (
                      <>
                        <Loader className="w-5 h-5 mr-2 animate-spin" />
                        Submitting...
                      </>
                    ) : (
                      <>
                        <MapPin className="w-5 h-5 mr-2" />
                        Submit Report
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
