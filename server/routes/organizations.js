const express = require('express');
const router = express.Router();
const {
  createOrganization, getMyOrganization, updateOrganization,
  uploadDocuments, getOrganization, getOrganizations, getOrgAnalytics
} = require('../controllers/organizationController');
const { protect, authorize, optionalAuth } = require('../middleware/auth');

router.get('/', optionalAuth, getOrganizations);
router.post('/', protect, createOrganization);
router.get('/me', protect, authorize('organization', 'admin'), getMyOrganization);
router.put('/me', protect, authorize('organization'), updateOrganization);
router.post('/me/documents', protect, authorize('organization'), uploadDocuments);
router.get('/me/analytics', protect, authorize('organization'), getOrgAnalytics);
router.get('/:id', optionalAuth, getOrganization);

module.exports = router;
