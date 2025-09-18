const mongoose = require('mongoose');

const milestoneSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  resumeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Resume',
    required: false
  },
  title: {
    type: String,
    required: [true, 'Milestone title is required'],
    trim: true,
    maxlength: [200, 'Title cannot exceed 200 characters']
  },
  description: {
    type: String,
    required: [true, 'Milestone description is required'],
    maxlength: [1000, 'Description cannot exceed 1000 characters']
  },
  type: {
    type: String,
    required: true,
    enum: ['education', 'job', 'certification', 'achievement', 'project'],
    default: 'job'
  },
  company: {
    type: String,
    trim: true,
    maxlength: [100, 'Company name cannot exceed 100 characters']
  },
  location: {
    type: String,
    trim: true,
    maxlength: [100, 'Location cannot exceed 100 characters']
  },
  date: {
    type: Date,
    required: [true, 'Milestone date is required']
  },
  endDate: {
    type: Date
  },
  duration: {
    type: String,
    trim: true
  },
  skills: [{
    type: String,
    trim: true
  }],
  isManuallyAdded: {
    type: Boolean,
    default: false
  },
  extractionConfidence: {
    type: Number,
    min: 0,
    max: 1,
    default: 1
  }
}, {
  timestamps: true
});

// Index for efficient queries
milestoneSchema.index({ userId: 1, date: -1 });
milestoneSchema.index({ userId: 1, type: 1 });

module.exports = mongoose.model('Milestone', milestoneSchema);
