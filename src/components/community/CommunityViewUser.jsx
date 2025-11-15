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
  Calendar
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
  const [selectedImage, setSelectedImage] = useState(null);

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
        <div className="p-4 border-b border-gray-200">
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
        </div>

        {/* Tab Content */}
        <div>
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
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {communityReports.map((report) => (
                  <Card key={report.id} className="hover:shadow-lg transition-all duration-200">
                    <CardContent className="p-5">
                      {/* Title */}
                      <h3 className="text-lg font-bold text-gray-900 mb-3">
                        {report.title || report.category || 'Community Report'}
                      </h3>

                      {/* Date */}
                      <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
                        <Calendar className="w-4 h-4" />
                        {formatTimestamp(report.createdAt)}
                      </div>

                      {/* Location */}
                      <div className="flex items-center gap-2 text-sm text-gray-600 mb-4">
                        <MapPin className="w-4 h-4" />
                        {report.location?.barangay
                          ? `${report.location.barangay}, ${report.location.city}`
                          : report.location?.city || 'Unknown'}
                      </div>

                      {/* Description */}
                      <p className="text-sm text-gray-700 leading-relaxed mb-4 line-clamp-3">
                        {report.description}
                      </p>

                      {/* Status Badge */}
                      <Badge className="bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs px-2.5 py-1 font-medium">
                        <CheckCircle className="w-3 h-3 mr-1" />
                        Verified
                      </Badge>
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
                  <Card key={announcement.id} className="hover:shadow-lg transition-all duration-200">
                    <CardContent className="p-5">
                      {/* Title */}
                      <h3 className="text-lg font-bold text-gray-900 mb-3">
                        {announcement.title}
                      </h3>

                      {/* Date */}
                      <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
                        <Calendar className="w-4 h-4" />
                        {formatTimestamp(announcement.createdAt)}
                      </div>

                      {/* Location/City */}
                      <div className="flex items-center gap-2 text-sm text-gray-600 mb-4">
                        <MapPin className="w-4 h-4" />
                        {announcement.city || 'City'}
                      </div>

                      {/* Description */}
                      <p className="text-sm text-gray-700 leading-relaxed mb-4 line-clamp-3">
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
                  <Card key={announcement.id} className="hover:shadow-lg transition-all duration-200">
                    <CardContent className="p-5">
                      {/* Title */}
                      <h3 className="text-lg font-bold text-gray-900 mb-3">
                        {announcement.title}
                      </h3>

                      {/* Date */}
                      <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
                        <Calendar className="w-4 h-4" />
                        {formatTimestamp(announcement.createdAt)}
                      </div>

                      {/* Location */}
                      <div className="flex items-center gap-2 text-sm text-gray-600 mb-4">
                        <MapPin className="w-4 h-4" />
                        Batangas Province
                      </div>

                      {/* Description */}
                      <p className="text-sm text-gray-700 leading-relaxed mb-4 line-clamp-3">
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
    </div>
  );
}
