const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const User = require('./models/User');
const Organization = require('./models/Organization');
const Campaign = require('./models/Campaign');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/fundvision';

const seed = async () => {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Clear existing data (campaigns, orgs, users)
    await Promise.all([
      User.deleteMany({}),
      Organization.deleteMany({}),
      Campaign.deleteMany({}),
    ]);
    console.log('🗑️  Cleared old data and demo campaigns');

    // 1. Create Admin
    const admin = await User.create({
      name: 'FundVision Admin',
      email: 'admin@fundvision.com',
      password: 'Admin@123',
      role: 'admin',
      isEmailVerified: true,
      isActive: true,
    });
    console.log('✅ Admin created:', admin.email);

    // 2. Create Donor
    const donor = await User.create({
      name: 'Rahul Sharma',
      email: 'donor@test.com',
      password: 'Test@123',
      role: 'donor',
      isEmailVerified: true,
      isActive: true,
      totalDonated: 25000,
      donationCount: 8,
      interests: ['Medical', 'Education', 'Social Causes'],
    });
    console.log('✅ Donor created:', donor.email);

    // 3. Create Organization 1 User (Udaan Foundation)
    const orgUser1 = await User.create({
      name: 'Udaan Foundation Team',
      email: 'udaan.foundation@fundvision.demo',
      password: 'Udaan@2026#Demo',
      role: 'organization',
      isEmailVerified: true,
      isActive: true,
    });

    const org1 = await Organization.create({
      user: orgUser1._id,
      name: 'Udaan Foundation',
      description: 'Udaan Foundation is a registered non-profit organization dedicated to serving underprivileged communities across Maharashtra. We focus on child education, community health camps, and seasonal food security for vulnerable urban families.',
      type: 'NGO',
      registrationNumber: 'NGO-MH-2018-88341',
      panNumber: 'AAATU1234F',
      website: 'https://udaanfoundation.demo',
      phone: '+91 98200 11223',
      address: { street: '402 Sunrise Towers, Lower Parel', city: 'Mumbai', state: 'Maharashtra', pincode: '400013', country: 'India' },
      verificationStatus: 'verified',
      isVerified: true,
      verifiedAt: new Date(),
      verifiedBy: admin._id,
      totalRaised: 470000,
      totalCampaigns: 3,
      successfulCampaigns: 2,
      trustScore: 95,
      documents: {
        ngoCertificate: { url: 'https://example.com/docs/udaan-cert.pdf' },
        panCard: { url: 'https://example.com/docs/udaan-pan.pdf' },
        registrationProof: { url: 'https://example.com/docs/udaan-reg.pdf' },
      },
    });
    console.log('✅ Organization 1 created:', org1.name, '(', orgUser1.email, ')');

    // 4. Create Organization 2 User (Sahyog Care Foundation)
    const orgUser2 = await User.create({
      name: 'Sahyog Care Team',
      email: 'sahyog.care@fundvision.demo',
      password: 'Sahyog@2026#Demo',
      role: 'organization',
      isEmailVerified: true,
      isActive: true,
    });

    const org2 = await Organization.create({
      user: orgUser2._id,
      name: 'Sahyog Care Foundation',
      description: 'Sahyog Care Foundation is a community-driven non-profit advancing rural education, emergency health support, and clean water access across North India. We work closely with local village councils to build sustainable community infrastructure.',
      type: 'NGO',
      registrationNumber: 'NGO-DL-2016-55412',
      panNumber: 'AAATS5678G',
      website: 'https://sahyogcare.demo',
      phone: '+91 98110 44332',
      address: { street: '12-B Connaught Place', city: 'New Delhi', state: 'Delhi', pincode: '110001', country: 'India' },
      verificationStatus: 'verified',
      isVerified: true,
      verifiedAt: new Date(),
      verifiedBy: admin._id,
      totalRaised: 525000,
      totalCampaigns: 3,
      successfulCampaigns: 3,
      trustScore: 97,
      documents: {
        ngoCertificate: { url: 'https://example.com/docs/sahyog-cert.pdf' },
        panCard: { url: 'https://example.com/docs/sahyog-pan.pdf' },
        registrationProof: { url: 'https://example.com/docs/sahyog-reg.pdf' },
      },
    });
    console.log('✅ Organization 2 created:', org2.name, '(', orgUser2.email, ')');

    // 5. Create 6 Realistic Campaigns
    const now = Date.now();
    const campaignsData = [
      // --- Organization 1: Udaan Foundation ---
      {
        title: 'Back to School: Education Kits for 200 Children',
        slug: 'back-to-school-education-kits-200-children-' + now,
        description: 'Providing sturdy school bags, notebooks, stationery, and learning materials to 200 children from low-income families to ensure uninterrupted education.',
        story: `Every academic year, hundreds of children in urban informal settlements drop out of school simply because their families cannot afford basic supplies like notebooks, school bags, and pens.\n\nUdaan Foundation's "Back to School" drive aims to equip 200 deserving primary school students in Mumbai with comprehensive education kits. Each kit costs ₹1,250 and includes a durable waterproof backpack, a set of 10 notebooks, geometry box, stationery pouch, water bottle, and supplementary reading books.\n\nBy providing these fundamental tools, we eliminate financial barriers and motivate children to stay in school and excel in their studies. Your contribution directly covers the cost of preparing a child for an entire academic year.`,
        category: 'Education',
        goalAmount: 250000,
        raisedAmount: 145000,
        donorCount: 48,
        deadline: new Date(now + 40 * 24 * 60 * 60 * 1000),
        status: 'active',
        isFeatured: true,
        isUrgent: false,
        isTrending: true,
        images: [{ url: '/campaigns/campaign-1.jpg', isPrimary: true }],
        organization: org1._id,
        createdBy: orgUser1._id,
        aiSummary: 'Providing 200 low-income children with complete school supplies, bags, and stationery kits to prevent dropouts and promote education in Mumbai.',
        aiTrustScore: { overall: 94, transparency: 95, reliability: 93 },
        location: { city: 'Mumbai', state: 'Maharashtra' },
        tags: ['education', 'children', 'school', 'supplies', 'books'],
        beneficiaries: { count: 200, description: 'Underprivileged primary school students' },
      },
      {
        title: 'Community Health Camp for Families in Need',
        slug: 'community-health-camp-families-in-need-' + now,
        description: 'Organizing comprehensive health checkups, diagnostic tests, consultations, and free essential medicines for 500 low-income families.',
        story: `Access to quality primary healthcare remains out of reach for many daily wage workers and urban poor families. Minor health ailments often escalate into chronic conditions due to delayed treatment and lack of funds.\n\nUdaan Foundation is organizing a multi-specialty Community Health Camp in Thane district. The camp will provide free consultations with general physicians, pediatricians, and gynecologists, along with basic blood tests, eye screenings, and essential prescription medications.\n\nYour support helps cover medical equipment rental, diagnostic test kits, doctor stipends, and free medicine distribution for over 500 patients.`,
        category: 'Medical',
        goalAmount: 175000,
        raisedAmount: 98000,
        donorCount: 34,
        deadline: new Date(now + 25 * 24 * 60 * 60 * 1000),
        status: 'active',
        isFeatured: false,
        isUrgent: true,
        isTrending: false,
        images: [{ url: '/campaigns/campaign-2.jpg', isPrimary: true }],
        organization: org1._id,
        createdBy: orgUser1._id,
        aiSummary: 'Free multi-specialty medical health camp providing consultations, diagnostic tests, and medicines to 500 low-income patients.',
        aiTrustScore: { overall: 91, transparency: 90, reliability: 92 },
        location: { city: 'Thane', state: 'Maharashtra' },
        tags: ['medical', 'health', 'clinic', 'medicines', 'community'],
        beneficiaries: { count: 500, description: 'Low-income family members and senior citizens' },
      },
      {
        title: 'Nutritious Meals for Children Through the Monsoon',
        slug: 'nutritious-meals-children-monsoon-' + now,
        description: 'Delivering daily hot, nutrient-dense meals and immunity boosters to vulnerable children during the severe monsoon flooding season.',
        story: `Heavy monsoon rains in coastal Maharashtra frequently lead to waterlogging and localized displacement, disruption of daily earnings, and acute child food insecurity.\n\nThrough our seasonal hunger relief initiative, Udaan Foundation prepares and distributes 300 freshly cooked, nutritionally balanced meals every day to children in temporary shelters and flood-prone informal clusters.\n\nEach meal package includes khichdi/rice with lentils, seasonal vegetables, a boiled egg or banana, and immunity-boosting micronutrient supplements. Your donation of ₹50 provides a complete, wholesome meal for a child.`,
        category: 'Social Causes',
        goalAmount: 200000,
        raisedAmount: 125000,
        donorCount: 42,
        deadline: new Date(now + 30 * 24 * 60 * 60 * 1000),
        status: 'active',
        isFeatured: true,
        isUrgent: false,
        isTrending: true,
        images: [{ url: '/campaigns/campaign-3.jpg', isPrimary: true }],
        organization: org1._id,
        createdBy: orgUser1._id,
        aiSummary: 'Distributing 300 hot, nutritious meals daily to children affected by monsoon flooding and seasonal food scarcity.',
        aiTrustScore: { overall: 93, transparency: 92, reliability: 94 },
        location: { city: 'Mumbai', state: 'Maharashtra' },
        tags: ['nutrition', 'food', 'children', 'monsoon', 'relief'],
        beneficiaries: { count: 300, description: 'Children in flood-affected informal settlements' },
      },

      // --- Organization 2: Sahyog Care Foundation ---
      {
        title: 'Help Equip a Rural Learning Centre',
        slug: 'help-equip-rural-learning-centre-' + now,
        description: 'Establishing a modern learning centre with ergonomic desks, books, tablets, and STEM learning tools for 350 village students.',
        story: `Students in rural Rajasthan often study in cramped spaces lacking basic furniture and educational technology. Limited access to modern learning resources holds back promising young minds.\n\nSahyog Care Foundation is setting up a state-of-the-art Rural Community Learning Centre in Alwar district. The facility will feature 15 digital tablets preloaded with interactive science and math curricula, a library of 1,000+ books, ergonomic study furniture, and high-speed internet.\n\nThis center will serve 350 students across 4 neighbouring villages, giving them equal opportunities to develop digital literacy and academic excellence.`,
        category: 'Education',
        goalAmount: 300000,
        raisedAmount: 185000,
        donorCount: 56,
        deadline: new Date(now + 50 * 24 * 60 * 60 * 1000),
        status: 'active',
        isFeatured: true,
        isUrgent: false,
        isTrending: true,
        images: [{ url: '/campaigns/campaign-4.jpg', isPrimary: true }],
        organization: org2._id,
        createdBy: orgUser2._id,
        aiSummary: 'Building a modern digital and STEM learning facility equipped with tablets, books, and study desks for 350 rural village students.',
        aiTrustScore: { overall: 96, transparency: 96, reliability: 96 },
        location: { city: 'Jaipur', state: 'Rajasthan' },
        tags: ['education', 'rural', 'digital', 'stem', 'learning'],
        beneficiaries: { count: 350, description: 'Rural village students grades 5-10' },
      },
      {
        title: 'Emergency Medical Support for Low-Income Families',
        slug: 'emergency-medical-support-low-income-families-' + now,
        description: 'Providing rapid financial assistance and emergency medical funds for critical surgeries, ICU care, and life-saving treatments.',
        story: `A sudden medical crisis or severe accident can bankrupt a low-income household overnight, forcing families to take high-interest loans or forego critical hospital treatment.\n\nSahyog Care Foundation maintains an Emergency Medical Response Fund to provide swift micro-grants directly to hospitals for patients needing immediate surgery, blood transfusions, or intensive care.\n\nEvery rupee raised in this fund is strictly verified against hospital bills and disbursed within 24 hours of approval. Your support saves lives when hours matter most.`,
        category: 'Medical',
        goalAmount: 250000,
        raisedAmount: 130000,
        donorCount: 39,
        deadline: new Date(now + 20 * 24 * 60 * 60 * 1000),
        status: 'active',
        isFeatured: false,
        isUrgent: true,
        isTrending: true,
        images: [{ url: '/campaigns/campaign-5.jpg', isPrimary: true }],
        organization: org2._id,
        createdBy: orgUser2._id,
        aiSummary: 'Rapid emergency medical fund providing direct micro-grants for critical hospital care and urgent surgeries for poor families.',
        aiTrustScore: { overall: 95, transparency: 94, reliability: 96 },
        location: { city: 'New Delhi', state: 'Delhi' },
        tags: ['medical', 'emergency', 'hospital', 'surgery', 'icu'],
        beneficiaries: { count: 40, description: 'Critical emergency patients and hospital families' },
      },
      {
        title: 'Clean Water for a Village Community',
        slug: 'clean-water-village-community-' + now,
        description: 'Installing a solar-powered deep borehole water purification plant to provide clean drinking water to over 1,200 village residents.',
        story: `In dry regions of Rajasthan, women and young girls walk over 4 kilometers daily to fetch brackish, contaminated groundwater. High fluoride and bacterial levels lead to frequent waterborne diseases and missed school days.\n\nSahyog Care Foundation is installing a sustainable, solar-powered RO water filtration system connected to a deep borehole in a rural panchayat. The plant will produce 5,000 liters of pure, safe drinking water daily.\n\nYour contribution funds the filtration unit installation, solar panels, storage tank construction, and training of a local village water management committee to ensure long-term maintenance.`,
        category: 'Environment',
        goalAmount: 350000,
        raisedAmount: 210000,
        donorCount: 64,
        deadline: new Date(now + 60 * 24 * 60 * 60 * 1000),
        status: 'active',
        isFeatured: true,
        isUrgent: false,
        isTrending: true,
        images: [{ url: '/campaigns/campaign-6.jpg', isPrimary: true }],
        organization: org2._id,
        createdBy: orgUser2._id,
        aiSummary: 'Solar-powered clean drinking water filtration system serving 1,200 village residents in water-scarce Rajasthan.',
        aiTrustScore: { overall: 97, transparency: 97, reliability: 97 },
        location: { city: 'Alwar', state: 'Rajasthan' },
        tags: ['water', 'cleanwater', 'environment', 'rural', 'solar'],
        beneficiaries: { count: 1200, description: 'Village residents and local school children' },
      },
    ];

    for (const cData of campaignsData) {
      await Campaign.create(cData);
    }
    console.log(`✅ ${campaignsData.length} new realistic campaigns created successfully!`);

    console.log('\n🎉 Seed completed successfully!\n');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📧 Organization 1 (Udaan Foundation):');
    console.log('   Email:    udaan.foundation@fundvision.demo');
    console.log('   Password: Udaan@2026#Demo');
    console.log('   Campaigns: 3');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📧 Organization 2 (Sahyog Care Foundation):');
    console.log('   Email:    sahyog.care@fundvision.demo');
    console.log('   Password: Sahyog@2026#Demo');
    console.log('   Campaigns: 3');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📧 Admin:    admin@fundvision.com  | Admin@123');
    console.log('📧 Donor:    donor@test.com        | Test@123');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    process.exit(0);
  } catch (error) {
    console.error('❌ Seed failed:', error);
    process.exit(1);
  }
};

seed();
