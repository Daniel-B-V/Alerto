import { useState } from "react";
import { X, Upload, MapPin, AlertTriangle, Loader, Plus, CheckCircle } from "lucide-react";
import { createReport } from "../../firebase/firestore";
import { uploadMultipleImagesToCloudinary } from "../../services/cloudinaryService";
import { analyzeReportImages } from "../../services/imageAnalysisService";
import { detectSpamInText, analyzeReportText } from "../../services/textSpamDetection";
import { getCurrentWeather } from "../../services/weatherService";
import { useAuth } from "../../contexts/AuthContext";
import { BATANGAS_MUNICIPALITIES, getBarangays } from "../../constants/batangasLocations";

// Hazard types for dropdown
const HAZARD_TYPES = [
  { value: 'rain', label: 'Heavy Rain' },
  { value: 'flood', label: 'Flooding' },
  { value: 'landslide', label: 'Landslide' },
  { value: 'strong_winds', label: 'Strong Winds' },
  { value: 'power_outage', label: 'Power Outage' },
  { value: 'road_damage', label: 'Road Damage' },
  { value: 'other', label: 'Other' }
];

export function ReportSubmissionModal({ isOpen, onClose, onSubmitSuccess }) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    city: '',
    barangay: '',
    hazardType: '',
    images: []
  });
  const [availableBarangays, setAvailableBarangays] = useState([]);
  const [imagePreview, setImagePreview] = useState([]);

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));

    if (field === 'city') {
      const barangays = getBarangays(value);
      setAvailableBarangays(barangays);
      setFormData(prev => ({ ...prev, barangay: '' }));
    }
  };

  const handleImageChange = (e) => {
    const files = Array.from(e.target.files);
    if (files.length + imagePreview.length > 5) {
      alert('Maximum 5 images allowed');
      return;
    }

    setFormData(prev => ({ ...prev, images: [...prev.images, ...files] }));

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

  const handleSuccessClose = () => {
    setShowSuccessModal(false);
    if (onSubmitSuccess) {
      onSubmitSuccess();
    }
    onClose();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.hazardType || !formData.description || !formData.city || !formData.barangay) {
      alert('Please fill in all required fields');
      return;
    }

    setLoading(true);

    try {
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

      // Fetch weather data for credibility verification
      let weatherData = null;
      try {
        console.log('🌤️ Fetching weather data for:', formData.city);
        weatherData = await getCurrentWeather(formData.city);
        console.log('✅ Weather data fetched:', weatherData);
      } catch (error) {
        console.warn('⚠️ Failed to fetch weather data, continuing without weather verification:', error);
        // Continue submission even if weather fetch fails
      }

      let aiAnalysis = null;
      if (imageUrls.length > 0) {
        aiAnalysis = await analyzeReportImages(
          imageUrls,
          {
            hazardType: formData.hazardType,
            title: formData.title,
            description: formData.description
          },
          weatherData  // Pass weather data as third parameter
        );
      }

      // Helper function to remove undefined values from objects
      const cleanObject = (obj) => {
        if (!obj || typeof obj !== 'object') return obj;

        // Preserve arrays - don't convert them to objects
        if (Array.isArray(obj)) {
          return obj
            .filter(item => item !== undefined)
            .map(item =>
              typeof item === 'object' && item !== null ? cleanObject(item) : item
            );
        }

        const cleaned = {};
        Object.keys(obj).forEach(key => {
          const value = obj[key];
          if (value !== undefined) {
            cleaned[key] = typeof value === 'object' && value !== null && !(value instanceof Date)
              ? cleanObject(value)
              : value;
          }
        });
        return cleaned;
      };

      const textSpamResult = await detectSpamInText({
        title: formData.title,
        description: formData.description,
        hazardType: formData.hazardType
      });
      const textAnalysis = await analyzeReportText({
        title: formData.title,
        description: formData.description,
        hazardType: formData.hazardType,
        location: {
          city: formData.city,
          barangay: formData.barangay,
          province: 'Batangas'
        }
      });

      // Calculate combined AI credibility score
      let aiCredibility = 50; // Default neutral score

      if (aiAnalysis && textAnalysis) {
        // Combine image and text analysis scores (weighted average)
        const imageScore = aiAnalysis.confidence || 50;
        const textScore = textAnalysis.confidence || 50;
        aiCredibility = Math.round((imageScore * 0.6) + (textScore * 0.4));
      } else if (aiAnalysis) {
        aiCredibility = aiAnalysis.confidence || 50;
      } else if (textAnalysis) {
        aiCredibility = textAnalysis.confidence || 50;
      }

      // Reduce credibility if spam detected
      if (textSpamResult?.isSpam) {
        aiCredibility = Math.min(aiCredibility, 30);
      }

      const reportData = cleanObject({
        title: formData.title || `${formData.hazardType} Report`,
        description: formData.description,
        category: formData.hazardType,
        location: {
          city: formData.city,
          barangay: formData.barangay,
          province: 'Batangas'
        },
        images: imageUrls || [],
        weatherSnapshot: weatherData || null,  // Store weather conditions at submission time
        aiAnalysis: aiAnalysis || null,
        textAnalysis: textAnalysis || null,
        aiCredibility: aiCredibility,
        spamScore: textSpamResult?.spamScore ?? 0,
        isSpam: textSpamResult?.isSpam ?? false,
        userId: user?.uid || 'anonymous',
        userName: user?.displayName || 'Anonymous',
        userEmail: user?.email || 'anonymous@alerto.com',
        userPhotoURL: user?.photoURL || null,
        createdAt: new Date()
      });

      await createReport(reportData, user?.uid);

      setFormData({
        title: '',
        description: '',
        city: '',
        barangay: '',
        hazardType: '',
        images: []
      });
      setImagePreview([]);
      setUploadProgress(0);

      setShowSuccessModal(true);
    } catch (error) {
      console.error('Error submitting report:', error);

      // Provide more specific error messages
      let errorMessage = 'Failed to submit report. ';

      if (error.message?.includes('Cloudinary')) {
        errorMessage += 'Image upload failed. Please try again or submit without images.';
      } else if (error.message?.includes('network') || error.message?.includes('fetch')) {
        errorMessage += 'Network error. Please check your internet connection.';
      } else if (error.message?.includes('permission') || error.message?.includes('PERMISSION_DENIED')) {
        errorMessage += 'Permission denied. Please sign in again.';
      } else if (error.code === 'permission-denied') {
        errorMessage += 'You do not have permission to submit reports.';
      } else {
        errorMessage += error.message || 'Please try again.';
      }

      alert(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  // Success Modal
  if (showSuccessModal) {
    return (
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-xl shadow-2xl p-6 text-center" style={{ width: '360px', maxWidth: '90%' }}>
          <div className="flex justify-center mb-4">
            <CheckCircle className="w-16 h-16 text-green-500" />
          </div>
          <h3 className="text-xl font-bold text-gray-800 mb-2">Report Submitted Successfully</h3>
          <p className="text-gray-600 mb-6">Thank you for helping your community stay informed and safe.</p>
          <button
            onClick={handleSuccessClose}
            style={{ backgroundColor: '#2563EB', color: '#FFFFFF' }}
            className="w-full px-6 py-3 hover:bg-blue-700 font-semibold rounded-lg transition-colors"
          >
            OK
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl flex flex-col overflow-hidden" style={{ width: '768px', maxWidth: '90%', height: '90vh' }}>
        {/* Header */}
        <div style={{
          backgroundColor: '#3B82F6',
          padding: '16px 24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexShrink: 0,
          borderTopLeftRadius: '12px',
          borderTopRightRadius: '12px'
        }}>
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-6 h-6 text-white" />
            <div>
              <h2 className="text-xl font-bold text-white">Submit Report</h2>
              <p className="text-sm text-blue-100">Help your community by reporting incidents</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-white hover:bg-white/20 p-2 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Content */}
        <div className="flex-1 overflow-y-auto px-6 py-6">
          <form id="report-form" onSubmit={handleSubmit} className="space-y-4">
            {/* Type of Hazard */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Type of Hazard <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.hazardType}
                onChange={(e) => handleInputChange('hazardType', e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              >
                <option value="">Select hazard type...</option>
                {HAZARD_TYPES.map(hazard => (
                  <option key={hazard.value} value={hazard.value}>{hazard.label}</option>
                ))}
              </select>
            </div>

            {/* Municipality */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Municipality <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.city}
                onChange={(e) => handleInputChange('city', e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              >
                <option value="">Select municipality...</option>
                {BATANGAS_MUNICIPALITIES.map(city => (
                  <option key={city} value={city}>{city}</option>
                ))}
              </select>
            </div>

            {/* Barangay */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Barangay <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.barangay}
                onChange={(e) => handleInputChange('barangay', e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
                required
                disabled={!formData.city}
              >
                <option value="">Select barangay...</option>
                {availableBarangays.map(barangay => (
                  <option key={barangay} value={barangay}>{barangay}</option>
                ))}
              </select>
            </div>

            {/* Title (Optional) */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Title <span className="text-gray-400">(Optional)</span>
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => handleInputChange('title', e.target.value)}
                placeholder="Brief title for your report"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description <span className="text-red-500">*</span>
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                placeholder="Describe the incident in detail (e.g., 'Flood rising near school', 'Roof damage', etc.)..."
                rows={4}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                required
              />
            </div>

            {/* Add Images */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Add Images <span className="text-gray-400">(Optional, up to 5)</span>
              </label>

              <input
                type="file"
                accept="image/*"
                multiple
                onChange={handleImageChange}
                className="hidden"
                id="image-upload"
                disabled={imagePreview.length >= 5}
              />

              {imagePreview.length === 0 ? (
                <label
                  htmlFor="image-upload"
                  className="border-2 border-dashed border-gray-300 rounded-lg p-8 flex flex-col items-center justify-center cursor-pointer hover:border-blue-500 hover:bg-blue-50 transition-all"
                >
                  <Upload className="w-12 h-12 text-blue-500 mb-3" />
                  <p className="text-sm font-medium text-gray-700">Click to upload images</p>
                  <p className="text-xs text-gray-500 mt-1">PNG, JPG up to 10MB</p>
                </label>
              ) : (
                <div className="flex flex-wrap gap-3">
                  {imagePreview.map((img, idx) => (
                    <div key={idx} style={{ position: 'relative', width: '150px', height: '150px' }}>
                      <img
                        src={img.url}
                        alt={`Preview ${idx + 1}`}
                        style={{ width: '150px', height: '150px', objectFit: 'cover', borderRadius: '8px', border: '2px solid #E5E7EB' }}
                      />
                      <button
                        type="button"
                        onClick={() => removeImage(idx)}
                        style={{
                          position: 'absolute',
                          top: '-6px',
                          right: '-6px',
                          backgroundColor: '#EF4444',
                          color: 'white',
                          borderRadius: '50%',
                          padding: '4px',
                          border: 'none',
                          cursor: 'pointer',
                          boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
                          transition: 'background-color 0.2s',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}
                        onMouseOver={(e) => e.target.style.backgroundColor = '#DC2626'}
                        onMouseOut={(e) => e.target.style.backgroundColor = '#EF4444'}
                      >
                        <X style={{ width: '12px', height: '12px' }} />
                      </button>
                    </div>
                  ))}

                  {imagePreview.length < 5 && (
                    <label
                      htmlFor="image-upload"
                      style={{ width: '150px', height: '150px' }}
                      className="border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center cursor-pointer hover:border-blue-500 hover:bg-blue-50 transition-all"
                    >
                      <Plus className="w-6 h-6 text-blue-500 mb-1" />
                      <p className="text-xs text-gray-600 font-medium">Add More</p>
                      <p className="text-xs text-gray-400">{imagePreview.length}/5</p>
                    </label>
                  )}
                </div>
              )}
            </div>

            {/* Upload Progress */}
            {loading && uploadProgress > 0 && uploadProgress < 100 && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-center gap-2 text-blue-700 mb-2">
                  <Loader className="w-5 h-5 animate-spin" />
                  <span className="text-sm font-medium">Uploading images... {uploadProgress}%</span>
                </div>
                <div className="w-full bg-blue-200 rounded-full h-2">
                  <div
                    className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
              </div>
            )}
          </form>
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 p-6 bg-white flex-shrink-0">
          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              style={{ backgroundColor: '#6B7280', color: '#FFFFFF' }}
              className="flex-1 px-6 py-3 hover:bg-gray-600 font-semibold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Cancel
            </button>
            <button
              type="submit"
              form="report-form"
              disabled={loading || !formData.description || !formData.city || !formData.barangay || !formData.hazardType}
              style={{ backgroundColor: '#2563EB', color: '#FFFFFF' }}
              className="flex-1 px-6 py-3 hover:bg-blue-700 font-semibold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader className="w-5 h-5 animate-spin" />
                  <span>Submitting...</span>
                </>
              ) : (
                <>
                  <MapPin className="w-5 h-5" />
                  <span>Submit Report</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
