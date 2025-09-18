const axios = require('axios');
const config = require('../config');

class UdemyService {
  constructor() {
    this.baseURL = 'https://www.udemy.com/api-2.0';
    //this.clientId = config.udemy.clientId;
    //this.clientSecret = config.udemy.clientSecret;
  }

  async searchCourses(userProfile) {
    try {
      // Mock Udemy API implementation
      return this.getMockCourses(userProfile);
    } catch (error) {
      console.error('Udemy API error:', error);
      return [];
    }
  }

  getMockCourses(userProfile) {
    const mockCourses = [
      {
        id: 'udemy_course_1',
        source: 'udemy',
        title: 'Complete JavaScript Bootcamp',
        provider: 'Udemy',
        instructor: 'Jonas Schmedtmann',
        description: 'Master JavaScript from scratch with projects, challenges, and real-world examples.',
        url: 'https://udemy.com/course/1',
        duration: '69 hours',
        level: 'beginner',
        price: { amount: 89.99, currency: 'USD', free: false },
        rating: { score: 4.9, count: 15000 },
        skills: ['javascript', 'web development', 'programming'],
        tags: ['javascript', 'bootcamp', 'comprehensive']
      },
      {
        id: 'udemy_course_2',
        source: 'udemy',
        title: 'Docker and Kubernetes Complete Guide',
        provider: 'Udemy',
        instructor: 'Stephen Grider',
        description: 'Build, test, and deploy Docker applications with Kubernetes.',
        url: 'https://udemy.com/course/2',
        duration: '21.5 hours',
        level: 'intermediate',
        price: { amount: 84.99, currency: 'USD', free: false },
        rating: { score: 4.8, count: 8500 },
        skills: ['docker', 'kubernetes', 'devops'],
        tags: ['devops', 'containerization', 'orchestration']
      },
      {
        id: 'udemy_course_3',
        source: 'udemy',
        title: 'Python for Data Science and Machine Learning',
        provider: 'Udemy',
        instructor: 'Jose Portilla',
        description: 'Learn Python for data analysis, visualization, and machine learning.',
        url: 'https://udemy.com/course/3',
        duration: '25 hours',
        level: 'beginner',
        price: { amount: 94.99, currency: 'USD', free: false },
        rating: { score: 4.7, count: 12000 },
        skills: ['python', 'data science', 'machine learning'],
        tags: ['python', 'data', 'ml']
      }
    ];

    return mockCourses.filter(course => 
      course.skills.some(skill => 
        userProfile.skills.some(userSkill => 
          skill.toLowerCase().includes(userSkill.toLowerCase()) ||
          userSkill.toLowerCase().includes(skill.toLowerCase())
        )
      ) || Math.random() > 0.4
    );
  }
}

module.exports = new UdemyService();
