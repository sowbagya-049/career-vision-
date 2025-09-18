const axios = require('axios');

class UnstopService {
  constructor() {
    this.baseURL = 'https://api.unstop.com';
  }

  async searchJobs(userProfile) {
    try {
      // Mock Unstop API implementation
      return this.getMockJobs(userProfile);
    } catch (error) {
      console.error('Unstop API error:', error);
      return [];
    }
  }

  getMockJobs(userProfile) {
    const mockJobs = [
      {
        id: 'unstop_job_1',
        source: 'unstop',
        title: 'Software Development Intern',
        company: 'TechStart',
        location: 'Bangalore, India',
        description: 'Internship opportunity for students and recent graduates. Work on real projects with mentorship.',
        url: 'https://unstop.com/jobs/1',
        salary: { min: 20000, max: 40000, currency: 'INR' },
        jobType: 'internship',
        requirements: ['Programming basics', 'Eagerness to learn', 'Team player'],
        skills: ['programming', 'java', 'python'],
        tags: ['internship', 'entry-level', 'mentorship']
      },
      {
        id: 'unstop_job_2',
        source: 'unstop',
        title: 'Junior Data Analyst',
        company: 'DataCorp',
        location: 'Mumbai, India',
        description: 'Entry-level position for data enthusiasts. Work with SQL, Python, and visualization tools.',
        url: 'https://unstop.com/jobs/2',
        salary: { min: 400000, max: 600000, currency: 'INR' },
        jobType: 'full-time',
        requirements: ['SQL', 'Python', 'Data visualization', 'Statistical knowledge'],
        skills: ['sql', 'python', 'excel', 'statistics'],
        tags: ['data', 'analytics', 'entry-level']
      }
    ];

    return mockJobs.filter(job => 
      job.skills.some(skill => 
        userProfile.skills.some(userSkill => 
          userSkill.toLowerCase().includes(skill.toLowerCase())
        )
      )
    );
  }
}

module.exports = new UnstopService();
