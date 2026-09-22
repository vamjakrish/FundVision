const mongoose = require('mongoose');
const path = require('path');
const Campaign = require('../models/Campaign');
const Organization = require('../models/Organization');
const CampaignDocument = require('../models/CampaignDocument');
const { validateProofFile } = require('../utils/fileValidation');
const { uploadBufferToCloudinary, generateSecureSignedUrl, deleteFromCloudinary } = require('../config/cloudinary');
const notify = require('../utils/notify');
const { getIO } = require('../socket/socketManager');

const ALLOWED_DOC_TYPES = [
  'hospital_estimate',
  'medical_report',
  'government_certificate',
  'project_proposal',
  'project_quotation',
  'vendor_invoice',
  'beneficiary_proof',
  'authorization_letter',
  'bank_statement',
  'site_photo',
  'other'
];

const ALLOWED_CAMPAIGN_VERIFY_STATUSES = [
  'not_submitted',
  'pending',
  'under_review',
  'more_info_required',
  'verified',
  'rejected',
  'suspended'
];

// @desc    Upload campaign proof document
// @route   POST /api/campaigns/:id/documents
// @access  Private (Organization only)
const uploadCampaignDocument = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: 'Invalid campaign ID.' });
    }

    const campaign = await Campaign.findById(id);
    if (!campaign) {
      return res.status(404).json({ success: false, message: 'Campaign not found.' });
    }

    const org = await Organization.findOne({ user: req.user.id });
    if (!org) {
      return res.status(403).json({ success: false, message: 'Organization profile not found.' });
    }

    // Ownership check: organization must own the campaign
    if (campaign.organization.toString() !== org._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized. You can only upload documents to your own campaign.'
      });
    }

    if (!req.file) {
      return res.status(400).json({ success: false, message: 'Please upload a document file.' });
    }

    // Comprehensive file validation (size, MIME, extension, magic numbers)
    const fileValidation = validateProofFile(req.file);
    if (!fileValidation.valid) {
      return res.status(400).json({ success: false, message: fileValidation.error });
    }

    const { documentType, title, description, visibility } = req.body;

    if (!documentType || !ALLOWED_DOC_TYPES.includes(documentType)) {
      return res.status(400).json({
        success: false,
        message: `Invalid or missing documentType. Allowed: ${ALLOWED_DOC_TYPES.join(', ')}`
      });
    }

    if (!title || !title.trim()) {
      return res.status(400).json({ success: false, message: 'Document title is required.' });
    }

    if (title.trim().length > 200) {
      return res.status(400).json({ success: false, message: 'Document title cannot exceed 200 characters.' });
    }

    if (description && description.trim().length > 1000) {
      return res.status(400).json({ success: false, message: 'Document description cannot exceed 1000 characters.' });
    }

    // Enforce default visibility = 'admin_only'
    let docVisibility = 'admin_only';
    if (visibility === 'public') {
      docVisibility = 'public';
    } else if (visibility && visibility !== 'admin_only') {
      return res.status(400).json({ success: false, message: 'Invalid visibility setting. Allowed: "public", "admin_only".' });
    }

    // Safe filename and storage path
    const sanitizedExt = path.extname(fileValidation.sanitizedName);
    const uniqueName = `${campaign._id}_${Date.now()}_${path.basename(fileValidation.sanitizedName, sanitizedExt)}`;
    
    const uploadResult = await uploadBufferToCloudinary(req.file.buffer, {
      public_id: `fundvision/campaign-proofs/${campaign._id}/${uniqueName}`,
      folder: `fundvision/campaign-proofs/${campaign._id}`
    });

    const document = await CampaignDocument.create({
      campaign: campaign._id,
      organization: org._id,
      uploadedBy: req.user.id,
      documentType,
      title: title.trim(),
      description: description ? description.trim() : undefined,
      fileUrl: uploadResult.secure_url || uploadResult.url,
      publicId: uploadResult.public_id,
      fileType: fileValidation.detectedMime || req.file.mimetype,
      fileSizeBytes: req.file.size || (req.file.buffer ? req.file.buffer.length : 0),
      visibility: docVisibility,
      verificationStatus: 'pending'
    });

    res.status(201).json({
      success: true,
      message: 'Document uploaded successfully and awaiting verification.',
      data: document
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all documents for a campaign (Org owner or Admin)
// @route   GET /api/campaigns/:id/documents
// @access  Private (Campaign Owner or Admin)
const getCampaignDocuments = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: 'Invalid campaign ID.' });
    }

    const campaign = await Campaign.findById(id);
    if (!campaign) {
      return res.status(404).json({ success: false, message: 'Campaign not found.' });
    }

    // Authorization check
    const isAdmin = req.user.role === 'admin';
    if (!isAdmin) {
      const org = await Organization.findOne({ user: req.user.id });
      if (!org || campaign.organization.toString() !== org._id.toString()) {
        return res.status(403).json({
          success: false,
          message: 'Not authorized to view documents for this campaign.'
        });
      }
    }

    const documents = await CampaignDocument.find({ campaign: campaign._id })
      .populate('uploadedBy', 'name email avatar')
      .populate('verifiedBy', 'name')
      .sort('-createdAt');

    res.json({
      success: true,
      count: documents.length,
      data: documents
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete a campaign document
// @route   DELETE /api/campaigns/:id/documents/:docId
// @access  Private (Campaign Owner or Admin)
const deleteCampaignDocument = async (req, res, next) => {
  try {
    const { id, docId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id) || !mongoose.Types.ObjectId.isValid(docId)) {
      return res.status(400).json({ success: false, message: 'Invalid ID parameters.' });
    }

    const document = await CampaignDocument.findById(docId);
    if (!document) {
      return res.status(404).json({ success: false, message: 'Document not found.' });
    }

    if (document.campaign.toString() !== id) {
      return res.status(400).json({ success: false, message: 'Document belongs to another campaign.' });
    }

    const isAdmin = req.user.role === 'admin';
    if (!isAdmin) {
      const org = await Organization.findOne({ user: req.user.id });
      if (!org || document.organization.toString() !== org._id.toString()) {
        return res.status(403).json({
          success: false,
          message: 'Not authorized to delete this document.'
        });
      }

      // If document is verified, organization cannot delete without admin authorization
      if (document.verificationStatus === 'verified') {
        return res.status(403).json({
          success: false,
          message: 'Cannot delete a verified document. Please contact an administrator.'
        });
      }
    }

    // Clean up from Cloudinary storage
    await deleteFromCloudinary(document.publicId);

    await document.deleteOne();

    res.json({
      success: true,
      message: 'Document deleted successfully.'
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update campaign fund utilization breakdown
// @route   PUT /api/campaigns/:id/fund-utilization
// @access  Private (Organization only)
const updateFundUtilization = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: 'Invalid campaign ID.' });
    }

    const campaign = await Campaign.findById(id);
    if (!campaign) {
      return res.status(404).json({ success: false, message: 'Campaign not found.' });
    }

    const org = await Organization.findOne({ user: req.user.id });
    if (!org || campaign.organization.toString() !== org._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update fund utilization for this campaign.'
      });
    }

    const { fundUtilization } = req.body;
    if (!Array.isArray(fundUtilization) || fundUtilization.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Fund utilization must be a non-empty array of items.'
      });
    }

    // Validate each fund utilization entry
    for (let i = 0; i < fundUtilization.length; i++) {
      const item = fundUtilization[i];
      if (!item.purpose || typeof item.purpose !== 'string' || !item.purpose.trim()) {
        return res.status(400).json({
          success: false,
          message: `Item #${i + 1}: Purpose is required and must be non-empty.`
        });
      }

      if (item.purpose.trim().length > 200) {
        return res.status(400).json({
          success: false,
          message: `Item #${i + 1}: Purpose cannot exceed 200 characters.`
        });
      }

      const amount = Number(item.estimatedAmount);
      if (!Number.isFinite(amount) || amount <= 0) {
        return res.status(400).json({
          success: false,
          message: `Item #${i + 1} ("${item.purpose.trim()}"): Estimated amount must be a positive number greater than 0.`
        });
      }

      if (item.description && item.description.trim().length > 1000) {
        return res.status(400).json({
          success: false,
          message: `Item #${i + 1}: Description cannot exceed 1000 characters.`
        });
      }
    }

    // Calculate total on server (do NOT trust client total)
    const calculatedTotal = fundUtilization.reduce(
      (sum, item) => sum + Number(item.estimatedAmount),
      0
    );

    // Goal relationship validation with sensible tolerance (within ±15% of campaign goal)
    const minAcceptable = campaign.goalAmount * 0.85;
    const maxAcceptable = campaign.goalAmount * 1.15;
    if (calculatedTotal < minAcceptable || calculatedTotal > maxAcceptable) {
      return res.status(400).json({
        success: false,
        message: `Total fund utilization (₹${calculatedTotal.toLocaleString()}) does not match campaign goal (₹${campaign.goalAmount.toLocaleString()}). Please ensure the itemized breakdown reasonably accounts for the campaign goal amount.`,
        calculatedTotal,
        goalAmount: campaign.goalAmount
      });
    }

    campaign.fundUtilization = fundUtilization.map(item => ({
      purpose: item.purpose.trim(),
      estimatedAmount: Number(item.estimatedAmount),
      description: item.description ? item.description.trim() : undefined
    }));

    await campaign.save();

    res.json({
      success: true,
      message: 'Fund utilization breakdown updated successfully.',
      data: {
        fundUtilization: campaign.fundUtilization,
        totalEstimatedAmount: calculatedTotal,
        goalAmount: campaign.goalAmount
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get public campaign proofs and fund utilization
// @route   GET /api/campaigns/:id/proofs/public
// @access  Public (optionalAuth)
const getPublicCampaignProofs = async (req, res, next) => {
  try {
    const param = req.params.id;
    let campaign;

    if (mongoose.Types.ObjectId.isValid(param)) {
      campaign = await Campaign.findOne({
        $or: [{ _id: param }, { slug: param }]
      });
    } else {
      campaign = await Campaign.findOne({ slug: param });
    }

    if (!campaign) {
      return res.status(404).json({ success: false, message: 'Campaign not found.' });
    }

    // Only fetch verified documents that were explicitly marked as public
    const publicDocs = await CampaignDocument.find({
      campaign: campaign._id,
      visibility: 'public',
      verificationStatus: 'verified'
    }).sort('-createdAt');

    const totalVerifiedDocsCount = await CampaignDocument.countDocuments({
      campaign: campaign._id,
      verificationStatus: 'verified'
    });

    // Sanitize response: NEVER expose publicId or internal metadata
    const sanitizedDocs = publicDocs.map(doc => ({
      _id: doc._id,
      documentType: doc.documentType,
      title: doc.title,
      description: doc.description,
      fileUrl: doc.fileUrl,
      fileType: doc.fileType,
      fileSizeBytes: doc.fileSizeBytes,
      verificationStatus: doc.verificationStatus,
      verifiedAt: doc.verifiedAt,
      createdAt: doc.createdAt
    }));

    const totalUtilization = (campaign.fundUtilization || []).reduce(
      (sum, item) => sum + (Number(item.estimatedAmount) || 0),
      0
    );

    res.json({
      success: true,
      data: {
        campaignId: campaign._id,
        campaignTitle: campaign.title,
        campaignVerificationStatus: campaign.verificationStatus || 'not_submitted',
        fundUtilization: campaign.fundUtilization || [],
        totalUtilization,
        goalAmount: campaign.goalAmount,
        totalVerifiedDocumentsCount: totalVerifiedDocsCount,
        publicDocumentsCount: sanitizedDocs.length,
        documents: sanitizedDocs
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Secure preview / download of confidential document
// @route   GET /api/documents/:docId/secure-preview
// @access  Private (Campaign Owner or Admin)
const getSecureDocumentPreview = async (req, res, next) => {
  try {
    const { docId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(docId)) {
      return res.status(400).json({ success: false, message: 'Invalid document ID.' });
    }

    const document = await CampaignDocument.findById(docId);
    if (!document) {
      return res.status(404).json({ success: false, message: 'Document not found.' });
    }

    const campaign = await Campaign.findById(document.campaign);
    if (!campaign) {
      return res.status(404).json({ success: false, message: 'Associated campaign not found.' });
    }

    // Authorization check
    const isAdmin = req.user.role === 'admin';
    let isOwner = false;

    if (req.user.role === 'organization') {
      const org = await Organization.findOne({ user: req.user.id });
      if (org && campaign.organization.toString() === org._id.toString()) {
        isOwner = true;
      }
    }

    if (!isAdmin && !isOwner) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to access this confidential document.'
      });
    }

    const { url: previewUrl, expiresAt } = generateSecureSignedUrl(
      document.publicId,
      document.fileType,
      3600
    );

    if (req.query.redirect === 'true') {
      return res.redirect(previewUrl);
    }

    res.json({
      success: true,
      previewUrl,
      expiresAt,
      document: {
        id: document._id,
        title: document.title,
        documentType: document.documentType,
        fileType: document.fileType,
        visibility: document.visibility,
        verificationStatus: document.verificationStatus
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Verify or reject a campaign document (Admin only)
// @route   PATCH /api/admin/documents/:docId/verify
// @access  Private (Admin only)
const verifyDocument = async (req, res, next) => {
  try {
    const { docId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(docId)) {
      return res.status(400).json({ success: false, message: 'Invalid document ID.' });
    }

    const { status, note } = req.body;
    if (!['verified', 'rejected'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid verification status. Must be either "verified" or "rejected".'
      });
    }

    const document = await CampaignDocument.findById(docId);
    if (!document) {
      return res.status(404).json({ success: false, message: 'Document not found.' });
    }

    document.verificationStatus = status;
    document.verificationNote = note ? note.trim() : (status === 'verified' ? 'Document verified by Admin' : 'Document rejected by Admin');
    document.verifiedBy = req.user.id;
    document.verifiedAt = new Date();
    await document.save();

    // Notify campaign owner
    const campaign = await Campaign.findById(document.campaign);
    if (campaign) {
      const notifType = status === 'verified' ? 'campaign_document_verified' : 'campaign_document_rejected';
      const notifTitle = status === 'verified' ? '📄 Document Verified' : '❌ Document Rejected';
      const notifMsg = status === 'verified'
        ? `Your document "${document.title}" for campaign "${campaign.title}" has been verified.`
        : `Your document "${document.title}" for campaign "${campaign.title}" was rejected. ${document.verificationNote}`;

      try {
        await notify({
          recipient: campaign.createdBy,
          type: notifType,
          title: notifTitle,
          message: notifMsg,
          data: { campaignId: campaign._id, documentId: document._id },
          priority: status === 'verified' ? 'medium' : 'high'
        });
      } catch (err) {
        console.error('Document verification notification error:', err.message);
      }

      try {
        const io = getIO();
        if (io) {
          io.to(`user-${campaign.createdBy}`).emit('campaign_document_status_update', {
            documentId: document._id,
            campaignId: campaign._id,
            status: document.verificationStatus,
            note: document.verificationNote
          });
        }
      } catch (err) {
        console.error('Socket emit error:', err.message);
      }
    }

    res.json({
      success: true,
      message: `Document has been ${status}.`,
      data: document
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Admin requests additional information from organization
// @route   POST /api/admin/campaigns/:id/request-info
// @access  Private (Admin only)
const requestMoreInformation = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: 'Invalid campaign ID.' });
    }

    const { reason, requestedTypes } = req.body;
    if (!reason || !reason.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Reason for requesting more information is required.'
      });
    }

    const campaign = await Campaign.findById(id);
    if (!campaign) {
      return res.status(404).json({ success: false, message: 'Campaign not found.' });
    }

    const types = Array.isArray(requestedTypes) ? requestedTypes : [];

    campaign.verificationStatus = 'more_info_required';
    campaign.verificationFeedback = reason.trim();
    campaign.verificationHistory.push({
      status: 'more_info_required',
      note: reason.trim(),
      actionBy: req.user.id,
      actionAt: new Date(),
      requestedTypes: types
    });

    await campaign.save();

    // Create notification
    try {
      await notify({
        recipient: campaign.createdBy,
        type: 'campaign_more_info_required',
        title: '📋 Additional Information Required',
        message: `Action required for campaign "${campaign.title}": ${reason.trim()}`,
        data: { campaignId: campaign._id, extra: { requestedTypes: types } },
        priority: 'high'
      });
    } catch (err) {
      console.error('Request info notification error:', err.message);
    }

    try {
      const io = getIO();
      if (io) {
        io.to(`user-${campaign.createdBy}`).emit('campaign_verification_update', {
          campaignId: campaign._id,
          verificationStatus: 'more_info_required',
          reason: reason.trim(),
          requestedTypes: types
        });
      }
    } catch (err) {
      console.error('Socket emit error:', err.message);
    }

    res.json({
      success: true,
      message: 'More information requested from organization.',
      data: campaign
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Admin changes campaign verification status
// @route   PATCH /api/admin/campaigns/:id/verify-status
// @access  Private (Admin only)
const verifyCampaignStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: 'Invalid campaign ID.' });
    }

    const { status, note } = req.body;
    if (!status || !ALLOWED_CAMPAIGN_VERIFY_STATUSES.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Invalid campaign verification status. Allowed: ${ALLOWED_CAMPAIGN_VERIFY_STATUSES.join(', ')}`
      });
    }

    const campaign = await Campaign.findById(id);
    if (!campaign) {
      return res.status(404).json({ success: false, message: 'Campaign not found.' });
    }

    const cleanNote = note ? note.trim() : '';

    campaign.verificationStatus = status;
    campaign.verificationFeedback = cleanNote;
    campaign.verificationHistory.push({
      status,
      note: cleanNote,
      actionBy: req.user.id,
      actionAt: new Date()
    });

    await campaign.save();

    try {
      if (status === 'verified') {
        await notify({
          recipient: campaign.createdBy,
          type: 'campaign_verified',
          title: '🎉 Campaign Verified!',
          message: `Your campaign "${campaign.title}" has been successfully verified!`,
          data: { campaignId: campaign._id },
          priority: 'high'
        });
      } else if (status === 'rejected') {
        await notify({
          recipient: campaign.createdBy,
          type: 'campaign_rejected',
          title: '❌ Campaign Verification Rejected',
          message: `Campaign "${campaign.title}" verification was rejected. ${cleanNote}`,
          data: { campaignId: campaign._id },
          priority: 'high'
        });
      }
    } catch (err) {
      console.error('Campaign verify notification error:', err.message);
    }

    try {
      const io = getIO();
      if (io) {
        io.to(`user-${campaign.createdBy}`).emit('campaign_verification_update', {
          campaignId: campaign._id,
          verificationStatus: status,
          note: cleanNote
        });
      }
    } catch (err) {
      console.error('Socket emit error:', err.message);
    }

    res.json({
      success: true,
      message: `Campaign verification status updated to ${status}.`,
      data: campaign
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Organization submits/resubmits campaign for verification
// @route   POST /api/campaigns/:id/submit-verification
// @access  Private (Organization only)
const submitCampaignForVerification = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: 'Invalid campaign ID.' });
    }

    const campaign = await Campaign.findById(id);
    if (!campaign) {
      return res.status(404).json({ success: false, message: 'Campaign not found.' });
    }

    const org = await Organization.findOne({ user: req.user.id });
    if (!org || campaign.organization.toString() !== org._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to submit verification for this campaign.'
      });
    }

    const currentStatus = campaign.verificationStatus || 'not_submitted';
    if (['pending', 'under_review', 'verified'].includes(currentStatus)) {
      return res.status(400).json({
        success: false,
        message: `Campaign is already ${currentStatus.replace('_', ' ')}.`
      });
    }

    // Optional check: ensure documents or fund utilization exist
    const docCount = await CampaignDocument.countDocuments({ campaign: campaign._id });
    const hasUtilization = campaign.fundUtilization && campaign.fundUtilization.length > 0;

    if (docCount === 0 && !hasUtilization) {
      return res.status(400).json({
        success: false,
        message: 'Please provide proof documents or a fund utilization breakdown before submitting for verification.'
      });
    }

    const submitNote = req.body.note ? req.body.note.trim() : (
      currentStatus === 'more_info_required'
        ? 'Resubmitted with requested information by organization'
        : 'Submitted for verification by organization'
    );

    campaign.verificationStatus = 'pending';
    campaign.verificationHistory.push({
      status: 'pending',
      note: submitNote,
      actionBy: req.user.id,
      actionAt: new Date()
    });

    await campaign.save();

    try {
      const io = getIO();
      if (io) {
        io.to('admin-room').emit('campaign_verification_submitted', {
          campaignId: campaign._id,
          title: campaign.title,
          organization: org.name,
          resubmission: currentStatus === 'more_info_required'
        });
      }
    } catch (err) {
      console.error('Socket emit error:', err.message);
    }

    res.json({
      success: true,
      message: currentStatus === 'more_info_required'
        ? 'Campaign resubmitted for verification review!'
        : 'Campaign submitted for verification review!',
      data: campaign
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  uploadCampaignDocument,
  getCampaignDocuments,
  deleteCampaignDocument,
  updateFundUtilization,
  getPublicCampaignProofs,
  getSecureDocumentPreview,
  verifyDocument,
  requestMoreInformation,
  verifyCampaignStatus,
  submitCampaignForVerification
};
