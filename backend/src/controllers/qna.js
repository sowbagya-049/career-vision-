const Question = require('../models/question');
const Milestone = require('../models/milestone');
const Recommendation = require('../models/recommendation');
const { NlpManager } = require('node-nlp');
const { validationResult } = require('express-validator');

// Initialize NLP manager
const nlpManager = new NlpManager({ languages: ['en'] });

// Train the NLP model with common career questions
const trainNLPModel = () => {
  // Career gaps
  nlpManager.addNamedEntityText('career', 'gap', ['en'], ['gap', 'gaps', 'break', 'breaks', 'unemployment']);
  nlpManager.addNamedEntityText('career', 'skills', ['en'], ['skills', 'skill', 'abilities', 'competencies']);
  nlpManager.addNamedEntityText('career', 'jobs', ['en'], ['jobs', 'positions', 'roles', 'opportunities']);
  nlpManager.addNamedEntityText('career', 'courses', ['en'], ['courses', 'training', 'education', 'learning']);

  // Add training documents
  nlpManager.addDocument('en', 'Do I have career gaps', 'career.gaps');
  nlpManager.addDocument('en', 'Are there any gaps in my career', 'career.gaps');
  nlpManager.addDocument('en', 'Show me my employment breaks', 'career.gaps');

  nlpManager.addDocument('en', 'What are my skills', 'career.skills');
  nlpManager.addDocument('en', 'Which skills do I have', 'career.skills');
  nlpManager.addDocument('en', 'List my competencies', 'career.skills');

  nlpManager.addDocument('en', 'Find jobs for me', 'career.jobs');
  nlpManager.addDocument('en', 'Which jobs match my profile', 'career.jobs');
  nlpManager.addDocument('en', 'Show me job opportunities', 'career.jobs');

  nlpManager.addDocument('en', 'Recommend courses', 'career.courses');
  nlpManager.addDocument('en', 'What courses should I take', 'career.courses');
  nlpManager.addDocument('en', 'Suggest training programs', 'career.courses');

  // Add answers
  nlpManager.addAnswer('en', 'career.gaps', 'Let me analyze your career timeline for any gaps...');
  nlpManager.addAnswer('en', 'career.skills', 'Based on your profile, here are your key skills...');
  nlpManager.addAnswer('en', 'career.jobs', 'Here are job opportunities that match your profile...');
  nlpManager.addAnswer('en', 'career.courses', 'I recommend these courses to enhance your skills...');

  nlpManager.train();
};

// Initialize NLP training
trainNLPModel();

// Process question
const askQuestion = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { question } = req.body;
    const userId = req.user.id;

    // Process with NLP
    const response = await nlpManager.process('en', question);
    
    let answer = '';
    let category = 'general';
    let confidence = response.score * 100;
    let context = {};

    // Generate specific answers based on intent
    switch (response.intent) {
      case 'career.gaps':
        const gapAnalysis = await analyzeCareerGaps(userId);
        answer = gapAnalysis.answer;
        category = 'career-gap';
        context = gapAnalysis.context;
        break;

      case 'career.skills':
        const skillsAnalysis = await analyzeSkills(userId);
        answer = skillsAnalysis.answer;
        category = 'skills';
        context = skillsAnalysis.context;
        break;

      case 'career.jobs':
        const jobsAnalysis = await analyzeJobMatches(userId);
        answer = jobsAnalysis.answer;
        category = 'recommendations';
        context = jobsAnalysis.context;
        break;

      case 'career.courses':
        const coursesAnalysis = await analyzeCourseRecommendations(userId);
        answer = coursesAnalysis.answer;
        category = 'recommendations';
        context = coursesAnalysis.context;
        break;

      default:
        answer = response.answer || "I'm sorry, I couldn't understand your question. Could you please rephrase it or ask about career gaps, skills, job matches, or course recommendations?";
        confidence = Math.max(20, confidence);
    }

    // Save question and answer
    const questionDoc = await Question.create({
      user: userId,
      question,
      answer,
      category,
      confidence,
      context
    });

    res.json({
      success: true,
      data: {
        answer,
        confidence,
        category,
        questionId: questionDoc._id
      }
    });
  } catch (error) {
    next(error);
  }
};

// Analyze career gaps
const analyzeCareerGaps = async (userId) => {
  try {
    const jobMilestones = await Milestone.find({
      user: userId,
      type: 'job'
    }).sort({ startDate: 1 });

    if (jobMilestones.length === 0) {
      return {
        answer: "I don't see any job experiences in your timeline yet. Upload your resume to get a detailed analysis.",
        context: { milestones: [] }
      };
    }

    const gaps = [];
    for (let i = 1; i < jobMilestones.length; i++) {
      const prevEnd = jobMilestones[i - 1].endDate;
      const currentStart = jobMilestones[i].startDate;
      
      if (prevEnd && currentStart) {
        const gapDays = Math.ceil((currentStart - prevEnd) / (1000 * 60 * 60 * 24));
        
        if (gapDays > 30) {
          gaps.push({
            duration: Math.floor(gapDays / 30),
            startDate: prevEnd,
            endDate: currentStart,
            beforeJob: jobMilestones[i - 1].title,
            afterJob: jobMilestones[i].title
          });
        }
      }
    }

    let answer = '';
    if (gaps.length === 0) {
      answer = "Great news! I don't see any significant career gaps in your timeline. Your career progression appears continuous.";
    } else {
      answer = `I found ${gaps.length} career gap${gaps.length > 1 ? 's' : ''} in your timeline:\n\n`;
      gaps.forEach((gap, index) => {
        answer += `${index + 1}. ${gap.duration} month${gap.duration > 1 ? 's' : ''} gap between "${gap.beforeJob}" and "${gap.afterJob}"\n`;
      });
      answer += "\nConsider highlighting any freelance work, courses, or personal projects during these periods to strengthen your profile.";
    }

    return {
      answer,
      context: {
        milestones: jobMilestones.map(m => m._id),
        gaps: gaps.length
      }
    };
  } catch (error) {
    return {
      answer: "I encountered an error while analyzing your career gaps. Please try again.",
      context: {}
    };
  }
};

// Analyze skills
const analyzeSkills = async (userId) => {
  try {
    const milestones = await Milestone.find({ user: userId });
    
    if (milestones.length === 0) {
      return {
        answer: "I don't have enough information about your skills yet. Please upload your resume or add more milestones to your timeline.",
        context: { skills: [] }
      };
    }

    // Extract and count skills
    const skillsMap = new Map();
    milestones.forEach(milestone => {
      if (milestone.skills && milestone.skills.length > 0) {
        milestone.skills.forEach(skill => {
          skillsMap.set(skill.toLowerCase(), (skillsMap.get(skill.toLowerCase()) || 0) + 1);
        });
      }
      if (milestone.technologies && milestone.technologies.length > 0) {
        milestone.technologies.forEach(tech => {
          skillsMap.set(tech.toLowerCase(), (skillsMap.get(tech.toLowerCase()) || 0) + 1);
        });
      }
    });

    const sortedSkills = Array.from(skillsMap.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10);

    if (sortedSkills.length === 0) {
      return {
        answer: "I don't see specific skills listed in your milestones. Consider adding skills to your experiences and projects for better analysis.",
        context: { skills: [] }
      };
    }

    let answer = "Based on your timeline, here are your key skills:\n\n";
    answer += "🔸 **Top Skills:**\n";
    sortedSkills.slice(0, 5).forEach((skill, index) => {
      answer += `${index + 1}. ${skill[0]} (mentioned ${skill[1]} time${skill[1] > 1 ? 's' : ''})\n`;
    });

    if (sortedSkills.length > 5) {
      answer += "\n🔸 **Other Skills:**\n";
      sortedSkills.slice(5).forEach(skill => {
        answer += `• ${skill[0]}\n`;
      });
    }

    answer += "\nThese skills show your technical expertise and experience across different areas.";

    return {
      answer,
      context: {
        skills: sortedSkills.map(s => s[0]),
        experience: `${milestones.length} milestones`
      }
    };
  } catch (error) {
    return {
      answer: "I encountered an error while analyzing your skills. Please try again.",
      context: {}
    };
  }
};

// Analyze job matches
const analyzeJobMatches = async (userId) => {
  try {
    const recommendations = await Recommendation.find({
      user: userId,
      type: 'job',
      isActive: true
    })
    .sort({ matchScore: -1 })
    .limit(5);

    if (recommendations.length === 0) {
      return {
        answer: "I don't have any job recommendations for you yet. Make sure your profile is complete and try refreshing recommendations.",
        context: {}
      };
    }

    let answer = `I found ${recommendations.length} job opportunities that match your profile:\n\n`;
    
    recommendations.forEach((job, index) => {
      answer += `${index + 1}. **${job.title}** at ${job.company}\n`;
      answer += `   📍 ${job.location} | Match: ${job.matchScore}%\n`;
      if (job.salary && job.salary.min) {
        answer += `   💰 ${job.salary.min.toLocaleString()} - ${job.salary.max.toLocaleString()}\n`;
      }
      answer += `   🏷️ ${job.skills.slice(0, 3).join(', ')}\n\n`;
    });

    answer += "These positions align well with your skills and experience. Check the Recommendations page for more details and application links.";

    return {
      answer,
      context: {
        recommendations: recommendations.length,
        averageMatch: Math.round(recommendations.reduce((sum, r) => sum + r.matchScore, 0) / recommendations.length)
      }
    };
  } catch (error) {
    return {
      answer: "I encountered an error while finding job matches. Please try again.",
      context: {}
    };
  }
};

// Analyze course recommendations
const analyzeCourseRecommendations = async (userId) => {
  try {
    const recommendations = await Recommendation.find({
      user: userId,
      type: 'course',
      isActive: true
    })
    .sort({ matchScore: -1 })
    .limit(5);

    if (recommendations.length === 0) {
      return {
        answer: "I don't have any course recommendations for you yet. Complete your profile and refresh recommendations to get personalized suggestions.",
        context: {}
      };
    }

    let answer = `Here are ${recommendations.length} courses I recommend for your career growth:\n\n`;
    
    recommendations.forEach((course, index) => {
      answer += `${index + 1}. **${course.title}**\n`;
      answer += `   🏫 ${course.provider} | Level: ${course.level}\n`;
      answer += `   ⏱️ Duration: ${course.duration} | Match: ${course.matchScore}%\n`;
      if (course.price && course.price.free) {
        answer += `   💰 Free\n`;
      } else if (course.price && course.price.amount) {
        answer += `   💰 ${course.price.amount}\n`;
      }
      answer += `   🎯 Skills: ${course.skills.slice(0, 3).join(', ')}\n\n`;
    });

    answer += "These courses will help you develop new skills and advance your career. Visit the Recommendations page to enroll.";

    return {
      answer,
      context: {
        recommendations: recommendations.length,
        levels: [...new Set(recommendations.map(r => r.level))]
      }
    };
  } catch (error) {
    return {
      answer: "I encountered an error while finding course recommendations. Please try again.",
      context: {}
    };
  }
};

// Get question history
const getQuestionHistory = async (req, res, next) => {
  try {
    const { limit = 20, page = 1 } = req.query;

    const questions = await Question.find({ user: req.user.id })
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit));

    const total = await Question.countDocuments({ user: req.user.id });

    res.json({
      success: true,
      data: questions,
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

// Mark question as helpful/not helpful
const rateAnswer = async (req, res, next) => {
  try {
    const { helpful } = req.body;
    
    const question = await Question.findOneAndUpdate(
      { _id: req.params.id, user: req.user.id },
      { helpful: helpful === true },
      { new: true }
    );

    if (!question) {
      return res.status(404).json({
        success: false,
        message: 'Question not found'
      });
    }

    res.json({
      success: true,
      data: question
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  askQuestion,
  getQuestionHistory,
  rateAnswer
};