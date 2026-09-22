const express = require('express');
const router = express.Router();
const {
  uploadCampaignDocument,
  getCampaignDocuments,
  deleteCampaignDocument,
  updateFundUtilization,
  getPublicCampaignProofs,
  getSecureDocumentPreview,
  submitCampaignForVerification
} = require('../controllers/proofController');
const { protect, authorize, optionalAuth } = require('../middleware/auth');
const { uploadCampaignProof } = require('../config/cloudinary');

// Secure document preview / download (Owner or Admin)
router.get('/documents/:docId/secure-preview', protect, getSecureDocumentPreview);

// Public campaign proofs & fund utilization summary
router.get('/campaigns/:id/proofs/public', optionalAuth, getPublicCampaignProofs);

// Organization / Admin: Campaign documents
router.post(
  '/campaigns/:id/documents',
  protect,
  authorize('organization'),
  uploadCampaignProof.single('document'),
  uploadCampaignDocument
);

router.get(
  '/campaigns/:id/documents',
  protect,
  authorize('organization', 'admin'),
  getCampaignDocuments
);

router.delete(
  '/campaigns/:id/documents/:docId',
  protect,
  authorize('organization', 'admin'),
  deleteCampaignDocument
);

// Organization: Fund utilization breakdown
router.put(
  '/campaigns/:id/fund-utilization',
  protect,
  authorize('organization'),
  updateFundUtilization
);

// Organization: Submit/Resubmit for verification
router.post(
  '/campaigns/:id/submit-verification',
  protect,
  authorize('organization'),
  submitCampaignForVerification
);

module.exports = router;
