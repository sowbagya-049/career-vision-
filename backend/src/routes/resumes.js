const express = require('express');
const multer = require('multer');
const path = require('path');
const config = require('../config');
const auth = require('../middleware/auth');
const {
  uploadResume,
  getResumes,
  getResumeDetails,
  deleteResume
} = require('../controllers/resume');

const router = express.Router();

// Configure multer for file upload
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, config.uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, `resume-${uniqueSuffix}${path.extname(file.originalname)}`);
  }
});

const fileFilter = (req, file, cb) => {
  const allowedTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
  
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only PDF, DOC, and DOCX files are allowed.'), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: config.maxFileSize
  }
});

// Routes
router.post('/upload', auth, upload.single('resume'), uploadResume);
router.get('/', auth, getResumes);
router.get('/:id', auth, getResumeDetails);
router.delete('/:id', auth, deleteResume);

module.exports = router;
