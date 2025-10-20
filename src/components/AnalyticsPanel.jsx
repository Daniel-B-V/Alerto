import { useState, useEffect } from "react";
import { TrendingUp, Users, MapPin, Calendar, BarChart3, PieChart, RefreshCw, Cloud } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Badge } from "./ui/badge";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend
} from "recharts";
import { getWeatherStatistics, getBatangasWeather } from "../services/weatherService";

const monthlyData = [
  { month: "Jan", suspensions: 12, reports: 145, incidents: 8 },
  { month: "Feb", suspensions: 8, reports: 89, incidents: 5 },
  { month: "Mar", suspensions: 15, reports: 203, incidents: 12 },
  { month: "Apr", suspensions: 6, reports: 76, incidents: 3 },
  { month: "May", suspensions: 18, reports: 267, incidents: 15 },
  { month: "Jun", suspensions: 25, reports: 324, incidents: 22 },
  { month: "Jul", suspensions: 32, reports: 412, incidents: 28 },
  { month: "Aug", suspensions: 28, reports: 389, incidents: 25 },
  { month: "Sep", suspensions: 22, reports: 298, incidents: 18 },
  { month: "Oct", suspensions: 19, reports: 245, incidents: 14 },
  { month: "Nov", suspensions: 16, reports: 189, incidents: 11 },
  { month: "Dec", suspensions: 14, reports: 167, incidents: 9 }
];

const cityData = [
  { name: "Batangas City", value: 24, color: "#3b82f6" },
  { name: "Lipa City", value: 18, color: "#06b6d4" },
  { name: "Tanauan", value: 15, color: "#8b5cf6" },
  { name: "Santo Tomas", value: 12, color: "#10b981" },
  { name: "Others", value: 31, color: "#f59e0b" }
];

const weeklyTrends = [
  { day: "Mon", weather: 82, suspensions: 3, community: 45 },
  { day: "Tue", weather: 75, suspensions: 2, community: 38 },
  { day: "Wed", weather: 88, suspensions: 5, community: 52 },
  { day: "Thu", weather: 92, suspensions: 8, community: 67 },
  { day: "Fri", weather: 95, suspensions: 12, community: 89 },
  { day: "Sat", weather: 78, suspensions: 4, community: 43 },
  { day: "Sun", weather: 71, suspensions: 1, community: 32 }
];

const performanceMetrics = [
  { metric: "Response Time", value: "2.3 min", trend: "+12%", color: "green" },
  { metric: "Accuracy Rate", value: "94.7%", trend: "+5.2%", color: "green" },
  { metric: "Coverage Area", value: "32 Cities", trend: "100%", color: "blue" },
  { metric: "Active Users", value: "12.4K", trend: "+18%", color: "purple" }
];

export function AnalyticsPanel() {
  const [weatherStats, setWeatherStats] = useState(null);
  const [citiesWeather, setCitiesWeather] = useState([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState(null);

  // Fetch real-time weather statistics
  const fetchWeatherStats = async () => {
    setLoading(true);
    try {
      const stats = await getWeatherStatistics();
      setWeatherStats(stats);

      const cities = await getBatangasWeather();
      setCitiesWeather(cities);

      setLastUpdate(new Date());
    } catch (error) {
      console.error('Failed to fetch weather statistics:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWeatherStats();

    // Auto-refresh every 10 minutes
    const interval = setInterval(() => {
      fetchWeatherStats();
    }, 10 * 60 * 1000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="mb-6 flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Analytics & Insights
          </h1>
          <p className="text-gray-600">
            Comprehensive data analysis and performance metrics for Batangas Province monitoring
          </p>
          {lastUpdate && (
            <p className="text-xs text-gray-500 mt-1">
              Last updated: {lastUpdate.toLocaleTimeString()}
            </p>
          )}
        </div>
        <button
          onClick={fetchWeatherStats}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 transition-colors"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {/* Real-time Weather Statistics */}
      {weatherStats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <Card className="bg-gradient-to-br from-blue-50/80 to-blue-100/80 backdrop-blur-sm border-blue-200/50 shadow-sm hover:shadow-md transition-all duration-200">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-blue-600 mb-1">Avg Temperature</p>
                  <p className="text-2xl font-bold text-blue-900">{weatherStats.averageTemperature}°C</p>
                  <p className="text-xs text-blue-500">Province-wide</p>
                </div>
                <Cloud className="w-8 h-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-red-50/80 to-red-100/80 backdrop-blur-sm border-red-200/50 shadow-sm hover:shadow-md transition-all duration-200">
            <CardContent className="p-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-red-900">{weatherStats.highRiskAreas}</div>
                <div className="text-sm text-red-600">High Risk Areas</div>
                <div className="text-xs text-red-500">Severe Weather</div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-yellow-50/80 to-yellow-100/80 backdrop-blur-sm border-yellow-200/50 shadow-sm hover:shadow-md transition-all duration-200">
            <CardContent className="p-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-yellow-900">{weatherStats.mediumRiskAreas}</div>
                <div className="text-sm text-yellow-600">Moderate Risk</div>
                <div className="text-xs text-yellow-500">Watch Areas</div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-green-50/80 to-green-100/80 backdrop-blur-sm border-green-200/50 shadow-sm hover:shadow-md transition-all duration-200">
            <CardContent className="p-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-green-900">{weatherStats.normalAreas}</div>
                <div className="text-sm text-green-600">Normal Conditions</div>
                <div className="text-xs text-green-500">Safe Areas</div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Performance Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {performanceMetrics.map((metric, index) => (
          <Card key={index} className="bg-white/70 backdrop-blur-sm border-gray-200/50 shadow-sm hover:shadow-md transition-all duration-200">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">{metric.metric}</p>
                  <p className="text-2xl font-bold text-gray-900">{metric.value}</p>
                  <div className="flex items-center gap-1 mt-1">
                    <TrendingUp className={`w-3 h-3 ${
                      metric.color === 'green' ? 'text-green-500' : 
                      metric.color === 'blue' ? 'text-blue-500' : 'text-purple-500'
                    }`} />
                    <span className={`text-xs ${
                      metric.color === 'green' ? 'text-green-600' : 
                      metric.color === 'blue' ? 'text-blue-600' : 'text-purple-600'
                    }`}>
                      {metric.trend}
                    </span>
                  </div>
                </div>
                <BarChart3 className={`w-8 h-8 ${
                  metric.color === 'green' ? 'text-green-500' : 
                  metric.color === 'blue' ? 'text-blue-500' : 'text-purple-500'
                }`} />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Main Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Monthly Trends */}
        <Card className="lg:col-span-2 bg-white/70 backdrop-blur-sm border-gray-200/50 shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-blue-500" />
              Monthly Activity Trends
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="month" stroke="#64748b" fontSize={12} />
                <YAxis stroke="#64748b" fontSize={12} />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'rgba(255, 255, 255, 0.95)', 
                    backdropFilter: 'blur(10px)',
                    border: '1px solid rgba(229, 231, 235, 0.5)',
                    borderRadius: '12px',
                    boxShadow: '0 10px 25px rgba(0, 0, 0, 0.1)'
                  }} 
                />
                <Legend />
                <Area 
                  type="monotone" 
                  dataKey="reports" 
                  stackId="1"
                  stroke="#3b82f6" 
                  fill="rgba(59, 130, 246, 0.1)"
                  name="Community Reports"
                />
                <Area 
                  type="monotone" 
                  dataKey="suspensions" 
                  stackId="1"
                  stroke="#ef4444" 
                  fill="rgba(239, 68, 68, 0.1)"
                  name="Class Suspensions"
                />
                <Area 
                  type="monotone" 
                  dataKey="incidents" 
                  stackId="1"
                  stroke="#f59e0b" 
                  fill="rgba(245, 158, 11, 0.1)"
                  name="Weather Incidents"
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* City Distribution */}
        <Card className="bg-white/70 backdrop-blur-sm border-gray-200/50 shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PieChart className="w-5 h-5 text-purple-500" />
              Activity by City
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <RechartsPieChart data={cityData}>
                <Pie 
                  data={cityData}
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  dataKey="value"
                  nameKey="name"
                >
                  {cityData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'rgba(255, 255, 255, 0.95)', 
                    backdropFilter: 'blur(10px)',
                    border: '1px solid rgba(229, 231, 235, 0.5)',
                    borderRadius: '12px'
                  }} 
                />
                <Legend />
              </RechartsPieChart>
            </ResponsiveContainer>
            <div className="mt-4 space-y-2">
              {cityData.map((city, index) => (
                <div key={index} className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <div 
                      className="w-3 h-3 rounded-full" 
                      style={{ backgroundColor: city.color }}
                    ></div>
                    <span>{city.name}</span>
                  </div>
                  <Badge variant="secondary">{city.value}%</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Weekly Activity */}
        <Card className="bg-white/70 backdrop-blur-sm border-gray-200/50 shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-green-500" />
              Weekly Activity Pattern
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={weeklyTrends}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="day" stroke="#64748b" fontSize={12} />
                <YAxis stroke="#64748b" fontSize={12} />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'rgba(255, 255, 255, 0.95)', 
                    backdropFilter: 'blur(10px)',
                    border: '1px solid rgba(229, 231, 235, 0.5)',
                    borderRadius: '12px'
                  }} 
                />
                <Bar dataKey="weather" fill="#3b82f6" radius={[2, 2, 0, 0]} name="Weather Alerts" />
                <Bar dataKey="suspensions" fill="#ef4444" radius={[2, 2, 0, 0]} name="Suspensions" />
                <Bar dataKey="community" fill="#10b981" radius={[2, 2, 0, 0]} name="Community Reports" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Response Time Analysis */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2 bg-white/70 backdrop-blur-sm border-gray-200/50 shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="w-5 h-5 text-red-500" />
              Response Time by Region
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={monthlyData.slice(-6)}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="month" stroke="#64748b" fontSize={12} />
                <YAxis stroke="#64748b" fontSize={12} />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'rgba(255, 255, 255, 0.95)', 
                    backdropFilter: 'blur(10px)',
                    border: '1px solid rgba(229, 231, 235, 0.5)',
                    borderRadius: '12px'
                  }} 
                />
                <Line 
                  type="monotone" 
                  dataKey="incidents" 
                  stroke="#ef4444" 
                  strokeWidth={3}
                  dot={{ fill: '#ef4444', r: 4 }}
                  name="Response Time (min)"
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="bg-white/70 backdrop-blur-sm border-gray-200/50 shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5 text-blue-500" />
              Community Engagement
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="text-center">
                <div className="text-3xl font-bold text-blue-600">89.3%</div>
                <div className="text-sm text-gray-600">Active Participation</div>
              </div>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Reports Submitted</span>
                  <Badge className="bg-blue-100 text-blue-700">2,847</Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Verified Reporters</span>
                  <Badge className="bg-green-100 text-green-700">1,234</Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Response Rate</span>
                  <Badge className="bg-purple-100 text-purple-700">94.7%</Badge>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}