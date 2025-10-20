const express = require('express');
const axios = require('axios');
const WeatherData = require('../models/WeatherData');
const { query, validationResult } = require('express-validator');

const router = express.Router();

// @route   GET /api/weather/current
// @desc    Get current weather for a location
// @access  Public
router.get('/current', [
  query('city').optional().isString(),
  query('province').optional().isString(),
  query('lat').optional().isFloat(),
  query('lng').optional().isFloat()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { city, province, lat, lng } = req.query;

    let weatherData;

    if (city && province) {
      // Get weather by city and province
      weatherData = await WeatherData.getByLocation(city, province);
    } else if (lat && lng) {
      // Get weather by coordinates
      weatherData = await WeatherData.findOne({
        'location.coordinates': {
          $near: {
            $geometry: {
              type: 'Point',
              coordinates: [parseFloat(lng), parseFloat(lat)]
            },
            $maxDistance: 10000 // 10km radius
          }
        },
        isActive: true
      }).sort({ createdAt: -1 });
    } else {
      return res.status(400).json({ message: 'Either city/province or lat/lng coordinates required' });
    }

    if (!weatherData) {
      // If no data in database, try to fetch from external API
      try {
        const externalData = await fetchExternalWeatherData(city, province, lat, lng);
        if (externalData) {
          return res.json(externalData);
        }
      } catch (error) {
        console.error('External API error:', error);
      }
      
      return res.status(404).json({ message: 'Weather data not found' });
    }

    res.json(weatherData.getSummary());
  } catch (error) {
    console.error('Weather fetch error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/weather/forecast
// @desc    Get weather forecast
// @access  Public
router.get('/forecast', [
  query('city').optional().isString(),
  query('province').optional().isString(),
  query('days').optional().isInt({ min: 1, max: 7 })
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { city, province, days = 5 } = req.query;

    if (!city || !province) {
      return res.status(400).json({ message: 'City and province are required' });
    }

    const weatherData = await WeatherData.getByLocation(city, province);
    
    if (!weatherData || !weatherData.forecast) {
      return res.status(404).json({ message: 'Forecast data not found' });
    }

    const forecast = weatherData.forecast.slice(0, parseInt(days));
    res.json({
      location: weatherData.location,
      forecast,
      lastUpdated: weatherData.source.lastUpdated
    });
  } catch (error) {
    console.error('Forecast fetch error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/weather/alerts
// @desc    Get active weather alerts
// @access  Public
router.get('/alerts', [
  query('city').optional().isString(),
  query('province').optional().isString()
], async (req, res) => {
  try {
    const { city, province } = req.query;
    const now = new Date();

    let query = {
      'alerts.endTime': { $gt: now },
      isActive: true
    };

    if (city && province) {
      query['location.city'] = new RegExp(city, 'i');
      query['location.province'] = new RegExp(province, 'i');
    }

    const weatherData = await WeatherData.find(query);
    
    const alerts = weatherData.flatMap(data => 
      data.alerts.filter(alert => alert.endTime > now)
    );

    res.json({
      alerts,
      total: alerts.length,
      lastUpdated: new Date()
    });
  } catch (error) {
    console.error('Alerts fetch error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/weather/historical
// @desc    Get historical weather data
// @access  Public
router.get('/historical', [
  query('city').isString().withMessage('City is required'),
  query('province').isString().withMessage('Province is required'),
  query('days').optional().isInt({ min: 1, max: 30 })
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { city, province, days = 7 } = req.query;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(days));

    const weatherData = await WeatherData.findOne({
      'location.city': new RegExp(city, 'i'),
      'location.province': new RegExp(province, 'i'),
      isActive: true
    });

    if (!weatherData || !weatherData.historical) {
      return res.status(404).json({ message: 'Historical data not found' });
    }

    const historical = weatherData.historical.filter(data => 
      data.date >= startDate
    ).sort((a, b) => a.date - b.date);

    res.json({
      location: weatherData.location,
      historical,
      period: { start: startDate, end: new Date() }
    });
  } catch (error) {
    console.error('Historical data fetch error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/weather/update
// @desc    Update weather data (for admin or automated systems)
// @access  Private (Admin only)
router.post('/update', async (req, res) => {
  try {
    const { location, current, forecast, alerts, historical } = req.body;

    // Find existing weather data or create new
    let weatherData = await WeatherData.findOne({
      'location.city': location.city,
      'location.province': location.province
    });

    if (weatherData) {
      // Update existing data
      weatherData.current = current;
      weatherData.forecast = forecast;
      weatherData.alerts = alerts;
      weatherData.historical = historical;
      weatherData.source.lastUpdated = new Date();
    } else {
      // Create new weather data
      weatherData = new WeatherData({
        location,
        current,
        forecast,
        alerts,
        historical,
        source: {
          type: 'api',
          provider: 'OpenWeatherMap',
          lastUpdated: new Date()
        }
      });
    }

    await weatherData.save();

    res.json({ message: 'Weather data updated successfully', data: weatherData });
  } catch (error) {
    console.error('Weather update error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Helper function to fetch external weather data
async function fetchExternalWeatherData(city, province, lat, lng) {
  const apiKey = process.env.WEATHER_API_KEY;
  if (!apiKey) {
    throw new Error('Weather API key not configured');
  }

  let url;
  if (lat && lng) {
    url = `${process.env.WEATHER_API_URL}/weather?lat=${lat}&lon=${lng}&appid=${apiKey}&units=metric`;
  } else {
    url = `${process.env.WEATHER_API_URL}/weather?q=${city},${province},PH&appid=${apiKey}&units=metric`;
  }

  const response = await axios.get(url);
  const data = response.data;

  return {
    location: {
      city: data.name,
      province: province || 'Unknown',
      coordinates: {
        lat: data.coord.lat,
        lng: data.coord.lon
      }
    },
    current: {
      temperature: data.main.temp,
      humidity: data.main.humidity,
      pressure: data.main.pressure,
      visibility: data.visibility / 1000, // Convert to km
      windSpeed: data.wind.speed,
      windDirection: data.wind.deg,
      conditions: data.weather[0].description,
      icon: data.weather[0].icon,
      feelsLike: data.main.feels_like
    },
    source: {
      type: 'api',
      provider: 'OpenWeatherMap',
      lastUpdated: new Date()
    }
  };
}

module.exports = router;
