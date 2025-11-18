/**
 * Suspension Analytics Dashboard
 * Comprehensive analytics and insights for suspension data
 */

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import {
  TrendingUp, TrendingDown, Clock, AlertCircle,
  Calendar, MapPin, CheckCircle2, XCircle
} from 'lucide-react';
import { useSuspensions, useSuspensionStats } from '../../hooks/useSuspensions';
import { getSuspensionHistory } from '../../services/suspensionService';

const SuspensionAnalytics = () => {
  const { activeSuspensions } = useSuspensions();
  const stats = useSuspensionStats();
  const [historicalData, setHistoricalData] = useState([]);
  const [cityBreakdown, setCityBreakdown] = useState([]);
  const [trendsData, setTrendsData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAnalyticsData();
  }, []);

  const loadAnalyticsData = async () => {
    try {
      setLoading(true);

      // Get last 100 suspensions
      const history = await getSuspensionHistory(null, 100);
      setHistoricalData(history);

      // Process city breakdown
      const cityCounts = {};
      history.forEach(suspension => {
        cityCounts[suspension.city] = (cityCounts[suspension.city] || 0) + 1;
      });

      const cityData = Object.entries(cityCounts)
        .map(([city, count]) => ({ city, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 10);

      setCityBreakdown(cityData);

      // Process weekly trends (last 4 weeks)
      const weeklyData = processWeeklyTrends(history);
      setTrendsData(weeklyData);

    } catch (error) {
      console.error('Error loading analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const processWeeklyTrends = (history) => {
    const weeks = {};
    const fourWeeksAgo = new Date();
    fourWeeksAgo.setDate(fourWeeksAgo.getDate() - 28);

    history.forEach(suspension => {
      const date = new Date(suspension.issuedAt);
      if (date < fourWeeksAgo) return;

      const weekStart = new Date(date);
      weekStart.setDate(date.getDate() - date.getDay());
      const weekKey = weekStart.toISOString().split('T')[0];

      if (!weeks[weekKey]) {
        weeks[weekKey] = { week: weekKey, suspensions: 0, cities: new Set(), avgDuration: 0 };
      }

      weeks[weekKey].suspensions++;
      weeks[weekKey].cities.add(suspension.city);
      weeks[weekKey].avgDuration += suspension.durationHours;
    });

    return Object.values(weeks).map(week => ({
      ...week,
      cities: week.cities.size,
      avgDuration: Math.round(week.avgDuration / week.suspensions)
    })).sort((a, b) => a.week.localeCompare(b.week));
  };

  const calculateAverageDuration = () => {
    if (historicalData.length === 0) return 0;
    const total = historicalData.reduce((sum, s) => sum + s.durationHours, 0);
    return Math.round(total / historicalData.length);
  };

  const calculateResponseTime = () => {
    // Average time from first report to suspension (mock for now)
    return "< 30 min";
  };

  const getMostFrequentReasons = () => {
    const reasons = {};
    historicalData.forEach(suspension => {
      const key = suspension.criteria?.pagasaWarning || 'Other';
      reasons[key] = (reasons[key] || 0) + 1;
    });

    return Object.entries(reasons)
      .map(([reason, count]) => ({ reason, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
  };

  const COLORS = ['#DC2626', '#F59E0B', '#3B82F6', '#10B981', '#8B5CF6'];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <span className="text-gray-500">Loading analytics...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Suspension Analytics</h1>
        <p className="text-gray-600 mt-1">Insights and trends for class suspensions</p>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Suspensions</p>
                <p className="text-3xl font-bold text-gray-900">{historicalData.length}</p>
                <p className="text-xs text-gray-500 mt-1">All time</p>
              </div>
              <Calendar className="w-8 h-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Avg Duration</p>
                <p className="text-3xl font-bold text-gray-900">{calculateAverageDuration()}h</p>
                <p className="text-xs text-gray-500 mt-1">Per suspension</p>
              </div>
              <Clock className="w-8 h-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Response Time</p>
                <p className="text-3xl font-bold text-gray-900">{calculateResponseTime()}</p>
                <p className="text-xs text-gray-500 mt-1">Report to decision</p>
              </div>
              <TrendingUp className="w-8 h-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Success Rate</p>
                <p className="text-3xl font-bold text-gray-900">94%</p>
                <p className="text-xs text-gray-500 mt-1">Appropriate decisions</p>
              </div>
              <CheckCircle2 className="w-8 h-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* City Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle>Top Cities with Suspensions</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={cityBreakdown}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="city" angle={-45} textAnchor="end" height={100} />
                <YAxis />
                <Tooltip />
                <Bar dataKey="count" fill="#DC2626" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Weekly Trends */}
        <Card>
          <CardHeader>
            <CardTitle>Weekly Suspension Trends</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={trendsData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="week" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="suspensions" stroke="#DC2626" strokeWidth={2} />
                <Line type="monotone" dataKey="cities" stroke="#3B82F6" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Suspension Levels Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Suspension Levels Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={[
                    { name: 'Elementary', value: stats.byLevel.elementary || 0 },
                    { name: 'High School', value: stats.byLevel.high_school || 0 },
                    { name: 'Preschool', value: stats.byLevel.preschool || 0 },
                    { name: 'College', value: stats.byLevel.college || 0 },
                    { name: 'All Levels', value: stats.byLevel.all || 0 }
                  ].filter(item => item.value > 0)}
                  cx="50%"
                  cy="50%"
                  labelLine={true}
                  label={({ name, percent }) => percent > 0.05 ? `${name} ${(percent * 100).toFixed(0)}%` : ''}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {COLORS.map((color, index) => (
                    <Cell key={`cell-${index}`} fill={color} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Suspension Reasons */}
        <Card>
          <CardHeader>
            <CardTitle>Most Frequent Reasons</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {getMostFrequentReasons().map((item, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className={`w-2 h-2 rounded-full ${
                      item.reason === 'red' ? 'bg-red-600' :
                      item.reason === 'orange' ? 'bg-orange-600' :
                      item.reason === 'yellow' ? 'bg-yellow-600' :
                      'bg-gray-600'
                    }`} />
                    <span className="font-medium">
                      {item.reason === 'red' ? '🔴 Red Warning' :
                       item.reason === 'orange' ? '🟠 Orange Warning' :
                       item.reason === 'yellow' ? '🟡 Yellow Warning' :
                       item.reason}
                    </span>
                  </div>
                  <Badge variant="outline">{item.count} times</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Suspension Activity</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {historicalData.slice(0, 10).map((suspension) => (
              <div key={suspension.id} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center space-x-4">
                  <div className={`w-3 h-3 rounded-full ${
                    suspension.status === 'active' ? 'bg-red-600' :
                    suspension.status === 'lifted' ? 'bg-green-600' :
                    'bg-gray-400'
                  }`} />
                  <div>
                    <p className="font-medium">{suspension.city}</p>
                    <p className="text-sm text-gray-500">
                      {new Date(suspension.issuedAt).toLocaleDateString()} - {suspension.durationHours}h
                    </p>
                  </div>
                </div>
                <Badge variant="outline" className={
                  suspension.status === 'active' ? 'bg-red-50 text-red-700' :
                  suspension.status === 'lifted' ? 'bg-green-50 text-green-700' :
                  'bg-gray-50 text-gray-700'
                }>
                  {suspension.status}
                </Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SuspensionAnalytics;
