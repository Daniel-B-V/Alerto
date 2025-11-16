import { useEffect, useRef, useState, useMemo } from 'react';
import Globe from 'react-globe.gl';
import { AlertCircle, RotateCw, ZoomIn, ZoomOut, Maximize2, Smartphone } from 'lucide-react';
import { isWebGLSupported, isMobileDevice, getRecommended3DQuality, logWebGLInfo } from '../../utils/webglDetection';

/**
 * Globe3DView Component
 * Interactive 3D globe visualization for typhoon tracking
 * Features: rotating earth, typhoon paths, forecast cones, city markers
 */
export function Globe3DView({ typhoons = [], onTyphoonClick, selectedTyphoon }) {
  const globeEl = useRef();
  const [globeReady, setGlobeReady] = useState(false);
  const [autoRotate, setAutoRotate] = useState(true);
  const [error, setError] = useState(null);

  // Get device capabilities
  const qualitySettings = useMemo(() => getRecommended3DQuality(), []);
  const isMobile = useMemo(() => isMobileDevice(), []);

  // Check WebGL support
  useEffect(() => {
    // Log capabilities in development
    if (import.meta.env.DEV) {
      logWebGLInfo();
    }

    if (!isWebGLSupported()) {
      setError('WebGL not supported. Please use a modern browser.');
      return;
    }

    setGlobeReady(true);
  }, []);

  // Auto-rotation effect
  useEffect(() => {
    if (!globeEl.current || !autoRotate) return;

    const globe = globeEl.current;

    // Gentle auto-rotation (slower on mobile to save battery)
    const rotateGlobe = () => {
      if (!autoRotate) return;
      const controls = globe.controls();
      controls.autoRotate = true;
      controls.autoRotateSpeed = isMobile ? 0.3 : 0.5;
    };

    setTimeout(rotateGlobe, 1000);
  }, [autoRotate, globeReady, isMobile]);

  // Focus on Philippines on mount
  useEffect(() => {
    if (!globeEl.current || !globeReady) return;

    globeEl.current.pointOfView(
      {
        lat: 12.8797,
        lng: 121.774,
        altitude: 2.5
      },
      1000
    );
  }, [globeReady]);

  // Transform typhoon data for globe arcs (tracks)
  const typhoonArcs = useMemo(() => {
    const arcs = [];

    typhoons.forEach(typhoon => {
      if (!typhoon.track || typhoon.track.length < 2) return;

      // Historical track as connected arcs
      for (let i = 0; i < typhoon.track.length - 1; i++) {
        const start = typhoon.track[i];
        const end = typhoon.track[i + 1];

        arcs.push({
          startLat: start.lat,
          startLng: start.lon,
          endLat: end.lat,
          endLng: end.lon,
          color: getIntensityColor(start.windSpeed),
          typhoonId: typhoon.id,
          typhoonName: typhoon.name,
          type: 'historical'
        });
      }

      // Forecast track as dashed arcs
      if (typhoon.forecast && typhoon.forecast.length > 1) {
        for (let i = 0; i < typhoon.forecast.length - 1; i++) {
          const start = typhoon.forecast[i];
          const end = typhoon.forecast[i + 1];

          arcs.push({
            startLat: start.lat,
            startLng: start.lon,
            endLat: end.lat,
            endLng: end.lon,
            color: [[255, 255, 255, 0.4]],
            typhoonId: typhoon.id,
            typhoonName: typhoon.name,
            type: 'forecast',
            dashLength: 0.1,
            dashGap: 0.05
          });
        }
      }
    });

    return arcs;
  }, [typhoons]);

  // Transform typhoon current positions to points
  const typhoonPoints = useMemo(() => {
    return typhoons.map(typhoon => {
      if (!typhoon.current) return null;

      return {
        lat: typhoon.current.lat,
        lng: typhoon.current.lon,
        size: 0.8,
        color: getIntensityColor(typhoon.current.windSpeed),
        typhoon: typhoon,
        label: typhoon.name,
        windSpeed: typhoon.current.windSpeed,
        category: typhoon.category
      };
    }).filter(Boolean);
  }, [typhoons]);

  // Philippine major cities
  const philippineCities = useMemo(() => [
    { lat: 14.5995, lng: 120.9842, name: 'Manila', size: 0.4, color: '#fbbf24' },
    { lat: 10.3157, lng: 123.8854, name: 'Cebu', size: 0.3, color: '#fbbf24' },
    { lat: 7.1907, lng: 125.4553, name: 'Davao', size: 0.3, color: '#fbbf24' },
    { lat: 13.7565, lng: 121.0583, name: 'Batangas', size: 0.3, color: '#fbbf24' },
    { lat: 16.4023, lng: 120.5960, name: 'Baguio', size: 0.2, color: '#fbbf24' },
    { lat: 15.4817, lng: 120.5979, name: 'Tarlac', size: 0.2, color: '#fbbf24' },
  ], []);

  // Control functions
  const handleZoomIn = (e) => {
    e?.stopPropagation();
    try {
      if (!globeEl.current) return;
      const pov = globeEl.current.pointOfView();
      globeEl.current.pointOfView({ altitude: Math.max(pov.altitude - 0.5, 0.5) }, 500);
    } catch (error) {
      console.error('Error zooming in:', error);
    }
  };

  const handleZoomOut = (e) => {
    e?.stopPropagation();
    try {
      if (!globeEl.current) return;
      const pov = globeEl.current.pointOfView();
      globeEl.current.pointOfView({ altitude: Math.min(pov.altitude + 0.5, 4) }, 500);
    } catch (error) {
      console.error('Error zooming out:', error);
    }
  };

  const handleReset = (e) => {
    e?.stopPropagation();
    try {
      if (!globeEl.current) return;
      globeEl.current.pointOfView({ lat: 12.8797, lng: 121.774, altitude: 2.5 }, 1000);
    } catch (error) {
      console.error('Error resetting view:', error);
    }
  };

  const handleFocusTyphoon = (typhoon) => {
    try {
      if (!globeEl.current || !typhoon || !typhoon.current) return;

      globeEl.current.pointOfView({
        lat: typhoon.current.lat,
        lng: typhoon.current.lon,
        altitude: 1.5
      }, 1000);

      if (onTyphoonClick) {
        onTyphoonClick(typhoon);
      }
    } catch (error) {
      console.error('Error focusing on typhoon:', error);
    }
  };

  if (error) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-blue-900 to-purple-900">
        <div className="bg-white rounded-lg shadow-xl p-8 max-w-md mx-4">
          <div className="flex items-center gap-3 text-red-600 mb-4">
            <AlertCircle className="w-8 h-8" />
            <h3 className="text-xl font-bold">3D View Unavailable</h3>
          </div>
          <p className="text-gray-700 mb-4">{error}</p>
          <p className="text-sm text-gray-600 mb-4">
            Your browser needs to support WebGL for 3D visualization.
            Please use a modern browser like Chrome, Firefox, or Edge.
          </p>
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm">
            <p className="font-semibold text-blue-900 mb-2">Supported Browsers:</p>
            <ul className="list-disc list-inside text-blue-800 space-y-1">
              <li>Chrome 56+ (recommended)</li>
              <li>Firefox 53+</li>
              <li>Safari 10.1+</li>
              <li>Edge 79+</li>
            </ul>
          </div>
        </div>
      </div>
    );
  }

  if (!globeReady) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-blue-900 to-purple-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-white mx-auto mb-4"></div>
          <p className="text-white text-lg">Loading 3D Globe...</p>
        </div>
      </div>
    );
  }

  return (
    <div
      className="relative w-full h-full"
      onClick={(e) => e.stopPropagation()}
      onMouseDown={(e) => e.stopPropagation()}
    >
      <Globe
        ref={globeEl}
        globeImageUrl="//unpkg.com/three-globe/example/img/earth-blue-marble.jpg"
        bumpImageUrl="//unpkg.com/three-globe/example/img/earth-topology.png"
        backgroundImageUrl="//unpkg.com/three-globe/example/img/night-sky.png"

        // Typhoon tracks (arcs)
        arcsData={typhoonArcs}
        arcColor={arc => arc.color}
        arcStroke={arc => arc.type === 'forecast' ? 0.5 : 1}
        arcDashLength={arc => arc.dashLength || 1}
        arcDashGap={arc => arc.dashGap || 0}
        arcDashAnimateTime={arc => arc.type === 'forecast' ? 3000 : 0}
        arcLabel={arc => `${arc.typhoonName} - ${arc.type} track`}

        // Typhoon current positions
        pointsData={typhoonPoints}
        pointAltitude={0.01}
        pointRadius={point => point.size}
        pointColor={point => point.color}
        pointLabel={point => `
          <div style="background: rgba(0,0,0,0.8); padding: 8px; border-radius: 4px; color: white;">
            <div style="font-size: 16px; font-weight: bold; margin-bottom: 4px;">${point.label}</div>
            <div style="font-size: 12px;">Category: ${point.category}</div>
            <div style="font-size: 12px;">Wind: ${point.windSpeed} knots</div>
            <div style="font-size: 10px; color: #fbbf24; margin-top: 4px;">Click to focus</div>
          </div>
        `}
        onPointClick={point => handleFocusTyphoon(point.typhoon)}

        // Philippine cities
        labelsData={philippineCities}
        labelLat={d => d.lat}
        labelLng={d => d.lng}
        labelText={d => d.name}
        labelSize={d => d.size}
        labelColor={d => d.color}
        labelDotRadius={0.3}
        labelAltitude={0.01}

        // Atmosphere (adaptive quality)
        atmosphereColor="#3b82f6"
        atmosphereAltitude={qualitySettings.settings.atmosphereAltitude}

        // Camera
        animateIn={true}

        // Performance (adaptive based on device)
        rendererConfig={{
          antialias: qualitySettings.settings.enableAntiAlias,
          alpha: true,
          powerPreference: isMobile ? 'low-power' : 'high-performance'
        }}
        enablePointerInteraction={true}
      />

      {/* Mobile Performance Notice */}
      {isMobile && qualitySettings.tier === 'low' && (
        <div className="absolute top-4 left-1/2 transform -translate-x-1/2 bg-yellow-500/90 text-white px-4 py-2 rounded-lg shadow-lg z-10 flex items-center gap-2 text-sm">
          <Smartphone className="w-4 h-4" />
          <span>Running in low-power mode for better battery life</span>
        </div>
      )}

      {/* Control Panel */}
      <div className="absolute top-4 right-4 flex flex-col gap-2 z-10">
        <button
          onClick={handleZoomIn}
          className="bg-white/90 hover:bg-white p-3 rounded-lg shadow-lg transition-all"
          title="Zoom In"
        >
          <ZoomIn className="w-5 h-5 text-gray-700" />
        </button>

        <button
          onClick={handleZoomOut}
          className="bg-white/90 hover:bg-white p-3 rounded-lg shadow-lg transition-all"
          title="Zoom Out"
        >
          <ZoomOut className="w-5 h-5 text-gray-700" />
        </button>

        <button
          onClick={handleReset}
          className="bg-white/90 hover:bg-white p-3 rounded-lg shadow-lg transition-all"
          title="Reset View"
        >
          <Maximize2 className="w-5 h-5 text-gray-700" />
        </button>

        <button
          onClick={() => setAutoRotate(!autoRotate)}
          className={`p-3 rounded-lg shadow-lg transition-all ${
            autoRotate
              ? 'bg-blue-500 text-white hover:bg-blue-600'
              : 'bg-white/90 hover:bg-white text-gray-700'
          }`}
          title={autoRotate ? 'Stop Rotation' : 'Auto Rotate'}
        >
          <RotateCw className={`w-5 h-5 ${autoRotate ? 'animate-spin' : ''}`} style={{ animationDuration: '8s' }} />
        </button>
      </div>

      {/* Typhoon List */}
      {typhoons.length > 0 && (
        <div className="absolute bottom-4 left-4 bg-white/95 backdrop-blur-sm rounded-lg shadow-xl p-4 max-w-xs z-10">
          <h3 className="text-sm font-bold text-gray-800 mb-2">Active Typhoons</h3>
          <div className="space-y-2">
            {typhoons.map(typhoon => (
              <button
                key={typhoon.id}
                onClick={(e) => {
                  e.stopPropagation();
                  handleFocusTyphoon(typhoon);
                }}
                onMouseDown={(e) => e.stopPropagation()}
                className={`w-full text-left p-2 rounded-lg transition-all ${
                  selectedTyphoon?.id === typhoon.id
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-100 hover:bg-gray-200 text-gray-800'
                }`}
              >
                <div className="font-semibold text-sm">{typhoon.name}</div>
                <div className="text-xs opacity-90">
                  Cat {typhoon.category} • {typhoon.current?.windSpeed} kt
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Legend */}
      <div className="absolute bottom-4 right-4 bg-white/95 backdrop-blur-sm rounded-lg shadow-xl p-4 z-10">
        <h3 className="text-xs font-bold text-gray-800 mb-2">Intensity</h3>
        <div className="space-y-1 text-xs">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-full" style={{ background: '#10b981' }}></div>
            <span>Tropical Storm</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-full" style={{ background: '#f59e0b' }}></div>
            <span>Typhoon</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-full" style={{ background: '#dc2626' }}></div>
            <span>Super Typhoon</span>
          </div>
          <div className="flex items-center gap-2 mt-2">
            <div className="w-4 h-1" style={{ background: '#ffffff' }}></div>
            <span>Forecast</span>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Get color based on wind speed intensity (in knots)
 */
function getIntensityColor(windSpeed) {
  if (windSpeed >= 130) return ['#dc2626']; // Super Typhoon - red
  if (windSpeed >= 64) return ['#f59e0b'];  // Typhoon - orange
  if (windSpeed >= 34) return ['#10b981'];  // Tropical Storm - green
  return ['#6b7280']; // Tropical Depression - gray
}
