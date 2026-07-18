const mongoose = require('mongoose');

const organizationSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  name: {
    type: String,
    required: [true, 'Organization name is required'],
    trim: true,
    maxlength: [200, 'Name cannot exceed 200 characters']
  },
  description: {
    type: String,
    required: [true, 'Description is required'],
    maxlength: [2000, 'Description cannot exceed 2000 characters']
  },
  type: {
    type: String,
    enum: ['NGO', 'Charity', 'Hospital', 'Educational Institution', 'Social Enterprise', 'Other'],
    required: true
  },
  registrationNumber: {
    type: String,
    trim: true
  },
  panNumber: {
    type: String,
    trim: true
  },
  website: {
    type: String,
    trim: true
  },
  phone: {
    type: String,
    trim: true
  },
  address: {
    street: String,
    city: String,
    state: String,
    pincode: String,
    country: { type: String, default: 'India' }
  },
  logo: {
    type: String,
    default: null
  },
  coverImage: {
    type: String,
    default: null
  },
  documents: {
    ngoCertificate: { url: String, publicId: String },
    panCard: { url: String, publicId: String },
    registrationProof: { url: String, publicId: String },
    additionalDocs: [{ url: String, publicId: String, name: String }]
  },
  verificationStatus: {
    type: String,
    enum: ['pending', 'under_review', 'verified', 'rejected', 'suspended'],
    default: 'pending'
  },
  verificationNote: String,
  verifiedAt: Date,
  verifiedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  isVerified: {
    type: Boolean,
    default: false
  },
  totalRaised: {
    type: Number,
    default: 0
  },
  totalCampaigns: {
    type: Number,
    default: 0
  },
  successfulCampaigns: {
    type: Number,
    default: 0
  },
  trustScore: {
    type: Number,
    default: 0,
    min: 0,
    max: 100
  },
  socialLinks: {
    facebook: String,
    twitter: String,
    instagram: String,
    linkedin: String
  },
  bankDetails: {
    accountName: String,
    accountNumber: { type: String, select: false },
    ifscCode: { type: String, select: false },
    bankName: String
  },
  followers: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  rating: {
    average: { type: Number, default: 0 },
    count: { type: Number, default: 0 }
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Index for search
organizationSchema.index({ name: 'text', description: 'text' });
organizationSchema.index({ verificationStatus: 1, isVerified: 1 });

module.exports = mongoose.model('Organization', organizationSchema);
