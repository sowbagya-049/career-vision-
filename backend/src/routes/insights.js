const express = require('express');
const auth = require('../middleware/auth');
const {
  getCareerInsights,
  getAnalyticsData,
  generateReport
} = require('../controllers/insights');

const router = express.Router();

// Routes
router.get('/career', auth, getCareerInsights);
router.get('/analytics', auth, getAnalyticsData);
router.post('/report', auth, generateReport);

module.exports = router;
