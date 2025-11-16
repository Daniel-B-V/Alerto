import { CircleMarker, Popup } from 'react-leaflet';
import { MAJOR_CITIES, CITY_MARKER_COLORS, CITY_MARKER_SIZES } from '../../constants/philippineCities';

/**
 * CitiesLayer Component
 * Displays major Philippine cities on the map
 */
export function CitiesLayer({ visible = true }) {
  if (!visible) return null;

  return (
    <>
      {MAJOR_CITIES.map((city) => (
        <CircleMarker
          key={city.name}
          center={[city.lat, city.lon]}
          radius={CITY_MARKER_SIZES[city.type]}
          fillColor={CITY_MARKER_COLORS[city.type]}
          fillOpacity={0.8}
          color="white"
          weight={2}
          opacity={1}
        >
          <Popup>
            <div className="text-sm min-w-[150px]">
              <h3 className="font-bold text-base mb-1">{city.name}</h3>
              <div className="space-y-1 text-xs">
                <div className="flex justify-between">
                  <span className="text-gray-600">Region:</span>
                  <span className="font-semibold">{city.region}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Population:</span>
                  <span className="font-semibold">{city.population.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Coordinates:</span>
                  <span className="font-mono text-xs">{city.lat.toFixed(2)}°N, {city.lon.toFixed(2)}°E</span>
                </div>
                {city.type === 'capital' && (
                  <div className="mt-2 pt-2 border-t border-gray-200">
                    <span className="px-2 py-1 bg-red-100 text-red-700 rounded text-xs font-semibold">
                      National Capital
                    </span>
                  </div>
                )}
              </div>
            </div>
          </Popup>
        </CircleMarker>
      ))}
    </>
  );
}

export default CitiesLayer;
