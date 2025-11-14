# Real-Time Typhoon Tracker Implementation

## Overview

A complete real-time typhoon/tropical cyclone visualization module for the Philippines, integrated into the Alerto analytics dashboard. The system displays storm positions, historical tracks, forecast paths, and detailed storm information.

## Features Implemented

### Core Features
- **Interactive Map**: Leaflet.js-based map centered on the Philippines
- **Current Typhoon Position**: Custom colored markers based on storm category
- **Historical Track**: Solid lines showing past storm positions
- **Forecast Track**: Dashed lines showing predicted path
- **Wind Radii**: Translucent circles showing wind coverage area
- **Storm Details Panel**: Comprehensive text information for each storm
- **Auto-Refresh**: Updates every 10 minutes automatically
- **Mobile-Friendly**: Responsive design for all screen sizes

### Storm Information Displayed
- Storm name and category (Tropical Depression, Tropical Storm, Typhoon, Super Typhoon)
- Current coordinates (latitude, longitude)
- Maximum sustained winds (km/h and knots)
- Central pressure (mb)
- Movement speed and direction
- Forecast positions (+12h, +24h, +48h, etc.)
- Last updated timestamp
- Proximity warnings for Philippines

## Data Source

**NOAA ATCF (Automated Tropical Cyclone Forecasting System)**
- Source: `https://ftp.nhc.noaa.gov/atcf/`
- Coverage: Western Pacific Basin (Philippines region)
- Update Frequency: Every 6 hours (official)
- Cache Duration: 10 minutes (our system)
- Format: Best track (b-deck) data

### Why ATCF?
- 100% FREE - No API key required
- Official US Navy/NOAA data
- Includes both historical and forecast data
- Reliable and well-documented format
- Global coverage for all basins

## Technical Architecture

### Backend (`/backend`)

#### 1. Typhoon Service (`/backend/services/typhoonService.js`)
- Fetches ATCF data from NOAA FTP mirror
- Parses b-deck format (comma-delimited text)
- Converts to JSON format
- Caches data for 10 minutes
- Filters for Philippines region (5-25°N, 115-135°E)

#### 2. API Routes (`/backend/routes/typhoon.js`)
Endpoints:
- `GET /api/typhoon/active` - Get all active Western Pacific typhoons
- `GET /api/typhoon/philippines` - Get typhoons near Philippines only
- `GET /api/typhoon/:id` - Get detailed info for specific typhoon
- `POST /api/typhoon/clear-cache` - Clear cache (testing)

### Frontend (`/src`)

#### 1. Typhoon Service (`/src/services/typhoonService.js`)
Frontend API client for fetching typhoon data

#### 2. Components (`/src/components/typhoon/`)

**TyphoonMap.jsx**
- Interactive Leaflet map
- Custom typhoon markers with category colors
- Historical track polylines (solid)
- Forecast track polylines (dashed)
- Wind radius circles
- Clickable markers with popups

**StormDetailsPanel.jsx**
- Detailed storm information cards
- Current conditions display
- Forecast timeline
- Movement calculations
- Landfall warnings
- Mobile-optimized layout

**TyphoonTracker.jsx**
- Main container component
- Auto-refresh logic (10 min interval)
- Loading/error states
- Manual refresh button
- Data source information
- Map legend

## File Structure

```
Alerto/
├── backend/
│   ├── services/
│   │   └── typhoonService.js       (ATCF data parser)
│   ├── routes/
│   │   └── typhoon.js              (API endpoints)
│   └── server.js                    (Updated with typhoon routes)
│
├── src/
│   ├── services/
│   │   └── typhoonService.js       (Frontend API client)
│   │
│   ├── components/
│   │   ├── typhoon/
│   │   │   ├── TyphoonMap.jsx      (Leaflet map component)
│   │   │   ├── StormDetailsPanel.jsx (Storm info cards)
│   │   │   └── TyphoonTracker.jsx  (Main container)
│   │   │
│   │   └── analytics/
│   │       └── AnalyticsPanel.jsx  (Updated with typhoon tracker)
│   │
│   └── main.jsx                     (Added Leaflet CSS import)
│
└── package.json                     (Added leaflet dependencies)
```

## Dependencies Added

### Frontend
```json
{
  "leaflet": "^1.9.4",
  "react-leaflet": "^4.2.1",
  "axios": "^1.6.2"
}
```

### Backend
```json
{
  "axios": "^1.6.2" // Already existed
}
```

## Usage

### Starting the Application

1. **Install Dependencies** (if not already done):
```bash
cd Alerto
npm install

cd backend
npm install
```

2. **Start Backend**:
```bash
cd Alerto/backend
npm start
# Backend runs on http://localhost:5000
```

3. **Start Frontend**:
```bash
cd Alerto
npm run dev
# Frontend runs on http://localhost:3000
```

4. **Access Typhoon Tracker**:
- Navigate to the Analytics page in your app
- Typhoon tracker is displayed at the top of the page

### Environment Variables

Make sure your `.env` file has:
```env
VITE_BACKEND_URL=http://localhost:5000
```

## Map Legend

| Symbol | Meaning |
|--------|---------|
| 🔴 Red Circle | Super Typhoon (Cat 4-5) |
| 🟠 Orange Circle | Typhoon (Cat 1-3) |
| 🟡 Yellow Circle | Tropical Storm |
| 🔵 Cyan Circle | Tropical Depression |
| ─────── Solid Line | Historical Track |
| - - - - Dashed Line | Forecast Path |
| ⚪ Transparent Circle | Wind Radius |
| ⚠️ Alert Badge | Near Philippines |

## Storm Categories (Saffir-Simpson Scale)

| Category | Wind Speed (mph) | Wind Speed (km/h) |
|----------|------------------|-------------------|
| Super Typhoon (5) | 157+ | 252+ |
| Typhoon (4) | 130-156 | 209-251 |
| Typhoon (3) | 111-129 | 179-208 |
| Typhoon (2) | 96-110 | 154-178 |
| Typhoon (1) | 74-95 | 119-153 |
| Tropical Storm | 39-73 | 63-118 |
| Tropical Depression | <39 | <63 |

## API Response Format

### GET /api/typhoon/philippines

```json
{
  "success": true,
  "count": 1,
  "data": [
    {
      "id": "wp012025",
      "name": "HAIKUI",
      "year": 2025,
      "basin": "WP",
      "current": {
        "lat": 14.5,
        "lon": 125.3,
        "windSpeed": 150,
        "windSpeedKnots": 81,
        "pressure": 960,
        "category": 3,
        "categoryName": "Typhoon",
        "categoryColor": "#ff8c00",
        "timestamp": "2025-11-14T12:00:00Z"
      },
      "track": [
        {
          "lat": 13.2,
          "lon": 127.5,
          "windSpeed": 120,
          "windSpeedKmh": 120,
          "pressure": 980,
          "timestamp": "2025-11-13T12:00:00Z",
          "type": "TS"
        }
      ],
      "forecast": [
        {
          "lat": 15.2,
          "lon": 124.1,
          "windSpeed": 140,
          "windSpeedKmh": 140,
          "pressure": 965,
          "forecastHour": 12,
          "timestamp": "2025-11-15T00:00:00Z"
        }
      ],
      "lastUpdate": "2025-11-14T12:00:00Z",
      "isNearPhilippines": true
    }
  ],
  "timestamp": "2025-11-14T12:05:00Z"
}
```

## Features Details

### Auto-Refresh
- Fetches new data every 10 minutes
- Updates map and text panel without page reload
- Displays last update timestamp
- Manual refresh button available

### Mobile Optimization
- Responsive grid layout (stacks on mobile)
- Touch-friendly map controls
- Collapsible panels
- Optimized for slow connections

### Error Handling
- Graceful fallback to cached data
- User-friendly error messages
- Connection timeout handling
- Empty state displays

## Troubleshooting

### Backend Issues

**Problem**: "Cannot find module 'axios'"
```bash
cd backend
npm install
```

**Problem**: "MongoDB connection error"
- Check if MongoDB is running
- Verify MONGODB_URI in .env
- The typhoon tracker works without MongoDB

### Frontend Issues

**Problem**: Map not displaying
- Check if Leaflet CSS is imported in `main.jsx`
- Verify `leaflet` and `react-leaflet` are installed
- Clear browser cache

**Problem**: "No active typhoons"
- This is normal if there are no storms
- Try manual refresh
- Check backend console for API errors

### API Issues

**Problem**: Typhoon data not loading
- Verify backend is running on port 5000
- Check VITE_BACKEND_URL in .env
- Open browser console for errors
- Try clearing cache: `POST /api/typhoon/clear-cache`

## Future Enhancements

Potential improvements:
1. Integration with PAGASA data for local storm names
2. Animation of storm movement along track
3. Weather radar overlay
4. Push notifications for approaching storms
5. Historical storm archive
6. Storm impact predictions
7. Evacuation route suggestions
8. Multi-language support (Filipino, English)

## References

- NOAA ATCF: https://ftp.nhc.noaa.gov/atcf/
- ATCF Documentation: https://www.nrlmry.navy.mil/atcf_web/docs/database/new/database.html
- Leaflet.js: https://leafletjs.com/
- React Leaflet: https://react-leaflet.js.org/
- PAGASA: https://www.pagasa.dost.gov.ph/

## Support

For issues or questions:
1. Check this documentation
2. Review browser console for errors
3. Check backend logs
4. Verify all dependencies are installed

## License

Part of the Alerto project - MIT License
