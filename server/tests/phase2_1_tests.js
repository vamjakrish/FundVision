const assert = require('assert');
const path = require('path');
const mongoose = require('mongoose');

// Ensure test environment variables
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test_jwt_secret_key_for_testing_purposes_only_32chars';

// Load modules under test
const {
  validateProofFile,
  detectMimeTypeFromBuffer,
  sanitizeFilename,
  MAX_FILE_SIZE_BYTES
} = require('../utils/fileValidation');
const CampaignDocument = require('../models/CampaignDocument');
const Campaign = require('../models/Campaign');
const Notification = require('../models/Notification');
const Organization = require('../models/Organization');
const User = require('../models/User');
const { generateSecureSignedUrl } = require('../config/cloudinary');
const {
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
} = require('../controllers/proofController');
const { getOrganization, getOrganizations } = require('../controllers/organizationController');
const { getVerificationQueue } = require('../controllers/adminController');

// Mock notify helper to avoid live DB calls in standalone unit tests
const notifyModule = require('../utils/notify');

// Test results tracker
const results = {
  passed: 0,
  failed: 0,
  tests: []
};

const allTestFunctions = [];

function registerTest(name, fn) {
  allTestFunctions.push({ name, fn, isAsync: false });
}

function registerAsyncTest(name, fn) {
  allTestFunctions.push({ name, fn, isAsync: true });
}

// Helper: create mock request/response
function createMockReqRes(options = {}) {
  const req = {
    params: options.params || {},
    query: options.query || {},
    body: options.body || {},
    file: options.file || null,
    user: options.user || null,
    headers: options.headers || {}
  };

  const res = {
    statusCode: 200,
    data: null,
    redirectUrl: null,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(obj) {
      this.data = obj;
      return this;
    },
    redirect(url) {
      this.redirectUrl = url;
      return this;
    }
  };

  const next = (err) => {
    if (err) res.error = err;
  };

  return { req, res, next };
}

// Helper mock buffers
const PDF_BUFFER = Buffer.from('%PDF-1.4 mock content for pdf test document');
const JPEG_BUFFER = Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46, 0x00, 0x01]);
const PNG_BUFFER = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00, 0x00, 0x0d]);
const WEBP_BUFFER = Buffer.concat([
  Buffer.from([0x52, 0x49, 0x46, 0x46]), // 'RIFF'
  Buffer.from([0x00, 0x00, 0x00, 0x00]), // file size placeholder
  Buffer.from([0x57, 0x45, 0x42, 0x50])  // 'WEBP'
]);
const SPOOFED_PDF_BUFFER = Buffer.from('MZ\x90\x00\x03\x00\x00\x00\x04\x00\x00\x00\xFF\xFF'); // PE executable header

// -------------------------------------------------------------
// GROUP 1: FILE VALIDATION & SECURITY
// -------------------------------------------------------------
registerTest('Detects valid PDF magic bytes (%PDF-)', () => {
  const mime = detectMimeTypeFromBuffer(PDF_BUFFER);
  assert.strictEqual(mime, 'application/pdf');
});

registerTest('Detects valid JPEG magic bytes (FF D8 FF)', () => {
  const mime = detectMimeTypeFromBuffer(JPEG_BUFFER);
  assert.strictEqual(mime, 'image/jpeg');
});

registerTest('Detects valid PNG magic bytes (89 50 4E 47)', () => {
  const mime = detectMimeTypeFromBuffer(PNG_BUFFER);
  assert.strictEqual(mime, 'image/png');
});

registerTest('Detects valid WEBP magic bytes (RIFF....WEBP)', () => {
  const mime = detectMimeTypeFromBuffer(WEBP_BUFFER);
  assert.strictEqual(mime, 'image/webp');
});

registerTest('Rejects unrecognized file signature', () => {
  const badBuffer = Buffer.from('Random plain text content');
  const mime = detectMimeTypeFromBuffer(badBuffer);
  assert.strictEqual(mime, null);
});

registerTest('Rejects oversized file (>15MB)', () => {
  const fakeBigFile = {
    originalname: 'big_estimate.pdf',
    mimetype: 'application/pdf',
    size: 16 * 1024 * 1024,
    buffer: PDF_BUFFER
  };
  const result = validateProofFile(fakeBigFile);
  assert.strictEqual(result.valid, false);
  assert.ok(result.error.includes('15MB limit'));
});

registerTest('Rejects unsupported file extension (.exe)', () => {
  const exeFile = {
    originalname: 'malware.exe',
    mimetype: 'application/octet-stream',
    size: 1024,
    buffer: Buffer.from('MZ\x90')
  };
  const result = validateProofFile(exeFile);
  assert.strictEqual(result.valid, false);
  assert.ok(result.error.includes('Unsupported file extension'));
});

registerTest('MIME spoofing detected and rejected (EXE renamed to .pdf)', () => {
  const spoofedFile = {
    originalname: 'invoice.pdf',
    mimetype: 'application/pdf',
    size: 1024,
    buffer: SPOOFED_PDF_BUFFER
  };
  const result = validateProofFile(spoofedFile);
  assert.strictEqual(result.valid, false);
  assert.ok(result.error.includes('magic number verification failed') || result.error.includes('MIME spoofing'));
});

registerTest('Path traversal in filename is sanitized', () => {
  const sanitized = sanitizeFilename('../../../etc/passwd.pdf');
  assert.strictEqual(sanitized, 'passwd.pdf');
  assert.ok(!sanitized.includes('/'));
  assert.ok(!sanitized.includes('..'));
});

registerTest('Null bytes and special characters in filename are stripped', () => {
  const sanitized = sanitizeFilename('hospital_report\0@$#*!~.png');
  assert.strictEqual(sanitized, 'hospital_report______.png');
});

// -------------------------------------------------------------
// GROUP 2: SCHEMA & MODEL VALIDATION
// -------------------------------------------------------------
registerTest('CampaignDocument schema includes all required fields and default visibility admin_only', () => {
  const doc = new CampaignDocument({
    campaign: new mongoose.Types.ObjectId(),
    organization: new mongoose.Types.ObjectId(),
    uploadedBy: new mongoose.Types.ObjectId(),
    documentType: 'hospital_estimate',
    title: 'Apollo Hospital Estimate',
    fileUrl: 'https://res.cloudinary.com/fundvision/image/upload/sample.pdf',
    publicId: 'fundvision/campaign-proofs/sample',
    fileType: 'application/pdf',
    fileSizeBytes: 102400
  });

  assert.strictEqual(doc.visibility, 'admin_only');
  assert.strictEqual(doc.verificationStatus, 'pending');
  assert.strictEqual(doc.title, 'Apollo Hospital Estimate');
});

registerTest('CampaignDocument schema rejects invalid documentType', () => {
  const doc = new CampaignDocument({
    campaign: new mongoose.Types.ObjectId(),
    organization: new mongoose.Types.ObjectId(),
    uploadedBy: new mongoose.Types.ObjectId(),
    documentType: 'invalid_type_xyz',
    title: 'Test Doc',
    fileUrl: 'https://example.com/doc.pdf',
    publicId: 'sample_id',
    fileType: 'application/pdf',
    fileSizeBytes: 1024
  });

  const err = doc.validateSync();
  assert.ok(err);
  assert.ok(err.errors['documentType']);
});

registerTest('CampaignDocument schema rejects invalid visibility', () => {
  const doc = new CampaignDocument({
    campaign: new mongoose.Types.ObjectId(),
    organization: new mongoose.Types.ObjectId(),
    uploadedBy: new mongoose.Types.ObjectId(),
    documentType: 'medical_report',
    title: 'Test Medical Report',
    fileUrl: 'https://example.com/doc.pdf',
    publicId: 'sample_id',
    fileType: 'application/pdf',
    fileSizeBytes: 1024,
    visibility: 'super_secret'
  });

  const err = doc.validateSync();
  assert.ok(err);
  assert.ok(err.errors['visibility']);
});

registerTest('Campaign schema verificationStatus defaults to not_submitted (Backward Compatibility)', () => {
  const campaign = new Campaign({
    organization: new mongoose.Types.ObjectId(),
    createdBy: new mongoose.Types.ObjectId(),
    title: 'Save Children Education Fund',
    description: 'A campaign for children education.',
    story: 'Long campaign story goes here...',
    category: 'Education',
    goalAmount: 100000,
    deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
  });

  assert.strictEqual(campaign.verificationStatus, 'not_submitted');
  assert.strictEqual(campaign.verificationFeedback, null);
  assert.deepStrictEqual(campaign.verificationHistory.toObject(), []);
  assert.deepStrictEqual(campaign.fundUtilization.toObject(), []);
});

registerTest('Campaign virtual totalUtilization calculates correct sum', () => {
  const campaign = new Campaign({
    organization: new mongoose.Types.ObjectId(),
    createdBy: new mongoose.Types.ObjectId(),
    title: 'Cardiac Surgery Support',
    description: 'Medical support for surgery.',
    story: 'Detailed story...',
    category: 'Medical',
    goalAmount: 350000,
    deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    fundUtilization: [
      { purpose: 'Surgery & Surgeon Charges', estimatedAmount: 200000, description: 'Operation cost' },
      { purpose: 'Post-op ICU & Medicines', estimatedAmount: 100000, description: 'Medication' },
      { purpose: 'Diagnostic Tests & Scans', estimatedAmount: 50000, description: 'Lab tests' }
    ]
  });

  assert.strictEqual(campaign.totalUtilization, 350000);
});

registerTest('Notification model supports new verification notification types', () => {
  const notifTypes = [
    'campaign_more_info_required',
    'campaign_document_verified',
    'campaign_document_rejected',
    'campaign_verified'
  ];

  for (const type of notifTypes) {
    const notif = new Notification({
      recipient: new mongoose.Types.ObjectId(),
      type,
      title: 'Test Notification',
      message: 'Test verification update message'
    });
    const err = notif.validateSync();
    assert.ifError(err);
  }
});

// -------------------------------------------------------------
// GROUP 3: DOCUMENT UPLOAD & VISIBILITY TESTS
// -------------------------------------------------------------
registerAsyncTest('Organization uploads valid PDF document', async () => {
  const orgUser = new mongoose.Types.ObjectId();
  const orgId = new mongoose.Types.ObjectId();
  const campaignId = new mongoose.Types.ObjectId();

  const origFindCampaign = Campaign.findById;
  const origFindOrg = Organization.findOne;
  const origCreateDoc = CampaignDocument.create;

  Campaign.findById = async () => ({
    _id: campaignId,
    organization: orgId
  });

  Organization.findOne = async () => ({
    _id: orgId,
    user: orgUser
  });

  let createdDocData = null;
  CampaignDocument.create = async (data) => {
    createdDocData = data;
    return { _id: new mongoose.Types.ObjectId(), ...data };
  };

  try {
    const { req, res, next } = createMockReqRes({
      params: { id: campaignId.toString() },
      user: { id: orgUser.toString(), role: 'organization' },
      body: {
        documentType: 'hospital_estimate',
        title: 'Apollo Hospital Estimate'
      },
      file: {
        originalname: 'estimate.pdf',
        mimetype: 'application/pdf',
        size: 1024,
        buffer: PDF_BUFFER
      }
    });

    await uploadCampaignDocument(req, res, next);
    assert.strictEqual(res.statusCode, 201);
    assert.strictEqual(res.data.success, true);
    assert.strictEqual(createdDocData.visibility, 'admin_only');
    assert.strictEqual(createdDocData.verificationStatus, 'pending');
    assert.strictEqual(createdDocData.documentType, 'hospital_estimate');
  } finally {
    Campaign.findById = origFindCampaign;
    Organization.findOne = origFindOrg;
    CampaignDocument.create = origCreateDoc;
  }
});

registerAsyncTest('Organization uploads valid image (PNG) with explicit public visibility', async () => {
  const orgUser = new mongoose.Types.ObjectId();
  const orgId = new mongoose.Types.ObjectId();
  const campaignId = new mongoose.Types.ObjectId();

  const origFindCampaign = Campaign.findById;
  const origFindOrg = Organization.findOne;
  const origCreateDoc = CampaignDocument.create;

  Campaign.findById = async () => ({
    _id: campaignId,
    organization: orgId
  });

  Organization.findOne = async () => ({
    _id: orgId,
    user: orgUser
  });

  let createdDocData = null;
  CampaignDocument.create = async (data) => {
    createdDocData = data;
    return { _id: new mongoose.Types.ObjectId(), ...data };
  };

  try {
    const { req, res, next } = createMockReqRes({
      params: { id: campaignId.toString() },
      user: { id: orgUser.toString(), role: 'organization' },
      body: {
        documentType: 'site_photo',
        title: 'Construction Site Photo',
        visibility: 'public'
      },
      file: {
        originalname: 'site_image.png',
        mimetype: 'image/png',
        size: 2048,
        buffer: PNG_BUFFER
      }
    });

    await uploadCampaignDocument(req, res, next);
    assert.strictEqual(res.statusCode, 201);
    assert.strictEqual(res.data.success, true);
    assert.strictEqual(createdDocData.visibility, 'public');
    assert.strictEqual(createdDocData.verificationStatus, 'pending');
  } finally {
    Campaign.findById = origFindCampaign;
    Organization.findOne = origFindOrg;
    CampaignDocument.create = origCreateDoc;
  }
});

// -------------------------------------------------------------
// GROUP 4: FUND UTILIZATION VALIDATION LOGIC
// -------------------------------------------------------------
registerAsyncTest('Fund utilization rejects non-array or empty inputs', async () => {
  const orgUser = new mongoose.Types.ObjectId();
  const orgId = new mongoose.Types.ObjectId();
  const campaignId = new mongoose.Types.ObjectId();

  const origFindCampaign = Campaign.findById;
  const origFindOrg = Organization.findOne;

  Campaign.findById = async () => ({
    _id: campaignId,
    organization: orgId,
    goalAmount: 100000,
    save: async function() { return this; }
  });

  Organization.findOne = async () => ({
    _id: orgId,
    user: orgUser
  });

  try {
    const { req, res, next } = createMockReqRes({
      params: { id: campaignId.toString() },
      user: { id: orgUser.toString(), role: 'organization' },
      body: { fundUtilization: [] }
    });

    await updateFundUtilization(req, res, next);
    assert.strictEqual(res.statusCode, 400);
    assert.ok(res.data && res.data.message.includes('non-empty array'));
  } finally {
    Campaign.findById = origFindCampaign;
    Organization.findOne = origFindOrg;
  }
});

registerAsyncTest('Fund utilization rejects negative or zero estimated amounts', async () => {
  const orgUser = new mongoose.Types.ObjectId();
  const orgId = new mongoose.Types.ObjectId();
  const campaignId = new mongoose.Types.ObjectId();

  const origFindCampaign = Campaign.findById;
  const origFindOrg = Organization.findOne;

  Campaign.findById = async () => ({
    _id: campaignId,
    organization: orgId,
    goalAmount: 100000,
    save: async function() { return this; }
  });

  Organization.findOne = async () => ({
    _id: orgId,
    user: orgUser
  });

  try {
    const { req, res, next } = createMockReqRes({
      params: { id: campaignId.toString() },
      user: { id: orgUser.toString(), role: 'organization' },
      body: {
        fundUtilization: [
          { purpose: 'Valid Treatment', estimatedAmount: 100000 },
          { purpose: 'Negative Fee', estimatedAmount: -5000 }
        ]
      }
    });

    await updateFundUtilization(req, res, next);
    assert.strictEqual(res.statusCode, 400);
    assert.ok(res.data && res.data.message.includes('greater than 0'));
  } finally {
    Campaign.findById = origFindCampaign;
    Organization.findOne = origFindOrg;
  }
});

registerAsyncTest('Fund utilization rejects non-numeric or NaN estimated amounts', async () => {
  const orgUser = new mongoose.Types.ObjectId();
  const orgId = new mongoose.Types.ObjectId();
  const campaignId = new mongoose.Types.ObjectId();

  const origFindCampaign = Campaign.findById;
  const origFindOrg = Organization.findOne;

  Campaign.findById = async () => ({
    _id: campaignId,
    organization: orgId,
    goalAmount: 100000,
    save: async function() { return this; }
  });

  Organization.findOne = async () => ({
    _id: orgId,
    user: orgUser
  });

  try {
    const { req, res, next } = createMockReqRes({
      params: { id: campaignId.toString() },
      user: { id: orgUser.toString(), role: 'organization' },
      body: {
        fundUtilization: [
          { purpose: 'Medicine', estimatedAmount: 'invalid_number' }
        ]
      }
    });

    await updateFundUtilization(req, res, next);
    assert.strictEqual(res.statusCode, 400);
    assert.ok(res.data && res.data.message.includes('greater than 0'));
  } finally {
    Campaign.findById = origFindCampaign;
    Organization.findOne = origFindOrg;
  }
});

registerAsyncTest('Fund utilization enforces goal matching tolerance', async () => {
  const orgUser = new mongoose.Types.ObjectId();
  const orgId = new mongoose.Types.ObjectId();
  const campaignId = new mongoose.Types.ObjectId();

  const origFindCampaign = Campaign.findById;
  const origFindOrg = Organization.findOne;

  Campaign.findById = async () => ({
    _id: campaignId,
    organization: orgId,
    goalAmount: 100000,
    save: async function() { return this; }
  });

  Organization.findOne = async () => ({
    _id: orgId,
    user: orgUser
  });

  try {
    // Total ₹25000 vs Goal ₹100000 (huge deviation)
    const { req, res, next } = createMockReqRes({
      params: { id: campaignId.toString() },
      user: { id: orgUser.toString(), role: 'organization' },
      body: {
        fundUtilization: [
          { purpose: 'Initial Consultation', estimatedAmount: 25000 }
        ]
      }
    });

    await updateFundUtilization(req, res, next);
    assert.strictEqual(res.statusCode, 400);
    assert.ok(res.data && res.data.message.includes('does not match campaign goal'));
  } finally {
    Campaign.findById = origFindCampaign;
    Organization.findOne = origFindOrg;
  }
});

registerAsyncTest('Fund utilization correctly saves valid matching breakdown', async () => {
  const orgUser = new mongoose.Types.ObjectId();
  const orgId = new mongoose.Types.ObjectId();
  const campaignId = new mongoose.Types.ObjectId();

  const origFindCampaign = Campaign.findById;
  const origFindOrg = Organization.findOne;

  let savedUtilization = null;
  Campaign.findById = async () => ({
    _id: campaignId,
    organization: orgId,
    goalAmount: 100000,
    fundUtilization: [],
    save: async function() {
      savedUtilization = this.fundUtilization;
      return this;
    }
  });

  Organization.findOne = async () => ({
    _id: orgId,
    user: orgUser
  });

  try {
    const { req, res, next } = createMockReqRes({
      params: { id: campaignId.toString() },
      user: { id: orgUser.toString(), role: 'organization' },
      body: {
        fundUtilization: [
          { purpose: 'Hospital Care', estimatedAmount: 60000, description: 'ICU stay' },
          { purpose: 'Medicines', estimatedAmount: 40000, description: 'Prescription antibiotics' }
        ]
      }
    });

    await updateFundUtilization(req, res, next);
    assert.strictEqual(res.statusCode, 200);
    assert.strictEqual(res.data.success, true);
    assert.strictEqual(res.data.data.totalEstimatedAmount, 100000);
    assert.strictEqual(savedUtilization.length, 2);
  } finally {
    Campaign.findById = origFindCampaign;
    Organization.findOne = origFindOrg;
  }
});

// -------------------------------------------------------------
// GROUP 5: AUTHORIZATION, OWNERSHIP & IDOR TESTS
// -------------------------------------------------------------
registerAsyncTest('IDOR Prevention: Organization cannot upload documents to another organization campaign', async () => {
  const attackerUser = new mongoose.Types.ObjectId();
  const attackerOrgId = new mongoose.Types.ObjectId();
  const victimOrgId = new mongoose.Types.ObjectId();
  const campaignId = new mongoose.Types.ObjectId();

  const origFindCampaign = Campaign.findById;
  const origFindOrg = Organization.findOne;

  Campaign.findById = async () => ({
    _id: campaignId,
    organization: victimOrgId
  });

  Organization.findOne = async () => ({
    _id: attackerOrgId,
    user: attackerUser
  });

  try {
    const { req, res, next } = createMockReqRes({
      params: { id: campaignId.toString() },
      user: { id: attackerUser.toString(), role: 'organization' },
      body: {
        documentType: 'hospital_estimate',
        title: 'Malicious Document'
      },
      file: {
        originalname: 'estimate.pdf',
        mimetype: 'application/pdf',
        size: 1024,
        buffer: PDF_BUFFER
      }
    });

    await uploadCampaignDocument(req, res, next);
    assert.strictEqual(res.statusCode, 403);
    assert.ok(res.data && res.data.message.includes('Not authorized'));
  } finally {
    Campaign.findById = origFindCampaign;
    Organization.findOne = origFindOrg;
  }
});

registerAsyncTest('IDOR Prevention: Organization cannot view another organization confidential documents', async () => {
  const attackerUser = new mongoose.Types.ObjectId();
  const attackerOrgId = new mongoose.Types.ObjectId();
  const victimOrgId = new mongoose.Types.ObjectId();
  const campaignId = new mongoose.Types.ObjectId();

  const origFindCampaign = Campaign.findById;
  const origFindOrg = Organization.findOne;

  Campaign.findById = async () => ({
    _id: campaignId,
    organization: victimOrgId
  });

  Organization.findOne = async () => ({
    _id: attackerOrgId,
    user: attackerUser
  });

  try {
    const { req, res, next } = createMockReqRes({
      params: { id: campaignId.toString() },
      user: { id: attackerUser.toString(), role: 'organization' }
    });

    await getCampaignDocuments(req, res, next);
    assert.strictEqual(res.statusCode, 403);
    assert.ok(res.data && res.data.message.includes('Not authorized'));
  } finally {
    Campaign.findById = origFindCampaign;
    Organization.findOne = origFindOrg;
  }
});

registerAsyncTest('Admin can view any campaign documents', async () => {
  const adminUser = new mongoose.Types.ObjectId();
  const orgId = new mongoose.Types.ObjectId();
  const campaignId = new mongoose.Types.ObjectId();

  const origFindCampaign = Campaign.findById;
  const origFindDocs = CampaignDocument.find;

  Campaign.findById = async () => ({
    _id: campaignId,
    organization: orgId
  });

  CampaignDocument.find = () => ({
    populate: () => ({
      populate: () => ({
        sort: async () => [
          { _id: new mongoose.Types.ObjectId(), title: 'Hospital Bill', visibility: 'admin_only' }
        ]
      })
    })
  });

  try {
    const { req, res, next } = createMockReqRes({
      params: { id: campaignId.toString() },
      user: { id: adminUser.toString(), role: 'admin' }
    });

    await getCampaignDocuments(req, res, next);
    assert.strictEqual(res.statusCode, 200);
    assert.ok(res.data && res.data.success);
    assert.strictEqual(res.data.count, 1);
  } finally {
    Campaign.findById = origFindCampaign;
    CampaignDocument.find = origFindDocs;
  }
});

registerAsyncTest('Organization cannot delete a verified document', async () => {
  const orgUser = new mongoose.Types.ObjectId();
  const orgId = new mongoose.Types.ObjectId();
  const campaignId = new mongoose.Types.ObjectId();
  const docId = new mongoose.Types.ObjectId();

  const origFindDoc = CampaignDocument.findById;
  const origFindOrg = Organization.findOne;

  CampaignDocument.findById = async () => ({
    _id: docId,
    campaign: campaignId,
    organization: orgId,
    verificationStatus: 'verified',
    publicId: 'sample/id'
  });

  Organization.findOne = async () => ({
    _id: orgId,
    user: orgUser
  });

  try {
    const { req, res, next } = createMockReqRes({
      params: { id: campaignId.toString(), docId: docId.toString() },
      user: { id: orgUser.toString(), role: 'organization' }
    });

    await deleteCampaignDocument(req, res, next);
    assert.strictEqual(res.statusCode, 403);
    assert.ok(res.data && res.data.message.includes('Cannot delete a verified document'));
  } finally {
    CampaignDocument.findById = origFindDoc;
    Organization.findOne = origFindOrg;
  }
});

// -------------------------------------------------------------
// GROUP 6: SECURE PREVIEW & PUBLIC PROOF SANITIZATION
// -------------------------------------------------------------
registerAsyncTest('Unauthorized donor cannot preview confidential document', async () => {
  const donorUser = new mongoose.Types.ObjectId();
  const orgId = new mongoose.Types.ObjectId();
  const campaignId = new mongoose.Types.ObjectId();
  const docId = new mongoose.Types.ObjectId();

  const origFindDoc = CampaignDocument.findById;
  const origFindCampaign = Campaign.findById;

  CampaignDocument.findById = async () => ({
    _id: docId,
    campaign: campaignId,
    organization: orgId,
    publicId: 'secret/proof.pdf',
    fileType: 'application/pdf',
    visibility: 'admin_only'
  });

  Campaign.findById = async () => ({
    _id: campaignId,
    organization: orgId
  });

  try {
    const { req, res, next } = createMockReqRes({
      params: { docId: docId.toString() },
      user: { id: donorUser.toString(), role: 'donor' }
    });

    await getSecureDocumentPreview(req, res, next);
    assert.strictEqual(res.statusCode, 403);
    assert.ok(res.data && res.data.message.includes('Not authorized'));
  } finally {
    CampaignDocument.findById = origFindDoc;
    Campaign.findById = origFindCampaign;
  }
});

registerAsyncTest('Authorized Org owner receives secure preview URL with expiration', async () => {
  const orgUser = new mongoose.Types.ObjectId();
  const orgId = new mongoose.Types.ObjectId();
  const campaignId = new mongoose.Types.ObjectId();
  const docId = new mongoose.Types.ObjectId();

  const origFindDoc = CampaignDocument.findById;
  const origFindCampaign = Campaign.findById;
  const origFindOrg = Organization.findOne;

  CampaignDocument.findById = async () => ({
    _id: docId,
    title: 'Hospital Estimation Slip',
    documentType: 'hospital_estimate',
    campaign: campaignId,
    organization: orgId,
    publicId: 'fundvision/campaign-proofs/proof123',
    fileType: 'application/pdf',
    visibility: 'admin_only',
    verificationStatus: 'pending'
  });

  Campaign.findById = async () => ({
    _id: campaignId,
    organization: orgId
  });

  Organization.findOne = async () => ({
    _id: orgId,
    user: orgUser
  });

  try {
    const { req, res, next } = createMockReqRes({
      params: { docId: docId.toString() },
      user: { id: orgUser.toString(), role: 'organization' }
    });

    await getSecureDocumentPreview(req, res, next);
    assert.strictEqual(res.statusCode, 200);
    assert.ok(res.data && res.data.success);
    assert.ok(res.data.previewUrl);
    assert.ok(res.data.expiresAt);
  } finally {
    CampaignDocument.findById = origFindDoc;
    Campaign.findById = origFindCampaign;
    Organization.findOne = origFindOrg;
  }
});

registerAsyncTest('Public Proofs API only returns verified & public documents, never leaks publicId', async () => {
  const campaignId = new mongoose.Types.ObjectId();

  const origFindCampaign = Campaign.findOne;
  const origFindDocs = CampaignDocument.find;
  const origCountDocs = CampaignDocument.countDocuments;

  Campaign.findOne = async () => ({
    _id: campaignId,
    title: 'Flood Relief 2026',
    verificationStatus: 'verified',
    goalAmount: 500000,
    fundUtilization: [
      { purpose: 'Food Packets', estimatedAmount: 300000 },
      { purpose: 'Temporary Shelter', estimatedAmount: 200000 }
    ]
  });

  CampaignDocument.find = () => ({
    sort: async () => [
      {
        _id: new mongoose.Types.ObjectId(),
        documentType: 'government_certificate',
        title: 'District Collector Approval',
        description: 'Official authorization letter',
        fileUrl: 'https://res.cloudinary.com/fundvision/image/upload/doc1.pdf',
        fileType: 'application/pdf',
        fileSizeBytes: 204800,
        visibility: 'public',
        verificationStatus: 'verified',
        publicId: 'LEAKED_INTERNAL_PUBLIC_ID_XYZ',
        uploadedBy: new mongoose.Types.ObjectId(),
        createdAt: new Date(),
        verifiedAt: new Date()
      }
    ]
  });

  CampaignDocument.countDocuments = async () => 3;

  try {
    const { req, res, next } = createMockReqRes({
      params: { id: campaignId.toString() }
    });

    await getPublicCampaignProofs(req, res, next);
    assert.strictEqual(res.statusCode, 200);
    assert.ok(res.data && res.data.success);
    assert.strictEqual(res.data.data.publicDocumentsCount, 1);
    assert.strictEqual(res.data.data.totalVerifiedDocumentsCount, 3);
    assert.strictEqual(res.data.data.totalUtilization, 500000);

    const publicDoc = res.data.data.documents[0];
    assert.strictEqual(publicDoc.title, 'District Collector Approval');
    assert.strictEqual(publicDoc.publicId, undefined, 'Public document must NOT contain publicId');
    assert.strictEqual(publicDoc.uploadedBy, undefined, 'Public document must NOT contain uploadedBy user id');
  } finally {
    Campaign.findOne = origFindCampaign;
    CampaignDocument.find = origFindDocs;
    CampaignDocument.countDocuments = origCountDocs;
  }
});

// -------------------------------------------------------------
// GROUP 7: ADMIN VERIFICATION & REQUEST-INFO WORKFLOWS
// -------------------------------------------------------------
registerAsyncTest('Admin verifies campaign document: updates status, records admin & timestamp', async () => {
  const adminId = new mongoose.Types.ObjectId();
  const docId = new mongoose.Types.ObjectId();
  const campaignId = new mongoose.Types.ObjectId();
  const ownerId = new mongoose.Types.ObjectId();

  const origFindDoc = CampaignDocument.findById;
  const origFindCampaign = Campaign.findById;

  let savedDoc = null;
  CampaignDocument.findById = async () => ({
    _id: docId,
    title: 'Hospital Quotation',
    campaign: campaignId,
    verificationStatus: 'pending',
    save: async function() {
      savedDoc = this;
      return this;
    }
  });

  Campaign.findById = async () => ({
    _id: campaignId,
    title: 'Heart Surgery Fund',
    createdBy: ownerId
  });

  try {
    const { req, res, next } = createMockReqRes({
      params: { docId: docId.toString() },
      user: { id: adminId.toString(), role: 'admin' },
      body: { status: 'verified', note: 'All stamps and doctor signatures verified' }
    });

    await verifyDocument(req, res, next);
    assert.strictEqual(res.statusCode, 200);
    assert.ok(res.data && res.data.success);
    assert.strictEqual(savedDoc.verificationStatus, 'verified');
    assert.strictEqual(savedDoc.verifiedBy.toString(), adminId.toString());
    assert.ok(savedDoc.verifiedAt instanceof Date);
    assert.strictEqual(savedDoc.verificationNote, 'All stamps and doctor signatures verified');
  } finally {
    CampaignDocument.findById = origFindDoc;
    Campaign.findById = origFindCampaign;
  }
});

registerAsyncTest('Admin rejects campaign document: records rejection reason & admin', async () => {
  const adminId = new mongoose.Types.ObjectId();
  const docId = new mongoose.Types.ObjectId();
  const campaignId = new mongoose.Types.ObjectId();
  const ownerId = new mongoose.Types.ObjectId();

  const origFindDoc = CampaignDocument.findById;
  const origFindCampaign = Campaign.findById;

  let savedDoc = null;
  CampaignDocument.findById = async () => ({
    _id: docId,
    title: 'Hospital Quotation',
    campaign: campaignId,
    verificationStatus: 'pending',
    save: async function() {
      savedDoc = this;
      return this;
    }
  });

  Campaign.findById = async () => ({
    _id: campaignId,
    title: 'Heart Surgery Fund',
    createdBy: ownerId
  });

  try {
    const { req, res, next } = createMockReqRes({
      params: { docId: docId.toString() },
      user: { id: adminId.toString(), role: 'admin' },
      body: { status: 'rejected', note: 'Missing official hospital stamp' }
    });

    await verifyDocument(req, res, next);
    assert.strictEqual(res.statusCode, 200);
    assert.ok(res.data && res.data.success);
    assert.strictEqual(savedDoc.verificationStatus, 'rejected');
    assert.strictEqual(savedDoc.verifiedBy.toString(), adminId.toString());
    assert.strictEqual(savedDoc.verificationNote, 'Missing official hospital stamp');
  } finally {
    CampaignDocument.findById = origFindDoc;
    Campaign.findById = origFindCampaign;
  }
});

registerAsyncTest('Admin requests more info: sets more_info_required, saves feedback & audit history', async () => {
  const adminId = new mongoose.Types.ObjectId();
  const campaignId = new mongoose.Types.ObjectId();
  const ownerId = new mongoose.Types.ObjectId();

  const origFindCampaign = Campaign.findById;

  let savedCampaign = null;
  Campaign.findById = async () => ({
    _id: campaignId,
    title: 'Cancer Treatment Fund',
    createdBy: ownerId,
    verificationStatus: 'under_review',
    verificationFeedback: null,
    verificationHistory: [],
    save: async function() {
      savedCampaign = this;
      return this;
    }
  });

  try {
    const { req, res, next } = createMockReqRes({
      params: { id: campaignId.toString() },
      user: { id: adminId.toString(), role: 'admin' },
      body: {
        reason: 'Please provide updated hospital estimate with seal and date.',
        requestedTypes: ['hospital_estimate', 'medical_report']
      }
    });

    await requestMoreInformation(req, res, next);
    assert.strictEqual(res.statusCode, 200);
    assert.ok(res.data && res.data.success);
    assert.strictEqual(savedCampaign.verificationStatus, 'more_info_required');
    assert.strictEqual(savedCampaign.verificationFeedback, 'Please provide updated hospital estimate with seal and date.');
    assert.strictEqual(savedCampaign.verificationHistory.length, 1);
    assert.strictEqual(savedCampaign.verificationHistory[0].status, 'more_info_required');
    assert.deepStrictEqual(savedCampaign.verificationHistory[0].requestedTypes, ['hospital_estimate', 'medical_report']);
  } finally {
    Campaign.findById = origFindCampaign;
  }
});

registerAsyncTest('Admin verifies campaign status: updates status and records audit history', async () => {
  const adminId = new mongoose.Types.ObjectId();
  const campaignId = new mongoose.Types.ObjectId();
  const ownerId = new mongoose.Types.ObjectId();

  const origFindCampaign = Campaign.findById;

  let savedCampaign = null;
  Campaign.findById = async () => ({
    _id: campaignId,
    title: 'School Reconstruction',
    createdBy: ownerId,
    verificationStatus: 'under_review',
    verificationFeedback: null,
    verificationHistory: [],
    save: async function() {
      savedCampaign = this;
      return this;
    }
  });

  try {
    const { req, res, next } = createMockReqRes({
      params: { id: campaignId.toString() },
      user: { id: adminId.toString(), role: 'admin' },
      body: { status: 'verified', note: 'All civil estimates and NGO credentials verified.' }
    });

    await verifyCampaignStatus(req, res, next);
    assert.strictEqual(res.statusCode, 200);
    assert.ok(res.data && res.data.success);
    assert.strictEqual(savedCampaign.verificationStatus, 'verified');
    assert.strictEqual(savedCampaign.verificationHistory.length, 1);
    assert.strictEqual(savedCampaign.verificationHistory[0].status, 'verified');
    assert.strictEqual(savedCampaign.verificationHistory[0].note, 'All civil estimates and NGO credentials verified.');
  } finally {
    Campaign.findById = origFindCampaign;
  }
});

registerAsyncTest('Admin rejects campaign status: records rejection and updates history', async () => {
  const adminId = new mongoose.Types.ObjectId();
  const campaignId = new mongoose.Types.ObjectId();
  const ownerId = new mongoose.Types.ObjectId();

  const origFindCampaign = Campaign.findById;

  let savedCampaign = null;
  Campaign.findById = async () => ({
    _id: campaignId,
    title: 'Suspicious Campaign',
    createdBy: ownerId,
    verificationStatus: 'pending',
    verificationFeedback: null,
    verificationHistory: [],
    save: async function() {
      savedCampaign = this;
      return this;
    }
  });

  try {
    const { req, res, next } = createMockReqRes({
      params: { id: campaignId.toString() },
      user: { id: adminId.toString(), role: 'admin' },
      body: { status: 'rejected', note: 'Unverifiable hospital partner' }
    });

    await verifyCampaignStatus(req, res, next);
    assert.strictEqual(res.statusCode, 200);
    assert.ok(res.data && res.data.success);
    assert.strictEqual(savedCampaign.verificationStatus, 'rejected');
    assert.strictEqual(savedCampaign.verificationHistory.length, 1);
    assert.strictEqual(savedCampaign.verificationHistory[0].status, 'rejected');
  } finally {
    Campaign.findById = origFindCampaign;
  }
});

// -------------------------------------------------------------
// GROUP 8: ORGANIZATION SENSITIVE DOCUMENT LEAK FIX
// -------------------------------------------------------------
registerAsyncTest('Public getOrganization does NOT leak documents or panNumber to anonymous donors', async () => {
  const orgOwnerUserId = new mongoose.Types.ObjectId();
  const orgId = new mongoose.Types.ObjectId();

  const origFindOrg = Organization.findById;

  Organization.findById = () => ({
    populate: () => ({
      populate: async () => ({
        _id: orgId,
        name: 'Care Trust India',
        user: { _id: orgOwnerUserId, name: 'Trustee', email: 'trustee@care.org' },
        panNumber: 'AAATC1234F',
        documents: {
          panCard: { url: 'https://cloudinary.com/pancard.pdf' },
          ngoCertificate: { url: 'https://cloudinary.com/ngo.pdf' }
        },
        toObject: function() {
          return {
            _id: this._id,
            name: this.name,
            user: this.user,
            panNumber: this.panNumber,
            documents: this.documents
          };
        }
      })
    })
  });

  try {
    const { req, res, next } = createMockReqRes({
      params: { id: orgId.toString() },
      user: null
    });

    await getOrganization(req, res, next);
    assert.strictEqual(res.statusCode, 200);
    assert.ok(res.data && res.data.success);
    assert.strictEqual(res.data.data.name, 'Care Trust India');
    assert.strictEqual(res.data.data.documents, undefined, 'Confidential documents must NOT be exposed to public');
    assert.strictEqual(res.data.data.panNumber, undefined, 'PAN number must NOT be exposed to public');
  } finally {
    Organization.findById = origFindOrg;
  }
});

registerAsyncTest('Authorized Org Owner can view its own documents in getOrganization', async () => {
  const orgOwnerUserId = new mongoose.Types.ObjectId();
  const orgId = new mongoose.Types.ObjectId();

  const origFindOrg = Organization.findById;

  Organization.findById = () => ({
    populate: () => ({
      populate: async () => ({
        _id: orgId,
        name: 'Care Trust India',
        user: { _id: orgOwnerUserId, name: 'Trustee', email: 'trustee@care.org' },
        panNumber: 'AAATC1234F',
        documents: {
          panCard: { url: 'https://cloudinary.com/pancard.pdf' }
        },
        toObject: function() {
          return {
            _id: this._id,
            name: this.name,
            user: this.user,
            panNumber: this.panNumber,
            documents: this.documents
          };
        }
      })
    })
  });

  try {
    const { req, res, next } = createMockReqRes({
      params: { id: orgId.toString() },
      user: { id: orgOwnerUserId.toString(), role: 'organization' }
    });

    await getOrganization(req, res, next);
    assert.strictEqual(res.statusCode, 200);
    assert.ok(res.data && res.data.success);
    assert.ok(res.data.data.documents);
    assert.strictEqual(res.data.data.panNumber, 'AAATC1234F');
  } finally {
    Organization.findById = origFindOrg;
  }
});

// -------------------------------------------------------------
// GROUP 9: ADMIN VERIFICATION QUEUE & SUBMISSION WORKFLOWS
// -------------------------------------------------------------
registerAsyncTest('Admin can retrieve campaign verification queue', async () => {
  const origFind = Campaign.find;

  Campaign.find = () => ({
    populate: () => ({
      populate: () => ({
        populate: () => ({
          sort: async () => [
            {
              _id: new mongoose.Types.ObjectId(),
              title: 'Cancer Support Fund',
              verificationStatus: 'pending',
              goalAmount: 300000,
              fundUtilization: [{ purpose: 'Surgery', estimatedAmount: 300000 }]
            }
          ]
        })
      })
    })
  });

  try {
    const { req, res, next } = createMockReqRes({
      query: { status: 'pending' },
      user: { id: new mongoose.Types.ObjectId().toString(), role: 'admin' }
    });

    await getVerificationQueue(req, res, next);
    assert.strictEqual(res.statusCode, 200);
    assert.ok(res.data && res.data.success);
    assert.strictEqual(res.data.count, 1);
    assert.strictEqual(res.data.data[0].title, 'Cancer Support Fund');
  } finally {
    Campaign.find = origFind;
  }
});

registerAsyncTest('Organization can submit campaign for verification review', async () => {
  const orgUser = new mongoose.Types.ObjectId();
  const orgId = new mongoose.Types.ObjectId();
  const campaignId = new mongoose.Types.ObjectId();

  const origFindCampaign = Campaign.findById;
  const origFindOrg = Organization.findOne;
  const origCountDocs = CampaignDocument.countDocuments;

  let savedCampaign = null;
  Campaign.findById = async () => ({
    _id: campaignId,
    title: 'Flood Relief Shelter',
    organization: orgId,
    verificationStatus: 'not_submitted',
    verificationHistory: [],
    fundUtilization: [{ purpose: 'Shelters', estimatedAmount: 100000 }],
    save: async function() {
      savedCampaign = this;
      return this;
    }
  });

  Organization.findOne = async () => ({
    _id: orgId,
    name: 'Relief NGO',
    user: orgUser
  });

  CampaignDocument.countDocuments = async () => 1;

  try {
    const { req, res, next } = createMockReqRes({
      params: { id: campaignId.toString() },
      user: { id: orgUser.toString(), role: 'organization' },
      body: { note: 'All municipal approvals and contractor quotes attached' }
    });

    await submitCampaignForVerification(req, res, next);
    assert.strictEqual(res.statusCode, 200);
    assert.ok(res.data && res.data.success);
    assert.strictEqual(savedCampaign.verificationStatus, 'pending');
    assert.strictEqual(savedCampaign.verificationHistory.length, 1);
    assert.strictEqual(savedCampaign.verificationHistory[0].status, 'pending');
  } finally {
    Campaign.findById = origFindCampaign;
    Organization.findOne = origFindOrg;
    CampaignDocument.countDocuments = origCountDocs;
  }
});

// Run all test cases sequentially
async function executeAll() {
  console.log('\n======================================================');
  console.log('  FUNDVISION PHASE 2.1 SECURITY & BACKEND TEST SUITE');
  console.log('======================================================\n');

  for (const test of allTestFunctions) {
    try {
      if (test.isAsync) {
        await test.fn();
      } else {
        test.fn();
      }
      results.passed++;
      results.tests.push({ name: test.name, status: 'PASS' });
      console.log(`  ✓ PASS: ${test.name}`);
    } catch (error) {
      results.failed++;
      results.tests.push({ name: test.name, status: 'FAIL', error: error.message });
      console.error(`  ✗ FAIL: ${test.name}`);
      console.error(`    ${error.stack || error.message}`);
    }
  }

  console.log('\n======================================================');
  console.log(`  TEST RESULTS: ${results.passed} PASSED | ${results.failed} FAILED | TOTAL: ${results.tests.length}`);
  console.log('======================================================\n');

  if (results.failed > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

executeAll();
