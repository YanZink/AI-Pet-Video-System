const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const { i18nMiddleware } = require('./middleware/i18n');
const { errorHandler } = require('./middleware/errorHandler');
const { initializeRateLimiters } = require('./middleware/rateLimit');
const { redisManager } = require('./config/redis');
const mainRouter = require('./routes');
const logger = require('./utils/logger');

class App {
  constructor() {
    this.app = express();
  }

  async initialize() {
    try {
      await this.setupMiddleware();
      this.setupRoutes();
      this.setupErrorHandling();
      return this.app;
    } catch (error) {
      logger.error('Failed to initialize application:', error);
      throw error;
    }
  }

  async setupMiddleware() {
    // Security middleware
    this.app.use(helmet());
    this.app.use(
      cors({
        origin: process.env.ALLOWED_ORIGINS
          ? process.env.ALLOWED_ORIGINS.split(',')
          : ['http://localhost:3001'],
        credentials: true,
      })
    );

    // Request parsing middleware
    this.app.use(express.json({ limit: '10mb' }));
    this.app.use(express.urlencoded({ extended: true, limit: '10mb' }));

    // Logging middleware
    this.app.use(
      morgan('combined', {
        stream: {
          write: (message) => logger.info(message.trim()),
        },
      })
    );

    // Custom request logging
    this.app.use((req, res, next) => {
      const start = Date.now();
      res.on('finish', () => {
        const duration = Date.now() - start;
        logger.logRequest(req, res, duration);
      });
      next();
    });

    // Initialize Redis connection
    logger.info('Connecting to Redis...');
    await redisManager.connect();

    // Initialize rate limiters (after Redis is connected)
    await initializeRateLimiters();
  }

  setupRoutes() {
    // Health check endpoint (no i18n needed)
    this.app.get('/health', (req, res) => {
      res.json({
        status: 'OK',
        timestamp: new Date().toISOString(),
        uptime: Math.floor(process.uptime()),
        version: '1.0.0',
        environment: process.env.NODE_ENV || 'development',
      });
    });

    // API routes with i18n support
    this.app.use('/api/v1', i18nMiddleware, mainRouter);

    // 404 handler
    this.app.use('*', (req, res) => {
      res.status(404).json({
        error: 'Route not found',
        code: 'NOT_FOUND_ERROR',
        path: req.originalUrl,
      });
    });
  }

  setupErrorHandling() {
    // Error handling middleware (should be last)
    this.app.use(errorHandler);
  }

  async close() {
    await redisManager.disconnect();
  }
}

module.exports = App;
