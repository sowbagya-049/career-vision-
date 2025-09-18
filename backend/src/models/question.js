const mongoose = require('mongoose');

const questionSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  question: {
    type: String,
    required: [true, 'Question is required'],
    trim: true,
    maxlength: [500, 'Question cannot exceed 500 characters']
  },
  answer: {
    type: String,
    required: true
  },
  category: {
    type: String,
    enum: ['career-gap', 'skills', 'recommendations', 'growth', 'general'],
    default: 'general'
  },
  confidence: {
    type: Number,
    min: 0,
    max: 1,
    default: 0.8
  },
  processingTime: {
    type: Number // in milliseconds
  }
}, {
  timestamps: true
});

// Index for user queries
questionSchema.index({ userId: 1, createdAt: -1 });
questionSchema.index({ userId: 1, category: 1 });

module.exports = mongoose.model('Question', questionSchema);
