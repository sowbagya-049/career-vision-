# CareerVision Backend API

A comprehensive Node.js + Express.js backend for the CareerVision career management platform.

## 🚀 Features

- **User Authentication**: JWT-based auth with bcrypt password hashing
- **Resume Processing**: PDF/DOC text extraction and parsing
- **Career Timeline**: Milestone management and analytics
- **AI Q&A System**: NLP-powered career question answering
- **Job Recommendations**: Integration with LinkedIn, Indeed, Unstop
- **Course Recommendations**: Integration with Coursera, Udemy, edX
- **Career Insights**: Analytics and career gap analysis
- **File Upload**: Secure resume upload with validation
- **Rate Limiting**: API protection with express-rate-limit
- **Error Handling**: Comprehensive error handling middleware

## 📋 Prerequisites

- Node.js 16+ 
- MongoDB 4.4+
- npm or yarn

## 🛠️ Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd career-vision-backend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Setup**
   ```bash
   cp .env.example .env
   # Edit .env with your configurations
   ```

4. **Create uploads directory**
   ```bash
   mkdir uploads
   ```

5. **Seed database (optional)**
   ```bash
   npm run seed
   ```

## ⚙️ Configuration

Create a `.env` file with the following variables:

```env
NODE_ENV=development
PORT=3000
MONGODB_URI=mongodb://localhost:27017/careervision
JWT_SECRET=your_super_secret_jwt_key_here
JWT_EXPIRES_IN=7d

# API Keys (Optional - for external integrations)
LINKEDIN_CLIENT_ID=your_linkedin_client_id
LINKEDIN_CLIENT_SECRET=your_linkedin_client_secret
INDEED_API_KEY=your_indeed_api_key
COURSERA_API_KEY=your_coursera_api_key
UDEMY_CLIENT_ID=your_udemy_client_id
UDEMY_CLIENT_SECRET=your_udemy_client_secret
EDX_API_KEY=your_edx_api_key

# File Upload
MAX_FILE_SIZE=10485760
UPLOAD_DIR=uploads/

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

## 🚀 Running the Application

### Development
```bash
npm run dev
```

### Production
```bash
npm start
```

The server will start on `http://localhost:3000`

## 📚 API Documentation

### Authentication Endpoints

#### POST /api/auth/signup
Register a new user
```json
{
  "firstName": "John",
  "lastName": "Doe", 
  "email": "john@example.com",
  "password": "password123"
}
```

#### POST /api/auth/login
Login user
```json
{
  "email": "john@example.com",
  "password": "password123"
}
```

#### GET /api/auth/profile
Get current user profile (requires auth token)

#### PUT /api/auth/profile
Update user profile (requires auth token)

### Resume Endpoints

#### POST /api/resumes/upload
Upload resume file (PDF, DOC, DOCX)
- Requires auth token
- File should be sent as multipart/form-data with field name 'resume'

#### GET /api/resumes
Get user's uploaded resumes

#### GET /api/resumes/:id
Get specific resume details

#### DELETE /api/resumes/:id
Delete resume and associated milestones

### Timeline Endpoints

#### GET /api/timelines/milestones
Get user's career milestones
- Query params: `type`, `limit`, `page`

#### POST /api/timelines/milestones
Create new milestone
```json
{
  "title": "Software Engineer",
  "description": "Full stack development role",
  "type": "job",
  "company": "TechCorp",
  "location": "San Francisco, CA",
  "startDate": "2023-01-15",
  "endDate": "2024-03-30",
  "skills": ["react", "node.js"],
  "current": false
}
```

#### PUT /api/timelines/milestones/:id
Update milestone

#### DELETE /api/timelines/milestones/:id
Delete milestone

#### GET /api/timelines/analytics
Get timeline analytics and career gaps

### Q&A Endpoints

#### POST /api/qna/ask
Ask a career-related question
```json
{
  "question": "Do I have any career gaps?"
}
```

#### GET /api/qna/history
Get question history

#### PATCH /api/qna/:id/rate
Rate answer helpfulness
```json
{
  "helpful": true
}
```

### Recommendations Endpoints

#### GET /api/recommendations/jobs
Get job recommendations
- Query params: `limit`, `page`, `source`

#### GET /api/recommendations/courses
Get course recommendations
- Query params: `limit`, `page`, `source`, `level`

#### POST /api/recommendations/refresh
Refresh recommendations from external APIs

#### PATCH /api/recommendations/:id/save
Save/unsave recommendation

#### PATCH /api/recommendations/:id/applied
Mark recommendation as applied

#### GET /api/recommendations/stats
Get recommendation statistics

### Insights Endpoints

#### GET /api/insights/career
Get career insights and analysis

#### GET /api/insights/analytics
Get analytics data for charts

#### POST /api/insights/report
Generate comprehensive career report

## 🏗️ Project Structure

```
src/
├── config/           # Configuration files
├── controllers/      # Route controllers
├── middleware/       # Express middleware
├── models/           # MongoDB schemas
├── routes/           # API route definitions
├── services/         # External service integrations
├── utils/            # Utility functions
├── app.js           # Express app configuration
└── server.js        # Server entry point
```

## 🔒 Security Features

- **JWT Authentication**: Secure token-based authentication
- **Password Hashing**: bcrypt with salt rounds
- **Helmet**: Security headers
- **Rate Limiting**: Prevent API abuse
- **CORS**: Cross-origin resource sharing configuration
- **Input Validation**: express-validator for request validation
- **File Upload Security**: Type and size validation

## 🧪 Testing

```bash
npm test
```

## 📦 External Integrations

The API includes mock implementations for:

- **LinkedIn Jobs API**: Job recommendations
- **Indeed API**: Job search integration  
- **Unstop API**: Internship and entry-level positions
- **Coursera API**: Online course recommendations
- **Udemy API**: Skill-based course suggestions
- **edX API**: Academic course recommendations

To enable real integrations, update the service files with actual API credentials and endpoints.

## 🚨 Error Handling

The API includes comprehensive error handling:

- **Validation Errors**: Input validation with detailed messages
- **Authentication Errors**: JWT and authorization failures
- **Database Errors**: MongoDB connection and query errors
- **File Upload Errors**: File type and size validation
- **Rate Limit Errors**: Too many requests handling

## 📊 Performance Features

- **Database Indexing**: Optimized MongoDB queries
- **Compression**: Gzip compression for responses
- **Request Logging**: Morgan for access logs
- **Memory Management**: Efficient file processing
- **Async Processing**: Background resume parsing

## 🔄 Development Workflow

1. **Start MongoDB**: Ensure MongoDB is running
2. **Environment**: Set up `.env` file
3. **Development Server**: Run `npm run dev`
4. **Database Seeding**: Run `npm run seed` for test data
5. **Testing**: Use Postman or similar for API testing

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

## 🚀 **Production Deployment Guide**

### **Docker Configuration**

#### Dockerfile
```dockerfile
FROM node:18-alpine

# Create app directory
WORKDIR /usr/src/app

# Install app dependencies
COPY package*.json ./
RUN npm ci --only=production

# Bundle app source
COPY . .

# Create uploads directory
RUN mkdir -p uploads

# Expose port
EXPOSE 3000

# Create non-root user
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nodeuser -u 1001

# Change ownership
RUN chown -R nodeuser:nodejs /usr/src/app
USER nodeuser

CMD ["node", "src/server.js"]
```

#### docker-compose.yml
```yaml
version: '3.8'

services:
  api:
    build: .
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - MONGODB_URI=mongodb://mongo:27017/careervision
      - JWT_SECRET=${JWT_SECRET}
    depends_on:
      - mongo
    volumes:
      - uploads:/usr/src/app/uploads
    restart: unless-stopped

  mongo:
    image: mongo:6.0
    ports:
      - "27017:27017"
    volumes:
      - mongodb_data:/data/db
    restart: unless-stopped
    environment:
      - MONGO_INITDB_ROOT_USERNAME=${MONGO_USERNAME}
      - MONGO_INITDB_ROOT_PASSWORD=${MONGO_PASSWORD}

  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf
      - ./ssl:/etc/ssl
    depends_on:
      - api
    restart: unless-stopped

volumes:
  mongodb_data:
  uploads:
```

#### nginx.conf
```nginx
events {
    worker_connections 1024;
}

http {
    upstream api {
        server api:3000;
    }

    server {
        listen 80;
        server_name your-domain.com;
        
        # Redirect HTTP to HTTPS
        return 301 https://$server_name$request_uri;
    }

    server {
        listen 443 ssl http2;
        server_name your-domain.com;

        ssl_certificate /etc/ssl/cert.pem;
        ssl_certificate_key /etc/ssl/key.pem;

        # Security headers
        add_header X-Frame-Options DENY;
        add_header X-Content-Type-Options nosniff;
        add_header X-XSS-Protection "1; mode=block";

        # API routes
        location /api/ {
            proxy_pass http://api;
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection 'upgrade';
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
            proxy_cache_bypass $http_upgrade;
            
            # File upload size
            client_max_body_size 10M;
        }

        # Static files
        location /uploads/ {
            alias /usr/src/app/uploads/;
            expires 1y;
            add_header Cache-Control "public, immutable";
        }
    }
}
```

### **Environment Variables for Production**

#### .env.production
```env
NODE_ENV=production
PORT=3000
MONGODB_URI=mongodb://username:password@mongodb-host:27017/careervision?authSource=admin
JWT_SECRET=super_secure_random_string_min_32_chars
JWT_EXPIRES_IN=7d

# Redis for caching (optional)
REDIS_URL=redis://redis:6379

# External API Keys
LINKEDIN_CLIENT_ID=your_production_linkedin_client_id
LINKEDIN_CLIENT_SECRET=your_production_linkedin_client_secret
INDEED_API_KEY=your_production_indeed_api_key
COURSERA_API_KEY=your_production_coursera_api_key
UDEMY_CLIENT_ID=your_production_udemy_client_id
UDEMY_CLIENT_SECRET=your_production_udemy_client_secret
EDX_API_KEY=your_production_edx_api_key

# File Storage
MAX_FILE_SIZE=10485760
UPLOAD_DIR=/usr/src/app/uploads/

# Security
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# Logging
LOG_LEVEL=info
LOG_FILE=/var/log/careervision/app.log

# Email (for notifications)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=noreply@yourdomain.com
EMAIL_PASS=your_email_password

# Monitoring
SENTRY_DSN=your_sentry_dsn
```

## 🔧 **Advanced Configuration**

### **Logging Configuration**
```javascript
// src/config/logger.js
const winston = require('winston');

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: { service: 'careervision-api' },
  transports: [
    new winston.transports.File({ 
      filename: 'logs/error.log', 
      level: 'error' 
    }),
    new winston.transports.File({ 
      filename: 'logs/combined.log' 
    })
  ]
});

if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: winston.format.simple()
  }));
}

module.exports = logger;
```

### **Health Check Endpoints**
```javascript