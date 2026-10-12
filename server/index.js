const express = require('express');
const http = require('http');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const dotenv = require('dotenv');
const rateLimit = require('express-rate-limit');
const path = require('path');

dotenv.config();
const connectDB = require('./config/database');
const { initSocket } = require('./socket/socketManager');

// Route imports
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const campaignRoutes = require('./routes/campaigns');
const donationRoutes = require('./routes/donations');
const organizationRoutes = require('./routes/organizations');
const adminRoutes = require('./routes/admin');
const aiRoutes = require('./routes/ai');
const notificationRoutes = require('./routes/notifications');
const uploadRoutes = require('./routes/upload');
const blockchainRoutes = require('./routes/blockchain');
const proofRoutes = require('./routes/proofs');

const app = express();
const server = http.createServer(app);

// Connect to MongoDB
connectDB();

// Initialize Socket.io
initSocket(server);

// Enable trust proxy for Render and other reverse proxies
app.set('trust proxy', 1);

// Security Middleware
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
  crossOriginEmbedderPolicy: false
}));

const allowedOrigins = [
  'https://fund-vision-kappa.vercel.app',
  'https://fund-vision-git-main-vamjakrishs-projects.vercel.app',
  'http://localhost:5173',
  'http://localhost:3000',
  'http://localhost:5000',
  ...(process.env.CLIENT_URL ? process.env.CLIENT_URL.split(',').map(s => s.trim()) : [])
];

const corsOptions = {
  origin: (origin, callback) => {
    // Allow non-browser requests (mobile apps, Postman, curl, server-to-server)
    if (!origin) return callback(null, true);

    const isExplicit = allowedOrigins.some(o => o.toLowerCase() === origin.toLowerCase());
    const isVercel = /^https:\/\/[a-zA-Z0-9_.-]+\.vercel\.app$/.test(origin);
    const isLocal = /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin);

    if (isExplicit || isVercel || isLocal) {
      return callback(null, true);
    }
    // Allow by default to prevent cross-origin blocks for custom frontend deployments
    return callback(null, true);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin'],
  exposedHeaders: ['Set-Cookie']
};

app.use(cors(corsOptions));
app.options('*', cors(corsOptions));

// Rate Limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 500,
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => req.method === 'OPTIONS',
  message: { success: false, message: 'Too many requests, please try again later.' }
});
app.use('/api', limiter);

// Root Status Route
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'FundVision API is running',
    version: '2.0.0',
    endpoints: {
      health: '/api/health',
      campaigns: '/api/campaigns',
      blockchain: '/api/blockchain/status'
    }
  });
});

// Body Parsing
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Logging
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// Static files
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Health Check
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    message: 'FundVision API is running',
    version: '2.0.0',
    timestamp: new Date().toISOString()
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/campaigns', campaignRoutes);
app.use('/api/donations', donationRoutes);
app.use('/api/organizations', organizationRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/blockchain', blockchainRoutes);
app.use('/api', proofRoutes);

// 404 Handler
app.use('*', (req, res) => {
  res.status(404).json({ success: false, message: 'Route not found' });
});

// Global Error Handler
app.use((err, req, res, next) => {
  console.error('Error:', err.stack);
  const statusCode = err.statusCode || 500;
  res.status(statusCode).json({
    success: false,
    message: err.message || 'Internal Server Error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`\n🚀 FundVision Server running on port ${PORT}`);
  console.log(`📡 Environment: ${process.env.NODE_ENV}`);
  console.log(`🌐 API: http://localhost:${PORT}/api\n`);
});

module.exports = { app, server };
