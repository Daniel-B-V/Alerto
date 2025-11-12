/**
 * Suspension Request Model
 * For mayors to request suspensions from the governor
 */

const mongoose = require('mongoose');

const suspensionRequestSchema = new mongoose.Schema({
  // City requesting suspension
  city: {
    type: String,
    required: true,
    index: true
  },

  // Requested by (Mayor)
  requestedBy: {
    userId: { type: String, required: true },
    name: { type: String, required: true },
    role: { type: String, default: 'mayor' }
  },

  // Request details
  requestedLevels: [{
    type: String,
    enum: ['preschool', 'k12', 'college', 'work', 'activities', 'all']
  }],

  requestedDuration: {
    type: Number, // hours
    required: true,
    min: 2,
    max: 48
  },

  // Justification
  reason: {
    type: String,
    required: true
  },

  // Weather data at time of request
  weatherData: {
    rainfall: Number,
    windSpeed: Number,
    temperature: Number,
    humidity: Number,
    pagasaWarning: String,
    tcws: Number
  },

  // Community reports count
  reportCount: {
    type: Number,
    default: 0
  },

  criticalReports: {
    type: Number,
    default: 0
  },

  // Status
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected', 'cancelled'],
    default: 'pending',
    index: true
  },

  // Governor response
  reviewedBy: {
    userId: String,
    name: String,
    role: String
  },

  reviewedAt: Date,

  governorNotes: String,

  // If approved, link to created suspension
  suspensionId: {
    type: String,
    index: true
  },

  // Timestamps
  createdAt: {
    type: Date,
    default: Date.now,
    index: true
  },

  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Update timestamp on save
suspensionRequestSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

// Instance methods
suspensionRequestSchema.methods.approve = async function(governorUser, suspensionId, notes = '') {
  this.status = 'approved';
  this.reviewedBy = {
    userId: governorUser.uid || governorUser.userId,
    name: governorUser.displayName || governorUser.name,
    role: 'governor'
  };
  this.reviewedAt = new Date();
  this.governorNotes = notes;
  this.suspensionId = suspensionId;
  return this.save();
};

suspensionRequestSchema.methods.reject = async function(governorUser, reason) {
  this.status = 'rejected';
  this.reviewedBy = {
    userId: governorUser.uid || governorUser.userId,
    name: governorUser.displayName || governorUser.name,
    role: 'governor'
  };
  this.reviewedAt = new Date();
  this.governorNotes = reason;
  return this.save();
};

suspensionRequestSchema.methods.cancel = async function() {
  this.status = 'cancelled';
  return this.save();
};

// Static methods
suspensionRequestSchema.statics.getPendingRequests = function() {
  return this.find({ status: 'pending' })
    .sort({ createdAt: -1 });
};

suspensionRequestSchema.statics.getRequestsByCity = function(city) {
  return this.find({ city })
    .sort({ createdAt: -1 });
};

const SuspensionRequest = mongoose.model('SuspensionRequest', suspensionRequestSchema);

module.exports = SuspensionRequest;
