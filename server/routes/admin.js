const express = require('express');
const router = express.Router();
const {
  getDashboardStats, getPendingOrganizations, verifyOrganization,
  getPendingCampaigns, approveCampaign, getAllUsers,
  toggleUserStatus, toggleFeatureCampaign, getAdvancedAnalytics,
  getVerificationQueue
} = require('../controllers/adminController');
const {
  verifyDocument,
  requestMoreInformation,
  verifyCampaignStatus
} = require('../controllers/proofController');
const { protect, authorize } = require('../middleware/auth');

router.use(protect, authorize('admin'));

router.get('/stats', getDashboardStats);
router.get('/analytics', getAdvancedAnalytics);
router.get('/organizations/pending', getPendingOrganizations);
router.put('/organizations/:id/verify', verifyOrganization);
router.get('/campaigns/pending', getPendingCampaigns);
router.get('/campaigns/verification-queue', getVerificationQueue);
router.put('/campaigns/:id/approve', approveCampaign);
router.put('/campaigns/:id/feature', toggleFeatureCampaign);
router.get('/users', getAllUsers);
router.put('/users/:id/toggle-status', toggleUserStatus);

// Campaign Document Verification & Proof Transparency Admin Routes
router.patch('/documents/:docId/verify', verifyDocument);
router.put('/documents/:docId/verify', verifyDocument);

router.post('/campaigns/:id/request-info', requestMoreInformation);

router.patch('/campaigns/:id/verify-status', verifyCampaignStatus);
router.put('/campaigns/:id/verify-status', verifyCampaignStatus);

module.exports = router;
