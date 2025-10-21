# OpenWeather API Integration - Setup Complete ✅

This document describes the OpenWeather API integration for the Alerto Weather Alert Dashboard.

## API Configuration

### API Details
- **API Provider**: OpenWeatherMap
- **API Key**: `13616e53cdfb9b00c018abeaa05e9784`
- **Base URL**: `https://api.openweathermap.org/data/2.5`
- **Default Location**: Batangas, Philippines

### Environment Variables
Your API key is configured in `.env`:
```env
VITE_WEATHER_API_KEY=13616e53cdfb9b00c018abeaa05e9784
```

## Weather Service Features

The weather service (`src/services/weatherService.js`) provides:

### 1. Current Weather Data
```javascript
import { getCurrentWeather } from '../services/weatherService';

const weather = await getCurrentWeather('Batangas');
// Returns: temperature, humidity, wind speed, rainfall, weather conditions
```

### 2. 5-Day Forecast
```javascript
import { getWeatherForecast } from '../services/weatherService';

const forecast = await getWeatherForecast('Batangas');
// Returns: 40 data points (3-hour intervals for 5 days)
```

### 3. Multi-City Weather
```javascript
import { getBatangasWeather } from '../services/weatherService';

const allCities = await getBatangasWeather();
// Returns weather for: Batangas City, Lipa, Tanauan, Santo Tomas, Taal, Balayan, Nasugbu, Lemery
```

### 4. Hourly Forecast (24 hours)
```javascript
import { getHourlyForecast } from '../services/weatherService';

const hourly = await getHourlyForecast('Batangas');
// Returns: Next 8 data points (24 hours)
```

### 5. Weather Alerts
```javascript
import { getWeatherAlerts } from '../services/weatherService';

const alerts = await getWeatherAlerts();
// Categorizes weather by risk level: high, medium, low
```

### 6. Weather Statistics
```javascript
import { getWeatherStatistics } from '../services/weatherService';

const stats = await getWeatherStatistics();
// Returns: averages, totals, risk counts, condition breakdown
```

## Alert Level Criteria

The system automatically categorizes weather conditions:

| Level | Criteria |
|-------|----------|
| **High** | Rainfall > 10mm/hr OR Wind Speed > 40 km/h |
| **Medium** | Rainfall > 5mm/hr OR Wind Speed > 25 km/h |
| **Low** | Light rain or normal conditions |

## Weather Panel Component

Location: `src/components/WeatherPanel.jsx`

### Features:
- ✅ Real-time current weather display
- ✅ Hourly forecast charts (temperature, rainfall, humidity, wind)
- ✅ Weather alerts for all Batangas cities
- ✅ Auto-refresh every 5 minutes
- ✅ Manual refresh button
- ✅ Loading states and error handling

### Data Displayed:
- Current temperature, feels like, humidity
- Wind speed and direction
- Cloud coverage and visibility
- Rainfall measurements
- Sunrise/sunset times
- Weather icons from OpenWeatherMap

## Testing the API

### Option 1: Browser Console (Development Mode)
When running in development mode (`npm run dev`), test functions are available in the browser console:

```javascript
// Test current weather
await window.testWeatherAPI.testCurrentWeather()

// Test weather forecast
await window.testWeatherAPI.testWeatherForecast()

// Run all tests
await window.testWeatherAPI.runAllTests()
```

### Option 2: Direct API Test
You can also test the API directly in your browser:

**Current Weather:**
```
https://api.openweathermap.org/data/2.5/weather?q=Batangas,PH&appid=13616e53cdfb9b00c018abeaa05e9784&units=metric
```

**5-Day Forecast:**
```
https://api.openweathermap.org/data/2.5/forecast?q=Batangas,PH&appid=13616e53cdfb9b00c018abeaa05e9784&units=metric
```

## API Response Format

### Current Weather Response
```javascript
{
  location: {
    city: "Batangas",
    country: "PH",
    lat: 13.7565,
    lon: 121.0583
  },
  current: {
    temperature: 28,        // °C
    feelsLike: 30,         // °C
    humidity: 75,          // %
    pressure: 1012,        // hPa
    windSpeed: 15,         // km/h
    windDirection: 180,    // degrees
    cloudiness: 40,        // %
    visibility: 10,        // km
    rainfall: 0,           // mm/h
    weather: {
      main: "Clouds",
      description: "scattered clouds",
      icon: "02d",
      iconUrl: "https://openweathermap.org/img/wn/02d@2x.png"
    },
    timestamp: Date
  },
  sys: {
    sunrise: Date,
    sunset: Date
  }
}
```

## Batangas Province Cities Monitored

1. **Batangas City** - Provincial capital
2. **Lipa City** - Major urban center
3. **Tanauan City** - Industrial hub
4. **Santo Tomas** - Educational center
5. **Taal** - Heritage town
6. **Balayan** - Coastal area
7. **Nasugbu** - Beach resort area
8. **Lemery** - Taal Lake vicinity

## Data Refresh Schedule

- **Auto-refresh**: Every 5 minutes
- **Manual refresh**: Click the refresh button in Weather Panel
- **OpenWeather API Updates**: Real-time data with ~10-minute intervals

## Units

All measurements are in metric units:
- Temperature: Celsius (°C)
- Wind Speed: Kilometers per hour (km/h)
- Rainfall: Millimeters (mm)
- Pressure: Hectopascals (hPa)
- Visibility: Kilometers (km)

## Error Handling

The weather service includes comprehensive error handling:
- Network errors
- Invalid API responses
- Missing data fallbacks
- Timeout protection
- Failed city requests (filters out nulls)

## Next Steps

1. **Start Development Server**:
   ```bash
   npm run dev
   ```

2. **Test the Weather API**:
   - Open browser console
   - Run: `window.testWeatherAPI.runAllTests()`

3. **View Weather Dashboard**:
   - Login to the app
   - Click on "Weather" in the sidebar
   - View real-time weather data for Batangas

## Troubleshooting

### API Key Issues
If you see authentication errors:
1. Verify `.env` file has the correct API key
2. Restart the development server
3. Check OpenWeatherMap dashboard for API key status

### No Data Displayed
1. Check browser console for errors
2. Verify internet connection
3. Test API directly in browser (see links above)
4. Ensure `VITE_WEATHER_API_KEY` is set in `.env`

### Rate Limiting
Free tier limits:
- 60 calls/minute
- 1,000,000 calls/month

The app refreshes every 5 minutes to stay well within limits.

---

**Status**: ✅ Ready to Use
**Last Updated**: 2025-10-20
