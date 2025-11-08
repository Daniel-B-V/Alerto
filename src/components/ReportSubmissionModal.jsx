import { useState } from "react";
import { X, Upload, MapPin, AlertTriangle, Loader } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { createReport } from "../firebase/firestore";
import { uploadMultipleImagesToCloudinary } from "../services/cloudinaryService";
import { useAuth } from "../contexts/AuthContext";

const REPORT_CATEGORIES = [
  { value: 'flooding', label: 'Flooding', icon: '🌊' },
  { value: 'heavy_rain', label: 'Heavy Rain', icon: '🌧️' },
  { value: 'landslide', label: 'Landslide', icon: '⛰️' },
  { value: 'strong_wind', label: 'Strong Wind', icon: '💨' },
  { value: 'storm', label: 'Storm/Typhoon', icon: '🌀' },
  { value: 'road_blockage', label: 'Road Blockage', icon: '🚧' },
  { value: 'power_outage', label: 'Power Outage', icon: '⚡' },
  { value: 'infrastructure', label: 'Infrastructure Damage', icon: '🏗️' },
  { value: 'other', label: 'Other', icon: '📋' }
];

const BATANGAS_CITIES = [
  'Batangas City', 'Lipa City', 'Tanauan City', 'Sto. Tomas',
  'Calamba', 'San Pablo', 'Taal', 'Lemery', 'Balayan',
  'Bauan', 'Mabini', 'San Juan', 'Rosario', 'Taysan',
  'Lobo', 'Mataas na Kahoy', 'Cuenca', 'Alitagtag',
  'Malvar', 'Laurel', 'Agoncillo', 'San Nicolas', 'Santa Teresita',
  'Talisay', 'San Luis', 'Ibaan', 'Padre Garcia', 'Tingloy',
  'Calatagan', 'Lian', 'Nasugbu', 'Other'
];

export function ReportSubmissionModal({ isOpen, onClose, onSubmitSuccess }) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [formData, setFormData] = useState({
    category: '',
    title: '',
    description: '',
    city: '',
    barangay: '',
    specificLocation: '',
    images: []
  });
  const [imagePreview, setImagePreview] = useState([]);

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

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

  const removeImage = (index) => {
    setFormData(prev => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index)
    }));
    setImagePreview(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.category || !formData.description || !formData.city) {
      alert('Please fill in all required fields');
      return;
    }

    setLoading(true);

    try {
      // Upload images to Cloudinary
      let imageUrls = [];
      if (formData.images.length > 0) {
        const uploadResults = await uploadMultipleImagesToCloudinary(
          formData.images,
          (current, total) => {
            setUploadProgress(Math.round((current / total) * 100));
          }
        );
        imageUrls = uploadResults.map(result => result.url);
      }

      // Create report in Firestore
      const reportData = {
        title: formData.title || `${formData.category} in ${formData.city}`,
        description: formData.description,
        category: formData.category,
        location: {
          city: formData.city,
          barangay: formData.barangay || '',
          specificLocation: formData.specificLocation || ''
        },
        images: imageUrls,
        userName: user?.displayName || 'Anonymous',
        userEmail: user?.email || '',
        userPhotoURL: user?.photoURL || '',
        userVerified: user?.emailVerified || false,
        tags: [formData.category, formData.city],
        status: 'pending'
      };

      await createReport(reportData, user.uid);

      // Reset form
      setFormData({
        category: '',
        title: '',
        description: '',
        city: '',
        barangay: '',
        specificLocation: '',
        images: []
      });
      setImagePreview([]);
      setUploadProgress(0);

      if (onSubmitSuccess) {
        onSubmitSuccess();
      }

      // Show success modal
      onClose();
      setShowSuccessModal(true);

      // Auto-hide success modal after 3 seconds
      setTimeout(() => {
        setShowSuccessModal(false);
      }, 3000);

    } catch (error) {
      console.error('Error submitting report:', error);
      alert('Failed to submit report. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen && !showSuccessModal) return null;

  return (
    <>
      {/* Success Modal */}
      {showSuccessModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60]">
          <Card className="max-w-md w-full mx-4 bg-white shadow-2xl animate-in fade-in zoom-in duration-300">
            <CardContent className="p-8 text-center">
              <div className="mb-4 flex justify-center">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                  <svg className="w-10 h-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-2">Report Submitted!</h3>
              <p className="text-gray-600 mb-4">
                Your report has been successfully submitted and is now being reviewed.
              </p>
              <Badge className="bg-green-500 text-white px-4 py-1">
                Status: Pending Review
              </Badge>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Report Submission Modal */}
      {isOpen && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="max-w-2xl w-full my-6">
        <Card className="w-full max-h-[90vh] overflow-y-auto shadow-2xl">
          <CardHeader className="border-b-2 sticky top-0 bg-gradient-to-r from-blue-600 to-blue-700 z-10 shadow-lg p-5">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <CardTitle className="text-xl font-bold flex items-center gap-3 text-white">
                  <AlertTriangle className="w-6 h-6 flex-shrink-0" />
                  <span>Submit Report</span>
                </CardTitle>
                <p className="text-sm text-blue-100 mt-1">
                  Help your community by reporting incidents
                </p>
              </div>
              <button
                onClick={onClose}
                className="p-2 hover:bg-white/20 rounded-full transition-colors flex-shrink-0 text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </CardHeader>

          <CardContent className="p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Category Selection - Two Columns */}
            <div>
              <label className="block text-sm font-semibold text-gray-800 mb-3">
                Report Categories <span className="text-red-500">*</span>
                <span className="text-xs font-normal text-gray-500 ml-2">(Select all that apply)</span>
              </label>
              <div className="grid grid-cols-2 gap-3">
                {REPORT_CATEGORIES.map((cat, index) => (
                  <label
                    key={cat.value}
                    className={`flex items-center p-3 border-2 rounded-lg cursor-pointer transition-all ${
                      formData.category === cat.value
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-blue-300 hover:bg-gray-50'
                    } ${index === 3 ? 'col-span-2' : ''}`}
                  >
                    <input
                      type="radio"
                      name="category"
                      value={cat.value}
                      checked={formData.category === cat.value}
                      onChange={(e) => handleInputChange('category', e.target.value)}
                      className="sr-only"
                    />
                    <span className="text-2xl mr-3">{cat.icon}</span>
                    <span className={`text-sm font-medium ${
                      formData.category === cat.value ? 'text-blue-700' : 'text-gray-700'
                    }`}>
                      {cat.label}
                    </span>
                  </label>
                ))}
              </div>
            </div>

            {/* City/Municipality */}
            <div>
              <label className="block text-sm font-semibold text-gray-800 mb-2">
                City/Municipality <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.city}
                onChange={(e) => handleInputChange('city', e.target.value)}
                className="w-full px-4 py-3 text-sm border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              >
                <option value="">Select location...</option>
                {BATANGAS_CITIES.map(city => (
                  <option key={city} value={city}>{city}</option>
                ))}
              </select>
            </div>

            {/* Title */}
            <div>
              <label className="block text-sm font-semibold text-gray-800 mb-2">
                Title (Optional)
              </label>
              <input
                type="text"
                placeholder="Brief title for your report"
                value={formData.title}
                onChange={(e) => handleInputChange('title', e.target.value)}
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
                placeholder="Describe the incident in detail..."
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                rows={4}
                className="w-full px-4 py-3 text-sm border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                required
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

            {/* Upload Progress */}
            {loading && uploadProgress > 0 && uploadProgress < 100 && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-center gap-2 text-blue-700 mb-2">
                  <Loader className="w-5 h-5 animate-spin" />
                  <span className="font-medium">Uploading images... {uploadProgress}%</span>
                </div>
                <div className="w-full bg-blue-200 rounded-full h-2">
                  <div
                    className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
              </div>
            )}

            {/* Submit Buttons */}
            <div className="flex gap-3 pt-6 border-t-2 border-gray-100 mt-6">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                disabled={loading}
                className="flex-1 h-12 border-2 border-gray-300 hover:bg-gray-100 font-medium"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={loading || !formData.category || !formData.description || !formData.city}
                className="flex-1 h-12 bg-blue-600 hover:bg-blue-700 text-white font-medium shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
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
        </CardContent>
        </Card>
      </div>
      </div>
      )}
    </>
  );
}
