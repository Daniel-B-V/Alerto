/**
 * Decision Support Widget
 * AI-powered recommendation widget for suspension decisions
 */

import { AlertTriangle, CheckCircle, Eye, TrendingUp, Clock, FileText } from 'lucide-react';
import { Button } from '../../ui/button';
import { Badge } from '../../ui/badge';

export function DecisionSupportWidget({
  weatherData,
  aiRecommendation,
  reportCount = 0,
  criticalReports = 0,
  historicalSuspensions = [],
  onIssueSuspension,
  className = ''
}) {
  // Calculate risk score (0-100)
  const calculateRiskScore = () => {
    let score = 0;

    // Weather factors (max 50 points)
    if (weatherData) {
      // Rainfall (0-20 points)
      if (weatherData.rainfall >= 30) score += 20;
      else if (weatherData.rainfall >= 15) score += 15;
      else if (weatherData.rainfall >= 7.5) score += 10;
      else if (weatherData.rainfall > 0) score += 5;

      // Wind (0-15 points)
      if (weatherData.windSpeed >= 55) score += 15;
      else if (weatherData.windSpeed >= 39) score += 10;
      else if (weatherData.windSpeed >= 20) score += 5;

      // Temperature/Heat Index (0-15 points)
      const heatIndex = weatherData.heatIndex || weatherData.temperature;
      if (heatIndex >= 41) score += 15;
      else if (heatIndex >= 33) score += 10;
      else if (heatIndex >= 27) score += 5;
    }

    // Community reports (max 30 points)
    if (criticalReports > 0) {
      score += Math.min(20, criticalReports * 5);
    }
    if (reportCount > 0) {
      score += Math.min(10, reportCount * 2);
    }

    // AI Confidence (max 20 points)
    if (aiRecommendation?.confidence) {
      score += Math.round((aiRecommendation.confidence / 100) * 20);
    }

    return Math.min(100, Math.round(score));
  };

  const riskScore = calculateRiskScore();

  const getRecommendation = () => {
    if (riskScore >= 75) {
      return {
        action: 'SUSPEND NOW',
        level: 'critical',
        color: 'red',
        icon: AlertTriangle,
        message: 'Immediate suspension recommended based on current conditions.'
      };
    } else if (riskScore >= 50) {
      return {
        action: 'CONSIDER SUSPENDING',
        level: 'high',
        color: 'orange',
        icon: Eye,
        message: 'Weather conditions warrant serious consideration for suspension.'
      };
    } else if (riskScore >= 25) {
      return {
        action: 'MONITOR CLOSELY',
        level: 'moderate',
        color: 'yellow',
        icon: TrendingUp,
        message: 'Continue monitoring conditions. Suspension may be needed soon.'
      };
    } else {
      return {
        action: 'SAFE',
        level: 'low',
        color: 'green',
        icon: CheckCircle,
        message: 'Current conditions do not warrant suspension at this time.'
      };
    }
  };

  const recommendation = getRecommendation();
  const RecommendationIcon = recommendation.icon;

  // Get key factors contributing to score
  const getKeyFactors = () => {
    const factors = [];

    if (weatherData?.rainfall >= 15) {
      factors.push({
        icon: '🌧️',
        text: `Heavy rainfall: ${weatherData.rainfall} mm/h`,
        severity: weatherData.rainfall >= 30 ? 'critical' : 'high'
      });
    }

    if (weatherData?.windSpeed >= 39) {
      factors.push({
        icon: '💨',
        text: `Strong winds: ${weatherData.windSpeed} km/h`,
        severity: weatherData.windSpeed >= 55 ? 'critical' : 'high'
      });
    }

    const heatIndex = weatherData?.heatIndex || weatherData?.temperature;
    if (heatIndex >= 33) {
      factors.push({
        icon: '🌡️',
        text: `High heat index: ${heatIndex}°C`,
        severity: heatIndex >= 41 ? 'critical' : 'high'
      });
    }

    if (criticalReports > 0) {
      factors.push({
        icon: '⚠️',
        text: `${criticalReports} critical ${criticalReports === 1 ? 'report' : 'reports'}`,
        severity: 'high'
      });
    }

    if (weatherData?.pagasaWarning) {
      factors.push({
        icon: '🟡',
        text: `PAGASA ${weatherData.pagasaWarning.label}`,
        severity: weatherData.pagasaWarning.id === 'red' ? 'critical' : 'high'
      });
    }

    return factors;
  };

  const keyFactors = getKeyFactors();

  // Historical context
  const getHistoricalContext = () => {
    if (!historicalSuspensions || historicalSuspensions.length === 0) {
      return null;
    }

    // Find similar past suspensions
    const similar = historicalSuspensions.filter(s => {
      const criteria = s.criteria || {};
      if (!weatherData) return false;

      const rainfallMatch = Math.abs((criteria.rainfall || 0) - weatherData.rainfall) < 10;
      const windMatch = Math.abs((criteria.windSpeed || 0) - weatherData.windSpeed) < 15;

      return rainfallMatch || windMatch;
    });

    if (similar.length > 0) {
      return {
        count: similar.length,
        avgDuration: Math.round(similar.reduce((sum, s) => sum + (s.durationHours || 0), 0) / similar.length)
      };
    }

    return null;
  };

  const historicalContext = getHistoricalContext();

  // Get meter color based on score
  const getMeterColor = () => {
    if (riskScore >= 75) return 'from-red-500 to-red-600';
    if (riskScore >= 50) return 'from-orange-500 to-orange-600';
    if (riskScore >= 25) return 'from-yellow-500 to-yellow-600';
    return 'from-green-500 to-green-600';
  };

  const getBgColor = () => {
    if (recommendation.color === 'red') return 'bg-gradient-to-br from-red-50 to-red-100/50 border-red-300';
    if (recommendation.color === 'orange') return 'bg-gradient-to-br from-orange-50 to-orange-100/50 border-orange-300';
    if (recommendation.color === 'yellow') return 'bg-gradient-to-br from-yellow-50 to-yellow-100/50 border-yellow-300';
    return 'bg-gradient-to-br from-green-50 to-green-100/50 border-green-300';
  };

  return (
    <div className={`${className}`}>
      {/* Main Container - All Content in One White Box */}
      <div className="bg-white rounded-xl border-2 border-gray-200 p-6 mb-6 shadow-sm">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <div className={`p-3 rounded-xl ${
            recommendation.color === 'red' ? 'bg-red-200' :
            recommendation.color === 'orange' ? 'bg-orange-200' :
            recommendation.color === 'yellow' ? 'bg-yellow-200' :
            'bg-green-200'
          }`}>
            <RecommendationIcon className={`w-6 h-6 ${
              recommendation.color === 'red' ? 'text-red-700' :
              recommendation.color === 'orange' ? 'text-orange-700' :
              recommendation.color === 'yellow' ? 'text-yellow-700' :
              'text-green-700'
            }`} />
          </div>
          <div className="flex-1">
            <h3 className="text-xl font-bold text-gray-900">Suspension Decision Support</h3>
            <p className="text-sm text-gray-600">AI-powered recommendation</p>
          </div>
        </div>

        {/* Alert Level Badge */}
        <div className={`mb-6 rounded-xl p-6 border-2 text-center ${
          recommendation.color === 'red' ? 'bg-gradient-to-br from-red-50 to-red-100 border-red-300' :
          recommendation.color === 'orange' ? 'bg-gradient-to-br from-orange-50 to-orange-100 border-orange-300' :
          recommendation.color === 'yellow' ? 'bg-gradient-to-br from-yellow-50 to-yellow-100 border-yellow-300' :
          'bg-gradient-to-br from-green-50 to-green-100 border-green-300'
        }`}>
          <div className="flex flex-col items-center justify-center gap-3">
            <RecommendationIcon className={`w-16 h-16 ${
              recommendation.color === 'red' ? 'text-red-600' :
              recommendation.color === 'orange' ? 'text-orange-600' :
              recommendation.color === 'yellow' ? 'text-yellow-600' :
              'text-green-600'
            }`} />
            <div>
              <div className={`text-xs font-semibold uppercase tracking-wider mb-2 ${
                recommendation.color === 'red' ? 'text-red-700' :
                recommendation.color === 'orange' ? 'text-orange-700' :
                recommendation.color === 'yellow' ? 'text-yellow-700' :
                'text-green-700'
              }`}>
                Alert Level
              </div>
              <div className={`text-3xl font-black uppercase tracking-wide ${
                recommendation.color === 'red' ? 'text-red-900' :
                recommendation.color === 'orange' ? 'text-orange-900' :
                recommendation.color === 'yellow' ? 'text-yellow-900' :
                'text-green-900'
              }`}>
                {recommendation.action}
              </div>
            </div>
          </div>
        </div>

        {/* Recommendation Message */}
        <p className="text-center text-lg font-semibold text-gray-900 mb-6 px-4">
          {recommendation.message}
        </p>

        {/* Key Factors */}
        {keyFactors.length > 0 && (
          <div>
            <h4 className="text-sm font-bold text-gray-900 mb-3 flex items-center gap-2">
              <FileText className="w-4 h-4" />
              Key Factors
            </h4>
            <div className="space-y-2">
              {keyFactors.map((factor, index) => (
                <div
                  key={index}
                  className="flex items-center gap-3 p-3 rounded-lg bg-gray-50 border-l-4 border-gray-400"
                >
                  <span className="text-2xl">{factor.icon}</span>
                  <span className="text-sm font-semibold text-gray-900">{factor.text}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Historical Context */}
      {historicalContext && (
        <div className="mb-6 bg-white/60 rounded-lg p-4 border border-gray-200">
          <div className="flex items-center gap-2 mb-2">
            <Clock className="w-4 h-4 text-blue-600" />
            <span className="text-sm font-bold text-gray-900">Historical Context</span>
          </div>
          <p className="text-sm text-gray-700">
            Similar conditions led to suspension <span className="font-bold">{historicalContext.count}</span> {historicalContext.count === 1 ? 'time' : 'times'} in the past
            {historicalContext.avgDuration > 0 && (
              <>, averaging <span className="font-bold">{historicalContext.avgDuration} hours</span> duration</>
            )}.
          </p>
        </div>
      )}

      {/* Action Button */}
      {recommendation.level === 'critical' && onIssueSuspension && (
        <Button
          onClick={onIssueSuspension}
          className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-3 text-base"
        >
          <AlertTriangle className="w-5 h-5 mr-2" />
          Issue Suspension Now
        </Button>
      )}

      {recommendation.level === 'high' && onIssueSuspension && (
        <Button
          onClick={onIssueSuspension}
          variant="outline"
          className="w-full border-2 border-orange-500 text-orange-700 hover:bg-orange-50 font-semibold py-3 text-base"
        >
          <Eye className="w-5 h-5 mr-2" />
          Review & Consider Suspension
        </Button>
      )}
    </div>
  );
}

export default DecisionSupportWidget;
