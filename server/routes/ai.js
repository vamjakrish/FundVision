const express = require('express');
const router = express.Router();
const {
  generateCampaignSummary, generateTrustScore, naturalLanguageSearch,
  getRecommendations, generateImpact, chat, checkFraud, getDashboardInsights
} = require('../controllers/aiController');
const { protect, authorize, optionalAuth } = require('../middleware/auth');

router.post('/campaign-summary/:id', generateCampaignSummary);
router.get('/trust-score/:campaignId', generateTrustScore);
router.post('/search', naturalLanguageSearch);
router.get('/recommendations', protect, getRecommendations);
router.post('/impact', protect, generateImpact);
router.post('/chat', optionalAuth, chat);
router.post('/fraud-check/:campaignId', protect, authorize('admin'), checkFraud);
router.get('/insights', protect, getDashboardInsights);

module.exports = router;
