const express = require('express');
const router = express.Router();
const {
  getCampaigns, getCampaign, createCampaign, updateCampaign,
  addCampaignUpdate, likeCampaign, bookmarkCampaign, shareCampaign,
  getMyCampaigns, getCampaignStats
} = require('../controllers/campaignController');
const { protect, authorize, optionalAuth } = require('../middleware/auth');

router.get('/', optionalAuth, getCampaigns);
router.get('/my-campaigns', protect, authorize('organization', 'admin'), getMyCampaigns);
router.get('/:id', optionalAuth, getCampaign);
router.get('/:id/stats', protect, getCampaignStats);
router.post('/', protect, authorize('organization'), createCampaign);
router.put('/:id', protect, authorize('organization', 'admin'), updateCampaign);
router.post('/:id/updates', protect, authorize('organization'), addCampaignUpdate);
router.post('/:id/like', protect, likeCampaign);
router.post('/:id/bookmark', protect, bookmarkCampaign);
router.post('/:id/share', shareCampaign);

module.exports = router;
