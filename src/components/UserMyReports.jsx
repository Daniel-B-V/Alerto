import { useState, useEffect } from "react";
import { List, MapPin, Clock, AlertCircle, CheckCircle, XCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Badge } from "./ui/badge";
import { useAuth } from "../contexts/AuthContext";
import { getReports } from "../firebase/firestore";

export function UserMyReports() {
  const { user } = useAuth();
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMyReports();
  }, [user]);

  const fetchMyReports = async () => {
    setLoading(true);
    try {
      const allReports = await getReports({ limit: 1000 });
      const myReports = allReports.filter(r => r.userId === user?.uid);
      setReports(myReports.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0)));
    } catch (error) {
      console.error('Error fetching my reports:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatTimestamp = (timestamp) => {
    if (!timestamp) return 'Unknown';
    const date = new Date(timestamp.seconds * 1000);
    return date.toLocaleString();
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'verified': return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'rejected': return <XCircle className="w-4 h-4 text-red-600" />;
      default: return <Clock className="w-4 h-4 text-yellow-600" />;
    }
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
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2 flex items-center gap-3">
          <List className="w-8 h-8 text-blue-500" />
          My Reports
        </h1>
        <p className="text-gray-600">
          Track the status of your submitted weather reports
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
          <CardContent className="p-4">
            <p className="text-sm text-blue-600 font-medium">Total</p>
            <p className="text-2xl font-bold text-blue-900">{reports.length}</p>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
          <CardContent className="p-4">
            <p className="text-sm text-green-600 font-medium">Verified</p>
            <p className="text-2xl font-bold text-green-900">
              {reports.filter(r => r.status === 'verified').length}
            </p>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-yellow-50 to-yellow-100 border-yellow-200">
          <CardContent className="p-4">
            <p className="text-sm text-yellow-600 font-medium">Pending</p>
            <p className="text-2xl font-bold text-yellow-900">
              {reports.filter(r => r.status === 'pending').length}
            </p>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-red-50 to-red-100 border-red-200">
          <CardContent className="p-4">
            <p className="text-sm text-red-600 font-medium">Rejected</p>
            <p className="text-2xl font-bold text-red-900">
              {reports.filter(r => r.status === 'rejected').length}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Reports List */}
      {reports.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <AlertCircle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No Reports Yet</h3>
            <p className="text-gray-600">You haven't submitted any reports yet. Start contributing to your community!</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {reports.map((report) => (
            <Card key={report.id} className="hover:shadow-lg transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <MapPin className="w-5 h-5 text-blue-500" />
                    {report.location?.city || 'Unknown Location'}
                  </CardTitle>
                  <div className="flex items-center gap-2">
                    {getStatusIcon(report.status)}
                    <Badge variant={
                      report.status === 'verified' ? 'default' :
                      report.status === 'rejected' ? 'destructive' :
                      'secondary'
                    }>
                      {report.status || 'pending'}
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <Badge style={{
                    backgroundColor:
                      report.severity === 'critical' ? '#dc2626' :
                      report.severity === 'high' ? '#f97316' :
                      report.severity === 'medium' ? '#ca8a04' :
                      '#3b82f6',
                    color: 'white'
                  }}>
                    {report.severity?.toUpperCase() || 'N/A'}
                  </Badge>
                  <Badge className="ml-2" variant="outline">
                    {report.category?.replace(/_/g, ' ') || 'General'}
                  </Badge>
                </div>

                <p className="text-gray-700">{report.description}</p>

                {report.images && report.images.length > 0 && (
                  <p className="text-sm text-gray-500">📷 {report.images.length} image(s) attached</p>
                )}

                <div className="flex items-center gap-2 text-sm text-gray-500 pt-2 border-t">
                  <Clock className="w-4 h-4" />
                  {formatTimestamp(report.createdAt)}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
