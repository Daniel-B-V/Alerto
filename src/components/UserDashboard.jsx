import { useState, useEffect } from "react";
import {
  Cloud,
  Droplets,
  Wind,
  Gauge,
  AlertTriangle,
  GraduationCap,
  FileText,
  MapPin,
  ThermometerSun
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Badge } from "./ui/badge";
import { getCurrentWeather, getHourlyForecast } from "../services/weatherService";
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../firebase/config';
import { useAuth } from "../contexts/AuthContext";
import { getReports } from "../firebase/firestore";

export function UserDashboard() {
  const { user } = useAuth();
  const [weather, setWeather] = useState(null);
  const [hourlyForecast, setHourlyForecast] = useState([]);
  const [loading, setLoading] = useState(true);
  const [suspensionsCount, setSuspensionsCount] = useState(0);
  const [myReportsCount, setMyReportsCount] = useState(0);

  useEffect(() => {
    fetchDashboardData();
  }, [user]);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      // Fetch current weather
      const currentWeather = await getCurrentWeather('Batangas');
      setWeather(currentWeather);

      // Fetch hourly forecast
      const hourly = await getHourlyForecast('Batangas');
      setHourlyForecast(hourly);

      // Fetch active suspensions count
      const suspensionsQuery = query(
        collection(db, 'suspensions'),
        where('status', '==', 'active')
      );
      const suspensionsSnapshot = await getDocs(suspensionsQuery);
      setSuspensionsCount(suspensionsSnapshot.size);

      // Fetch user's reports count
      if (user) {
        const allReports = await getReports({ limit: 1000 });
        const userReports = allReports.filter(r => r.userId === user.uid);
        setMyReportsCount(userReports.length);
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Welcome Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Welcome back{user?.displayName ? `, ${user.displayName}` : ''}!
        </h1>
        <p className="text-gray-600">
          Stay updated with real-time weather conditions in Batangas Province
        </p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-blue-600 font-medium">Active Suspensions</p>
                <p className="text-3xl font-bold text-blue-900 mt-1">{suspensionsCount}</p>
              </div>
              <GraduationCap className="w-12 h-12 text-blue-500 opacity-50" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-green-600 font-medium">My Reports</p>
                <p className="text-3xl font-bold text-green-900 mt-1">{myReportsCount}</p>
              </div>
              <FileText className="w-12 h-12 text-green-500 opacity-50" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-orange-600 font-medium">Temperature</p>
                <p className="text-3xl font-bold text-orange-900 mt-1">
                  {weather?.current?.temperature || '--'}°C
                </p>
              </div>
              <ThermometerSun className="w-12 h-12 text-orange-500 opacity-50" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Current Weather */}
      <Card className="bg-gradient-to-br from-indigo-50 to-purple-50 border-indigo-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Cloud className="w-6 h-6 text-indigo-500" />
            Current Weather - Batangas
          </CardTitle>
        </CardHeader>
        <CardContent>
          {weather && weather.current ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              <div className="text-center">
                <div className="flex items-center justify-center mb-2">
                  <ThermometerSun className="w-8 h-8 text-orange-500" />
                </div>
                <p className="text-2xl font-bold text-gray-900">{weather.current.temperature}°C</p>
                <p className="text-sm text-gray-600">Temperature</p>
                <p className="text-xs text-gray-500 mt-1">Feels like {weather.current.feelsLike}°C</p>
              </div>

              <div className="text-center">
                <div className="flex items-center justify-center mb-2">
                  <Droplets className="w-8 h-8 text-blue-500" />
                </div>
                <p className="text-2xl font-bold text-gray-900">{weather.current.humidity}%</p>
                <p className="text-sm text-gray-600">Humidity</p>
                <p className="text-xs text-gray-500 mt-1">{weather.current.rainfall || 0}mm/h rain</p>
              </div>

              <div className="text-center">
                <div className="flex items-center justify-center mb-2">
                  <Wind className="w-8 h-8 text-cyan-500" />
                </div>
                <p className="text-2xl font-bold text-gray-900">{weather.current.windSpeed} km/h</p>
                <p className="text-sm text-gray-600">Wind Speed</p>
                <p className="text-xs text-gray-500 mt-1">{weather.current.windDirection}</p>
              </div>

              <div className="text-center">
                <div className="flex items-center justify-center mb-2">
                  <Gauge className="w-8 h-8 text-purple-500" />
                </div>
                <p className="text-2xl font-bold text-gray-900">{weather.current.pressure} hPa</p>
                <p className="text-sm text-gray-600">Pressure</p>
                <p className="text-xs text-gray-500 mt-1">{weather.current.cloudiness}% clouds</p>
              </div>
            </div>
          ) : (
            <p className="text-gray-500 text-center">Weather data unavailable</p>
          )}

          {weather?.current?.weather && (
            <div className="mt-6 text-center">
              <Badge className="bg-indigo-500 text-white text-base px-4 py-2">
                {weather.current.weather.description}
              </Badge>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Weather Alerts */}
      {weather?.current && (weather.current.rainfall > 10 || weather.current.windSpeed > 40) && (
        <Card className="bg-gradient-to-br from-red-50 to-orange-50 border-red-300">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-900">
              <AlertTriangle className="w-6 h-6 text-red-600" />
              Weather Alerts
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {weather.current.rainfall > 10 && (
                <div className="flex items-start gap-3 p-3 bg-white rounded-lg">
                  <Droplets className="w-5 h-5 text-blue-600 mt-0.5" />
                  <div>
                    <p className="font-semibold text-gray-900">Heavy Rainfall</p>
                    <p className="text-sm text-gray-600">
                      {weather.current.rainfall.toFixed(1)} mm/h detected. Exercise caution when traveling.
                    </p>
                  </div>
                </div>
              )}
              {weather.current.windSpeed > 40 && (
                <div className="flex items-start gap-3 p-3 bg-white rounded-lg">
                  <Wind className="w-5 h-5 text-cyan-600 mt-0.5" />
                  <div>
                    <p className="font-semibold text-gray-900">Strong Winds</p>
                    <p className="text-sm text-gray-600">
                      {weather.current.windSpeed} km/h winds. Secure loose objects and avoid outdoor activities.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Hourly Forecast */}
      {hourlyForecast && hourlyForecast.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="w-5 h-5 text-blue-500" />
              12-Hour Forecast
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 md:grid-cols-6 gap-4">
              {hourlyForecast.slice(0, 6).map((hour, index) => (
                <div key={index} className="text-center p-3 bg-gray-50 rounded-lg">
                  <p className="text-xs text-gray-600 font-medium">{hour.time}</p>
                  <p className="text-lg font-bold text-gray-900 my-1">{hour.temperature}°C</p>
                  <div className="flex items-center justify-center gap-1 text-xs text-gray-500">
                    <Droplets className="w-3 h-3" />
                    {hour.rainChance}%
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
