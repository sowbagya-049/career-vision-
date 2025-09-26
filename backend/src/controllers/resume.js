const Resume = require('../models/resume');
const textProcessor = require('../services/text-processor');
const path = require('path');
const fs = require('fs').promises;

// Upload and process resume
const uploadResume = async (req, res, next) => {
  try {
    console.log('Resume upload request:', {
      user: req.user.id,
      file: req.file ? {
        originalname: req.file.originalname,
        size: req.file.size,
        mimetype: req.file.mimetype
      } : null
    });

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No file uploaded. Please select a file.'
      });
    }

    // Validate file type
    const allowedTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ];

    if (!allowedTypes.includes(req.file.mimetype)) {
      // Delete uploaded file
      try {
        await fs.unlink(req.file.path);
      } catch (unlinkError) {
        console.error('Error deleting invalid file:', unlinkError);
      }

      return res.status(400).json({
        success: false,
        message: 'Invalid file type. Please upload PDF, DOC, or DOCX files only.'
      });
    }

    // Create resume record
    const resume = await Resume.create({
      user: req.user.id,
      filename: req.file.filename,
      originalName: req.file.originalname,
      filePath: req.file.path,
      fileSize: req.file.size,
      mimeType: req.file.mimetype,
      processingStatus: 'processing'
    });

    console.log('Resume record created:', {
      id: resume._id,
      originalName: resume.originalName,
      size: resume.fileSize
    });

    // Start background processing
    processResumeAsync(resume._id);

    // Return immediate response
    res.status(201).json({
      success: true,
      message: 'Resume uploaded successfully',
      data: {
        resumeId: resume._id,
        filename: resume.originalName,
        size: resume.fileSize,
        status: 'processing'
      }
    });
  } catch (error) {
    console.error('Resume upload error:', error);
    
    // Clean up file if it was uploaded
    if (req.file && req.file.path) {
      try {
        await fs.unlink(req.file.path);
      } catch (unlinkError) {
        console.error('Error deleting file after error:', unlinkError);
      }
    }
    
    next(error);
  }
};

// Background processing function
const processResumeAsync = async (resumeId) => {
  try {
    console.log('Starting resume processing for ID:', resumeId);
    
    const resume = await Resume.findById(resumeId);
    if (!resume) {
      console.error('Resume not found for processing:', resumeId);
      return;
    }

    // Extract text from file
    let extractedText = '';
    let extractedData = {};

    try {
      extractedText = await textProcessor.extractTextFromFile(
        resume.filePath, 
        resume.mimeType
      );
      
      console.log('Text extracted successfully, length:', extractedText.length);
      
      // Parse extracted text for structured data
      extractedData = await textProcessor.parseResumeText(extractedText);
      
      console.log('Resume parsed successfully:', {
        skills: extractedData.skills?.length || 0,
        experience: extractedData.experience?.length || 0,
        education: extractedData.education?.length || 0
      });

    } catch (processingError) {
      console.error('Resume processing error:', processingError);
      extractedText = 'Error extracting text from file';
      extractedData = { error: processingError.message };
    }

    // Update resume with results
    await Resume.findByIdAndUpdate(resumeId, {
      extractedText,
      extractedData,
      processingStatus: 'completed'
    });

    console.log('Resume processing completed for ID:', resumeId);

  } catch (error) {
    console.error('Resume processing failed:', error);
    
    try {
      await Resume.findByIdAndUpdate(resumeId, {
        processingStatus: 'failed',
        processingError: error.message
      });
    } catch (updateError) {
      console.error('Error updating resume status:', updateError);
    }
  }
};

// Get user's resumes
const getResumes = async (req, res, next) => {
  try {
    const resumes = await Resume.find({ user: req.user.id })
      .sort({ createdAt: -1 })
      .select('-extractedText'); // Don't send full text in list

    res.json({
      success: true,
      data: resumes
    });
  } catch (error) {
    next(error);
  }
};

// Get resume details
const getResumeDetails = async (req, res, next) => {
  try {
    const resume = await Resume.findOne({
      _id: req.params.id,
      user: req.user.id
    });

    if (!resume) {
      return res.status(404).json({
        success: false,
        message: 'Resume not found'
      });
    }

    res.json({
      success: true,
      data: resume
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  uploadResume,
  getResumes,
  getResumeDetails
};