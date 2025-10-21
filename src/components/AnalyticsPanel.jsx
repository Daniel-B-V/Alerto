import { useState, useEffect } from "react";
import { BarChart3, RefreshCw, Cloud, AlertTriangle, CloudRain, Wind, Droplets, PieChart as PieChartIcon, TrendingUp, Calendar } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Badge } from "./ui/badge";
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
import { getBatangasWeather, getDetailedHourlyForecast } from "../services/weatherService";
import { getReports } from "../firebase/firestore";

export function AnalyticsPanel() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [citiesWeather, setCitiesWeather] = useState([]);
  const [communityReports, setCommunityReports] = useState([]);
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
      setCitiesWeather(weatherData);

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

      // Calculate category breakdown
      const categoryCount = {};
      reports.forEach(report => {
        const category = report.category || 'other';
        categoryCount[category] = (categoryCount[category] || 0) + 1;
      });

      const categoryColors = {
        flooding: '#3b82f6',
        heavy_rain: '#0ea5e9',
        landslide: '#f59e0b',
        strong_wind: '#8b5cf6',
        storm: '#ef4444',
        road_blockage: '#f97316',
        power_outage: '#eab308',
        infrastructure: '#06b6d4',
        other: '#6b7280'
      };

      const categories = Object.entries(categoryCount).map(([name, count]) => ({
        name: name.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
        value: count,
        color: categoryColors[name] || '#6b7280'
      })).sort((a, b) => b.value - a.value);

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
      {!loading && !error && citiesWeather && citiesWeather.length > 0 && (
        <div className="max-w-7xl mx-auto mb-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">City-by-City Weather Conditions</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {citiesWeather.map((city, index) => {
              const riskLevel =
                city.current.rainfall > 20 || city.current.windSpeed > 60 ? 'high' :
                city.current.rainfall > 10 || city.current.windSpeed > 40 ? 'medium' :
                city.current.rainfall > 5 || city.current.windSpeed > 30 ? 'low' : 'normal';

              return (
                <Card key={index} className={`${
                  riskLevel === 'high' ? 'border-red-400 bg-red-50/50' :
                  riskLevel === 'medium' ? 'border-orange-400 bg-orange-50/50' :
                  riskLevel === 'low' ? 'border-yellow-400 bg-yellow-50/50' :
                  'border-green-400 bg-green-50/50'
                } border-2`}>
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg">{city.location.city}</CardTitle>
                      <Badge className={`${
                        riskLevel === 'high' ? 'bg-red-600' :
                        riskLevel === 'medium' ? 'bg-orange-600' :
                        riskLevel === 'low' ? 'bg-yellow-600' :
                        'bg-green-600'
                      } text-white text-xs`}>
                        {riskLevel.toUpperCase()}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center gap-2">
                      <Cloud className="w-4 h-4 text-gray-600" />
                      <span className="text-2xl font-bold">{city.current.temperature}°C</span>
                      <span className="text-sm text-gray-600">{city.current.weather.description}</span>
                    </div>

                    <div className="space-y-2 text-sm">
                      <div className="flex items-center justify-between">
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

                      <div className="flex items-center justify-between">
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
        <div className="max-w-7xl mx-auto">
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
        <div className="max-w-7xl mx-auto mt-6">
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
