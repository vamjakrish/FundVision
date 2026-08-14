// routes/users.js
const express = require('express');
const userRouter = express.Router();
const User = require('../models/User');
const { protect } = require('../middleware/auth');

userRouter.get('/profile', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).populate('savedCampaigns', 'title primaryImage raisedAmount goalAmount status');
    res.json({ success: true, data: user });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

userRouter.put('/profile', protect, async (req, res) => {
  try {
    const allowed = ['name', 'phone', 'bio', 'location', 'avatar', 'interests', 'notifications'];
    const updates = {};
    allowed.forEach(f => { if (req.body[f] !== undefined) updates[f] = req.body[f]; });
    const user = await User.findByIdAndUpdate(req.user.id, updates, { new: true, runValidators: true });
    res.json({ success: true, data: user });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

userRouter.get('/:id/public', async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('name avatar bio totalDonated donationCount badge');
    if (!user) return res.status(404).json({ success: false, message: 'User not found.' });
    res.json({ success: true, data: user });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

module.exports = userRouter;
