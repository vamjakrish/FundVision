const express = require('express');
const router = express.Router();
const {
  getDashboardStats, getPendingOrganizations, verifyOrganization,
  getPendingCampaigns, approveCampaign, getAllUsers,
  toggleUserStatus, toggleFeatureCampaign, getAdvancedAnalytics
} = require('../controllers/adminController');
const { protect, authorize } = require('../middleware/auth');

router.use(protect, authorize('admin'));

router.get('/stats', getDashboardStats);
router.get('/analytics', getAdvancedAnalytics);
router.get('/organizations/pending', getPendingOrganizations);
router.put('/organizations/:id/verify', verifyOrganization);
router.get('/campaigns/pending', getPendingCampaigns);
router.put('/campaigns/:id/approve', approveCampaign);
router.put('/campaigns/:id/feature', toggleFeatureCampaign);
router.get('/users', getAllUsers);
router.put('/users/:id/toggle-status', toggleUserStatus);

module.exports = router;
