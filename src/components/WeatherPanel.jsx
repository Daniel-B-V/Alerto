import { useState, useEffect, useRef } from "react";
import { Cloud, Droplets, Wind, Gauge, MapPin, RefreshCw } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Badge } from "./ui/badge";
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { ImageWithFallback } from "./figma/ImageWithFallback";
import {
  getCurrentWeather,
  getHourlyForecast,
  getWeatherAlerts,
  getBatangasWeather
} from "../services/weatherService";
import { getReports } from "../firebase/firestore";
import { useSocket } from "../contexts/SocketContext";
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../firebase/config';
import { HeatIndexCard, HeatIndexAlert } from "./HeatIndexCard";
import { calculateHeatIndex, getHeatIndexCategory } from "../utils/heatIndexUtils";

export function WeatherPanel() {
  const [currentWeather, setCurrentWeather] = useState(null);
  const [hourlyData, setHourlyData] = useState([]);
  const [alertAreas, setAlertAreas] = useState([]);
  const [batangasStats, setBatangasStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [communityReports, setCommunityReports] = useState([]);
  const [activeSuspensions, setActiveSuspensions] = useState(0);
  const [lastUpdate, setLastUpdate] = useState(null);
  const { addNotification } = useSocket();
  const notifiedConditions = useRef(new Set());

  // Fetch all weather data
  const fetchWeatherData = async () => {
    setLoading(true);
    try {
      // Fetch current weather for Batangas
      const current = await getCurrentWeather('Batangas');
      setCurrentWeather(current);

      // Fetch hourly forecast for charts
      const hourly = await getHourlyForecast('Batangas');
      setHourlyData(hourly);

      // Fetch weather alerts for all areas
      const alerts = await getWeatherAlerts();
      setAlertAreas(alerts);

      // Fetch weather for all Batangas cities
      const allCities = await getBatangasWeather();

      // Remove duplicate cities (keep only the first occurrence of each city)
      const uniqueCities = [];
      const seenCities = new Set();

      allCities.forEach(city => {
        const cityName = city.location?.city || 'Unknown';
        if (!seenCities.has(cityName)) {
          seenCities.add(cityName);
          uniqueCities.push(city);
        }
      });

      setBatangasStats(uniqueCities);

      // Fetch community reports from Firebase
      const reports = await getReports({ limit: 100 });
      setCommunityReports(reports);

      // Fetch active suspensions from Firestore
      const suspensionsQuery = query(
        collection(db, 'suspensions'),
        where('status', '==', 'active')
      );
      const suspensionsSnapshot = await getDocs(suspensionsQuery);
      setActiveSuspensions(suspensionsSnapshot.size);

      // Check weather conditions and add notifications for strong wind, heavy rain, and high heat index
      if (current?.current) {
        const { windSpeed, rainfall, temperature, humidity } = current.current;
        const conditions = [];

        // Strong wind: > 40 km/h
        if (windSpeed > 40) {
          const windKey = `wind-${Math.floor(windSpeed / 10)}`;
          if (!notifiedConditions.current.has(windKey)) {
            notifiedConditions.current.add(windKey);
            conditions.push({
              type: 'strong_wind',
              message: `Strong Wind Alert: ${windSpeed} km/h detected in Batangas`,
              severity: windSpeed > 60 ? 'critical' : 'high'
            });
          }
        }

        // Heavy rain: > 10 mm/h
        if (rainfall > 10) {
          const rainKey = `rain-${Math.floor(rainfall / 5)}`;
          if (!notifiedConditions.current.has(rainKey)) {
            notifiedConditions.current.add(rainKey);
            conditions.push({
              type: 'heavy_rain',
              message: `Heavy Rain Alert: ${rainfall.toFixed(1)} mm/h detected in Batangas`,
              severity: rainfall > 20 ? 'critical' : 'high'
            });
          }
        }

        // High heat index: Check if suspension is recommended
        if (temperature && humidity) {
          const heatIndex = calculateHeatIndex(temperature, humidity);
          const heatCategory = getHeatIndexCategory(heatIndex);

          if (heatCategory.suspensionRecommended) {
            const heatKey = `heat-${Math.floor(heatIndex / 5)}`;
            if (!notifiedConditions.current.has(heatKey)) {
              notifiedConditions.current.add(heatKey);
              conditions.push({
                type: 'high_heat',
                message: `${heatCategory.icon} High Heat Index: ${heatIndex}°C - ${heatCategory.label}. ${heatCategory.description}`,
                severity: heatIndex >= 52 ? 'critical' : 'high'
              });
            }
          }
        }

        // Add notifications
        conditions.forEach(condition => {
          let title = '🌤️ Weather Alert';
          if (condition.type === 'strong_wind') title = '💨 Strong Wind Alert';
          if (condition.type === 'heavy_rain') title = '🌧️ Heavy Rain Alert';
          if (condition.type === 'high_heat') title = '🔥 High Heat Index Alert';

          addNotification({
            id: `weather-${Date.now()}-${Math.random()}`,
            title,
            message: condition.message,
            severity: condition.severity,
            timestamp: new Date().toISOString()
          });
        });

        // Clear old notifications after 1 hour
        setTimeout(() => {
          notifiedConditions.current.clear();
        }, 60 * 60 * 1000);
      }

      setLastUpdate(new Date());
    } catch (error) {
      console.error('Failed to fetch weather data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Initial load and auto-refresh every 5 minutes
  useEffect(() => {
    fetchWeatherData();

    const interval = setInterval(() => {
      fetchWeatherData();
    }, 5 * 60 * 1000); // 5 minutes

    // Listen for data refresh events
    const handleDataRefresh = () => {
      console.log('Data refresh event received, reloading weather data...');
      fetchWeatherData();
    };

    window.addEventListener('dataRefresh', handleDataRefresh);

    return () => {
      clearInterval(interval);
      window.removeEventListener('dataRefresh', handleDataRefresh);
    };
  }, []);

  // Calculate stats from Batangas cities data
  const stats = batangasStats ? {
    totalCities: batangasStats.length,
    suspensions: activeSuspensions,
    ongoingClasses: batangasStats.length - activeSuspensions,
    communityReports: communityReports.length,
    criticalAlerts: alertAreas.filter(a => a.level === 'high').length,
    verifiedReports: communityReports.filter(r => r.status === 'verified').length,
    activeReporters: [...new Set(communityReports.map(r => r.userEmail).filter(Boolean))].length,
  } : null;
  if (loading && !currentWeather) {
    return (
      <div className="space-y-6 flex items-center justify-center min-h-screen">
        <div className="text-center">
          <RefreshCw className="w-12 h-12 text-blue-500 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading real-time weather data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Overview Header */}
      <div className="mb-6 flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Weather Monitoring
          </h1>
          <p className="text-gray-600">
            Real-time weather conditions and forecasting across Batangas Province
          </p>
          {lastUpdate && (
            <p className="text-xs text-gray-500 mt-1">
              Last updated: {lastUpdate.toLocaleTimeString()}
            </p>
          )}
        </div>
        <button
          onClick={fetchWeatherData}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 transition-colors"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {/* Heat Index Alert Banner */}
      {currentWeather?.current && (
        <HeatIndexAlert
          temperature={currentWeather.current.temperature}
          humidity={currentWeather.current.humidity}
        />
      )}

      {/* Quick Stats - moved from dashboard */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card className="bg-gradient-to-br from-blue-50/80 to-blue-100/80 backdrop-blur-sm border-blue-200/50 shadow-sm hover:shadow-md transition-all duration-200">
            <CardContent className="p-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-900">{stats.totalCities}</div>
                <div className="text-sm text-blue-600">Cities/Municipalities</div>
                <div className="text-xs text-blue-500">Monitored</div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-green-50/80 to-green-100/80 backdrop-blur-sm border-green-200/50 shadow-sm hover:shadow-md transition-all duration-200">
            <CardContent className="p-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-green-900">{stats.ongoingClasses}</div>
                <div className="text-sm text-green-600">Classes Ongoing</div>
                <div className="text-xs text-green-500">Normal Operations</div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-red-50/80 to-red-100/80 backdrop-blur-sm border-red-200/50 shadow-sm hover:shadow-md transition-all duration-200">
            <CardContent className="p-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-red-900">{stats.suspensions}</div>
                <div className="text-sm text-red-600">Suspensions Active</div>
                <div className="text-xs text-red-500">Weather Related</div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-purple-50/80 to-purple-100/80 backdrop-blur-sm border-purple-200/50 shadow-sm hover:shadow-md transition-all duration-200">
            <CardContent className="p-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-900">{stats.communityReports}</div>
                <div className="text-sm text-purple-600">Community Reports</div>
                <div className="text-xs text-purple-500">Last 24 Hours</div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Current Weather Data Cards */}
      {currentWeather && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="bg-gradient-to-br from-blue-50/80 to-blue-100/80 backdrop-blur-sm border-blue-200/50 shadow-sm hover:shadow-md transition-all duration-200">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-blue-600 mb-1">Temperature</p>
                  <p className="text-2xl font-bold text-blue-900">{currentWeather.current.temperature}°C</p>
                  <p className="text-xs text-blue-500">Feels like {currentWeather.current.feelsLike}°C</p>
                </div>
                <Cloud className="w-8 h-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-cyan-50/80 to-cyan-100/80 backdrop-blur-sm border-cyan-200/50 shadow-sm hover:shadow-md transition-all duration-200">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-cyan-600 mb-1">Humidity</p>
                  <p className="text-2xl font-bold text-cyan-900">{currentWeather.current.humidity}%</p>
                  <p className="text-xs text-cyan-500">
                    {currentWeather.current.humidity > 80 ? 'Very High' :
                     currentWeather.current.humidity > 60 ? 'High' : 'Normal'}
                  </p>
                </div>
                <Droplets className="w-8 h-8 text-cyan-500" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-indigo-50/80 to-indigo-100/80 backdrop-blur-sm border-indigo-200/50 shadow-sm hover:shadow-md transition-all duration-200">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-indigo-600 mb-1">Rainfall</p>
                  <p className="text-2xl font-bold text-indigo-900">{currentWeather.current.rainfall.toFixed(1)}mm</p>
                  <p className="text-xs text-indigo-500">Last hour</p>
                </div>
                <Gauge className="w-8 h-8 text-indigo-500" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-purple-50/80 to-purple-100/80 backdrop-blur-sm border-purple-200/50 shadow-sm hover:shadow-md transition-all duration-200">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-purple-600 mb-1">Wind Speed</p>
                  <p className="text-2xl font-bold text-purple-900">{currentWeather.current.windSpeed} km/h</p>
                  <p className="text-xs text-purple-500">
                    {currentWeather.current.windSpeed > 30 ? 'Gusty winds' :
                     currentWeather.current.windSpeed > 15 ? 'Moderate' : 'Light'}
                  </p>
                </div>
                <Wind className="w-8 h-8 text-purple-500" />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Heat Index Card - Full Details */}
      {currentWeather?.current && (
        <div className="mb-6">
          <HeatIndexCard
            temperature={currentWeather.current.temperature}
            humidity={currentWeather.current.humidity}
            showDetails={true}
            className="max-w-2xl mx-auto"
          />
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Weather Map */}
        <Card className="bg-white/70 backdrop-blur-sm border-gray-200/50 shadow-sm hover:shadow-md transition-all duration-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="w-5 h-5 text-blue-500" />
              Storm Tracking Map
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="relative h-64 bg-gray-50 rounded-lg overflow-hidden">
              <ImageWithFallback
                src="https://images.unsplash.com/photo-1739320365494-ff3e8f18f1f5?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx3ZWF0aGVyJTIwc3Rvcm0lMjBjbG91ZHMlMjBwaGlsaXBwaW5lc3xlbnwxfHx8fDE3NTgwMjgwMTJ8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral"
                alt="Weather map showing storm systems"
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent"></div>
              <div className="absolute bottom-4 left-4 text-white">
                <p className="font-medium">Active Storm Systems</p>
                <p className="text-sm opacity-90">Updated 5 minutes ago</p>
              </div>
            </div>
            
            {/* Alert Areas */}
            <div className="mt-4 space-y-2">
              <h4 className="font-medium text-gray-900">Alert Areas</h4>
              {alertAreas.length > 0 ? (
                alertAreas.slice(0, 4).map((area, index) => (
                  <div key={`${area.location}-${index}`} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                    <div className="flex items-center gap-2">
                      <Badge
                        className="text-white font-semibold"
                        style={{
                          backgroundColor:
                            area.level === 'critical' ? '#7c3aed' :
                            area.level === 'high' ? '#dc2626' :
                            area.level === 'medium' ? '#ea580c' :
                            '#9ca3af',
                          color: 'white'
                        }}
                      >
                        {area.level}
                      </Badge>
                      <span className="font-medium">{area.location}</span>
                    </div>
                    <span className="text-sm text-gray-600">{area.status}</span>
                  </div>
                ))
              ) : (
                <p className="text-sm text-gray-500">No active weather alerts</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Charts */}
        <div className="space-y-4">
          <Card className="bg-white/70 backdrop-blur-sm border-gray-200/50 shadow-sm hover:shadow-md transition-all duration-200">
            <CardHeader>
              <CardTitle>Rainfall Forecast (24h)</CardTitle>
            </CardHeader>
            <CardContent>
              {hourlyData.length > 0 ? (
                <ResponsiveContainer width="100%" height={150}>
                  <LineChart data={hourlyData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e0e7ff" />
                    <XAxis dataKey="time" stroke="#6b7280" />
                    <YAxis stroke="#6b7280" />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'white',
                        border: '1px solid #e5e7eb',
                        borderRadius: '8px'
                      }}
                    />
                    <Line
                      type="monotone"
                      dataKey="rainfall"
                      stroke="#3b82f6"
                      strokeWidth={2}
                      dot={{ fill: '#3b82f6', r: 4 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-[150px] flex items-center justify-center text-gray-500">
                  Loading forecast data...
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="bg-white/70 backdrop-blur-sm border-gray-200/50 shadow-sm hover:shadow-md transition-all duration-200">
            <CardHeader>
              <CardTitle>Humidity & Wind Forecast</CardTitle>
            </CardHeader>
            <CardContent>
              {hourlyData.length > 0 ? (
                <ResponsiveContainer width="100%" height={150}>
                  <BarChart data={hourlyData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e0e7ff" />
                    <XAxis dataKey="time" stroke="#6b7280" />
                    <YAxis stroke="#6b7280" />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'white',
                        border: '1px solid #e5e7eb',
                        borderRadius: '8px'
                      }}
                    />
                    <Bar dataKey="humidity" fill="#06b6d4" radius={[2, 2, 0, 0]} />
                    <Bar dataKey="wind" fill="#8b5cf6" radius={[2, 2, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-[150px] flex items-center justify-center text-gray-500">
                  Loading forecast data...
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}