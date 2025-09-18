const express = require('express');
const { body } = require('express-validator');
const auth = require('../middleware/auth');
const {
  askQuestion,
  getQuestionHistory,
  rateAnswer
} = require('../controllers/qna');

const router = express.Router();

// Validation middleware
const questionValidation = [
  body('question').trim().isLength({ min: 5, max: 500 }).withMessage('Question must be between 5-500 characters')
];

// Routes
router.post('/ask', auth, questionValidation, askQuestion);
router.get('/history', auth, getQuestionHistory);
router.patch('/:id/rate', auth, rateAnswer);

module.exports = router;