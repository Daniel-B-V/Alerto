import { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Polyline, Circle, Popup, useMap } from 'react-leaflet';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import {
  RefreshCw,
  AlertTriangle,
  Wind,
  Droplets,
  Navigation,
  Eye,
  Clock,
  TrendingUp,
  MapPin
} from 'lucide-react';
import {
  fetchActiveTyphoons,
  getTyphoonSummary,
  getNOAASatelliteImagery,
  BATANGAS_COORDS,
  MONITORING_RADIUS
} from '../../services/typhoonTrackingService';
import {
  formatDistance,
  getThreatBadgeClass,
  getThreatColor,
  getCompassDirection,
  calculateBearing,
  calculateETA,
  getStormDirection
} from '../../utils/stormDetection';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix for default marker icons in React Leaflet
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

let DefaultIcon = L.icon({
  iconUrl: icon,
  shadowUrl: iconShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41]
});

L.Marker.prototype.options.icon = DefaultIcon;

// Custom typhoon icon
const createTyphoonIcon = (threatLevel) => {
  const colors = {
    CRITICAL: '#DC2626',
    HIGH: '#EA580C',
    MODERATE: '#F59E0B',
    LOW: '#3B82F6',
    MINIMAL: '#6B7280'
  };

  const color = colors[threatLevel] || '#6B7280';

  return L.divIcon({
    className: 'custom-typhoon-icon',
    html: `
      <div style="
        background: ${color};
        width: 32px;
        height: 32px;
        border-radius: 50%;
        border: 3px solid white;
        box-shadow: 0 2px 8px rgba(0,0,0,0.3);
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 18px;
      ">
        🌀
      </div>
    `,
    iconSize: [32, 32],
    iconAnchor: [16, 16]
  });
};

// Component to handle map centering
function MapController({ center, zoom }) {
  const map = useMap();

  useEffect(() => {
    if (center) {
      map.setView(center, zoom);
    }
  }, [center, zoom, map]);

  return null;
}

export function TyphoonTracker() {
  const [typhoons, setTyphoons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedTyphoon, setSelectedTyphoon] = useState(null);
  const [mapCenter, setMapCenter] = useState([BATANGAS_COORDS.lat, BATANGAS_COORDS.lng]);
  const [mapZoom, setMapZoom] = useState(6);
  const [showSatellite, setShowSatellite] = useState(false);
  const [selectedTime, setSelectedTime] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [timeInterval, setTimeInterval] = useState('2h'); // '2h' or '1d'

  // Fetch typhoon data
  const loadTyphoonData = async () => {
    try {
      const data = await fetchActiveTyphoons();
      setTyphoons(data);

      // Auto-select nearest typhoon
      if (data.length > 0 && !selectedTyphoon) {
        setSelectedTyphoon(data[0]);
        setMapCenter([data[0].currentPosition.lat, data[0].currentPosition.lng]);
        setMapZoom(7);
      }
    } catch (error) {
      console.error('Error loading typhoon data:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadTyphoonData();

    // Auto-refresh every 30 minutes
    const interval = setInterval(loadTyphoonData, 30 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const handleRefresh = () => {
    setRefreshing(true);
    loadTyphoonData();
  };

  const handleTyphoonSelect = (typhoon) => {
    setSelectedTyphoon(typhoon);
    setMapCenter([typhoon.currentPosition.lat, typhoon.currentPosition.lng]);
    setMapZoom(7);
  };

  // Animation playback
  useEffect(() => {
    if (!isPlaying || !selectedTyphoon) return;

    const timePoints = getTimelinePoints(selectedTyphoon);
    if (!timePoints.length) return;

    const currentIndex = selectedTime
      ? timePoints.findIndex(t => t.timestamp === selectedTime)
      : 0;

    if (currentIndex >= timePoints.length - 1) {
      setIsPlaying(false);
      return;
    }

    const timer = setTimeout(() => {
      setSelectedTime(timePoints[currentIndex + 1].timestamp);
    }, 1000 / playbackSpeed);

    return () => clearTimeout(timer);
  }, [isPlaying, selectedTime, selectedTyphoon, playbackSpeed]);

  // Get timeline points from typhoon data based on selected interval
  const getTimelinePoints = (typhoon) => {
    if (!typhoon) return [];

    const points = [];
    const startTime = typhoon.pubDate.getTime();

    // Get the last forecast point to determine end time
    const lastForecast = typhoon.forecastTrack[typhoon.forecastTrack.length - 1];
    const endTime = lastForecast
      ? startTime + lastForecast.hours * 60 * 60 * 1000
      : startTime + (72 * 60 * 60 * 1000); // Default 72 hours

    // Determine interval in milliseconds
    const intervalMs = timeInterval === '1d'
      ? 24 * 60 * 60 * 1000  // 1 day
      : 2 * 60 * 60 * 1000;  // 2 hours

    // Generate points at regular intervals
    for (let time = startTime; time <= endTime; time += intervalMs) {
      const date = new Date(time);

      // Find the position for this time (interpolate if needed)
      const position = interpolatePosition(typhoon, time);

      if (position) {
        // Format label based on interval
        let label;
        if (timeInterval === '1d') {
          label = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        } else {
          const hours = date.getHours();
          const ampm = hours >= 12 ? 'PM' : 'AM';
          const displayHours = hours % 12 || 12;
          label = `${displayHours}${ampm}`;
        }

        points.push({
          timestamp: time,
          lat: position.lat,
          lng: position.lng,
          type: time === startTime ? 'current' : 'forecast',
          label,
          date
        });
      }
    }

    return points;
  };

  // Interpolate typhoon position for a given time
  const interpolatePosition = (typhoon, targetTime) => {
    const startTime = typhoon.pubDate.getTime();

    if (targetTime === startTime) {
      return typhoon.currentPosition;
    }

    // Find the two forecast points that bracket the target time
    const hoursFromStart = (targetTime - startTime) / (60 * 60 * 1000);

    let before = { ...typhoon.currentPosition, hours: 0 };
    let after = typhoon.forecastTrack[0];

    for (const forecast of typhoon.forecastTrack) {
      if (forecast.hours <= hoursFromStart) {
        before = forecast;
      } else {
        after = forecast;
        break;
      }
    }

    if (!after) {
      return typhoon.forecastTrack[typhoon.forecastTrack.length - 1];
    }

    // Linear interpolation
    const beforeTime = startTime + (before.hours || 0) * 60 * 60 * 1000;
    const afterTime = startTime + after.hours * 60 * 60 * 1000;
    const ratio = (targetTime - beforeTime) / (afterTime - beforeTime);

    return {
      lat: before.lat + (after.lat - before.lat) * ratio,
      lng: before.lng + (after.lng - before.lng) * ratio
    };
  };

  const handlePlayPause = () => {
    if (!selectedTyphoon) return;

    if (!isPlaying && !selectedTime) {
      // Start from beginning
      const timePoints = getTimelinePoints(selectedTyphoon);
      if (timePoints.length > 0) {
        setSelectedTime(timePoints[0].timestamp);
      }
    }
    setIsPlaying(!isPlaying);
  };

  const handleTimelineChange = (timestamp) => {
    setSelectedTime(timestamp);
    setIsPlaying(false);
  };

  // Get current typhoon position based on selected time
  const getCurrentPosition = (typhoon) => {
    if (!selectedTime) return typhoon.currentPosition;

    const timePoints = getTimelinePoints(typhoon);
    const selectedPoint = timePoints.find(t => t.timestamp === selectedTime);

    if (selectedPoint) {
      return { lat: selectedPoint.lat, lng: selectedPoint.lng };
    }

    return typhoon.currentPosition;
  };

  const summary = getTyphoonSummary(typhoons);

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center h-96">
          <div className="text-center">
            <RefreshCw className="w-12 h-12 animate-spin text-blue-500 mx-auto mb-4" />
            <p className="text-gray-600">Loading typhoon data...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header with Summary */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-blue-100 p-2 rounded-lg">
                <Wind className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <CardTitle className="text-xl">Typhoon Tracking Center</CardTitle>
                <p className="text-sm text-gray-600 mt-1">
                  JTWC + NOAA Real-time Storm Monitoring
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                onClick={() => {
                  const isTestMode = localStorage.getItem('useTyphoonTestData') === 'true';
                  localStorage.setItem('useTyphoonTestData', (!isTestMode).toString());
                  handleRefresh();
                }}
                variant="outline"
                size="sm"
                className={
                  localStorage.getItem('useTyphoonTestData') === 'true'
                    ? 'border-yellow-400 bg-yellow-50 text-yellow-700 hover:bg-yellow-100'
                    : 'border-gray-400 text-gray-700 hover:bg-gray-50'
                }
              >
                {localStorage.getItem('useTyphoonTestData') === 'true' ? 'Using Test Data' : 'Use Test Data'}
              </Button>
              <Button
                onClick={handleRefresh}
                disabled={refreshing}
                variant="outline"
                size="sm"
                className="border-blue-400 text-blue-700 hover:bg-blue-50"
              >
                <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent>
          {/* Status Banner */}
          <div className={`p-4 rounded-lg border-2 ${
            summary.threat === 'CRITICAL' ? 'bg-red-50 border-red-300' :
            summary.threat === 'HIGH' ? 'bg-orange-50 border-orange-300' :
            summary.threat === 'MODERATE' ? 'bg-yellow-50 border-yellow-300' :
            summary.threat === 'NONE' ? 'bg-green-50 border-green-300' :
            'bg-blue-50 border-blue-300'
          }`}>
            <div className="flex items-center gap-3">
              <AlertTriangle className={`w-6 h-6 ${
                summary.threat === 'CRITICAL' ? 'text-red-600' :
                summary.threat === 'HIGH' ? 'text-orange-600' :
                summary.threat === 'MODERATE' ? 'text-yellow-600' :
                summary.threat === 'NONE' ? 'text-green-600' :
                'text-blue-600'
              }`} />
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <Badge className={`${getThreatBadgeClass(summary.threat)} font-bold`}>
                    {summary.threat}
                  </Badge>
                  <span className="text-sm font-medium text-gray-700">
                    {summary.message}
                  </span>
                </div>
                {summary.nearest && (
                  <p className="text-xs text-gray-600 mt-1">
                    Nearest: <strong>{summary.nearest.name}</strong> ({formatDistance(summary.nearest.distanceFromBatangas)}) - {summary.nearest.intensity?.category}
                  </p>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Typhoon List */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="text-lg">
              Active Typhoons ({typhoons.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {typhoons.length === 0 ? (
              <div className="text-center py-8">
                <Eye className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500 text-sm">No active typhoons</p>
                <p className="text-xs text-gray-400 mt-1">All clear in the region</p>
              </div>
            ) : (
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {typhoons.map((typhoon, idx) => {
                  const bearing = calculateBearing(
                    typhoon.currentPosition.lat,
                    typhoon.currentPosition.lng,
                    BATANGAS_COORDS.lat,
                    BATANGAS_COORDS.lng
                  );
                  const direction = getCompassDirection(bearing);

                  return (
                    <button
                      key={typhoon.id || idx}
                      onClick={() => handleTyphoonSelect(typhoon)}
                      className={`w-full text-left p-3 rounded-lg border-2 transition-all ${
                        selectedTyphoon?.id === typhoon.id
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <h3 className="font-bold text-gray-900">{typhoon.name}</h3>
                          <p className="text-xs text-gray-600">{typhoon.type} {typhoon.id}</p>
                        </div>
                        <Badge className={`${getThreatBadgeClass(typhoon.threatLevel)} text-xs`}>
                          {typhoon.threatLevel}
                        </Badge>
                      </div>

                      <div className="space-y-1.5 text-xs">
                        <div className="flex items-center gap-2 text-gray-700">
                          <MapPin className="w-3.5 h-3.5" />
                          <span>{formatDistance(typhoon.distanceFromBatangas)} {direction}</span>
                        </div>
                        {typhoon.intensity?.windSpeed && (
                          <div className="flex items-center gap-2 text-gray-700">
                            <Wind className="w-3.5 h-3.5" />
                            <span>{Math.round(typhoon.intensity.windSpeed)} km/h</span>
                          </div>
                        )}
                        <div className="flex items-center gap-2 text-gray-600">
                          <Clock className="w-3.5 h-3.5" />
                          <span>{typhoon.pubDate.toLocaleString()}</span>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </CardContent>

          {/* Legend below Active Typhoons */}
          <CardContent className="pt-0">
            <div className="p-3 bg-gray-50 rounded-lg">
              <p className="text-xs font-bold text-gray-700 mb-2">Legend:</p>
              <div className="grid grid-cols-1 gap-2 text-xs">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded-full bg-red-500 border-2 border-white"></div>
                  <span>Critical (&lt;200km)</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded-full bg-orange-500 border-2 border-white"></div>
                  <span>High (&lt;500km)</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded-full bg-yellow-500 border-2 border-white"></div>
                  <span>Moderate (&lt;800km)</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 border-2 border-blue-500 bg-blue-500 opacity-10 rounded-full"></div>
                  <span>Monitoring radius</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Map */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">Forecast Track Map</CardTitle>
              <div className="flex gap-2">
                <Button
                  onClick={() => {
                    setMapCenter([BATANGAS_COORDS.lat, BATANGAS_COORDS.lng]);
                    setMapZoom(6);
                  }}
                  variant="outline"
                  size="sm"
                >
                  <MapPin className="w-4 h-4 mr-1" />
                  Center Batangas
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="h-96 rounded-lg overflow-hidden border border-gray-200">
              <MapContainer
                center={mapCenter}
                zoom={mapZoom}
                className="h-full w-full"
                scrollWheelZoom={true}
              >
                <MapController center={mapCenter} zoom={mapZoom} />

                <TileLayer
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />

                {/* Batangas Marker */}
                <Marker position={[BATANGAS_COORDS.lat, BATANGAS_COORDS.lng]}>
                  <Popup>
                    <div className="text-center">
                      <p className="font-bold">Batangas Province</p>
                      <p className="text-xs text-gray-600">Monitoring Center</p>
                    </div>
                  </Popup>
                </Marker>

                {/* Monitoring Radius Circles */}
                <Circle
                  center={[BATANGAS_COORDS.lat, BATANGAS_COORDS.lng]}
                  radius={MONITORING_RADIUS.CRITICAL * 1000}
                  pathOptions={{ color: '#DC2626', fillColor: '#DC2626', fillOpacity: 0.1 }}
                />
                <Circle
                  center={[BATANGAS_COORDS.lat, BATANGAS_COORDS.lng]}
                  radius={MONITORING_RADIUS.HIGH * 1000}
                  pathOptions={{ color: '#EA580C', fillColor: '#EA580C', fillOpacity: 0.05 }}
                />
                <Circle
                  center={[BATANGAS_COORDS.lat, BATANGAS_COORDS.lng]}
                  radius={MONITORING_RADIUS.MODERATE * 1000}
                  pathOptions={{ color: '#F59E0B', fillColor: '#F59E0B', fillOpacity: 0.03 }}
                />

                {/* Typhoons and Forecast Tracks */}
                {typhoons.map((typhoon, idx) => {
                  const currentPos = getCurrentPosition(typhoon);
                  const timePoints = getTimelinePoints(typhoon);

                  // Show full track or only up to selected time
                  const visibleForecastPoints = selectedTime
                    ? timePoints
                        .filter(p => p.timestamp <= selectedTime)
                        .map(p => [p.lat, p.lng])
                    : [
                        [typhoon.currentPosition.lat, typhoon.currentPosition.lng],
                        ...typhoon.forecastTrack.map(f => [f.lat, f.lng])
                      ];

                  // Get visible time points for markers
                  const visibleTimePoints = selectedTime
                    ? timePoints.filter(p => p.timestamp <= selectedTime)
                    : timePoints;

                  return (
                    <div key={typhoon.id || idx}>
                      {/* Past Track Points (small circles) - animated */}
                      {selectedTime && visibleTimePoints.slice(0, -1).map((point, pIdx) => (
                        <Circle
                          key={`past-${pIdx}`}
                          center={[point.lat, point.lng]}
                          radius={5000}
                          pathOptions={{
                            color: '#3B82F6',
                            fillColor: '#3B82F6',
                            fillOpacity: 0.4,
                            weight: 2,
                            className: 'animate-pulse'
                          }}
                        />
                      ))}

                      {/* Current position indicator (pulsing ring) - only when timeline is active */}
                      {selectedTime && (
                        <Circle
                          center={[currentPos.lat, currentPos.lng]}
                          radius={30000}
                          pathOptions={{
                            color: getThreatColor(typhoon.threatLevel),
                            fillColor: 'transparent',
                            weight: 3,
                            opacity: 0.8,
                            className: 'animate-ping'
                          }}
                        />
                      )}

                      {/* Typhoon Current Position */}
                      <Marker
                        position={[currentPos.lat, currentPos.lng]}
                        icon={createTyphoonIcon(typhoon.threatLevel)}
                      >
                        <Popup>
                          <div className="min-w-48">
                            <h3 className="font-bold text-lg mb-1">{typhoon.name}</h3>
                            <p className="text-xs text-gray-600 mb-2">{typhoon.type} {typhoon.id}</p>

                            <div className="space-y-1.5 text-xs">
                              <div className="flex justify-between">
                                <span className="text-gray-600">Distance:</span>
                                <span className="font-medium">{formatDistance(typhoon.distanceFromBatangas)}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-gray-600">Wind Speed:</span>
                                <span className="font-medium">{Math.round(typhoon.intensity?.windSpeed || 0)} km/h</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-gray-600">Category:</span>
                                <span className="font-medium">{typhoon.intensity?.category}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-gray-600">Threat:</span>
                                <Badge className={`${getThreatBadgeClass(typhoon.threatLevel)} text-xs`}>
                                  {typhoon.threatLevel}
                                </Badge>
                              </div>
                            </div>
                          </div>
                        </Popup>
                      </Marker>

                      {/* Forecast Track Line */}
                      {visibleForecastPoints.length > 1 && (
                        <Polyline
                          positions={visibleForecastPoints}
                          pathOptions={{
                            color: getThreatColor(typhoon.threatLevel),
                            weight: 3,
                            dashArray: '10, 5'
                          }}
                        />
                      )}

                      {/* Forecast Position Markers */}
                      {typhoon.forecastTrack.map((forecast, fIdx) => (
                        <Circle
                          key={fIdx}
                          center={[forecast.lat, forecast.lng]}
                          radius={5000}
                          pathOptions={{
                            color: getThreatColor(typhoon.threatLevel),
                            fillColor: getThreatColor(typhoon.threatLevel),
                            fillOpacity: 0.3
                          }}
                        >
                          <Popup>
                            <div className="text-center">
                              <p className="font-bold">{typhoon.name}</p>
                              <p className="text-xs text-gray-600">+{forecast.hours}H Forecast</p>
                            </div>
                          </Popup>
                        </Circle>
                      ))}
                    </div>
                  );
                })}
              </MapContainer>
            </div>

            {/* Timeline Control - Windy Style */}
            {selectedTyphoon && (
              <div className="mt-4 bg-white border border-gray-300 rounded-lg shadow-sm">
                {/* Timeline Header */}
                <div className="flex items-center justify-between px-4 py-2 border-b border-gray-200 bg-gray-50">
                  <div className="flex items-center gap-3">
                    <Clock className="w-4 h-4 text-gray-600" />
                    <span className="text-sm font-semibold text-gray-700">Timeline Control</span>
                    {selectedTime && (
                      <span className="text-xs text-gray-600 font-mono">
                        {new Date(selectedTime).toLocaleString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          hour: 'numeric',
                          minute: '2-digit'
                        })}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    {/* Interval Toggle */}
                    <div className="flex border border-gray-300 rounded overflow-hidden">
                      <button
                        onClick={() => setTimeInterval('2h')}
                        className={`px-3 py-1 text-xs font-medium transition-colors ${
                          timeInterval === '2h'
                            ? 'bg-blue-500 text-white'
                            : 'bg-white text-gray-700 hover:bg-gray-100'
                        }`}
                      >
                        2H
                      </button>
                      <button
                        onClick={() => setTimeInterval('1d')}
                        className={`px-3 py-1 text-xs font-medium border-l border-gray-300 transition-colors ${
                          timeInterval === '1d'
                            ? 'bg-blue-500 text-white'
                            : 'bg-white text-gray-700 hover:bg-gray-100'
                        }`}
                      >
                        1D
                      </button>
                    </div>

                    {/* Play/Pause */}
                    <button
                      onClick={handlePlayPause}
                      className="p-1.5 hover:bg-gray-200 rounded transition-colors"
                      title={isPlaying ? 'Pause' : 'Play'}
                    >
                      {isPlaying ? (
                        <svg className="w-4 h-4 text-gray-700" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zM7 8a1 1 0 012 0v4a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v4a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                        </svg>
                      ) : (
                        <svg className="w-4 h-4 text-gray-700" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                        </svg>
                      )}
                    </button>

                    {/* Reset */}
                    <button
                      onClick={() => {
                        setSelectedTime(null);
                        setIsPlaying(false);
                      }}
                      className="p-1.5 hover:bg-gray-200 rounded transition-colors"
                      title="Reset to current time"
                    >
                      <svg className="w-4 h-4 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                      </svg>
                    </button>

                    {/* Speed */}
                    <select
                      value={playbackSpeed}
                      onChange={(e) => setPlaybackSpeed(Number(e.target.value))}
                      className="text-xs border border-gray-300 rounded px-2 py-1 bg-white"
                    >
                      <option value={1}>1x</option>
                      <option value={2}>2x</option>
                      <option value={4}>4x</option>
                    </select>
                  </div>
                </div>

                {/* Timeline Slider with Time Labels */}
                <div className="px-4 py-3">
                  <div className="relative">
                    {/* Slider */}
                    <input
                      type="range"
                      min={0}
                      max={getTimelinePoints(selectedTyphoon).length - 1}
                      value={
                        selectedTime
                          ? getTimelinePoints(selectedTyphoon).findIndex(
                              (t) => t.timestamp === selectedTime
                            )
                          : 0
                      }
                      onChange={(e) => {
                        const timePoints = getTimelinePoints(selectedTyphoon);
                        const index = parseInt(e.target.value);
                        handleTimelineChange(timePoints[index].timestamp);
                      }}
                      className="w-full h-1.5 bg-gray-200 rounded-full appearance-none cursor-pointer accent-blue-500"
                      style={{
                        background: selectedTime
                          ? `linear-gradient(to right, #3B82F6 0%, #3B82F6 ${
                              ((getTimelinePoints(selectedTyphoon).findIndex((t) => t.timestamp === selectedTime) /
                                (getTimelinePoints(selectedTyphoon).length - 1)) *
                                100)
                            }%, #E5E7EB ${
                              ((getTimelinePoints(selectedTyphoon).findIndex((t) => t.timestamp === selectedTime) /
                                (getTimelinePoints(selectedTyphoon).length - 1)) *
                                100)
                            }%, #E5E7EB 100%)`
                          : '#E5E7EB'
                      }}
                    />

                    {/* Time Markers - Windy Style */}
                    <div className="absolute -bottom-6 left-0 right-0 flex justify-between pointer-events-none">
                      {getTimelinePoints(selectedTyphoon).map((point, idx) => (
                        <div key={idx} className="flex flex-col items-center">
                          <div className="w-px h-2 bg-gray-300"></div>
                          <span className="text-xs text-gray-600 font-medium mt-1 whitespace-nowrap">
                            {point.label}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Bottom padding for time labels */}
                <div className="h-8"></div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default TyphoonTracker;
