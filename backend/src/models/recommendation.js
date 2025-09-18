const mongoose = require('mongoose');

const recommendationSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  type: {
    type: String,
    enum: ['job', 'course'],
    required: true
  },
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true
  },
  source: {
    type: String,
    enum: ['linkedin', 'indeed', 'unstop', 'coursera', 'udemy', 'edx'],
    required: true
  },
  url: {
    type: String,
    required: true
  },
  matchScore: {
    type: Number,
    min: 0,
    max: 100,
    required: true
  },
  // Job-specific fields
  company: String,
  location: String,
  salary: String,
  requirements: [String],
  // Course-specific fields
  provider: String,
  instructor: String,
  duration: String,
  level: {
    type: String,
    enum: ['beginner', 'intermediate', 'advanced']
  },
  price: String,
  rating: Number,
  // Common fields
  skills: [String],
  postedDate: Date,
  isActive: {
    type: Boolean,
    default: true
  },
  lastUpdated: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Indexes
recommendationSchema.index({ userId: 1, type: 1, matchScore: -1 });
recommendationSchema.index({ userId: 1, createdAt: -1 });
recommendationSchema.index({ matchScore: -1 });

module.exports = mongoose.model('Recommendation', recommendationSchema);
