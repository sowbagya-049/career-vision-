const axios = require('axios');
const config = require('../config');

class IndeedService {
  constructor() {
    this.baseURL = 'https://api.indeed.com/ads';
    //this.apiKey = config.indeed.apiKey;
  }

  async searchJobs(userProfile) {
    try {
      // Mock Indeed API implementation
      return this.getMockJobs(userProfile);
    } catch (error) {
      console.error('Indeed API error:', error);
      return [];
    }
  }

  getMockJobs(userProfile) {
    const mockJobs = [
      {
        id: 'indeed_job_1',
        source: 'indeed',
        title: 'Frontend Developer',
        company: 'Digital Agency',
        location: 'Remote',
        description: 'Looking for a talented frontend developer to join our team. Experience with React and modern CSS required.',
        url: 'https://indeed.com/jobs/1',
        salary: { min: 75000, max: 110000, currency: 'USD' },
        jobType: 'full-time',
        requirements: ['React', 'CSS', 'JavaScript', 'Responsive design'],
        skills: ['react', 'css', 'javascript', 'html'],
        tags: ['remote', 'frontend', 'agency']
      },
      {
        id: 'indeed_job_2',
        source: 'indeed',
        title: 'DevOps Engineer',
        company: 'Cloud Solutions Inc',
        location: 'Austin, TX',
        description: 'Seeking a DevOps engineer with experience in AWS, Docker, and Kubernetes.',
        url: 'https://indeed.com/jobs/2',
        salary: { min: 100000, max: 140000, currency: 'USD' },
        jobType: 'full-time',
        requirements: ['AWS', 'Docker', 'Kubernetes', 'CI/CD'],
        skills: ['aws', 'docker', 'kubernetes', 'jenkins'],
        tags: ['devops', 'cloud', 'infrastructure']
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

module.exports = new IndeedService();
