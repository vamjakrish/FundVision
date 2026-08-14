const Campaign = require('../models/Campaign');
const Organization = require('../models/Organization');
const Notification = require('../models/Notification');
const Donation = require('../models/Donation');
const { getIO } = require('../socket/socketManager');
const notify = require('../utils/notify');
const mongoose = require('mongoose');
// @desc    Get all campaigns (public)
// @route   GET /api/campaigns
const getCampaigns = async (req, res, next) => {
  try {
    const {
      page = 1, limit = 12, category, status = 'active',
      sort = '-createdAt', search, featured, trending, urgent,
      verified, location
    } = req.query;

    const query = {};
    if (status) query.status = status;
    if (category) query.category = category;
    if (featured === 'true') query.isFeatured = true;
    if (trending === 'true') query.isTrending = true;
    if (urgent === 'true') query.isUrgent = true;

    if (search) {
      query.$text = { $search: search };
    }

    if (location) {
      query.$or = [
        { 'location.city': new RegExp(location, 'i') },
        { 'location.state': new RegExp(location, 'i') }
      ];
    }

    if (verified === 'true') {
      const verifiedOrgIds = await Organization.find({ isVerified: true }).distinct('_id');
      query.organization = { $in: verifiedOrgIds };
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const [campaigns, total] = await Promise.all([
      Campaign.find(query)
        .populate('organization', 'name logo isVerified trustScore')
        .populate('createdBy', 'name avatar')
        .sort(sort)
        .skip(skip)
        .limit(parseInt(limit))
        .lean(),
      Campaign.countDocuments(query)
    ]);

    res.json({
      success: true,
      data: campaigns,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single campaign
// @route   GET /api/campaigns/:id

const getCampaign = async (req, res, next) => {
  try {
    const param = req.params.id;

    let campaign;

    if (mongoose.Types.ObjectId.isValid(param)) {
      campaign = await Campaign.findOne({
        $or: [
          { _id: param },
          { slug: param }
        ]
      })
        .populate('organization', 'name logo isVerified trustScore description socialLinks website phone')
        .populate('createdBy', 'name avatar')
        .populate('approvedBy', 'name');
    } else {
      campaign = await Campaign.findOne({
        slug: param
      })
        .populate('organization', 'name logo isVerified trustScore description socialLinks website phone')
        .populate('createdBy', 'name avatar')
        .populate('approvedBy', 'name');
    }

    if (!campaign) {
      return res.status(404).json({
        success: false,
        message: 'Campaign not found.'
      });
    }

    await Campaign.findByIdAndUpdate(
      campaign._id,
      { $inc: { viewCount: 1 } }
    );

    res.json({
      success: true,
      data: campaign
    });
  } catch (error) {
    next(error);
  }
};
// @desc    Create campaign
// @route   POST /api/campaigns
const createCampaign = async (req, res, next) => {
  try {
    const organization = await Organization.findOne({ user: req.user.id });
    if (!organization) {
      return res.status(403).json({ success: false, message: 'Organization not found.' });
    }
    if (!organization.isVerified) {
      return res.status(403).json({ success: false, message: 'Organization must be verified to create campaigns.' });
    }

    const campaignData = {
      ...req.body,
      organization: organization._id,
      createdBy: req.user.id,
      status: 'pending'
    };

    const campaign = await Campaign.create(campaignData);

    // Notify admins
    const io = getIO();
    if (io) {
      io.to('admin-room').emit('new_campaign_pending', {
        campaignId: campaign._id,
        title: campaign.title,
        organization: organization.name
      });
    }

    res.status(201).json({ success: true, message: 'Campaign submitted for approval!', data: campaign });
  } catch (error) {
    next(error);
  }
};

// @desc    Update campaign
// @route   PUT /api/campaigns/:id
const updateCampaign = async (req, res, next) => {
  try {
    let campaign = await Campaign.findById(req.params.id);
    if (!campaign) return res.status(404).json({ success: false, message: 'Campaign not found.' });

    const organization = await Organization.findOne({ user: req.user.id });
    if (!organization || campaign.organization.toString() !== organization._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized.' });
    }

    const allowedUpdates = ['title', 'description', 'story', 'goalAmount', 'deadline', 'images', 'videos', 'tags', 'beneficiaries', 'milestones'];
    const updates = {};
    allowedUpdates.forEach(field => {
      if (req.body[field] !== undefined) updates[field] = req.body[field];
    });

    campaign = await Campaign.findByIdAndUpdate(req.params.id, updates, { new: true, runValidators: true });
    res.json({ success: true, message: 'Campaign updated!', data: campaign });
  } catch (error) {
    next(error);
  }
};

// @desc    Add campaign update
// @route   POST /api/campaigns/:id/updates
const addCampaignUpdate = async (req, res, next) => {
  try {
    const campaign = await Campaign.findById(req.params.id);
    if (!campaign) return res.status(404).json({ success: false, message: 'Campaign not found.' });

    const organization = await Organization.findOne({ user: req.user.id });
    if (!organization || campaign.organization.toString() !== organization._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized.' });
    }

    campaign.updates.unshift({
      title: req.body.title,
      content: req.body.content,
      images: req.body.images || []
    });
    await campaign.save();

    // Notify donors (real-time room broadcast for anyone viewing the campaign)
    const io = getIO();
    if (io) {
      io.to(`campaign-${campaign._id}`).emit('campaign_update', {
        campaignId: campaign._id,
        title: req.body.title,
        campaignTitle: campaign.title
      });
    }

    // Persistent notification for every unique past donor of this campaign
    const donorIds = await Donation.distinct('donor', { campaign: campaign._id, paymentStatus: 'completed' });
    await Promise.all(donorIds.map(donorId => notify({
      recipient: donorId,
      type: 'campaign_update',
      title: `📢 Update: ${campaign.title}`,
      message: req.body.title,
      data: { campaignId: campaign._id },
      priority: 'medium'
    })));

    res.json({ success: true, message: 'Update posted!', data: campaign.updates[0] });
  } catch (error) {
    next(error);
  }
};

// @desc    Track a campaign share (increments share counter)
// @route   POST /api/campaigns/:id/share
const shareCampaign = async (req, res, next) => {
  try {
    const campaign = await Campaign.findByIdAndUpdate(
      req.params.id,
      { $inc: { shareCount: 1 } },
      { new: true }
    ).select('shareCount');
    if (!campaign) return res.status(404).json({ success: false, message: 'Campaign not found.' });
    res.json({ success: true, shareCount: campaign.shareCount });
  } catch (error) {
    next(error);
  }
};

// @desc    Like/unlike campaign
// @route   POST /api/campaigns/:id/like
const likeCampaign = async (req, res, next) => {
  try {
    const campaign = await Campaign.findById(req.params.id);
    if (!campaign) return res.status(404).json({ success: false, message: 'Campaign not found.' });

    const userId = req.user.id;
    const isLiked = campaign.likes.includes(userId);

    if (isLiked) {
      campaign.likes = campaign.likes.filter(id => id.toString() !== userId);
    } else {
      campaign.likes.push(userId);
    }
    await campaign.save();

    res.json({ success: true, liked: !isLiked, likeCount: campaign.likes.length });
  } catch (error) {
    next(error);
  }
};

// @desc    Bookmark campaign
// @route   POST /api/campaigns/:id/bookmark
const bookmarkCampaign = async (req, res, next) => {
  try {
    const campaign = await Campaign.findById(req.params.id);
    if (!campaign) return res.status(404).json({ success: false, message: 'Campaign not found.' });

    const userId = req.user.id;
    const isBookmarked = campaign.bookmarks.includes(userId);

    if (isBookmarked) {
      campaign.bookmarks = campaign.bookmarks.filter(id => id.toString() !== userId);
    } else {
      campaign.bookmarks.push(userId);
    }
    await campaign.save();

    res.json({ success: true, bookmarked: !isBookmarked });
  } catch (error) {
    next(error);
  }
};

// @desc    Get organization's campaigns
// @route   GET /api/campaigns/my-campaigns
const getMyCampaigns = async (req, res, next) => {
  try {
    const organization = await Organization.findOne({ user: req.user.id });
    if (!organization) return res.status(404).json({ success: false, message: 'Organization not found.' });

    const campaigns = await Campaign.find({ organization: organization._id })
      .sort('-createdAt')
      .lean();

    res.json({ success: true, data: campaigns });
  } catch (error) {
    next(error);
  }
};

// @desc    Get campaign stats
// @route   GET /api/campaigns/:id/stats
const getCampaignStats = async (req, res, next) => {
  try {
    const Donation = require('../models/Donation');
    const campaign = await Campaign.findById(req.params.id);
    if (!campaign) return res.status(404).json({ success: false, message: 'Campaign not found.' });

    const donations = await Donation.find({ campaign: campaign._id, paymentStatus: 'completed' })
      .populate('donor', 'name avatar isAnonymous')
      .sort('-createdAt')
      .limit(50)
      .lean();

    // Monthly donation trends
    const monthlyData = await Donation.aggregate([
      { $match: { campaign: campaign._id, paymentStatus: 'completed' } },
      {
        $group: {
          _id: { year: { $year: '$createdAt' }, month: { $month: '$createdAt' } },
          total: { $sum: '$amount' },
          count: { $sum: 1 }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } },
      { $limit: 12 }
    ]);

    res.json({
      success: true,
      data: {
        campaign,
        recentDonors: donations.slice(0, 10),
        monthlyTrends: monthlyData,
        totalDonors: donations.length
      }
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getCampaigns, getCampaign, createCampaign, updateCampaign,
  addCampaignUpdate, likeCampaign, bookmarkCampaign, shareCampaign,
  getMyCampaigns, getCampaignStats
};
