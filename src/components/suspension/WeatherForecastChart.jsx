/**
 * Weather Forecast Chart
 * Shows 12-hour weather forecast with rainfall and wind speed trends
 */

import React, { useState, useEffect } from 'react';
import { Card } from '../ui/card';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';
import { getHourlyForecast } from '../../services/weatherService';
import { CloudRain, Wind, TrendingUp, TrendingDown, Minus } from 'lucide-react';

const WeatherForecastChart = ({ city }) => {
  const [forecastData, setForecastData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [trend, setTrend] = useState('stable');

  useEffect(() => {
    const loadForecast = async () => {
      if (!city) return;

      setLoading(true);
      try {
        const data = await getHourlyForecast(city);
        setForecastData(data);

        // Analyze trend (comparing first 4 hours vs last 4 hours)
        if (data.length >= 8) {
          const firstHalfAvgRain = data.slice(0, 4).reduce((sum, d) => sum + d.rainfall, 0) / 4;
          const lastHalfAvgRain = data.slice(4, 8).reduce((sum, d) => sum + d.rainfall, 0) / 4;

          if (lastHalfAvgRain > firstHalfAvgRain + 5) {
            setTrend('worsening');
          } else if (lastHalfAvgRain < firstHalfAvgRain - 5) {
            setTrend('improving');
          } else {
            setTrend('stable');
          }
        }
      } catch (error) {
        console.error('Error loading forecast:', error);
      } finally {
        setLoading(false);
      }
    };

    loadForecast();
  }, [city]);

  const getTrendIcon = () => {
    switch (trend) {
      case 'worsening':
        return <TrendingUp className="w-5 h-5 text-red-600" />;
      case 'improving':
        return <TrendingDown className="w-5 h-5 text-green-600" />;
      default:
        return <Minus className="w-5 h-5 text-gray-600" />;
    }
  };

  const getTrendColor = () => {
    switch (trend) {
      case 'worsening':
        return 'bg-red-50 border-red-200 text-red-800';
      case 'improving':
        return 'bg-green-50 border-green-200 text-green-800';
      default:
        return 'bg-gray-50 border-gray-200 text-gray-800';
    }
  };

  const getTrendText = () => {
    switch (trend) {
      case 'worsening':
        return 'Weather conditions expected to worsen';
      case 'improving':
        return 'Weather conditions expected to improve';
      default:
        return 'Weather conditions expected to remain stable';
    }
  };

  if (loading) {
    return (
      <Card className="p-6">
        <div className="text-center py-8 text-gray-500">
          Loading forecast data...
        </div>
      </Card>
    );
  }

  if (!forecastData || forecastData.length === 0) {
    return (
      <Card className="p-6">
        <div className="text-center py-8 text-gray-500">
          No forecast data available
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-bold text-gray-900">12-Hour Weather Forecast</h3>
          <p className="text-sm text-gray-500">{city || 'Selected City'}</p>
        </div>
        <div className={`flex items-center space-x-2 px-3 py-2 rounded-lg border ${getTrendColor()}`}>
          {getTrendIcon()}
          <span className="text-sm font-medium">{getTrendText()}</span>
        </div>
      </div>

      {/* Rainfall Chart */}
      <div className="mb-6">
        <div className="flex items-center mb-2">
          <CloudRain className="w-4 h-4 text-blue-500 mr-2" />
          <span className="text-sm font-medium text-gray-700">Rainfall Forecast (mm/h)</span>
        </div>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={forecastData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis
              dataKey="time"
              tick={{ fontSize: 12 }}
              stroke="#9ca3af"
            />
            <YAxis
              tick={{ fontSize: 12 }}
              stroke="#9ca3af"
              label={{ value: 'mm/h', angle: -90, position: 'insideLeft', style: { fontSize: 12 } }}
            />
            <Tooltip
              contentStyle={{ backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px' }}
              labelStyle={{ fontWeight: 'bold' }}
            />
            <Bar
              dataKey="rainfall"
              fill="#3b82f6"
              radius={[4, 4, 0, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Wind Speed Chart */}
      <div className="mb-4">
        <div className="flex items-center mb-2">
          <Wind className="w-4 h-4 text-gray-500 mr-2" />
          <span className="text-sm font-medium text-gray-700">Wind Speed Forecast (km/h)</span>
        </div>
        <ResponsiveContainer width="100%" height={200}>
          <LineChart data={forecastData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis
              dataKey="time"
              tick={{ fontSize: 12 }}
              stroke="#9ca3af"
            />
            <YAxis
              tick={{ fontSize: 12 }}
              stroke="#9ca3af"
              label={{ value: 'km/h', angle: -90, position: 'insideLeft', style: { fontSize: 12 } }}
            />
            <Tooltip
              contentStyle={{ backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px' }}
              labelStyle={{ fontWeight: 'bold' }}
            />
            <Line
              type="monotone"
              dataKey="wind"
              stroke="#6b7280"
              strokeWidth={2}
              dot={{ r: 4, fill: '#6b7280' }}
              activeDot={{ r: 6 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-3 gap-4 mt-4 pt-4 border-t">
        <div className="text-center">
          <div className="text-xs text-gray-500">Peak Rainfall</div>
          <div className="text-lg font-bold text-blue-600">
            {Math.max(...forecastData.map(d => d.rainfall))} mm/h
          </div>
        </div>
        <div className="text-center">
          <div className="text-xs text-gray-500">Peak Wind</div>
          <div className="text-lg font-bold text-gray-600">
            {Math.max(...forecastData.map(d => d.wind))} km/h
          </div>
        </div>
        <div className="text-center">
          <div className="text-xs text-gray-500">Avg Temp</div>
          <div className="text-lg font-bold text-orange-600">
            {(forecastData.reduce((sum, d) => sum + d.temperature, 0) / forecastData.length).toFixed(1)}°C
          </div>
        </div>
      </div>
    </Card>
  );
};

export default WeatherForecastChart;
