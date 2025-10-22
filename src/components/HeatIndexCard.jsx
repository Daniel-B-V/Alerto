import { Thermometer, AlertTriangle, Info, Droplet } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Badge } from "./ui/badge";
import {
  calculateHeatIndex,
  getHeatIndexCategory,
  formatHeatIndexDisplay,
  getHeatSafetyTips,
  isPeakHeatTime
} from "../utils/heatIndexUtils";

export function HeatIndexCard({ temperature, humidity, showDetails = false, className = "" }) {
  if (!temperature || !humidity) {
    return null;
  }

  const heatIndex = calculateHeatIndex(temperature, humidity);
  const category = getHeatIndexCategory(heatIndex);
  const display = formatHeatIndexDisplay(heatIndex);
  const isAlertLevel = category.suspensionRecommended;
  const isPeakTime = isPeakHeatTime();

  return (
    <Card
      className={`${className} border-2`}
      style={{ borderColor: category.color }}
    >
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between">
          <span className="flex items-center gap-2 text-lg">
            <Thermometer className="w-5 h-5" style={{ color: category.color }} />
            Heat Index
          </span>
          <Badge
            className="text-xs font-bold"
            style={{
              backgroundColor: category.bgColor,
              color: category.textColor,
              border: `1px solid ${category.color}`
            }}
          >
            {category.icon} {category.label}
          </Badge>
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Heat Index Value */}
        <div className="text-center py-4 rounded-lg" style={{ backgroundColor: category.bgColor }}>
          <div className="text-5xl font-bold mb-2" style={{ color: category.color }}>
            {heatIndex}°C
          </div>
          <div className="text-sm" style={{ color: category.textColor }}>
            Feels like {heatIndex}°C
          </div>
        </div>

        {/* Current Conditions */}
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div className="flex items-center gap-2 p-2 bg-gray-50 rounded">
            <Thermometer className="w-4 h-4 text-gray-500" />
            <div>
              <div className="text-xs text-gray-500">Temperature</div>
              <div className="font-semibold">{temperature}°C</div>
            </div>
          </div>
          <div className="flex items-center gap-2 p-2 bg-gray-50 rounded">
            <Droplet className="w-4 h-4 text-gray-500" />
            <div>
              <div className="text-xs text-gray-500">Humidity</div>
              <div className="font-semibold">{humidity}%</div>
            </div>
          </div>
        </div>

        {/* Peak Heat Time Warning */}
        {isPeakTime && (
          <div className="flex items-start gap-2 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
            <AlertTriangle className="w-4 h-4 text-yellow-600 flex-shrink-0 mt-0.5" />
            <div className="text-xs text-yellow-800">
              <strong>Peak Heat Hours:</strong> It's currently 11 AM - 3 PM when heat is most intense.
            </div>
          </div>
        )}

        {/* Suspension Warning */}
        {isAlertLevel && (
          <div
            className="flex items-start gap-2 p-3 rounded-lg border-2"
            style={{
              backgroundColor: category.bgColor,
              borderColor: category.color
            }}
          >
            <AlertTriangle
              className="w-5 h-5 flex-shrink-0 mt-0.5"
              style={{ color: category.color }}
            />
            <div>
              <div className="font-bold text-sm mb-1" style={{ color: category.textColor }}>
                Class Suspension Recommended
              </div>
              <div className="text-xs" style={{ color: category.textColor }}>
                {category.suspensionReason}
              </div>
            </div>
          </div>
        )}

        {/* Description */}
        <div
          className="p-3 rounded-lg text-sm"
          style={{
            backgroundColor: category.bgColor,
            color: category.textColor
          }}
        >
          <div className="flex items-start gap-2">
            <Info className="w-4 h-4 flex-shrink-0 mt-0.5" />
            <div>
              <div className="font-semibold mb-1">{category.description}</div>
              <div className="text-xs">{category.recommendation}</div>
            </div>
          </div>
        </div>

        {/* Safety Tips (if showDetails) */}
        {showDetails && (
          <div className="space-y-2">
            <div className="font-semibold text-sm flex items-center gap-2">
              <Info className="w-4 h-4" />
              Safety Tips
            </div>
            <div className="space-y-1.5">
              {getHeatSafetyTips(heatIndex).map((tip, index) => (
                <div
                  key={index}
                  className="text-xs p-2 bg-gray-50 rounded flex items-start gap-2"
                >
                  <span className="flex-shrink-0">{tip.split(' ')[0]}</span>
                  <span>{tip.substring(tip.indexOf(' ') + 1)}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// Compact version for dashboard
export function HeatIndexBadge({ temperature, humidity, className = "" }) {
  if (!temperature || !humidity) {
    return null;
  }

  const heatIndex = calculateHeatIndex(temperature, humidity);
  const category = getHeatIndexCategory(heatIndex);

  return (
    <div
      className={`inline-flex items-center gap-2 px-3 py-2 rounded-lg ${className}`}
      style={{
        backgroundColor: category.bgColor,
        border: `1px solid ${category.color}`
      }}
    >
      <Thermometer
        className="w-4 h-4"
        style={{ color: category.color }}
      />
      <div>
        <div className="text-xs font-medium" style={{ color: category.textColor }}>
          Heat Index
        </div>
        <div className="text-sm font-bold" style={{ color: category.color }}>
          {heatIndex}°C {category.icon}
        </div>
      </div>
    </div>
  );
}

// Alert banner for high heat
export function HeatIndexAlert({ temperature, humidity, onDismiss }) {
  if (!temperature || !humidity) {
    return null;
  }

  const heatIndex = calculateHeatIndex(temperature, humidity);
  const category = getHeatIndexCategory(heatIndex);

  // Only show alert for danger levels
  if (!category.suspensionRecommended) {
    return null;
  }

  return (
    <div
      className="flex items-center justify-between p-4 rounded-lg border-2 mb-4"
      style={{
        backgroundColor: category.bgColor,
        borderColor: category.color
      }}
    >
      <div className="flex items-center gap-3">
        <AlertTriangle
          className="w-6 h-6 flex-shrink-0"
          style={{ color: category.color }}
        />
        <div>
          <div className="font-bold" style={{ color: category.textColor }}>
            {category.icon} {category.label} - Heat Index: {heatIndex}°C
          </div>
          <div className="text-sm mt-1" style={{ color: category.textColor }}>
            {category.description} {category.recommendation}
          </div>
        </div>
      </div>
      {onDismiss && (
        <button
          onClick={onDismiss}
          className="text-gray-500 hover:text-gray-700 transition-colors"
        >
          ✕
        </button>
      )}
    </div>
  );
}
