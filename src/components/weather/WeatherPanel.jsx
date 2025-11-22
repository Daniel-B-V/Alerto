import { useState, useEffect, useRef } from "react";
import { Cloud, Droplets, Wind, Gauge, MapPin, RefreshCw, Thermometer, Navigation } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import {
  getCurrentWeather,
  getHourlyForecast,
  getWeatherAlerts,
  getBatangasWeather
} from "../../services/weatherService";
import { getReports } from "../../firebase/firestore";
import { useSocket } from "../../contexts/SocketContext";
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../../firebase/config';
import { HeatIndexCard, HeatIndexAlert } from "./HeatIndexCard";
import { calculateHeatIndex, getHeatIndexCategory } from "../../utils/heatIndexUtils";
import { DashboardAnnouncementCard } from "../suspension/DashboardAnnouncementCard";
import { useUserLocation } from "../../hooks/useUserLocation";

export function WeatherPanel({ showAnnouncement = false }) {
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

  // Auto-detect user location for weather display
  const { detectedCity, isLoading: locationLoading, isAutoDetected, distanceFromCity, requestLocation } = useUserLocation();

  // Fetch all weather data
  const fetchWeatherData = async () => {
    // Don't fetch if location hasn't been detected yet
    if (!detectedCity) return;

    setLoading(true);
    try {
      console.log(`🌤️ Fetching weather for: ${detectedCity}`);

      // Fetch current weather for detected city
      const current = await getCurrentWeather(detectedCity);
      setCurrentWeather(current);

      // Fetch hourly forecast for charts
      const hourly = await getHourlyForecast(detectedCity);
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
  }, [detectedCity]); // Re-fetch when detected city changes

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

      {/* Location Indicator */}
      {detectedCity && (
        <Card className="mb-6 bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-500 rounded-full">
                  <MapPin className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Currently viewing weather for</p>
                  <p className="text-lg font-bold text-gray-900">{detectedCity}</p>
                  {isAutoDetected && distanceFromCity !== null && (
                    <div className="flex items-center gap-1 text-xs mt-0.5">
                      <Navigation className="w-3 h-3" />
                      {distanceFromCity < 15 ? (
                        <span className="text-green-600">Auto-detected from your location</span>
                      ) : (
                        <span className="text-orange-600">
                          Nearest Batangas city ({distanceFromCity.toFixed(0)} km away)
                        </span>
                      )}
                    </div>
                  )}
                  {!isAutoDetected && !locationLoading && (
                    <p className="text-xs text-gray-500 mt-0.5">Default location</p>
                  )}
                </div>
              </div>
              <Button
                onClick={requestLocation}
                variant="outline"
                size="sm"
                className="flex items-center gap-2"
                disabled={locationLoading}
              >
                {locationLoading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                    Detecting...
                  </>
                ) : (
                  <>
                    <Navigation className="w-4 h-4" />
                    Detect Location
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

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
          <Card className="bg-white !border-4 !border-blue-500 shadow-lg shadow-blue-200 hover:shadow-xl hover:shadow-blue-300 hover:scale-105 transition-all duration-300 cursor-pointer">
            <CardContent className="p-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-900">{stats.totalCities}</div>
                <div className="text-sm text-gray-600">Cities/Municipalities</div>
                <div className="text-xs text-gray-500">Monitored</div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white !border-4 !border-green-500 shadow-lg shadow-green-200 hover:shadow-xl hover:shadow-green-300 hover:scale-105 transition-all duration-300 cursor-pointer">
            <CardContent className="p-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-900">{stats.ongoingClasses}</div>
                <div className="text-sm text-gray-600">Classes Ongoing</div>
                <div className="text-xs text-gray-500">Normal Operations</div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white !border-4 !border-red-500 shadow-lg shadow-red-200 hover:shadow-xl hover:shadow-red-300 hover:scale-105 transition-all duration-300 cursor-pointer">
            <CardContent className="p-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-900">{stats.suspensions}</div>
                <div className="text-sm text-gray-600">Suspensions Active</div>
                <div className="text-xs text-gray-500">Weather Related</div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white !border-4 !border-purple-500 shadow-lg shadow-purple-200 hover:shadow-xl hover:shadow-purple-300 hover:scale-105 transition-all duration-300 cursor-pointer">
            <CardContent className="p-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-900">{stats.communityReports}</div>
                <div className="text-sm text-gray-600">Community Reports</div>
                <div className="text-xs text-gray-500">Last 24 Hours</div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Current Weather Data Cards */}
      {currentWeather && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="bg-white !border-4 !border-blue-500 shadow-lg shadow-blue-200 hover:shadow-xl hover:shadow-blue-300 hover:scale-105 transition-all duration-300 cursor-pointer">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Temperature</p>
                  <p className="text-2xl font-bold text-gray-900">{currentWeather.current.temperature}°C</p>
                  <p className="text-xs text-gray-500">Feels like {currentWeather.current.feelsLike}°C</p>
                </div>
                <Cloud className="w-8 h-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white !border-4 !border-cyan-500 shadow-lg shadow-cyan-200 hover:shadow-xl hover:shadow-cyan-300 hover:scale-105 transition-all duration-300 cursor-pointer">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Humidity</p>
                  <p className="text-2xl font-bold text-gray-900">{currentWeather.current.humidity}%</p>
                  <p className="text-xs text-gray-500">
                    {currentWeather.current.humidity > 80 ? 'Very High' :
                     currentWeather.current.humidity > 60 ? 'High' : 'Normal'}
                  </p>
                </div>
                <Droplets className="w-8 h-8 text-cyan-500" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white !border-4 !border-orange-500 shadow-lg shadow-orange-200 hover:shadow-xl hover:shadow-orange-300 hover:scale-105 transition-all duration-300 cursor-pointer">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Heat Index</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {calculateHeatIndex(currentWeather.current.temperature, currentWeather.current.humidity)}°C
                  </p>
                  <p className="text-xs text-gray-500">
                    {getHeatIndexCategory(calculateHeatIndex(currentWeather.current.temperature, currentWeather.current.humidity)).label}
                  </p>
                </div>
                <Thermometer className="w-8 h-8 text-orange-500" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white !border-4 !border-purple-500 shadow-lg shadow-purple-200 hover:shadow-xl hover:shadow-purple-300 hover:scale-105 transition-all duration-300 cursor-pointer">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Wind Speed</p>
                  <p className="text-2xl font-bold text-gray-900">{currentWeather.current.windSpeed} km/h</p>
                  <p className="text-xs text-gray-500">
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

      {/* Class Suspension Announcements - Only for Users */}
      {showAnnouncement && <DashboardAnnouncementCard />}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Weather Map */}
        <Card className="bg-white/70 backdrop-blur-sm border-gray-200/50 shadow-sm hover:shadow-md transition-all duration-200 flex flex-col">
          <CardHeader className="flex-shrink-0">
            <CardTitle className="flex items-center gap-2">
              <MapPin className="w-5 h-5 text-blue-500" />
              Alert Areas
            </CardTitle>
          </CardHeader>
          <CardContent className="flex-1 overflow-hidden">
            {/* Alert Areas */}
            <div className="space-y-2 overflow-y-auto pr-2 pb-4 h-full" style={{ maxHeight: '480px', scrollbarWidth: 'thin' }}>
              {alertAreas.length > 0 ? (
                alertAreas.map((area, index) => (
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
                <ResponsiveContainer width="100%" height={200}>
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
                <div className="h-[200px] flex items-center justify-center text-gray-500">
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
                <ResponsiveContainer width="100%" height={200}>
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
                <div className="h-[200px] flex items-center justify-center text-gray-500">
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