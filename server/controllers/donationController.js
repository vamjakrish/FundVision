const Razorpay = require('razorpay');
const crypto = require('crypto');
const Donation = require('../models/Donation');
const Campaign = require('../models/Campaign');
const Organization = require('../models/Organization');
const User = require('../models/User');
const Notification = require('../models/Notification');
const { getIO } = require('../socket/socketManager');
const { generateImpactMessage } = require('../utils/aiHelpers');
const ledgerService = require('../services/ledgerService');
const notify = require('../utils/notify');

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

// @desc    Create Razorpay order
// @route   POST /api/donations/create-order
const createOrder = async (req, res, next) => {
  try {
    const { campaignId, amount, isAnonymous, message } = req.body;

    const campaign = await Campaign.findById(campaignId);
    if (!campaign) return res.status(404).json({ success: false, message: 'Campaign not found.' });
    if (campaign.status !== 'active') return res.status(400).json({ success: false, message: 'Campaign is not accepting donations.' });
    if (amount < campaign.minDonation) {
      return res.status(400).json({ success: false, message: `Minimum donation is ₹${campaign.minDonation}.` });
    }

    const razorpayOrder = await razorpay.orders.create({
      amount: amount * 100, // paise
      currency: 'INR',
      receipt: `fv_${Date.now()}`,
      notes: { campaignId, userId: req.user.id }
    });

    const donation = await Donation.create({
      donor: req.user.id,
      campaign: campaignId,
      organization: campaign.organization,
      amount,
      isAnonymous: isAnonymous || false,
      message,
      razorpayOrderId: razorpayOrder.id,
      paymentStatus: 'pending',
      metadata: {
        ipAddress: req.ip,
        userAgent: req.headers['user-agent']
      }
    });

    res.json({
      success: true,
      orderId: razorpayOrder.id,
      amount: razorpayOrder.amount,
      currency: razorpayOrder.currency,
      donationId: donation._id,
      keyId: process.env.RAZORPAY_KEY_ID
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Verify payment & complete donation
// @route   POST /api/donations/verify-payment
const verifyPayment = async (req, res, next) => {
  try {
    const { razorpayOrderId, razorpayPaymentId, razorpaySignature, donationId } = req.body;

    // Verify signature
    const body = razorpayOrderId + '|' + razorpayPaymentId;
    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(body)
      .digest('hex');

    if (expectedSignature !== razorpaySignature) {
      await Donation.findByIdAndUpdate(donationId, { paymentStatus: 'failed' });
      return res.status(400).json({ success: false, message: 'Payment verification failed.' });
    }

    // Update donation
    const donation = await Donation.findByIdAndUpdate(
      donationId,
      {
        paymentStatus: 'completed',
        razorpayPaymentId,
        razorpaySignature
      },
      { new: true }
    ).populate('campaign').populate('donor', 'name email').populate('organization', 'name logo');

    if (!donation) return res.status(404).json({ success: false, message: 'Donation not found.' });

    // Update campaign raised amount
    await Campaign.findByIdAndUpdate(donation.campaign._id, {
      $inc: { raisedAmount: donation.amount, donorCount: 1 }
    });

    // Update user stats
    await User.findByIdAndUpdate(req.user.id, {
      $inc: { totalDonated: donation.amount, donationCount: 1 }
    });

    // Update organization stats
    await Organization.findByIdAndUpdate(donation.organization, {
      $inc: { totalRaised: donation.amount }
    });

    // Generate AI impact message
    let impactMessage = '';
    try {
      impactMessage = await generateImpactMessage(donation.amount, donation.campaign);
      await Donation.findByIdAndUpdate(donationId, { aiImpactMessage: impactMessage });
    } catch (e) {
      console.error('AI impact message error:', e.message);
    }

    // ── Blockchain ledger recording (free, server-side hash-chain) ─────────
    // Step 1: MongoDB is already updated above (source of truth)
    // Step 2: Append donation as the next block in the ledger
    // Step 3: Save transactionId + hashes back to MongoDB
    // Step 4: Mark as blockchain verified
    (async () => {
      try {
        const result = await ledgerService.appendDonationBlock({
          donationId:  donationId.toString(),
          campaignId:  donation.campaign._id.toString(),
          donorId:     donation.donor._id ? donation.donor._id.toString() : donation.donor.toString(),
          isAnonymous: donation.isAnonymous,
          amount:      donation.amount
        });

        if (result.success) {
          await Donation.findByIdAndUpdate(donationId, {
            'blockchain.isVerified':    true,
            'blockchain.blockNumber':   result.block.blockNumber,
            'blockchain.transactionId': result.block.transactionId,
            'blockchain.currentHash':   result.block.currentHash,
            'blockchain.previousHash':  result.block.previousHash,
            'blockchain.recordedAt':    new Date(),
            'blockchain.syncStatus':    'synced'
          });
          // Emit real-time blockchain verification event
          const io = getIO();
          if (io) {
            io.to(`user-${req.user.id}`).emit('blockchain_verified', {
              donationId,
              transactionId: result.block.transactionId
            });
          }
        } else {
          await Donation.findByIdAndUpdate(donationId, {
            'blockchain.syncStatus': 'failed',
            'blockchain.syncError':  result.error
          });
        }
      } catch (bcErr) {
        console.error('[Ledger] post-payment recording error:', bcErr.message);
        await Donation.findByIdAndUpdate(donationId, {
          'blockchain.syncStatus': 'failed',
          'blockchain.syncError':  bcErr.message
        }).catch(() => {});
      }
    })();

    // Check milestone achievements
    const updatedCampaign = await Campaign.findById(donation.campaign._id);
    for (const milestone of updatedCampaign.milestones) {
      if (!milestone.achieved && updatedCampaign.raisedAmount >= milestone.amount) {
        milestone.achieved = true;
        milestone.achievedAt = new Date();
      }
    }
    await updatedCampaign.save();

    // Socket.io real-time update
    const io = getIO();
    if (io) {
      io.to(`campaign-${donation.campaign._id}`).emit('new_donation', {
        amount: donation.amount,
        donorName: donation.isAnonymous ? 'Anonymous' : donation.donor.name,
        raisedAmount: updatedCampaign.raisedAmount,
        progress: updatedCampaign.progress,
        donorCount: updatedCampaign.donorCount
      });
      io.to('admin-room').emit('donation_received', {
        amount: donation.amount,
        campaign: donation.campaign.title
      });
      io.to('live-feed').emit('live_donation', {
        id: donation._id,
        amount: donation.amount,
        donorName: donation.isAnonymous ? 'Anonymous' : donation.donor.name,
        campaignId: donation.campaign._id,
        campaignTitle: donation.campaign.title,
        campaignImage: donation.campaign.images?.[0]?.url || null,
        category: donation.campaign.category,
        createdAt: new Date()
      });
    }

    // Create notification for organization
    await notify({
      recipient: donation.campaign.createdBy,
      type: 'donation_received',
      title: 'New Donation Received!',
      message: `${donation.isAnonymous ? 'Someone' : donation.donor.name} donated ₹${donation.amount.toLocaleString()} to ${donation.campaign.title}`,
      data: { campaignId: donation.campaign._id, donationId: donation._id, amount: donation.amount },
      priority: 'high'
    });

    // Confirmation notification for the donor themselves
    await notify({
      recipient: donation.donor._id,
      type: 'donation_received',
      title: 'Thank You for Your Donation! 💝',
      message: `Your donation of ₹${donation.amount.toLocaleString()} to "${donation.campaign.title}" was successful. Your certificate is ready to download.`,
      data: { campaignId: donation.campaign._id, donationId: donation._id, amount: donation.amount },
      priority: 'medium'
    });

    // Notify campaign owner if a milestone was just reached
    if (updatedCampaign.milestones.some(m => m.achieved && m.achievedAt && (Date.now() - new Date(m.achievedAt).getTime()) < 5000)) {
      await notify({
        recipient: donation.campaign.createdBy,
        type: 'milestone_reached',
        title: '🎯 Milestone Reached!',
        message: `"${donation.campaign.title}" just hit a funding milestone!`,
        data: { campaignId: donation.campaign._id },
        priority: 'high'
      });
    }

    // Goal reached notification
    if (updatedCampaign.raisedAmount >= updatedCampaign.goalAmount) {
      await notify({
        recipient: donation.campaign.createdBy,
        type: 'goal_reached',
        title: '🏆 Goal Reached!',
        message: `Incredible! "${donation.campaign.title}" has reached its funding goal!`,
        data: { campaignId: donation.campaign._id },
        priority: 'urgent'
      });
    }

    res.json({
      success: true,
      message: 'Payment verified! Thank you for your donation.',
      donation,
      impactMessage,
      receiptNumber: donation.receiptNumber
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get user donation history
// @route   GET /api/donations/my-donations
const getMyDonations = async (req, res, next) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [donations, total] = await Promise.all([
      Donation.find({ donor: req.user.id, paymentStatus: 'completed' })
        .populate('campaign', 'title primaryImage category status slug')
        .populate('organization', 'name logo')
        .sort('-createdAt')
        .skip(skip)
        .limit(parseInt(limit)),
      Donation.countDocuments({ donor: req.user.id, paymentStatus: 'completed' })
    ]);

    res.json({
      success: true,
      data: donations,
      pagination: { page: parseInt(page), limit: parseInt(limit), total, pages: Math.ceil(total / parseInt(limit)) }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get donation receipt
// @route   GET /api/donations/:id/receipt
const getDonationReceipt = async (req, res, next) => {
  try {
    const donation = await Donation.findOne({ _id: req.params.id, donor: req.user.id })
      .populate('campaign', 'title category')
      .populate('organization', 'name registrationNumber')
      .populate('donor', 'name email phone');

    if (!donation) return res.status(404).json({ success: false, message: 'Donation not found.' });

    res.json({ success: true, data: donation });
  } catch (error) {
    next(error);
  }
};

// @desc    Get campaign donations (org)
// @route   GET /api/donations/campaign/:campaignId
const getCampaignDonations = async (req, res, next) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const donations = await Donation.find({
      campaign: req.params.campaignId,
      paymentStatus: 'completed'
    })
      .populate('donor', 'name avatar')
      .sort('-createdAt')
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Donation.countDocuments({ campaign: req.params.campaignId, paymentStatus: 'completed' });

    res.json({
      success: true,
      data: donations.map(d => ({
        ...d.toObject(),
        donor: d.isAnonymous ? { name: 'Anonymous Donor', avatar: null } : d.donor
      })),
      pagination: { page: parseInt(page), limit: parseInt(limit), total }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Admin: get all donations
// @route   GET /api/donations/admin/all
const getAllDonations = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, status } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const query = status ? { paymentStatus: status } : {};

    const [donations, total] = await Promise.all([
      Donation.find(query)
        .populate('donor', 'name email')
        .populate('campaign', 'title')
        .populate('organization', 'name')
        .sort('-createdAt')
        .skip(skip)
        .limit(parseInt(limit)),
      Donation.countDocuments(query)
    ]);

    res.json({ success: true, data: donations, pagination: { page: parseInt(page), total } });
  } catch (error) {
    next(error);
  }
};

// @desc    Get top donor leaderboard
// @route   GET /api/donations/leaderboard
const getLeaderboard = async (req, res, next) => {
  try {
    const { limit = 10, period = 'all' } = req.query;
    const match = { paymentStatus: 'completed', isAnonymous: { $ne: true } };

    if (period === 'month') {
      const start = new Date();
      start.setDate(1); start.setHours(0, 0, 0, 0);
      match.createdAt = { $gte: start };
    } else if (period === 'week') {
      const start = new Date(Date.now() - 7 * 86400000);
      match.createdAt = { $gte: start };
    }

    const leaderboard = await Donation.aggregate([
      { $match: match },
      { $group: { _id: '$donor', totalDonated: { $sum: '$amount' }, donationCount: { $sum: 1 } } },
      { $sort: { totalDonated: -1 } },
      { $limit: parseInt(limit) },
      { $lookup: { from: 'users', localField: '_id', foreignField: '_id', as: 'donor' } },
      { $unwind: '$donor' },
      { $project: {
          _id: 0,
          userId: '$donor._id',
          name: '$donor.name',
          avatar: '$donor.avatar',
          totalDonated: 1,
          donationCount: 1
        } }
    ]);

    res.json({ success: true, data: leaderboard });
  } catch (error) {
    next(error);
  }
};

module.exports = { createOrder, verifyPayment, getMyDonations, getDonationReceipt, getCampaignDonations, getAllDonations, getLeaderboard };
