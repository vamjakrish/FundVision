const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const Block = require('../models/Block');
const Donation = require('../models/Donation');
const ledgerService = require('../services/ledgerService');

// @desc    Verify the integrity of the entire donation ledger
// @route   GET /api/blockchain/verify
// @access  Public
router.get('/verify', async (req, res) => {
  try {
    const result = await ledgerService.verifyChain();
    res.json(result);
  } catch (err) {
    res.status(500).json({ valid: false, error: err.message });
  }
});

// @desc    Get overall ledger / chain status for the explorer page
// @route   GET /api/blockchain/status
// @access  Public
router.get('/status', async (req, res) => {
  try {
    const [stats, verification] = await Promise.all([
      ledgerService.getLedgerStats(),
      ledgerService.verifyChain()
    ]);

    res.json({
      success: true,
      enabled: true, // always available — no external dependency required
      chainValid: verification.valid,
      corruptedBlock: verification.corruptedBlock || null,
      totalBlocks: stats.totalBlocks,
      totalAmount: stats.totalAmount
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// @desc    Paginated, searchable list of blocks for the explorer page
// @route   GET /api/blockchain/blocks
// @access  Public
// @query   page, limit, search (matches transactionId, donationId, campaignId, currentHash)
router.get('/blocks', async (req, res) => {
  try {
    const page = Math.max(parseInt(req.query.page) || 1, 1);
    const limit = Math.min(parseInt(req.query.limit) || 10, 50);
    const skip = (page - 1) * limit;
    const search = (req.query.search || '').trim();

    let query = {};
    if (search) {
      const isObjectId = /^[0-9a-fA-F]{24}$/.test(search);
      const orConditions = [
        { transactionId: { $regex: search, $options: 'i' } },
        { currentHash: { $regex: search, $options: 'i' } }
      ];
      if (isObjectId) {
        orConditions.push({ donationId: search });
        orConditions.push({ campaignId: search });
      }
      query = { $or: orConditions };
    }

    const [blocks, total] = await Promise.all([
      Block.find(query)
        .populate('campaignId', 'title slug')
        .populate('donorId', 'name')
        .sort('-blockNumber')
        .skip(skip)
        .limit(limit)
        .lean(),
      Block.countDocuments(query)
    ]);

    res.json({
      success: true,
      data: blocks,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// @desc    Get a single block by block number
// @route   GET /api/blockchain/block/:blockNumber
// @access  Public
router.get('/block/:blockNumber', async (req, res) => {
  try {
    const blockNumber = parseInt(req.params.blockNumber);
    const block = await Block.findOne({ blockNumber })
      .populate('campaignId', 'title slug')
      .populate('donorId', 'name')
      .lean();

    if (!block) {
      return res.status(404).json({ success: false, message: 'Block not found.' });
    }

    res.json({ success: true, data: block });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// @desc    Get the blockchain ledger record for a specific donation
// @route   GET /api/blockchain/donation/:donationId
// @access  Protected
router.get('/donation/:donationId', protect, async (req, res) => {
  try {
    const donation = await Donation.findById(req.params.donationId).select('donor blockchain amount campaign');

    if (!donation) {
      return res.status(404).json({ success: false, message: 'Donation not found.' });
    }

    if (
      donation.donor.toString() !== req.user.id &&
      req.user.role !== 'admin' &&
      req.user.role !== 'organization'
    ) {
      return res.status(403).json({ success: false, message: 'Access denied.' });
    }

    const block = donation.blockchain?.blockNumber
      ? await Block.findOne({ blockNumber: donation.blockchain.blockNumber }).lean()
      : null;

    res.json({
      success: true,
      data: {
        donationId: req.params.donationId,
        blockchainInfo: donation.blockchain,
        block
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// @desc    Get blockchain-verified donations for the current user
// @route   GET /api/blockchain/my-verified
// @access  Protected
router.get('/my-verified', protect, async (req, res) => {
  try {
    const donations = await Donation.find({
      donor: req.user.id,
      paymentStatus: 'completed'
    })
      .select('amount campaign organization blockchain receiptNumber createdAt isAnonymous')
      .populate('campaign', 'title category primaryImage slug')
      .populate('organization', 'name logo')
      .sort('-createdAt')
      .limit(50);

    res.json({ success: true, data: donations });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// @desc    Admin-level ledger stats (sync health, failures)
// @route   GET /api/blockchain/admin/stats
// @access  Admin
router.get('/admin/stats', protect, async (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ success: false, message: 'Access denied.' });
  }

  try {
    const [totalVerified, totalFailed, totalPending, stats, verification] = await Promise.all([
      Donation.countDocuments({ 'blockchain.isVerified': true }),
      Donation.countDocuments({ 'blockchain.syncStatus': 'failed' }),
      Donation.countDocuments({ paymentStatus: 'completed', 'blockchain.syncStatus': 'pending' }),
      ledgerService.getLedgerStats(),
      ledgerService.verifyChain()
    ]);

    const recentFailed = await Donation.find({ 'blockchain.syncStatus': 'failed' })
      .select('_id amount blockchain createdAt')
      .populate('campaign', 'title')
      .sort('-createdAt')
      .limit(10);

    res.json({
      success: true,
      data: {
        totalVerified,
        totalFailed,
        totalPending,
        enabled: true,
        chainValid: verification.valid,
        corruptedBlock: verification.corruptedBlock || null,
        chainStats: stats,
        recentFailed
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// @desc    Organization-scoped blockchain transparency stats
// @route   GET /api/blockchain/org/stats
// @access  Organization
router.get('/org/stats', protect, async (req, res) => {
  if (req.user.role !== 'organization') {
    return res.status(403).json({ success: false, message: 'Access denied.' });
  }

  try {
    const Organization = require('../models/Organization');
    const org = await Organization.findOne({ user: req.user.id });
    if (!org) {
      return res.json({ success: true, data: { totalVerified: 0, totalAmount: 0, enabled: true } });
    }

    const [totalVerified, verifiedAgg] = await Promise.all([
      Donation.countDocuments({ organization: org._id, 'blockchain.isVerified': true }),
      Donation.aggregate([
        { $match: { organization: org._id, 'blockchain.isVerified': true } },
        { $group: { _id: null, total: { $sum: '$amount' } } }
      ])
    ]);

    res.json({
      success: true,
      data: {
        totalVerified,
        totalAmount: verifiedAgg[0]?.total || 0,
        enabled: true
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// @desc    Retry ledger append for a donation that failed to sync
// @route   POST /api/blockchain/retry/:donationId
// @access  Admin
router.post('/retry/:donationId', protect, async (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ success: false, message: 'Access denied.' });
  }

  try {
    const donation = await Donation.findById(req.params.donationId);
    if (!donation) {
      return res.status(404).json({ success: false, message: 'Donation not found.' });
    }

    if (donation.blockchain?.isVerified) {
      return res.status(400).json({ success: false, message: 'Donation is already ledger-verified.' });
    }

    const result = await ledgerService.appendDonationBlock({
      donationId: donation._id.toString(),
      campaignId: donation.campaign.toString(),
      donorId: donation.donor.toString(),
      isAnonymous: donation.isAnonymous,
      amount: donation.amount
    });

    if (result.success) {
      await Donation.findByIdAndUpdate(donation._id, {
        'blockchain.isVerified': true,
        'blockchain.blockNumber': result.block.blockNumber,
        'blockchain.transactionId': result.block.transactionId,
        'blockchain.currentHash': result.block.currentHash,
        'blockchain.previousHash': result.block.previousHash,
        'blockchain.recordedAt': new Date(),
        'blockchain.syncStatus': 'synced',
        'blockchain.syncError': null
      });
      return res.json({ success: true, message: 'Ledger sync successful.', transactionId: result.block.transactionId });
    }

    return res.json({ success: false, message: result.error || 'Sync failed.' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
