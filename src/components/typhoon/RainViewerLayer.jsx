import { useEffect, useRef, useState } from 'react';
import { useMap } from 'react-leaflet';
import L from 'leaflet';
import { getLatestRainRadar, getRainTileUrl } from '../../services/rainViewerService';

/**
 * RainViewerLayer Component
 * Displays animated rain radar overlay using RainViewer API
 */
export function RainViewerLayer({ active = false }) {
  const map = useMap();
  const layerRef = useRef(null);
  const [frames, setFrames] = useState([]);
  const [currentFrameIndex, setCurrentFrameIndex] = useState(0);
  const animationRef = useRef(null);
  const hostRef = useRef('');

  // Fetch rain radar data
  useEffect(() => {
    if (!active) return;

    const fetchRainData = async () => {
      try {
        const radarData = await getLatestRainRadar();
        hostRef.current = radarData.host;

        // Combine past and forecast frames for animation
        const allFrames = [...radarData.frames, ...radarData.nowcast];
        setFrames(allFrames);
        setCurrentFrameIndex(allFrames.length - 1); // Start with most recent
      } catch (error) {
        console.error('Failed to fetch rain radar data:', error);
      }
    };

    fetchRainData();

    // Refresh data every 10 minutes
    const interval = setInterval(fetchRainData, 10 * 60 * 1000);

    return () => clearInterval(interval);
  }, [active]);

  // Add/remove layer from map
  useEffect(() => {
    if (!active || frames.length === 0) {
      if (layerRef.current) {
        map.removeLayer(layerRef.current);
        layerRef.current = null;
      }
      return;
    }

    // Create tile layer for current frame
    const currentFrame = frames[currentFrameIndex];
    if (!currentFrame || !hostRef.current) return;

    // Remove previous layer with smooth transition
    const previousLayer = layerRef.current;
    if (previousLayer) {
      // Fade out previous layer
      setTimeout(() => {
        if (map.hasLayer(previousLayer)) {
          map.removeLayer(previousLayer);
        }
      }, 100);
    }

    // Create new layer with current frame
    const tileUrl = `${hostRef.current}${currentFrame.path}/256/{z}/{x}/{y}/2/1_1.png`;

    const newLayer = L.tileLayer(tileUrl, {
      opacity: 0.5,
      zIndex: 500,
      attribution: '&copy; <a href="https://www.rainviewer.com">RainViewer</a>'
    });

    newLayer.addTo(map);
    layerRef.current = newLayer;

    return () => {
      if (layerRef.current) {
        map.removeLayer(layerRef.current);
      }
    };
  }, [active, frames, currentFrameIndex, map]);

  // Animation loop - slower speed
  useEffect(() => {
    if (!active || frames.length === 0) {
      if (animationRef.current) {
        clearInterval(animationRef.current);
      }
      return;
    }

    // Animate through frames at a slower pace
    animationRef.current = setInterval(() => {
      setCurrentFrameIndex((prevIndex) => {
        return (prevIndex + 1) % frames.length;
      });
    }, 2500); // Change frame every 2.5 seconds - much slower and smoother

    return () => {
      if (animationRef.current) {
        clearInterval(animationRef.current);
      }
    };
  }, [active, frames.length]);

  return null; // This is a non-visual component
}

export default RainViewerLayer;
