const axios = require('axios');
const config = require('../config');

class CourseraService {
  constructor() {
    this.baseURL = 'https://api.coursera.org/api';
    //this.apiKey = config.coursera.apiKey;
  }

  async searchCourses(userProfile) {
    try {
      // Mock Coursera API implementation
      return this.getMockCourses(userProfile);
    } catch (error) {
      console.error('Coursera API error:', error);
      return [];
    }
  }

  getMockCourses(userProfile) {
    const mockCourses = [
      {
        id: 'coursera_course_1',
        source: 'coursera',
        title: 'Advanced React Development',
        provider: 'Coursera',
        instructor: 'John Doe, Meta',
        description: 'Master advanced React concepts including hooks, context, and performance optimization.',
        url: 'https://coursera.org/course/1',
        duration: '6 weeks',
        level: 'advanced',
        price: { amount: 49, currency: 'USD', free: false },
        rating: { score: 4.8, count: 1200 },
        skills: ['react', 'javascript', 'web development'],
        tags: ['frontend', 'react', 'advanced']
      },
      {
        id: 'coursera_course_2',
        source: 'coursera',
        title: 'Machine Learning for Everyone',
        provider: 'Coursera',
        instructor: 'Dr. Jane Smith, Stanford',
        description: 'Introduction to machine learning concepts and practical applications.',
        url: 'https://coursera.org/course/2',
        duration: '8 weeks',
        level: 'beginner',
        price: { amount: 0, currency: 'USD', free: true },
        rating: { score: 4.6, count: 2500 },
        skills: ['machine learning', 'python', 'data science'],
        tags: ['ai', 'ml', 'beginner']
      },
      {
        id: 'coursera_course_3',
        source: 'coursera',
        title: 'Cloud Computing with AWS',
        provider: 'Coursera',
        instructor: 'AWS Team',
        description: 'Learn to deploy and manage applications on Amazon Web Services.',
        url: 'https://coursera.org/course/3',
        duration: '10 weeks',
        level: 'intermediate',
        price: { amount: 79, currency: 'USD', free: false },
        rating: { score: 4.7, count: 1800 },
        skills: ['aws', 'cloud computing', 'devops'],
        tags: ['cloud', 'aws', 'infrastructure']
      }
    ];

    // Filter based on user interests and current skill gaps
    return mockCourses.filter(course => 
      course.skills.some(skill => 
        userProfile.skills.some(userSkill => 
          skill.toLowerCase().includes(userSkill.toLowerCase()) ||
          userSkill.toLowerCase().includes(skill.toLowerCase())
        )
      ) || Math.random() > 0.5 // Some randomness for discovery
    );
  }
}

module.exports = new CourseraService();
