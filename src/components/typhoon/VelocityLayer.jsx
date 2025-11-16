import { useEffect, useRef } from 'react';
import { useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet-velocity/dist/leaflet-velocity.css';
import 'leaflet-velocity';
import { getSampleWindData } from '../../services/windDataService';

/**
 * VelocityLayer Component
 * Displays animated wind flow using leaflet-velocity
 */
export function VelocityLayer({ active = false }) {
  const map = useMap();
  const layerRef = useRef(null);
  const windDataRef = useRef(null);

  // Fetch wind data once on mount
  useEffect(() => {
    const fetchWindData = async () => {
      try {
        const data = await getSampleWindData();
        windDataRef.current = data;
      } catch (error) {
        console.error('Failed to fetch wind data:', error);
      }
    };

    fetchWindData();
  }, []);

  // Add/remove velocity layer from map
  useEffect(() => {
    if (!active || !windDataRef.current) {
      if (layerRef.current) {
        map.removeLayer(layerRef.current);
        layerRef.current = null;
      }
      return;
    }

    // Create velocity layer
    const velocityLayer = L.velocityLayer({
      displayValues: true,
      displayOptions: {
        velocityType: 'Wind',
        position: 'bottomleft',
        emptyString: 'No wind data',
        angleConvention: 'bearingCW',
        displayPosition: 'bottomleft',
        displayEmptyString: 'No wind data',
        speedUnit: 'kt', // knots
      },
      data: windDataRef.current,
      maxVelocity: 15, // Maximum velocity for color scale
      velocityScale: 0.01, // Modifier for particle animations
      colorScale: [
        '#3288bd',
        '#66c2a5',
        '#abdda4',
        '#e6f598',
        '#fee08b',
        '#fdae61',
        '#f46d43',
        '#d53e4f'
      ],
      opacity: 0.97,
      // Particle animation settings
      particleAge: 64,
      lineWidth: 2,
      particleMultiplier: 1 / 300,
    });

    layerRef.current = velocityLayer;
    velocityLayer.addTo(map);

    return () => {
      if (layerRef.current) {
        map.removeLayer(layerRef.current);
        layerRef.current = null;
      }
    };
  }, [active, map]);

  return null; // This is a non-visual component
}

export default VelocityLayer;
