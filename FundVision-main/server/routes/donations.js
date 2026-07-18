// ─── routes/donations.js ───────────────────────────────────────────────────
const express = require('express');
const donationRouter = express.Router();
const { createOrder, verifyPayment, getMyDonations, getDonationReceipt, getCampaignDonations, getAllDonations, getLeaderboard } = require('../controllers/donationController');
const { protect, authorize } = require('../middleware/auth');

donationRouter.post('/create-order', protect, createOrder);
donationRouter.post('/verify-payment', protect, verifyPayment);
donationRouter.get('/my-donations', protect, getMyDonations);
donationRouter.get('/leaderboard', getLeaderboard);
donationRouter.get('/campaign/:campaignId', getCampaignDonations);
donationRouter.get('/admin/all', protect, authorize('admin'), getAllDonations);
donationRouter.get('/:id/receipt', protect, getDonationReceipt);

module.exports = donationRouter;
