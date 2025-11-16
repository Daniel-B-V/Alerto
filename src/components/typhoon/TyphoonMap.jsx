import { useEffect, useRef, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, Circle, CircleMarker, Polygon, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { catmullRomSpline, getTrackUpToDate } from '../../utils/curveInterpolation';
import {
  getIntensityStyle,
  HISTORICAL_TRACK_STYLE,
  FORECAST_TRACK_STYLE,
  PAST_MARKER_STYLE,
  FORECAST_MARKER_STYLE,
  FORECAST_CONE_STYLE
} from '../../config/typhoonStyles';
import { generateForecastCone, smoothConeEdges } from '../../utils/forecastCone';
import { Wind, CloudRain, Cloud, Thermometer, Gauge } from 'lucide-react';
import { RainViewerLayer } from './RainViewerLayer';
import { VelocityLayer } from './VelocityLayer';

// Fix for default marker icon issue in Leaflet with Webpack/Vite
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

/**
 * Custom typhoon marker icon (current position - larger)
 */
function createTyphoonIcon(color, category) {
  return L.divIcon({
    className: 'custom-typhoon-icon',
    html: `
      <div style="
        background-color: ${color};
        width: 44px;
        height: 44px;
        border-radius: 50%;
        border: 4px solid white;
        box-shadow: 0 4px 12px rgba(0,0,0,0.5), 0 0 0 2px ${color};
        display: flex;
        align-items: center;
        justify-content: center;
        color: white;
        font-weight: bold;
        font-size: 18px;
      ">
        ${category >= 0 ? category : 'D'}
      </div>
    `,
    iconSize: [44, 44],
    iconAnchor: [22, 22],
  });
}

/**
 * Create timestamp label icon for track points
 */
function createTimestampIcon(timestamp, windSpeed) {
  const date = new Date(timestamp);
  const hours = date.getHours();
  const ampm = hours >= 12 ? 'PM' : 'AM';
  const displayHours = hours % 12 || 12;
  const day = date.getDate();
  const monthShort = date.toLocaleDateString('en-US', { month: 'short' });
  const year = date.getFullYear();

  const label = `${displayHours}${ampm} ${day} ${monthShort}. ${year}`;

  return L.divIcon({
    className: 'typhoon-timestamp-label',
    html: `
      <div style="
        background: rgba(255, 255, 255, 0.95);
        padding: 2px 6px;
        border-radius: 4px;
        font-size: 10px;
        font-weight: 600;
        color: #333;
        white-space: nowrap;
        box-shadow: 0 2px 4px rgba(0,0,0,0.3);
        border: 1px solid #666;
      ">
        ${label}
      </div>
    `,
    iconSize: [100, 20],
    iconAnchor: [-10, 10],
  });
}

/**
 * Component to fit map bounds to show all typhoons
 */
function FitBounds({ typhoons }) {
  const map = useMap();

  useEffect(() => {
    if (!typhoons || typhoons.length === 0) {
      // Default to Philippines view
      map.setView([12.8797, 121.774], 6);
      return;
    }

    const bounds = [];

    typhoons.forEach(typhoon => {
      if (typhoon.current) {
        bounds.push([typhoon.current.lat, typhoon.current.lon]);
      }
      if (typhoon.track) {
        typhoon.track.forEach(point => {
          bounds.push([point.lat, point.lon]);
        });
      }
      if (typhoon.forecast) {
        typhoon.forecast.forEach(point => {
          bounds.push([point.lat, point.lon]);
        });
      }
    });

    if (bounds.length > 0) {
      map.fitBounds(bounds, { padding: [50, 50] });
    }
  }, [typhoons, map]);

  return null;
}

/**
 * TyphoonMap Component
 * Displays interactive map with typhoon tracks and forecasts
 */
export function TyphoonMap({
  typhoons = [],
  onTyphoonClick,
  selectedDate = null,
  title,
  subtitle,
  isTestMode,
  lastUpdate,
  onToggleTestData,
  onRefresh,
  isRefreshing,
  useTestData
}) {
  const mapRef = useRef(null);
  const [activeWeatherLayers, setActiveWeatherLayers] = useState({
    wind: false,
    rain: false,
    clouds: false,
    temp: false,
    pressure: false
  });

  const WEATHER_API_KEY = '13616e53cdfb9b00c018abeaa05e9784'; // OpenWeatherMap API key

  const toggleWeatherLayer = (layer) => {
    setActiveWeatherLayers(prev => {
      // If clicking the same layer, deactivate it
      if (prev[layer]) {
        return {
          wind: false,
          rain: false,
          clouds: false,
          temp: false,
          pressure: false
        };
      }
      // Otherwise, activate only the clicked layer
      return {
        wind: false,
        rain: false,
        clouds: false,
        temp: false,
        pressure: false,
        [layer]: true
      };
    });
  };

  return (
    <div className="relative w-full h-full rounded-lg border border-gray-300">
      <MapContainer
        center={[12.8797, 121.774]} // Center on Philippines
        zoom={6}
        style={{ height: '100%', width: '100%', minHeight: '600px' }}
        ref={mapRef}
        className="rounded-lg overflow-hidden"
      >
        {/* Base map tiles */}
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        />

        {/* Weather Layers */}
        {/* Animated Rain Radar - RainViewer */}
        <RainViewerLayer active={activeWeatherLayers.rain} />

        {/* Animated Wind Flow - Leaflet Velocity */}
        <VelocityLayer active={activeWeatherLayers.wind} />

        {/* OpenWeatherMap Layers - Clouds, Temp, Pressure */}
        {activeWeatherLayers.clouds && (
          <TileLayer
            url={`https://tile.openweathermap.org/map/clouds_new/{z}/{x}/{y}.png?appid=${WEATHER_API_KEY}`}
            attribution='&copy; <a href="https://openweathermap.org">OpenWeatherMap</a>'
            opacity={0.5}
          />
        )}

        {activeWeatherLayers.temp && (
          <TileLayer
            url={`https://tile.openweathermap.org/map/temp_new/{z}/{x}/{y}.png?appid=${WEATHER_API_KEY}`}
            attribution='&copy; <a href="https://openweathermap.org">OpenWeatherMap</a>'
            opacity={0.5}
          />
        )}

        {activeWeatherLayers.pressure && (
          <TileLayer
            url={`https://tile.openweathermap.org/map/pressure_new/{z}/{x}/{y}.png?appid=${WEATHER_API_KEY}`}
            attribution='&copy; <a href="https://openweathermap.org">OpenWeatherMap</a>'
            opacity={0.5}
          />
        )}

        {/* Fit bounds to show all typhoons */}
        <FitBounds typhoons={typhoons} />

        {/* Render each typhoon */}
        {typhoons.map((typhoon) => (
          <TyphoonLayer
            key={typhoon.id}
            typhoon={typhoon}
            selectedDate={selectedDate}
            onClick={() => onTyphoonClick && onTyphoonClick(typhoon)}
          />
        ))}
      </MapContainer>

      {/* Weather Layer Controls - OUTSIDE MapContainer to overlay properly */}
      <div
        className="absolute left-4 flex flex-col gap-2"
        style={{
          top: '100px',
          zIndex: 1000,
          pointerEvents: 'none'
        }}
      >
        <button
          onClick={() => toggleWeatherLayer('wind')}
          className={`flex items-center gap-2 px-3 py-2 rounded-lg shadow-lg transition-all ${
            activeWeatherLayers.wind
              ? 'bg-blue-500 text-white'
              : 'bg-white text-gray-700 hover:bg-gray-100'
          }`}
          title="Animated Wind Flow"
          style={{ minWidth: '100px', pointerEvents: 'auto', cursor: 'pointer' }}
        >
          <Wind className="w-5 h-5" />
          <span className="text-sm font-medium">Wind</span>
        </button>

        <button
          onClick={() => toggleWeatherLayer('rain')}
          className={`flex items-center gap-2 px-3 py-2 rounded-lg shadow-lg transition-all ${
            activeWeatherLayers.rain
              ? 'bg-blue-500 text-white'
              : 'bg-white text-gray-700 hover:bg-gray-100'
          }`}
          title="Animated Rain Radar"
          style={{ minWidth: '100px', pointerEvents: 'auto', cursor: 'pointer' }}
        >
          <CloudRain className="w-5 h-5" />
          <span className="text-sm font-medium">Rain</span>
        </button>

        <button
          onClick={() => toggleWeatherLayer('clouds')}
          className={`flex items-center gap-2 px-3 py-2 rounded-lg shadow-lg transition-all ${
            activeWeatherLayers.clouds
              ? 'bg-blue-500 text-white'
              : 'bg-white text-gray-700 hover:bg-gray-100'
          }`}
          title="Cloud Coverage"
          style={{ minWidth: '100px', pointerEvents: 'auto', cursor: 'pointer' }}
        >
          <Cloud className="w-5 h-5" />
          <span className="text-sm font-medium">Clouds</span>
        </button>

        <button
          onClick={() => toggleWeatherLayer('temp')}
          className={`flex items-center gap-2 px-3 py-2 rounded-lg shadow-lg transition-all ${
            activeWeatherLayers.temp
              ? 'bg-blue-500 text-white'
              : 'bg-white text-gray-700 hover:bg-gray-100'
          }`}
          title="Temperature"
          style={{ minWidth: '100px', pointerEvents: 'auto', cursor: 'pointer' }}
        >
          <Thermometer className="w-5 h-5" />
          <span className="text-sm font-medium">Temp</span>
        </button>

        <button
          onClick={() => toggleWeatherLayer('pressure')}
          className={`flex items-center gap-2 px-3 py-2 rounded-lg shadow-lg transition-all ${
            activeWeatherLayers.pressure
              ? 'bg-blue-500 text-white'
              : 'bg-white text-gray-700 hover:bg-gray-100'
          }`}
          title="Atmospheric Pressure"
          style={{ minWidth: '100px', pointerEvents: 'auto', cursor: 'pointer' }}
        >
          <Gauge className="w-5 h-5" />
          <span className="text-sm font-medium">Pressure</span>
        </button>
      </div>

      {/* Header Overlay - positioned absolutely over the map */}
      {title && (
        <div className="absolute top-0 left-0 right-0 z-[1000] bg-white/95 backdrop-blur-sm border-b border-gray-200 pointer-events-auto">
          <div className="flex items-center justify-between px-4 py-3">
            {/* Left - Title */}
            <div className="flex items-center gap-3">
              <div className="text-red-500">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 10l-2 1m0 0l-2-1m2 1v2.5M20 7l-2 1m2-1l-2-1m2 1v2.5M14 4l-2-1-2 1M4 7l2-1M4 7l2 1M4 7v2.5M12 21l-2-1m2 1l2-1m-2 1v-2.5M6 18l-2-1v-2.5M18 18l2-1v-2.5" />
                </svg>
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900">{title}</h3>
                {subtitle && <p className="text-xs text-gray-600 mt-0.5">{subtitle}</p>}
              </div>
              {isTestMode && (
                <div className="ml-2 bg-yellow-500 text-white text-xs font-semibold px-2 py-1 rounded flex items-center gap-1">
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                  </svg>
                  TEST MODE
                </div>
              )}
            </div>

            {/* Right - Controls */}
            <div className="flex items-center gap-3">
              {lastUpdate && (
                <div className="text-xs text-gray-600">
                  Last updated: {lastUpdate.toLocaleTimeString()}
                </div>
              )}
              {onToggleTestData && (
                <button
                  onClick={onToggleTestData}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs transition-colors ${
                    useTestData
                      ? 'bg-yellow-500 text-white hover:bg-yellow-600'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                  </svg>
                  Use Test Data
                </button>
              )}
              {onRefresh && (
                <button
                  onClick={onRefresh}
                  disabled={isRefreshing}
                  className="flex items-center gap-2 px-3 py-1.5 bg-blue-500 text-white rounded-lg text-xs hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <svg className={`w-3 h-3 ${isRefreshing ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  Refresh
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * Component to render a single typhoon with track and forecast
 */
function TyphoonLayer({ typhoon, onClick, selectedDate = null }) {
  if (!typhoon.current) return null;

  const { current, track = [], forecast = [] } = typhoon;

  // Filter track based on selected date
  const filteredTrack = selectedDate ? getTrackUpToDate(track, selectedDate) : track;

  // Hide forecast when viewing historical dates
  const showForecast = !selectedDate || new Date(selectedDate) >= new Date(track[track.length - 1]?.timestamp);
  const filteredForecast = showForecast ? forecast : [];

  // Get intensity-based styling for current position
  const intensityStyle = getIntensityStyle(current.windSpeedKnots || 0);

  // Prepare track coordinates (past positions) with smooth curves
  const rawTrackCoords = filteredTrack.map(point => [point.lat, point.lon]);
  const trackCoords = rawTrackCoords.length >= 2
    ? catmullRomSpline(rawTrackCoords, 0.2, 50) // Very smooth curves with low tension
    : rawTrackCoords;

  // Prepare forecast coordinates with smooth curves
  const rawForecastCoords = filteredForecast.map(point => [point.lat, point.lon]);
  const forecastCoords = rawForecastCoords.length >= 2
    ? catmullRomSpline(rawForecastCoords, 0.25, 40) // Smooth forecast curves
    : rawForecastCoords;

  // Generate forecast cone (cone of uncertainty) - starts from first track point
  const firstTrackPoint = filteredTrack.length > 0
    ? filteredTrack[0]  // Start from first historical point (tail)
    : current;

  // Current position for marker
  const currentPosition = filteredTrack.length > 0
    ? filteredTrack[filteredTrack.length - 1]
    : current;

  // Combine all track points (historical + forecast) for complete cone
  const allTrackPoints = [
    ...filteredTrack.slice(1), // Skip first point, we'll use it as start
    ...filteredForecast
  ];

  const forecastCone = allTrackPoints.length >= 2
    ? smoothConeEdges(generateForecastCone(firstTrackPoint, allTrackPoints), 4)
    : [];

  // Determine current position marker location
  const currentMarkerPosition = [currentPosition.lat, currentPosition.lon];

  // Create custom icon with intensity-based color
  const icon = createTyphoonIcon(
    intensityStyle.color,
    current.category
  );

  return (
    <>
      {/* Layer 1: Forecast Cone (Cone of Uncertainty) - Bottom layer */}
      {forecastCone.length > 0 && (
        <Polygon
          positions={forecastCone}
          pathOptions={{
            ...FORECAST_CONE_STYLE,
            fillColor: FORECAST_CONE_STYLE.fillColor,
            color: intensityStyle.color
          }}
        />
      )}

      {/* Layer 2: Forecast track - Dashed line */}
      {forecastCoords.length > 1 && (
        <>
          {/* Shadow */}
          <Polyline
            positions={forecastCoords}
            color={FORECAST_TRACK_STYLE.shadowColor}
            weight={FORECAST_TRACK_STYLE.shadowWeight}
            opacity={FORECAST_TRACK_STYLE.shadowOpacity}
            dashArray={FORECAST_TRACK_STYLE.dashArray}
          />
          {/* White outline */}
          <Polyline
            positions={forecastCoords}
            color={FORECAST_TRACK_STYLE.outlineColor}
            weight={FORECAST_TRACK_STYLE.outlineWeight}
            opacity={1}
            dashArray={FORECAST_TRACK_STYLE.dashArray}
          />
          {/* Main forecast line - intensity color */}
          <Polyline
            positions={forecastCoords}
            color={intensityStyle.color}
            weight={FORECAST_TRACK_STYLE.weight}
            opacity={FORECAST_TRACK_STYLE.opacity}
            dashArray={FORECAST_TRACK_STYLE.dashArray}
          />
        </>
      )}

      {/* Layer 3: Historical track - Solid line with intensity colors */}
      {trackCoords.length > 1 && (
        <>
          {/* Shadow */}
          <Polyline
            positions={trackCoords}
            color={HISTORICAL_TRACK_STYLE.shadowColor}
            weight={HISTORICAL_TRACK_STYLE.shadowWeight}
            opacity={HISTORICAL_TRACK_STYLE.shadowOpacity}
          />
          {/* White outline */}
          <Polyline
            positions={trackCoords}
            color={HISTORICAL_TRACK_STYLE.outlineColor}
            weight={HISTORICAL_TRACK_STYLE.outlineWeight}
            opacity={1}
          />
          {/* Main track line - intensity color */}
          <Polyline
            positions={trackCoords}
            color={intensityStyle.color}
            weight={HISTORICAL_TRACK_STYLE.weight}
            opacity={HISTORICAL_TRACK_STYLE.opacity}
          />
        </>
      )}


      {/* Layer 4: Wind radius circle - Hide when forecast cone is showing */}
      {current.windSpeed > 60 && !selectedDate && forecastCone.length === 0 && (
        <Circle
          center={currentMarkerPosition}
          radius={current.windSpeed * 1000} // Convert km to meters
          fillColor={intensityStyle.color}
          fillOpacity={0.12}
          color={intensityStyle.color}
          weight={2}
          opacity={0.6}
        />
      )}

      {/* Current position marker */}
      <Marker
        position={currentMarkerPosition}
        icon={icon}
        eventHandlers={{
          click: onClick
        }}
      >
        <Popup>
          <div className="min-w-[200px]">
            <h3 className="font-bold text-lg mb-2">{typhoon.name}</h3>
            <div className="space-y-1 text-sm">
              <div className="flex justify-between">
                <span className="font-semibold">Category:</span>
                <span
                  className="px-2 py-0.5 rounded text-white font-semibold"
                  style={{ backgroundColor: current.categoryColor }}
                >
                  {current.categoryName}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="font-semibold">Location:</span>
                <span>{current.lat.toFixed(2)}°N, {current.lon.toFixed(2)}°E</span>
              </div>
              <div className="flex justify-between">
                <span className="font-semibold">Wind Speed:</span>
                <span>{current.windSpeed} km/h</span>
              </div>
              <div className="flex justify-between">
                <span className="font-semibold">Pressure:</span>
                <span>{current.pressure} mb</span>
              </div>
              {current.timestamp && (
                <div className="flex justify-between text-xs text-gray-600 mt-2 pt-2 border-t">
                  <span>Last updated:</span>
                  <span>{new Date(current.timestamp).toLocaleString()}</span>
                </div>
              )}
            </div>
          </div>
        </Popup>
      </Marker>

      {/* Layer 5: Past position markers - Professional styling */}
      {filteredTrack.map((point, index) => {
        const isCurrentPosition = index === filteredTrack.length - 1;
        if (isCurrentPosition) return null; // Skip last point (shown as main marker)

        // Get intensity style for this historical point
        const pointIntensity = getIntensityStyle(point.windSpeed || 0);

        return (
          <div key={`track-${index}`}>
            {/* Circle marker with intensity color */}
            <CircleMarker
              center={[point.lat, point.lon]}
              radius={PAST_MARKER_STYLE.radius}
              fillColor={pointIntensity.color}
              fillOpacity={PAST_MARKER_STYLE.fillOpacity}
              color={PAST_MARKER_STYLE.color}
              weight={PAST_MARKER_STYLE.weight}
            >
              <Popup>
                <div className="text-sm">
                  <div className="font-semibold">Historical Position</div>
                  <div>Intensity: {pointIntensity.name}</div>
                  <div>Wind: {point.windSpeedKmh} km/h</div>
                  <div>Pressure: {point.pressure} mb</div>
                  {point.timestamp && (
                    <div className="text-xs text-gray-600 mt-1">
                      {new Date(point.timestamp).toLocaleString()}
                    </div>
                  )}
                </div>
              </Popup>
            </CircleMarker>

            {/* Timestamp label - Show every other point */}
            {index % 2 === 0 && point.timestamp && (
              <Marker
                position={[point.lat, point.lon]}
                icon={createTimestampIcon(point.timestamp, point.windSpeedKmh)}
                interactive={false}
              />
            )}
          </div>
        );
      })}

      {/* Layer 6: Forecast position markers - Professional styling */}
      {filteredForecast.map((point, index) => {
        // Get projected intensity for forecast point
        const forecastIntensity = getIntensityStyle(point.windSpeed || point.windSpeedKmh / 1.852 || 0);

        return (
          <div key={`forecast-${index}`}>
            {/* Hollow circle marker with dashed border */}
            <CircleMarker
              center={[point.lat, point.lon]}
              radius={FORECAST_MARKER_STYLE.radius}
              fillColor={forecastIntensity.color}
              fillOpacity={FORECAST_MARKER_STYLE.fillOpacity}
              color={forecastIntensity.color}
              weight={FORECAST_MARKER_STYLE.weight}
              dashArray={FORECAST_MARKER_STYLE.dashArray}
            >
              <Popup>
                <div className="text-sm">
                  <div className="font-semibold">Forecast Position</div>
                  <div>Forecast: +{point.forecastHour}h</div>
                  <div>Projected Intensity: {forecastIntensity.name}</div>
                  <div>Wind: {point.windSpeedKmh} km/h</div>
                  <div>Pressure: {point.pressure} mb</div>
                  {point.timestamp && (
                    <div className="text-xs text-gray-600 mt-1">
                      {new Date(point.timestamp).toLocaleString()}
                    </div>
                  )}
                </div>
              </Popup>
            </CircleMarker>

            {/* Forecast timestamp label - Show for key intervals */}
            {(index === 0 || index === filteredForecast.length - 1) && point.timestamp && (
              <Marker
                position={[point.lat, point.lon]}
                icon={createTimestampIcon(point.timestamp, point.windSpeedKmh)}
                interactive={false}
              />
            )}
          </div>
        );
      })}
    </>
  );
}

export default TyphoonMap;
