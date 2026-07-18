const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  recipient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  type: {
    type: String,
    enum: [
      'donation_received', 'campaign_approved', 'campaign_rejected',
      'campaign_update', 'milestone_reached', 'organization_verified',
      'new_donor', 'campaign_expiring', 'fraud_alert', 'system_message',
      'goal_reached', 'new_follower', 'campaign_featured'
    ],
    required: true
  },
  title: {
    type: String,
    required: true
  },
  message: {
    type: String,
    required: true
  },
  data: {
    campaignId: { type: mongoose.Schema.Types.ObjectId, ref: 'Campaign' },
    donationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Donation' },
    organizationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization' },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    amount: Number,
    extra: mongoose.Schema.Types.Mixed
  },
  isRead: {
    type: Boolean,
    default: false
  },
  readAt: Date,
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium'
  }
}, {
  timestamps: true
});

notificationSchema.index({ recipient: 1, isRead: 1, createdAt: -1 });

module.exports = mongoose.model('Notification', notificationSchema);
