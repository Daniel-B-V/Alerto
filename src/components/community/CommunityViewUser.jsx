import { useState, useEffect } from "react";
import {
  Users,
  Megaphone,
  Shield,
  MapPin,
  Eye,
  CheckCircle,
  Clock,
  AlertCircle,
  ChevronRight,
  Calendar,
  ChevronLeft,
  X
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { useAuth } from "../../contexts/AuthContext";
import { getReports } from "../../firebase/firestore";
import { collection, query, where, orderBy, limit as limitQuery, getDocs } from "firebase/firestore";
import { db } from "../../firebase";

export function CommunityViewUser() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("community");
  const [communityReports, setCommunityReports] = useState([]);
  const [mayorAnnouncements, setMayorAnnouncements] = useState([]);
  const [governorAnnouncements, setGovernorAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxImages, setLightboxImages] = useState([]);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  // Fetch community reports
  const fetchCommunityReports = async () => {
    try {
      const reports = await getReports({
        status: 'verified',
        limit: 50
      });
      setCommunityReports(reports);
    } catch (error) {
      console.error('Error fetching community reports:', error);
    }
  };

  // Fetch mayor announcements
  const fetchMayorAnnouncements = async () => {
    try {
      const announcementsRef = collection(db, 'announcements');
      const q = query(
        announcementsRef,
        where('type', '==', 'mayor'),
        orderBy('createdAt', 'desc'),
        limitQuery(20)
      );
      const snapshot = await getDocs(q);
      const announcements = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setMayorAnnouncements(announcements);
    } catch (error) {
      console.error('Error fetching mayor announcements:', error);
      setMayorAnnouncements([]);
    }
  };

  // Fetch governor announcements
  const fetchGovernorAnnouncements = async () => {
    try {
      const announcementsRef = collection(db, 'announcements');
      const q = query(
        announcementsRef,
        where('type', '==', 'governor'),
        orderBy('createdAt', 'desc'),
        limitQuery(20)
      );
      const snapshot = await getDocs(q);
      const announcements = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setGovernorAnnouncements(announcements);
    } catch (error) {
      console.error('Error fetching governor announcements:', error);
      setGovernorAnnouncements([]);
    }
  };

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await Promise.all([
        fetchCommunityReports(),
        fetchMayorAnnouncements(),
        fetchGovernorAnnouncements()
      ]);
      setLoading(false);
    };
    loadData();
  }, []);

  const formatTimestamp = (timestamp) => {
    if (!timestamp) return '';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  // Helper function to get user avatar color
  const getUserColor = (name) => {
    const colors = [
      '#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981',
      '#6366f1', '#f97316', '#06b6d4', '#84cc16', '#a855f7'
    ];
    if (!name) return colors[0];
    const hash = name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return colors[hash % colors.length];
  };

  // Lightbox functions
  const openLightbox = (images, index = 0) => {
    setLightboxImages(images);
    setCurrentImageIndex(index);
    setLightboxOpen(true);
  };

  const closeLightbox = () => {
    setLightboxOpen(false);
    setLightboxImages([]);
    setCurrentImageIndex(0);
  };

  const nextImage = () => {
    setCurrentImageIndex((prev) => (prev + 1) % lightboxImages.length);
  };

  const prevImage = () => {
    setCurrentImageIndex((prev) => (prev - 1 + lightboxImages.length) % lightboxImages.length);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading community updates...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2 flex items-center gap-3">
          <Users className="w-8 h-8 text-blue-500" />
          Community Hub
        </h1>
        <p className="text-gray-600">
          Stay updated with community reports and official announcements
        </p>
      </div>

      {/* Tabs and Content Container */}
      <Card>
        {/* Filter Tabs */}
        <CardContent className="px-4 pt-4 pb-2">
          <div className="flex gap-2">
            <button
              onClick={() => setActiveTab("community")}
              className={`px-4 py-2 text-sm font-medium rounded-md border transition-all ${
                activeTab === "community"
                  ? 'bg-white text-gray-900 border-gray-300'
                  : 'bg-transparent text-gray-600 border-transparent hover:text-gray-900'
              }`}
            >
              Community Reports
            </button>
            <button
              onClick={() => setActiveTab("mayor")}
              className={`px-4 py-2 text-sm font-medium rounded-md border transition-all ${
                activeTab === "mayor"
                  ? 'bg-white text-gray-900 border-gray-300'
                  : 'bg-transparent text-gray-600 border-transparent hover:text-gray-900'
              }`}
            >
              Mayor Announcements
            </button>
            <button
              onClick={() => setActiveTab("governor")}
              className={`px-4 py-2 text-sm font-medium rounded-md border transition-all ${
                activeTab === "governor"
                  ? 'bg-white text-gray-900 border-gray-300'
                  : 'bg-transparent text-gray-600 border-transparent hover:text-gray-900'
              }`}
            >
              Governor Announcements
            </button>
          </div>
        </CardContent>

        {/* Tab Content */}
        <div className="border-t border-gray-200">
        {/* Community Reports Tab */}
        {activeTab === "community" && (
          <>
            {communityReports.length === 0 ? (
              <CardContent className="p-12 text-center">
                <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-700 mb-2">
                  No community reports yet
                </h3>
                <p className="text-gray-500">
                  Verified community reports will appear here
                </p>
              </CardContent>
            ) : (
              <CardContent className="p-4">
                <div className="grid grid-cols-1 gap-4">
                {communityReports.map((report) => (
                  <Card key={report.id} className="hover:shadow-lg transition-shadow duration-200">
                    <CardContent className="p-4">
                      {/* Top Row: Reporter info (left) + Status Badge (right) */}
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
                                alt={report.userName || report.user?.name}
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
                                  backgroundColor: getUserColor(report.userName || report.user?.name || 'Anonymous'),
                                  backgroundImage: `linear-gradient(to bottom right, ${getUserColor(report.userName || report.user?.name || 'Anonymous')}, ${getUserColor(report.userName || report.user?.name || 'Anonymous')}dd)`,
                                  color: 'white',
                                  fontWeight: 'bold',
                                  fontSize: '16px'
                                }}
                              >
                                {(report.userName || report.user?.name || 'U').split(' ').map(n => n[0]).join('').toUpperCase()}
                              </div>
                            )}
                          </div>

                          <div className="flex-1 min-w-0">
                            <div className="font-semibold text-gray-900 text-base">
                              {report.userName || report.user?.name || 'Anonymous User'}
                            </div>
                            <div className="flex items-center gap-1 text-xs text-gray-500">
                              <MapPin className="w-3 h-3" />
                              <span>
                                {report.location?.barangay
                                  ? `${report.location.barangay}, ${report.location.city}`
                                  : report.location?.city || 'Unknown'}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Right: Status Badge */}
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <Badge className="bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs px-2.5 py-1 font-medium">
                            ✓ Verified
                          </Badge>
                        </div>
                      </div>

                      {/* Content Row: Title + Description (left) + Images (right) */}
                      <div className="flex gap-4 mb-3">
                        {/* Left: Title + Description */}
                        <div className="flex-1 min-w-0">
                          {/* Report Title */}
                          {report.title && (
                            <h3 className="text-lg font-bold text-gray-900 mb-1.5">
                              {report.title}
                            </h3>
                          )}

                          {/* Report Description */}
                          <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">
                            {report.description}
                          </p>
                        </div>

                        {/* Right: Image Thumbnails */}
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
                                onClick={() => openLightbox(report.images, idx)}
                                className="cursor-pointer hover:opacity-90 transition-opacity"
                                style={{
                                  position: 'relative',
                                  width: '100px',
                                  height: '100px',
                                  backgroundColor: '#f3f4f6',
                                  borderRadius: '8px',
                                  overflow: 'hidden',
                                  flexShrink: 0,
                                  transform: 'none'
                                }}
                              >
                                <img
                                  src={typeof image === 'string' ? image : image.url}
                                  alt={`Report image ${idx + 1}`}
                                  style={{
                                    width: '100%',
                                    height: '100%',
                                    objectFit: 'cover',
                                    transform: 'none'
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

                      {/* Bottom Row: Timestamp */}
                      <div className="pt-3 border-t border-gray-100">
                        <div className="flex items-center gap-2 text-xs text-gray-500">
                          <Clock className="w-3 h-3" />
                          <span>{formatTimestamp(report.createdAt)}</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
                </div>
              </CardContent>
            )}
          </>
        )}

        {/* Mayor Announcements Tab */}
        {activeTab === "mayor" && (
          <>
            {mayorAnnouncements.length === 0 ? (
              <CardContent className="p-12 text-center">
                <Megaphone className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-700 mb-2">
                  No mayor announcements yet
                </h3>
                <p className="text-gray-500">
                  Official announcements from your mayor will appear here
                </p>
              </CardContent>
            ) : (
              <CardContent className="p-4">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {mayorAnnouncements.map((announcement) => (
                  <Card key={announcement.id} className="hover:shadow-lg transition-shadow duration-200">
                    <CardContent className="p-5">
                      {/* Title */}
                      <h3 className="text-lg font-bold text-gray-900 mb-2">
                        {announcement.title}
                      </h3>

                      {/* Date */}
                      <div className="flex items-center gap-2 text-sm text-gray-600 mb-1">
                        <Calendar className="w-4 h-4" />
                        {formatTimestamp(announcement.createdAt)}
                      </div>

                      {/* Location/City */}
                      <div className="flex items-center gap-2 text-sm text-gray-600 mb-3">
                        <MapPin className="w-4 h-4" />
                        {announcement.city || 'City'}
                      </div>

                      {/* Description */}
                      <p className="text-sm text-gray-700 leading-relaxed mb-3 line-clamp-3">
                        {announcement.message || announcement.description}
                      </p>

                      {/* Status Badge */}
                      <Badge className="bg-purple-100 text-purple-700 text-xs px-2.5 py-1 font-medium">
                        <Megaphone className="w-3 h-3 mr-1" />
                        Mayor
                      </Badge>
                    </CardContent>
                  </Card>
                ))}
                </div>
              </CardContent>
            )}
          </>
        )}

        {/* Governor Announcements Tab */}
        {activeTab === "governor" && (
          <>
            {governorAnnouncements.length === 0 ? (
              <CardContent className="p-12 text-center">
                <Shield className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-700 mb-2">
                  No governor announcements yet
                </h3>
                <p className="text-gray-500">
                  Official announcements from the governor will appear here
                </p>
              </CardContent>
            ) : (
              <CardContent className="p-4">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {governorAnnouncements.map((announcement) => (
                  <Card key={announcement.id} className="hover:shadow-lg transition-shadow duration-200">
                    <CardContent className="p-5">
                      {/* Title */}
                      <h3 className="text-lg font-bold text-gray-900 mb-2">
                        {announcement.title}
                      </h3>

                      {/* Date */}
                      <div className="flex items-center gap-2 text-sm text-gray-600 mb-1">
                        <Calendar className="w-4 h-4" />
                        {formatTimestamp(announcement.createdAt)}
                      </div>

                      {/* Location */}
                      <div className="flex items-center gap-2 text-sm text-gray-600 mb-3">
                        <MapPin className="w-4 h-4" />
                        Batangas Province
                      </div>

                      {/* Description */}
                      <p className="text-sm text-gray-700 leading-relaxed mb-3 line-clamp-3">
                        {announcement.message || announcement.description}
                      </p>

                      {/* Status Badge */}
                      <Badge className="bg-emerald-100 text-emerald-700 text-xs px-2.5 py-1 font-medium">
                        <Shield className="w-3 h-3 mr-1" />
                        Governor
                      </Badge>
                    </CardContent>
                  </Card>
                ))}
                </div>
              </CardContent>
            )}
          </>
        )}
        </div>
      </Card>

      {/* Image Lightbox Modal */}
      {lightboxOpen && (
        <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center">
          {/* Close Button */}
          <button
            onClick={closeLightbox}
            className="absolute top-4 right-4 text-white hover:text-gray-300 transition-colors z-10"
          >
            <X className="w-8 h-8" />
          </button>

          {/* Image Counter */}
          <div className="absolute top-4 left-1/2 transform -translate-x-1/2 text-white text-sm font-medium bg-black/50 px-3 py-1 rounded-full">
            {currentImageIndex + 1} / {lightboxImages.length}
          </div>

          {/* Previous Button */}
          {lightboxImages.length > 1 && (
            <button
              onClick={prevImage}
              className="absolute left-4 text-white hover:text-gray-300 transition-colors bg-black/50 hover:bg-black/70 rounded-full p-3"
            >
              <ChevronLeft className="w-8 h-8" />
            </button>
          )}

          {/* Image Display */}
          <div className="max-w-[90vw] max-h-[90vh] flex items-center justify-center">
            <img
              src={typeof lightboxImages[currentImageIndex] === 'string'
                ? lightboxImages[currentImageIndex]
                : lightboxImages[currentImageIndex]?.url}
              alt={`Image ${currentImageIndex + 1}`}
              className="max-w-full max-h-full object-contain rounded-lg"
            />
          </div>

          {/* Next Button */}
          {lightboxImages.length > 1 && (
            <button
              onClick={nextImage}
              className="absolute right-4 text-white hover:text-gray-300 transition-colors bg-black/50 hover:bg-black/70 rounded-full p-3"
            >
              <ChevronRight className="w-8 h-8" />
            </button>
          )}
        </div>
      )}
    </div>
  );
}
