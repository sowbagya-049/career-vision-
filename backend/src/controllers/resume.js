const Resume = require('../models/resume');
const Milestone = require('../models/milestone');
const textProcessor = require('../services/text-processor');
const { validationResult } = require('express-validator');
const fs = require('fs').promises;
const path = require('path');

// Upload and process resume
const uploadResume = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No file uploaded'
      });
    }

    const resume = await Resume.create({
      user: req.user.id,
      filename: req.file.filename,
      originalName: req.file.originalname,
      filePath: req.file.path,
      fileSize: req.file.size,
      mimeType: req.file.mimetype,
      processingStatus: 'processing'
    });

    // Process resume in background
    processResumeAsync(resume._id);

    res.status(201).json({
      success: true,
      data: {
        resumeId: resume._id,
        filename: resume.originalName,
        status: 'processing'
      }
    });
  } catch (error) {
    next(error);
  }
};

// Background processing function
const processResumeAsync = async (resumeId) => {
  try {
    const resume = await Resume.findById(resumeId);
    if (!resume) return;

    // Extract text from file
    const extractedText = await textProcessor.extractTextFromFile(resume.filePath, resume.mimeType);
    
    // Parse extracted text
    const extractedData = await textProcessor.parseResumeText(extractedText);
    
    // Create milestones from extracted data
    const milestones = await createMilestonesFromData(resume.user, extractedData, resume._id);

    // Update resume
    await Resume.findByIdAndUpdate(resumeId, {
      extractedText,
      extractedData,
      processingStatus: 'completed',
      milestonesCreated: milestones.length
    });

  } catch (error) {
    console.error('Resume processing error:', error);
    await Resume.findByIdAndUpdate(resumeId, {
      processingStatus: 'failed',
      processingError: error.message
    });
  }
};

// Create milestones from extracted data
const createMilestonesFromData = async (userId, data, resumeId) => {
  const milestones = [];

  try {
    // Create experience milestones
    if (data.experience && data.experience.length > 0) {
      for (const exp of data.experience) {
        const milestone = await Milestone.create({
          user: userId,
          title: exp.title || 'Work Experience',
          description: exp.description || 'Professional experience',
          type: 'job',
          company: exp.company,
          location: exp.location,
          startDate: exp.startDate || new Date(),
          endDate: exp.endDate,
          skills: exp.skills || [],
          extractedFrom: {
            resumeId: resumeId,
            confidence: 85
          }
        });
        milestones.push(milestone);
      }
    }

    // Create education milestones
    if (data.education && data.education.length > 0) {
      for (const edu of data.education) {
        const milestone = await Milestone.create({
          user: userId,
          title: edu.degree || 'Education',
          description: `${edu.degree} from ${edu.institution}`,
          type: 'education',
          company: edu.institution,
          location: edu.location,
          startDate: edu.startDate || new Date(),
          endDate: edu.endDate,
          extractedFrom: {
            resumeId: resumeId,
            confidence: 90
          }
        });
        milestones.push(milestone);
      }
    }

    // Create certification milestones
    if (data.certifications && data.certifications.length > 0) {
      for (const cert of data.certifications) {
        const milestone = await Milestone.create({
          user: userId,
          title: cert.name,
          description: `Certification from ${cert.issuer}`,
          type: 'certification',
          company: cert.issuer,
          startDate: cert.date || new Date(),
          url: cert.url,
          extractedFrom: {
            resumeId: resumeId,
            confidence: 95
          }
        });
        milestones.push(milestone);
      }
    }

    // Create project milestones
    if (data.projects && data.projects.length > 0) {
      for (const project of data.projects) {
        const milestone = await Milestone.create({
          user: userId,
          title: project.name,
          description: project.description,
          type: 'project',
          startDate: new Date(),
          technologies: project.technologies || [],
          url: project.url,
          extractedFrom: {
            resumeId: resumeId,
            confidence: 75
          }
        });
        milestones.push(milestone);
      }
    }

    return milestones;
  } catch (error) {
    console.error('Error creating milestones:', error);
    return milestones;
  }
};

// Get user's resumes
const getResumes = async (req, res, next) => {
  try {
    const resumes = await Resume.find({ user: req.user.id })
      .sort({ createdAt: -1 })
      .select('-extractedText -extractedData');

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

// Delete resume
const deleteResume = async (req, res, next) => {
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

    // Delete file
    try {
      await fs.unlink(resume.filePath);
    } catch (fileError) {
      console.error('Error deleting file:', fileError);
    }

    // Delete related milestones
    await Milestone.deleteMany({
      'extractedFrom.resumeId': resume._id
    });

    // Delete resume
    await Resume.findByIdAndDelete(resume._id);

    res.json({
      success: true,
      message: 'Resume deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  uploadResume,
  getResumes,
  getResumeDetails,
  deleteResume
};
