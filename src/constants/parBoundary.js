/**
 * Philippine Area of Responsibility (PAR) Boundary
 * This is the area where PAGASA monitors and issues tropical cyclone bulletins
 */

// PAR boundary coordinates (clockwise from northwest corner)
export const PAR_BOUNDARY = [
  [25, 120],    // Northwest corner
  [25, 135],    // Northeast corner
  [5, 135],     // Southeast corner
  [5, 115],     // Southwest corner (adjusted for Philippines)
  [15, 115],    // West side mid point
  [21, 120],    // Northwest side
  [25, 120]     // Close polygon
];

// More accurate PAR boundary following PAGASA's definition
export const PAR_BOUNDARY_ACCURATE = [
  // Northern boundary
  [25, 120],
  [25, 135],
  // Eastern boundary
  [5, 135],
  // Southern boundary
  [5, 120],
  [5, 115],
  // Western boundary
  [15, 115],
  [21, 120],
  // Close polygon
  [25, 120]
];

// PAR style configuration
export const PAR_STYLE = {
  color: '#3b82f6',           // Blue color
  weight: 3,                  // Border thickness
  opacity: 0.8,               // Border opacity
  fillColor: '#3b82f6',       // Fill color
  fillOpacity: 0.05,          // Very light fill
  dashArray: '10, 5',         // Dashed line pattern
};

export default {
  PAR_BOUNDARY,
  PAR_BOUNDARY_ACCURATE,
  PAR_STYLE
};
