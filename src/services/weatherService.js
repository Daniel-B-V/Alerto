// OpenWeather API Service for Real-time Weather Data
const WEATHER_API_KEY = import.meta.env.VITE_WEATHER_API_KEY;
const WEATHER_API_URL = import.meta.env.VITE_WEATHER_API_URL || 'https://api.openweathermap.org/data/2.5';

// Default location: Batangas, Philippines
const DEFAULT_LOCATION = {
  city: 'Batangas',
  lat: 13.7565,
  lon: 121.0583,
  country: 'PH'
};

// Helper function to handle API errors
const handleApiError = (error, context) => {
  console.error(`Weather API Error (${context}):`, error);
  throw new Error(`Failed to fetch ${context}: ${error.message}`);
};

// Get current weather for a specific location
export const getCurrentWeather = async (city = DEFAULT_LOCATION.city) => {
  try {
    const response = await fetch(
      `${WEATHER_API_URL}/weather?q=${encodeURIComponent(city)},PH&appid=${WEATHER_API_KEY}&units=metric`
    );

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();

    // Transform API response to our format
    return {
      location: {
        city: data.name,
        country: data.sys.country,
        lat: data.coord.lat,
        lon: data.coord.lon,
      },
      current: {
        temperature: Math.round(data.main.temp),
        feelsLike: Math.round(data.main.feels_like),
        humidity: data.main.humidity,
        pressure: data.main.pressure,
        windSpeed: Math.round(data.wind.speed * 3.6), // Convert m/s to km/h
        windDirection: data.wind.deg,
        cloudiness: data.clouds.all,
        visibility: data.visibility / 1000, // Convert to km
        weather: {
          main: data.weather[0].main,
          description: data.weather[0].description,
          icon: data.weather[0].icon,
          iconUrl: `https://openweathermap.org/img/wn/${data.weather[0].icon}@2x.png`,
        },
        rainfall: data.rain?.['1h'] || 0, // Rainfall in last hour (mm)
        timestamp: new Date(data.dt * 1000),
      },
      sys: {
        sunrise: new Date(data.sys.sunrise * 1000),
        sunset: new Date(data.sys.sunset * 1000),
      },
    };
  } catch (error) {
    handleApiError(error, 'current weather');
  }
};

// Get 5-day weather forecast (3-hour intervals)
export const getWeatherForecast = async (city = DEFAULT_LOCATION.city) => {
  try {
    const response = await fetch(
      `${WEATHER_API_URL}/forecast?q=${encodeURIComponent(city)},PH&appid=${WEATHER_API_KEY}&units=metric`
    );

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();

    // Transform forecast data
    const forecast = data.list.map(item => ({
      timestamp: new Date(item.dt * 1000),
      temperature: Math.round(item.main.temp),
      feelsLike: Math.round(item.main.feels_like),
      humidity: item.main.humidity,
      pressure: item.main.pressure,
      windSpeed: Math.round(item.wind.speed * 3.6),
      cloudiness: item.clouds.all,
      rainfall: item.rain?.['3h'] || 0, // Rainfall in last 3 hours (mm)
      weather: {
        main: item.weather[0].main,
        description: item.weather[0].description,
        icon: item.weather[0].icon,
        iconUrl: `https://openweathermap.org/img/wn/${item.weather[0].icon}@2x.png`,
      },
      pop: item.pop * 100, // Probability of precipitation (%)
    }));

    return {
      location: {
        city: data.city.name,
        country: data.city.country,
        lat: data.city.coord.lat,
        lon: data.city.coord.lon,
      },
      forecast,
    };
  } catch (error) {
    handleApiError(error, 'weather forecast');
  }
};

// Get weather for multiple cities in Batangas Province
export const getBatangasWeather = async () => {
  const batangasCities = [
    'Batangas City',
    'Lipa City',
    'Tanauan City',
    'Santo Tomas',
    'Taal',
    'Balayan',
    'Nasugbu',
    'Lemery',
  ];

  try {
    const weatherPromises = batangasCities.map(city =>
      getCurrentWeather(city).catch(err => {
        console.error(`Failed to fetch weather for ${city}:`, err);
        return null;
      })
    );

    const results = await Promise.all(weatherPromises);

    // Filter out any failed requests
    return results.filter(result => result !== null);
  } catch (error) {
    handleApiError(error, 'Batangas weather data');
  }
};

// Get hourly forecast for charts (next 24 hours)
export const getHourlyForecast = async (city = DEFAULT_LOCATION.city) => {
  try {
    const forecastData = await getWeatherForecast(city);

    // Get next 8 data points (24 hours with 3-hour intervals)
    const hourlyData = forecastData.forecast.slice(0, 8).map(item => {
      const hour = item.timestamp.getHours();
      const ampm = hour >= 12 ? 'PM' : 'AM';
      const displayHour = hour % 12 || 12;

      return {
        time: `${displayHour}${ampm}`,
        timestamp: item.timestamp,
        rainfall: item.rainfall,
        humidity: item.humidity,
        wind: item.windSpeed,
        temperature: item.temperature,
        weather: item.weather.main,
      };
    });

    return hourlyData;
  } catch (error) {
    handleApiError(error, 'hourly forecast');
  }
};

// Get weather alerts (categorize based on weather conditions)
export const getWeatherAlerts = async () => {
  try {
    const batangasWeather = await getBatangasWeather();

    // Analyze weather data and create alerts
    const alerts = batangasWeather.map(data => {
      let level = 'low';
      let status = 'Normal';

      // Determine alert level based on conditions
      if (data.current.rainfall > 10 || data.current.windSpeed > 40) {
        level = 'high';
        status = data.current.rainfall > 10 ? 'Heavy Rain Warning' : 'Strong Wind Warning';
      } else if (data.current.rainfall > 5 || data.current.windSpeed > 25) {
        level = 'medium';
        status = data.current.rainfall > 5 ? 'Moderate Rain' : 'Gusty Winds';
      } else if (data.current.weather.main === 'Rain') {
        level = 'low';
        status = 'Light Rain';
      }

      return {
        location: data.location.city,
        level,
        status,
        conditions: {
          temperature: data.current.temperature,
          rainfall: data.current.rainfall,
          windSpeed: data.current.windSpeed,
          humidity: data.current.humidity,
        },
        timestamp: data.current.timestamp,
      };
    });

    // Sort by alert level (high > medium > low)
    const levelPriority = { high: 3, medium: 2, low: 1 };
    alerts.sort((a, b) => levelPriority[b.level] - levelPriority[a.level]);

    return alerts;
  } catch (error) {
    handleApiError(error, 'weather alerts');
  }
};

// Calculate weather statistics for analytics
export const getWeatherStatistics = async () => {
  try {
    const batangasWeather = await getBatangasWeather();

    const stats = {
      averageTemperature: 0,
      averageHumidity: 0,
      averageWindSpeed: 0,
      totalRainfall: 0,
      highRiskAreas: 0,
      mediumRiskAreas: 0,
      normalAreas: 0,
      weatherConditions: {
        clear: 0,
        cloudy: 0,
        rain: 0,
        storm: 0,
      },
    };

    batangasWeather.forEach(data => {
      stats.averageTemperature += data.current.temperature;
      stats.averageHumidity += data.current.humidity;
      stats.averageWindSpeed += data.current.windSpeed;
      stats.totalRainfall += data.current.rainfall;

      // Count risk areas
      if (data.current.rainfall > 10 || data.current.windSpeed > 40) {
        stats.highRiskAreas++;
      } else if (data.current.rainfall > 5 || data.current.windSpeed > 25) {
        stats.mediumRiskAreas++;
      } else {
        stats.normalAreas++;
      }

      // Count weather conditions
      const condition = data.current.weather.main.toLowerCase();
      if (condition.includes('clear') || condition.includes('sun')) {
        stats.weatherConditions.clear++;
      } else if (condition.includes('cloud')) {
        stats.weatherConditions.cloudy++;
      } else if (condition.includes('rain') || condition.includes('drizzle')) {
        stats.weatherConditions.rain++;
      } else if (condition.includes('storm') || condition.includes('thunder')) {
        stats.weatherConditions.storm++;
      }
    });

    // Calculate averages
    const count = batangasWeather.length;
    stats.averageTemperature = Math.round(stats.averageTemperature / count);
    stats.averageHumidity = Math.round(stats.averageHumidity / count);
    stats.averageWindSpeed = Math.round(stats.averageWindSpeed / count);
    stats.totalRainfall = Math.round(stats.totalRainfall * 10) / 10;

    return stats;
  } catch (error) {
    handleApiError(error, 'weather statistics');
  }
};

// Get weather icon component name based on condition
export const getWeatherIconName = (weatherMain) => {
  const iconMap = {
    Clear: 'Sun',
    Clouds: 'Cloud',
    Rain: 'CloudRain',
    Drizzle: 'CloudDrizzle',
    Thunderstorm: 'CloudLightning',
    Snow: 'Snowflake',
    Mist: 'CloudFog',
    Fog: 'CloudFog',
    Haze: 'CloudFog',
  };

  return iconMap[weatherMain] || 'Cloud';
};

export default {
  getCurrentWeather,
  getWeatherForecast,
  getBatangasWeather,
  getHourlyForecast,
  getWeatherAlerts,
  getWeatherStatistics,
  getWeatherIconName,
};
