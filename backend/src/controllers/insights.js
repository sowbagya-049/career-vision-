const Milestone = require('../models/milestone');
const Recommendation = require('../models/recommendation');
const Question = require('../models/question');
const Resume = require('../models/resume');

// Get career insights
const getCareerInsights = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const insights = [];

    // Career gap analysis
    const gapInsight = await analyzeCareerGapsInsight(userId);
    if (gapInsight) insights.push(gapInsight);

    // Skills strength analysis
    const skillsInsight = await analyzeSkillsStrength(userId);
    if (skillsInsight) insights.push(skillsInsight);

    // Recommendation match analysis
    const matchInsight = await analyzeRecommendationMatch(userId);
    if (matchInsight) insights.push(matchInsight);

    // Career growth trend
    const trendInsight = await analyzeCareerTrend(userId);
    if (trendInsight) insights.push(trendInsight);

    // Profile completeness
    const completenessInsight = await analyzeProfileCompleteness(userId);
    if (completenessInsight) insights.push(completenessInsight);

    res.json({
      success: true,
      data: insights
    });
  } catch (error) {
    next(error);
  }
};

// Get analytics data for charts
const getAnalyticsData = async (req, res, next) => {
  try {
    const userId = req.user.id;

    // Career gaps data
    const careerGaps = await getCareerGapsData(userId);
    
    // Skills distribution
    const skillsDistribution = await getSkillsDistributionData(userId);
    
    // Career growth trend
    const careerGrowthTrend = await getCareerGrowthData(userId);
    
    // Industry comparison (mock data for demo)
    const industryComparison = await getIndustryComparisonData(userId);

    res.json({
      success: true,
      data: {
        careerGaps,
        skillsDistribution,
        careerGrowthTrend,
        industryComparison
      }
    });
  } catch (error) {
    next(error);
  }
};

// Analyze career gaps for insights
const analyzeCareerGapsInsight = async (userId) => {
  try {
    const jobMilestones = await Milestone.find({
      user: userId,
      type: 'job'
    }).sort({ startDate: 1 });

    if (jobMilestones.length < 2) return null;

    let totalGapMonths = 0;
    let gapCount = 0;

    for (let i = 1; i < jobMilestones.length; i++) {
      const prevEnd = jobMilestones[i - 1].endDate;
      const currentStart = jobMilestones[i].startDate;
      
      if (prevEnd && currentStart) {
        const gapDays = Math.ceil((currentStart - prevEnd) / (1000 * 60 * 60 * 24));
        
        if (gapDays > 30) {
          totalGapMonths += Math.floor(gapDays / 30);
          gapCount++;
        }
      }
    }

    if (gapCount === 0) {
      return {
        id: 'gap_analysis',
        type: 'strength',
        title: 'Continuous Career Path',
        description: 'Great! Your career shows no significant gaps, indicating consistent professional growth.',
        score: 95
      };
    } else if (totalGapMonths <= 6) {
      return {
        id: 'gap_analysis',
        type: 'recommendation',
        title: 'Minor Career Gaps',
        description: `You have ${gapCount} small gap(s) totaling ${totalGapMonths} months. Consider highlighting any learning or projects during these periods.`,
        score: 75
      };
    } else {
      return {
        id: 'gap_analysis',
        type: 'gap',
        title: 'Career Gaps Detected',
        description: `${gapCount} gap(s) totaling ${totalGapMonths} months found. Consider addressing these in your profile or during interviews.`,
        score: 60
      };
    }
  } catch (error) {
    console.error('Gap analysis error:', error);
    return null;
  }
};

// Analyze skills strength
const analyzeSkillsStrength = async (userId) => {
  try {
    const milestones = await Milestone.find({ user: userId });
    const skillsMap = new Map();
    
    milestones.forEach(milestone => {
      if (milestone.skills) {
        milestone.skills.forEach(skill => {
          skillsMap.set(skill.toLowerCase(), (skillsMap.get(skill.toLowerCase()) || 0) + 1);
        });
      }
      if (milestone.technologies) {
        milestone.technologies.forEach(tech => {
          skillsMap.set(tech.toLowerCase(), (skillsMap.get(tech.toLowerCase()) || 0) + 1);
        });
      }
    });

    const totalSkills = skillsMap.size;
    const topSkills = Array.from(skillsMap.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);

    if (totalSkills === 0) {
      return {
        id: 'skills_analysis',
        type: 'gap',
        title: 'Missing Skills Information',
        description: 'No skills found in your profile. Add skills to your experiences and projects for better opportunities.',
        score: 30
      };
    } else if (totalSkills >= 10) {
      return {
        id: 'skills_analysis',
        type: 'strength',
        title: 'Strong Skill Portfolio',
        description: `Excellent! You have ${totalSkills} skills across different areas. Top skills: ${topSkills.map(s => s[0]).slice(0, 3).join(', ')}.`,
        score: 90
      };
    } else {
      return {
        id: 'skills_analysis',
        type: 'recommendation',
        title: 'Developing Skill Set',
        description: `You have ${totalSkills} skills. Consider expanding your skillset in trending technologies to increase opportunities.`,
        score: 70
      };
    }
  } catch (error) {
    console.error('Skills analysis error:', error);
    return null;
  }
};

// Analyze recommendation matches
const analyzeRecommendationMatch = async (userId) => {
  try {
    const recommendations = await Recommendation.find({
      user: userId,
      isActive: true
    });

    if (recommendations.length === 0) {
      return {
        id: 'match_analysis',
        type: 'gap',
        title: 'No Recommendations Yet',
        description: 'Complete your profile and refresh recommendations to get personalized job and course suggestions.',
        score: 40
      };
    }

    const avgMatchScore = recommendations.reduce((sum, r) => sum + r.matchScore, 0) / recommendations.length;
    const highMatchCount = recommendations.filter(r => r.matchScore >= 80).length;

    if (avgMatchScore >= 75) {
      return {
        id: 'match_analysis',
        type: 'strength',
        title: 'High-Quality Matches',
        description: `Excellent! ${highMatchCount} recommendations with 80%+ match. Your profile aligns well with market opportunities.`,
        score: Math.round(avgMatchScore)
      };
    } else if (avgMatchScore >= 60) {
      return {
        id: 'match_analysis',
        type: 'trend',
        title: 'Good Market Alignment',
        description: `Your profile matches ${Math.round(avgMatchScore)}% with available opportunities. Consider refining your skills for better matches.`,
        score: Math.round(avgMatchScore)
      };
    } else {
      return {
        id: 'match_analysis',
        type: 'recommendation',
        title: 'Improve Profile Match',
        description: `Current match score: ${Math.round(avgMatchScore)}%. Update your skills and experiences to improve recommendation quality.`,
        score: Math.round(avgMatchScore)
      };
    }
  } catch (error) {
    console.error('Match analysis error:', error);
    return null;
  }
};

// Analyze career trend
const analyzeCareerTrend = async (userId) => {
  try {
    const jobMilestones = await Milestone.find({
      user: userId,
      type: 'job'
    }).sort({ startDate: 1 });

    if (jobMilestones.length < 2) {
      return {
        id: 'trend_analysis',
        type: 'trend',
        title: 'Early Career Stage',
        description: 'Add more work experiences to analyze your career growth trend.',
        score: 50
      };
    }

    // Simple trend analysis based on titles and companies
    const hasProgressiveRoles = jobMilestones.some((milestone, index) => {
      if (index === 0) return false;
      const currentTitle = milestone.title.toLowerCase();
      return currentTitle.includes('senior') || currentTitle.includes('lead') || currentTitle.includes('manager');
    });

    const companySizes = jobMilestones.map(m => {
      // Mock company size analysis based on company name (in real app, use external API)
      return Math.random() > 0.5 ? 'large' : 'medium';
    });

    if (hasProgressiveRoles) {
      return {
        id: 'trend_analysis',
        type: 'strength',
        title: 'Upward Career Trajectory',
        description: 'Great! Your career shows clear progression with senior roles and increasing responsibilities.',
        score: 85
      };
    } else {
      return {
        id: 'trend_analysis',
        type: 'trend',
        title: 'Steady Career Growth',
        description: 'Your career shows consistent experience. Consider roles with increased leadership or technical responsibilities.',
        score: 70
      };
    }
  } catch (error) {
    console.error('Trend analysis error:', error);
    return null;
  }
};

// Analyze profile completeness
const analyzeProfileCompleteness = async (userId) => {
  try {
    const milestones = await Milestone.find({ user: userId });
    const resumes = await Resume.find({ user: userId });
    
    let completenessScore = 0;
    
    // Has milestones (30 points)
    if (milestones.length > 0) completenessScore += 30;
    
    // Has job experience (25 points)
    if (milestones.some(m => m.type === 'job')) completenessScore += 25;
    
    // Has education (20 points)
    if (milestones.some(m => m.type === 'education')) completenessScore += 20;
    
    // Has resume uploaded (15 points)
    if (resumes.length > 0) completenessScore += 15;
    
    // Has skills (10 points)
    if (milestones.some(m => m.skills && m.skills.length > 0)) completenessScore += 10;

    if (completenessScore >= 90) {
      return {
        id: 'profile_completeness',
        type: 'strength',
        title: 'Complete Profile',
        description: 'Excellent! Your profile is comprehensive and ready for opportunities.',
        score: completenessScore
      };
    } else if (completenessScore >= 70) {
      return {
        id: 'profile_completeness',
        type: 'recommendation',
        title: 'Good Profile Foundation',
        description: 'Your profile is well-developed. Add more details to maximize opportunities.',
        score: completenessScore
      };
    } else {
      return {
        id: 'profile_completeness',
        type: 'gap',
        title: 'Incomplete Profile',
        description: 'Complete your profile by adding work experience, education, and skills for better recommendations.',
        score: completenessScore
      };
    }
  } catch (error) {
    console.error('Completeness analysis error:', error);
    return null;
  }
};

// Get career gaps data for chart
const getCareerGapsData = async (userId) => {
  try {
    const jobMilestones = await Milestone.find({
      user: userId,
      type: 'job'
    }).sort({ startDate: 1 });

    const gapsData = [];
    const years = [];

    // Generate data for last 5 years
    const currentYear = new Date().getFullYear();
    for (let i = 4; i >= 0; i--) {
      const year = currentYear - i;
      years.push(year);
      
      // Calculate months active in this year
      let activeMonths = 0;
      
      jobMilestones.forEach(milestone => {
        const start = new Date(milestone.startDate);
        const end = milestone.endDate ? new Date(milestone.endDate) : new Date();
        
        const yearStart = new Date(year, 0, 1);
        const yearEnd = new Date(year, 11, 31);
        
        const overlapStart = start > yearStart ? start : yearStart;
        const overlapEnd = end < yearEnd ? end : yearEnd;
        
        if (overlapStart <= overlapEnd) {
          const overlapMonths = Math.ceil((overlapEnd - overlapStart) / (1000 * 60 * 60 * 24 * 30));
          activeMonths += Math.min(overlapMonths, 12);
        }
      });
      
      gapsData.push(Math.min(activeMonths, 12));
    }

    return years.map((year, index) => ({
      year: year.toString(),
      activeMonths: gapsData[index]
    }));
  } catch (error) {
    console.error('Career gaps data error:', error);
    return [];
  }
};

// Get skills distribution data
const getSkillsDistributionData = async (userId) => {
  try {
    const milestones = await Milestone.find({ user: userId });
    const skillsMap = new Map();
    
    milestones.forEach(milestone => {
      if (milestone.skills) {
        milestone.skills.forEach(skill => {
          skillsMap.set(skill.toLowerCase(), (skillsMap.get(skill.toLowerCase()) || 0) + 1);
        });
      }
    });

    return Array.from(skillsMap.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8)
      .map(([skill, count]) => ({
        skill,
        count
      }));
  } catch (error) {
    console.error('Skills distribution error:', error);
    return [];
  }
};

// Get career growth data
const getCareerGrowthData = async (userId) => {
  try {
    const milestones = await Milestone.find({ user: userId }).sort({ startDate: 1 });
    
    // Mock skill and experience level calculation
    const growthData = [];
    let cumulativeSkills = 0;
    let cumulativeExperience = 0;

    const currentYear = new Date().getFullYear();
    for (let i = 4; i >= 0; i--) {
      const year = currentYear - i;
      
      // Count milestones up to this year
      const milestonesUpToYear = milestones.filter(m => 
        new Date(m.startDate).getFullYear() <= year
      );
      
      const skillsSet = new Set();
      milestonesUpToYear.forEach(m => {
        if (m.skills) {
          m.skills.forEach(skill => skillsSet.add(skill.toLowerCase()));
        }
      });
      
      cumulativeSkills = skillsSet.size;
      cumulativeExperience = milestonesUpToYear.filter(m => m.type === 'job').length * 20 + 
                           milestonesUpToYear.filter(m => m.type === 'education').length * 15 +
                           milestonesUpToYear.filter(m => m.type === 'certification').length * 10;
      
      growthData.push({
        year: year.toString(),
        skillLevel: Math.min(cumulativeSkills * 5, 100),
        experienceLevel: Math.min(cumulativeExperience, 100)
      });
    }

    return growthData;
  } catch (error) {
    console.error('Career growth data error:', error);
    return [];
  }
};

// Get industry comparison data (mock)
const getIndustryComparisonData = async (userId) => {
  try {
    // Mock industry comparison data
    return [
      { metric: 'Experience Level', user: 75, industry: 65 },
      { metric: 'Skill Diversity', user: 80, industry: 70 },
      { metric: 'Career Growth', user: 70, industry: 68 },
      { metric: 'Certification Level', user: 60, industry: 55 },
      { metric: 'Profile Completeness', user: 85, industry: 60 }
    ];
  } catch (error) {
    console.error('Industry comparison error:', error);
    return [];
  }
};

// Generate career report
const generateReport = async (req, res, next) => {
  try {
    const userId = req.user.id;
    
    // Get all insights and analytics
    const insights = await getCareerInsights({ user: { id: userId } }, { json: () => {} });
    const analytics = await getAnalyticsData({ user: { id: userId } }, { json: () => {} });
    const milestones = await Milestone.find({ user: userId }).sort({ startDate: -1 });
    const recommendations = await Recommendation.find({ 
      user: userId, 
      isActive: true 
    }).sort({ matchScore: -1 }).limit(10);

    const report = {
      generatedAt: new Date(),
      userId,
      summary: {
        totalMilestones: milestones.length,
        totalRecommendations: recommendations.length,
        profileCompleteness: 85, // This would be calculated
        overallScore: 78
      },
      insights: insights,
      topRecommendations: recommendations.slice(0, 5),
      careerTimeline: milestones,
      analytics: analytics
    };

    res.json({
      success: true,
      data: report
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getCareerInsights,
  getAnalyticsData,
  generateReport
};
