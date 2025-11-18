require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const { createServer } = require('http');
const { Server } = require('socket.io');
const passport = require('passport');
const rateLimit = require('express-rate-limit');

// Import configurations
const { connectDB } = require('./config/database');
const { configurePassport } = require('./config/passport');
const logger = require('./config/logger');

// Import routes
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const taskRoutes = require('./routes/tasks');
const elderlyRoutes = require('./routes/elderly');
const forumRoutes = require('./routes/forum');
const donationRoutes = require('./routes/donations');
const jobRoutes = require('./routes/jobs');
const businessRoutes = require('./routes/businesses');
const creditRoutes = require('./routes/credits');
const notificationRoutes = require('./routes/notifications');
const calendarRoutes = require('./routes/calendar');
const ratingRoutes = require('./routes/ratings');
const feedbackRoutes = require('./routes/feedback');
const eventRoutes = require('./routes/events');
const messageRoutes = require('./routes/messages');
const verificationRoutes = require('./routes/verification');
const adminRoutes = require('./routes/admin');

// Import middleware
const errorHandler = require('./middleware/errorHandler');
const { authenticateToken } = require('./middleware/auth');

// Initialize app
const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    methods: ['GET', 'POST']
  }
});

// Connect to database
connectDB();

// Configure passport
configurePassport(passport);

// Middleware
app.use(helmet());
app.use(cors({
  origin: [
    process.env.FRONTEND_URL || 'http://localhost:3000',
    'http://localhost:19006' // Expo web
  ],
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(passport.initialize());

// Rate limiting
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000,
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100
});
app.use('/api/', limiter);

// Make io accessible to routes
app.set('io', io);

// Routes
app.get('/', (req, res) => {
  res.json({
    message: 'Community Services Platform API',
    version: '1.0.0',
    status: 'running'
  });
});

app.use('/api/auth', authRoutes);
app.use('/api/users', authenticateToken, userRoutes);
app.use('/api/tasks', authenticateToken, taskRoutes);
app.use('/api/elderly', authenticateToken, elderlyRoutes);
app.use('/api/forum', authenticateToken, forumRoutes);
app.use('/api/donations', authenticateToken, donationRoutes);
app.use('/api/jobs', authenticateToken, jobRoutes);
app.use('/api/businesses', businessRoutes);
app.use('/api/credits', authenticateToken, creditRoutes);
app.use('/api/notifications', authenticateToken, notificationRoutes);
app.use('/api/calendar', authenticateToken, calendarRoutes);
app.use('/api/ratings', authenticateToken, ratingRoutes);
app.use('/api/feedback', feedbackRoutes);
app.use('/api/events', authenticateToken, eventRoutes);
app.use('/api/messages', authenticateToken, messageRoutes);
app.use('/api/verification', authenticateToken, verificationRoutes);
app.use('/api/admin', authenticateToken, adminRoutes);

// Error handling
app.use(errorHandler);

// Socket.io for real-time notifications
io.on('connection', (socket) => {
  logger.info(`Client connected: ${socket.id}`);

  socket.on('authenticate', (token) => {
    // Authenticate socket connection
    // This will be implemented in the auth middleware
  });

  socket.on('disconnect', () => {
    logger.info(`Client disconnected: ${socket.id}`);
  });
});

// Start server
const PORT = process.env.PORT || 5000;
httpServer.listen(PORT, () => {
  logger.info(`Server running on port ${PORT}`);
  logger.info(`Environment: ${process.env.NODE_ENV}`);
});

module.exports = { app, io };
