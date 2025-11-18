/**
 * City Grid View
 * Provincial overview for governors showing all cities in Batangas
 */

import React, { useState, useEffect } from 'react';
import { Card } from '../../ui/card';
import { Badge } from '../../ui/badge';
import { Button } from '../../ui/button';
import {
  MapPin,
  AlertTriangle,
  CloudRain,
  Wind,
  Thermometer,
  Activity,
  ArrowRight,
  TrendingUp,
  CheckCircle
} from 'lucide-react';
import { useAuth } from '../../../contexts/AuthContext';
import { getReports } from '../../../firebase/firestore';
import { useSuspensions } from '../../../hooks/useSuspensions';
import { getBatangasWeatherWithSuspensionCriteria } from '../../../services/weatherService';
import { BATANGAS_MUNICIPALITIES } from '../../../constants/batangasLocations';

const CityGridView = ({ onCitySelect }) => {
  const { user } = useAuth();
  const { activeSuspensions } = useSuspensions();
  const [citiesData, setCitiesData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [weatherData, setWeatherData] = useState([]);
  const [reports, setReports] = useState([]);

  // Helper function to format city name for display
  const formatCityName = (name) => {
    return name.split(' ').map(word =>
      word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
    ).join(' ');
  };

  // Process data for each city
  const processCityData = (weather, allReports, suspensions) => {
    const cityStats = BATANGAS_MUNICIPALITIES.map(cityName => {
      // Get weather data for this city (case-insensitive match)
      const cityWeather = weather.find(w =>
        w.city?.toLowerCase() === cityName.toLowerCase()
      );

      // Get reports for this city (case-insensitive match)
      const cityReports = allReports.filter(
        r => r.location?.city?.toLowerCase() === cityName.toLowerCase() ||
             r.city?.toLowerCase() === cityName.toLowerCase()
      );

      // Count critical reports
      const criticalReports = cityReports.filter(
        r => r.severity === 'critical' || r.severity === 'high'
      ).length;

      // Check if city has active suspension (case-insensitive match)
      const suspension = suspensions.find(s =>
        s.city?.toLowerCase() === cityName.toLowerCase()
      );

      // Determine alert level based on weather and reports
      const alertLevel = getAlertLevel(cityWeather, criticalReports, suspension);

      return {
        name: formatCityName(cityName),
        weather: cityWeather,
        totalReports: cityReports.length,
        criticalReports,
        suspension,
        alertLevel,
        recentReports: cityReports.slice(0, 5)
      };
    });

    // Sort by alert level (highest first), then by critical reports
    cityStats.sort((a, b) => {
      if (a.alertLevel !== b.alertLevel) {
        return b.alertLevel - a.alertLevel;
      }
      return b.criticalReports - a.criticalReports;
    });

    setCitiesData(cityStats);
  };

  // Load weather and reports data
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);

        // Load weather data for all cities
        const weather = await getBatangasWeatherWithSuspensionCriteria();
        setWeatherData(weather);

        // Load all reports from Batangas
        const allReports = await getReports({ limit: 500 });
        const batangasReports = allReports.filter(
          report => report.province === 'Batangas' ||
                   report.location?.province === 'Batangas'
        );
        setReports(batangasReports);

        // Process city data
        processCityData(weather, batangasReports, activeSuspensions);
      } catch (error) {
        console.error('Error loading data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();

    // Refresh every 5 minutes
    const interval = setInterval(loadData, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [activeSuspensions]);

  // Determine alert level (0-3)
  const getAlertLevel = (weather, criticalReports, suspension) => {
    let level = 0;

    // Active suspension = highest priority
    if (suspension) level = 3;
    // Auto-suspend criteria met
    else if (weather?.autoSuspend?.shouldAutoSuspend) level = 3;
    // High critical reports or orange warning
    else if (criticalReports >= 5 || weather?.pagasaWarning?.id === 'orange') level = 2;
    // Some critical reports or yellow warning
    else if (criticalReports >= 2 || weather?.pagasaWarning?.id === 'yellow') level = 1;

    return level;
  };

  // Get alert color
  const getAlertColor = (level) => {
    switch (level) {
      case 3:
        return 'bg-red-100 border-red-300 text-red-900';
      case 2:
        return 'bg-orange-100 border-orange-300 text-orange-900';
      case 1:
        return 'bg-yellow-100 border-yellow-300 text-yellow-900';
      default:
        return 'bg-green-50 border-green-200 text-green-900';
    }
  };

  // Get alert badge
  const getAlertBadge = (level) => {
    switch (level) {
      case 3:
        return { label: 'Critical', color: 'bg-red-500 text-white' };
      case 2:
        return { label: 'High Alert', color: 'bg-orange-500 text-white' };
      case 1:
        return { label: 'Watch', color: 'bg-yellow-500 text-white' };
      default:
        return { label: 'Normal', color: 'bg-green-500 text-white' };
    }
  };

  if (loading) {
    return (
      <Card className="p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-gray-500">Loading provincial overview...</div>
        </div>
      </Card>
    );
  }

  // Summary statistics
  const totalCities = citiesData.length;
  const criticalCities = citiesData.filter(c => c.alertLevel >= 2).length;
  const totalReports = citiesData.reduce((sum, c) => sum + c.totalReports, 0);
  const totalCritical = citiesData.reduce((sum, c) => sum + c.criticalReports, 0);

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Total Cities</p>
              <p className="text-2xl font-bold text-gray-900">{totalCities}</p>
              <p className="text-xs text-gray-500 mt-1">Batangas Province</p>
            </div>
            <MapPin className="w-8 h-8 text-blue-500" />
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Cities on Alert</p>
              <p className="text-2xl font-bold text-orange-600">{criticalCities}</p>
              <p className="text-xs text-gray-500 mt-1">Require attention</p>
            </div>
            <AlertTriangle className="w-8 h-8 text-orange-500" />
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Total Reports</p>
              <p className="text-2xl font-bold text-gray-900">{totalReports}</p>
              <p className="text-xs text-gray-500 mt-1">All municipalities</p>
            </div>
            <Activity className="w-8 h-8 text-green-500" />
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Critical Reports</p>
              <p className="text-2xl font-bold text-red-600">{totalCritical}</p>
              <p className="text-xs text-gray-500 mt-1">High/Critical severity</p>
            </div>
            <TrendingUp className="w-8 h-8 text-red-500" />
          </div>
        </Card>
      </div>

      {/* Priority Alert */}
      {criticalCities > 0 && (
        <Card className="p-4 bg-gradient-to-r from-red-50 to-orange-50 border-red-200">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-red-600 mt-0.5" />
            <div className="flex-1">
              <h3 className="font-semibold text-red-900">Priority Attention Required</h3>
              <p className="text-sm text-red-700 mt-1">
                {criticalCities} {criticalCities === 1 ? 'city' : 'cities'} require immediate attention due to weather conditions or critical reports.
              </p>
            </div>
          </div>
        </Card>
      )}

      {/* City Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {citiesData.map((city) => {
          const alertBadge = getAlertBadge(city.alertLevel);

          return (
            <Card
              key={city.name}
              className={`p-4 transition-all hover:shadow-lg cursor-pointer ${getAlertColor(city.alertLevel)}`}
              onClick={() => onCitySelect && onCitySelect(city.name)}
            >
              {/* City Header */}
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <MapPin className="w-4 h-4" />
                    <h3 className="font-bold text-sm">{city.name}</h3>
                  </div>
                  <Badge className={`text-xs ${alertBadge.color}`}>
                    {alertBadge.label}
                  </Badge>
                </div>
              </div>

              {/* Active Suspension Alert */}
              {city.suspension && (
                <div className="mb-3 p-2 bg-red-200 rounded text-xs">
                  <div className="flex items-center gap-1 font-semibold text-red-900">
                    <AlertTriangle className="w-3 h-3" />
                    Active Suspension
                  </div>
                  <div className="text-red-800 mt-1">
                    {city.suspension.levels.join(', ')}
                  </div>
                </div>
              )}

              {/* Weather Summary */}
              {city.weather && (
                <div className="grid grid-cols-2 gap-2 mb-3 text-xs">
                  <div className="flex items-center gap-1">
                    <CloudRain className="w-3 h-3 text-blue-600" />
                    <span className="font-semibold">{city.weather.criteria.rainfall}</span>
                    <span className="text-gray-600">mm/h</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Wind className="w-3 h-3 text-gray-600" />
                    <span className="font-semibold">{city.weather.criteria.windSpeed}</span>
                    <span className="text-gray-600">km/h</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Thermometer className="w-3 h-3 text-orange-600" />
                    <span className="font-semibold">{city.weather.criteria.temperature}</span>
                    <span className="text-gray-600">°C</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Activity className="w-3 h-3 text-blue-600" />
                    <span className="font-semibold">{city.weather.criteria.humidity}</span>
                    <span className="text-gray-600">%</span>
                  </div>
                </div>
              )}

              {/* PAGASA Warning */}
              {city.weather?.pagasaWarning && (
                <Badge className={`text-xs mb-2 ${
                  city.weather.pagasaWarning.id === 'red' ? 'bg-red-500 text-white' :
                  city.weather.pagasaWarning.id === 'orange' ? 'bg-orange-500 text-white' :
                  'bg-yellow-500 text-white'
                }`}>
                  {city.weather.pagasaWarning.icon} {city.weather.pagasaWarning.label}
                </Badge>
              )}

              {/* Reports Summary */}
              <div className="flex items-center justify-between text-xs border-t pt-2 mt-2">
                <div>
                  <span className="text-gray-600">Reports:</span>
                  <span className="ml-1 font-semibold">{city.totalReports}</span>
                </div>
                <div>
                  <span className="text-gray-600">Critical:</span>
                  <span className="ml-1 font-semibold text-red-700">{city.criticalReports}</span>
                </div>
              </div>

              {/* View Details Button */}
              {onCitySelect && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full mt-2 text-xs h-7"
                  onClick={() => onCitySelect(city.name)}
                >
                  View Details <ArrowRight className="w-3 h-3 ml-1" />
                </Button>
              )}
            </Card>
          );
        })}
      </div>

      {/* Info Card */}
      <Card className="p-4 bg-purple-50 border-purple-200">
        <div className="flex items-start gap-3">
          <CheckCircle className="w-5 h-5 text-purple-600 mt-0.5" />
          <div>
            <h3 className="font-semibold text-purple-900 mb-1">Governor's Provincial View</h3>
            <p className="text-sm text-purple-700">
              This dashboard shows real-time weather conditions and community reports across all
              cities and municipalities in Batangas Province. Click any city card for detailed information.
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default CityGridView;
