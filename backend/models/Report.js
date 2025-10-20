const mongoose = require('mongoose');

const reportSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true,
    maxlength: 200
  },
  description: {
    type: String,
    required: true,
    maxlength: 2000
  },
  category: {
    type: String,
    enum: ['flooding', 'traffic', 'power', 'infrastructure', 'weather', 'emergency', 'other'],
    required: true
  },
  severity: {
    type: String,
    enum: ['low', 'medium', 'high', 'critical'],
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'verified', 'investigating', 'resolved', 'false_report'],
    default: 'pending'
  },
  location: {
    barangay: { type: String, required: true },
    city: { type: String, required: true },
    province: { type: String, required: true },
    coordinates: {
      lat: { type: Number, required: true },
      lng: { type: Number, required: true }
    },
    address: String
  },
  reporter: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  images: [{
    url: String,
    filename: String,
    uploadedAt: { type: Date, default: Date.now }
  }],
  tags: [String],
  verifiedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  verifiedAt: Date,
  resolution: {
    description: String,
    resolvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    resolvedAt: Date,
    actions: [String]
  },
  impact: {
    affectedPeople: Number,
    estimatedDamage: Number,
    duration: String
  },
  weather: {
    temperature: Number,
    humidity: Number,
    rainfall: Number,
    windSpeed: Number,
    conditions: String
  },
  aiAnalysis: {
    confidence: Number,
    summary: String,
    keywords: [String],
    processedAt: Date
  },
  interactions: {
    likes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    comments: [{
      user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      text: String,
      createdAt: { type: Date, default: Date.now }
    }],
    shares: Number
  },
  priority: {
    type: Number,
    default: 0,
    min: 0,
    max: 10
  },
  isPublic: {
    type: Boolean,
    default: true
  },
  expiresAt: {
    type: Date,
    default: () => new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days
  }
}, {
  timestamps: true
});

// Indexes for better performance
reportSchema.index({ location: '2dsphere' });
reportSchema.index({ createdAt: -1 });
reportSchema.index({ status: 1 });
reportSchema.index({ severity: 1 });
reportSchema.index({ category: 1 });
reportSchema.index({ reporter: 1 });

// Virtual for interaction counts
reportSchema.virtual('interactionCounts').get(function() {
  return {
    likes: this.interactions.likes.length,
    comments: this.interactions.comments.length,
    shares: this.interactions.shares
  };
});

// Method to update status
reportSchema.methods.updateStatus = function(newStatus, userId, description) {
  this.status = newStatus;
  if (newStatus === 'verified') {
    this.verifiedBy = userId;
    this.verifiedAt = new Date();
  }
  if (newStatus === 'resolved') {
    this.resolution.resolvedBy = userId;
    this.resolution.resolvedAt = new Date();
    if (description) this.resolution.description = description;
  }
  return this.save();
};

// Static method to get reports by location
reportSchema.statics.getReportsByLocation = function(coordinates, radius = 1000) {
  return this.find({
    location: {
      $near: {
        $geometry: {
          type: 'Point',
          coordinates: [coordinates.lng, coordinates.lat]
        },
        $maxDistance: radius
      }
    }
  }).populate('reporter', 'name avatar location').sort({ createdAt: -1 });
};

module.exports = mongoose.model('Report', reportSchema);
