import { useState } from "react";
import { X, Upload, MapPin, AlertTriangle, Loader } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { createReport } from "../../firebase/firestore";
import { uploadMultipleImagesToCloudinary } from "../../services/cloudinaryService";
import { analyzeReportImages } from "../../services/imageAnalysisService";
import { useAuth } from "../../contexts/AuthContext";
import { CATEGORY_CONFIG, CATEGORIES } from "../../constants/categorization";
import { BATANGAS_MUNICIPALITIES, getBarangays } from "../../constants/batangasLocations";

// Hazard types for dropdown
const HAZARD_TYPES = [
  { value: 'rain', label: '🌧️ Heavy Rain' },
  { value: 'flood', label: '🌊 Flooding' },
  { value: 'landslide', label: '⛰️ Landslide' },
  { value: 'strong_winds', label: '💨 Strong Winds' },
  { value: 'power_outage', label: '⚡ Power Outage' },
  { value: 'road_damage', label: '🚧 Road Damage' },
  { value: 'other', label: '📋 Other' }
];


export function ReportSubmissionModal({ isOpen, onClose, onSubmitSuccess }) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [formData, setFormData] = useState({
    reporterName: '',
    title: '',
    description: '',
    city: '',
    barangay: '',
    specificLocation: '',
    hazardType: '',
    images: []
  });
  const [availableBarangays, setAvailableBarangays] = useState([]);
  const [imagePreview, setImagePreview] = useState([]);

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Update barangays when city changes
    if (field === 'city') {
      const barangays = getBarangays(value);
      setAvailableBarangays(barangays);
      setFormData(prev => ({ ...prev, barangay: '' })); // Reset barangay
    }
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

    if (!formData.hazardType || !formData.description || !formData.city || !formData.barangay) {
      alert('Please fill in all required fields (Hazard Type, Municipality, Barangay, and Description)');
      return;
    }

    setLoading(true);

    try {
      // Upload images to Cloudinary
      let imageUrls = [];
      if (formData.images.length > 0) {
        try {
          const uploadResults = await uploadMultipleImagesToCloudinary(
            formData.images,
            (current, total) => {
              setUploadProgress(Math.round((current / total) * 100));
            }
          );
          imageUrls = uploadResults.map(result => result.url);
        } catch (uploadError) {
          console.error('Image upload error:', uploadError);
          alert('Failed to upload images. Submitting report without images.');
        }
      }

      // Fetch current weather data for the location
      let weatherData = null;
      if (formData.city) {
        try {
          const weatherResponse = await fetch(
            `https://api.openweathermap.org/data/2.5/weather?q=${formData.city},PH&appid=895284fb2d2c50a520ea537456963d9c&units=metric`
          );
          if (weatherResponse.ok) {
            const weather = await weatherResponse.json();
            weatherData = {
              temp: weather.main.temp,
              feels_like: weather.main.feels_like,
              humidity: weather.main.humidity,
              pressure: weather.main.pressure,
              weather_main: weather.weather[0].main,
              weather_description: weather.weather[0].description,
              wind_speed: weather.wind.speed,
              clouds: weather.clouds.all,
              visibility: weather.visibility,
              rain_1h: weather.rain?.['1h'] || 0
            };
          }
        } catch (error) {
          console.error('Error fetching weather data:', error);
          // Continue without weather data
        }
      }

      // Analyze images with Gemini AI (with weather data cross-reference)
      let imageAnalysis = null;
      if (imageUrls.length > 0) {
        try {
          setUploadProgress(0);
          imageAnalysis = await analyzeReportImages(
            imageUrls, 
            {
              hazardType: formData.hazardType,
              title: formData.title,
              description: formData.description,
              location: {
                city: formData.city,
                barangay: formData.barangay
              }
            },
            weatherData // Pass actual weather conditions
          );
          console.log('Image Analysis Result:', imageAnalysis);
          console.log('Weather Data Used:', weatherData);
        } catch (analysisError) {
          console.error('Image analysis error:', analysisError);
          // Continue without image analysis
          imageAnalysis = {
            credible: true,
            confidence: 50,
            reason: 'Image analysis unavailable',
            matchesReport: 'unknown',
            detectedHazards: []
          };
        }
      }

      // Create report in Firestore with AI analysis
      const reportData = {
        reporterName: formData.reporterName || 'Anonymous',
        title: formData.title || `${formData.hazardType} in ${formData.city}`,
        description: formData.description,
        category: formData.hazardType, // Use hazardType as category
        hazardType: formData.hazardType,
        location: {
          city: formData.city,
          barangay: formData.barangay || '',
          specificLocation: formData.specificLocation || ''
        },
        images: imageUrls || [],
        userName: user?.displayName || 'Anonymous',
        userEmail: user?.email || '',
        userPhotoURL: user?.photoURL || '',
        userVerified: user?.emailVerified || false,
        tags: [formData.hazardType, formData.city],
        // AI Image Analysis Results (simplified)
        aiCredibility: imageAnalysis ? imageAnalysis.confidence : null,
        aiReason: imageAnalysis ? imageAnalysis.reason : null,
        aiMatchesReport: imageAnalysis ? imageAnalysis.matchesReport : null,
        imageAnalysis: imageAnalysis || null
      };

      console.log('Attempting to create report with data:', reportData);
      await createReport(reportData, user.uid);
      console.log('Report created successfully!');

      // Reset form
      setFormData({
        reporterName: '',
        title: '',
        description: '',
        city: '',
        barangay: '',
        specificLocation: '',
        hazardType: '',
        images: []
      });
      setAvailableBarangays([]);
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
      console.error('Error details:', error.message, error.stack);
      alert(`Failed to submit report: ${error.message || 'Unknown error'}. Please try again.`);
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
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div 
            className="bg-white rounded-lg shadow-2xl"
            style={{ 
              width: '800px', 
              height: '85vh',
              maxWidth: '95vw', 
              maxHeight: '90vh', 
              display: 'grid',
              gridTemplateRows: 'auto 1fr auto'
            }}
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-4 rounded-t-lg">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 text-white">
                    <AlertTriangle className="w-6 h-6" />
                    <h2 className="text-xl font-bold">Submit Report</h2>
                  </div>
                  <p className="text-sm text-blue-100 mt-1">
                    Help your community by reporting incidents
                  </p>
                </div>
                <button
                  type="button"
                  onClick={onClose}
                  className="p-2 hover:bg-white/20 rounded-full transition-colors text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Scrollable Content */}
            <div className="overflow-y-auto px-6 py-4">
          <form id="report-form" onSubmit={handleSubmit} className="space-y-4">
            {/* Two Column Grid */}
            <div className="grid grid-cols-2 gap-4">
              {/* Reporter Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Reporter Name <span className="text-gray-400">(Optional)</span>
                </label>
                <input
                  type="text"
                  placeholder="Your name or 'Anonymous'"
                  value={formData.reporterName}
                  onChange={(e) => handleInputChange('reporterName', e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              {/* Type of Hazard */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Type of Hazard <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.hazardType}
                  onChange={(e) => handleInputChange('hazardType', e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                >
                  <option value="">Select hazard type...</option>
                  {HAZARD_TYPES.map(hazard => (
                    <option key={hazard.value} value={hazard.value}>{hazard.label}</option>
                  ))}
                </select>
              </div>

              {/* City/Municipality */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Municipality <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.city}
                  onChange={(e) => handleInputChange('city', e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
                  required
                  disabled={!formData.city}
                >
                  <option value="">Select barangay...</option>
                  {availableBarangays.map(barangay => (
                    <option key={barangay} value={barangay}>{barangay}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Title - Full Width */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Title <span className="text-gray-400">(Optional)</span>
              </label>
              <input
                type="text"
                placeholder="Brief title for your report"
                value={formData.title}
                onChange={(e) => handleInputChange('title', e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Description - Full Width */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description <span className="text-red-500">*</span>
              </label>
              <textarea
                placeholder="Describe the incident in detail (e.g., 'Flood rising near school', 'Roof damage', etc.)..."
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                rows={4}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                required
              />
            </div>

            {/* Image Upload */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Add Images <span className="text-gray-400">(Optional)</span>
              </label>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-blue-400 hover:bg-blue-50 transition-all cursor-pointer">
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
                  <Upload className="w-10 h-10 text-blue-500 mb-3" />
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
                <div className="flex flex-wrap gap-2 mt-3">
                  {imagePreview.map((img, idx) => (
                    <div key={idx} className="relative group" style={{ width: '100px', height: '100px' }}>
                      <img
                        src={img.url}
                        alt={`Preview ${idx + 1}`}
                        style={{
                          width: '100px',
                          height: '100px',
                          objectFit: 'cover',
                          borderRadius: '0.375rem',
                          border: '1px solid #d1d5db'
                        }}
                      />
                      <button
                        type="button"
                        onClick={() => removeImage(idx)}
                        style={{
                          position: 'absolute',
                          top: '-4px',
                          right: '-4px',
                          backgroundColor: '#ef4444',
                          color: 'white',
                          borderRadius: '50%',
                          padding: '4px',
                          border: 'none',
                          cursor: 'pointer',
                          opacity: 0,
                          transition: 'opacity 0.2s'
                        }}
                        onMouseOver={(e) => e.currentTarget.style.opacity = '1'}
                        onMouseOut={(e) => e.currentTarget.style.opacity = '0'}
                        className="group-hover:opacity-100"
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

          </form>
            </div>

            {/* Footer - ALWAYS VISIBLE */}
            <div style={{ 
              borderTop: '1px solid #e5e7eb',
              padding: '1rem 1.5rem',
              backgroundColor: '#f9fafb',
              borderBottomLeftRadius: '0.5rem',
              borderBottomRightRadius: '0.5rem'
            }}>
              <div style={{ display: 'flex', gap: '0.75rem' }}>
                <button
                  type="button"
                  onClick={onClose}
                  disabled={loading}
                  style={{
                    flex: 1,
                    padding: '0.75rem 1.5rem',
                    backgroundColor: '#6b7280',
                    color: 'white',
                    fontWeight: '600',
                    borderRadius: '0.375rem',
                    border: 'none',
                    cursor: 'pointer'
                  }}
                  onMouseOver={(e) => e.target.style.backgroundColor = '#4b5563'}
                  onMouseOut={(e) => e.target.style.backgroundColor = '#6b7280'}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  form="report-form"
                  disabled={loading || !formData.description || !formData.city || !formData.barangay || !formData.hazardType}
                  style={{
                    flex: 1,
                    padding: '0.75rem 1.5rem',
                    backgroundColor: '#2563eb',
                    color: 'white',
                    fontWeight: '600',
                    borderRadius: '0.375rem',
                    border: 'none',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.5rem'
                  }}
                  onMouseOver={(e) => e.target.style.backgroundColor = '#1d4ed8'}
                  onMouseOut={(e) => e.target.style.backgroundColor = '#2563eb'}
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
      )}
    </>
  );
}
