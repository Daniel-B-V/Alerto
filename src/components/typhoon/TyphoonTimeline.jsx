import { useState, useEffect, useRef } from 'react';
import { Play, Pause, SkipBack, SkipForward, Calendar } from 'lucide-react';
import { Card, CardContent } from '../ui/card';

/**
 * TyphoonTimeline Component
 * Interactive timeline with play/pause controls for viewing typhoon movement
 */
export function TyphoonTimeline({
  typhoon,
  selectedDate,
  onDateChange,
  className = '',
  compact = false
}) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [playSpeed, setPlaySpeed] = useState(1); // 1x, 2x, 4x
  const intervalRef = useRef(null);

  // Get all available dates from track and forecast
  const timelinePoints = getTimelinePoints(typhoon);
  const currentIndex = getCurrentIndex(timelinePoints, selectedDate);

  /**
   * Play/Pause animation
   */
  useEffect(() => {
    if (isPlaying && timelinePoints.length > 0) {
      const baseDelay = 1000; // 1 second base
      const delay = baseDelay / playSpeed;

      intervalRef.current = setInterval(() => {
        const nextIndex = currentIndex + 1;

        if (nextIndex >= timelinePoints.length) {
          // Reached the end, stop playing
          setIsPlaying(false);
        } else {
          onDateChange(new Date(timelinePoints[nextIndex].timestamp));
        }
      }, delay);

      return () => {
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
        }
      };
    }
  }, [isPlaying, currentIndex, timelinePoints, playSpeed, onDateChange]);

  /**
   * Handle play/pause button
   */
  const handlePlayPause = () => {
    if (isPlaying) {
      setIsPlaying(false);
    } else {
      // If at the end, restart from beginning
      if (currentIndex >= timelinePoints.length - 1) {
        onDateChange(new Date(timelinePoints[0].timestamp));
      }
      setIsPlaying(true);
    }
  };

  /**
   * Skip to first point
   */
  const handleSkipToStart = () => {
    if (timelinePoints.length > 0) {
      setIsPlaying(false);
      onDateChange(new Date(timelinePoints[0].timestamp));
    }
  };

  /**
   * Skip to last point
   */
  const handleSkipToEnd = () => {
    if (timelinePoints.length > 0) {
      setIsPlaying(false);
      onDateChange(new Date(timelinePoints[timelinePoints.length - 1].timestamp));
    }
  };

  /**
   * Handle speed change
   */
  const handleSpeedChange = () => {
    const speeds = [1, 2, 4];
    const currentSpeedIndex = speeds.indexOf(playSpeed);
    const nextSpeedIndex = (currentSpeedIndex + 1) % speeds.length;
    setPlaySpeed(speeds[nextSpeedIndex]);
  };

  /**
   * Handle timeline slider change
   */
  const handleSliderChange = (e) => {
    const index = parseInt(e.target.value);
    if (timelinePoints[index]) {
      setIsPlaying(false);
      onDateChange(new Date(timelinePoints[index].timestamp));
    }
  };

  /**
   * Handle reset to current time
   */
  const handleResetToCurrent = () => {
    setIsPlaying(false);
    onDateChange(null); // null means show current position
  };

  if (!typhoon || timelinePoints.length === 0) {
    return null;
  }

  const isAtCurrent = selectedDate === null || currentIndex === timelinePoints.length - 1;

  const timelineContent = (
    <div className={`space-y-${compact ? '3' : '4'}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Calendar className={`${compact ? 'w-4 h-4' : 'w-5 h-5'} text-blue-500`} />
          <h3 className={`${compact ? 'text-sm' : 'text-base'} font-semibold text-gray-900`}>Timeline Control</h3>
        </div>
        {!isAtCurrent && (
          <div className={`text-xs px-2 py-1 bg-yellow-100 text-yellow-800 rounded font-medium`}>
            Viewing Historical Position
          </div>
        )}
      </div>

          {/* Timeline Slider */}
          <div className="space-y-2">
            <input
              type="range"
              min="0"
              max={timelinePoints.length - 1}
              value={currentIndex}
              onChange={handleSliderChange}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-500"
              style={{
                background: `linear-gradient(to right,
                  #3b82f6 0%,
                  #3b82f6 ${(currentIndex / (timelinePoints.length - 1)) * 100}%,
                  #e5e7eb ${(currentIndex / (timelinePoints.length - 1)) * 100}%,
                  #e5e7eb 100%)`
              }}
            />

            {/* Date labels */}
            <div className="flex justify-between text-xs text-gray-600">
              <span>
                {timelinePoints[0] && formatDate(timelinePoints[0].timestamp)}
              </span>
              <span className="font-semibold text-blue-600">
                {timelinePoints[currentIndex] && formatDate(timelinePoints[currentIndex].timestamp)}
              </span>
              <span>
                {timelinePoints[timelinePoints.length - 1] &&
                 formatDate(timelinePoints[timelinePoints.length - 1].timestamp)}
              </span>
            </div>
          </div>

          {/* Control Buttons */}
          <div className="flex items-center justify-between gap-2">
            {/* Playback Controls */}
            <div className="flex items-center gap-2">
              <button
                onClick={handleSkipToStart}
                className="p-2 rounded-lg bg-gray-100 hover:bg-gray-200 transition-colors disabled:opacity-50"
                disabled={currentIndex === 0}
                title="Skip to start"
              >
                <SkipBack className="w-4 h-4 text-gray-700" />
              </button>

              <button
                onClick={handlePlayPause}
                className="p-3 rounded-lg bg-blue-500 hover:bg-blue-600 text-white transition-colors flex items-center gap-2"
                title={isPlaying ? "Pause" : "Play"}
              >
                {isPlaying ? (
                  <>
                    <Pause className="w-5 h-5" />
                    <span className="text-sm font-medium">Pause</span>
                  </>
                ) : (
                  <>
                    <Play className="w-5 h-5" />
                    <span className="text-sm font-medium">Play</span>
                  </>
                )}
              </button>

              <button
                onClick={handleSkipToEnd}
                className="p-2 rounded-lg bg-gray-100 hover:bg-gray-200 transition-colors disabled:opacity-50"
                disabled={currentIndex === timelinePoints.length - 1}
                title="Skip to end"
              >
                <SkipForward className="w-4 h-4 text-gray-700" />
              </button>
            </div>

            {/* Speed Control */}
            <div className="flex items-center gap-2">
              <button
                onClick={handleSpeedChange}
                className="px-3 py-2 rounded-lg bg-gray-100 hover:bg-gray-200 transition-colors text-sm font-medium text-gray-700"
                title="Change playback speed"
              >
                {playSpeed}x
              </button>

              {!isAtCurrent && (
                <button
                  onClick={handleResetToCurrent}
                  className="px-3 py-2 rounded-lg bg-green-500 hover:bg-green-600 text-white transition-colors text-sm font-medium"
                  title="Return to current position"
                >
                  Current
                </button>
              )}
            </div>
          </div>

      {/* Current Point Info */}
      {timelinePoints[currentIndex] && !compact && (
        <div className="pt-3 border-t border-gray-200">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
            <div>
              <div className="text-gray-600 text-xs">Position</div>
              <div className="font-semibold text-gray-900">
                {timelinePoints[currentIndex].lat.toFixed(2)}°N, {timelinePoints[currentIndex].lon.toFixed(2)}°E
              </div>
            </div>
            <div>
              <div className="text-gray-600 text-xs">Wind Speed</div>
              <div className="font-semibold text-gray-900">
                {timelinePoints[currentIndex].windSpeedKmh} km/h
              </div>
            </div>
            <div>
              <div className="text-gray-600 text-xs">Pressure</div>
              <div className="font-semibold text-gray-900">
                {timelinePoints[currentIndex].pressure} mb
              </div>
            </div>
            <div>
              <div className="text-gray-600 text-xs">Type</div>
              <div className="font-semibold text-gray-900">
                {timelinePoints[currentIndex].type || 'Unknown'}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  // Render compact mode without Card wrapper
  if (compact) {
    return timelineContent;
  }

  // Render normal mode with Card wrapper
  return (
    <Card className={`bg-white border-gray-200 ${className}`}>
      <CardContent className="p-4">
        {timelineContent}
      </CardContent>
    </Card>
  );
}

/**
 * Get all timeline points from track and forecast
 */
function getTimelinePoints(typhoon) {
  if (!typhoon) return [];

  const points = [];

  // Add track points (historical)
  if (typhoon.track) {
    typhoon.track.forEach(point => {
      points.push({
        timestamp: point.timestamp,
        lat: point.lat,
        lon: point.lon,
        windSpeedKmh: point.windSpeedKmh,
        pressure: point.pressure,
        type: point.type || 'Historical',
        isHistorical: true
      });
    });
  }

  // Add forecast points
  if (typhoon.forecast) {
    typhoon.forecast.forEach(point => {
      points.push({
        timestamp: point.timestamp,
        lat: point.lat,
        lon: point.lon,
        windSpeedKmh: point.windSpeedKmh,
        pressure: point.pressure,
        type: 'Forecast',
        isForecast: true
      });
    });
  }

  // Sort by timestamp
  points.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));

  return points;
}

/**
 * Get current index in timeline based on selected date
 */
function getCurrentIndex(timelinePoints, selectedDate) {
  if (!selectedDate || timelinePoints.length === 0) {
    // If no date selected, show the last historical point (current position)
    const lastHistoricalIndex = timelinePoints.findIndex(p => p.isForecast);
    return lastHistoricalIndex === -1 ? timelinePoints.length - 1 : lastHistoricalIndex - 1;
  }

  const targetTime = new Date(selectedDate).getTime();

  // Find the closest point
  let closestIndex = 0;
  let closestDiff = Math.abs(new Date(timelinePoints[0].timestamp).getTime() - targetTime);

  for (let i = 1; i < timelinePoints.length; i++) {
    const diff = Math.abs(new Date(timelinePoints[i].timestamp).getTime() - targetTime);
    if (diff < closestDiff) {
      closestDiff = diff;
      closestIndex = i;
    }
  }

  return closestIndex;
}

/**
 * Format date for display
 */
function formatDate(timestamp) {
  const date = new Date(timestamp);
  const month = date.toLocaleDateString('en-US', { month: 'short' });
  const day = date.getDate();
  const hours = date.getHours();
  const ampm = hours >= 12 ? 'PM' : 'AM';
  const displayHours = hours % 12 || 12;

  return `${month} ${day}, ${displayHours}${ampm}`;
}

export default TyphoonTimeline;
