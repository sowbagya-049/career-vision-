const axios = require('axios');
const config = require('../config');

class EdXService {
  constructor() {
    this.baseURL = 'https://api.edx.org/api/courses/v1';
    //this.apiKey = config.edx.apiKey;
  }

  async searchCourses(userProfile) {
    try {
      // Mock edX API implementation
      return this.getMockCourses(userProfile);
    } catch (error) {
      console.error('edX API error:', error);
      return [];
    }
  }

  getMockCourses(userProfile) {
    const mockCourses = [
      {
        id: 'edx_course_1',
        source: 'edx',
        title: 'Computer Science Fundamentals',
        provider: 'edX',
        instructor: 'MIT Faculty',
        description: 'Introduction to computer science and programming using Python.',
        url: 'https://edx.org/course/1',
        duration: '12 weeks',
        level: 'beginner',
        price: { amount: 0, currency: 'USD', free: true },
        rating: { score: 4.5, count: 5000 },
        skills: ['computer science', 'python', 'algorithms'],
        tags: ['cs', 'fundamentals', 'free']
      },
      {
        id: 'edx_course_2',
        source: 'edx',
        title: 'Artificial Intelligence',
        provider: 'edX',
        instructor: 'Harvard University',
        description: 'Explore the theory and application of artificial intelligence.',
        url: 'https://edx.org/course/2',
        duration: '16 weeks',
        level: 'advanced',
        price: { amount: 150, currency: 'USD', free: false },
        rating: { score: 4.8, count: 3200 },
        skills: ['artificial intelligence', 'machine learning', 'algorithms'],
        tags: ['ai', 'harvard', 'advanced']
      },
      {
        id: 'edx_course_3',
        source: 'edx',
        title: 'Web Development with React',
        provider: 'edX',
        instructor: 'University of Pennsylvania',
        description: 'Build modern web applications using React and related technologies.',
        url: 'https://edx.org/course/3',
        duration: '8 weeks',
        level: 'intermediate',
        price: { amount: 99, currency: 'USD', free: false },
        rating: { score: 4.6, count: 2800 },
        skills: ['react', 'web development', 'javascript'],
        tags: ['react', 'web', 'frontend']
      }
    ];

    return mockCourses.filter(course => 
      course.skills.some(skill => 
        userProfile.skills.some(userSkill => 
          skill.toLowerCase().includes(userSkill.toLowerCase()) ||
          userSkill.toLowerCase().includes(skill.toLowerCase())
        )
      ) || course.price.free // Include free courses for broader learning
    );
  }
}

module.exports = new EdXService();
