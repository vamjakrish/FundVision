const User = require('../models/User');
const Organization = require('../models/Organization');
const Campaign = require('../models/Campaign');
const Donation = require('../models/Donation');
const Notification = require('../models/Notification');
const { getIO } = require('../socket/socketManager');
const { sendEmail } = require('../utils/email');
const notify = require('../utils/notify');

// @desc    Admin dashboard stats
// @route   GET /api/admin/stats
const getDashboardStats = async (req, res, next) => {
  try {
    const [
      totalUsers, totalOrgs, totalCampaigns, totalDonations,
      pendingOrgs, pendingCampaigns, activeCampaigns,
      monthlyDonations, categoryStats, recentDonations
    ] = await Promise.all([
      User.countDocuments(),
      Organization.countDocuments(),
      Campaign.countDocuments(),
      Donation.aggregate([{ $match: { paymentStatus: 'completed' } }, { $group: { _id: null, total: { $sum: '$amount' }, count: { $sum: 1 } } }]),
      Organization.countDocuments({ verificationStatus: 'pending' }),
      Campaign.countDocuments({ status: 'pending' }),
      Campaign.countDocuments({ status: 'active' }),
      Donation.aggregate([
        { $match: { paymentStatus: 'completed', createdAt: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } } },
        { $group: { _id: { $dayOfMonth: '$createdAt' }, amount: { $sum: '$amount' }, count: { $sum: 1 } } },
        { $sort: { _id: 1 } }
      ]),
      Donation.aggregate([
        { $match: { paymentStatus: 'completed' } },
        { $lookup: { from: 'campaigns', localField: 'campaign', foreignField: '_id', as: 'campaignData' } },
        { $unwind: '$campaignData' },
        { $group: { _id: '$campaignData.category', total: { $sum: '$amount' }, count: { $sum: 1 } } }
      ]),
      Donation.find({ paymentStatus: 'completed' })
        .populate('donor', 'name avatar')
        .populate('campaign', 'title')
        .sort('-createdAt')
        .limit(10)
    ]);

    // Monthly growth (last 6 months)
    const monthlyGrowth = await User.aggregate([
      { $match: { createdAt: { $gte: new Date(Date.now() - 180 * 24 * 60 * 60 * 1000) } } },
      { $group: { _id: { year: { $year: '$createdAt' }, month: { $month: '$createdAt' } }, count: { $sum: 1 } } },
      { $sort: { '_id.year': 1, '_id.month': 1 } }
    ]);

    res.json({
      success: true,
      stats: {
        totalUsers,
        totalOrgs,
        totalCampaigns,
        activeCampaigns,
        pendingOrgs,
        pendingCampaigns,
        totalDonationAmount: totalDonations[0]?.total || 0,
        totalDonationCount: totalDonations[0]?.count || 0,
        monthlyDonations,
        categoryStats,
        monthlyGrowth,
        recentDonations
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get pending organizations
// @route   GET /api/admin/organizations/pending
const getPendingOrganizations = async (req, res, next) => {
  try {
    const orgs = await Organization.find({ verificationStatus: { $in: ['pending', 'under_review'] } })
      .populate('user', 'name email createdAt')
      .sort('-createdAt');
    res.json({ success: true, data: orgs });
  } catch (error) {
    next(error);
  }
};

// @desc    Verify or reject organization
// @route   PUT /api/admin/organizations/:id/verify
const verifyOrganization = async (req, res, next) => {
  try {
    const { status, note } = req.body; // 'verified' | 'rejected' | 'under_review'
    const org = await Organization.findById(req.params.id).populate('user', 'name email');
    if (!org) return res.status(404).json({ success: false, message: 'Organization not found.' });

    org.verificationStatus = status;
    org.verificationNote = note;
    org.isVerified = status === 'verified';
    if (status === 'verified') {
      org.verifiedAt = new Date();
      org.verifiedBy = req.user.id;
    }
    await org.save();

    // Notify org owner
    await notify({
      recipient: org.user._id,
      type: 'organization_verified',
      title: status === 'verified' ? '🎉 Organization Verified!' : 'Verification Update',
      message: status === 'verified'
        ? `${org.name} has been verified! You can now create campaigns.`
        : `Verification status: ${status}. ${note || ''}`,
      priority: 'high'
    });

    // Email notification
    try {
      await sendEmail({
        to: org.user.email,
        subject: status === 'verified' ? 'FundVision - Organization Verified!' : 'FundVision - Verification Update',
        template: 'organizationStatus',
        data: { name: org.user.name, orgName: org.name, status, note }
      });
    } catch (e) { console.error('Email error:', e.message); }

    // Real-time notify
    const io = getIO();
    if (io) {
      io.to(`user-${org.user._id}`).emit('organization_status_update', { status, note });
    }

    res.json({ success: true, message: `Organization ${status}!`, data: org });
  } catch (error) {
    next(error);
  }
};

// @desc    Get pending campaigns
// @route   GET /api/admin/campaigns/pending
const getPendingCampaigns = async (req, res, next) => {
  try {
    const campaigns = await Campaign.find({ status: 'pending' })
      .populate('organization', 'name logo isVerified')
      .populate('createdBy', 'name email')
      .sort('-createdAt');
    res.json({ success: true, data: campaigns });
  } catch (error) {
    next(error);
  }
};

// @desc    Approve or reject campaign
// @route   PUT /api/admin/campaigns/:id/approve
const approveCampaign = async (req, res, next) => {
  try {
    const { status, note } = req.body; // 'approved' | 'rejected'
    const campaign = await Campaign.findById(req.params.id).populate('createdBy', 'name email');
    if (!campaign) return res.status(404).json({ success: false, message: 'Campaign not found.' });

    if (status === 'approved') {
      campaign.status = 'active';
      campaign.isFeatured = true;
      campaign.isTrending = true;
    } else {
      campaign.status = 'rejected';
    }
    campaign.approvalNote = note;
    campaign.approvedBy = req.user.id;
    campaign.approvedAt = new Date();
    await campaign.save();

    await notify({
      recipient: campaign.createdBy._id,
      type: 'campaign_approved',
      title: status === 'approved' ? '🚀 Campaign Approved!' : 'Campaign Rejected',
      message: status === 'approved'
        ? `Your campaign "${campaign.title}" is now live!`
        : `Your campaign "${campaign.title}" was rejected. ${note || ''}`,
      data: { campaignId: campaign._id },
      priority: 'high'
    });

    const io = getIO();
    if (io) {
      io.to(`user-${campaign.createdBy._id}`).emit('campaign_status_update', {
        campaignId: campaign._id,
        status: campaign.status,
        note
      });
    }

    res.json({ success: true, message: `Campaign ${status}!`, data: campaign });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all users (admin)
// @route   GET /api/admin/users
const getAllUsers = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, role, search } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const query = {};
    if (role) query.role = role;
    if (search) query.$or = [{ name: { $regex: search, $options: 'i' } }, { email: { $regex: search, $options: 'i' } }];

    const [users, total] = await Promise.all([
      User.find(query).sort('-createdAt').skip(skip).limit(parseInt(limit)),
      User.countDocuments(query)
    ]);

    res.json({ success: true, data: users, pagination: { page: parseInt(page), total, pages: Math.ceil(total / parseInt(limit)) } });
  } catch (error) {
    next(error);
  }
};

// @desc    Toggle user active status
// @route   PUT /api/admin/users/:id/toggle-status
const toggleUserStatus = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found.' });
    if (user.role === 'admin') return res.status(403).json({ success: false, message: 'Cannot modify admin accounts.' });
    user.isActive = !user.isActive;
    await user.save({ validateBeforeSave: false });
    res.json({ success: true, message: `User ${user.isActive ? 'activated' : 'deactivated'}!`, isActive: user.isActive });
  } catch (error) {
    next(error);
  }
};

// @desc    Feature/unfeature campaign
// @route   PUT /api/admin/campaigns/:id/feature
const toggleFeatureCampaign = async (req, res, next) => {
  try {
    const campaign = await Campaign.findById(req.params.id);
    if (!campaign) return res.status(404).json({ success: false, message: 'Campaign not found.' });
    campaign.isFeatured = !campaign.isFeatured;
    await campaign.save();
    res.json({ success: true, isFeatured: campaign.isFeatured });
  } catch (error) {
    next(error);
  }
};

// @desc    Advanced analytics: growth, fraud alerts, suspicious activity, top donors, campaign performance
// @route   GET /api/admin/analytics
const getAdvancedAnalytics = async (req, res, next) => {
  try {
    const since30 = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const since90 = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);

    const [
      donationGrowth, topDonors, campaignPerformance,
      flaggedCampaigns, lowTrustCampaigns, revenueByCategory,
      rapidDonationBursts
    ] = await Promise.all([
      // Daily donation growth, last 90 days
      Donation.aggregate([
        { $match: { paymentStatus: 'completed', createdAt: { $gte: since90 } } },
        { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } }, amount: { $sum: '$amount' }, count: { $sum: 1 } } },
        { $sort: { _id: 1 } }
      ]),
      // Top 10 donors by total donated
      Donation.aggregate([
        { $match: { paymentStatus: 'completed' } },
        { $group: { _id: '$donor', total: { $sum: '$amount' }, count: { $sum: 1 } } },
        { $sort: { total: -1 } },
        { $limit: 10 },
        { $lookup: { from: 'users', localField: '_id', foreignField: '_id', as: 'user' } },
        { $unwind: '$user' },
        { $project: { name: '$user.name', avatar: '$user.avatar', total: 1, count: 1 } }
      ]),
      // Campaign performance: progress vs goal, donor counts
      Campaign.find({ status: { $in: ['active', 'completed'] } })
        .select('title goalAmount raisedAmount donorCount category createdAt deadline')
        .sort('-raisedAmount')
        .limit(15)
        .lean(),
      // Campaigns with unresolved fraud flags
      Campaign.find({ 'fraudFlags.0': { $exists: true }, 'fraudFlags.resolved': { $ne: true } })
        .select('title fraudFlags organization status createdAt')
        .populate('organization', 'name isVerified')
        .lean(),
      // Campaigns with a low AI trust score (suspicious)
      Campaign.find({ 'aiTrustScore.overall': { $gt: 0, $lt: 40 }, status: 'active' })
        .select('title aiTrustScore organization')
        .populate('organization', 'name isVerified')
        .limit(10)
        .lean(),
      // Revenue by category
      Donation.aggregate([
        { $match: { paymentStatus: 'completed' } },
        { $lookup: { from: 'campaigns', localField: 'campaign', foreignField: '_id', as: 'c' } },
        { $unwind: '$c' },
        { $group: { _id: '$c.category', revenue: { $sum: '$amount' } } },
        { $sort: { revenue: -1 } }
      ]),
      // Suspicious activity: same donor donating to the same campaign many times within 10 minutes
      Donation.aggregate([
        { $match: { paymentStatus: 'completed', createdAt: { $gte: since30 } } },
        { $group: {
            _id: { donor: '$donor', campaign: '$campaign', bucket: { $dateTrunc: { date: '$createdAt', unit: 'minute', binSize: 10 } } },
            count: { $sum: 1 },
            total: { $sum: '$amount' }
          }
        },
        { $match: { count: { $gte: 4 } } },
        { $sort: { count: -1 } },
        { $limit: 10 },
        { $lookup: { from: 'users', localField: '_id.donor', foreignField: '_id', as: 'user' } },
        { $lookup: { from: 'campaigns', localField: '_id.campaign', foreignField: '_id', as: 'campaign' } },
        { $unwind: { path: '$user', preserveNullAndEmptyArrays: true } },
        { $unwind: { path: '$campaign', preserveNullAndEmptyArrays: true } },
        { $project: { donorName: '$user.name', campaignTitle: '$campaign.title', count: 1, total: 1 } }
      ]).catch(() => []) // $dateTrunc requires Mongo 5+, degrade gracefully
    ]);

    const fraudAlerts = [
      ...flaggedCampaigns.map(c => ({
        type: 'flagged',
        campaignId: c._id,
        title: c.title,
        organization: c.organization?.name,
        reasons: c.fraudFlags.filter(f => !f.resolved).map(f => f.reason),
        severity: 'high'
      })),
      ...lowTrustCampaigns.map(c => ({
        type: 'low_trust_score',
        campaignId: c._id,
        title: c.title,
        organization: c.organization?.name,
        reasons: [c.aiTrustScore?.analysis || `AI trust score is low (${c.aiTrustScore?.overall})`],
        severity: 'medium'
      }))
    ];

    res.json({
      success: true,
      analytics: {
        donationGrowth,
        topDonors,
        campaignPerformance,
        fraudAlerts,
        suspiciousActivity: rapidDonationBursts,
        revenueByCategory
      }
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getDashboardStats, getPendingOrganizations, verifyOrganization,
  getPendingCampaigns, approveCampaign, getAllUsers,
  toggleUserStatus, toggleFeatureCampaign, getAdvancedAnalytics
};
