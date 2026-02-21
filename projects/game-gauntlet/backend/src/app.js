/**
 * Express Application Configuration
 * Middleware, routes, and error handling
 */

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const swaggerUi = require('swagger-ui-express');
const swaggerSpec = require('./config/swagger');

// Import routes
const gameRoutes = require('./routes/games');
const partyRoutes = require('./routes/parties');
const settlementRoutes = require('./routes/settlement');
const leaderboardRoutes = require('./routes/leaderboard');
const userRoutes = require('./routes/users');
const eventRoutes = require('./routes/events');
const betRoutes = require('./routes/bets');
const walletRoutes = require('./routes/wallets');

const app = express();

// ===========================================
// SECURITY MIDDLEWARE
// ===========================================

// Helmet security headers
app.use(helmet({
  contentSecurityPolicy: false, // Disable for API
}));

// CORS configuration
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Wallet-Address'],
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutes
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
  message: {
    error: 'Too many requests',
    message: 'You have exceeded the rate limit. Please try again later.',
    retryAfter: '15 minutes',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

app.use('/api/', limiter);

// ===========================================
// PARSING MIDDLEWARE
// ===========================================

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ===========================================
// LOGGING
// ===========================================

if (process.env.NODE_ENV !== 'test') {
  app.use(morgan('combined'));
}

// ===========================================
// API DOCUMENTATION
// ===========================================

app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
  customCss: '.swagger-ui .topbar { display: none }',
  customSiteTitle: 'Game Gauntlet API Docs',
}));

// ===========================================
// HEALTH CHECK
// ===========================================

app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    service: 'game-gauntlet-api',
  });
});

// ===========================================
// API ROUTES
// ===========================================

// Version prefix
const API_PREFIX = '/api/v1';

app.use(`${API_PREFIX}/games`, gameRoutes);
app.use(`${API_PREFIX}/parties`, partyRoutes);
app.use(`${API_PREFIX}/settlement`, settlementRoutes);
app.use(`${API_PREFIX}/leaderboard`, leaderboardRoutes);
app.use(`${API_PREFIX}/users`, userRoutes);
app.use(`${API_PREFIX}/events`, eventRoutes);
app.use(`${API_PREFIX}/bets`, betRoutes);
app.use(`${API_PREFIX}/wallets`, walletRoutes);

// Legacy routes (no version prefix for backward compatibility)
app.use('/games', gameRoutes);
app.use('/parties', partyRoutes);
app.use('/leaderboard', leaderboardRoutes);
app.use('/events', eventRoutes);
app.use('/bets', betRoutes);
app.use('/wallets', walletRoutes);

// ===========================================
// ERROR HANDLING
// ===========================================

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    error: 'Not Found',
    message: `Route ${req.method} ${req.originalUrl} not found`,
    docs: '/api/docs',
  });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('❌ Error:', err);

  // Validation errors
  if (err.name === 'ValidationError' || err.isJoi) {
    return res.status(400).json({
      error: 'Validation Error',
      message: err.message,
      details: err.details || undefined,
    });
  }

  // Database errors
  if (err.code && err.code.startsWith('23')) {
    return res.status(409).json({
      error: 'Database Conflict',
      message: 'A resource with this identifier already exists',
    });
  }

  // Solana errors
  if (err.name === 'SolanaError') {
    return res.status(502).json({
      error: 'Blockchain Error',
      message: err.message,
      transaction: err.transactionHash || undefined,
    });
  }

  // Default error
  res.status(err.status || 500).json({
    error: err.name || 'Internal Server Error',
    message: process.env.NODE_ENV === 'production' 
      ? 'An unexpected error occurred' 
      : err.message,
  });
});

module.exports = app;
