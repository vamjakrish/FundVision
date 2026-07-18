const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const User = require('../models/User');
const Organization = require('../models/Organization');
const { sendEmail } = require('../utils/email');

const generateToken = (id) => jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRE || '7d' });

const generateRefreshToken = (id) => jwt.sign({ id }, process.env.JWT_REFRESH_SECRET, { expiresIn: process.env.JWT_REFRESH_EXPIRE || '30d' });

// @desc    Register user
// @route   POST /api/auth/register
const register = async (req, res, next) => {
  try {
    const { name, email, password, role, phone } = req.body;
    
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ success: false, message: 'Email already registered.' });
    }
    
    const user = await User.create({ name, email, password, role: role || 'donor', phone });
    
    const verificationToken = user.generateEmailVerificationToken();
    await user.save({ validateBeforeSave: false });
    
    // Send verification email
    const verifyUrl = `${process.env.CLIENT_URL}/verify-email/${verificationToken}`;
    try {
      await sendEmail({
        to: user.email,
        subject: 'Welcome to FundVision - Verify Your Email',
        template: 'emailVerification',
        data: { name: user.name, verifyUrl }
      });
    } catch (emailError) {
      console.error('Email send error:', emailError.message);
    }
    
    const token = generateToken(user._id);
    const refreshToken = generateRefreshToken(user._id);
    
    user.password = undefined;
    res.status(201).json({
      success: true,
      message: 'Registration successful! Please verify your email.',
      token,
      refreshToken,
      user
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Login user
// @route   POST /api/auth/login
const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Please provide email and password.' });
    }
    
    const user = await User.findOne({ email }).select('+password');
    if (!user || !user.password) {
      return res.status(401).json({ success: false, message: 'Invalid credentials.' });
    }
    
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid credentials.' });
    }
    
    if (!user.isActive) {
      return res.status(401).json({ success: false, message: 'Account has been deactivated. Contact support.' });
    }
    
    user.lastLogin = new Date();
    await user.save({ validateBeforeSave: false });
    
    const token = generateToken(user._id);
    const refreshToken = generateRefreshToken(user._id);
    
    user.password = undefined;
    
    let organizationData = null;
    if (user.role === 'organization') {
      organizationData = await Organization.findOne({ user: user._id }).select('name isVerified verificationStatus logo');
    }
    
    res.json({
      success: true,
      message: 'Login successful!',
      token,
      refreshToken,
      user,
      organization: organizationData
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Verify email
// @route   GET /api/auth/verify-email/:token
const verifyEmail = async (req, res, next) => {
  try {
    const hashedToken = crypto.createHash('sha256').update(req.params.token).digest('hex');
    const user = await User.findOne({
      emailVerificationToken: hashedToken,
      emailVerificationExpire: { $gt: Date.now() }
    });
    
    if (!user) {
      return res.status(400).json({ success: false, message: 'Invalid or expired verification token.' });
    }
    
    user.isEmailVerified = true;
    user.emailVerificationToken = undefined;
    user.emailVerificationExpire = undefined;
    await user.save({ validateBeforeSave: false });
    
    res.json({ success: true, message: 'Email verified successfully!' });
  } catch (error) {
    next(error);
  }
};

// @desc    Forgot password
// @route   POST /api/auth/forgot-password
const forgotPassword = async (req, res, next) => {
  try {
    const user = await User.findOne({ email: req.body.email });
    if (!user) {
      return res.status(404).json({ success: false, message: 'No account found with that email.' });
    }
    
    const resetToken = user.generateResetPasswordToken();
    await user.save({ validateBeforeSave: false });
    
    const resetUrl = `${process.env.CLIENT_URL}/reset-password/${resetToken}`;
    
    try {
      await sendEmail({
        to: user.email,
        subject: 'FundVision - Password Reset Request',
        template: 'passwordReset',
        data: { name: user.name, resetUrl }
      });
      res.json({ success: true, message: 'Password reset email sent!' });
    } catch (emailError) {
      user.resetPasswordToken = undefined;
      user.resetPasswordExpire = undefined;
      await user.save({ validateBeforeSave: false });
      return res.status(500).json({ success: false, message: 'Email could not be sent.' });
    }
  } catch (error) {
    next(error);
  }
};

// @desc    Reset password
// @route   POST /api/auth/reset-password/:token
const resetPassword = async (req, res, next) => {
  try {
    const hashedToken = crypto.createHash('sha256').update(req.params.token).digest('hex');
    const user = await User.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpire: { $gt: Date.now() }
    });
    
    if (!user) {
      return res.status(400).json({ success: false, message: 'Invalid or expired reset token.' });
    }
    
    user.password = req.body.password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    await user.save();
    
    const token = generateToken(user._id);
    res.json({ success: true, message: 'Password reset successful!', token });
  } catch (error) {
    next(error);
  }
};

// @desc    Get current user
// @route   GET /api/auth/me
const getMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);
    let organization = null;
    if (user.role === 'organization') {
      organization = await Organization.findOne({ user: user._id });
    }
    res.json({ success: true, user, organization });
  } catch (error) {
    next(error);
  }
};

// @desc    Refresh token
// @route   POST /api/auth/refresh-token
const refreshToken = async (req, res, next) => {
  try {
    const { refreshToken: token } = req.body;
    if (!token) return res.status(401).json({ success: false, message: 'No refresh token' });
    
    const decoded = jwt.verify(token, process.env.JWT_REFRESH_SECRET);
    const user = await User.findById(decoded.id);
    if (!user) return res.status(401).json({ success: false, message: 'User not found' });
    
    const newToken = generateToken(user._id);
    res.json({ success: true, token: newToken });
  } catch (error) {
    return res.status(401).json({ success: false, message: 'Invalid refresh token' });
  }
};

// @desc    Update password
// @route   PUT /api/auth/update-password
const updatePassword = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id).select('+password');
    const { currentPassword, newPassword } = req.body;
    
    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) return res.status(400).json({ success: false, message: 'Current password is incorrect.' });
    
    user.password = newPassword;
    await user.save();
    
    const token = generateToken(user._id);
    res.json({ success: true, message: 'Password updated!', token });
  } catch (error) {
    next(error);
  }
};

module.exports = { register, login, verifyEmail, forgotPassword, resetPassword, getMe, refreshToken, updatePassword };
