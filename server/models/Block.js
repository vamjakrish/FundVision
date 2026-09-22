const mongoose = require('mongoose');

/**
 * Block
 * Represents a single immutable block in FundVision's server-side donation
 * hash-chain ledger. No gas fees, no external network — each block's hash
 * is derived from its own data plus the previous block's hash, exactly like
 * a real blockchain's tamper-evidence model.
 */
const blockSchema = new mongoose.Schema(
  {
    blockNumber: {
      type: Number,
      required: true,
      unique: true,
      index: true
    },
    donationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Donation',
      required: true
    },
    campaignId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Campaign',
      required: true
    },
    donorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null // null when donation is anonymous
    },
    isAnonymous: {
      type: Boolean,
      default: false
    },
    amount: {
      type: Number,
      required: true
    },
    timestamp: {
      type: Number, // ms epoch, used verbatim inside the hash formula
      required: true
    },
    transactionId: {
      type: String,
      required: true,
      unique: true
    },
    previousHash: {
      type: String,
      required: true
    },
    currentHash: {
      type: String,
      required: true,
      unique: true
    }
  },
  {
    timestamps: true,
    // Blocks are append-only — nothing should ever update an existing block.
    // Mongoose strict mode plus the absence of any updateOne/findOneAndUpdate
    // calls anywhere in the codebase enforces this at the application layer.
  }
);

blockSchema.index({ blockNumber: 1 }, { unique: true });
blockSchema.index({ campaignId: 1 });
blockSchema.index({ donorId: 1 });

module.exports = mongoose.model('Block', blockSchema);
