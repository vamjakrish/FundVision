const mongoose = require('mongoose');

const campaignSchema = new mongoose.Schema({
  organization: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Organization',
    required: true
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  title: {
    type: String,
    required: [true, 'Campaign title is required'],
    trim: true,
    maxlength: [200, 'Title cannot exceed 200 characters']
  },
  slug: {
    type: String,
    unique: true
  },
  description: {
    type: String,
    required: [true, 'Description is required'],
    maxlength: [500, 'Description cannot exceed 500 characters']
  },
  story: {
    type: String,
    required: [true, 'Campaign story is required']
  },
  category: {
    type: String,
    required: [true, 'Category is required'],
    trim: true,
    maxlength: [40, 'Category cannot exceed 40 characters']
  },
  goalAmount: {
    type: Number,
    required: [true, 'Goal amount is required'],
    min: [1000, 'Minimum goal amount is ₹1000']
  },
  raisedAmount: {
    type: Number,
    default: 0
  },
  donorCount: {
    type: Number,
    default: 0
  },
  deadline: {
    type: Date,
    required: [true, 'Campaign deadline is required']
  },
  images: [{
    url: String,
    publicId: String,
    caption: String,
    isPrimary: { type: Boolean, default: false }
  }],
  videos: [{
    url: String,
    thumbnail: String,
    title: String
  }],
  status: {
    type: String,
    enum: ['draft', 'pending', 'approved', 'active', 'paused', 'completed', 'rejected', 'suspended'],
    default: 'draft'
  },
  approvalNote: String,
  approvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  approvedAt: Date,
  isFeatured: {
    type: Boolean,
    default: false
  },
  isTrending: {
    type: Boolean,
    default: false
  },
  isUrgent: {
    type: Boolean,
    default: false
  },
  tags: [String],
  location: {
    city: String,
    state: String,
    country: { type: String, default: 'India' }
  },
  beneficiaries: {
    count: Number,
    description: String
  },
  aiSummary: String,
  aiTrustScore: {
    overall: { type: Number, default: 0 },
    transparency: { type: Number, default: 0 },
    reliability: { type: Number, default: 0 },
    lastUpdated: Date
  },
  fraudFlags: [{
    reason: String,
    flaggedAt: Date,
    resolved: { type: Boolean, default: false }
  }],
  likes: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  bookmarks: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  shareCount: {
    type: Number,
    default: 0
  },
  viewCount: {
    type: Number,
    default: 0
  },
  updates: [{
    title: String,
    content: String,
    images: [String],
    postedAt: { type: Date, default: Date.now }
  }],
  milestones: [{
    title: String,
    amount: Number,
    description: String,
    achieved: { type: Boolean, default: false },
    achievedAt: Date
  }],
  minDonation: {
    type: Number,
    default: 10
  },
  bankDetails: {
    accountName: String,
    accountNumber: { type: String, select: false },
    ifscCode: { type: String, select: false }
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes
campaignSchema.index({ title: 'text', description: 'text', story: 'text', tags: 'text' });
campaignSchema.index({ status: 1, category: 1 });
campaignSchema.index({ isFeatured: 1, isTrending: 1 });
campaignSchema.index({ organization: 1, status: 1 });
campaignSchema.index({ createdAt: -1 });

// Virtual: progress percentage
campaignSchema.virtual('progress').get(function() {
  return this.goalAmount > 0 ? Math.min(Math.round((this.raisedAmount / this.goalAmount) * 100), 100) : 0;
});

// Virtual: days remaining
campaignSchema.virtual('daysRemaining').get(function() {
  const now = new Date();
  const diff = this.deadline - now;
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
});

// Virtual: primary image
campaignSchema.virtual('primaryImage').get(function() {
  const primary = this.images?.find(img => img.isPrimary);
  return primary?.url || this.images?.[0]?.url || null;
});

// Generate slug before saving
campaignSchema.pre('save', function(next) {
  if (this.isModified('title') && !this.slug) {
    this.slug = this.title
      .toLowerCase()
      .replace(/[^a-z0-9 -]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      + '-' + Date.now();
  }
  next();
});

module.exports = mongoose.model('Campaign', campaignSchema);
