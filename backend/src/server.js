const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const path = require('path');
const fs = require('fs');
require('dotenv').config();

const connectDB = require('./config/db'); // Assuming db.js is in a config folder
const errorHandler = require('./middleware/error-handler');
const authRoutes = require('./routes/auth');
const resumeRoutes = require('./routes/resumes');

const app = express();

// Connect to database
// connectDB() is now called and its Promise is handled to ensure proper startup flow
connectDB(); // This will connect asynchronously, the rest of the app might start without it if connection takes time.

// Trust proxy for rate limiting (important if behind a proxy like Nginx, Heroku, etc.)
app.set('trust proxy', 1);

// CORS configuration - VERY IMPORTANT!
const corsOptions = {
  origin: function (origin, callback) {
    const allowedOrigins = [
      'http://localhost:4200',
      'http://127.0.0.1:4200',
      'http://localhost:3000', // Typically the backend wouldn't request itself, but harmless.
      process.env.FRONTEND_URL // Ensure this is correctly set in .env
    ].filter(Boolean); // Filters out any null/undefined values

    // Log for debugging CORS issues
    // console.log('Request origin:', origin);
    // console.log('Allowed origins:', allowedOrigins);
    
    // Allow requests with no origin (e.g., Postman, curl, same-origin requests)
    if (!origin) {
      return callback(null, true);
    }

    // Allow if origin is in the list
    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      // In development, you might allow all or log more aggressively
      if (process.env.NODE_ENV === 'development') {
        // console.warn('CORS: Allowing unknown origin in development:', origin);
        callback(null, true); // Still allow in dev for flexibility
      } else {
        console.log('CORS Blocked: Origin not allowed:', origin);
        callback(new Error('Not allowed by CORS'), false); // Block in production
      }
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: [
    'Content-Type', 
    'Authorization', 
    'X-Requested-With',
    'Accept',
    'Origin'
  ],
  optionsSuccessStatus: 200 // Some legacy browsers (IE11, various SmartTVs) choke on 204
};

// Apply CORS before other middleware
app.use(cors(corsOptions));
// Handle preflight requests for all routes
app.options('*', cors(corsOptions));

// Security middleware
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" } // Needed for static files like resumes
}));

// Rate limiting - more lenient for development, strict for production
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000', 10), // 15 minutes default
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100', 10), // 100 requests default
  message: { 
    success: false, 
    message: 'Too many requests from this IP, please try again later.' 
  },
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  // Skip rate limiting in development
  skip: (req) => process.env.NODE_ENV === 'development'
});
app.use('/api/', limiter); // Apply to all API routes

// Body parsing middleware
app.use(express.json({ limit: process.env.MAX_FILE_SIZE || '10mb' })); // Use MAX_FILE_SIZE from .env
app.use(express.urlencoded({ extended: true, limit: process.env.MAX_FILE_SIZE || '10mb' }));

// Logging
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
} else {
  // Create a write stream (in append mode)
  const accessLogStream = fs.createWriteStream(path.join(__dirname, 'access.log'), { flags: 'a' });
  app.use(morgan('combined', { stream: accessLogStream }));
}

// Compression
app.use(compression());

// Create uploads directory
const uploadDir = path.join(__dirname, '..', process.env.UPLOAD_DIR || 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
  console.log(`📁 Created uploads directory: ${uploadDir}`);
}

// Static files (e.g., uploaded resumes)
app.use('/uploads', express.static(uploadDir));

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/resumes', resumeRoutes);

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    message: 'CareerVision API Server',
    status: 'running',
    version: '1.0.0', // You might want to pull this from package.json
    timestamp: new Date().toISOString(),
    endpoints: {
      auth: '/api/auth',
      resumes: '/api/resumes',
      health: '/api/health'
    }
  });
});

// Health check endpoint
app.get('/api/health', (req, res) => {
    const mongoose = require('mongoose'); // Require locally for better module isolation
    const dbState = mongoose.connection.readyState;
    
    const states = {
      0: 'disconnected',
      1: 'connected',
      2: 'connecting',
      3: 'disconnecting'
    };

    res.json({ 
      success: true,
      status: 'OK', 
      database: states[dbState] || 'unknown',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: process.env.NODE_ENV,
      version: '1.0.0'
    });
});

// Test endpoint
app.get('/api/test', (req, res) => {
  res.json({
    success: true,
    message: 'API is working!',
    timestamp: new Date().toISOString(),
    method: req.method,
    path: req.path
  });
});

// 404 handler
app.use('*', (req, res) => {
  console.log(`404 - Route not found: ${req.method} ${req.originalUrl}`);
  res.status(404).json({ 
    success: false, 
    message: `Route ${req.method} ${req.originalUrl} not found`,
    availableRoutes: [
      'GET /',
      'GET /api/health',
      'GET /api/test',
      'POST /api/auth/login',
      'POST /api/auth/signup',
      // ... list other primary routes
      'GET /api/resumes',
      'POST /api/resumes/upload'
    ]
  });
});

// Global error handler (must be the last middleware)
app.use(errorHandler);

const PORT = process.env.PORT || 3000;

const server = app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Server running on port ${PORT} in ${process.env.NODE_ENV} mode`);
  console.log(`📡 API Base URL: http://localhost:${PORT}/api`);
  console.log(`🌐 CORS enabled for: ${process.env.FRONTEND_URL || 'http://localhost:4200'}`);
  console.log(`📊 Health check: http://localhost:${PORT}/api/health`);
  console.log(`🧪 Test endpoint: http://localhost:${PORT}/api/test`);
});

// Graceful shutdown
// Moved to db.js for MongoDB connection closure, but keeping here for HTTP server closure.
process.on('SIGTERM', () => {
  console.log('SIGTERM received, gracefully shutting down HTTP server');
  server.close(() => {
    console.log('HTTP server terminated');
    // Consider if you need to manually close DB connection here or rely on db.js handler
    // If db.js handles it, this can just exit.
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('SIGINT received, gracefully shutting down HTTP server');
  server.close(() => {
    console.log('HTTP server terminated');
    // Consider if you need to manually close DB connection here or rely on db.js handler
    // If db.js handles it, this can just exit.
    process.exit(0);
  });
});

module.exports = app;