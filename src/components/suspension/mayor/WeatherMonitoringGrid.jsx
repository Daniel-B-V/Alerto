/**
 * Weather Monitoring Grid
 * 4-card grid showing real-time weather data with risk indicators
 */

import { CloudRain, Wind, Thermometer, Droplets, TrendingUp, TrendingDown, Minus } from 'lucide-react';

export function WeatherMonitoringGrid({ weatherData, className = '' }) {
  if (!weatherData) {
    return (
      <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 ${className}`}>
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="bg-white rounded-xl border border-gray-200 p-6 animate-pulse">
            <div className="h-4 bg-gray-200 rounded w-20 mb-4"></div>
            <div className="h-10 bg-gray-200 rounded w-24 mb-2"></div>
            <div className="h-3 bg-gray-200 rounded w-16"></div>
          </div>
        ))}
      </div>
    );
  }

  const getRainfallRisk = (rainfall) => {
    if (rainfall >= 30) return { level: 'critical', color: 'red', label: 'Heavy Rain' };
    if (rainfall >= 15) return { level: 'high', color: 'orange', label: 'Moderate Rain' };
    if (rainfall >= 7.5) return { level: 'moderate', color: 'yellow', label: 'Light Rain' };
    return { level: 'low', color: 'green', label: 'No Rain' };
  };

  const getWindRisk = (windSpeed) => {
    if (windSpeed >= 55) return { level: 'critical', color: 'red', label: 'Strong Wind' };
    if (windSpeed >= 39) return { level: 'high', color: 'orange', label: 'Moderate Wind' };
    if (windSpeed >= 20) return { level: 'moderate', color: 'yellow', label: 'Light Wind' };
    return { level: 'low', color: 'green', label: 'Calm' };
  };

  const getTemperatureRisk = (temp, heatIndex) => {
    const index = heatIndex || temp;
    if (index >= 41) return { level: 'critical', color: 'red', label: 'Extreme Heat' };
    if (index >= 33) return { level: 'high', color: 'orange', label: 'High Heat' };
    if (index >= 27) return { level: 'moderate', color: 'yellow', label: 'Warm' };
    return { level: 'low', color: 'green', label: 'Normal' };
  };

  const getHumidityRisk = (humidity) => {
    if (humidity >= 85) return { level: 'high', color: 'blue', label: 'Very Humid' };
    if (humidity >= 70) return { level: 'moderate', color: 'cyan', label: 'Humid' };
    if (humidity >= 50) return { level: 'low', color: 'green', label: 'Comfortable' };
    return { level: 'low', color: 'yellow', label: 'Dry' };
  };

  const getTrendIcon = (trend) => {
    if (!trend || trend === 'stable') return <Minus className="w-4 h-4" />;
    if (trend === 'increasing' || trend === 'rising') return <TrendingUp className="w-4 h-4" />;
    return <TrendingDown className="w-4 h-4" />;
  };

  const rainfall = weatherData.rainfall || 0;
  const windSpeed = weatherData.windSpeed || 0;
  const temperature = weatherData.temperature || 0;
  const humidity = weatherData.humidity || 0;

  const rainfallRisk = getRainfallRisk(rainfall);
  const windRisk = getWindRisk(windSpeed);
  const tempRisk = getTemperatureRisk(temperature, weatherData.heatIndex);
  const humidityRisk = getHumidityRisk(humidity);

  const getCardBorderColor = (color) => {
    const colors = {
      red: 'bg-white !border-4 !border-red-500 shadow-lg shadow-red-200 hover:shadow-xl hover:shadow-red-300',
      orange: 'bg-white !border-4 !border-orange-500 shadow-lg shadow-orange-200 hover:shadow-xl hover:shadow-orange-300',
      yellow: 'bg-white !border-4 !border-yellow-500 shadow-lg shadow-yellow-200 hover:shadow-xl hover:shadow-yellow-300',
      green: 'bg-white !border-4 !border-green-500 shadow-lg shadow-green-200 hover:shadow-xl hover:shadow-green-300',
      blue: 'bg-white !border-4 !border-blue-500 shadow-lg shadow-blue-200 hover:shadow-xl hover:shadow-blue-300',
      cyan: 'bg-white !border-4 !border-cyan-500 shadow-lg shadow-cyan-200 hover:shadow-xl hover:shadow-cyan-300'
    };
    return colors[color] || 'bg-white !border-4 !border-gray-200 shadow-lg shadow-gray-200';
  };

  const getTextColor = (color) => {
    const colors = {
      red: 'text-red-700',
      orange: 'text-orange-700',
      yellow: 'text-yellow-700',
      green: 'text-green-700',
      blue: 'text-blue-700',
      cyan: 'text-cyan-700'
    };
    return colors[color] || 'text-gray-700';
  };

  const getIconColor = (color) => {
    const colors = {
      red: 'text-red-600',
      orange: 'text-orange-600',
      yellow: 'text-yellow-600',
      green: 'text-green-600',
      blue: 'text-blue-600',
      cyan: 'text-cyan-600'
    };
    return colors[color] || 'text-gray-600';
  };

  const cards = [
    {
      title: 'Rainfall',
      value: rainfall,
      unit: 'mm/h',
      icon: CloudRain,
      risk: rainfallRisk,
      trend: weatherData.rainfallTrend
    },
    {
      title: 'Wind Speed',
      value: windSpeed,
      unit: 'km/h',
      icon: Wind,
      risk: windRisk,
      trend: weatherData.windTrend
    },
    {
      title: 'Temperature',
      value: temperature,
      unit: '°C',
      icon: Thermometer,
      risk: tempRisk,
      trend: weatherData.tempTrend,
      subtitle: weatherData.heatIndex ? `Heat Index: ${weatherData.heatIndex}°C` : null
    },
    {
      title: 'Humidity',
      value: humidity,
      unit: '%',
      icon: Droplets,
      risk: humidityRisk,
      trend: weatherData.humidityTrend
    }
  ];

  return (
    <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 ${className}`}>
      {cards.map((card, index) => {
        const Icon = card.icon;
        return (
          <div
            key={index}
            className={`rounded-xl p-6 transition-all duration-300 hover:scale-105 cursor-pointer ${getCardBorderColor(card.risk.color)}`}
          >
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className={`p-2 rounded-lg ${card.risk.color === 'red' ? 'bg-red-100' : card.risk.color === 'orange' ? 'bg-orange-100' : card.risk.color === 'yellow' ? 'bg-yellow-100' : card.risk.color === 'green' ? 'bg-green-100' : card.risk.color === 'blue' ? 'bg-blue-100' : 'bg-cyan-100'}`}>
                  <Icon className={`w-5 h-5 ${getIconColor(card.risk.color)}`} />
                </div>
                <span className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
                  {card.title}
                </span>
              </div>
              {card.trend && (
                <div className={`${getTextColor(card.risk.color)}`}>
                  {getTrendIcon(card.trend)}
                </div>
              )}
            </div>

            {/* Value */}
            <div>
              <div className="flex items-baseline gap-2">
                <span className="text-4xl font-bold text-gray-900">
                  {card.value}
                </span>
                <span className="text-lg font-medium text-gray-600">
                  {card.unit}
                </span>
              </div>
              {card.subtitle && (
                <div className="text-xs text-gray-600 mt-1">{card.subtitle}</div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default WeatherMonitoringGrid;
