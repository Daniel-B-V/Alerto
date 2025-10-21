# PAGASA Rainfall Forecast Integration

This document describes the integration of PAGASA (Philippine Atmospheric, Geophysical and Astronomical Services Administration) rainfall forecast data into the Alerto Analytics Dashboard.

## Overview

The PAGASA integration provides official government rainfall forecasts for Batangas Province, displayed alongside OpenWeather data in the Analytics section.

## Architecture

```
Frontend (React)
    ↓
PAGASA Service (src/services/pagasaService.js)
    ↓
Express Proxy Server (backend/server-pagasa.js)
    ↓
PAGASA GeoRisk Portal API
```

## Components

### 1. Express Proxy Server
**File**: `backend/server-pagasa.js`

Acts as a proxy between the frontend and PAGASA's ArcGIS REST API to handle CORS and provide additional data processing.

**Endpoints**:

#### `GET /api/batangas-forecast`
Get rainfall forecast for a specific location.

**Query Parameters**:
- `lat` (number): Latitude (default: 13.7565 - Batangas City)
- `lon` (number): Longitude (default: 121.0583)
- `city` (string): City name (optional)

**Example**:
```
GET http://localhost:5000/api/batangas-forecast?lat=13.7565&lon=121.0583&city=Batangas City
```

**Response**:
```json
{
  "features": [...],
  "metadata": {
    "city": "Batangas City",
    "coordinates": { "lat": 13.7565, "lon": 121.0583 },
    "source": "PAGASA",
    "timestamp": "2025-10-20T..."
  }
}
```

#### `POST /api/batangas-forecast-batch`
Get forecasts for multiple locations in one request.

**Request Body**:
```json
{
  "locations": [
    { "city": "Batangas City", "lat": 13.7565, "lon": 121.0583 },
    { "city": "Lipa City", "lat": 13.9411, "lon": 121.1650 }
  ]
}
```

**Response**:
```json
{
  "total": 2,
  "successful": 2,
  "failed": 0,
  "results": [...],
  "timestamp": "2025-10-20T..."
}
```

#### `GET /api/health`
Health check endpoint.

#### `GET /api/test-pagasa`
Test PAGASA API connection.

### 2. Frontend Service
**File**: `src/services/pagasaService.js`

Provides functions to fetch and process PAGASA rainfall forecast data.

**Functions**:

#### `getPAGASARainfallForecast(city)`
Get rainfall forecast for a specific city.
```javascript
import { getPAGASARainfallForecast } from '../services/pagasaService';

const forecast = await getPAGASARainfallForecast('Batangas City');
// Returns: { city, forecast[], summary }
```

#### `getAllBatangasForecasts()`
Get forecasts for all 8 monitored Batangas cities.
```javascript
import { getAllBatangasForecasts } from '../services/pagasaService';

const forecasts = await getAllBatangasForecasts();
// Returns: Array of forecast objects
```

#### `getCombinedForecast()`
Get aggregated forecast with statistics.
```javascript
import { getCombinedForecast } from '../services/pagasaService';

const data = await getCombinedForecast();
// Returns: { cities[], statistics, source, lastUpdated }
```

**Statistics Include**:
- Total cities monitored
- Critical/high/medium/low risk areas
- Total expected rainfall
- Average rainfall
- City with maximum rainfall
- Alerts array

#### `getRainfallAlerts()`
Get sorted list of rainfall alerts.
```javascript
import { getRainfallAlerts } from '../services/pagasaService';

const alerts = await getRainfallAlerts();
// Returns: Array of { city, riskLevel, message }
```

### 3. React Component
**File**: `src/components/PAGASAForecastCard.jsx`

Displays PAGASA forecast data in the Analytics dashboard.

**Features**:
- Real-time rainfall forecast display
- Risk level categorization
- City-by-city rainfall charts
- Alert notifications
- Auto-refresh every 30 minutes
- Loading and error states

## Monitored Locations

| City | Latitude | Longitude |
|------|----------|-----------|
| Batangas City | 13.7565 | 121.0583 |
| Lipa City | 13.9411 | 121.1650 |
| Tanauan City | 14.0859 | 121.1498 |
| Santo Tomas | 14.1078 | 121.1414 |
| Taal | 13.8833 | 120.9333 |
| Balayan | 13.9389 | 120.7331 |
| Nasugbu | 14.0678 | 120.6308 |
| Lemery | 13.9167 | 120.8833 |

## Risk Level Categorization

The system automatically categorizes rainfall forecasts:

| Risk Level | Criteria | Alert Message |
|------------|----------|---------------|
| **Critical** | > 50mm rainfall | Heavy to intense rainfall expected - Flooding risk is high |
| **High** | > 30mm rainfall | Heavy rainfall expected - Monitor flood-prone areas |
| **Medium** | > 15mm rainfall | Moderate rainfall expected - Be prepared for possible flooding |
| **Low** | > 5mm rainfall | Light to moderate rainfall expected |

## Setup Instructions

### 1. Start the PAGASA Proxy Server

Navigate to backend directory:
```bash
cd backend
```

**Development mode** (with auto-reload):
```bash
npm run pagasa:dev
```

**Production mode**:
```bash
npm run pagasa
```

The server will start on `http://localhost:5000`

### 2. Configure Environment Variables

Ensure your `.env` file has:
```env
VITE_API_URL=http://localhost:5000
```

### 3. Start Frontend

```bash
npm run dev
```

### 4. View PAGASA Forecasts

1. Login to Alerto
2. Navigate to **Analytics** section
3. Scroll to see **PAGASA Rainfall Forecast** section

## Testing

### Test Proxy Server

Check if the server is running:
```bash
curl http://localhost:5000/api/health
```

Test PAGASA API connection:
```bash
curl http://localhost:5000/api/test-pagasa
```

Test forecast for Batangas:
```bash
curl "http://localhost:5000/api/batangas-forecast?lat=13.7565&lon=121.0583&city=Batangas%20City"
```

### Test Frontend Integration

1. Open browser console
2. Navigate to Analytics section
3. Check for PAGASA forecast cards
4. Look for any error messages in console

## Data Flow

1. **User opens Analytics page**
2. **PAGASAForecastCard mounts**
3. **getCombinedForecast() called**
4. **Service fetches data** from all 8 cities via proxy
5. **Proxy queries PAGASA API** for each location
6. **Data parsed and categorized** by risk level
7. **Statistics calculated** (totals, averages, alerts)
8. **Component displays** charts, alerts, and statistics
9. **Auto-refresh** every 30 minutes

## API Response Structure

### PAGASA API Response
```json
{
  "features": [
    {
      "attributes": {
        "rainfall": 25.5,
        "timestamp": "2025-10-20T12:00:00Z",
        // ... other attributes
      }
    }
  ]
}
```

### Parsed Forecast Object
```json
{
  "city": "Batangas City",
  "forecast": [
    {
      "timestamp": "2025-10-20T12:00:00Z",
      "rainfall": 25.5,
      "location": "Batangas City",
      "source": "PAGASA"
    }
  ],
  "summary": {
    "totalRainfall": 76.5,
    "maxRainfall": 25.5,
    "riskLevel": "high",
    "alerts": ["Heavy rainfall expected - Monitor flood-prone areas"]
  }
}
```

## Error Handling

The integration includes comprehensive error handling:

### Frontend
- Try-catch blocks in all async functions
- Loading states during fetch
- Error states with retry buttons
- Graceful degradation if PAGASA unavailable
- Null checks for missing data

### Backend
- Request timeout (10 seconds)
- Failed city requests don't break batch
- Detailed error responses
- Console logging for debugging

## Troubleshooting

### "Failed to fetch PAGASA data"
1. Check if proxy server is running (`npm run pagasa:dev`)
2. Verify `VITE_API_URL` in `.env`
3. Test proxy health: `curl http://localhost:5000/api/health`
4. Check PAGASA API status: `curl http://localhost:5000/api/test-pagasa`

### "No data displayed"
1. Open browser console for errors
2. Check network tab for failed requests
3. Verify PAGASA API is accessible
4. Check if coordinates are correct

### CORS errors
- Should not occur with proxy server
- If they do, check CORS settings in `server-pagasa.js`
- Verify `FRONTEND_URL` environment variable

## Performance Considerations

- **Batch requests**: All cities fetched in parallel
- **Caching**: Consider implementing Redis cache for 15-30 min
- **Rate limiting**: PAGASA API has no known rate limits, but be respectful
- **Timeout**: 10 second timeout per request
- **Auto-refresh**: 30 minutes (less frequent than OpenWeather due to slower update rate)

## Future Enhancements

- [ ] Add historical rainfall data
- [ ] Implement forecast accuracy tracking
- [ ] Add push notifications for critical alerts
- [ ] Include typhoon tracking data
- [ ] Add flood risk mapping
- [ ] Integrate with local government LGU systems

## References

- **PAGASA GeoRisk Portal**: https://portal.georisk.gov.ph/
- **ArcGIS REST API**: https://portal.georisk.gov.ph/arcgis/rest/services
- **PAGASA Official**: https://www.pagasa.dost.gov.ph/

## Support

For issues or questions:
1. Check console logs
2. Test proxy server endpoints
3. Verify PAGASA API availability
4. Review error messages in UI

---

**Status**: ✅ Ready to Use
**Last Updated**: 2025-10-20
**Integration Type**: Proxy Server + REST API
