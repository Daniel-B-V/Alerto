import { useState, useEffect } from "react";
import { BarChart3, RefreshCw, Cloud, AlertTriangle, CloudRain, Wind, Droplets, PieChart as PieChartIcon, TrendingUp, Calendar } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Badge } from "../ui/badge";
import { TyphoonTracker } from "../typhoon/TyphoonTracker";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  Legend,
  LineChart,
  Line,
  BarChart,
  Bar,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid
} from "recharts";
import { getBatangasWeather, getDetailedHourlyForecast } from "../../services/weatherService";
import { getReports } from "../../firebase/firestore";
import { calculateWeatherSeverity, getSeverityConfig, CATEGORY_CONFIG } from "../../constants/categorization";

export function AnalyticsPanel() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [citiesWeather, setCitiesWeather] = useState([]);
  const [communityReports, setCommunityReports] = useState([]);
  const [showAllCities, setShowAllCities] = useState(false);
  const [cityDistribution, setCityDistribution] = useState([]);
  const [weeklyTrends, setWeeklyTrends] = useState([]);
  const [categoryBreakdown, setCategoryBreakdown] = useState([]);
  const [hourlyForecast, setHourlyForecast] = useState([]);

  // Load data
  const loadData = async () => {
    try {
      setError(null);

      // Fetch weather data
      const weatherData = await getBatangasWeather();

      // Remove duplicate cities (keep only the first occurrence of each city)
      const uniqueCities = [];
      const seenCities = new Set();

      weatherData.forEach(city => {
        const cityName = city.location?.city || 'Unknown';
        if (!seenCities.has(cityName)) {
          seenCities.add(cityName);
          uniqueCities.push(city);
        }
      });

      setCitiesWeather(uniqueCities);

      // Fetch hourly forecast
      const forecast = await getDetailedHourlyForecast('Batangas');
      setHourlyForecast(forecast);

      // Fetch community reports
      const reports = await getReports({ limit: 100 });
      setCommunityReports(reports);

      // Calculate city distribution
      const cityCount = {};
      reports.forEach(report => {
        const city = report.location?.city || 'Unknown';
        cityCount[city] = (cityCount[city] || 0) + 1;
      });

      const colors = ['#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#14b8a6', '#f97316'];
      const distribution = Object.entries(cityCount).map(([name, count], index) => ({
        name,
        value: Math.round((count / reports.length) * 100),
        count,
        color: colors[index % colors.length]
      })).sort((a, b) => b.count - a.count);

      setCityDistribution(distribution);

      // Calculate weekly trends (last 7 days)
      const last7Days = [];
      const today = new Date();
      for (let i = 6; i >= 0; i--) {
        const date = new Date(today);
        date.setDate(date.getDate() - i);
        const dayName = date.toLocaleDateString('en-US', { weekday: 'short' });

        const dayReports = reports.filter(r => {
          if (!r.createdAt) return false;
          const reportDate = r.createdAt.seconds ? new Date(r.createdAt.seconds * 1000) : new Date(r.createdAt);
          return reportDate.toDateString() === date.toDateString();
        });

        last7Days.push({
          day: dayName,
          reports: dayReports.length,
          verified: dayReports.filter(r => r.status === 'verified').length,
          pending: dayReports.filter(r => r.status === 'pending').length
        });
      }
      setWeeklyTrends(last7Days);

      // Calculate category breakdown using centralized config
      const categoryCount = {};
      reports.forEach(report => {
        const category = report.category || 'other';
        categoryCount[category] = (categoryCount[category] || 0) + 1;
      });

      const categories = Object.entries(categoryCount).map(([categoryKey, count]) => {
        const categoryConfig = CATEGORY_CONFIG[categoryKey] || CATEGORY_CONFIG.other;
        return {
          name: categoryConfig.label,
          value: count,
          color: categoryConfig.color
        };
      }).sort((a, b) => b.value - a.value);

      setCategoryBreakdown(categories);

      setLoading(false);
    } catch (err) {
      console.error('Error loading analytics data:', err);
      setError('Failed to load analytics data. Please try again.');
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();

    // Listen for data refresh events from seeder
    const handleDataRefresh = () => {
      loadData();
    };

    window.addEventListener('dataRefresh', handleDataRefresh);

    return () => {
      window.removeEventListener('dataRefresh', handleDataRefresh);
    };
  }, []);

  const refreshData = async () => {
    setIsRefreshing(true);
    await loadData();
    setIsRefreshing(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-purple-50 p-6">
      {/* Header */}
      <div className="max-w-7xl mx-auto mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2 flex items-center gap-3">
              <BarChart3 className="w-8 h-8 text-blue-500" />
              Weather & Reports Analytics
            </h1>
            <p className="text-gray-600">City-by-city weather conditions and community reports analysis</p>
          </div>
          <button
            onClick={refreshData}
            className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50"
            disabled={isRefreshing}
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            {isRefreshing ? 'Refreshing...' : 'Refresh Data'}
          </button>
        </div>
      </div>

      {/* Typhoon Tracker Section */}
      <div className="max-w-7xl mx-auto mb-8">
        <TyphoonTracker />
      </div>

      {/* Loading State */}
      {loading && (
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading analytics data...</p>
          </div>
        </div>
      )}

      {/* Error State */}
      {error && (
        <Card className="max-w-7xl mx-auto bg-red-50 border-red-200">
          <CardContent className="p-6">
            <div className="flex items-center gap-2 text-red-600">
              <AlertTriangle className="w-5 h-5" />
              <span>{error}</span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* City-by-City Weather Details */}
      {!loading && !error && (
        <div className="max-w-7xl mx-auto mb-6">
          <div className="mb-4">
            <h2 className="text-2xl font-bold text-gray-900">City-by-City Weather Conditions</h2>
          </div>
          {citiesWeather && citiesWeather.length > 0 ? (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {(showAllCities ? citiesWeather : citiesWeather.slice(0, 8)).map((city, index) => {
              // Check if weather data has alerts array with risk level
              const alertLevel = city.alerts && city.alerts.length > 0 ? city.alerts[0].level : null;

              // Calculate risk level using centralized function
              const riskLevel = alertLevel || calculateWeatherSeverity(
                city.current.rainfall,
                city.current.windSpeed
              );

              // Get severity configuration
              const severityConfig = getSeverityConfig(riskLevel);

              return (
                <Card key={index} className="bg-white border border-gray-200 shadow-sm">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg">{city.location.city}</CardTitle>
                      <Badge
                        className="text-xs text-white"
                        style={{ backgroundColor: severityConfig.color }}
                      >
                        {severityConfig.label.toUpperCase()}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center gap-2 pb-3 border-b border-gray-200">
                      <Cloud className="w-4 h-4 text-gray-600" />
                      <span className="text-2xl font-bold">{city.current.temperature}°C</span>
                      <span className="text-sm text-gray-600">{city.current.weather.description}</span>
                    </div>

                    <div className="space-y-3 text-sm">
                      <div className="flex items-center justify-between pb-2 border-b border-gray-100">
                        <span className="flex items-center gap-2">
                          <CloudRain className="w-4 h-4 text-blue-600" />
                          <span>Rainfall</span>
                        </span>
                        <span className={`font-semibold ${
                          city.current.rainfall > 10 ? 'text-red-600' :
                          city.current.rainfall > 5 ? 'text-orange-600' :
                          'text-gray-700'
                        }`}>
                          {city.current.rainfall} mm/h
                        </span>
                      </div>

                      <div className="flex items-center justify-between pb-2 border-b border-gray-100">
                        <span className="flex items-center gap-2">
                          <Wind className="w-4 h-4 text-gray-600" />
                          <span>Wind Speed</span>
                        </span>
                        <span className={`font-semibold ${
                          city.current.windSpeed > 40 ? 'text-red-600' :
                          city.current.windSpeed > 30 ? 'text-orange-600' :
                          'text-gray-700'
                        }`}>
                          {city.current.windSpeed} km/h
                        </span>
                      </div>

                      <div className="flex items-center justify-between">
                        <span className="flex items-center gap-2">
                          <Droplets className="w-4 h-4 text-blue-600" />
                          <span>Humidity</span>
                        </span>
                        <span className="font-semibold text-gray-700">{city.current.humidity}%</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Show All Button - Always visible when there are cities */}
          <div className="flex justify-center mt-8">
            <button
              onClick={() => setShowAllCities(!showAllCities)}
              className="text-black font-medium hover:underline"
            >
              {showAllCities ? 'Show less' : 'Show all'}
            </button>
          </div>
        </>
          ) : (
            <Card className="bg-blue-50 border-blue-200">
              <CardContent className="p-6 text-center">
                <div className="flex flex-col items-center gap-3">
                  <Cloud className="w-12 h-12 text-blue-500" />
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">No Weather Data Available</h3>
                    <p className="text-gray-600 mb-4">
                      Weather data is currently unavailable. This could be due to:
                    </p>
                    <ul className="text-sm text-gray-600 text-left max-w-md mx-auto space-y-1">
                      <li>• No seeded data in the database</li>
                      <li>• Weather API connection issues</li>
                      <li>• API key configuration problems</li>
                    </ul>
                    <p className="text-sm text-gray-500 mt-4">
                      Try clicking "Refresh Data" or seed the database with test data.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Additional Statistics Cards */}
      {!loading && !error && communityReports.length > 0 && (
        <div className="max-w-7xl mx-auto mb-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Report Analytics</h2>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Severity Distribution Pie Chart */}
            <Card className="bg-white border border-gray-200 shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <PieChartIcon className="w-5 h-5 text-red-500" />
                  Severity Distribution
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie
                      data={[
                        { name: getSeverityConfig('critical').shortLabel, value: communityReports.filter(r => r.severity === 'critical').length, color: getSeverityConfig('critical').color },
                        { name: getSeverityConfig('high').shortLabel, value: communityReports.filter(r => r.severity === 'high').length, color: getSeverityConfig('high').color },
                        { name: getSeverityConfig('medium').shortLabel, value: communityReports.filter(r => r.severity === 'medium').length, color: getSeverityConfig('medium').color },
                        { name: getSeverityConfig('low').shortLabel, value: communityReports.filter(r => r.severity === 'low').length, color: getSeverityConfig('low').color }
                      ].filter(d => d.value > 0)}
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      dataKey="value"
                      label={({ name, value }) => `${name}: ${value}`}
                    >
                      {[
                        { name: getSeverityConfig('critical').shortLabel, value: communityReports.filter(r => r.severity === 'critical').length, color: getSeverityConfig('critical').color },
                        { name: getSeverityConfig('high').shortLabel, value: communityReports.filter(r => r.severity === 'high').length, color: getSeverityConfig('high').color },
                        { name: getSeverityConfig('medium').shortLabel, value: communityReports.filter(r => r.severity === 'medium').length, color: getSeverityConfig('medium').color },
                        { name: getSeverityConfig('low').shortLabel, value: communityReports.filter(r => r.severity === 'low').length, color: getSeverityConfig('low').color }
                      ].filter(d => d.value > 0).map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Affected Cities Count */}
            <Card className="bg-white border border-gray-200 shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <AlertTriangle className="w-5 h-5 text-orange-500" />
                  Top Affected Cities
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {Object.entries(
                    communityReports.reduce((acc, report) => {
                      const city = report.location?.city || 'Unknown';
                      acc[city] = (acc[city] || 0) + 1;
                      return acc;
                    }, {})
                  )
                    .sort((a, b) => b[1] - a[1])
                    .slice(0, 6)
                    .map(([city, count], idx) => (
                      <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center gap-2">
                          <div className={`w-2 h-2 rounded-full ${
                            idx === 0 ? 'bg-red-500' :
                            idx === 1 ? 'bg-orange-500' :
                            idx === 2 ? 'bg-yellow-500' :
                            'bg-gray-400'
                          }`} />
                          <span className="font-medium text-sm">{city}</span>
                        </div>
                        <Badge variant="outline" className="text-xs">{count} reports</Badge>
                      </div>
                    ))}
                </div>
              </CardContent>
            </Card>

            {/* Report Status Overview */}
            <Card className="bg-white border border-gray-200 shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <BarChart3 className="w-5 h-5 text-blue-500" />
                  Report Status
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">Verified</span>
                      <span className="font-semibold text-green-600">
                        {communityReports.filter(r => r.status === 'verified').length}
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-green-500 h-2 rounded-full"
                        style={{ width: `${(communityReports.filter(r => r.status === 'verified').length / communityReports.length) * 100}%` }}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">Pending</span>
                      <span className="font-semibold text-orange-600">
                        {communityReports.filter(r => r.status === 'pending').length}
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-orange-500 h-2 rounded-full"
                        style={{ width: `${(communityReports.filter(r => r.status === 'pending').length / communityReports.length) * 100}%` }}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">Investigating</span>
                      <span className="font-semibold text-blue-600">
                        {communityReports.filter(r => r.status === 'investigating').length}
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-blue-500 h-2 rounded-full"
                        style={{ width: `${(communityReports.filter(r => r.status === 'investigating').length / communityReports.length) * 100}%` }}
                      />
                    </div>
                  </div>

                  <div className="pt-3 border-t border-gray-200">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-semibold text-gray-700">Total Reports</span>
                      <span className="text-lg font-bold text-gray-900">{communityReports.length}</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* Charts Section */}
      {!loading && !error && (
        <div className="max-w-7xl mx-auto mb-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Weekly Trends Line Chart */}
            {weeklyTrends.length > 0 && (
              <Card className="bg-white/70 backdrop-blur-sm border-gray-200/50 shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-blue-500" />
                    Weekly Report Trends
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={weeklyTrends}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                      <XAxis dataKey="day" stroke="#6b7280" fontSize={12} />
                      <YAxis stroke="#6b7280" fontSize={12} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: 'rgba(255, 255, 255, 0.95)',
                          backdropFilter: 'blur(10px)',
                          border: '1px solid rgba(229, 231, 235, 0.5)',
                          borderRadius: '12px'
                        }}
                      />
                      <Legend />
                      <Line type="monotone" dataKey="reports" stroke="#3b82f6" strokeWidth={2} name="Total Reports" />
                      <Line type="monotone" dataKey="verified" stroke="#10b981" strokeWidth={2} name="Verified" />
                      <Line type="monotone" dataKey="pending" stroke="#f59e0b" strokeWidth={2} name="Pending" />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            )}

            {/* Category Breakdown Bar Chart */}
            {categoryBreakdown.length > 0 && (
              <Card className="bg-white/70 backdrop-blur-sm border-gray-200/50 shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="w-5 h-5 text-purple-500" />
                    Reports by Category
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={categoryBreakdown}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                      <XAxis dataKey="name" stroke="#6b7280" fontSize={11} angle={-45} textAnchor="end" height={80} />
                      <YAxis stroke="#6b7280" fontSize={12} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: 'rgba(255, 255, 255, 0.95)',
                          backdropFilter: 'blur(10px)',
                          border: '1px solid rgba(229, 231, 235, 0.5)',
                          borderRadius: '12px'
                        }}
                      />
                      <Bar dataKey="value" radius={[8, 8, 0, 0]}>
                        {categoryBreakdown.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      )}

      {/* Reports by City */}
      {!loading && !error && cityDistribution && cityDistribution.length > 0 && (
        <div className="max-w-7xl mx-auto mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Reports by Location</h2>
          <Card className="bg-white/70 backdrop-blur-sm border-gray-200/50 shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <PieChartIcon className="w-5 h-5 text-purple-500" />
                Community Reports Distribution
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Pie Chart */}
                <div>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={cityDistribution}
                        cx="50%"
                        cy="50%"
                        outerRadius={100}
                        dataKey="value"
                        nameKey="name"
                        label={({ name, value }) => `${name}: ${value}%`}
                      >
                        {cityDistribution.map((entry, index) => (
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
                    </PieChart>
                  </ResponsiveContainer>
                </div>

                {/* City List */}
                <div className="space-y-3">
                  <h3 className="font-semibold text-gray-800 mb-3">Report Count by City</h3>
                  {cityDistribution.map((city, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <div
                          className="w-4 h-4 rounded-full"
                          style={{ backgroundColor: city.color }}
                        ></div>
                        <span className="font-medium text-gray-700">{city.name}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <Badge variant="secondary" className="font-semibold">
                          {city.count} reports
                        </Badge>
                        <span className="text-sm text-gray-500">{city.value}%</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Total Summary */}
              <div className="mt-6 pt-4 border-t border-gray-200">
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Total Community Reports:</span>
                  <span className="text-2xl font-bold text-blue-600">
                    {communityReports.length}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Hourly Weather Forecast */}
      {!loading && !error && hourlyForecast.length > 0 && (
        <div className="max-w-7xl mx-auto mt-12 pt-8 border-t border-gray-200">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">48-Hour Weather Forecast</h2>
          <Card className="bg-white/70 backdrop-blur-sm border-gray-200/50 shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Cloud className="w-5 h-5 text-blue-500" />
                Detailed Hourly Forecast - Batangas
              </CardTitle>
            </CardHeader>
            <CardContent>
              {/* Temperature & Rainfall Forecast */}
              <div className="mb-6">
                <h3 className="text-lg font-semibold mb-3">Temperature & Rainfall</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={hourlyForecast.slice(0, 24)}>
                    <defs>
                      <linearGradient id="colorTemp" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#ef4444" stopOpacity={0.8}/>
                        <stop offset="95%" stopColor="#ef4444" stopOpacity={0.1}/>
                      </linearGradient>
                      <linearGradient id="colorRain" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8}/>
                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.1}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis dataKey="time" stroke="#6b7280" fontSize={11} />
                    <YAxis yAxisId="left" stroke="#6b7280" fontSize={12} />
                    <YAxis yAxisId="right" orientation="right" stroke="#6b7280" fontSize={12} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'rgba(255, 255, 255, 0.95)',
                        backdropFilter: 'blur(10px)',
                        border: '1px solid rgba(229, 231, 235, 0.5)',
                        borderRadius: '12px'
                      }}
                    />
                    <Legend />
                    <Area yAxisId="left" type="monotone" dataKey="temperature" stroke="#ef4444" fillOpacity={1} fill="url(#colorTemp)" name="Temperature (°C)" />
                    <Area yAxisId="right" type="monotone" dataKey="rainfall" stroke="#3b82f6" fillOpacity={1} fill="url(#colorRain)" name="Rainfall (mm)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>

              {/* Wind & Humidity Forecast */}
              <div>
                <h3 className="text-lg font-semibold mb-3">Wind Speed & Humidity</h3>
                <ResponsiveContainer width="100%" height={250}>
                  <LineChart data={hourlyForecast.slice(0, 24)}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis dataKey="time" stroke="#6b7280" fontSize={11} />
                    <YAxis stroke="#6b7280" fontSize={12} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'rgba(255, 255, 255, 0.95)',
                        backdropFilter: 'blur(10px)',
                        border: '1px solid rgba(229, 231, 235, 0.5)',
                        borderRadius: '12px'
                      }}
                    />
                    <Legend />
                    <Line type="monotone" dataKey="windSpeed" stroke="#8b5cf6" strokeWidth={2} name="Wind Speed (km/h)" />
                    <Line type="monotone" dataKey="humidity" stroke="#06b6d4" strokeWidth={2} name="Humidity (%)" />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
