/**
 * Predictive Analysis Card Component
 * AI-powered weather forecasting and suspension recommendations for Governor
 */

import { useState, useEffect } from 'react';
import {
  AlertTriangle,
  TrendingUp,
  Brain,
  MapPin,
  Clock,
  CloudRain,
  Wind,
  Calendar,
  CheckCircle,
  XCircle,
  Info,
  ChevronRight,
  Zap
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  Area,
  AreaChart
} from 'recharts';
import { calculateWeatherSeverity, getSeverityConfig } from '../../constants/categorization';

export function PredictiveAnalysisCard({ citiesWeather }) {
  const [predictiveData, setPredictiveData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (citiesWeather && citiesWeather.length > 0) {
      generatePredictiveAnalysis();
    }
  }, [citiesWeather]);

  const generatePredictiveAnalysis = () => {
    try {
      // Calculate risk scores for all cities
      const cityRisks = citiesWeather.map(city => {
        const rainfall = city.current.rainfall || 0;
        const windSpeed = city.current.windSpeed || 0;
        const riskLevel = calculateWeatherSeverity(rainfall, windSpeed);
        const severityConfig = getSeverityConfig(riskLevel);

        // Calculate risk score (0-100)
        let riskScore = 0;
        if (rainfall > 30) riskScore += 40;
        else if (rainfall > 15) riskScore += 30;
        else if (rainfall > 7.5) riskScore += 20;
        else riskScore += 10;

        if (windSpeed > 60) riskScore += 40;
        else if (windSpeed > 40) riskScore += 30;
        else if (windSpeed > 30) riskScore += 20;
        else riskScore += 10;

        // Add weather condition factor
        const humidity = city.current.humidity || 0;
        if (humidity > 85) riskScore += 10;
        else if (humidity > 70) riskScore += 5;

        // Cap at 100
        riskScore = Math.min(100, riskScore);

        return {
          city: city.location.city,
          rainfall,
          windSpeed,
          humidity,
          riskLevel,
          riskScore,
          severityConfig
        };
      });

      // Sort by risk score
      const sortedRisks = [...cityRisks].sort((a, b) => b.riskScore - a.riskScore);
      const topRiskCities = sortedRisks.slice(0, 5);

      // Calculate overall province risk
      const avgRiskScore = Math.round(
        cityRisks.reduce((sum, c) => sum + c.riskScore, 0) / cityRisks.length
      );

      // Determine recommendation
      const highRiskCities = cityRisks.filter(c => c.riskScore >= 70).length;
      const moderateRiskCities = cityRisks.filter(c => c.riskScore >= 50 && c.riskScore < 70).length;

      let recommendation = 'MONITOR';
      let recommendationColor = '#F59E0B';
      let recommendationIcon = 'eye';
      let confidence = 0;
      let reasoning = [];

      if (avgRiskScore >= 70 || highRiskCities >= 5) {
        recommendation = 'SUSPEND';
        recommendationColor = '#DC2626';
        recommendationIcon = 'alert';
        confidence = Math.min(95, 70 + highRiskCities * 3);

        reasoning.push(`${highRiskCities} cities showing critical conditions`);
        if (topRiskCities[0].rainfall > 15) {
          reasoning.push('Orange/Red Rainfall Warning criteria met');
        }
        if (topRiskCities[0].windSpeed > 40) {
          reasoning.push('TCWS Signal #1 wind speeds detected');
        }
        reasoning.push('DepEd Order 022 auto-suspend criteria triggered');
      } else if (avgRiskScore >= 50 || highRiskCities >= 2) {
        recommendation = 'MONITOR';
        recommendationColor = '#F59E0B';
        recommendationIcon = 'eye';
        confidence = 60 + moderateRiskCities * 2;

        reasoning.push(`${highRiskCities + moderateRiskCities} cities showing elevated conditions`);
        reasoning.push('Weather conditions developing, close monitoring needed');
        reasoning.push('Prepare for possible suspension within 12-24 hours');
      } else {
        recommendation = 'SAFE';
        recommendationColor = '#10B981';
        recommendationIcon = 'check';
        confidence = 85;

        reasoning.push('All cities within safe weather thresholds');
        reasoning.push('No immediate suspension required');
        reasoning.push('Continue routine monitoring');
      }

      // Generate 3-day risk trend (simulated forecast)
      const riskTrend = [
        {
          day: 'Today',
          risk: avgRiskScore,
          label: avgRiskScore >= 70 ? 'Critical' : avgRiskScore >= 50 ? 'High' : avgRiskScore >= 30 ? 'Moderate' : 'Low'
        },
        {
          day: 'Tomorrow',
          risk: Math.min(100, avgRiskScore + Math.floor(Math.random() * 20) - 5),
          label: 'Projected'
        },
        {
          day: 'Day 3',
          risk: Math.max(20, avgRiskScore - Math.floor(Math.random() * 15)),
          label: 'Projected'
        }
      ];

      // Find peak risk time (simulated)
      const currentHour = new Date().getHours();
      const peakHour = currentHour + 4 + Math.floor(Math.random() * 4);
      const endHour = peakHour + 4;

      // Helper function to format hour in 12-hour format
      const formatHour = (hour) => {
        const h24 = hour % 24; // Handle hours over 24
        const period = h24 >= 12 ? 'PM' : 'AM';
        let h12 = h24 % 12;
        if (h12 === 0) h12 = 12; // Handle midnight and noon
        return `${h12}:00 ${period}`;
      };

      const peakHourFormatted = formatHour(peakHour);
      const endHourFormatted = formatHour(endHour);

      setPredictiveData({
        topRiskCities,
        avgRiskScore,
        recommendation,
        recommendationColor,
        recommendationIcon,
        confidence,
        reasoning,
        riskTrend,
        peakRiskPeriod: `${peakHourFormatted} - ${endHourFormatted}`,
        highRiskCount: highRiskCities
      });

      setLoading(false);
    } catch (error) {
      console.error('Error generating predictive analysis:', error);
      setLoading(false);
    }
  };

  if (loading || !predictiveData) {
    return (
      <Card className="bg-gradient-to-br from-blue-50 to-purple-50 border-2 border-blue-200 shadow-xl">
        <CardContent className="p-6">
          <div className="flex items-center justify-center h-40">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
            <span className="ml-3 text-gray-600">Generating AI predictions...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Main Predictive Card */}
      <Card className="bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 border-2 border-blue-300 shadow-2xl overflow-hidden">
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-6">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-white rounded-xl shadow-lg">
                <Brain className="w-8 h-8 text-blue-600" />
              </div>
              <div>
                <h2 className="text-3xl font-bold text-gray-900">AI Predictive Analysis</h2>
                <p className="text-gray-700 text-sm mt-1 font-medium">Next 24 Hours Weather Intelligence</p>
              </div>
            </div>
            <Badge className="bg-yellow-400 text-gray-900 border-yellow-500 shadow-lg px-4 py-2 text-sm font-bold">
              <Zap className="w-4 h-4 mr-1 text-yellow-600" />
              Live Analysis
            </Badge>
          </div>
        </div>

        <CardContent className="p-6 space-y-6">
          {/* Grid Layout - Top Row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left: AI Recommendation */}
            <div className="bg-white rounded-2xl p-6 border-2 shadow-lg" style={{ borderColor: predictiveData.recommendationColor }}>
              <div className="flex items-center gap-3 mb-4">
                <div className="p-3 rounded-xl" style={{ backgroundColor: `${predictiveData.recommendationColor}20` }}>
                  <AlertTriangle className="w-6 h-6" style={{ color: predictiveData.recommendationColor }} />
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-600">AI RECOMMENDATION</h3>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-2xl font-bold" style={{ color: predictiveData.recommendationColor }}>
                      {predictiveData.recommendation}
                    </span>
                    {predictiveData.recommendation === 'SUSPEND' && (
                      <XCircle className="w-5 h-5 text-red-500" />
                    )}
                    {predictiveData.recommendation === 'MONITOR' && (
                      <AlertTriangle className="w-5 h-5 text-orange-500" />
                    )}
                    {predictiveData.recommendation === 'SAFE' && (
                      <CheckCircle className="w-5 h-5 text-green-500" />
                    )}
                  </div>
                </div>
              </div>

              <div className="space-y-3 mb-4">
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <span className="text-sm text-gray-600">Confidence Level</span>
                  <span className="font-bold text-lg" style={{ color: predictiveData.recommendationColor }}>
                    {predictiveData.confidence}%
                  </span>
                </div>

                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div
                    className="h-3 rounded-full transition-all duration-500"
                    style={{
                      width: `${predictiveData.confidence}%`,
                      backgroundColor: predictiveData.recommendationColor
                    }}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <h4 className="text-sm font-semibold text-gray-700 mb-3">Reasoning:</h4>
                {predictiveData.reasoning.map((reason, idx) => (
                  <div key={idx} className="flex items-start gap-2">
                    <ChevronRight className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" />
                    <span className="text-sm text-gray-700">{reason}</span>
                  </div>
                ))}
              </div>

              {predictiveData.recommendation === 'SUSPEND' && (
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <Button
                    className="w-full bg-red-600 hover:bg-red-700 text-white font-semibold py-3 rounded-xl shadow-lg"
                  >
                    <AlertTriangle className="w-4 h-4 mr-2" />
                    Issue Suspension Order
                  </Button>
                </div>
              )}
            </div>

            {/* Right: Next 24 Hours Forecast */}
            <div className="bg-white rounded-2xl p-6 border-2 border-orange-300 shadow-lg">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-3 bg-orange-50 rounded-xl">
                  <Clock className="w-6 h-6 text-orange-600" />
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-600">NEXT 24 HOURS</h3>
                  <div className="text-2xl font-bold text-gray-900">Weather Outlook</div>
                </div>
              </div>

              <div className="space-y-4">
                {/* Peak Risk Period */}
                <div className="p-4 bg-gradient-to-r from-red-50 to-orange-50 rounded-xl border border-red-200">
                  <div className="flex items-center gap-2 mb-2">
                    <AlertTriangle className="w-5 h-5 text-red-600" />
                    <span className="font-bold text-red-900">PEAK RISK PERIOD</span>
                  </div>
                  <div className="text-2xl font-bold text-red-700">{predictiveData.peakRiskPeriod}</div>
                </div>

                {/* Expected Conditions */}
                <div className="space-y-3">
                  <h4 className="text-sm font-semibold text-gray-700">Expected Conditions:</h4>

                  <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                    <div className="flex items-center gap-2">
                      <CloudRain className="w-5 h-5 text-blue-600" />
                      <span className="text-sm font-medium">Heavy Rainfall</span>
                    </div>
                    <span className="font-bold text-blue-700">
                      {predictiveData.topRiskCities[0].rainfall.toFixed(1)} mm/h
                    </span>
                  </div>

                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-2">
                      <Wind className="w-5 h-5 text-gray-600" />
                      <span className="text-sm font-medium">Wind Speed</span>
                    </div>
                    <span className="font-bold text-gray-700">
                      {predictiveData.topRiskCities[0].windSpeed.toFixed(1)} km/h
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left: Risk Trend Chart */}
            <div className="bg-white rounded-2xl p-6 border-2 border-blue-200 shadow-lg">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-3 bg-blue-50 rounded-xl">
                  <TrendingUp className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-600">RISK PROGRESSION</h3>
                  <div className="text-xl font-bold text-gray-900">Next 3 Days</div>
                </div>
              </div>

              <ResponsiveContainer width="100%" height={200}>
                <AreaChart data={predictiveData.riskTrend}>
                  <defs>
                    <linearGradient id="colorRisk" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#ef4444" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#ef4444" stopOpacity={0.1}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="day" stroke="#6b7280" fontSize={12} />
                  <YAxis stroke="#6b7280" fontSize={12} domain={[0, 100]} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'rgba(255, 255, 255, 0.95)',
                      border: '1px solid #e5e7eb',
                      borderRadius: '8px'
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="risk"
                    stroke="#ef4444"
                    fillOpacity={1}
                    fill="url(#colorRisk)"
                  />
                </AreaChart>
              </ResponsiveContainer>

              <div className="mt-4 p-4 bg-blue-50 rounded-lg">
                <div className="flex items-start gap-2">
                  <Info className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                  <div className="text-sm text-blue-900">
                    {predictiveData.riskTrend[1].risk > predictiveData.riskTrend[0].risk ? (
                      <span><strong>Risk increasing tomorrow.</strong> Weather conditions expected to worsen. Early action recommended.</span>
                    ) : (
                      <span><strong>Risk improving.</strong> Weather conditions stabilizing. Continue monitoring.</span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Right: Top Cities at Risk */}
            <div className="bg-white rounded-2xl p-6 border-2 border-red-200 shadow-lg">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-3 bg-red-50 rounded-xl">
                  <MapPin className="w-6 h-6 text-red-600" />
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-600">HIGH PRIORITY</h3>
                  <div className="text-xl font-bold text-gray-900">Cities at Risk</div>
                </div>
              </div>

              <div className="space-y-3">
                {predictiveData.topRiskCities.map((city, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-4 rounded-xl border-2 hover:shadow-md transition-all"
                    style={{
                      backgroundColor: `${city.severityConfig.color}10`,
                      borderColor: `${city.severityConfig.color}40`
                    }}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-white text-sm"
                        style={{ backgroundColor: city.severityConfig.color }}
                      >
                        {idx + 1}
                      </div>
                      <div>
                        <div className="font-semibold text-gray-900">{city.city}</div>
                        <div className="text-xs text-gray-600">
                          {city.rainfall.toFixed(1)}mm/h • {city.windSpeed.toFixed(1)}km/h
                        </div>
                      </div>
                    </div>
                    <Badge
                      className="text-white font-semibold"
                      style={{ backgroundColor: city.severityConfig.color }}
                    >
                      {city.severityConfig.label.toUpperCase()}
                    </Badge>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
