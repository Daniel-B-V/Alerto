import { useState, useRef, useEffect } from 'react';
import { useMap } from 'react-leaflet';
import { Search, X, MapPin } from 'lucide-react';
import { MAJOR_CITIES } from '../../constants/philippineCities';

/**
 * LocationSearch Component
 * Provides search functionality to find and navigate to cities
 */
export function LocationSearch() {
  const map = useMap();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [showResults, setShowResults] = useState(false);
  const searchRef = useRef(null);

  // Handle search input change
  const handleSearchChange = (e) => {
    const query = e.target.value;
    setSearchQuery(query);

    if (query.trim().length === 0) {
      setSearchResults([]);
      setShowResults(false);
      return;
    }

    // Filter cities based on search query
    const results = MAJOR_CITIES.filter(city =>
      city.name.toLowerCase().includes(query.toLowerCase()) ||
      city.region.toLowerCase().includes(query.toLowerCase())
    ).slice(0, 5); // Limit to 5 results

    setSearchResults(results);
    setShowResults(true);
  };

  // Handle city selection
  const handleCitySelect = (city) => {
    // Fly to the selected city
    map.flyTo([city.lat, city.lon], 10, {
      duration: 1.5,
      easeLinearity: 0.5
    });

    // Clear search
    setSearchQuery('');
    setSearchResults([]);
    setShowResults(false);
  };

  // Clear search
  const handleClearSearch = () => {
    setSearchQuery('');
    setSearchResults([]);
    setShowResults(false);
  };

  // Close results when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setShowResults(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div ref={searchRef} className="relative w-full max-w-md">
      {/* Search Input */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
        <input
          type="text"
          value={searchQuery}
          onChange={handleSearchChange}
          onFocus={() => searchResults.length > 0 && setShowResults(true)}
          placeholder="Search cities or regions..."
          className="w-full pl-10 pr-10 py-2.5 bg-white border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
        />
        {searchQuery && (
          <button
            onClick={handleClearSearch}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Search Results Dropdown */}
      {showResults && searchResults.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-200 rounded-lg shadow-lg max-h-64 overflow-y-auto z-50">
          {searchResults.map((city, index) => (
            <button
              key={`${city.name}-${index}`}
              onClick={() => handleCitySelect(city)}
              className="w-full px-4 py-3 text-left hover:bg-blue-50 transition-colors border-b border-gray-100 last:border-b-0"
            >
              <div className="flex items-start gap-3">
                <MapPin className="w-5 h-5 text-blue-500 mt-0.5 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-gray-900 text-sm">{city.name}</div>
                  <div className="text-xs text-gray-600 mt-0.5">
                    {city.region} • {city.population.toLocaleString()} population
                  </div>
                  <div className="text-xs text-gray-500 mt-0.5 font-mono">
                    {city.lat.toFixed(2)}°N, {city.lon.toFixed(2)}°E
                  </div>
                </div>
              </div>
            </button>
          ))}
        </div>
      )}

      {/* No Results */}
      {showResults && searchQuery.trim().length > 0 && searchResults.length === 0 && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-200 rounded-lg shadow-lg p-4 z-50">
          <div className="text-center text-gray-500 text-sm">
            No cities found matching "{searchQuery}"
          </div>
        </div>
      )}
    </div>
  );
}

export default LocationSearch;
