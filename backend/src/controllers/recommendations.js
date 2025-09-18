const Recommendation = require('../models/recommendation');
const Milestone = require('../models/milestone');

// ===================== GET JOB RECOMMENDATIONS =====================
const getJobRecommendations = async (req, res) => {
  try {
    const { refresh = false } = req.query;

    if (refresh) {
      await refreshJobRecommendations(req.user._id);
    }

    const recommendations = await Recommendation.find({
      userId: req.user._id,
      type: 'job',
      isActive: true
    }).sort({ matchScore: -1, createdAt: -1 });

    res.json({ success: true, data: recommendations });
  } catch (error) {
    console.error('Get job recommendations error:', error);
    res.status(500).json({ success: false, message: 'Error fetching job recommendations' });
  }
};

// ===================== GET COURSE RECOMMENDATIONS =====================
const getCourseRecommendations = async (req, res) => {
  try {
    const { refresh = false } = req.query;

    if (refresh) {
      await refreshCourseRecommendations(req.user._id);
    }

    const recommendations = await Recommendation.find({
      userId: req.user._id,
      type: 'course',
      isActive: true
    }).sort({ matchScore: -1, createdAt: -1 });

    res.json({ success: true, data: recommendations });
  } catch (error) {
    console.error('Get course recommendations error:', error);
    res.status(500).json({ success: false, message: 'Error fetching course recommendations' });
  }
};

// ===================== REFRESH RECOMMENDATIONS =====================
const refreshRecommendations = async (req, res) => {
  try {
    await Promise.all([
      refreshJobRecommendations(req.user._id),
      refreshCourseRecommendations(req.user._id)
    ]);

    res.json({ success: true, message: 'Recommendations refreshed successfully' });
  } catch (error) {
    console.error('Refresh recommendations error:', error);
    res.status(500).json({ success: false, message: 'Error refreshing recommendations' });
  }
};

// ===================== TOGGLE SAVE RECOMMENDATION =====================
const toggleSaveRecommendation = async (req, res) => {
  try {
    const recommendation = await Recommendation.findOne({
      _id: req.params.id,
      userId: req.user._id
    });

    if (!recommendation) {
      return res.status(404).json({ success: false, message: 'Recommendation not found' });
    }

    recommendation.isSaved = !recommendation.isSaved;
    await recommendation.save();

    res.json({ success: true, data: recommendation });
  } catch (error) {
    console.error('Toggle save recommendation error:', error);
    res.status(500).json({ success: false, message: 'Error toggling save' });
  }
};

// ===================== MARK AS APPLIED =====================
const markAsApplied = async (req, res) => {
  try {
    const recommendation = await Recommendation.findOne({
      _id: req.params.id,
      userId: req.user._id
    });

    if (!recommendation) {
      return res.status(404).json({ success: false, message: 'Recommendation not found' });
    }

    recommendation.isApplied = true;
    recommendation.appliedAt = new Date();
    await recommendation.save();

    res.json({ success: true, data: recommendation });
  } catch (error) {
    console.error('Mark as applied error:', error);
    res.status(500).json({ success: false, message: 'Error marking as applied' });
  }
};

// ===================== GET RECOMMENDATION STATS =====================
const getRecommendationStats = async (req, res) => {
  try {
    const stats = await Recommendation.aggregate([
      { $match: { userId: req.user._id } },
      {
        $group: {
          _id: "$type",
          total: { $sum: 1 },
          saved: { $sum: { $cond: ["$isSaved", 1, 0] } },
          applied: { $sum: { $cond: ["$isApplied", 1, 0] } }
        }
      }
    ]);

    res.json({ success: true, data: stats });
  } catch (error) {
    console.error('Get recommendation stats error:', error);
    res.status(500).json({ success: false, message: 'Error fetching stats' });
  }
};

// ===================== INTERNAL HELPERS =====================
const refreshJobRecommendations = async (userId) => {
  try {
    const milestones = await Milestone.find({ userId }).sort({ date: -1 });
    const userSkills = [...new Set(milestones.flatMap(m => m.skills || []))];
    const recentJobs = milestones.filter(m => m.type === 'job').slice(0, 3);

    await Recommendation.updateMany({ userId, type: 'job' }, { isActive: false });

    // TODO: Replace with actual job fetch (LinkedIn/Indeed API)
    const mockJobs = generateMockJobRecommendations(userSkills, recentJobs);

    for (const rec of mockJobs) {
      const recommendation = new Recommendation({ ...rec, userId, type: 'job' });
      await recommendation.save();
    }

    return mockJobs;
  } catch (error) {
    console.error('Refresh job recommendations error:', error);
    throw error;
  }
};

const refreshCourseRecommendations = async (userId) => {
  try {
    const milestones = await Milestone.find({ userId }).sort({ date: -1 });
    const userSkills = [...new Set(milestones.flatMap(m => m.skills || []))];

    await Recommendation.updateMany({ userId, type: 'course' }, { isActive: false });

    // TODO: Replace with actual course fetch (Coursera/Udemy API)
    const mockCourses = generateMockCourseRecommendations(userSkills);

    for (const rec of mockCourses) {
      const recommendation = new Recommendation({ ...rec, userId, type: 'course' });
      await recommendation.save();
    }

    return mockCourses;
  } catch (error) {
    console.error('Refresh course recommendations error:', error);
    throw error;
  }
};

// ===================== EXPORTS =====================
module.exports = {
  getJobRecommendations,
  getCourseRecommendations,
  refreshRecommendations,
  toggleSaveRecommendation,
  markAsApplied,
  getRecommendationStats
};
