const mongoose = require('mongoose');

const suspensionSchema = new mongoose.Schema({
  // Location Information
  city: {
    type: String,
    required: true,
    trim: true,
    index: true
  },
  province: {
    type: String,
    default: 'Batangas',
    trim: true
  },

  // Suspension Status
  status: {
    type: String,
    enum: ['active', 'scheduled', 'lifted', 'expired'],
    default: 'active',
    required: true,
    index: true
  },

  // Suspension Levels (What is suspended)
  levels: [{
    type: String,
    enum: ['preschool', 'k12', 'college', 'work', 'activities', 'all'],
    required: true
  }],

  // LGU Authority Information
  issuedBy: {
    name: {
      type: String,
      required: true
    },
    title: {
      type: String,
      required: true
    },
    office: {
      type: String,
      required: true
    },
    role: {
      type: String,
      enum: ['governor', 'mayor', 'deped', 'delegate'],
      required: true
    }
  },

  // Weather Criteria
  criteria: {
    // PAGASA Warning Level
    pagasaWarning: {
      type: String,
      enum: ['yellow', 'orange', 'red', null],
      default: null
    },

    // Tropical Cyclone Wind Signal
    tcws: {
      type: Number,
      min: 1,
      max: 5,
      default: null
    },

    // Actual Weather Measurements
    rainfall: {
      type: Number, // mm/hour
      default: null
    },
    windSpeed: {
      type: Number, // km/h
      default: null
    },
    temperature: {
      type: Number, // Celsius
      default: null
    },
    heatIndex: {
      type: Number, // Celsius
      default: null
    },
    humidity: {
      type: Number, // percentage
      default: null
    },

    // Additional Weather Info
    conditions: {
      type: String,
      default: null
    }
  },

  // AI Analysis Data
  aiAnalysis: {
    recommendation: {
      type: String,
      enum: ['suspend', 'monitor', 'safe'],
      required: true
    },
    confidence: {
      type: Number,
      min: 0,
      max: 100,
      required: true
    },
    reportCount: {
      type: Number,
      default: 0
    },
    criticalReports: {
      type: Number,
      default: 0
    },
    summary: {
      type: String,
      default: ''
    },
    justification: {
      type: String,
      default: ''
    },
    riskLevel: {
      type: String,
      enum: ['safe', 'low', 'moderate', 'high', 'critical'],
      default: 'moderate'
    }
  },

  // Timing Information
  issuedAt: {
    type: Date,
    required: true,
    default: Date.now,
    index: true
  },
  effectiveFrom: {
    type: Date,
    default: Date.now
  },
  effectiveUntil: {
    type: Date,
    required: true,
    index: true
  },
  liftedAt: {
    type: Date,
    default: null
  },

  // Duration in hours (for convenience)
  durationHours: {
    type: Number,
    required: true
  },

  // Custom Message
  message: {
    type: String,
    required: true,
    trim: true
  },

  // Additional Instructions
  instructions: {
    type: String,
    default: ''
  },

  // Reason for Suspension (Human-readable)
  reason: {
    type: String,
    required: true
  },

  // Auto-suspend flag (Was this automatically triggered by DepEd criteria?)
  isAutoSuspended: {
    type: Boolean,
    default: false
  },

  // Override flag (Did LGU override AI recommendation?)
  isOverridden: {
    type: Boolean,
    default: false
  },
  overrideReason: {
    type: String,
    default: null
  },

  // Notification Status
  notificationSent: {
    type: Boolean,
    default: false
  },
  notificationChannels: [{
    type: String,
    enum: ['in_app', 'push', 'sms', 'email', 'social_media']
  }],

  // Reevaluation Data
  lastReevaluatedAt: {
    type: Date,
    default: null
  },
  reevaluationCount: {
    type: Number,
    default: 0
  },
  weatherConditionStatus: {
    type: String,
    enum: ['improving', 'stable', 'worsening', null],
    default: null
  },

  // Extension/Update History
  extensions: [{
    extendedAt: Date,
    newEffectiveUntil: Date,
    reason: String,
    extendedBy: String
  }],

  updates: [{
    updatedAt: Date,
    field: String,
    oldValue: mongoose.Schema.Types.Mixed,
    newValue: mongoose.Schema.Types.Mixed,
    updatedBy: String,
    reason: String
  }],

  // Related Data
  relatedReports: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Report'
  }],

  weatherDataSnapshot: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'WeatherData'
  },

  // Metadata
  createdAt: {
    type: Date,
    default: Date.now,
    index: true
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Indexes for performance
suspensionSchema.index({ city: 1, status: 1 });
suspensionSchema.index({ status: 1, effectiveUntil: 1 });
suspensionSchema.index({ province: 1, status: 1 });
suspensionSchema.index({ issuedAt: -1 });
suspensionSchema.index({ 'criteria.pagasaWarning': 1 });

// Virtual for checking if suspension is currently active
suspensionSchema.virtual('isCurrentlyActive').get(function() {
  const now = new Date();
  return (
    this.status === 'active' &&
    this.effectiveFrom <= now &&
    this.effectiveUntil > now
  );
});

// Virtual for time remaining (in minutes)
suspensionSchema.virtual('timeRemaining').get(function() {
  if (this.status !== 'active') return 0;
  const now = new Date();
  const remaining = this.effectiveUntil - now;
  return Math.max(0, Math.floor(remaining / 60000)); // Convert to minutes
});

// Virtual for formatted levels
suspensionSchema.virtual('formattedLevels').get(function() {
  const levelMap = {
    preschool: 'Preschool/ECCD',
    k12: 'K-12',
    college: 'College',
    work: 'Government Work',
    activities: 'Public Activities',
    all: 'All Levels'
  };

  if (this.levels.includes('all')) {
    return 'All Levels';
  }

  return this.levels.map(level => levelMap[level] || level).join(', ');
});

// Pre-save middleware to update status based on time
suspensionSchema.pre('save', function(next) {
  const now = new Date();

  // Auto-expire if past effectiveUntil
  if (this.status === 'active' && this.effectiveUntil <= now) {
    this.status = 'expired';
  }

  // Auto-activate scheduled suspensions
  if (this.status === 'scheduled' && this.effectiveFrom <= now) {
    this.status = 'active';
  }

  // Update updatedAt timestamp
  this.updatedAt = now;

  next();
});

// Instance method to extend suspension
suspensionSchema.methods.extend = function(newEffectiveUntil, reason, extendedBy) {
  this.extensions.push({
    extendedAt: new Date(),
    newEffectiveUntil,
    reason,
    extendedBy
  });

  this.effectiveUntil = newEffectiveUntil;
  this.durationHours = (newEffectiveUntil - this.effectiveFrom) / (1000 * 60 * 60);

  return this.save();
};

// Instance method to lift suspension early
suspensionSchema.methods.lift = function(reason, liftedBy) {
  this.status = 'lifted';
  this.liftedAt = new Date();

  this.updates.push({
    updatedAt: new Date(),
    field: 'status',
    oldValue: 'active',
    newValue: 'lifted',
    updatedBy: liftedBy,
    reason
  });

  return this.save();
};

// Instance method to update weather condition status
suspensionSchema.methods.reevaluate = function(newStatus, weatherData) {
  this.lastReevaluatedAt = new Date();
  this.reevaluationCount += 1;
  this.weatherConditionStatus = newStatus;

  // Update criteria with new weather data if provided
  if (weatherData) {
    this.criteria = {
      ...this.criteria,
      ...weatherData
    };
  }

  return this.save();
};

// Static method to get active suspensions
suspensionSchema.statics.getActive = function(city = null) {
  const query = { status: 'active' };
  if (city) {
    query.city = city;
  }
  return this.find(query).sort({ issuedAt: -1 });
};

// Static method to get suspension candidates (areas to monitor)
suspensionSchema.statics.getCandidates = function() {
  // This would typically involve analyzing weather data and reports
  // Implementation will be in the suspensionService
  return [];
};

// Static method to check if city has active suspension
suspensionSchema.statics.hasActiveSuspension = async function(city) {
  const count = await this.countDocuments({
    city,
    status: 'active',
    effectiveUntil: { $gt: new Date() }
  });
  return count > 0;
};

// Static method to get historical suspensions
suspensionSchema.statics.getHistory = function(city = null, limit = 50) {
  const query = city ? { city } : {};
  return this.find(query)
    .sort({ issuedAt: -1 })
    .limit(limit)
    .populate('relatedReports')
    .populate('weatherDataSnapshot');
};

const Suspension = mongoose.model('Suspension', suspensionSchema);

module.exports = Suspension;
