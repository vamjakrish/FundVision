const mongoose = require('mongoose');

const campaignDocumentSchema = new mongoose.Schema({
  campaign: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Campaign',
    required: [true, 'Campaign reference is required'],
    index: true
  },
  organization: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Organization',
    required: [true, 'Organization reference is required'],
    index: true
  },
  uploadedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Uploaded by user reference is required']
  },
  documentType: {
    type: String,
    enum: [
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
    ],
    required: [true, 'Document type is required']
  },
  title: {
    type: String,
    required: [true, 'Document title is required'],
    trim: true,
    maxlength: [200, 'Title cannot exceed 200 characters']
  },
  description: {
    type: String,
    trim: true,
    maxlength: [1000, 'Description cannot exceed 1000 characters']
  },
  fileUrl: {
    type: String,
    required: [true, 'File URL is required']
  },
  publicId: {
    type: String,
    required: [true, 'Public ID is required']
  },
  fileType: {
    type: String,
    required: [true, 'File type is required']
  },
  fileSizeBytes: {
    type: Number,
    required: [true, 'File size is required'],
    min: [0, 'File size cannot be negative']
  },
  visibility: {
    type: String,
    enum: ['public', 'admin_only'],
    default: 'admin_only',
    required: true
  },
  verificationStatus: {
    type: String,
    enum: ['pending', 'verified', 'rejected', 'superseded'],
    default: 'pending',
    required: true
  },
  verificationNote: {
    type: String,
    trim: true,
    maxlength: [1000, 'Verification note cannot exceed 1000 characters']
  },
  verifiedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  verifiedAt: {
    type: Date
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for performance and security queries
campaignDocumentSchema.index({ campaign: 1, verificationStatus: 1 });
campaignDocumentSchema.index({ campaign: 1, visibility: 1 });
campaignDocumentSchema.index({ organization: 1, createdAt: -1 });
campaignDocumentSchema.index({ verificationStatus: 1, createdAt: -1 });

module.exports = mongoose.model('CampaignDocument', campaignDocumentSchema);
