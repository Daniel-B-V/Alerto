const mongoose = require('mongoose');

const weatherDataSchema = new mongoose.Schema({
  location: {
    city: { type: String, required: true },
    province: { type: String, required: true },
    coordinates: {
      lat: { type: Number, required: true },
      lng: { type: Number, required: true }
    }
  },
  current: {
    temperature: { type: Number, required: true },
    humidity: { type: Number, required: true },
    pressure: Number,
    visibility: Number,
    uvIndex: Number,
    windSpeed: { type: Number, required: true },
    windDirection: Number,
    rainfall: { type: Number, default: 0 },
    conditions: { type: String, required: true },
    icon: String,
    feelsLike: Number
  },
  forecast: [{
    date: { type: Date, required: true },
    temperature: {
      min: Number,
      max: Number,
      avg: Number
    },
    humidity: Number,
    rainfall: Number,
    windSpeed: Number,
    conditions: String,
    icon: String,
    alerts: [String]
  }],
  alerts: [{
    type: { type: String, enum: ['storm', 'flood', 'heat', 'cold', 'wind', 'rain'] },
    severity: { type: String, enum: ['low', 'medium', 'high', 'critical'] },
    title: String,
    description: String,
    startTime: Date,
    endTime: Date,
    areas: [String]
  }],
  historical: [{
    date: { type: Date, required: true },
    temperature: Number,
    humidity: Number,
    rainfall: Number,
    windSpeed: Number,
    conditions: String
  }],
  source: {
    type: { type: String, enum: ['api', 'station', 'manual'], default: 'api' },
    provider: String,
    stationId: String,
    lastUpdated: { type: Date, default: Date.now }
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Indexes
weatherDataSchema.index({ 'location.coordinates': '2dsphere' });
weatherDataSchema.index({ createdAt: -1 });
weatherDataSchema.index({ 'location.city': 1, 'location.province': 1 });

// Method to get current weather summary
weatherDataSchema.methods.getSummary = function() {
  const alerts = this.alerts.filter(alert => 
    new Date(alert.endTime) > new Date()
  );
  
  return {
    location: this.location,
    current: this.current,
    activeAlerts: alerts,
    lastUpdated: this.source.lastUpdated,
    hasAlerts: alerts.length > 0
  };
};

// Static method to get weather by location
weatherDataSchema.statics.getByLocation = function(city, province) {
  return this.findOne({
    'location.city': new RegExp(city, 'i'),
    'location.province': new RegExp(province, 'i'),
    isActive: true
  }).sort({ createdAt: -1 });
};

module.exports = mongoose.model('WeatherData', weatherDataSchema);
