import { useState, useEffect } from "react";
import {
  Search,
  RefreshCw,
  MapPin,
  Cloud,
  Droplets,
  Wind,
  Eye,
  AlertCircle,
  CheckCircle,
  Ban,
  Thermometer,
  Gauge
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { collection, getDocs, query, where } from "firebase/firestore";
import { db } from "../firebase/config";

export function UserSuspensionPage() {
  const [cities, setCities] = useState([]);
  const [filteredCities, setFilteredCities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all"); // all, suspended, active

  // Batangas cities list
  const batangasCities = [
    "Agoncillo", "Alitagtag", "Balayan", "Balete", "Batangas City", "Bauan",
    "Calaca", "Calatagan", "Cuenca", "Ibaan", "Laurel", "Lemery",
    "Lian", "Lipa City", "Lobo", "Mabini", "Malvar", "Mataasnakahoy",
    "Nasugbu", "Padre Garcia", "Rosario", "San Jose", "San Juan",
    "San Luis", "San Nicolas", "San Pascual", "Santa Teresita", "Santo Tomas",
    "Taal", "Talisay", "Tanauan City", "Taysan", "Tingloy", "Tuy"
  ];

  // Fetch suspension and weather data
  const fetchData = async () => {
    setLoading(true);
    try {
      // Fetch active suspensions
      const suspensionsQuery = query(
        collection(db, 'suspensions'),
        where('status', '==', 'active')
      );
      const suspensionsSnapshot = await getDocs(suspensionsQuery);
      const suspendedCityNames = new Set(
        suspensionsSnapshot.docs.map(doc => doc.data().city)
      );

      // Fetch weather data
      const weatherSnapshot = await getDocs(collection(db, 'weather'));
      const weatherMap = {};
      weatherSnapshot.docs.forEach(doc => {
        const data = doc.data();
        if (data.location?.city) {
          weatherMap[data.location.city] = data;
        }
      });

      // Combine data for all cities
      const citiesData = batangasCities.map(cityName => {
        const isSuspended = suspendedCityNames.has(cityName);
        const weatherData = weatherMap[cityName] || null;

        return {
          name: cityName,
          suspended: isSuspended,
          weather: weatherData?.current || {
            temperature: null,
            condition: "No data",
            humidity: null,
            windSpeed: null,
            rainfall: null,
            pressure: null
          },
          lastUpdate: weatherData?.lastUpdate || null
        };
      });

      // Sort: suspended cities first, then alphabetically
      citiesData.sort((a, b) => {
        if (a.suspended && !b.suspended) return -1;
        if (!a.suspended && b.suspended) return 1;
        return a.name.localeCompare(b.name);
      });

      setCities(citiesData);
      setFilteredCities(citiesData);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Apply filters
  useEffect(() => {
    let filtered = [...cities];

    // Filter by search query
    if (searchQuery.trim()) {
      filtered = filtered.filter(city =>
        city.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Filter by suspension status
    if (statusFilter === "suspended") {
      filtered = filtered.filter(city => city.suspended);
    } else if (statusFilter === "active") {
      filtered = filtered.filter(city => !city.suspended);
    }

    setFilteredCities(filtered);
  }, [searchQuery, statusFilter, cities]);

  // Get weather icon based on condition
  const getWeatherIcon = (condition) => {
    if (!condition) return <Cloud className="w-6 h-6 text-gray-400" />;

    const conditionLower = condition.toLowerCase();
    if (conditionLower.includes('rain') || conditionLower.includes('shower')) {
      return <Droplets className="w-6 h-6 text-blue-500" />;
    }
    if (conditionLower.includes('cloud')) {
      return <Cloud className="w-6 h-6 text-gray-500" />;
    }
    if (conditionLower.includes('clear') || conditionLower.includes('sunny')) {
      return <Cloud className="w-6 h-6 text-yellow-500" />;
    }
    return <Cloud className="w-6 h-6 text-gray-400" />;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <RefreshCw className="w-12 h-12 text-blue-500 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading city data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2 flex items-center gap-3">
            <Ban className="w-8 h-8 text-red-500" />
            Class Suspension Status
          </h1>
          <p className="text-gray-600">
            Real-time suspension status for all cities and municipalities in Batangas Province
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-blue-600 mb-1">Total Cities</p>
                  <p className="text-3xl font-bold text-blue-900">{cities.length}</p>
                </div>
                <MapPin className="w-10 h-10 text-blue-500 opacity-50" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-red-50 to-red-100 border-red-200">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-red-600 mb-1">Suspended</p>
                  <p className="text-3xl font-bold text-red-900">
                    {cities.filter(c => c.suspended).length}
                  </p>
                </div>
                <Ban className="w-10 h-10 text-red-500 opacity-50" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-green-600 mb-1">Active</p>
                  <p className="text-3xl font-bold text-green-900">
                    {cities.filter(c => !c.suspended).length}
                  </p>
                </div>
                <CheckCircle className="w-10 h-10 text-green-500 opacity-50" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Search and Filter Bar */}
        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="flex flex-col md:flex-row gap-3">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <Input
                  type="text"
                  placeholder="Search for a city..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>

              <div className="flex gap-2">
                <Button
                  variant={statusFilter === "all" ? "default" : "outline"}
                  onClick={() => setStatusFilter("all")}
                  className="flex-1 md:flex-none"
                >
                  All
                </Button>
                <Button
                  variant={statusFilter === "suspended" ? "default" : "outline"}
                  onClick={() => setStatusFilter("suspended")}
                  className="flex-1 md:flex-none bg-red-500 hover:bg-red-600 text-white"
                  style={statusFilter === "suspended" ? {} : { color: '#EF4444' }}
                >
                  Suspended
                </Button>
                <Button
                  variant={statusFilter === "active" ? "default" : "outline"}
                  onClick={() => setStatusFilter("active")}
                  className="flex-1 md:flex-none bg-green-500 hover:bg-green-600 text-white"
                  style={statusFilter === "active" ? {} : { color: '#10B981' }}
                >
                  Active
                </Button>
              </div>

              <Button
                onClick={fetchData}
                className="bg-blue-500 hover:bg-blue-600 text-white"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Refresh
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Cities Grid */}
        {filteredCities.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <AlertCircle className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-700 mb-2">No cities found</h3>
              <p className="text-gray-500">Try adjusting your search or filter criteria</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredCities.map((city) => (
              <Card
                key={city.name}
                className={`overflow-hidden transition-all duration-200 hover:shadow-lg ${
                  city.suspended
                    ? 'border-2 border-red-400 bg-red-50'
                    : 'border border-gray-200 bg-white'
                }`}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-lg font-bold text-gray-900 flex items-center gap-2">
                        <MapPin className="w-5 h-5 text-gray-600" />
                        {city.name}
                      </CardTitle>
                    </div>
                    <Badge
                      className={`${
                        city.suspended
                          ? 'bg-red-600 text-white'
                          : 'bg-green-600 text-white'
                      } flex items-center gap-1`}
                    >
                      {city.suspended ? (
                        <>
                          <Ban className="w-3 h-3" />
                          Suspended
                        </>
                      ) : (
                        <>
                          <CheckCircle className="w-3 h-3" />
                          Active
                        </>
                      )}
                    </Badge>
                  </div>
                </CardHeader>

                <CardContent className="pt-0">
                  {/* Weather Information */}
                  <div className="space-y-3">
                    {/* Temperature */}
                    {city.weather.temperature !== null ? (
                      <div className="flex items-center justify-between p-3 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg">
                        <div className="flex items-center gap-2">
                          <Thermometer className="w-5 h-5 text-red-500" />
                          <span className="text-sm font-medium text-gray-700">Temperature</span>
                        </div>
                        <span className="text-xl font-bold text-gray-900">
                          {city.weather.temperature}°C
                        </span>
                      </div>
                    ) : (
                      <div className="p-3 bg-gray-50 rounded-lg text-center text-sm text-gray-500">
                        No weather data available
                      </div>
                    )}

                    {/* Weather Condition */}
                    <div className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg">
                      {getWeatherIcon(city.weather.condition)}
                      <span className="text-sm text-gray-700 capitalize">
                        {city.weather.condition}
                      </span>
                    </div>

                    {/* Additional Weather Info Grid */}
                    <div className="grid grid-cols-2 gap-2">
                      {/* Humidity */}
                      {city.weather.humidity !== null && (
                        <div className="p-2 bg-blue-50 rounded-lg">
                          <div className="flex items-center gap-1 mb-1">
                            <Droplets className="w-4 h-4 text-blue-600" />
                            <span className="text-xs text-gray-600">Humidity</span>
                          </div>
                          <span className="text-sm font-semibold text-gray-900">
                            {city.weather.humidity}%
                          </span>
                        </div>
                      )}

                      {/* Wind Speed */}
                      {city.weather.windSpeed !== null && (
                        <div className="p-2 bg-green-50 rounded-lg">
                          <div className="flex items-center gap-1 mb-1">
                            <Wind className="w-4 h-4 text-green-600" />
                            <span className="text-xs text-gray-600">Wind</span>
                          </div>
                          <span className="text-sm font-semibold text-gray-900">
                            {city.weather.windSpeed} km/h
                          </span>
                        </div>
                      )}

                      {/* Rainfall */}
                      {city.weather.rainfall !== null && city.weather.rainfall > 0 && (
                        <div className="p-2 bg-indigo-50 rounded-lg">
                          <div className="flex items-center gap-1 mb-1">
                            <Droplets className="w-4 h-4 text-indigo-600" />
                            <span className="text-xs text-gray-600">Rainfall</span>
                          </div>
                          <span className="text-sm font-semibold text-gray-900">
                            {city.weather.rainfall} mm/h
                          </span>
                        </div>
                      )}

                      {/* Pressure */}
                      {city.weather.pressure !== null && (
                        <div className="p-2 bg-purple-50 rounded-lg">
                          <div className="flex items-center gap-1 mb-1">
                            <Gauge className="w-4 h-4 text-purple-600" />
                            <span className="text-xs text-gray-600">Pressure</span>
                          </div>
                          <span className="text-sm font-semibold text-gray-900">
                            {city.weather.pressure} hPa
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Last Update */}
                    {city.lastUpdate && (
                      <div className="text-xs text-gray-500 text-center pt-2 border-t">
                        Last updated: {new Date(city.lastUpdate).toLocaleString()}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Results Count */}
        {filteredCities.length > 0 && (
          <div className="mt-6 text-center text-sm text-gray-600">
            Showing {filteredCities.length} of {cities.length} cities
          </div>
        )}
      </div>
    </div>
  );
}
