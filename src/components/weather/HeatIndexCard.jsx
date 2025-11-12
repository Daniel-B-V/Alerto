import { Thermometer, AlertTriangle, Info, Droplet } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Badge } from "../ui/badge";
import {
  calculateHeatIndex,
  getHeatIndexCategory,
  formatHeatIndexDisplay,
  getHeatSafetyTips,
  isPeakHeatTime
} from "../../utils/heatIndexUtils";

export function HeatIndexCard({ temperature, humidity, showDetails = false, className = "" }) {
  if (!temperature || !humidity) {
    return null;
  }

  const heatIndex = calculateHeatIndex(temperature, humidity);
  const category = getHeatIndexCategory(heatIndex);

  // Determine gradient colors based on category
  const getGradientStyle = () => {
    if (heatIndex >= 52) return { from: '#fef2f2', to: '#fee2e2', border: '#fecaca' }; // Extreme danger - red
    if (heatIndex >= 42) return { from: '#fff7ed', to: '#ffedd5', border: '#fed7aa' }; // Danger - orange
    if (heatIndex >= 33) return { from: '#fefce8', to: '#fef9c3', border: '#fef08a' }; // Extreme caution - yellow
    if (heatIndex >= 27) return { from: '#fffbeb', to: '#fef3c7', border: '#fde68a' }; // Caution - amber
    return { from: '#f0fdf4', to: '#dcfce7', border: '#bbf7d0' }; // Normal - green
  };

  const gradientColors = getGradientStyle();

  return (
    <div
      className={`${className} backdrop-blur-sm shadow-sm hover:shadow-md transition-all duration-200 rounded-lg border`}
      style={{
        background: `linear-gradient(to bottom right, ${gradientColors.from}, ${gradientColors.to})`,
        borderColor: gradientColors.border
      }}
    >
      <div className="p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm mb-1" style={{ color: category.color }}>
              Heat Index
            </p>
            <p className="text-2xl font-bold mb-1" style={{ color: category.textColor }}>
              {heatIndex}°C
            </p>
            <p className="text-xs" style={{ color: category.textColor }}>
              Feels like {heatIndex}°C
            </p>
          </div>
          <Thermometer className="w-8 h-8" style={{ color: category.color }} />
        </div>
      </div>
    </div>
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
