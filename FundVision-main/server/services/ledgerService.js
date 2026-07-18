/**
 * ledgerService.js
 * FundVision's free, server-side, blockchain-style donation ledger.
 *
 * No Ethereum, no gas fees, no wallets, no external network calls.
 * Each donation becomes an immutable "block" whose hash is derived from
 * its own data plus the previous block's hash — the same tamper-evidence
 * principle real blockchains use, implemented with Node's built-in crypto.
 *
 * Chain integrity rule:
 *   currentHash = SHA256(blockNumber + donationId + campaignId + amount + timestamp + previousHash)
 *
 * If any historical block's stored data is altered, its recomputed hash will
 * no longer match the hash stored in the *next* block's previousHash field
 * (or its own currentHash), so corruption is always detectable.
 */

const crypto = require('crypto');
const Block = require('../models/Block');

const GENESIS_HASH = '0'.repeat(64);

/**
 * Compute the SHA-256 hash for a block using the exact field order
 * specified by the ledger's hash formula.
 */
function computeHash({ blockNumber, donationId, campaignId, amount, timestamp, previousHash }) {
  const payload =
    String(blockNumber) +
    String(donationId) +
    String(campaignId) +
    String(amount) +
    String(timestamp) +
    String(previousHash);

  return crypto.createHash('sha256').update(payload).digest('hex');
}

/**
 * Generate a human-friendly transaction ID: TX-XXXXXXXXXXXX (12 hex chars, uppercase).
 */
function generateTransactionId() {
  const random = crypto.randomBytes(6).toString('hex').toUpperCase(); // 12 hex chars
  return `TX-${random}`;
}

/**
 * Append a new donation to the ledger as the next block in the chain.
 * This function is atomic-ish via a simple retry-on-conflict loop: if two
 * donations race for the same blockNumber, the unique index on blockNumber
 * rejects the loser and it retries with the freshly computed next number.
 *
 * @param {Object} params
 * @param {string} params.donationId
 * @param {string} params.campaignId
 * @param {string|null} params.donorId   null when donation is anonymous
 * @param {boolean} params.isAnonymous
 * @param {number} params.amount         amount in INR (rupees)
 *
 * @returns {Promise<{success: boolean, block?: Object, error?: string}>}
 */
async function appendDonationBlock({ donationId, campaignId, donorId, isAnonymous, amount }) {
  const MAX_RETRIES = 5;

  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    try {
      const lastBlock = await Block.findOne().sort('-blockNumber');
      const blockNumber = lastBlock ? lastBlock.blockNumber + 1 : 1;
      const previousHash = lastBlock ? lastBlock.currentHash : GENESIS_HASH;
      const timestamp = Date.now();

      const currentHash = computeHash({
        blockNumber,
        donationId,
        campaignId,
        amount,
        timestamp,
        previousHash
      });

      const transactionId = generateTransactionId();

      const block = await Block.create({
        blockNumber,
        donationId,
        campaignId,
        donorId: isAnonymous ? null : donorId || null,
        isAnonymous: !!isAnonymous,
        amount,
        timestamp,
        transactionId,
        previousHash,
        currentHash
      });

      return { success: true, block };
    } catch (err) {
      // Duplicate key on blockNumber/currentHash/transactionId → race condition, retry.
      if (err.code === 11000 && attempt < MAX_RETRIES - 1) {
        continue;
      }
      console.error('[Ledger] appendDonationBlock error:', err.message);
      return { success: false, error: err.message };
    }
  }

  return { success: false, error: 'Failed to append block after multiple retries.' };
}

/**
 * Verify the entire chain's integrity from genesis to tip.
 * Walks every block in order, recomputes its hash from stored fields, and
 * checks both that the recomputed hash matches the stored currentHash AND
 * that it correctly chains to the next block's previousHash.
 *
 * @returns {Promise<{valid: boolean, corruptedBlock?: number, totalBlocks: number, reason?: string}>}
 */
async function verifyChain() {
  const blocks = await Block.find().sort('blockNumber').lean();

  if (blocks.length === 0) {
    return { valid: true, totalBlocks: 0 };
  }

  let expectedPreviousHash = GENESIS_HASH;

  for (const block of blocks) {
    const recomputedHash = computeHash({
      blockNumber: block.blockNumber,
      donationId: block.donationId,
      campaignId: block.campaignId,
      amount: block.amount,
      timestamp: block.timestamp,
      previousHash: block.previousHash
    });

    // 1) Does the stored currentHash match what the data actually hashes to?
    if (recomputedHash !== block.currentHash) {
      return {
        valid: false,
        corruptedBlock: block.blockNumber,
        totalBlocks: blocks.length,
        reason: 'Stored hash does not match recomputed hash — block data was altered.'
      };
    }

    // 2) Does this block correctly reference the previous block's hash?
    if (block.previousHash !== expectedPreviousHash) {
      return {
        valid: false,
        corruptedBlock: block.blockNumber,
        totalBlocks: blocks.length,
        reason: 'Chain link broken — previousHash does not match prior block.'
      };
    }

    expectedPreviousHash = block.currentHash;
  }

  return { valid: true, totalBlocks: blocks.length };
}

/**
 * Get aggregate ledger statistics for dashboards.
 */
async function getLedgerStats() {
  const [totalBlocks, totalAmountAgg] = await Promise.all([
    Block.countDocuments(),
    Block.aggregate([{ $group: { _id: null, total: { $sum: '$amount' } } }])
  ]);

  return {
    totalBlocks,
    totalAmount: totalAmountAgg[0]?.total || 0
  };
}

module.exports = {
  GENESIS_HASH,
  computeHash,
  generateTransactionId,
  appendDonationBlock,
  verifyChain,
  getLedgerStats
};
