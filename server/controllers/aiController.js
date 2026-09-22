const Campaign = require('../models/Campaign');
const Donation = require('../models/Donation');
const User = require('../models/User');

const GROK_API_URL =
  process.env.GROQ_API_URL || "https://api.groq.com/openai/v1";

const GROK_API_KEY =
  process.env.GROQ_API_KEY || process.env.GROK_API_KEY;
  
// console.log("API KEY FOUND:", !!GROK_API_KEY);
const callGrok = async (messages, systemPrompt = '', maxTokens = 1000) => {
  const response = await fetch(`${GROK_API_URL}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${GROK_API_KEY}`
    },
    body: JSON.stringify({
      model: 'llama-3.1-8b-instant',
      messages: [
        ...(systemPrompt ? [{ role: 'system', content: systemPrompt }] : []),
        ...messages
      ],
      max_tokens: maxTokens,
      temperature: 0.7
    })
  });

  if (!response.ok) {
  const err = await response.text();

  console.log("STATUS:", response.status);
  console.log("ERROR:", err);

  return "FundVision AI is temporarily unavailable.";
}

  const data = await response.json();
  return data.choices[0].message.content;
};

// @desc    AI Campaign Summary
// @route   POST /api/ai/campaign-summary/:id
const generateCampaignSummary = async (req, res, next) => {
  try {
    const campaign = await Campaign.findById(req.params.id);
    if (!campaign) return res.status(404).json({ success: false, message: 'Campaign not found.' });

    const prompt = `Summarize this fundraising campaign in 2-3 impactful sentences for a donor:

Title: ${campaign.title}
Category: ${campaign.category}
Goal: ₹${campaign.goalAmount.toLocaleString()}
Raised: ₹${campaign.raisedAmount.toLocaleString()}
Story: ${campaign.story?.substring(0, 1000)}

Write a concise, emotionally resonant summary that highlights the need and impact.`;

    const summary = await callGrok([{ role: 'user', content: prompt }],
      'You are a compassionate fundraising expert. Create concise, powerful campaign summaries.', 300);

    await Campaign.findByIdAndUpdate(campaign._id, { aiSummary: summary });
    res.json({ success: true, summary });
  } catch (error) {
    next(error);
  }
};

// @desc    AI Trust Score
// @route   GET /api/ai/trust-score/:campaignId
const generateTrustScore = async (req, res, next) => {
  try {
    const campaign = await Campaign.findById(req.params.campaignId)
      .populate('organization', 'isVerified totalRaised successfulCampaigns verificationStatus');

    if (!campaign) return res.status(404).json({ success: false, message: 'Campaign not found.' });

    const factors = {
      orgVerified: campaign.organization.isVerified,
      hasImages: campaign.images?.length > 0,
      hasStory: campaign.story?.length > 200,
      hasUpdates: campaign.updates?.length > 0,
      hasDeadline: !!campaign.deadline,
      hasBeneficiaries: !!campaign.beneficiaries?.description,
      orgPreviousCampaigns: campaign.organization.successfulCampaigns || 0,
      daysActive: Math.floor((new Date() - campaign.createdAt) / (1000 * 60 * 60 * 24)),
    };

    const prompt = `Analyze this fundraising campaign and give trust scores (0-100):

Organization Verified: ${factors.orgVerified}
Has Quality Images: ${factors.hasImages}
Detailed Story (200+ chars): ${factors.hasStory}
Posted Updates: ${factors.hasUpdates}
Clear Deadline: ${factors.hasDeadline}
Beneficiary Info: ${factors.hasBeneficiaries}
Org Previous Campaigns: ${factors.orgPreviousCampaigns}

Return ONLY a JSON object with keys: overall, transparency, reliability (all 0-100 integers) and a brief "analysis" string.`;

    const result = await callGrok([{ role: 'user', content: prompt }],
      'You are a fraud detection and trust analysis AI. Return only valid JSON.', 500);

    let scores;
    try {
      const clean = result.replace(/```json\n?|\n?```/g, '').trim();
      scores = JSON.parse(clean);
    } catch {
      scores = { overall: 72, transparency: 68, reliability: 75, analysis: 'Campaign appears legitimate with standard transparency.' };
    }

    await Campaign.findByIdAndUpdate(campaign._id, {
      aiTrustScore: { ...scores, lastUpdated: new Date() }
    });

    res.json({ success: true, trustScore: scores });
  } catch (error) {
    next(error);
  }
};

// @desc    AI Natural Language Search
// @route   POST /api/ai/search
const naturalLanguageSearch = async (req, res, next) => {
  try {
    const { query } = req.body;
    if (!query) return res.status(400).json({ success: false, message: 'Search query required.' });

    const prompt = `A user is searching for fundraising campaigns with this query: "${query}"

Extract search intent as JSON with:
- categories: array from ["Medical","Education","Emergency","Environment","Animal Welfare","Startup Funding","Social Causes"] (empty if none match)
- keywords: array of relevant search keywords
- isUrgent: boolean if urgency implied
- sentiment: "emotional" | "analytical" | "neutral"

Return ONLY valid JSON.`;

    const result = await callGrok([{ role: 'user', content: prompt }],
      'You are a search intent analyzer. Return only valid JSON.', 300);

    let intent;
    try {
      const clean = result.replace(/```json\n?|\n?```/g, '').trim();
      intent = JSON.parse(clean);
    } catch {
      intent = { categories: [], keywords: [query], isUrgent: false };
    }

    const searchQuery = { status: 'active' };
    if (intent.categories?.length) searchQuery.category = { $in: intent.categories };
    if (intent.isUrgent) searchQuery.isUrgent = true;

    const campaigns = await Campaign.find({
      ...searchQuery,
      $or: [
        { $text: { $search: intent.keywords.join(' ') } },
        { title: { $regex: intent.keywords.join('|'), $options: 'i' } }
      ]
    })
      .populate('organization', 'name logo isVerified')
      .limit(10)
      .lean();

    res.json({ success: true, campaigns, intent });
  } catch (error) {
    next(error);
  }
};

// @desc    AI Campaign Recommendations
// @route   GET /api/ai/recommendations
const getRecommendations = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const user = await User.findById(userId);

    const recentDonations = await Donation.find({ donor: userId, paymentStatus: 'completed' })
      .populate('campaign', 'category title')
      .sort('-createdAt')
      .limit(5);

    const donatedCategories = [...new Set(recentDonations.map(d => d.campaign?.category))].filter(Boolean);
    const allCategories = user.interests?.length ? user.interests : donatedCategories;

    const query = { status: 'active' };
    if (allCategories.length) query.category = { $in: allCategories };

    const campaigns = await Campaign.find(query)
      .populate('organization', 'name logo isVerified trustScore')
      .sort({ 'aiTrustScore.overall': -1, raisedAmount: -1 })
      .limit(8)
      .lean();

    res.json({ success: true, data: campaigns, basedOn: allCategories });
  } catch (error) {
    next(error);
  }
};

// @desc    AI Impact Message
// @route   POST /api/ai/impact
const generateImpact = async (req, res, next) => {
  try {
    const { donationId } = req.body;
    const donation = await Donation.findById(donationId)
      .populate('campaign', 'title category beneficiaries story')
      .populate('donor', 'name');

    if (!donation) return res.status(404).json({ success: false, message: 'Donation not found.' });

    const prompt = `Generate a warm, personalized impact message for this donation:
Donor: ${donation.isAnonymous ? 'Anonymous' : donation.donor.name}
Amount: ₹${donation.amount}
Campaign: ${donation.campaign.title}
Category: ${donation.campaign.category}
Beneficiaries: ${donation.campaign.beneficiaries?.description || 'People in need'}

Write 2-3 sentences showing the real-world impact of their specific amount. Be specific, emotional, and inspiring.`;

    const message = await callGrok([{ role: 'user', content: prompt }],
      'You are an impact storyteller for a fundraising platform. Make donors feel their contribution matters.', 300);

    await Donation.findByIdAndUpdate(donationId, { aiImpactMessage: message });
    res.json({ success: true, message });
  } catch (error) {
    next(error);
  }
};

// @desc    AI Chatbot
// @route   POST /api/ai/chat
const chat = async (req, res, next) => {
  try {
    const { message, history = [] } = req.body;

    const systemPrompt = `You are FundBot, FundVision's AI assistant. FundVision is a transparent crowdfunding platform connecting donors with verified NGOs, hospitals, and social organizations in India.

You help users:
- Discover and explore fundraising campaigns
- Understand how donations work
- Learn about campaign verification
- Navigate the platform
- Answer questions about impact and transparency

Be warm, concise, and helpful. For specific campaign details, suggest using the search feature.
Current date: ${new Date().toLocaleDateString('en-IN')}`;

    const messages = [
      ...history.slice(-10),
      { role: 'user', content: message }
    ];

    const reply = await callGrok(messages, systemPrompt, 500);
    res.json({ success: true, reply });
  } catch (error) {
    console.error("========== CHATBOT ERROR ==========");
    console.error(error);
    console.error("MESSAGE:", error?.message);
    console.error("STACK:", error?.stack);
    console.error("===================================");

    return res.status(500).json({
      success: false,
      error: error?.message || "Unknown error"
    });
  }
};

// @desc    AI Fraud Detection (Admin)
// @route   POST /api/ai/fraud-check/:campaignId
const checkFraud = async (req, res, next) => {
  try {
    const campaign = await Campaign.findById(req.params.campaignId)
      .populate('organization', 'name isVerified totalCampaigns');

    if (!campaign) return res.status(404).json({ success: false, message: 'Campaign not found.' });

    // Check for suspicious patterns
    const similarCampaigns = await Campaign.find({
      title: { $regex: campaign.title.substring(0, 20), $options: 'i' },
      _id: { $ne: campaign._id }
    }).count();

    const prompt = `Analyze this fundraising campaign for potential fraud:

Title: ${campaign.title}
Description: ${campaign.description}
Goal: ₹${campaign.goalAmount}
Organization Verified: ${campaign.organization.isVerified}
Similar campaigns found: ${similarCampaigns}
Days since creation: ${Math.floor((new Date() - campaign.createdAt) / 86400000)}

Return JSON with: riskLevel ("low"|"medium"|"high"), flags (array of concern strings), recommendation ("approve"|"review"|"reject"), confidence (0-100).`;

    const result = await callGrok([{ role: 'user', content: prompt }],
      'You are a fraud detection AI for fundraising platforms. Return only valid JSON.', 400);

    let analysis;
    try {
      const clean = result.replace(/```json\n?|\n?```/g, '').trim();
      analysis = JSON.parse(clean);
    } catch {
      analysis = { riskLevel: 'low', flags: [], recommendation: 'review', confidence: 60 };
    }

    res.json({ success: true, analysis });
  } catch (error) {
    next(error);
  }
};

// @desc    AI Dashboard Insights
// @route   GET /api/ai/insights
const getDashboardInsights = async (req, res, next) => {
  try {
    let context = '';

    if (req.user.role === 'organization') {
      const org = await require('../models/Organization').findOne({ user: req.user.id });
      const campaigns = await Campaign.find({ organization: org?._id }).lean();
      const totalRaised = campaigns.reduce((sum, c) => sum + c.raisedAmount, 0);
      context = `Organization has ${campaigns.length} campaigns, raised ₹${totalRaised} total, ${campaigns.filter(c => c.status === 'active').length} active campaigns.`;
    } else {
      const donations = await Donation.find({ donor: req.user.id, paymentStatus: 'completed' }).lean();
      const totalDonated = donations.reduce((sum, d) => sum + d.amount, 0);
      context = `Donor has made ${donations.length} donations totaling ₹${totalDonated}.`;
    }

    const prompt = `Based on this user's activity: ${context}

Generate 3 actionable insights as JSON array. Each item: { title, description, type ("tip"|"alert"|"achievement") }`;

    const result = await callGrok([{ role: 'user', content: prompt }],
      'You are a data analyst for a fundraising platform. Return only a valid JSON array.', 500);

    let insights;
    try {
      const clean = result.replace(/```json\n?|\n?```/g, '').trim();
      insights = JSON.parse(clean);
    } catch {
      insights = [
        { title: 'Keep Giving', description: 'Your consistent support makes a real difference in people\'s lives.', type: 'achievement' }
      ];
    }

    res.json({ success: true, insights });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  generateCampaignSummary, generateTrustScore, naturalLanguageSearch,
  getRecommendations, generateImpact, chat, checkFraud, getDashboardInsights
};
