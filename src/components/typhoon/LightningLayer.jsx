import { useEffect, useState } from 'react';
import { CircleMarker, Popup, Circle, useMap } from 'react-leaflet';
import { getRecentLightning, getStormCells } from '../../services/lightningService';
import { Zap } from 'lucide-react';

/**
 * Lightning Layer Component
 * Displays recent lightning strikes and storm cells on the typhoon map
 */
export function LightningLayer({ showLightning, showStormCells }) {
  const [lightningData, setLightningData] = useState(null);
  const [stormCells, setStormCells] = useState(null);
  const [loading, setLoading] = useState(false);
  const map = useMap();

  // Fetch lightning data on mount and periodically
  useEffect(() => {
    if (!showLightning && !showStormCells) return;

    const fetchData = async () => {
      setLoading(true);
      try {
        if (showLightning) {
          const data = await getRecentLightning();
          setLightningData(data);
        }
        if (showStormCells) {
          const cells = await getStormCells();
          setStormCells(cells);
        }
      } catch (error) {
        console.error('Error fetching lightning data:', error);
      } finally {
        setLoading(false);
      }
    };

    // Initial fetch
    fetchData();

    // Refresh every 2 minutes (lightning is real-time)
    const interval = setInterval(fetchData, 2 * 60 * 1000);

    return () => clearInterval(interval);
  }, [showLightning, showStormCells]);

  if (!showLightning && !showStormCells) return null;

  return (
    <>
      {/* Lightning Strikes */}
      {showLightning && lightningData?.strikes && lightningData.strikes.map((strike, index) => {
        const color = getStrikeColor(strike.intensity);
        const radius = getStrikeRadius(strike.intensity);
        const age = Date.now() - new Date(strike.timestamp).getTime();
        const opacity = Math.max(0.3, 1 - (age / (30 * 60 * 1000))); // Fade over 30 minutes

        return (
          <CircleMarker
            key={`strike-${index}`}
            center={[strike.lat, strike.lon]}
            radius={radius}
            pathOptions={{
              fillColor: color,
              color: color,
              weight: 1,
              opacity: opacity,
              fillOpacity: opacity * 0.6
            }}
          >
            <Popup>
              <div className="text-sm">
                <div className="font-semibold flex items-center gap-1">
                  <Zap size={14} className="text-yellow-500" />
                  Lightning Strike
                </div>
                <div className="text-xs mt-1 space-y-0.5">
                  <div><strong>Time:</strong> {new Date(strike.timestamp).toLocaleString()}</div>
                  <div><strong>Intensity:</strong> {strike.intensity}</div>
                  <div><strong>Location:</strong> {strike.lat.toFixed(4)}°, {strike.lon.toFixed(4)}°</div>
                  {strike.altitude && (
                    <div><strong>Altitude:</strong> {Math.round(strike.altitude)}m</div>
                  )}
                </div>
              </div>
            </Popup>
          </CircleMarker>
        );
      })}

      {/* Storm Cells */}
      {showStormCells && stormCells?.cells && stormCells.cells.map((cell, index) => {
        const color = getCellColor(cell.severity);
        const radius = Math.min(cell.strikeCount * 100, 30000); // Max 30km radius

        return (
          <Circle
            key={`cell-${index}`}
            center={[cell.center.lat, cell.center.lon]}
            radius={radius}
            pathOptions={{
              fillColor: color,
              color: color,
              weight: 2,
              opacity: 0.8,
              fillOpacity: 0.2,
              dashArray: '5, 10'
            }}
          >
            <Popup>
              <div className="text-sm">
                <div className="font-semibold flex items-center gap-1">
                  <Zap size={14} className="text-orange-500" />
                  Storm Cell
                </div>
                <div className="text-xs mt-1 space-y-0.5">
                  <div><strong>Severity:</strong> <span className="uppercase">{cell.severity}</span></div>
                  <div><strong>Strikes:</strong> {cell.strikeCount}</div>
                  <div><strong>Duration:</strong> {Math.round(cell.duration)} min</div>
                  <div><strong>Activity:</strong> {cell.activity.toFixed(1)} strikes/min</div>
                  <div><strong>Center:</strong> {cell.center.lat.toFixed(4)}°, {cell.center.lon.toFixed(4)}°</div>
                  <div className="text-xs text-gray-600 mt-1">
                    {new Date(cell.firstStrike).toLocaleTimeString()} - {new Date(cell.lastStrike).toLocaleTimeString()}
                  </div>
                </div>
              </div>
            </Popup>
          </Circle>
        );
      })}

      {/* Data Info Badge */}
      {(showLightning || showStormCells) && (
        <div
          className="leaflet-control leaflet-bar"
          style={{
            position: 'absolute',
            top: '10px',
            right: '10px',
            background: 'white',
            padding: '8px 12px',
            borderRadius: '4px',
            boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
            fontSize: '11px',
            zIndex: 1000
          }}
        >
          {loading && <div className="text-gray-500">Loading lightning data...</div>}
          {!loading && lightningData && (
            <div className="space-y-1">
              {showLightning && (
                <div className="flex items-center gap-1">
                  <Zap size={12} className="text-yellow-500" />
                  <span>{lightningData.totalCount} strikes ({lightningData.timeRange})</span>
                  {lightningData.isFallback && (
                    <span className="text-xs text-orange-600">(Test Data)</span>
                  )}
                </div>
              )}
              {showStormCells && stormCells && (
                <div className="flex items-center gap-1 text-orange-600">
                  <Zap size={12} />
                  <span>{stormCells.count} storm cells</span>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </>
  );
}

/**
 * Get color for lightning strike based on intensity
 */
function getStrikeColor(intensity) {
  switch (intensity) {
    case 'severe':
      return '#dc2626'; // red-600
    case 'strong':
      return '#f97316'; // orange-500
    case 'moderate':
      return '#eab308'; // yellow-500
    case 'weak':
    default:
      return '#fbbf24'; // yellow-400
  }
}

/**
 * Get radius for lightning strike marker
 */
function getStrikeRadius(intensity) {
  switch (intensity) {
    case 'severe':
      return 8;
    case 'strong':
      return 6;
    case 'moderate':
      return 5;
    case 'weak':
    default:
      return 4;
  }
}

/**
 * Get color for storm cell based on severity
 */
function getCellColor(severity) {
  switch (severity) {
    case 'severe':
      return '#7f1d1d'; // red-900
    case 'strong':
      return '#c2410c'; // orange-700
    case 'moderate':
      return '#ca8a04'; // yellow-600
    case 'weak':
    default:
      return '#9ca3af'; // gray-400
  }
}
