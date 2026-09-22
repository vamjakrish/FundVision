const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

let io;

const initSocket = (server) => {
  io = new Server(server, {
    cors: {
      origin: [process.env.CLIENT_URL || 'http://localhost:5173'],
      methods: ['GET', 'POST'],
      credentials: true
    }
  });

  // Auth middleware for socket
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth?.token || socket.handshake.headers?.authorization?.split(' ')[1];
      if (token) {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        socket.user = await User.findById(decoded.id).select('-password');
      }
      next();
    } catch {
      next(); // Allow unauthenticated connections
    }
  });

  io.on('connection', (socket) => {
    console.log(`🔌 Socket connected: ${socket.id}`);

    // Join global live-feed room (site-wide live donation feed)
    socket.join('live-feed');

    // Join user-specific room
    if (socket.user) {
      socket.join(`user-${socket.user._id}`);
      if (socket.user.role === 'admin') socket.join('admin-room');
      console.log(`👤 User ${socket.user.name} joined their room`);
    }

    // Join campaign room for live updates
    socket.on('join_campaign', (campaignId) => {
      socket.join(`campaign-${campaignId}`);
    });

    socket.on('leave_campaign', (campaignId) => {
      socket.leave(`campaign-${campaignId}`);
    });

    // Typing indicator for chat
    socket.on('typing', ({ campaignId }) => {
      socket.to(`campaign-${campaignId}`).emit('user_typing', { userId: socket.user?._id });
    });

    // Live donation ping
    socket.on('ping_donation', (data) => {
      io.to(`campaign-${data.campaignId}`).emit('donation_ping', data);
    });

    socket.on('disconnect', () => {
      console.log(`🔌 Socket disconnected: ${socket.id}`);
    });
  });

  return io;
};

const getIO = () => io;

module.exports = { initSocket, getIO };
