const mongoose = require('mongoose');

const resumeSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  filename: {
    type: String,
    required: [true, 'Filename is required']
  },
  originalName: {
    type: String,
    required: [true, 'Original filename is required']
  },
  filePath: {
    type: String,
    required: [true, 'File path is required']
  },
  fileSize: {
    type: Number,
    required: [true, 'File size is required']
  },
  mimeType: {
    type: String,
    required: [true, 'MIME type is required']
  },
  extractedText: {
    type: String,
    default: ''
  },
  processingStatus: {
    type: String,
    enum: ['pending', 'processing', 'completed', 'failed'],
    default: 'pending'
  },
  extractedData: {
    personalInfo: {
      name: String,
      email: String,
      phone: String,
      location: String
    },
    summary: String,
    skills: [String],
    experience: [{
      title: String,
      company: String,
      location: String,
      startDate: Date,
      endDate: Date,
      description: String,
      skills: [String]
    }],
    education: [{
      degree: String,
      institution: String,
      location: String,
      startDate: Date,
      endDate: Date,
      gpa: String
    }],
    certifications: [{
      name: String,
      issuer: String,
      date: Date,
      url: String
    }],
    projects: [{
      name: String,
      description: String,
      technologies: [String],
      url: String
    }]
  },
  milestonesCreated: {
    type: Number,
    default: 0
  },
  processingError: {
    type: String,
    default: null
  }
}, {
  timestamps: true
});

// Index for efficient querying
resumeSchema.index({ user: 1, createdAt: -1 });

module.exports = mongoose.model('Resume', resumeSchema);
