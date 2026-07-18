const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');

const donationSchema = new mongoose.Schema({
  donor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  campaign: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Campaign',
    required: true
  },
  organization: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Organization',
    required: true
  },
  amount: {
    type: Number,
    required: [true, 'Donation amount is required'],
    min: [10, 'Minimum donation is ₹10']
  },
  currency: {
    type: String,
    default: 'INR'
  },
  isAnonymous: {
    type: Boolean,
    default: false
  },
  message: {
    type: String,
    maxlength: [500, 'Message cannot exceed 500 characters']
  },
  paymentMethod: {
    type: String,
    enum: ['razorpay', 'upi', 'card', 'netbanking', 'wallet'],
    default: 'razorpay'
  },
  paymentStatus: {
    type: String,
    enum: ['pending', 'processing', 'completed', 'failed', 'refunded'],
    default: 'pending'
  },
  razorpayOrderId: String,
  razorpayPaymentId: String,
  razorpaySignature: String,
  receiptNumber: {
    type: String,
    unique: true,
    default: () => `FV-${Date.now()}-${Math.random().toString(36).substr(2, 6).toUpperCase()}`
  },
  certificateId: {
    type: String,
    default: () => uuidv4()
  },
  certificateUrl: String,
  aiImpactMessage: String,
  taxExemption: {
    eligible: { type: Boolean, default: true },
    section: { type: String, default: '80G' },
    certificateGenerated: { type: Boolean, default: false }
  },
  metadata: {
    ipAddress: String,
    userAgent: String,
    platform: String
  },
  // ── Blockchain ledger fields (server-side hash-chain, no gas/crypto required) ──
  blockchain: {
    isVerified: {
      type: Boolean,
      default: false
    },
    blockNumber: {
      type: Number,
      default: null
    },
    transactionId: {
      type: String,
      default: null
    },
    currentHash: {
      type: String,
      default: null
    },
    previousHash: {
      type: String,
      default: null
    },
    recordedAt: {
      type: Date,
      default: null
    },
    syncStatus: {
      type: String,
      enum: ['pending', 'synced', 'failed'],
      default: 'pending'
    },
    syncError: {
      type: String,
      default: null
    }
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes
donationSchema.index({ donor: 1, createdAt: -1 });
donationSchema.index({ campaign: 1, paymentStatus: 1 });
donationSchema.index({ organization: 1, createdAt: -1 });
donationSchema.index({ razorpayOrderId: 1 });
donationSchema.index({ 'blockchain.currentHash': 1 });
donationSchema.index({ 'blockchain.isVerified': 1 });
donationSchema.index({ 'blockchain.blockNumber': 1 });

module.exports = mongoose.model('Donation', donationSchema);
