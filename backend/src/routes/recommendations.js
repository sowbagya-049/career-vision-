const express = require("express");
const auth = require("../middleware/auth");
const {
  getJobRecommendations,
  getCourseRecommendations,
  refreshRecommendations,
  toggleSaveRecommendation,
  markAsApplied,
  getRecommendationStats,
} = require("../controllers/recommendations"); // 👈 make sure all these are exported from your controller

const router = express.Router();

// Job recommendations
router.get("/jobs", auth, getJobRecommendations);

// Course recommendations
router.get("/courses", auth, getCourseRecommendations);

// Refresh recommendations
router.post("/refresh", auth, refreshRecommendations);

// Toggle save recommendation
router.patch("/:id/save", auth, toggleSaveRecommendation);

// Mark recommendation as applied
router.patch("/:id/applied", auth, markAsApplied);

// Stats
router.get("/stats", auth, getRecommendationStats);

module.exports = router;
