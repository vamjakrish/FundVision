const Notification = require('../models/Notification');
const { getIO } = require('../socket/socketManager');

/**
 * Create a persistent notification and push it in real-time over socket.io.
 * Use this everywhere instead of calling Notification.create() directly so
 * every notification is instantly delivered to the bell icon / center.
 */
const notify = async ({ recipient, type, title, message, data = {}, priority = 'medium' }) => {
  const notification = await Notification.create({ recipient, type, title, message, data, priority });

  const io = getIO();
  if (io) {
    io.to(`user-${recipient}`).emit('new_notification', notification);
  }

  return notification;
};

module.exports = notify;
