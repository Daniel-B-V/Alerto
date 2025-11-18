/**
 * Test Role Dashboard - Modern Weather Interface
 * Clean, professional weather dashboard with Philippines focus
 */

import { useState, useEffect, useRef } from 'react';
import {
  Cloud,
  CloudRain,
  Sun,
  Wind,
  Droplets,
  Eye,
  Sunrise,
  Sunset,
  MapPin,
  Search,
  Bell,
  User,
  Home,
  Map as MapIcon,
  ChevronDown,
  Loader2,
  CloudDrizzle,
  Gauge,
  Navigation,
  Crosshair,
  ChevronLeft,
  LayoutDashboard,
  Settings as SettingsIcon,
  FileText,
  AlertTriangle,
  Thermometer,
  Plus,
  BarChart3
} from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { MapContainer, TileLayer, Marker, Popup, Polygon, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet-velocity/dist/leaflet-velocity.css';
import { BATANGAS_MUNICIPALITIES, BATANGAS_LOCATIONS as BATANGAS_LOCATIONS_MAP } from '../../../constants/batangasLocations';
import { BATANGAS_LOCATIONS } from '../../../constants/suspensionCriteria';
import { VelocityLayer } from '../../typhoon/VelocityLayer';
import {
  getCurrentWeather,
  getWeatherForecast,
  getBatangasWeather,
  getHourlyForecast
} from '../../../services/weatherService';
import { Header } from '../../shared/Header';
import { Button } from '../../ui/button';
import { SocketProvider } from '../../../contexts/SocketContext';
import { useAuth } from '../../../contexts/AuthContext';
import { setUserRole } from '../../../firebase/firestore';
import { Card } from '../../ui/card';
import { Alert, AlertDescription } from '../../ui/alert';
import { Badge } from '../../ui/badge';
import { Shield, Crown, Building2, Check, Info, FlaskConical, RefreshCw } from 'lucide-react';
import { AnalyticsPanel } from '../../analytics/AnalyticsPanel';
import { SuspensionForecastCard } from '../../analytics/SuspensionForecastCard';

// Fix for default marker icons in Leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Helper function to map weather conditions to icon names
const mapWeatherToIcon = (weatherMain) => {
  const iconMap = {
    'Clear': 'sun',
    'Clouds': 'cloud',
    'Rain': 'rain',
    'Drizzle': 'rain',
    'Thunderstorm': 'storm',
    'Snow': 'cloud',
    'Mist': 'cloud',
    'Fog': 'cloud',
    'Haze': 'cloud'
  };
  return iconMap[weatherMain] || 'cloud';
};

// Test Role Sidebar Component
function TestSidebar({ activeSection, onSectionChange }) {
  const [collapsed, setCollapsed] = useState(false);

  const navItems = [
    { id: "dashboard", icon: LayoutDashboard, label: "Weather Dashboard" },
    { id: "analytics", icon: BarChart3, label: "Analytics" },
    { id: "reports", icon: FileText, label: "Reports" },
    { id: "settings", icon: SettingsIcon, label: "Settings" },
  ];

  return (
    <div className={`bg-white/80 backdrop-blur-xl border-r border-gray-100/50 h-full transition-all duration-300 shadow-sm ${
      collapsed ? 'w-16' : 'w-64'
    }`}>
      {/* Header */}
      <div className="p-4 border-b border-gray-100/50">
        <div className="flex items-center justify-between">
          {!collapsed && (
            <div>
              <h2 className="font-semibold text-gray-900">Alerto</h2>
              <p className="text-xs text-gray-500">Test Dashboard</p>
            </div>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setCollapsed(!collapsed)}
            className="w-8 h-8 p-0 rounded-full hover:bg-gray-100"
          >
            <ChevronLeft className={`w-4 h-4 transition-transform ${collapsed ? 'rotate-180' : ''}`} />
          </Button>
        </div>
      </div>

      {/* Navigation */}
      <nav className="p-4 space-y-1">
        {navItems.map((item) => (
          <Button
            key={item.id}
            variant="ghost"
            className={`w-full justify-start rounded-xl transition-all duration-200 relative ${
              activeSection === item.id
                ? 'bg-blue-500 text-white shadow-lg hover:bg-blue-600 hover:shadow-xl'
                : 'hover:bg-gray-100 text-gray-600 hover:text-gray-900'
            }`}
            onClick={() => onSectionChange(item.id)}
          >
            <item.icon className="w-5 h-5" />
            {!collapsed && <span className="ml-3">{item.label}</span>}
          </Button>
        ))}
      </nav>

      {/* Status Indicator */}
      {!collapsed && (
        <div className="absolute bottom-4 left-4 right-4">
          <div className="bg-green-50/80 backdrop-blur-sm border border-green-200/50 rounded-xl p-3 shadow-sm">
            <div className="flex items-center gap-2 mb-1">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-sm font-medium text-green-800">Test Mode</span>
            </div>
            <p className="text-xs text-green-600">Experimental UI/UX Dashboard</p>
          </div>
        </div>
      )}
    </div>
  );
}

export function TestRoleDashboard() {
  const { user, logout } = useAuth();
  const [activeSection, setActiveSection] = useState('dashboard');
  const [activeTab, setActiveTab] = useState('today');
  const [selectedCity, setSelectedCity] = useState('BATANGAS CITY');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [weatherData, setWeatherData] = useState(null);
  const [detectingLocation, setDetectingLocation] = useState(false);
  const [userLocation, setUserLocation] = useState(null);
  const [locationError, setLocationError] = useState(null);

  // Role switching state
  const [selectedCityForRole, setSelectedCityForRole] = useState('Batangas City');
  const [switching, setSwitching] = useState(false);
  const [message, setMessage] = useState(null);

  const currentRole = user?.role || 'user';

  // Handle role switching
  const handleSwitchRole = async (role, city = null) => {
    setSwitching(true);
    setMessage(null);

    try {
      const result = await setUserRole(user.uid, role, city);

      if (result.success) {
        const roleLabel = role === 'governor' ? 'Governor' : role === 'mayor' ? `Mayor of ${city}` : role === 'test' ? 'Test Role' : 'User';
        setMessage({
          type: 'success',
          text: `✅ Successfully switched to ${roleLabel}! Refreshing...`
        });

        // Refresh page after 1.5 seconds
        setTimeout(() => {
          window.location.reload();
        }, 1500);
      } else {
        setMessage({
          type: 'error',
          text: `❌ Failed to switch role: ${result.error}`
        });
        setSwitching(false);
      }
    } catch (error) {
      setMessage({
        type: 'error',
        text: `❌ Error: ${error.message}`
      });
      setSwitching(false);
    }
  };

  // Detect user's location
  const detectLocation = () => {
    if (!navigator.geolocation) {
      setLocationError('Geolocation is not supported by your browser');
      return;
    }

    setDetectingLocation(true);
    setLocationError(null);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setUserLocation({
          lat: latitude,
          lng: longitude,
          city: 'Your Location'
        });
        setSelectedCity(`${latitude.toFixed(4)}, ${longitude.toFixed(4)}`);
        setDetectingLocation(false);
        console.log('Location detected:', latitude, longitude);
      },
      (error) => {
        setDetectingLocation(false);
        switch (error.code) {
          case error.PERMISSION_DENIED:
            setLocationError('Location access denied. Please enable location permissions.');
            break;
          case error.POSITION_UNAVAILABLE:
            setLocationError('Location information unavailable.');
            break;
          case error.TIMEOUT:
            setLocationError('Location request timed out.');
            break;
          default:
            setLocationError('An error occurred while detecting location.');
        }
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
      }
    );
  };

  // Fetch real-time weather data
  useEffect(() => {
    const fetchWeatherData = async () => {
      setLoading(true);
      try {
        // Determine city to fetch (use detected location or selected city)
        let cityName = selectedCity;
        if (userLocation && selectedCity.includes(',')) {
          // If using coordinates, default to Batangas City
          cityName = 'Batangas City';
        }

        // Fetch current weather (for Today)
        const currentWeather = await getCurrentWeather(cityName);

        // Fetch forecast (for Tomorrow and Week)
        const forecast = await getWeatherForecast(cityName);

        // Fetch hourly forecast for rain probability chart
        const hourly = await getHourlyForecast(cityName);

        // Fetch Batangas cities weather
        const batangasCitiesData = await getBatangasWeather();

        // Get wind direction label
        const getWindDirection = (deg) => {
          const directions = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
          const index = Math.round(deg / 45) % 8;
          return directions[index];
        };

        // Get rain intensity level
        const getRainIntensity = (rainfall) => {
          if (rainfall >= 7.5) return 'heavy';
          if (rainfall >= 2.5) return 'moderate';
          return 'light';
        };

        // Process current weather for Today
        const todayData = {
          temp: currentWeather.current.temperature,
          feels_like: currentWeather.current.feelsLike,
          condition: currentWeather.current.weather.description,
          icon: currentWeather.current.weather.icon,
          wind_speed: currentWeather.current.windSpeed,
          wind_direction: getWindDirection(currentWeather.current.windDirection),
          pressure: currentWeather.current.pressure,
          humidity: currentWeather.current.humidity,
          sunrise: currentWeather.sys.sunrise.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true }),
          sunset: currentWeather.sys.sunset.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true }),
          time: new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })
        };

        // Process tomorrow's forecast (first forecast entry after 24 hours)
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        tomorrow.setHours(12, 0, 0, 0); // Noon tomorrow

        const tomorrowForecast = forecast.forecast.find(f => {
          const forecastDate = new Date(f.timestamp);
          return forecastDate.getDate() === tomorrow.getDate();
        }) || forecast.forecast[8]; // Fallback to 24 hours ahead

        const tomorrowData = tomorrowForecast ? {
          temp: tomorrowForecast.temperature,
          feels_like: tomorrowForecast.feelsLike,
          condition: tomorrowForecast.weather.description,
          icon: tomorrowForecast.weather.icon,
          wind_speed: tomorrowForecast.windSpeed,
          wind_direction: 'N/A',
          pressure: tomorrowForecast.pressure,
          humidity: tomorrowForecast.humidity,
          sunrise: todayData.sunrise, // Use same as today (approximation)
          sunset: todayData.sunset,
          time: tomorrowForecast.timestamp.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })
        } : todayData; // Fallback to today if no tomorrow data

        // Process hourly rain data (next 6 hours)
        const hourlyRainData = hourly.slice(0, 6).map(h => ({
          hour: h.time,
          probability: Math.min(100, Math.round((h.rainfall / 10) * 100) || (h.weather === 'Rain' ? 60 : 20)),
          intensity: getRainIntensity(h.rainfall)
        }));

        // Process weekly forecast (group by day)
        const weekData = [];
        const processedDays = new Set();

        forecast.forecast.forEach(item => {
          const date = new Date(item.timestamp);
          const dayKey = date.toDateString();

          if (!processedDays.has(dayKey) && weekData.length < 6) {
            processedDays.add(dayKey);

            // Get all forecasts for this day
            const dayForecasts = forecast.forecast.filter(f =>
              new Date(f.timestamp).toDateString() === dayKey
            );

            // Calculate min/max temps for the day
            const temps = dayForecasts.map(f => f.temperature);
            const high = Math.max(...temps);
            const low = Math.min(...temps);

            weekData.push({
              day: date.toLocaleDateString('en-US', { weekday: 'short' }),
              temp: item.temperature,
              high,
              low,
              condition: item.weather.main.toLowerCase()
            });
          }
        });

        // Priority Batangas municipalities to display
        const priorityMunicipalities = [
          'BATANGAS CITY',
          'LIPA CITY',
          'TANAUAN CITY',
          'SANTO TOMAS',
          'NASUGBU',
          'BALAYAN',
          'LEMERY',
          'SAN JUAN',
          'ROSARIO',
          'CALACA',
          'BAUAN',
          'MABINI'
        ];

        // Process Batangas cities data - prioritize specific municipalities
        const batangasCitiesProcessed = batangasCitiesData
          .filter(city => {
            const cityName = city.location.city.toUpperCase();
            return priorityMunicipalities.some(pm => cityName.includes(pm));
          })
          .slice(0, 12)
          .map(city => ({
            name: city.location.city,
            temp: city.current.temperature,
            high: city.current.temperature + Math.floor(Math.random() * 3),
            low: city.current.temperature - Math.floor(Math.random() * 3),
            description: city.current.weather.description,
            icon: mapWeatherToIcon(city.current.weather.main)
          }));

        // Process weekly rain probability data (7 days)
        const weeklyRainProbability = weekData.slice(0, 7).map((day, index) => {
          // Calculate rain probability based on weather condition
          let probability = 20; // Default low probability
          const condition = day.condition.toLowerCase();

          if (condition.includes('rain') || condition.includes('storm')) {
            probability = 70 + Math.floor(Math.random() * 20); // 70-90%
          } else if (condition.includes('drizzle')) {
            probability = 50 + Math.floor(Math.random() * 20); // 50-70%
          } else if (condition.includes('cloud')) {
            probability = 30 + Math.floor(Math.random() * 20); // 30-50%
          } else if (condition.includes('clear') || condition.includes('sun')) {
            probability = 10 + Math.floor(Math.random() * 10); // 10-20%
          }

          return {
            day: day.day.toUpperCase(),
            probability: Math.min(100, probability),
            condition: day.condition,
            temp: day.temp
          };
        });

        setWeatherData({
          today: todayData,
          tomorrow: tomorrowData,
          current: todayData, // Default to today
          hourlyRain: hourlyRainData,
          week: weekData,
          weeklyRainProbability: weeklyRainProbability,
          batangasCities: batangasCitiesProcessed
        });

      } catch (error) {
        console.error('Error fetching weather data:', error);
        // Keep showing previous data or show error state
      } finally {
        setLoading(false);
      }
    };

    fetchWeatherData();

    // Refresh every 10 minutes
    const interval = setInterval(fetchWeatherData, 10 * 60 * 1000);
    return () => clearInterval(interval);
  }, [selectedCity, userLocation]);

  return (
    <SocketProvider>
      <div className="h-screen flex flex-col bg-gradient-to-br from-gray-50 to-blue-50/30">
        <Header />
        <div className="flex-1 flex overflow-hidden">
          <TestSidebar
            activeSection={activeSection}
            onSectionChange={setActiveSection}
          />
          <main className="flex-1 overflow-auto">
            <div className="p-6 bg-gradient-to-br from-gray-50/80 to-blue-50/50 min-h-full">
            {/* Weather Dashboard Content */}
            {activeSection === 'dashboard' && (
              <>
                {/* Tabs */}
                <div className="flex gap-8 mb-8">
                  {['today', 'tomorrow', 'week'].map((tab) => (
                    <button
                      key={tab}
                      onClick={() => setActiveTab(tab)}
                      className={`pb-3 font-semibold text-lg transition-all duration-200 border-b-2 ${
                        activeTab === tab
                          ? 'text-blue-600 border-blue-600'
                          : 'text-gray-400 border-transparent hover:text-gray-600'
                      }`}
                    >
                      {tab === 'today' ? 'Today' : tab === 'tomorrow' ? 'Tomorrow' : 'Next 7 days'}
                    </button>
                  ))}
                </div>

                {/* Main Weather Content */}
                {loading ? (
                  <div className="flex flex-col items-center justify-center h-96 bg-white rounded-3xl shadow-md border border-gray-100">
                    <Loader2 className="w-12 h-12 text-blue-500 animate-spin mb-4" />
                    <p className="text-gray-600 font-medium">Loading weather data...</p>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {/* Today/Tomorrow View */}
                    {(activeTab === 'today' || activeTab === 'tomorrow') && weatherData && (
                      <>
                        {/* 2×2 Grid Layout */}
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 auto-rows-fr">
                          {/* Row 1, Column 1 (Top Left): Today + 7 Days */}
                          <div className="flex flex-col gap-4">
                            {/* Current Day Card */}
                            <CurrentDayCard data={activeTab === 'today' ? weatherData.today : weatherData.tomorrow} />

                            {/* Next 7 Days */}
                            <div className="bg-white rounded-2xl shadow-md border border-gray-200 p-4">
                              <h3 className="text-sm font-bold text-gray-900 mb-3">Next 7 Days</h3>
                              <div className="grid grid-cols-7 gap-2">
                                {weatherData.week && weatherData.week.slice(0, 7).map((day, index) => (
                                  <WeekDayCardMini key={index} day={day} />
                                ))}
                              </div>
                            </div>
                          </div>

                          {/* Row 1, Column 2 (Top Right): Chance of Rain Line Chart */}
                          {weatherData.weeklyRainProbability && (
                            <ChanceOfRainLineChart data={weatherData.weeklyRainProbability} />
                          )}

                          {/* Row 2, Column 1 (Bottom Left): Today's Overview */}
                          <TodaysOverview data={activeTab === 'today' ? weatherData.today : weatherData.tomorrow} />

                          {/* Row 2, Column 2 (Bottom Right): Other Cities */}
                          <BatangasCitiesPanel cities={weatherData?.batangasCities || []} />
                        </div>

                        {/* Map Section - Below the 2×2 grid */}
                        <PhilippinesWeatherMap />
                      </>
                    )}

                    {/* Week View - Full 7 days */}
                    {activeTab === 'week' && weatherData && (
                      <WeekForecast days={weatherData.week} />
                    )}
                  </div>
                )}
              </>
            )}

            {/* Analytics Section */}
            {activeSection === 'analytics' && (
              <div className="space-y-6">
                {/* ARIMA Suspension Forecast - Compact */}
                <SuspensionForecastCard city="Batangas City" />

                {/* Original Analytics Panel */}
                <AnalyticsPanel />
              </div>
            )}

            {/* Placeholder for other sections */}
            {activeSection === 'reports' && (
              <div className="bg-white rounded-xl p-8 text-center">
                <FileText className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                <h3 className="text-xl font-semibold text-gray-900 mb-2">Reports Section</h3>
                <p className="text-gray-600">This section is under development.</p>
              </div>
            )}

            {activeSection === 'settings' && (
              <div className="space-y-6 max-w-4xl">
                {/* Header */}
                <div>
                  <h1 className="text-3xl font-bold text-gray-900 mb-2">Settings</h1>
                  <p className="text-gray-600">Manage your account and role settings</p>
                </div>

                {/* Current User Info */}
                <Card className="p-6 bg-white rounded-xl shadow-md border border-gray-200">
                  <h2 className="text-xl font-bold mb-4 flex items-center">
                    <User className="w-5 h-5 mr-2" />
                    Current User
                  </h2>

                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Email:</span>
                      <span className="font-medium">{user?.email}</span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Display Name:</span>
                      <span className="font-medium">{user?.displayName || 'Not set'}</span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">User ID:</span>
                      <span className="font-mono text-xs text-gray-500">{user?.uid}</span>
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t">
                      <span className="text-sm text-gray-600">Current Role:</span>
                      <Badge className={
                        currentRole === 'governor' || currentRole === 'admin' || currentRole === 'super_admin'
                          ? 'bg-purple-100 text-purple-800'
                          : currentRole === 'mayor'
                          ? 'bg-blue-100 text-blue-800'
                          : currentRole === 'test'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-gray-100 text-gray-800'
                      }>
                        {currentRole === 'governor' || currentRole === 'admin' || currentRole === 'super_admin'
                          ? '👑 Governor/Admin'
                          : currentRole === 'mayor'
                          ? `🏛️ Mayor${user?.assignedCity ? ` of ${user.assignedCity}` : ''}`
                          : currentRole === 'test'
                          ? '🧪 Test Role'
                          : '👤 User'}
                      </Badge>
                    </div>

                    {user?.assignedCity && currentRole === 'mayor' && (
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Assigned City:</span>
                        <span className="font-medium text-blue-600">{user.assignedCity}</span>
                      </div>
                    )}

                    {user?.assignedProvince && (
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Province:</span>
                        <span className="font-medium">{user.assignedProvince}</span>
                      </div>
                    )}
                  </div>
                </Card>

                {/* Role Management */}
                <Card className="p-6 bg-white rounded-xl shadow-md border border-gray-200">
                  <h2 className="text-xl font-bold mb-4 flex items-center">
                    <Shield className="w-5 h-5 mr-2" />
                    Role Management
                  </h2>

                  <Alert className="mb-6 bg-blue-50 border-blue-200">
                    <Info className="h-4 w-4 text-blue-600" />
                    <AlertDescription className="text-blue-800 text-sm">
                      <strong>Development Feature:</strong> Switch between roles to test different views and permissions.
                      In production, roles would be assigned by administrators only.
                    </AlertDescription>
                  </Alert>

                  {message && (
                    <Alert className={message.type === 'success' ? 'bg-green-50 border-green-200 mb-4' : 'bg-red-50 border-red-200 mb-4'}>
                      <AlertDescription className={message.type === 'success' ? 'text-green-800' : 'text-red-800'}>
                        {message.text}
                      </AlertDescription>
                    </Alert>
                  )}

                  <div className="space-y-6">
                    {/* Governor Option */}
                    <div className="border-2 rounded-lg p-5 hover:border-purple-300 hover:bg-purple-50/30 transition-all">
                      <div className="flex items-center mb-3">
                        <Crown className="w-5 h-5 text-purple-600 mr-2" />
                        <h3 className="font-bold text-lg">Governor</h3>
                        {(currentRole === 'governor' || currentRole === 'admin' || currentRole === 'super_admin') && (
                          <Badge className="ml-2 bg-green-100 text-green-800">
                            <Check className="w-3 h-3 mr-1" />
                            Current
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-gray-600 mb-3">
                        Full access to all cities, can issue suspensions directly, approve mayor requests, view analytics.
                      </p>
                      <ul className="text-xs text-gray-500 space-y-1 mb-4">
                        <li>✓ View all 34 Batangas cities</li>
                        <li>✓ Issue and manage suspensions</li>
                        <li>✓ Approve/reject mayor requests</li>
                        <li>✓ Access analytics dashboard</li>
                      </ul>
                      <div className="pt-3 border-t mt-4">
                        <button
                          onClick={() => handleSwitchRole('governor')}
                          disabled={switching || currentRole === 'governor' || currentRole === 'admin' || currentRole === 'super_admin'}
                          className="w-full !bg-purple-600 hover:!bg-purple-700 disabled:!bg-gray-400 disabled:cursor-not-allowed !text-white font-semibold py-3 px-4 rounded-lg transition-colors flex items-center justify-center gap-2"
                          style={{ backgroundColor: switching || currentRole === 'governor' || currentRole === 'admin' || currentRole === 'super_admin' ? '#9ca3af' : '#9333ea', color: 'white' }}
                        >
                          {switching ? (
                            <>
                              <RefreshCw className="w-4 h-4 animate-spin" />
                              Switching...
                            </>
                          ) : (currentRole === 'governor' || currentRole === 'admin' || currentRole === 'super_admin') ? (
                            'Current Role'
                          ) : (
                            'Switch to Governor'
                          )}
                        </button>
                      </div>
                    </div>

                    {/* Mayor Option */}
                    <div className="border-2 rounded-lg p-5 hover:border-blue-300 hover:bg-blue-50/30 transition-all">
                      <div className="flex items-center mb-3">
                        <Building2 className="w-5 h-5 text-blue-600 mr-2" />
                        <h3 className="font-bold text-lg">Mayor</h3>
                        {currentRole === 'mayor' && (
                          <Badge className="ml-2 bg-green-100 text-green-800">
                            <Check className="w-3 h-3 mr-1" />
                            Current
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-gray-600 mb-3">
                        City-specific view, can request suspensions from governor, limited to assigned city only.
                      </p>
                      <ul className="text-xs text-gray-500 space-y-1 mb-4">
                        <li>✓ View your city's weather only</li>
                        <li>✓ 12-hour forecast chart</li>
                        <li>✓ Request suspensions (needs approval)</li>
                        <li>✓ Track your request status</li>
                      </ul>

                      {/* City Selector */}
                      <div className="mb-4">
                        <label className="flex items-center text-sm font-medium text-gray-700 mb-2">
                          <MapPin className="w-4 h-4 mr-1" />
                          Select Your City:
                        </label>
                        <select
                          value={selectedCityForRole}
                          onChange={(e) => setSelectedCityForRole(e.target.value)}
                          className="w-full border-2 rounded-lg px-3 py-2.5 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                          disabled={switching}
                        >
                          {BATANGAS_LOCATIONS.map(city => (
                            <option key={city} value={city}>{city}</option>
                          ))}
                        </select>
                      </div>

                      <div className="pt-3 border-t mt-4">
                        <button
                          onClick={() => handleSwitchRole('mayor', selectedCityForRole)}
                          disabled={switching || (currentRole === 'mayor' && user?.assignedCity === selectedCityForRole)}
                          className="w-full !bg-blue-600 hover:!bg-blue-700 disabled:!bg-gray-400 disabled:cursor-not-allowed !text-white font-semibold py-3 px-4 rounded-lg transition-colors flex items-center justify-center gap-2"
                          style={{ backgroundColor: switching || (currentRole === 'mayor' && user?.assignedCity === selectedCityForRole) ? '#9ca3af' : '#2563eb', color: 'white' }}
                        >
                          {switching ? (
                            <>
                              <RefreshCw className="w-4 h-4 animate-spin" />
                              Switching...
                            </>
                          ) : (currentRole === 'mayor' && user?.assignedCity === selectedCityForRole) ? (
                            'Current Role'
                          ) : (
                            'Switch to Mayor'
                          )}
                        </button>
                      </div>
                    </div>

                    {/* Regular User Option */}
                    <div className="border-2 rounded-lg p-5 hover:border-gray-300 hover:bg-gray-50/50 transition-all">
                      <div className="flex items-center mb-3">
                        <User className="w-5 h-5 text-gray-600 mr-2" />
                        <h3 className="font-bold text-lg">Regular User</h3>
                        {currentRole === 'user' && (
                          <Badge className="ml-2 bg-green-100 text-green-800">
                            <Check className="w-3 h-3 mr-1" />
                            Current
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-gray-600 mb-3">
                        Standard citizen access, can view public information and submit community reports.
                      </p>
                      <ul className="text-xs text-gray-500 space-y-1 mb-4">
                        <li>✓ View active suspensions</li>
                        <li>✓ Submit community reports</li>
                        <li>✓ View weather information</li>
                      </ul>
                      <div className="pt-3 border-t mt-4">
                        <button
                          onClick={() => handleSwitchRole('user')}
                          disabled={switching || currentRole === 'user'}
                          className="w-full !bg-gray-600 hover:!bg-gray-700 disabled:!bg-gray-400 disabled:cursor-not-allowed !text-white font-semibold py-3 px-4 rounded-lg transition-colors flex items-center justify-center gap-2"
                          style={{ backgroundColor: switching || currentRole === 'user' ? '#9ca3af' : '#4b5563', color: 'white' }}
                        >
                          {switching ? (
                            <>
                              <RefreshCw className="w-4 h-4 animate-spin" />
                              Switching...
                            </>
                          ) : currentRole === 'user' ? (
                            'Current Role'
                          ) : (
                            'Switch to User'
                          )}
                        </button>
                      </div>
                    </div>

                    {/* Test Role Option */}
                    <div className="border-2 rounded-lg p-5 hover:border-green-300 hover:bg-green-50/30 transition-all">
                      <div className="flex items-center mb-3">
                        <FlaskConical className="w-5 h-5 text-green-600 mr-2" />
                        <h3 className="font-bold text-lg">Test Role</h3>
                        {currentRole === 'test' && (
                          <Badge className="ml-2 bg-green-100 text-green-800">
                            <Check className="w-3 h-3 mr-1" />
                            Current
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-gray-600 mb-3">
                        Same permissions as regular user, designed for UI/UX experimentation and testing.
                      </p>
                      <ul className="text-xs text-gray-500 space-y-1 mb-4">
                        <li>✓ View active suspensions</li>
                        <li>✓ Submit community reports</li>
                        <li>✓ View weather information</li>
                        <li>✓ Test UI/UX changes safely</li>
                      </ul>
                      <div className="pt-3 border-t mt-4">
                        <button
                          onClick={() => handleSwitchRole('test')}
                          disabled={switching || currentRole === 'test'}
                          className="w-full !bg-green-600 hover:!bg-green-700 disabled:!bg-gray-400 disabled:cursor-not-allowed !text-white font-semibold py-3 px-4 rounded-lg transition-colors flex items-center justify-center gap-2"
                          style={{ backgroundColor: switching || currentRole === 'test' ? '#9ca3af' : '#16a34a', color: 'white' }}
                        >
                          {switching ? (
                            <>
                              <RefreshCw className="w-4 h-4 animate-spin" />
                              Switching...
                            </>
                          ) : currentRole === 'test' ? (
                            'Current Role'
                          ) : (
                            'Switch to Test Role'
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                </Card>

                {/* Account Actions */}
                <Card className="p-6 bg-white rounded-xl shadow-md border border-gray-200">
                  <h2 className="text-xl font-bold mb-4">Account Actions</h2>
                  <Button
                    onClick={logout}
                    variant="outline"
                    className="text-red-600 border-red-200 hover:bg-red-50"
                  >
                    Sign Out
                  </Button>
                </Card>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
    </SocketProvider>
  );
}

// Current Day Card - Large card for today/tomorrow (matching reference)
function CurrentDayCard({ data }) {
  const getWeatherIcon = () => {
    const condition = data.condition.toLowerCase();
    if (condition.includes('clear') || condition.includes('sun')) {
      return <Sun className="w-24 h-24 text-yellow-400" />;
    } else if (condition.includes('rain')) {
      return <CloudRain className="w-24 h-24 text-blue-400" />;
    } else if (condition.includes('cloud')) {
      return <Cloud className="w-24 h-24 text-gray-400" />;
    }
    return <Cloud className="w-24 h-24 text-gray-400" />;
  };

  return (
    <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-2xl shadow-md border border-gray-200 p-5 flex flex-col justify-between min-h-[380px]">
      {/* Day Label and Time */}
      <div className="mb-3">
        <div className="text-xs text-gray-600 mb-1">Current Time</div>
        <div className="text-lg font-bold text-gray-900">{data.time}</div>
      </div>

      {/* Main Temperature & Icon */}
      <div className="flex items-center justify-between my-4">
        <div className="text-8xl font-bold text-gray-900 leading-none">
          {data.temp}°
        </div>
        <div className="ml-3">
          {getWeatherIcon()}
        </div>
      </div>

      {/* Real Feel */}
      <div className="text-base text-gray-600 mb-4">
        Real feel {data.feels_like}°
      </div>

      {/* Weather Details - Compact */}
      <div className="space-y-1.5 mb-4">
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-600">Wind: {data.wind_direction}</span>
          <span className="font-semibold text-gray-900">{data.wind_speed}km/h</span>
        </div>
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-600">Pressure:</span>
          <span className="font-semibold text-gray-900">{data.pressure}MB</span>
        </div>
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-600">Humidity:</span>
          <span className="font-semibold text-gray-900">{data.humidity}%</span>
        </div>
      </div>

      {/* Sunrise/Sunset - Bottom */}
      <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-300">
        <div className="flex items-center gap-2">
          <Sunrise className="w-5 h-5 text-orange-400" />
          <div>
            <div className="text-xs text-gray-500">Sunrise</div>
            <div className="text-sm font-medium text-gray-900">{data.sunrise}</div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Sunset className="w-5 h-5 text-orange-400" />
          <div>
            <div className="text-xs text-gray-500">Sunset</div>
            <div className="text-sm font-medium text-gray-900">{data.sunset}</div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Week Day Card - Small cards for week preview (matching reference)
function WeekDayCard({ day }) {
  const getWeatherIcon = (condition) => {
    switch (condition) {
      case 'clear':
      case 'sunny':
        return <Sun className="w-12 h-12 text-yellow-400" />;
      case 'clouds':
      case 'cloudy':
        return <Cloud className="w-12 h-12 text-gray-400" />;
      case 'rain':
      case 'rainy':
        return <CloudRain className="w-12 h-12 text-blue-400" />;
      default:
        return <Cloud className="w-12 h-12 text-gray-400" />;
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-md border border-gray-200 p-5 hover:shadow-lg transition-all duration-200 h-full flex flex-col justify-center">
      <div className="text-center">
        <div className="font-semibold text-gray-900 text-base mb-3">{day.day}</div>
        <div className="flex justify-center mb-3">
          {getWeatherIcon(day.condition)}
        </div>
        <div className="text-4xl font-bold text-gray-900 mb-2">{day.temp}°</div>
        <div className="text-sm text-gray-500">
          <span className="text-red-500 font-medium">{day.high}°</span>
          {' / '}
          <span className="text-blue-500 font-medium">{day.low}°</span>
        </div>
      </div>
    </div>
  );
}

// Week Day Card Horizontal - Compact cards for horizontal row layout
function WeekDayCardHorizontal({ day }) {
  const getWeatherIcon = (condition) => {
    switch (condition) {
      case 'clear':
      case 'sunny':
        return <Sun className="w-10 h-10 text-yellow-400" />;
      case 'clouds':
      case 'cloudy':
        return <Cloud className="w-10 h-10 text-gray-400" />;
      case 'rain':
      case 'rainy':
        return <CloudRain className="w-10 h-10 text-blue-400" />;
      default:
        return <Cloud className="w-10 h-10 text-gray-400" />;
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-md border border-gray-200 p-4 hover:shadow-lg transition-all duration-200 flex flex-col items-center justify-center min-h-[180px]">
      <div className="text-center w-full">
        <div className="font-bold text-gray-900 text-sm mb-3">{day.day}</div>
        <div className="flex justify-center mb-3">
          {getWeatherIcon(day.condition)}
        </div>
        <div className="text-3xl font-bold text-gray-900 mb-2">{day.temp}°</div>
        <div className="text-xs text-gray-500">
          <span className="text-red-500 font-semibold">{day.high}°</span>
          <span className="mx-1">/</span>
          <span className="text-blue-500 font-semibold">{day.low}°</span>
        </div>
      </div>
    </div>
  );
}

// Week Day Card Compact - Even more compact for the reference design layout
function WeekDayCardCompact({ day }) {
  const getWeatherIcon = (condition) => {
    switch (condition) {
      case 'clear':
      case 'sunny':
        return <Sun className="w-10 h-10 text-yellow-400" />;
      case 'clouds':
      case 'cloudy':
        return <Cloud className="w-10 h-10 text-gray-400" />;
      case 'rain':
      case 'rainy':
        return <CloudRain className="w-10 h-10 text-blue-400" />;
      default:
        return <Cloud className="w-10 h-10 text-gray-400" />;
    }
  };

  return (
    <div className="bg-gradient-to-br from-gray-50 to-white rounded-xl shadow-sm border border-gray-200 p-3 hover:shadow-md transition-all duration-200 flex flex-col items-center justify-center min-h-[140px]">
      <div className="text-center w-full">
        <div className="font-bold text-gray-800 text-xs uppercase mb-2">{day.day}</div>
        <div className="flex justify-center mb-2">
          {getWeatherIcon(day.condition)}
        </div>
        <div className="text-xl font-bold text-gray-900 mb-1">{day.temp}°</div>
        <div className="text-[10px] text-gray-500">
          <span className="text-red-500 font-semibold">{day.high}°</span>
          <span className="mx-1">/</span>
          <span className="text-blue-500 font-semibold">{day.low}°</span>
        </div>
      </div>
    </div>
  );
}

function WeatherDetailCard({ icon: Icon, label, value, subtitle }) {
  return (
    <div className="bg-gradient-to-br from-gray-50 to-white rounded-2xl p-5 border border-gray-200 hover:shadow-md transition-all duration-200">
      <div className="flex items-center gap-2 mb-3">
        <div className="p-2 bg-blue-50 rounded-lg">
          <Icon className="w-4 h-4 text-blue-600" />
        </div>
        <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">{label}</span>
      </div>
      <div className="text-2xl font-bold text-gray-900">{value}</div>
      {subtitle && <div className="text-sm text-gray-500 mt-1">{subtitle}</div>}
    </div>
  );
}

// Week Forecast
function WeekForecast({ days }) {
  const getWeatherIcon = (condition) => {
    switch (condition) {
      case 'clear':
      case 'sunny':
        return <Sun className="w-12 h-12 text-yellow-400" />;
      case 'clouds':
      case 'cloudy':
        return <Cloud className="w-12 h-12 text-gray-400" />;
      case 'partly-cloudy':
        return <Cloud className="w-12 h-12 text-blue-400" />;
      case 'rain':
      case 'rainy':
        return <CloudRain className="w-12 h-12 text-blue-500" />;
      default:
        return <Cloud className="w-12 h-12 text-gray-400" />;
    }
  };

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
      {days.map((day, index) => (
        <div
          key={index}
          className="bg-white rounded-2xl p-6 text-center border border-gray-100 hover:shadow-lg hover:scale-105 transition-all duration-200 cursor-pointer"
        >
          <div className="font-bold text-gray-900 mb-4">{day.day}</div>
          <div className="flex justify-center mb-4">
            {getWeatherIcon(day.condition)}
          </div>
          <div className="text-3xl font-bold text-gray-900 mb-2">{day.temp}°</div>
          <div className="text-sm text-gray-500">
            <span className="text-red-500 font-medium">{day.high}°</span>
            {' / '}
            <span className="text-blue-500 font-medium">{day.low}°</span>
          </div>
        </div>
      ))}
    </div>
  );
}

// Chance of Rain - Compact Version
function ChanceOfRainChart({ data }) {
  const getBarColor = (intensity) => {
    switch (intensity) {
      case 'light': return 'bg-blue-300';
      case 'moderate': return 'bg-blue-500';
      case 'heavy': return 'bg-blue-700';
      default: return 'bg-blue-300';
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-md border border-gray-200 p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-base font-bold text-gray-900">Chance of rain</h3>
      </div>

      {/* Legend */}
      <div className="flex gap-3 mb-3 text-xs">
        {[
          { color: 'bg-blue-300', label: 'Light' },
          { color: 'bg-blue-500', label: 'Moderate' },
          { color: 'bg-blue-700', label: 'Heavy' }
        ].map((item, i) => (
          <div key={i} className="flex items-center gap-1.5 text-gray-600">
            <div className={`w-2.5 h-2.5 rounded ${item.color}`}></div>
            <span>{item.label}</span>
          </div>
        ))}
      </div>

      {/* Chart */}
      <div className="flex items-end justify-between gap-2 h-24">
        {data.map((item, index) => (
          <div key={index} className="flex-1 flex flex-col items-center gap-1">
            <div className="text-xs font-semibold text-blue-600">{item.probability}%</div>
            <div className="w-full h-24 flex items-end">
              <div
                className={`w-full rounded-t-lg transition-all duration-300 ${getBarColor(item.intensity)}`}
                style={{ height: `${item.probability}%` }}
              ></div>
            </div>
            <div className="text-xs text-gray-500">{item.hour}</div>
          </div>
        ))}
      </div>
    </div>
  );
}


// Map Layer Controller Component
function MapLayerController({ activeLayer }) {
  const map = useMap();

  useEffect(() => {
    // Remove all existing weather layers
    map.eachLayer((layer) => {
      if (layer.options && layer.options.className && layer.options.className.includes('weather-layer')) {
        map.removeLayer(layer);
      }
    });

    const apiKey = import.meta.env.VITE_WEATHER_API_KEY;

    // Add selected weather layer
    if (activeLayer && activeLayer !== 'default') {
      let layerUrl = '';

      switch (activeLayer) {
        case 'wind':
          layerUrl = `https://tile.openweathermap.org/map/wind_new/{z}/{x}/{y}.png?appid=${apiKey}`;
          break;
        case 'rain':
          layerUrl = `https://tile.openweathermap.org/map/precipitation_new/{z}/{x}/{y}.png?appid=${apiKey}`;
          break;
        case 'clouds':
          layerUrl = `https://tile.openweathermap.org/map/clouds_new/{z}/{x}/{y}.png?appid=${apiKey}`;
          break;
        case 'temp':
          layerUrl = `https://tile.openweathermap.org/map/temp_new/{z}/{x}/{y}.png?appid=${apiKey}`;
          break;
      }

      if (layerUrl) {
        L.tileLayer(layerUrl, {
          className: 'weather-layer',
          opacity: 0.6,
          maxZoom: 19
        }).addTo(map);
      }
    }
  }, [activeLayer, map]);

  return null;
}

// Philippines Map
function PhilippinesWeatherMap() {
  const [mapLayer, setMapLayer] = useState('default');

  // Major Philippine cities with coordinates
  const philippineCities = [
    { name: 'Manila', lat: 14.5995, lng: 120.9842, temp: 28, condition: 'Partly Cloudy' },
    { name: 'Quezon City', lat: 14.6760, lng: 121.0437, temp: 27, condition: 'Sunny' },
    { name: 'Cebu City', lat: 10.3157, lng: 123.8854, temp: 29, condition: 'Cloudy' },
    { name: 'Davao City', lat: 7.1907, lng: 125.4553, temp: 30, condition: 'Rainy' },
    { name: 'Batangas City', lat: 13.7565, lng: 121.0583, temp: 26, condition: 'Partly Cloudy' },
    { name: 'Baguio', lat: 16.4023, lng: 120.5960, temp: 18, condition: 'Cloudy' },
    { name: 'Iloilo City', lat: 10.7202, lng: 122.5621, temp: 28, condition: 'Sunny' },
    { name: 'Cagayan de Oro', lat: 8.4542, lng: 124.6319, temp: 29, condition: 'Partly Cloudy' }
  ];

  // Philippines boundaries
  const philippinesBounds = [
    [4.5, 116.0],  // Southwest coordinates
    [21.0, 127.0]  // Northeast coordinates
  ];

  // PAR (Philippine Area of Responsibility) coordinates
  const parCoordinates = [
    [25, 120],     // Northwest corner
    [25, 135],     // Northeast corner
    [5, 135],      // Southeast corner (Mindanao area)
    [5, 115],      // Southwest corner
    [15, 115],     // West side point
    [21, 120],     // Back to near northwest
    [25, 120]      // Close the polygon
  ];

  // Batangas cities coordinates for map markers
  const batangasCities = [
    { name: 'Batangas City', lat: 13.7565, lng: 121.0583, temp: 28, condition: 'Partly Cloudy' },
    { name: 'Lipa City', lat: 13.9411, lng: 121.1624, temp: 27, condition: 'Sunny' },
    { name: 'Tanauan City', lat: 14.0856, lng: 121.1489, temp: 26, condition: 'Cloudy' },
    { name: 'Santo Tomas', lat: 14.1078, lng: 121.1414, temp: 27, condition: 'Partly Cloudy' },
    { name: 'Lemery', lat: 13.9167, lng: 120.8939, temp: 29, condition: 'Sunny' },
    { name: 'Balayan', lat: 13.9392, lng: 120.7333, temp: 28, condition: 'Sunny' },
    { name: 'Nasugbu', lat: 14.0692, lng: 120.6322, temp: 30, condition: 'Clear' }
  ];

  return (
    <div className="bg-white rounded-2xl shadow-md border border-gray-200 overflow-hidden">
      <div className="p-5 border-b border-gray-200">
        <h3 className="text-lg font-bold text-gray-900">Philippines Weather Map</h3>
        <p className="text-sm text-gray-500 mt-1">Real-time conditions across the country</p>
      </div>

      <div className="relative h-[350px]">
        <MapContainer
          center={[12.8797, 121.7740]}
          zoom={5.5}
          minZoom={5}
          maxZoom={18}
          style={{ height: '100%', width: '100%', borderRadius: '16px' }}
          zoomControl={true}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          {/* PAR Boundary Line */}
          <Polygon
            positions={parCoordinates}
            pathOptions={{
              color: '#f59e0b',
              weight: 3,
              opacity: 0.8,
              fillOpacity: 0.05,
              dashArray: '10, 10'
            }}
          >
            <Popup>
              <div style={{ padding: '8px' }}>
                <div style={{ fontWeight: '700', fontSize: '14px', marginBottom: '4px' }}>
                  Philippine Area of Responsibility (PAR)
                </div>
                <div style={{ fontSize: '12px', color: '#64748b' }}>
                  PAGASA's tropical cyclone monitoring area
                </div>
              </div>
            </Popup>
          </Polygon>

          {/* Weather Layer Controller */}
          <MapLayerController activeLayer={mapLayer} />

          {/* Wind Animation using VelocityLayer */}
          <VelocityLayer active={mapLayer === 'wind'} />

          {/* Major Philippine cities markers */}
          {philippineCities.map((city, index) => (
            <Marker key={`ph-${index}`} position={[city.lat, city.lng]}>
              <Popup>
                <div style={{ padding: '8px', minWidth: '150px' }}>
                  <div style={{ fontWeight: '700', fontSize: '16px', marginBottom: '8px' }}>{city.name}</div>
                  <div style={{ fontSize: '24px', fontWeight: '700', color: '#3b82f6', marginBottom: '4px' }}>
                    {city.temp}°C
                  </div>
                  <div style={{ fontSize: '14px', color: '#64748b' }}>{city.condition}</div>
                </div>
              </Popup>
            </Marker>
          ))}

          {/* Batangas cities markers with distinct styling */}
          {batangasCities.map((city, index) => (
            <Marker
              key={`btg-${index}`}
              position={[city.lat, city.lng]}
            >
              <Popup>
                <div style={{ padding: '10px', minWidth: '160px' }}>
                  <div style={{
                    fontWeight: '700',
                    fontSize: '16px',
                    marginBottom: '8px',
                    color: '#1e40af',
                    borderBottom: '2px solid #3b82f6',
                    paddingBottom: '4px'
                  }}>
                    {city.name}
                  </div>
                  <div style={{ fontSize: '26px', fontWeight: '700', color: '#3b82f6', marginBottom: '4px' }}>
                    {city.temp}°C
                  </div>
                  <div style={{ fontSize: '14px', color: '#64748b', marginBottom: '4px' }}>{city.condition}</div>
                  <div style={{
                    fontSize: '11px',
                    color: '#6b7280',
                    fontStyle: 'italic',
                    marginTop: '6px',
                    paddingTop: '6px',
                    borderTop: '1px solid #e5e7eb'
                  }}>
                    Batangas Province
                  </div>
                </div>
              </Popup>
            </Marker>
          ))}
        </MapContainer>

        {/* Map Controls */}
        <div className="absolute top-4 right-4 bg-white/95 backdrop-blur-sm rounded-xl shadow-lg border border-gray-200 p-2 z-[1000]">
          <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide px-3 py-2">
            Map Layers
          </div>
          <button
            onClick={() => setMapLayer('default')}
            className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
              mapLayer === 'default'
                ? 'bg-blue-500 text-white shadow-md'
                : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            <MapIcon className="w-4 h-4" />
            Default
          </button>
          {[
            { icon: Wind, label: 'Wind', value: 'wind' },
            { icon: Gauge, label: 'Temperature', value: 'temp' },
            { icon: CloudRain, label: 'Rain', value: 'rain' },
            { icon: Cloud, label: 'Clouds', value: 'clouds' }
          ].map((item, i) => (
            <button
              key={i}
              onClick={() => setMapLayer(item.value)}
              className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                mapLayer === item.value
                  ? 'bg-blue-500 text-white shadow-md'
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              <item.icon className="w-4 h-4" />
              {item.label}
            </button>
          ))}
        </div>

        {/* Explore Map Overlay Card */}
        <div className="absolute bottom-4 left-4 bg-white/95 backdrop-blur-sm rounded-xl shadow-lg border border-gray-200 p-4 z-[1000] max-w-xs">
          <h4 className="font-bold text-gray-900 mb-1">Philippines Weather Map</h4>
          <p className="text-sm text-gray-600 mb-3">
            View real-time weather across the Philippines
          </p>
          <button className="w-full bg-blue-500 hover:bg-blue-600 text-white font-medium py-2 px-4 rounded-lg transition-all duration-200 hover:shadow-md">
            Explore Map
          </button>
        </div>
      </div>
    </div>
  );
}

// Today's Overview Component - Wind, UV Index, Humidity, Visibility
function TodaysOverview({ data }) {
  // Calculate UV Index (0-11 scale) - simulated from current weather data
  const calculateUVIndex = (temp, humidity) => {
    // Simple simulation: higher temp and lower humidity = higher UV
    const baseUV = ((temp - 20) / 5) * 2;
    const humidityFactor = (100 - humidity) / 20;
    const uvIndex = Math.min(11, Math.max(0, baseUV + humidityFactor));
    return Math.round(uvIndex * 10) / 10;
  };

  // Calculate visibility based on humidity and weather condition
  const calculateVisibility = (humidity, condition) => {
    const baseVisibility = 10; // km
    if (condition.toLowerCase().includes('rain')) return 5;
    if (condition.toLowerCase().includes('fog') || condition.toLowerCase().includes('mist')) return 2;
    if (humidity > 80) return 6;
    if (humidity > 60) return 8;
    return baseVisibility;
  };

  const uvIndex = calculateUVIndex(data.temp, data.humidity);
  const visibility = calculateVisibility(data.humidity, data.condition);

  // UV Level categorization
  const getUVLevel = (uv) => {
    if (uv <= 2) return { level: 'Low', color: 'text-green-600', bg: 'bg-green-100' };
    if (uv <= 5) return { level: 'Moderate', color: 'text-yellow-600', bg: 'bg-yellow-100' };
    if (uv <= 7) return { level: 'High', color: 'text-orange-600', bg: 'bg-orange-100' };
    if (uv <= 10) return { level: 'Very High', color: 'text-red-600', bg: 'bg-red-100' };
    return { level: 'Extreme', color: 'text-purple-600', bg: 'bg-purple-100' };
  };

  const uvLevel = getUVLevel(uvIndex);

  return (
    <div className="bg-white rounded-2xl shadow-md border border-gray-200 p-5">
      <h3 className="text-lg font-bold text-gray-900 mb-4">Today's Overview</h3>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Wind Status */}
        <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-xl p-4 border border-blue-100">
          <div className="flex items-center gap-2 mb-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Wind className="w-5 h-5 text-blue-600" />
            </div>
            <span className="text-sm font-semibold text-gray-700">Wind Status</span>
          </div>

          {/* Wind Speed Bar */}
          <div className="mb-3">
            <div className="flex items-end justify-center h-24 gap-1">
              {[...Array(8)].map((_, i) => {
                const height = Math.random() * data.wind_speed + 10;
                return (
                  <div
                    key={i}
                    className="flex-1 bg-blue-400 rounded-t"
                    style={{ height: `${Math.min(100, height)}%` }}
                  />
                );
              })}
            </div>
          </div>

          <div className="text-center">
            <div className="text-3xl font-bold text-gray-900">{data.wind_speed}</div>
            <div className="text-sm text-gray-600">km/h</div>
            <div className="text-xs text-gray-500 mt-1">Direction: {data.wind_direction}</div>
          </div>
        </div>

        {/* UV Index */}
        <div className="bg-gradient-to-br from-orange-50 to-yellow-50 rounded-xl p-4 border border-orange-100">
          <div className="flex items-center gap-2 mb-3">
            <div className="p-2 bg-orange-100 rounded-lg">
              <Sun className="w-5 h-5 text-orange-600" />
            </div>
            <span className="text-sm font-semibold text-gray-700">UV Index</span>
          </div>

          {/* UV Gauge - Semicircle */}
          <div className="flex justify-center mb-3">
            <div className="relative w-32 h-16">
              <svg viewBox="0 0 100 50" className="w-full h-full">
                {/* Background arc */}
                <path
                  d="M 10,50 A 40,40 0 0,1 90,50"
                  fill="none"
                  stroke="#e5e7eb"
                  strokeWidth="8"
                  strokeLinecap="round"
                />
                {/* Progress arc */}
                <path
                  d="M 10,50 A 40,40 0 0,1 90,50"
                  fill="none"
                  stroke="#f59e0b"
                  strokeWidth="8"
                  strokeLinecap="round"
                  strokeDasharray={`${(uvIndex / 11) * 125.6} 125.6`}
                />
              </svg>
              <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 text-center">
                <div className="text-2xl font-bold text-gray-900">{uvIndex}</div>
              </div>
            </div>
          </div>

          <div className="text-center">
            <div className={`inline-block px-3 py-1 rounded-full text-sm font-semibold ${uvLevel.bg} ${uvLevel.color}`}>
              {uvLevel.level}
            </div>
            <div className="text-xs text-gray-500 mt-2">
              {uvIndex >= 3 ? 'Protection recommended' : 'No protection needed'}
            </div>
          </div>
        </div>

        {/* Humidity */}
        <div className="bg-gradient-to-br from-cyan-50 to-blue-50 rounded-xl p-4 border border-cyan-100">
          <div className="flex items-center gap-2 mb-3">
            <div className="p-2 bg-cyan-100 rounded-lg">
              <Droplets className="w-5 h-5 text-cyan-600" />
            </div>
            <span className="text-sm font-semibold text-gray-700">Humidity</span>
          </div>

          {/* Humidity Droplet Visual */}
          <div className="flex justify-center mb-3">
            <div className="relative w-20 h-24">
              <svg viewBox="0 0 50 60" className="w-full h-full">
                {/* Droplet shape */}
                <path
                  d="M 25,5 C 25,5 5,25 5,40 C 5,52 13,60 25,60 C 37,60 45,52 45,40 C 45,25 25,5 25,5 Z"
                  fill="#e0f2fe"
                  stroke="#06b6d4"
                  strokeWidth="2"
                />
                {/* Water level */}
                <rect
                  x="5"
                  y={60 - (data.humidity / 100) * 45}
                  width="40"
                  height={(data.humidity / 100) * 45}
                  fill="#06b6d4"
                  opacity="0.6"
                />
              </svg>
            </div>
          </div>

          <div className="text-center">
            <div className="text-3xl font-bold text-gray-900">{data.humidity}%</div>
            <div className="text-xs text-gray-500 mt-1">
              {data.humidity > 70 ? 'High' : data.humidity > 40 ? 'Moderate' : 'Low'}
            </div>
          </div>
        </div>

        {/* Temperature */}
        <div className="bg-gradient-to-br from-red-50 to-orange-50 rounded-xl p-4 border border-red-100">
          <div className="flex items-center gap-2 mb-3">
            <div className="p-2 bg-red-100 rounded-lg">
              <Thermometer className="w-5 h-5 text-red-600" />
            </div>
            <span className="text-sm font-semibold text-gray-700">Temperature</span>
          </div>

          {/* Thermometer Visual */}
          <div className="flex justify-center mb-3">
            <div className="relative w-16 h-24">
              <svg viewBox="0 0 40 100" className="w-full h-full">
                {/* Thermometer bulb */}
                <circle cx="20" cy="85" r="12" fill="#ef4444" stroke="#dc2626" strokeWidth="2"/>
                {/* Thermometer tube */}
                <rect x="14" y="10" width="12" height="75" rx="6" fill="#fee2e2" stroke="#dc2626" strokeWidth="2"/>
                {/* Mercury/liquid */}
                <rect
                  x="16"
                  y={85 - (data.temp / 50) * 70}
                  width="8"
                  height={(data.temp / 50) * 70}
                  rx="4"
                  fill="#ef4444"
                />
                {/* Temperature marks */}
                <line x1="26" y1="20" x2="30" y2="20" stroke="#9ca3af" strokeWidth="1"/>
                <line x1="26" y1="35" x2="30" y2="35" stroke="#9ca3af" strokeWidth="1"/>
                <line x1="26" y1="50" x2="30" y2="50" stroke="#9ca3af" strokeWidth="1"/>
                <line x1="26" y1="65" x2="30" y2="65" stroke="#9ca3af" strokeWidth="1"/>
              </svg>
            </div>
          </div>

          <div className="text-center">
            <div className="text-3xl font-bold text-gray-900">{data.temp}°</div>
            <div className="text-sm text-gray-600">Celsius</div>
            <div className="text-xs text-gray-500 mt-1">
              Feels like {data.feels_like}°
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Batangas Cities Panel - Displays weather for major Batangas municipalities
function BatangasCitiesPanel({ cities }) {
  return (
    <div className="bg-white rounded-2xl shadow-md border border-gray-200 overflow-hidden h-full flex flex-col">
      <div className="p-5 border-b border-gray-200 flex items-center justify-between flex-shrink-0">
        <h3 className="text-lg font-bold text-gray-900">Other Cities</h3>
        <button className="text-sm text-blue-600 hover:text-blue-700 font-medium">
          See All
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-2">
        {cities.length > 0 ? (
          cities.map((city, index) => (
            <div
              key={index}
              className="flex items-center justify-between p-3 rounded-xl hover:bg-blue-50 transition-all duration-200 cursor-pointer border border-transparent hover:border-blue-200"
            >
              <div className="flex items-center gap-3">
                {city.icon === 'sun' && <Sun className="w-5 h-5 text-yellow-500" />}
                {city.icon === 'cloud' && <Cloud className="w-5 h-5 text-gray-400" />}
                {city.icon === 'rain' && <CloudRain className="w-5 h-5 text-blue-500" />}
                {city.icon === 'storm' && <CloudRain className="w-5 h-5 text-red-500" />}
                <div>
                  <div className="font-semibold text-gray-900">{city.name}</div>
                  <div className="text-xs text-gray-500 capitalize">{city.description}</div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-gray-900">{city.temp}°</div>
                <div className="text-xs text-gray-500">
                  <span className="text-red-500">{city.high}°</span>
                  {' / '}
                  <span className="text-blue-500">{city.low}°</span>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-8 text-gray-500">
            <Loader2 className="w-8 h-8 mx-auto mb-2 animate-spin text-blue-500" />
            <p className="text-sm">Loading Batangas weather data...</p>
          </div>
        )}
      </div>

      {/* Add City Button */}
      <div className="p-4 border-t border-gray-200 flex-shrink-0">
        <button className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-500 hover:bg-blue-600 text-white font-medium rounded-lg transition-all shadow-sm hover:shadow-md">
          <Plus className="w-4 h-4" />
          Add City
        </button>
      </div>
    </div>
  );
}

// Chance of Rain Line Chart - Area chart for 7-day rain probability
function ChanceOfRainLineChart({ data }) {
  // Custom tooltip
  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white border border-gray-200 rounded-lg shadow-lg p-3">
          <p className="text-sm font-semibold text-gray-900">{payload[0].payload.day}</p>
          <p className="text-sm text-blue-600">
            Rain: {payload[0].value}%
          </p>
          <p className="text-xs text-gray-500 mt-1">
            {payload[0].payload.temp}° • {payload[0].payload.condition}
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-white rounded-2xl shadow-md border border-gray-200 p-5 h-full flex flex-col">
      <h3 className="text-lg font-bold text-gray-900 mb-4">Chance of Rain</h3>

      <div className="flex-1 min-h-0">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={data}
            margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
          >
            <defs>
              <linearGradient id="rainGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8}/>
                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.1}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis
              dataKey="day"
              stroke="#6b7280"
              style={{ fontSize: '12px' }}
              tick={{ fill: '#6b7280' }}
            />
            <YAxis
              stroke="#6b7280"
              style={{ fontSize: '12px' }}
              tick={{ fill: '#6b7280' }}
              domain={[0, 100]}
              ticks={[0, 25, 50, 75, 100]}
              tickFormatter={(value) => {
                if (value === 0) return 'Sunny';
                if (value === 100) return 'Rainy';
                return `${value}%`;
              }}
            />
            <Tooltip content={<CustomTooltip />} />
            <Area
              type="monotone"
              dataKey="probability"
              stroke="#3b82f6"
              strokeWidth={2}
              fill="url(#rainGradient)"
              animationDuration={1000}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

// Week Day Card Mini - Ultra compact cards for 7-day horizontal display
function WeekDayCardMini({ day }) {
  const getWeatherIcon = (condition) => {
    switch (condition) {
      case 'clear':
      case 'sunny':
        return <Sun className="w-6 h-6 text-yellow-400" />;
      case 'clouds':
      case 'cloudy':
        return <Cloud className="w-6 h-6 text-gray-400" />;
      case 'rain':
      case 'rainy':
        return <CloudRain className="w-6 h-6 text-blue-400" />;
      default:
        return <Cloud className="w-6 h-6 text-gray-400" />;
    }
  };

  return (
    <div className="bg-gradient-to-br from-gray-50 to-white rounded-lg shadow-sm border border-gray-200 p-2 hover:shadow-md transition-all duration-200 flex flex-col items-center justify-center min-h-[100px]">
      <div className="text-center w-full">
        <div className="font-bold text-gray-800 text-[10px] uppercase mb-1.5">{day.day}</div>
        <div className="flex justify-center mb-1.5">
          {getWeatherIcon(day.condition)}
        </div>
        <div className="text-base font-bold text-gray-900 mb-0.5">{day.temp}°</div>
        <div className="text-[9px] text-gray-500">
          <span className="text-red-500 font-semibold">{day.high}°</span>
          <span className="mx-0.5">/</span>
          <span className="text-blue-500 font-semibold">{day.low}°</span>
        </div>
      </div>
    </div>
  );
}

