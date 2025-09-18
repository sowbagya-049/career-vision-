const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const User = require('../models/user');
const Milestone = require('../models/milestone');
const Recommendation = require('../models/recommendation');

const connectDB = require('../config/db');

// Sample data
const sampleUsers = [
  {
    firstName: 'John',
    lastName: 'Doe',
    email: 'john.doe@example.com',
    password: 'password123',
    skills: ['javascript', 'react', 'node.js', 'mongodb'],
    interests: ['web development', 'machine learning'],
    location: 'San Francisco, CA',
    bio: 'Passionate full-stack developer with 5+ years of experience.'
  },
  {
    firstName: 'Jane',
    lastName: 'Smith',
    email: 'jane.smith@example.com',
    password: 'password123',
    skills: ['python', 'data science', 'machine learning', 'sql'],
    interests: ['artificial intelligence', 'data visualization'],
    location: 'New York, NY',
    bio: 'Data scientist specializing in machine learning and AI applications.'
  }
];

const sampleMilestones = [
  {
    title: 'Software Engineer at TechCorp',
    description: 'Developed and maintained web applications using React and Node.js. Led a team of 3 junior developers.',
    type: 'job',
    company: 'TechCorp Inc.',
    location: 'San Francisco, CA',
    startDate: new Date('2022-01-15'),
    endDate: new Date('2024-03-30'),
    skills: ['react', 'node.js', 'mongodb', 'team leadership'],
    achievements: ['Improved application performance by 40%', 'Mentored 3 junior developers']
  },
  {
    title: 'Bachelor of Computer Science',
    description: 'Completed Bachelor of Computer Science with focus on software engineering and algorithms.',
    type: 'education',
    company: 'University of California, Berkeley',
    location: 'Berkeley, CA',
    startDate: new Date('2018-08-20'),
    endDate: new Date('2022-05-15'),
    skills: ['algorithms', 'data structures', 'computer science fundamentals']
  },
  {
    title: 'AWS Certified Developer',
    description: 'Achieved AWS Certified Developer - Associate certification.',
    type: 'certification',
    company: 'Amazon Web Services',
    startDate: new Date('2023-06-10'),
    skills: ['aws', 'cloud computing', 'serverless']
  }
];

const sampleRecommendations = [
  {
    type: 'job',
    source: 'linkedin',
    externalId: 'linkedin_sample_1',
    title: 'Senior Full Stack Developer',
    description: 'Join our team to build next-generation web applications.',
    url: 'https://linkedin.com/jobs/sample1',
    company: 'InnovateX',
    location: 'Remote',
    salary: { min: 120000, max: 160000, currency: 'USD' },
    jobType: 'full-time',
    skills: ['react', 'node.js', 'aws', 'typescript'],
    matchScore: 85,
    matchReasons: ['Strong React skills match', 'Node.js experience relevant']
  },
  {
    type: 'course',
    source: 'coursera',
    externalId: 'coursera_sample_1',
    title: 'Advanced React Patterns',
    description: 'Master advanced React concepts and patterns.',
    url: 'https://coursera.org/learn/advanced-react',
    provider: 'Meta',
    instructor: 'React Team',
    duration: '6 weeks',
    level: 'advanced',
    price: { amount: 49, currency: 'USD', free: false },
    rating: { score: 4.8, count: 1500 },
    skills: ['react', 'javascript', 'frontend'],
    matchScore: 90,
    matchReasons: ['Perfect match for React skills', 'Advanced level appropriate']
  }
];

const seedDatabase = async () => {
  try {
    console.log('🌱 Starting database seeding...');

    // Connect to database
    await connectDB();

    // Clear existing data
    await Promise.all([
      User.deleteMany({}),
      Milestone.deleteMany({}),
      Recommendation.deleteMany({})
    ]);

    console.log('🧹 Cleared existing data');

    // Create users
    const users = [];
    for (const userData of sampleUsers) {
      const salt = await bcrypt.genSalt(12);
      const hashedPassword = await bcrypt.hash(userData.password, salt);
      
      const user = await User.create({
        ...userData,
        password: hashedPassword
      });
      
      users.push(user);
      console.log(`👤 Created user: ${user.email}`);
    }

    // Create milestones for first user
    const user1Milestones = [];
    for (const milestoneData of sampleMilestones) {
      const milestone = await Milestone.create({
        ...milestoneData,
        user: users[0]._id
      });
      
      user1Milestones.push(milestone);
      console.log(`📈 Created milestone: ${milestone.title}`);
    }

    // Create recommendations for first user
    for (const recData of sampleRecommendations) {
      const recommendation = await Recommendation.create({
        ...recData,
        user: users[0]._id
      });
      
      console.log(`💡 Created recommendation: ${recommendation.title}`);
    }

    // Create some milestones for second user
    await Milestone.create({
      title: 'Data Scientist at DataCorp',
      description: 'Built machine learning models for customer segmentation and predictive analytics.',
      type: 'job',
      company: 'DataCorp Analytics',
      location: 'New York, NY',
      startDate: new Date('2023-02-01'),
      current: true,
      skills: ['python', 'scikit-learn', 'pandas', 'sql'],
      user: users[1]._id
    });

    await Milestone.create({
      title: 'Master of Data Science',
      description: 'Advanced degree focusing on machine learning and statistical analysis.',
      type: 'education',
      company: 'Stanford University',
      location: 'Stanford, CA',
      startDate: new Date('2021-09-01'),
      endDate: new Date('2023-06-15'),
      skills: ['machine learning', 'statistics', 'data mining'],
      user: users[1]._id
    });

    console.log('✅ Database seeding completed successfully!');
    console.log(`
📊 Summary:
- Users created: ${users.length}
- Milestones created: ${sampleMilestones.length + 2}
- Recommendations created: ${sampleRecommendations.length}

🔑 Test credentials:
Email: john.doe@example.com | Password: password123
Email: jane.smith@example.com | Password: password123
    `);

  } catch (error) {
    console.error('❌ Database seeding failed:', error);
  } finally {
    mongoose.connection.close();
    process.exit(0);
  }
};

// Run seeding if called directly
if (require.main === module) {
  seedDatabase();
}

module.exports = seedDatabase;
