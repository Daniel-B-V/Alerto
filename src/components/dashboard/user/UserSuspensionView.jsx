import { useState, useEffect } from "react";
import {
  Search,
  RefreshCw,
  MapPin,
  Cloud,
  Droplets,
  Wind,
  AlertCircle,
  CheckCircle,
  Ban,
  Thermometer,
  Gauge
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "../../ui/card";
import { Badge } from "../../ui/badge";
import { Button } from "../../ui/button";
import { Input } from "../../ui/input";
import { collection, getDocs, query, where } from "firebase/firestore";
import { db } from "../../../firebase/config";

export function UserSuspensionView() {
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
      const suspensionsMap = {};
      suspensionsSnapshot.docs.forEach(doc => {
        const data = doc.data();
        suspensionsMap[data.city] = {
          reason: data.reason || 'Severe weather conditions',
          effectiveFrom: data.effectiveFrom,
          effectiveUntil: data.effectiveUntil,
          createdAt: data.createdAt
        };
      });
      const suspendedCityNames = new Set(Object.keys(suspensionsMap));

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
      const citiesData = batangasCities
        .map(cityName => {
          const isSuspended = suspendedCityNames.has(cityName);
          const weatherData = weatherMap[cityName] || null;
          const suspensionData = suspensionsMap[cityName] || null;

          return {
            name: cityName,
            suspended: isSuspended,
            suspensionInfo: suspensionData,
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
        })
        // Filter out cities without weather data
        .filter(city => city.weather.temperature !== null);

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
          <div
            className="rounded-lg border shadow-sm hover:shadow-md transition-all duration-200"
            style={{
              background: 'linear-gradient(to bottom right, #eff6ff, #dbeafe)',
              borderColor: '#bfdbfe'
            }}
          >
            <div className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-blue-600 mb-1">Total Cities</p>
                  <p className="text-3xl font-bold text-blue-900">{cities.length}</p>
                </div>
                <MapPin className="w-10 h-10 text-blue-500 opacity-50" />
              </div>
            </div>
          </div>

          <div
            className="rounded-lg border shadow-sm hover:shadow-md transition-all duration-200"
            style={{
              background: 'linear-gradient(to bottom right, #fef2f2, #fee2e2)',
              borderColor: '#fecaca'
            }}
          >
            <div className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-red-600 mb-1">Suspended</p>
                  <p className="text-3xl font-bold text-red-900">
                    {cities.filter(c => c.suspended).length}
                  </p>
                </div>
                <Ban className="w-10 h-10 text-red-500 opacity-50" />
              </div>
            </div>
          </div>

          <div
            className="rounded-lg border shadow-sm hover:shadow-md transition-all duration-200"
            style={{
              background: 'linear-gradient(to bottom right, #f0fdf4, #dcfce7)',
              borderColor: '#bbf7d0'
            }}
          >
            <div className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-green-600 mb-1">Active</p>
                  <p className="text-3xl font-bold text-green-900">
                    {cities.filter(c => !c.suspended).length}
                  </p>
                </div>
                <CheckCircle className="w-10 h-10 text-green-500 opacity-50" />
              </div>
            </div>
          </div>
        </div>

        {/* Search and Filter Bar */}
        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="space-y-3">
              {/* Search Bar */}
              <div className="relative w-full">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  type="text"
                  placeholder="Search for a city..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 h-10 text-sm"
                />
              </div>

              {/* Filter Buttons and Refresh */}
              <div className="flex justify-between items-center">
                <div className="flex gap-1.5">
                  <button
                    onClick={() => setStatusFilter("all")}
                    className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                      statusFilter === "all"
                        ? 'bg-gray-100 text-gray-900 border border-gray-300'
                        : 'text-gray-600 border border-transparent hover:bg-gray-50'
                    }`}
                  >
                    All
                  </button>
                  <button
                    onClick={() => setStatusFilter("suspended")}
                    className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                      statusFilter === "suspended"
                        ? 'bg-red-50 text-red-700 border border-red-200'
                        : 'text-gray-600 border border-transparent hover:bg-gray-50'
                    }`}
                  >
                    Suspended
                  </button>
                  <button
                    onClick={() => setStatusFilter("active")}
                    className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                      statusFilter === "active"
                        ? 'bg-green-50 text-green-700 border border-green-200'
                        : 'text-gray-600 border border-transparent hover:bg-gray-50'
                    }`}
                  >
                    Active
                  </button>
                </div>

                <button
                  onClick={fetchData}
                  className="px-3 py-1.5 text-xs font-medium rounded-md bg-white text-gray-700 border border-gray-300 hover:bg-gray-50 transition-colors flex items-center gap-1.5"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  Refresh
                </button>
              </div>
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
                    ? 'border border-red-500 bg-white'
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
                      className="flex items-center gap-1 px-3 py-1 font-bold"
                      style={{
                        backgroundColor: city.suspended ? '#DC2626' : '#16A34A',
                        color: '#FFFFFF'
                      }}
                    >
                      {city.suspended ? (
                        <>
                          <Ban className="w-4 h-4" />
                          Suspended
                        </>
                      ) : (
                        <>
                          <CheckCircle className="w-4 h-4" />
                          Active
                        </>
                      )}
                    </Badge>
                  </div>
                </CardHeader>

                <CardContent className="pt-0">
                  {/* Suspension Reason (if suspended) */}
                  {city.suspended && city.suspensionInfo && (
                    <div className="mb-4 p-4 bg-gradient-to-r from-red-50 to-orange-50 border-l-4 border-red-500 rounded-lg">
                      <div className="flex items-start gap-2 mb-2">
                        <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                        <div className="flex-1">
                          <p className="font-semibold text-red-900 text-sm mb-1">Suspension Reason:</p>
                          <p className="text-sm text-red-800">{city.suspensionInfo.reason}</p>
                        </div>
                      </div>
                      {city.suspensionInfo.effectiveUntil && (
                        <div className="mt-2 pt-2 border-t border-red-200">
                          <p className="text-xs text-red-700">
                            <span className="font-medium">Effective until:</span>{' '}
                            {new Date(city.suspensionInfo.effectiveUntil.seconds * 1000).toLocaleString()}
                          </p>
                        </div>
                      )}
                      <div className="mt-3 p-2 bg-red-100 rounded text-xs text-red-800">
                        <strong>⚠️ Safety Advisory:</strong> Stay indoors and avoid unnecessary travel.
                        Monitor official announcements for updates.
                      </div>
                    </div>
                  )}

                  {/* Weather Information */}
                  <div className="space-y-3">
                    {/* Temperature */}
                    {city.weather.temperature !== null ? (
                      <div className="flex items-center justify-between p-2 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg">
                        <div className="flex items-center gap-2">
                          <Thermometer className="w-4 h-4 text-red-500" />
                          <span className="text-xs font-medium text-gray-700">Temperature</span>
                        </div>
                        <span className="text-base font-bold text-gray-900">
                          {city.weather.temperature}°C
                        </span>
                      </div>
                    ) : (
                      <div className="p-2 bg-gray-50 rounded-lg text-center text-xs text-gray-500">
                        No weather data available
                      </div>
                    )}

                    {/* Critical Weather Metrics - Top 3 */}
                    <div className="space-y-2">
                      {/* Wind Speed */}
                      {city.weather.windSpeed !== null && (
                        <div className="flex items-center justify-between p-2 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg">
                          <div className="flex items-center gap-2">
                            <Wind className="w-4 h-4 text-green-600" />
                            <span className="text-xs font-medium text-gray-700">Wind</span>
                          </div>
                          <span className="text-base font-bold text-gray-900">
                            {city.weather.windSpeed} km/h
                          </span>
                        </div>
                      )}

                      {/* Rainfall */}
                      {city.weather.rainfall !== null && (
                        <div className="flex items-center justify-between p-2 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg">
                          <div className="flex items-center gap-2">
                            <Droplets className="w-4 h-4 text-blue-600" />
                            <span className="text-xs font-medium text-gray-700">Rainfall</span>
                          </div>
                          <span className="text-base font-bold text-gray-900">
                            {city.weather.rainfall} mm/h
                          </span>
                        </div>
                      )}

                      {/* Pressure */}
                      {city.weather.pressure !== null && (
                        <div className="flex items-center justify-between p-2 bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg">
                          <div className="flex items-center gap-2">
                            <Gauge className="w-4 h-4 text-purple-600" />
                            <span className="text-xs font-medium text-gray-700">Pressure</span>
                          </div>
                          <span className="text-base font-bold text-gray-900">
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

                    {/* Active Status Message */}
                    {!city.suspended && (
                      <div className="mt-3 p-3 bg-gradient-to-r from-green-50 to-emerald-50 border-l-4 border-green-500 rounded-lg">
                        <div className="flex items-start gap-2">
                          <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
                          <div className="flex-1">
                            <p className="text-xs text-green-800">
                              <strong>Normal Operations:</strong> Classes are ongoing. Stay updated on weather conditions
                              and follow school announcements.
                            </p>
                          </div>
                        </div>
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
