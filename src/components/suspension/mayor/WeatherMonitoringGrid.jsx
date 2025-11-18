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
      red: 'border-red-300 bg-gradient-to-br from-red-50 to-red-100/50',
      orange: 'border-orange-300 bg-gradient-to-br from-orange-50 to-orange-100/50',
      yellow: 'border-yellow-300 bg-gradient-to-br from-yellow-50 to-yellow-100/50',
      green: 'border-green-300 bg-gradient-to-br from-green-50 to-green-100/50',
      blue: 'border-blue-300 bg-gradient-to-br from-blue-50 to-blue-100/50',
      cyan: 'border-cyan-300 bg-gradient-to-br from-cyan-50 to-cyan-100/50'
    };
    return colors[color] || 'border-gray-200 bg-white';
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
            className={`bg-white rounded-xl border-2 p-6 shadow-sm transition-all duration-200 hover:shadow-lg ${getCardBorderColor(card.risk.color)}`}
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
            <div className="mb-3">
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

            {/* Risk Label */}
            <div>
              <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold ${
                card.risk.color === 'red' ? 'bg-red-200 text-red-800' :
                card.risk.color === 'orange' ? 'bg-orange-200 text-orange-800' :
                card.risk.color === 'yellow' ? 'bg-yellow-200 text-yellow-800' :
                card.risk.color === 'green' ? 'bg-green-200 text-green-800' :
                card.risk.color === 'blue' ? 'bg-blue-200 text-blue-800' :
                'bg-cyan-200 text-cyan-800'
              }`}>
                {card.risk.label}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default WeatherMonitoringGrid;
