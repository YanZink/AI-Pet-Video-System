const express = require('express');
const { getGeneralRateLimit } = require('../middleware/rateLimit');

const userRouter = require('./users');
const requestRouter = require('./requests');
const paymentRouter = require('./payments');
const adminRouter = require('./admin');

const mainRouter = express.Router();

// Main API info
mainRouter.get('/', getGeneralRateLimit(), (req, res) => {
  res.json({
    name: 'AI Pet Video System API',
    version: '1.0.0',
    stage: 'Stage 1 - Backend Infrastructure',
    environment: process.env.NODE_ENV || 'development',
    endpoints: {
      users: '/api/v1/users',
      requests: '/api/v1/requests',
      payments: '/api/v1/payments',
      admin: '/api/v1/admin',
      health: '/api/v1/health',
    },
  });
});

// Health check
mainRouter.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: Math.floor(process.uptime()),
    version: '1.0.0',
    environment: process.env.NODE_ENV || 'development',
  });
});

// Mount sub-routes
mainRouter.use('/users', userRouter);
mainRouter.use('/requests', requestRouter);
mainRouter.use('/payments', paymentRouter);
mainRouter.use('/admin', adminRouter);

module.exports = mainRouter;
