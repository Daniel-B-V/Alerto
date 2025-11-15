import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { getUserCity } from '../utils/permissions';

// Major Batangas cities with coordinates (for matching)
const BATANGAS_CITIES = [
  { name: 'Batangas City', lat: 13.7565, lon: 121.0583 },
  { name: 'Lipa City', lat: 13.9411, lon: 121.1624 },
  { name: 'Tanauan City', lat: 14.0833, lon: 121.1500 },
  { name: 'Santo Tomas', lat: 14.1078, lon: 121.1414 },
  // San Pablo and Calamba removed - they're in Laguna province, not Batangas
  { name: 'Taal', lat: 13.8833, lon: 120.9333 },
  { name: 'Lemery', lat: 13.9167, lon: 120.8833 },
  { name: 'Balayan', lat: 13.9333, lon: 120.7333 },
  { name: 'Bauan', lat: 13.7906, lon: 121.0097 },
  { name: 'Mabini', lat: 13.7247, lon: 120.9039 },
  { name: 'San Juan', lat: 13.8408, lon: 121.3919 },
  { name: 'Rosario', lat: 13.8481, lon: 121.2033 },
  { name: 'Taysan', lat: 13.7628, lon: 121.2122 },
  { name: 'Lobo', lat: 13.6608, lon: 121.2408 },
  { name: 'Nasugbu', lat: 14.0667, lon: 120.6333 },
  { name: 'Talisay', lat: 14.1050, lon: 121.0161 },
  { name: 'Calatagan', lat: 13.8325, lon: 120.6322 },
  { name: 'Lian', lat: 14.0333, lon: 120.6500 },
  { name: 'Mataas na Kahoy', lat: 13.9706, lon: 121.0650 },
  { name: 'Agoncillo', lat: 13.9333, lon: 120.9333 },
  { name: 'Alitagtag', lat: 13.8700, lon: 121.0036 },
  { name: 'Cuenca', lat: 13.9089, lon: 121.0508 },
  { name: 'Ibaan', lat: 13.8167, lon: 121.1333 },
  { name: 'Laurel', lat: 14.0500, lon: 120.9000 },
  { name: 'Malvar', lat: 14.0444, lon: 121.1583 },
  { name: 'San Nicolas', lat: 13.9139, lon: 121.0706 },
  { name: 'Santa Teresita', lat: 13.8167, lon: 121.3833 },
  { name: 'Sto. Tomas', lat: 14.1078, lon: 121.1414 },
  { name: 'Tingloy', lat: 13.6500, lon: 120.8833 },
  { name: 'Padre Garcia', lat: 13.8778, lon: 121.2167 }
];

// Calculate distance between two coordinates (Haversine formula)
const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371; // Earth's radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

// Find nearest Batangas city to given coordinates
const findNearestCity = (lat, lon) => {
  let nearestCity = BATANGAS_CITIES[0];
  let minDistance = calculateDistance(lat, lon, nearestCity.lat, nearestCity.lon);

  BATANGAS_CITIES.forEach(city => {
    const distance = calculateDistance(lat, lon, city.lat, city.lon);
    if (distance < minDistance) {
      minDistance = distance;
      nearestCity = city;
    }
  });

  return nearestCity.name;
};

/**
 * Custom hook to detect user's location for dashboard weather display
 *
 * Returns:
 * - detectedCity: The detected or assigned city name
 * - isLoading: Whether location detection is in progress
 * - error: Any error that occurred during detection
 * - isAutoDetected: Whether the city was auto-detected (vs fallback)
 * - requestLocation: Function to manually request location again
 */
export const useUserLocation = () => {
  const { user } = useAuth();
  const [detectedCity, setDetectedCity] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isAutoDetected, setIsAutoDetected] = useState(false);

  const detectLocation = (clearCache = false) => {
    // Clear cache if requested (manual detection)
    if (clearCache) {
      console.log('🗑️ Clearing location cache...');
      localStorage.removeItem('alerto_last_detected_city');
      localStorage.removeItem('alerto_detection_timestamp');
    }

    // Check if geolocation is available
    if (!navigator.geolocation) {
      console.warn('⚠️ Geolocation not supported by browser');
      useFallback();
      return;
    }

    console.log('🔍 Requesting location permission...');
    setIsLoading(true);
    setError(null);

    // Try to get user's coordinates
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        console.log('✅ Location detected!');
        console.log('📍 Coordinates:', { lat: latitude.toFixed(4), lon: longitude.toFixed(4) });

        // Find nearest Batangas city
        const nearestCity = findNearestCity(latitude, longitude);

        // Calculate distance to show how far user is from detected city
        const cityCoords = BATANGAS_CITIES.find(c => c.name === nearestCity);
        const distance = calculateDistance(latitude, longitude, cityCoords.lat, cityCoords.lon);

        console.log('🏙️ Nearest Batangas city:', nearestCity, `(${distance.toFixed(1)} km away)`);

        setDetectedCity(nearestCity);
        setIsAutoDetected(true);
        setIsLoading(false);

        // Cache the result
        localStorage.setItem('alerto_last_detected_city', nearestCity);
        localStorage.setItem('alerto_detection_timestamp', Date.now().toString());
      },
      (err) => {
        console.error('❌ Geolocation error:', err.message);
        console.log('Possible reasons:', {
          'PERMISSION_DENIED': 'User denied location access',
          'POSITION_UNAVAILABLE': 'Location information unavailable',
          'TIMEOUT': 'Location request timed out'
        }[err.code] || 'Unknown error');
        setError(err.message);
        useFallback();
      },
      {
        enableHighAccuracy: true, // Use GPS for better accuracy
        timeout: 10000, // 10 second timeout
        maximumAge: 0 // Don't use cached GPS position - get fresh location
      }
    );
  };

  const useFallback = () => {
    // Fallback strategy:
    // 1. Check localStorage for recently detected city
    // 2. Use user's assigned city (if mayor)
    // 3. Default to "Batangas City"

    const cachedCity = localStorage.getItem('alerto_last_detected_city');
    const cacheTimestamp = localStorage.getItem('alerto_detection_timestamp');
    const ONE_DAY = 24 * 60 * 60 * 1000;

    // Use cached city if it's less than 1 day old
    if (cachedCity && cacheTimestamp && (Date.now() - parseInt(cacheTimestamp)) < ONE_DAY) {
      console.log('🗄️ Using cached city:', cachedCity);
      setDetectedCity(cachedCity);
      setIsAutoDetected(false);
      setIsLoading(false);
      return;
    }

    // Use user's assigned city if they're a mayor
    const assignedCity = getUserCity(user);
    if (assignedCity) {
      console.log('🏛️ Using mayor assigned city:', assignedCity);
      setDetectedCity(assignedCity);
      setIsAutoDetected(false);
      setIsLoading(false);
      return;
    }

    // Default to Batangas City
    console.log('🏙️ Using default city: Batangas City');
    setDetectedCity('Batangas City');
    setIsAutoDetected(false);
    setIsLoading(false);
  };

  // Auto-detect on mount
  useEffect(() => {
    detectLocation();
  }, [user]); // Re-detect if user changes

  // Function to manually trigger location detection again
  const requestLocation = () => {
    console.log('🔄 Manual location detection requested');
    detectLocation(true); // Clear cache when manually detecting
  };

  return {
    detectedCity,
    isLoading,
    error,
    isAutoDetected,
    requestLocation
  };
};

export default useUserLocation;
