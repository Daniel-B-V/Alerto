/**
 * Major Philippine Cities and Locations
 * Used for map markers and location reference
 */

export const MAJOR_CITIES = [
  // National Capital Region
  {
    name: 'Manila',
    region: 'NCR',
    lat: 14.5995,
    lon: 120.9842,
    population: 1780148,
    type: 'capital'
  },
  {
    name: 'Quezon City',
    region: 'NCR',
    lat: 14.6760,
    lon: 121.0437,
    population: 2960048,
    type: 'major'
  },

  // Luzon
  {
    name: 'Baguio',
    region: 'CAR',
    lat: 16.4023,
    lon: 120.5960,
    population: 366358,
    type: 'major'
  },
  {
    name: 'Laoag',
    region: 'Region I',
    lat: 18.1987,
    lon: 120.5937,
    population: 111651,
    type: 'city'
  },
  {
    name: 'Tuguegarao',
    region: 'Region II',
    lat: 17.6132,
    lon: 121.7270,
    population: 166334,
    type: 'city'
  },
  {
    name: 'Angeles',
    region: 'Region III',
    lat: 15.1450,
    lon: 120.5887,
    population: 411634,
    type: 'major'
  },
  {
    name: 'Naga',
    region: 'Region V',
    lat: 13.6192,
    lon: 123.1814,
    population: 209170,
    type: 'city'
  },
  {
    name: 'Legazpi',
    region: 'Region V',
    lat: 13.1391,
    lon: 123.7436,
    population: 209533,
    type: 'city'
  },

  // Visayas
  {
    name: 'Cebu City',
    region: 'Region VII',
    lat: 10.3157,
    lon: 123.8854,
    population: 964169,
    type: 'major'
  },
  {
    name: 'Iloilo City',
    region: 'Region VI',
    lat: 10.7202,
    lon: 122.5621,
    population: 457626,
    type: 'major'
  },
  {
    name: 'Bacolod',
    region: 'Region VI',
    lat: 10.6770,
    lon: 122.9500,
    population: 600783,
    type: 'major'
  },
  {
    name: 'Tacloban',
    region: 'Region VIII',
    lat: 11.2447,
    lon: 125.0036,
    population: 251881,
    type: 'city'
  },

  // Mindanao
  {
    name: 'Davao City',
    region: 'Region XI',
    lat: 7.0731,
    lon: 125.6128,
    population: 1776949,
    type: 'major'
  },
  {
    name: 'Cagayan de Oro',
    region: 'Region X',
    lat: 8.4542,
    lon: 124.6319,
    population: 728402,
    type: 'major'
  },
  {
    name: 'Zamboanga',
    region: 'Region IX',
    lat: 6.9214,
    lon: 122.0790,
    population: 977234,
    type: 'major'
  },
  {
    name: 'General Santos',
    region: 'Region XII',
    lat: 6.1164,
    lon: 125.1716,
    population: 697315,
    type: 'city'
  },
  {
    name: 'Butuan',
    region: 'Caraga',
    lat: 8.9475,
    lon: 125.5406,
    population: 372910,
    type: 'city'
  },

  // Palawan
  {
    name: 'Puerto Princesa',
    region: 'MIMAROPA',
    lat: 9.7392,
    lon: 118.7353,
    population: 307079,
    type: 'city'
  }
];

// City marker colors by type
export const CITY_MARKER_COLORS = {
  capital: '#ef4444',    // Red for capital
  major: '#3b82f6',      // Blue for major cities
  city: '#6b7280'        // Gray for regular cities
};

// City marker sizes by type
export const CITY_MARKER_SIZES = {
  capital: 8,
  major: 6,
  city: 4
};

export default {
  MAJOR_CITIES,
  CITY_MARKER_COLORS,
  CITY_MARKER_SIZES
};
