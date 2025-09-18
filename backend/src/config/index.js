require('dotenv').config();

const config = {
  port: process.env.PORT || 3000,
  mongodb: {
    uri: process.env.MONGODB_URI || 'mongodb://localhost:27017/careervision',
    options: {
      useNewUrlParser: true,
      useUnifiedTopology: true
    }
  },
  jwt: {
    secret: process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production',
    expiresIn: process.env.JWT_EXPIRES_IN || '7d'
  },
  frontend: {
    url: process.env.FRONTEND_URL || 'http://localhost:4200'
  },
  apis: {
    openai: {
      apiKey: process.env.OPENAI_API_KEY
    },
    linkedin: {
      apiKey: process.env.LINKEDIN_API_KEY,
      apiSecret: process.env.LINKEDIN_API_SECRET
    },
    indeed: {
      apiKey: process.env.INDEED_API_KEY
    },
    coursera: {
      apiKey: process.env.COURSERA_API_KEY
    }
  },
  upload: {
    maxSize: 10 * 1024 * 1024, // 10MB
    allowedTypes: ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
  }
};

module.exports = config;
