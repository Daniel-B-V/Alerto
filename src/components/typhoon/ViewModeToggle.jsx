import { useState, useEffect } from 'react';
import { Map, Globe2 } from 'lucide-react';

/**
 * ViewModeToggle Component
 * Toggle between 2D map and 3D globe views
 * Persists preference in localStorage
 */
export function ViewModeToggle({ viewMode, onViewModeChange }) {
  const [isAnimating, setIsAnimating] = useState(false);

  // Debug logging
  useEffect(() => {
    console.log('✅ ViewModeToggle mounted! Current mode:', viewMode);
  }, [viewMode]);

  // Load saved preference on mount - but don't trigger change if already correct
  useEffect(() => {
    const savedMode = localStorage.getItem('typhoon-view-mode');
    if (savedMode && savedMode !== viewMode && onViewModeChange) {
      onViewModeChange(savedMode);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Only run on mount

  if (!viewMode) {
    console.warn('⚠️ ViewModeToggle: viewMode is', viewMode);
    return null;
  }

  const handleToggle = () => {
    setIsAnimating(true);
    const newMode = viewMode === '2d' ? '3d' : '2d';

    // Save preference
    localStorage.setItem('typhoon-view-mode', newMode);

    // Notify parent
    onViewModeChange(newMode);

    // Reset animation
    setTimeout(() => setIsAnimating(false), 600);
  };

  return (
    <div
      className="inline-flex items-center bg-white rounded-lg shadow-lg p-1 gap-1 border-2 border-blue-300"
      style={{ minWidth: '120px' }}
    >
      <button
        onClick={() => viewMode === '3d' && handleToggle()}
        className={`flex items-center gap-2 px-3 py-2 rounded-md transition-all duration-300 ${
          viewMode === '2d'
            ? 'bg-blue-500 text-white shadow-md'
            : 'text-gray-600 hover:bg-gray-100'
        } ${isAnimating && viewMode === '2d' ? 'scale-105' : ''}`}
        disabled={isAnimating}
        title="2D Map View"
      >
        <Map className="w-4 h-4" />
        <span className="font-medium text-sm whitespace-nowrap">2D</span>
      </button>

      <button
        onClick={() => viewMode === '2d' && handleToggle()}
        title="3D Globe View"
        className={`flex items-center gap-2 px-3 py-2 rounded-md transition-all duration-300 ${
          viewMode === '3d'
            ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-md'
            : 'text-gray-600 hover:bg-gray-100'
        } ${isAnimating && viewMode === '3d' ? 'scale-105' : ''}`}
        disabled={isAnimating}
      >
        <Globe2 className={`w-4 h-4 ${viewMode === '3d' ? 'animate-spin' : ''}`} style={{ animationDuration: '3s' }} />
        <span className="font-medium text-sm whitespace-nowrap">3D</span>
      </button>
    </div>
  );
}

/**
 * ViewModeInfo Component
 * Shows info about current view mode
 */
export function ViewModeInfo({ viewMode }) {
  const info = {
    '2d': {
      title: '2D Map View',
      description: 'Traditional flat map with detailed weather layers',
      features: ['Weather layers', 'Rain radar', 'Lightning detection', 'Wind visualization']
    },
    '3d': {
      title: '3D Globe View',
      description: 'Interactive rotating globe showing global perspective',
      features: ['Rotating earth', 'Typhoon paths in 3D', 'Global context', 'Immersive experience']
    }
  };

  const current = info[viewMode];

  return (
    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
      <div className="flex items-start gap-3">
        {viewMode === '2d' ? (
          <Map className="w-6 h-6 text-blue-600 flex-shrink-0 mt-0.5" />
        ) : (
          <Globe2 className="w-6 h-6 text-purple-600 flex-shrink-0 mt-0.5" />
        )}

        <div className="flex-1">
          <h3 className="font-semibold text-gray-900 mb-1">{current.title}</h3>
          <p className="text-sm text-gray-600 mb-2">{current.description}</p>

          <div className="flex flex-wrap gap-2">
            {current.features.map((feature, index) => (
              <span
                key={index}
                className="inline-flex items-center px-2 py-1 rounded-md bg-white text-xs font-medium text-gray-700 border border-gray-200"
              >
                {feature}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * ViewModeHeader Component
 * Header with view toggle for typhoon tracker
 */
export function ViewModeHeader({ viewMode, onViewModeChange, title, subtitle }) {
  return (
    <div className="flex items-center justify-between mb-4 flex-wrap gap-4">
      <div className="flex-1">
        <h2 className="text-2xl font-bold text-gray-900">{title || 'Typhoon Tracker'}</h2>
        {subtitle && <p className="text-sm text-gray-600 mt-1">{subtitle}</p>}
      </div>

      <ViewModeToggle viewMode={viewMode} onViewModeChange={onViewModeChange} />
    </div>
  );
}
