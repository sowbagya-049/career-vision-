const Milestone = require('../models/milestone');
const { validationResult } = require('express-validator');

// Get user's milestones
const getMilestones = async (req, res, next) => {
  try {
    const { type, limit = 50, page = 1 } = req.query;
    
    const filter = { user: req.user.id };
    if (type && type !== 'all') {
      filter.type = type;
    }

    const milestones = await Milestone.find(filter)
      .sort({ startDate: -1 })
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit))
      .populate('extractedFrom.resumeId', 'originalName');

    const total = await Milestone.countDocuments(filter);

    res.json({
      success: true,
      data: milestones,
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

// Create milestone
const createMilestone = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const milestone = await Milestone.create({
      ...req.body,
      user: req.user.id
    });

    res.status(201).json({
      success: true,
      data: milestone
    });
  } catch (error) {
    next(error);
  }
};

// Update milestone
const updateMilestone = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const milestone = await Milestone.findOneAndUpdate(
      { _id: req.params.id, user: req.user.id },
      req.body,
      { new: true, runValidators: true }
    );

    if (!milestone) {
      return res.status(404).json({
        success: false,
        message: 'Milestone not found'
      });
    }

    res.json({
      success: true,
      data: milestone
    });
  } catch (error) {
    next(error);
  }
};

// Delete milestone
const deleteMilestone = async (req, res, next) => {
  try {
    const milestone = await Milestone.findOneAndDelete({
      _id: req.params.id,
      user: req.user.id
    });

    if (!milestone) {
      return res.status(404).json({
        success: false,
        message: 'Milestone not found'
      });
    }

    res.json({
      success: true,
      message: 'Milestone deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};

// Get timeline analytics
const getTimelineAnalytics = async (req, res, next) => {
  try {
    const userId = req.user.id;

    // Get milestones by type
    const milestonesByType = await Milestone.aggregate([
      { $match: { user: userId } },
      { $group: { _id: '$type', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);

    // Get milestones by year
    const milestonesByYear = await Milestone.aggregate([
      { $match: { user: userId } },
      {
        $group: {
          _id: { $year: '$startDate' },
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    // Get career gaps
    const milestones = await Milestone.find({
      user: userId,
      type: 'job'
    }).sort({ startDate: 1 });

    const careerGaps = [];
    for (let i = 1; i < milestones.length; i++) {
      const prevEnd = milestones[i - 1].endDate || new Date();
      const currentStart = milestones[i].startDate;
      
      const gapDays = Math.ceil((currentStart - prevEnd) / (1000 * 60 * 60 * 24));
      
      if (gapDays > 30) {
        careerGaps.push({
          startDate: prevEnd,
          endDate: currentStart,
          duration: Math.floor(gapDays / 30) // months
        });
      }
    }

    // Get skills frequency
    const skillsData = await Milestone.aggregate([
      { $match: { user: userId } },
      { $unwind: '$skills' },
      { $group: { _id: '$skills', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 10 }
    ]);

    res.json({
      success: true,
      data: {
        milestonesByType,
        milestonesByYear,
        careerGaps,
        topSkills: skillsData,
        totalMilestones: await Milestone.countDocuments({ user: userId })
      }
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getMilestones,
  createMilestone,
  updateMilestone,
  deleteMilestone,
  getTimelineAnalytics
};
