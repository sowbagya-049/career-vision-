const axios = require('axios');
const config = require('../config');

// Mock LinkedIn API service
class LinkedInService {
  constructor() {
    this.baseURL = 'https://api.linkedin.com/v2';
    //this.clientId = config.linkedin.clientId;
    //this.clientSecret = config.linkedin.clientSecret;
  }

  async searchJobs(userProfile) {
    try {
      // In real implementation, you would use LinkedIn's Job Search API
      // For now, return mock data
      return this.getMockJobs(userProfile);
    } catch (error) {
      console.error('LinkedIn API error:', error);
      return [];
    }
  }

  getMockJobs(userProfile) {
    const mockJobs = [
      {
        id: 'linkedin_job_1',
        source: 'linkedin',
        title: 'Senior Software Engineer',
        company: 'Tech Corp',
        location: 'San Francisco, CA',
        description: 'We are looking for a senior software engineer with expertise in React, Node.js, and cloud technologies.',
        url: 'https://linkedin.com/jobs/1',
        salary: { min: 120000, max: 180000, currency: 'USD' },
        jobType: 'full-time',
        requirements: ['5+ years experience', 'React', 'Node.js', 'AWS'],
        skills: ['javascript', 'react', 'node.js', 'aws'],
        tags: ['remote', 'tech', 'startup']
      },
      {
        id: 'linkedin_job_2',
        source: 'linkedin',
        title: 'Full Stack Developer',
        company: 'StartupXYZ',
        location: 'New York, NY',
        description: 'Join our growing team as a full stack developer. Work with modern technologies and build scalable applications.',
        url: 'https://linkedin.com/jobs/2',
        salary: { min: 90000, max: 130000, currency: 'USD' },
        jobType: 'full-time',
        requirements: ['3+ years experience', 'JavaScript', 'Python', 'Database design'],
        skills: ['javascript', 'python', 'mongodb', 'react'],
        tags: ['startup', 'growth', 'equity']
      }
    ];

    // Filter based on user skills for better matching
    return mockJobs.filter(job => 
      job.skills.some(skill => 
        userProfile.skills.some(userSkill => 
          userSkill.toLowerCase().includes(skill.toLowerCase())
        )
      )
    );
  }
}

module.exports = new LinkedInService();// src/controllers/recommendations.js
const Recommendation = require('../models/recommendation');
const User = require('../models/user');
const Milestone = require('../models/milestone');
const linkedinService = require('../services/linkedin');
const indeedService = require('../services/indeed');
const unstopService = require('../services/unstop');
const courseraService = require('../services/coursera');
const udemyService = require('../services/udemy');
const edxService = require('../services/edx');

// Get job recommendations
const getJobRecommendations = async (req, res, next) => {
  try {
    const { limit = 20, page = 1, source } = req.query;
    
    const filter = {
      user: req.user.id,
      type: 'job',
      isActive: true
    };

    if (source) {
      filter.source = source;
    }

    const recommendations = await Recommendation.find(filter)
      .sort({ matchScore: -1, createdAt: -1 })
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit));

    const total = await Recommendation.countDocuments(filter);

    // Mark as viewed
    await Recommendation.updateMany(
      { _id: { $in: recommendations.map(r => r._id) } },
      { viewed: true }
    );

    res.json({
      success: true,
      data: recommendations,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    next(error);
  }
};

// Get course recommendations
const getCourseRecommendations = async (req, res, next) => {
  try {
    const { limit = 20, page = 1, source, level } = req.query;
    
    const filter = {
      user: req.user.id,
      type: 'course',
      isActive: true
    };

    if (source) {
      filter.source = source;
    }

    if (level) {
      filter.level = level;
    }

    const recommendations = await Recommendation.find(filter)
      .sort({ matchScore: -1, createdAt: -1 })
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit));

    const total = await Recommendation.countDocuments(filter);

    // Mark as viewed
    await Recommendation.updateMany(
      { _id: { $in: recommendations.map(r => r._id) } },
      { viewed: true }
    );

    res.json({
      success: true,
      data: recommendations,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    next(error);
  }
};

// Refresh recommendations
const refreshRecommendations = async (req, res, next) => {
  try {
    const userId = req.user.id;
    
    // Get user profile and skills
    const user = await User.findById(userId);
    const milestones = await Milestone.find({ user: userId });
    
    const userSkills = extractUserSkills(user, milestones);
    const userProfile = buildUserProfile(user, milestones);

    // Fetch new recommendations from all sources
    const jobPromises = [
      fetchLinkedInJobs(userProfile),
      fetchIndeedJobs(userProfile),
      fetchUnstopJobs(userProfile)
    ];

    const coursePromises = [
      fetchCourseraRecommendations(userProfile),
      fetchUdemyRecommendations(userProfile),
      fetchEdXRecommendations(userProfile)
    ];

    const [jobResults, courseResults] = await Promise.allSettled([
      Promise.allSettled(jobPromises),
      Promise.allSettled(coursePromises)
    ]);

    let totalJobs = 0;
    let totalCourses = 0;

    // Process job recommendations
    if (jobResults.status === 'fulfilled') {
      for (const result of jobResults.value) {
        if (result.status === 'fulfilled' && result.value) {
          totalJobs += await processJobRecommendations(userId, result.value, userSkills);
        }
      }
    }

    // Process course recommendations
    if (courseResults.status === 'fulfilled') {
      for (const result of courseResults.value) {
        if (result.status === 'fulfilled' && result.value) {
          totalCourses += await processCourseRecommendations(userId, result.value, userSkills);
        }
      }
    }

    res.json({
      success: true,
      message: 'Recommendations refreshed successfully',
      data: {
        jobsAdded: totalJobs,
        coursesAdded: totalCourses
      }
    });
  } catch (error) {
    next(error);
  }
};

// Extract user skills from profile and milestones
const extractUserSkills = (user, milestones) => {
  const skills = new Set();
  
  // Add skills from user profile
  if (user.skills) {
    user.skills.forEach(skill => skills.add(skill.toLowerCase()));
  }

  // Add skills from milestones
  milestones.forEach(milestone => {
    if (milestone.skills) {
      milestone.skills.forEach(skill => skills.add(skill.toLowerCase()));
    }
    if (milestone.technologies) {
      milestone.technologies.forEach(tech => skills.add(tech.toLowerCase()));
    }
  });

  return Array.from(skills)
}
