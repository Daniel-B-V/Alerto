# Typhoon Test Data Guide

## Overview

Since there are currently no active typhoons, we've implemented a **Test Data Mode** that generates realistic synthetic typhoon data for testing and demonstration purposes.

## How to Use Test Data

### Option 1: Using the UI Button (Recommended)

1. **Open your Analytics page** at `http://localhost:3000`
2. **Navigate to the Typhoon Tracker** section (at the top of the Analytics page)
3. **Click the "Use Test Data" button** in the header (gray button next to the Refresh button)
4. The system will immediately load 3 synthetic typhoons with realistic tracks and forecasts

### Visual Indicators When in Test Mode:

- **"TEST MODE" badge** appears next to the title (yellow badge with test tube icon)
- **"Use Test Data" button turns yellow** when active
- **Data source info box changes to yellow** with warning message
- **"⚠️ This is NOT real typhoon data!"** warning displayed

### Option 2: Using the API Directly

You can also access the test data via the API:

```bash
# Get test typhoon data
curl http://localhost:5000/api/typhoon/test-data
```

## Synthetic Test Typhoons

The system generates **3 realistic typhoons**:

### 1. Super Typhoon MAWAR
- **Category**: 5 (Super Typhoon)
- **Location**: 15.5°N, 128.0°E (East of Philippines)
- **Wind Speed**: ~305 km/h (165 knots)
- **Pressure**: 920 mb
- **Movement**: West-Northwest
- **Status**: Approaching from the east
- **Color**: Dark Red 🔴

### 2. Tropical Storm GONI
- **Category**: Tropical Storm
- **Location**: 18.2°N, 122.5°E (Near Luzon)
- **Wind Speed**: ~102 km/h (55 knots)
- **Pressure**: 990 mb
- **Movement**: West
- **Status**: Near northern Philippines
- **Color**: Green 🟢

### 3. Typhoon HAIYAN
- **Category**: 4 (Typhoon)
- **Location**: 11.0°N, 124.5°E (Southern Philippines)
- **Wind Speed**: ~259 km/h (140 knots)
- **Pressure**: 940 mb
- **Movement**: Northwest
- **Status**: Over southern Philippines
- **Color**: Red 🔴

## Features in Test Mode

All features work exactly the same as with real data:

### Map Features:
- ✅ Interactive markers showing current position
- ✅ Historical track lines (solid lines)
- ✅ Forecast path lines (dashed lines)
- ✅ Wind radius circles
- ✅ Clickable markers with detailed popups
- ✅ Zoom and pan controls

### Storm Details Panel:
- ✅ Current position and coordinates
- ✅ Wind speed and pressure
- ✅ Movement direction and speed
- ✅ Forecast timeline (next 12-72 hours)
- ✅ Proximity warnings for Philippines

### Data Characteristics:
- **Historical Track**: 10 past observations at 6-hour intervals
- **Forecast Track**: Up to 6 forecast points at 12-hour intervals
- **Realistic Data**: Wind speeds, pressures, and movements follow real storm patterns
- **Near Philippines**: All test storms are positioned to affect the Philippines

## Switching Back to Real Data

To return to real typhoon data:

1. Click the **"Using Test Data"** button (now yellow)
2. Button returns to gray **"Use Test Data"**
3. System loads real data from NOAA ATCF
4. TEST MODE badge disappears
5. Data source box returns to blue

## API Endpoints

### Get Real Typhoon Data
```bash
# All active Western Pacific typhoons
GET /api/typhoon/active

# Typhoons near Philippines only
GET /api/typhoon/philippines
```

### Get Test Data
```bash
# Synthetic test typhoons
GET /api/typhoon/test-data
```

Response format (test data):
```json
{
  "success": true,
  "count": 3,
  "data": [
    {
      "id": "wptesttest012025",
      "name": "MAWAR",
      "year": 2025,
      "basin": "WP",
      "current": {
        "lat": 15.5,
        "lon": 128.0,
        "windSpeed": 305,
        "windSpeedKnots": 165,
        "pressure": 920,
        "category": 5,
        "categoryName": "Super Typhoon",
        "categoryColor": "#8b0000",
        "timestamp": "2025-11-14T09:00:00.000Z"
      },
      "track": [...],
      "forecast": [...],
      "isNearPhilippines": true,
      "isTestData": true
    },
    // ... 2 more typhoons
  ],
  "timestamp": "2025-11-14T09:00:00.000Z",
  "isTestData": true,
  "message": "⚠️ This is synthetic test data for demonstration purposes only"
}
```

## Use Cases for Test Data

### 1. **Development & Testing**
- Test UI components without waiting for real storms
- Verify map rendering with multiple typhoons
- Test data refresh functionality
- Debug visualization issues

### 2. **Demonstrations & Presentations**
- Show the system's capabilities to stakeholders
- Demo during typhoon off-season
- Training and onboarding new users
- Screenshots and documentation

### 3. **Feature Development**
- Test new features with consistent data
- Performance testing with multiple storms
- UI/UX improvements
- Mobile responsiveness testing

## Important Notes

⚠️ **Warning**: Test data is clearly marked and should NEVER be confused with real typhoon data!

- Test data includes **10 historical track points** and **6 forecast points**
- All timestamps are dynamically generated based on current time
- Storm positions update relative to "now" when you load test data
- Movement calculations and forecasts follow realistic patterns
- Test storms are positioned to demonstrate different scenarios:
  - Approaching storm (MAWAR)
  - Storm near landfall (GONI)
  - Storm over land (HAIYAN)

## Technical Implementation

### Backend
- **File**: `backend/services/typhoonTestData.js`
- **Function**: `generateTestTyphoons()`
- **Endpoint**: `GET /api/typhoon/test-data`

### Frontend
- **Service**: `src/services/typhoonService.js` - `getTestTyphoons()`
- **Component**: `src/components/typhoon/TyphoonTracker.jsx`
- **State**: `useTestData` and `isTestDataMode`

### Data Generation
```javascript
// Each typhoon is generated with:
- id: Unique identifier (wptestXXX2025)
- name: Storm name
- category: 0-5 (TD, TS, Cat 1-5)
- centerLat/centerLon: Current position
- windSpeed: In knots
- pressure: In millibars
- movement: Direction vector
- trackLength: Number of historical points (10)
- forecastLength: Number of forecast points (6)
```

## Troubleshooting

### Test Data Button Not Appearing
- Check if frontend is running: `http://localhost:3000`
- Check browser console for errors
- Verify TyphoonTracker component is loaded

### Test Data Not Loading
- Verify backend is running: `http://localhost:5000`
- Check backend console for errors
- Test endpoint directly: `curl http://localhost:5000/api/typhoon/test-data`
- Check network tab in browser dev tools

### Map Not Displaying Test Storms
- Check browser console for errors
- Verify Leaflet CSS is loaded
- Clear browser cache
- Check if markers are rendered (inspect element)

## Future Enhancements

Potential improvements for test data:

1. **More Test Scenarios**
   - Storm making landfall
   - Storm dissipating
   - Multiple storms interacting
   - Storm changing intensity rapidly

2. **Customizable Test Data**
   - User-defined storm positions
   - Adjustable intensity
   - Custom storm paths
   - Historical storm replay

3. **Seasonal Variations**
   - Different monsoon patterns
   - Various approach angles
   - Different time of day scenarios

4. **Advanced Features**
   - Storm surge predictions
   - Rainfall forecasts
   - Wind field visualization
   - Impact assessments

## Additional Resources

- NOAA ATCF Documentation: https://www.nrlmry.navy.mil/atcf_web/docs/database/new/database.html
- Saffir-Simpson Scale: https://www.nhc.noaa.gov/aboutsshws.php
- PAGASA: https://www.pagasa.dost.gov.ph/

---

**Remember**: Always switch back to real data for production use and actual weather monitoring! Test data is for development and demonstration only.
