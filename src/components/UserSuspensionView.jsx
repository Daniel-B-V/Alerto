import { useState, useEffect } from "react";
import {
  GraduationCap,
  MapPin,
  Clock,
  AlertTriangle,
  CheckCircle,
  RefreshCw,
  Search
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { collection, query, where, getDocs, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase/config';
import { useSocket } from '../contexts/SocketContext';

export function UserSuspensionView() {
  const [suspensions, setSuspensions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const { addNotification } = useSocket();

  useEffect(() => {
    // Subscribe to real-time suspension updates
    const suspensionsQuery = query(
      collection(db, 'suspensions'),
      where('status', '==', 'active')
    );

    const unsubscribe = onSnapshot(suspensionsQuery, (snapshot) => {
      const suspensionsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      // Check for new suspensions to show notification
      snapshot.docChanges().forEach(change => {
        if (change.type === 'added') {
          const newSuspension = change.doc.data();
          addNotification({
            id: `suspension-${change.doc.id}`,
            title: `🚨 Class Suspension Issued`,
            message: `Classes suspended in ${newSuspension.city}`,
            severity: 'critical',
            timestamp: new Date().toISOString()
          });
        }
      });

      setSuspensions(suspensionsData);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [addNotification]);

  const filteredSuspensions = suspensions.filter(s =>
    s.city?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatTimestamp = (timestamp) => {
    if (!timestamp) return 'Unknown';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleString();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <RefreshCw className="w-12 h-12 text-blue-500 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading suspensions...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2 flex items-center gap-3">
          <GraduationCap className="w-8 h-8 text-blue-500" />
          Class Suspensions
        </h1>
        <p className="text-gray-600">
          Real-time updates on active class suspensions across Batangas Province
        </p>
      </div>

      {/* Search */}
      <div className="max-w-md">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
          <Input
            type="text"
            placeholder="Search by city or municipality..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-gradient-to-br from-red-50 to-orange-50 border-red-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-red-600 font-medium">Active Suspensions</p>
                <p className="text-3xl font-bold text-red-900 mt-1">{suspensions.length}</p>
              </div>
              <AlertTriangle className="w-12 h-12 text-red-500 opacity-50" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-50 to-emerald-50 border-green-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-green-600 font-medium">Normal Operations</p>
                <p className="text-3xl font-bold text-green-900 mt-1">
                  {Math.max(0, 31 - suspensions.length)}
                </p>
              </div>
              <CheckCircle className="w-12 h-12 text-green-500 opacity-50" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-blue-50 to-cyan-50 border-blue-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-blue-600 font-medium">Total Cities</p>
                <p className="text-3xl font-bold text-blue-900 mt-1">31</p>
              </div>
              <MapPin className="w-12 h-12 text-blue-500 opacity-50" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Suspensions List */}
      {filteredSuspensions.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              {searchTerm ? 'No matching suspensions' : 'No Active Suspensions'}
            </h3>
            <p className="text-gray-600">
              {searchTerm
                ? 'Try a different search term'
                : 'All cities and municipalities are operating normally'}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredSuspensions.map((suspension) => (
            <Card
              key={suspension.id}
              className="hover:shadow-lg transition-shadow border-red-200 bg-gradient-to-br from-red-50 to-orange-50"
            >
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-red-900">
                  <MapPin className="w-5 h-5 text-red-600" />
                  {suspension.city}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <Badge className="bg-red-600 text-white mb-2">
                    CLASSES SUSPENDED
                  </Badge>
                </div>

                {suspension.reason && (
                  <div>
                    <p className="text-xs text-gray-600 font-medium">Reason:</p>
                    <p className="text-sm text-gray-900">{suspension.reason}</p>
                  </div>
                )}

                {suspension.notes && (
                  <div>
                    <p className="text-xs text-gray-600 font-medium">Notes:</p>
                    <p className="text-sm text-gray-700">{suspension.notes}</p>
                  </div>
                )}

                <div className="flex items-center gap-2 text-xs text-gray-500 pt-2 border-t">
                  <Clock className="w-3 h-3" />
                  Issued: {formatTimestamp(suspension.issuedAt)}
                </div>

                {suspension.issuedBy && (
                  <p className="text-xs text-gray-500">
                    By: {suspension.issuedBy}
                  </p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Help Text */}
      <Card className="bg-blue-50 border-blue-200">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-blue-600 mt-0.5" />
            <div>
              <p className="font-semibold text-blue-900 mb-1">Stay Informed</p>
              <p className="text-sm text-blue-700">
                This page automatically updates when new class suspensions are issued.
                You'll also receive real-time notifications for any new announcements.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
