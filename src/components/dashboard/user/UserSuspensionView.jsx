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
import { getBatangasWeather } from "../../../services/weatherService";

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

      // Fetch weather data using weatherService (with OpenWeather API fallback)
      const weatherDataArray = await getBatangasWeather();
      const weatherMap = {};
      weatherDataArray.forEach(data => {
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
            lastUpdate: weatherData?.lastUpdate || weatherData?.current?.timestamp || null
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
          <Card className="bg-white !border-3 !border-blue-500 shadow-lg shadow-blue-200 hover:shadow-xl hover:shadow-blue-300 hover:scale-105 transition-all duration-300 cursor-pointer">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Total Cities</p>
                  <p className="text-3xl font-bold text-gray-900">{cities.length}</p>
                </div>
                <MapPin className="w-10 h-10 text-blue-500 opacity-50" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white !border-3 !border-red-500 shadow-lg shadow-red-200 hover:shadow-xl hover:shadow-red-300 hover:scale-105 transition-all duration-300 cursor-pointer">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Suspended</p>
                  <p className="text-3xl font-bold text-gray-900">
                    {cities.filter(c => c.suspended).length}
                  </p>
                </div>
                <Ban className="w-10 h-10 text-red-500 opacity-50" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white !border-3 !border-green-500 shadow-lg shadow-green-200 hover:shadow-xl hover:shadow-green-300 hover:scale-105 transition-all duration-300 cursor-pointer">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Active</p>
                  <p className="text-3xl font-bold text-gray-900">
                    {cities.filter(c => !c.suspended).length}
                  </p>
                </div>
                <CheckCircle className="w-10 h-10 text-green-500 opacity-50" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Search, Filter and Cities Grid */}
        <Card className="mb-6">
          {/* Search and Filter Header */}
          <CardContent className="p-4 border-b border-gray-100">
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

          {/* Cities Content */}
          {filteredCities.length === 0 ? (
            <CardContent className="p-12 text-center">
              <AlertCircle className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-700 mb-2">No cities found</h3>
              <p className="text-gray-500">Try adjusting your search or filter criteria</p>
            </CardContent>
          ) : (
            <CardContent className="p-4">
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
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1">
                      <CardTitle className="text-lg font-bold text-gray-900 flex items-center gap-2">
                        <MapPin className="w-5 h-5 text-gray-600" />
                        {city.name}
                      </CardTitle>
                    </div>
                    <div className="flex items-center gap-2">
                      {/* Time Span (for suspended cities) */}
                      {city.suspended && city.suspensionInfo?.effectiveUntil && (
                        <div className="text-xs text-gray-600 text-right">
                          <p className="font-medium">Until</p>
                          <p>{new Date(city.suspensionInfo.effectiveUntil.seconds * 1000).toLocaleDateString()}</p>
                        </div>
                      )}
                      {city.suspended ? (
                        <Badge
                          className="flex items-center gap-1 px-3 py-1 font-bold"
                          style={{
                            backgroundColor: '#DC2626',
                            color: '#FFFFFF'
                          }}
                        >
                          <Ban className="w-4 h-4" />
                          Suspended
                        </Badge>
                      ) : (
                        <Badge
                          className="flex items-center gap-1 px-3 py-1.5 font-medium border"
                          style={{
                            backgroundColor: '#F0FDF4',
                            borderColor: '#86EFAC',
                            color: '#16A34A'
                          }}
                        >
                          <CheckCircle className="w-4 h-4" />
                          Active
                        </Badge>
                      )}
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="pt-0">
                  {city.suspended ? (
                    /* Suspended City - Show Details */
                    <div className="space-y-4">
                      {/* Time Span */}
                      {city.suspensionInfo?.effectiveFrom && city.suspensionInfo?.effectiveUntil && (
                        <div className="p-3 bg-gray-50 rounded-lg">
                          <p className="text-xs font-semibold text-gray-700 mb-1">Suspension Period</p>
                          <p className="text-sm text-gray-900">
                            {new Date(city.suspensionInfo.effectiveFrom.seconds * 1000).toLocaleDateString()} - {new Date(city.suspensionInfo.effectiveUntil.seconds * 1000).toLocaleDateString()}
                          </p>
                        </div>
                      )}

                      {/* Cause/Reason */}
                      {city.suspensionInfo?.reason && (
                        <div className="p-3 bg-red-50 rounded-lg border-l-4 border-red-500">
                          <p className="text-xs font-semibold text-red-900 mb-1">Cause</p>
                          <p className="text-sm text-red-800">{city.suspensionInfo.reason}</p>
                        </div>
                      )}

                      {/* Affected Levels */}
                      <div className="p-3 bg-orange-50 rounded-lg">
                        <p className="text-xs font-semibold text-orange-900 mb-2">Affected Levels</p>
                        <div className="flex flex-wrap gap-1.5">
                          {city.suspensionInfo?.affectedLevels ? (
                            city.suspensionInfo.affectedLevels.map((level, idx) => (
                              <Badge key={idx} className="bg-orange-100 text-orange-800 text-xs">
                                {level}
                              </Badge>
                            ))
                          ) : (
                            <>
                              <Badge className="bg-orange-100 text-orange-800 text-xs">All Levels</Badge>
                            </>
                          )}
                        </div>
                      </div>

                      {/* Safety Advisory */}
                      <div className="p-3 bg-red-100 rounded-lg">
                        <p className="text-xs text-red-900">
                          <strong>⚠️ Safety Advisory:</strong> Stay indoors and avoid unnecessary travel. Monitor official announcements for updates.
                        </p>
                      </div>
                    </div>
                  ) : (
                    /* Active City - Professional Horizontal Layout */
                    <div className="py-6 px-4">
                      <div className="flex items-start gap-4">
                        {/* Icon Container */}
                        <div className="flex-shrink-0">
                          <div className="w-14 h-14 rounded-full bg-green-50 border-2 border-green-500 flex items-center justify-center transition-all duration-200">
                            <CheckCircle
                              className="w-8 h-8 text-green-600"
                              strokeWidth={2.5}
                            />
                          </div>
                        </div>

                        {/* Content */}
                        <div className="flex-1 space-y-1">
                          <h3 className="text-base font-semibold text-gray-900 leading-tight">
                            No Suspensions Active
                          </h3>
                          <p className="text-sm text-gray-600 leading-relaxed">
                            All education levels proceeding as scheduled
                          </p>
                        </div>
                      </div>

                      {/* Status Footer */}
                      <div className="mt-3 pt-3 border-t border-gray-100">
                        <p className="text-xs text-gray-500 flex items-center gap-1.5">
                          <span className="inline-block w-2 h-2 rounded-full bg-green-600"></span>
                          <span>Status verified</span>
                          <span className="text-gray-400">•</span>
                          <span>Updated recently</span>
                        </p>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
              ))}
              </div>
            </CardContent>
          )}
        </Card>

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
