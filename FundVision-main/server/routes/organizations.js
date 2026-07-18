const express = require('express');
const router = express.Router();
const {
  createOrganization, getMyOrganization, updateOrganization,
  uploadDocuments, getOrganization, getOrganizations, getOrgAnalytics
} = require('../controllers/organizationController');
const { protect, authorize } = require('../middleware/auth');

router.get('/', getOrganizations);
router.post('/', protect, createOrganization);
router.get('/me', protect, authorize('organization', 'admin'), getMyOrganization);
router.put('/me', protect, authorize('organization'), updateOrganization);
router.post('/me/documents', protect, authorize('organization'), uploadDocuments);
router.get('/me/analytics', protect, authorize('organization'), getOrgAnalytics);
router.get('/:id', getOrganization);

module.exports = router;
