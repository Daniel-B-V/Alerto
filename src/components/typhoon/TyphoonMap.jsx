import { useEffect, useRef } from 'react';
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
export function TyphoonMap({ typhoons = [], onTyphoonClick, selectedDate = null }) {
  const mapRef = useRef(null);

  return (
    <div className="relative w-full h-full rounded-lg overflow-hidden border border-gray-300">
      <MapContainer
        center={[12.8797, 121.774]} // Center on Philippines
        zoom={6}
        style={{ height: '100%', width: '100%', minHeight: '600px' }}
        ref={mapRef}
      >
        {/* Base map tiles */}
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        />

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
