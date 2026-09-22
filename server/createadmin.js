const mongoose = require('mongoose');
const User = require('./models/User');
require('dotenv').config();

async function createAdmin() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);

    const existingAdmin = await User.findOne({
      email: 'admin@gmail.com'
    });

    if (existingAdmin) {
      console.log('Admin already exists');
      process.exit(0);
    }

    const admin = await User.create({
      name: 'FundVision Admin',
      email: 'admin@gmail.com',
      password: 'Admin123',
      role: 'admin',
      isEmailVerified: true,
      isActive: true
    });

    console.log('Admin created successfully');
    console.log('Email: admin@fundvision.com');
    console.log('Password: Admin@123');

    process.exit(0);
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
}

createAdmin();