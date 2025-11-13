/**
 * Barangay Insights Panel
 * Shows barangay-level statistics and insights for mayors
 */

import React, { useState, useEffect } from 'react';
import { Card } from '../../ui/card';
import { Badge } from '../../ui/badge';
import { Alert, AlertDescription } from '../../ui/alert';
import {
  MapPin,
  AlertTriangle,
  TrendingUp,
  Activity,
  BarChart3,
  Info
} from 'lucide-react';
import { useAuth } from '../../../contexts/AuthContext';
import { getUserCity } from '../../../utils/permissions';
import { getReports } from '../../../firebase/firestore';

const BarangayInsightsPanel = () => {
  const { user } = useAuth();
  const userCity = getUserCity(user);
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [barangayStats, setBarangayStats] = useState([]);

  // Load reports for the mayor's city
  useEffect(() => {
    const loadReports = async () => {
      if (!userCity) return;

      try {
        setLoading(true);
        // Fetch all reports and filter by city
        const allReports = await getReports({ limit: 200 });
        const cityReports = allReports.filter(
          report => report.location?.city === userCity || report.city === userCity
        );
        setReports(cityReports);

        // Process barangay statistics
        processBarangayStats(cityReports);
      } catch (error) {
        console.error('Error loading reports:', error);
      } finally {
        setLoading(false);
      }
    };

    loadReports();

    // Refresh every 2 minutes
    const interval = setInterval(loadReports, 2 * 60 * 1000);
    return () => clearInterval(interval);
  }, [userCity]);

  // Process statistics by barangay
  const processBarangayStats = (cityReports) => {
    const barangayMap = new Map();

    // Extract barangays from actual reports
    cityReports.forEach(report => {
      const barangay = report.location?.barangay || report.barangay || 'Unknown';

      if (!barangayMap.has(barangay)) {
        barangayMap.set(barangay, {
          name: barangay,
          totalReports: 0,
          criticalReports: 0,
          categories: {},
          recentReports: []
        });
      }

      const stats = barangayMap.get(barangay);
      stats.totalReports++;

      // Count critical reports (high severity or verified)
      if (report.severity === 'critical' || report.severity === 'high') {
        stats.criticalReports++;
      }

      // Count by category
      const category = report.category || report.hazardType || 'Other';
      stats.categories[category] = (stats.categories[category] || 0) + 1;

      // Keep recent reports (max 3 per barangay)
      if (stats.recentReports.length < 3) {
        stats.recentReports.push(report);
      }
    });

    // Convert to array and sort by total reports (descending)
    const statsArray = Array.from(barangayMap.values())
      .sort((a, b) => b.totalReports - a.totalReports);

    setBarangayStats(statsArray);
  };

  // Get severity badge color
  const getSeverityColor = (criticalCount, totalCount) => {
    if (totalCount === 0) return 'bg-green-100 text-green-800';
    const ratio = criticalCount / totalCount;
    if (ratio >= 0.5) return 'bg-red-100 text-red-800';
    if (ratio >= 0.25) return 'bg-orange-100 text-orange-800';
    return 'bg-yellow-100 text-yellow-800';
  };

  if (!userCity) {
    return (
      <Card className="p-6">
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            No city assigned to your account. Please contact the administrator.
          </AlertDescription>
        </Alert>
      </Card>
    );
  }

  if (loading) {
    return (
      <Card className="p-6">
        <div className="flex items-center justify-center h-48">
          <div className="text-gray-500">Loading barangay insights...</div>
        </div>
      </Card>
    );
  }

  // Get top 3 barangays with most reports
  const topBarangays = barangayStats.slice(0, 3).filter(b => b.totalReports > 0);
  const activeBarangays = barangayStats.filter(b => b.totalReports > 0).length;
  const totalReports = reports.length;
  const criticalReports = reports.filter(
    r => r.severity === 'critical' || r.severity === 'high'
  ).length;

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Total Reports</p>
              <p className="text-2xl font-bold text-gray-900">{totalReports}</p>
              <p className="text-xs text-gray-500 mt-1">{userCity}</p>
            </div>
            <BarChart3 className="w-8 h-8 text-blue-500" />
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Critical Reports</p>
              <p className="text-2xl font-bold text-red-600">{criticalReports}</p>
              <p className="text-xs text-gray-500 mt-1">High/Critical severity</p>
            </div>
            <AlertTriangle className="w-8 h-8 text-red-500" />
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Active Barangays</p>
              <p className="text-2xl font-bold text-gray-900">{activeBarangays}</p>
              <p className="text-xs text-gray-500 mt-1">With reports</p>
            </div>
            <MapPin className="w-8 h-8 text-green-500" />
          </div>
        </Card>
      </div>

      {/* Top Barangays Alert */}
      {topBarangays.length > 0 && (
        <Card className="p-4 bg-gradient-to-r from-orange-50 to-red-50 border-orange-200">
          <div className="flex items-start gap-3">
            <TrendingUp className="w-5 h-5 text-orange-600 mt-0.5" />
            <div className="flex-1">
              <h3 className="font-semibold text-orange-900">Barangays Requiring Attention</h3>
              <p className="text-sm text-orange-700 mt-1">
                {topBarangays.map(b => b.name).join(', ')} have the most reports.
                Consider prioritizing these areas.
              </p>
            </div>
          </div>
        </Card>
      )}

      {/* Barangay Statistics Table */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold flex items-center gap-2">
            <Activity className="w-5 h-5" />
            Barangay Breakdown
          </h2>
          <Badge className="bg-blue-100 text-blue-800">
            {barangayStats.length} barangays
          </Badge>
        </div>

        {barangayStats.length === 0 ? (
          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription>
              No barangay data available for {userCity}. Reports will appear here as they are submitted.
            </AlertDescription>
          </Alert>
        ) : (
          <div className="space-y-3">
            {barangayStats.map((barangay, index) => (
              <div
                key={barangay.name}
                className={`border rounded-lg p-4 hover:bg-gray-50 transition-colors ${
                  barangay.totalReports === 0 ? 'opacity-60' : ''
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <MapPin className="w-4 h-4 text-gray-500" />
                      <h3 className="font-semibold text-gray-900">{barangay.name}</h3>
                      {index < 3 && barangay.totalReports > 0 && (
                        <Badge className="bg-orange-100 text-orange-800 text-xs">
                          #{index + 1} Hotspot
                        </Badge>
                      )}
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                      <div>
                        <span className="text-gray-500">Total Reports:</span>
                        <span className="ml-2 font-semibold">{barangay.totalReports}</span>
                      </div>
                      <div>
                        <span className="text-gray-500">Critical:</span>
                        <span className="ml-2 font-semibold text-red-600">
                          {barangay.criticalReports}
                        </span>
                      </div>
                      <div className="col-span-2">
                        <span className="text-gray-500">Top Category:</span>
                        <span className="ml-2 font-semibold">
                          {Object.keys(barangay.categories).length > 0
                            ? Object.entries(barangay.categories)
                                .sort((a, b) => b[1] - a[1])[0][0]
                            : 'N/A'}
                        </span>
                      </div>
                    </div>

                    {/* Category breakdown */}
                    {Object.keys(barangay.categories).length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {Object.entries(barangay.categories).map(([category, count]) => (
                          <Badge
                            key={category}
                            variant="outline"
                            className="text-xs bg-gray-50"
                          >
                            {category}: {count}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Status Badge */}
                  <Badge
                    className={getSeverityColor(
                      barangay.criticalReports,
                      barangay.totalReports
                    )}
                  >
                    {barangay.totalReports === 0
                      ? 'No Reports'
                      : barangay.criticalReports > 0
                      ? 'Needs Attention'
                      : 'Active'}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Info Card */}
      <Card className="p-4 bg-blue-50 border-blue-200">
        <div className="flex items-start gap-3">
          <Info className="w-5 h-5 text-blue-600 mt-0.5" />
          <div>
            <h3 className="font-semibold text-blue-900 mb-1">About Barangay Insights</h3>
            <p className="text-sm text-blue-700">
              This panel shows community reports grouped by barangay, helping you identify
              which areas in {userCity} need immediate attention. Reports marked as "Critical"
              or "High" severity are prioritized.
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default BarangayInsightsPanel;
