import { Wind, Navigation, MapPin, Clock, AlertTriangle, Activity } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';

/**
 * StormDetailsPanel Component
 * Displays detailed text information about typhoons
 */
export function StormDetailsPanel({ typhoons = [], selectedTyphoon, onSelectTyphoon }) {
  if (typhoons.length === 0) {
    return (
      <Card className="bg-blue-50 border-blue-200">
        <CardContent className="p-6">
          <div className="flex flex-col items-center gap-3 text-center">
            <Wind className="w-12 h-12 text-blue-500" />
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                No Active Typhoons
              </h3>
              <p className="text-gray-600 text-sm">
                There are currently no active tropical cyclones detected in the Western Pacific region.
              </p>
              <p className="text-gray-500 text-xs mt-2">
                Data updates every 10 minutes from NOAA ATCF
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="h-full">
      {typhoons.map((typhoon) => (
        <StormCard
          key={typhoon.id}
          typhoon={typhoon}
          isSelected={selectedTyphoon?.id === typhoon.id}
          onClick={() => onSelectTyphoon && onSelectTyphoon(typhoon)}
        />
      ))}
    </div>
  );
}

/**
 * Individual storm card
 */
function StormCard({ typhoon, isSelected, onClick }) {
  const { name, current, track = [], forecast = [], isNearPhilippines } = typhoon;

  // Calculate movement direction and speed
  const movement = calculateMovement(track);

  // Get forecast landfall info
  const landfallInfo = getLandfallInfo(forecast, current);

  return (
    <Card
      className={`cursor-pointer transition-all hover:shadow-lg bg-white h-full ${
        isSelected ? 'ring-2 ring-blue-500 shadow-lg' : ''
      } ${isNearPhilippines ? 'border-red-400' : 'border-gray-200'}`}
      onClick={onClick}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="text-lg flex items-center gap-2 flex-wrap">
              {name}
              {isNearPhilippines && (
                <Badge className="bg-red-500 text-white text-xs">
                  <AlertTriangle className="w-3 h-3 mr-1" />
                  Near PH
                </Badge>
              )}
            </CardTitle>
            <div className="flex items-center gap-2 mt-2">
              <Badge
                className="text-xs font-semibold text-white"
                style={{ backgroundColor: current.categoryColor }}
              >
                {current.categoryName}
              </Badge>
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-3">
        {/* Wind Speed - Most Important Metric */}
        <div className="flex items-center gap-3 bg-orange-50 border border-orange-200 rounded-lg p-3">
          <Wind className="w-6 h-6 text-orange-600 flex-shrink-0" />
          <div className="flex-1">
            <div className="text-xs text-orange-700 font-medium">Wind Speed</div>
            <div className="text-xl font-bold text-orange-900">
              {current.windSpeed} <span className="text-sm font-normal">km/h</span>
            </div>
          </div>
        </div>

        {/* Location */}
        <div className="flex items-start gap-2">
          <MapPin className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
          <div className="flex-1">
            <div className="text-xs text-gray-600">Current Location</div>
            <div className="text-sm font-semibold text-gray-900">
              {current.lat.toFixed(2)}°N, {current.lon.toFixed(2)}°E
            </div>
          </div>
        </div>

        {/* Last Updated */}
        <div className="flex items-start gap-2">
          <Clock className="w-4 h-4 text-gray-500 mt-0.5 flex-shrink-0" />
          <div className="flex-1">
            <div className="text-xs text-gray-600">Last Updated</div>
            <div className="text-sm font-medium text-gray-900">
              {current.timestamp
                ? formatRelativeTime(new Date(current.timestamp))
                : 'N/A'}
            </div>
          </div>
        </div>

        {/* Proximity Warning - Only if near Philippines */}
        {landfallInfo && (
          <div className="flex items-start gap-2 bg-yellow-50 border border-yellow-200 rounded-lg p-3 mt-3">
            <AlertTriangle className="w-5 h-5 text-yellow-600 mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <div className="text-sm font-semibold text-yellow-900">
                {landfallInfo.title}
              </div>
              <div className="text-xs text-yellow-700 mt-1">
                {landfallInfo.message}
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

/**
 * Calculate storm movement direction and speed
 */
function calculateMovement(track) {
  if (!track || track.length < 2) return null;

  const latest = track[track.length - 1];
  const previous = track[track.length - 2];

  if (!latest || !previous || !latest.timestamp || !previous.timestamp) {
    return null;
  }

  // Calculate distance (simplified)
  const latDiff = latest.lat - previous.lat;
  const lonDiff = latest.lon - previous.lon;

  // Calculate direction
  let angle = Math.atan2(lonDiff, latDiff) * (180 / Math.PI);
  const directions = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
  const directionIndex = Math.round(((angle + 360) % 360) / 45) % 8;
  const direction = directions[directionIndex];

  // Calculate speed (rough estimate)
  const distance = Math.sqrt(latDiff ** 2 + lonDiff ** 2) * 111; // degrees to km
  const timeDiff =
    (new Date(latest.timestamp) - new Date(previous.timestamp)) / 3600000; // hours
  const speed = timeDiff > 0 ? Math.round(distance / timeDiff) : 0;

  return { direction, speed };
}

/**
 * Get landfall/proximity information
 */
function getLandfallInfo(forecast, current) {
  if (!forecast || forecast.length === 0) return null;

  // Check if current position is very close to Philippines
  const isVeryClose =
    current.lat >= 5 &&
    current.lat <= 20 &&
    current.lon >= 118 &&
    current.lon <= 127;

  if (isVeryClose) {
    return {
      title: 'Approaching Philippines',
      message:
        'This system is currently very close to or over the Philippines. Monitor local PAGASA advisories.',
    };
  }

  // Check if forecast path goes near Philippines
  const nearPhilippines = forecast.some(
    (point) =>
      point.lat >= 5 &&
      point.lat <= 20 &&
      point.lon >= 118 &&
      point.lon <= 127
  );

  if (nearPhilippines) {
    return {
      title: 'May Affect Philippines',
      message:
        'Forecast path indicates potential impact on Philippine areas. Continue monitoring updates.',
    };
  }

  return null;
}

/**
 * Format relative time (e.g., "2 hours ago")
 */
function formatRelativeTime(date) {
  const now = new Date();
  const diffMs = now - date;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 60) {
    return `${diffMins} min${diffMins !== 1 ? 's' : ''} ago`;
  } else if (diffHours < 24) {
    return `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`;
  } else {
    return `${diffDays} day${diffDays !== 1 ? 's' : ''} ago`;
  }
}

export default StormDetailsPanel;
