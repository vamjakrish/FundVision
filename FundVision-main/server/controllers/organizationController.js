const Organization = require('../models/Organization');
const User = require('../models/User');

// @desc    Create or update organization profile
// @route   POST /api/organizations
const createOrganization = async (req, res, next) => {
  try {
    const existing = await Organization.findOne({ user: req.user.id });
    if (existing) return res.status(400).json({ success: false, message: 'Organization profile already exists.' });

    if (req.user.role !== 'organization') {
      await User.findByIdAndUpdate(req.user.id, { role: 'organization' });
    }

    const org = await Organization.create({ ...req.body, user: req.user.id });
    res.status(201).json({ success: true, message: 'Organization profile created! Awaiting verification.', data: org });
  } catch (error) {
    next(error);
  }
};

// @desc    Get current user's organization
// @route   GET /api/organizations/me
const getMyOrganization = async (req, res, next) => {
  try {
    const org = await Organization.findOne({ user: req.user.id }).populate('user', 'name email avatar');
    if (!org) return res.status(404).json({ success: false, message: 'Organization not found.' });
    res.json({ success: true, data: org });
  } catch (error) {
    next(error);
  }
};

// @desc    Update organization
// @route   PUT /api/organizations/me
const updateOrganization = async (req, res, next) => {
  try {
    const org = await Organization.findOne({ user: req.user.id });
    if (!org) return res.status(404).json({ success: false, message: 'Organization not found.' });

    const allowedFields = ['name', 'description', 'type', 'website', 'phone', 'address', 'socialLinks', 'logo', 'coverImage'];
    allowedFields.forEach(field => {
      if (req.body[field] !== undefined) org[field] = req.body[field];
    });

    await org.save();
    res.json({ success: true, message: 'Organization updated!', data: org });
  } catch (error) {
    next(error);
  }
};

// @desc    Upload verification documents
// @route   POST /api/organizations/documents
const uploadDocuments = async (req, res, next) => {
  try {
    const org = await Organization.findOne({ user: req.user.id });
    if (!org) return res.status(404).json({ success: false, message: 'Organization not found.' });

    const { ngoCertificate, panCard, registrationProof } = req.body;
    if (ngoCertificate) org.documents.ngoCertificate = ngoCertificate;
    if (panCard) org.documents.panCard = panCard;
    if (registrationProof) org.documents.registrationProof = registrationProof;
    org.verificationStatus = 'pending';
    await org.save();

    res.json({ success: true, message: 'Documents uploaded! Verification pending.', data: org.documents });
  } catch (error) {
    next(error);
  }
};

// @desc    Get organization by ID (public)
// @route   GET /api/organizations/:id
const getOrganization = async (req, res, next) => {
  try {
    const org = await Organization.findById(req.params.id)
      .populate('user', 'name email avatar')
      .populate('verifiedBy', 'name');
    if (!org) return res.status(404).json({ success: false, message: 'Organization not found.' });
    res.json({ success: true, data: org });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all organizations (public)
// @route   GET /api/organizations
const getOrganizations = async (req, res, next) => {
  try {
    const { page = 1, limit = 12, verified, type, search } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const query = {};
    if (verified === 'true') query.isVerified = true;
    if (type) query.type = type;
    if (search) query.$text = { $search: search };

    const [orgs, total] = await Promise.all([
      Organization.find(query).sort('-totalRaised').skip(skip).limit(parseInt(limit)),
      Organization.countDocuments(query)
    ]);

    res.json({ success: true, data: orgs, pagination: { page: parseInt(page), total } });
  } catch (error) {
    next(error);
  }
};

// @desc    Get organization analytics
// @route   GET /api/organizations/me/analytics
const getOrgAnalytics = async (req, res, next) => {
  try {
    const org = await Organization.findOne({ user: req.user.id });
    if (!org) return res.status(404).json({ success: false, message: 'Organization not found.' });

    const Campaign = require('../models/Campaign');
    const Donation = require('../models/Donation');

    const campaigns = await Campaign.find({ organization: org._id });
    const campaignIds = campaigns.map(c => c._id);

    const [monthlyDonations, categoryBreakdown, topCampaigns] = await Promise.all([
      Donation.aggregate([
        { $match: { organization: org._id, paymentStatus: 'completed', createdAt: { $gte: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000) } } },
        { $group: { _id: { year: { $year: '$createdAt' }, month: { $month: '$createdAt' } }, total: { $sum: '$amount' }, count: { $sum: 1 } } },
        { $sort: { '_id.year': 1, '_id.month': 1 } }
      ]),
      Campaign.aggregate([
        { $match: { organization: org._id } },
        { $group: { _id: '$category', count: { $sum: 1 }, raised: { $sum: '$raisedAmount' } } }
      ]),
      Campaign.find({ organization: org._id }).sort('-raisedAmount').limit(5)
    ]);

    res.json({
      success: true,
      data: {
        organization: org,
        campaigns: { total: campaigns.length, active: campaigns.filter(c => c.status === 'active').length },
        monthlyDonations,
        categoryBreakdown,
        topCampaigns
      }
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { createOrganization, getMyOrganization, updateOrganization, uploadDocuments, getOrganization, getOrganizations, getOrgAnalytics };
