const express = require('express');
const { body } = require('express-validator');
const { register, login, getProfile } = require('../controllers/auth');
const auth = require('../middleware/auth');

const router = express.Router();

// Validation middleware
const registerValidation = [
  body('firstName')
    .notEmpty()
    .withMessage('First name is required')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('First name must be between 2-50 characters')
    .matches(/^[a-zA-Z\s]+$/)
    .withMessage('First name must contain only letters'),
  
  body('lastName')
    .notEmpty()
    .withMessage('Last name is required')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Last name must be between 2-50 characters')
    .matches(/^[a-zA-Z\s]+$/)
    .withMessage('Last name must contain only letters'),
  
  body('email')
    .isEmail()
    .withMessage('Please enter a valid email')
    .normalizeEmail()
    .isLength({ min: 5, max: 100 })
    .withMessage('Email must be between 5-100 characters'),
  
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters')
    .matches(/^(?=.*[a-zA-Z])(?=.*\d).*$/)
    .withMessage('Password must contain at least one letter and one number')
];

const loginValidation = [
  body('email')
    .isEmail()
    .withMessage('Please enter a valid email')
    .normalizeEmail(),
  
  body('password')
    .notEmpty()
    .withMessage('Password is required')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters')
];

// Routes
router.post('/signup', registerValidation, register);
router.post('/login', loginValidation, login);
router.get('/profile', auth, getProfile);

// Test route for debugging
router.get('/test', (req, res) => {
  res.json({ 
    success: true, 
    message: 'Auth routes are working!',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV
  });
});

module.exports = router;