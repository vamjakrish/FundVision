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

    // Clear existing data
    await Promise.all([
      User.deleteMany({}),
      Organization.deleteMany({}),
      Campaign.deleteMany({}),
    ]);
    console.log('🗑️  Cleared existing data');

    // Create Admin
    const admin = await User.create({
      name: 'FundVision Admin',
      email: 'admin@fundvision.com',
      password: 'Admin@123',
      role: 'admin',
      isEmailVerified: true,
      isActive: true,
    });
    console.log('✅ Admin created:', admin.email);

    // Create Donor
    const donor = await User.create({
      name: 'Rahul Sharma',
      email: 'donor@test.com',
      password: 'Test@123',
      role: 'donor',
      isEmailVerified: true,
      isActive: true,
      totalDonated: 25000,
      donationCount: 8,
      interests: ['Medical', 'Education', 'Emergency'],
    });
    console.log('✅ Donor created:', donor.email);

    // Create Org User
    const orgUser = await User.create({
      name: 'Priya Patel',
      email: 'org@test.com',
      password: 'Test@123',
      role: 'organization',
      isEmailVerified: true,
      isActive: true,
    });

    // Create Organization
    const org = await Organization.create({
      user: orgUser._id,
      name: 'Helping Hands Foundation',
      description: 'We are dedicated to providing education, healthcare, and emergency relief to underprivileged communities across India. Founded in 2010, we have impacted over 50,000 lives.',
      type: 'NGO',
      registrationNumber: 'NGO-MH-2010-12345',
      panNumber: 'AABCH1234D',
      website: 'https://helpinghands.org',
      phone: '+91 98765 43210',
      address: { street: '123 Gandhi Road', city: 'Mumbai', state: 'Maharashtra', pincode: '400001', country: 'India' },
      verificationStatus: 'verified',
      isVerified: true,
      verifiedAt: new Date(),
      verifiedBy: admin._id,
      totalRaised: 1250000,
      totalCampaigns: 12,
      successfulCampaigns: 9,
      trustScore: 94,
      documents: {
        ngoCertificate: { url: 'https://example.com/docs/ngo-cert.pdf' },
        panCard: { url: 'https://example.com/docs/pan.pdf' },
        registrationProof: { url: 'https://example.com/docs/reg.pdf' },
      },
    });
    console.log('✅ Organization created:', org.name);

    // Create Sample Campaigns
    const campaigns = [
      {
        title: 'Life-Saving Surgery for 7-Year-Old Aryan',
        slug: 'life-saving-surgery-aryan-' + Date.now(),
        description: 'Little Aryan needs an urgent heart surgery that his family cannot afford. Every rupee brings him closer to a healthy childhood.',
        story: `Aryan Kumar is a 7-year-old boy from a small village in Bihar. Born with a congenital heart defect, Aryan has never known a day without pain. His father, a daily wage laborer, earns barely ₹8,000 a month — far from the ₹4,50,000 needed for the life-saving surgery at AIIMS Delhi.\n\nFor the past two years, Aryan's condition has been deteriorating. He cannot run or play like other children. Simple tasks leave him breathless. His mother, Sunita, spends her days praying for a miracle.\n\nThe surgery has a 95% success rate at AIIMS. Doctors say it must happen within the next 60 days. Without it, Aryan's heart will fail.\n\nYour donation, no matter how small, gives Aryan a future. Help us write a story with a happy ending.`,
        category: 'Medical',
        goalAmount: 450000,
        raisedAmount: 312000,
        donorCount: 142,
        deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        status: 'active',
        isFeatured: true,
        isUrgent: true,
        isTrending: true,
        images: [{ url: 'https://images.unsplash.com/photo-1581056771107-24ca5f033842?w=800', isPrimary: true }],
        organization: org._id,
        createdBy: orgUser._id,
        aiSummary: 'Aryan, a 7-year-old with a heart defect, urgently needs ₹4.5L for life-saving surgery at AIIMS Delhi within 60 days. His family cannot afford it — your donation can give him a future.',
        aiTrustScore: { overall: 92, transparency: 90, reliability: 94 },
        location: { city: 'Delhi', state: 'Delhi' },
        tags: ['medical', 'child', 'heart', 'surgery', 'urgent'],
        milestones: [
          { title: 'Surgery Pre-op Tests', amount: 50000, achieved: true, achievedAt: new Date() },
          { title: 'Surgery Cost', amount: 350000, achieved: false },
          { title: 'Post-op Care', amount: 450000, achieved: false },
        ],
        updates: [
          { title: 'Great News - Pre-op Tests Complete!', content: 'Thanks to your generous support, Aryan has completed all pre-operative tests. Doctors confirm he is ready for surgery. We are now 70% funded. Keep sharing!', postedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000) },
        ],
      },
      {
        title: 'Digital Classrooms for 500 Rural Girls',
        slug: 'digital-classrooms-rural-girls-' + Date.now(),
        description: 'Help us bring quality digital education to 500 girls in rural Rajasthan who lack access to computers and internet.',
        story: `In the dusty villages of Barmer district, Rajasthan, 500 bright-eyed girls walk 5km every day to reach a school that has no electricity, no computers, and no internet. In a world racing toward digital literacy, these girls are being left behind.\n\nMeeting Kavya, 14, she shows you her worn-out textbook and says, "I want to be a software engineer. But I've never touched a computer." Her dream shouldn't be impossible just because of where she was born.\n\nWe plan to set up 10 solar-powered digital classrooms equipped with laptops, tablets, and internet connectivity. Trained educators will teach coding, digital literacy, and career skills.\n\nThe impact: 500 girls, grades 6-10, will gain skills that can transform their futures — and break the cycle of poverty for their entire families.`,
        category: 'Education',
        goalAmount: 800000,
        raisedAmount: 520000,
        donorCount: 287,
        deadline: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000),
        status: 'active',
        isFeatured: true,
        isTrending: true,
        images: [{ url: 'https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=800', isPrimary: true }],
        organization: org._id,
        createdBy: orgUser._id,
        aiSummary: 'Bringing solar-powered digital classrooms to 500 rural girls in Rajasthan who have never used a computer. Teaching coding, digital skills, and opening career doors.',
        aiTrustScore: { overall: 96, transparency: 95, reliability: 97 },
        location: { city: 'Barmer', state: 'Rajasthan' },
        tags: ['education', 'girls', 'digital', 'rural', 'empowerment'],
      },
      {
        title: 'Flood Relief: Kerala Families Need You Now',
        slug: 'flood-relief-kerala-' + Date.now(),
        description: 'Devastating floods have displaced 2,000 families in Kerala. Urgent aid needed for food, shelter, and medicine.',
        story: `On August 14th, unprecedented rainfall caused catastrophic flooding across three districts in Kerala. Within hours, 2,000 families lost their homes, their belongings, and their livelihoods.\n\nFamilies are living in relief camps with minimal food, poor sanitation, and limited medical care. Children are going without meals. Elderly people lack essential medicines.\n\nWe are on the ground RIGHT NOW distributing emergency kits. Every ₹500 feeds a family for a week. Every ₹2,000 provides a complete emergency kit with food, medicine, and hygiene supplies.\n\nTime is critical. The monsoon continues. Please donate now.`,
        category: 'Emergency',
        goalAmount: 1000000,
        raisedAmount: 678000,
        donorCount: 892,
        deadline: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000),
        status: 'active',
        isUrgent: true,
        isTrending: true,
        images: [{ url: 'https://images.unsplash.com/photo-1547683905-f686c993aae5?w=800', isPrimary: true }],
        organization: org._id,
        createdBy: orgUser._id,
        aiSummary: 'Emergency flood relief for 2,000 displaced families in Kerala. On-ground distribution of food, medicine, and emergency kits urgently needed.',
        aiTrustScore: { overall: 89, transparency: 88, reliability: 90 },
        location: { city: 'Kochi', state: 'Kerala' },
        tags: ['emergency', 'flood', 'relief', 'kerala', 'disaster'],
      },
    ];

    for (const campData of campaigns) {
      await Campaign.create(campData);
    }
    console.log(`✅ ${campaigns.length} campaigns created`);

    console.log('\n🎉 Seed completed successfully!\n');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📧 Admin:    admin@fundvision.com  | Admin@123');
    console.log('📧 Donor:    donor@test.com        | Test@123');
    console.log('📧 Org:      org@test.com          | Test@123');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    process.exit(0);
  } catch (error) {
    console.error('❌ Seed failed:', error);
    process.exit(1);
  }
};

seed();
