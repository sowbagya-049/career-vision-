const express = require('express');
const multer = require('multer');
const path = require('path');
const auth = require('../middleware/auth');
const { uploadResume, getResumes, getResumeDetails } = require('../controllers/resume');

const router = express.Router();

// Configure multer for file upload
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, '../../uploads'));
  },
  filename: (req, file, cb) => {
    // Generate unique filename
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, `resume-${uniqueSuffix}${ext}`);
  }
});

const fileFilter = (req, file, cb) => {
  console.log('File filter check:', {
    originalname: file.originalname,
    mimetype: file.mimetype,
    size: file.size
  });

  const allowedTypes = [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ];
  
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error(`Invalid file type: ${file.mimetype}. Only PDF, DOC, and DOCX files are allowed.`), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB
    files: 1
  }
});

// Routes
router.post('/upload', auth, (req, res, next) => {
  console.log('Resume upload endpoint hit');
  console.log('User:', req.user ? req.user.id : 'No user');
  console.log('Headers:', req.headers);
  
  upload.single('resume')(req, res, (err) => {
    if (err) {
      console.error('Multer error:', err);
      
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({
          success: false,
          message: 'File too large. Maximum size is 10MB.'
        });
      }
      
      if (err.code === 'LIMIT_UNEXPECTED_FILE') {
        return res.status(400).json({
          success: false,
          message: 'Invalid file field. Expected field name is "resume".'
        });
      }
      
      return res.status(400).json({
        success: false,
        message: err.message || 'File upload failed'
      });
    }
    
    // Call the controller
    uploadResume(req, res, next);
  });
});

router.get('/', auth, getResumes);
router.get('/:id', auth, getResumeDetails);

// Test route
router.get('/test/endpoint', auth, (req, res) => {
  res.json({
    success: true,
    message: 'Resume routes are working!',
    user: req.user.id,
    timestamp: new Date().toISOString()
  });
});

module.exports = router;