const rateLimit = require('express-rate-limit');
const { RedisStore } = require('rate-limit-redis');
const { redisManager } = require('../config/redis');
const { ERROR_CODES } = require('../utils/constants');

let rateLimitersInitialized = false;
let generalRateLimit = null;
let authRateLimit = null;
let strictRateLimit = null;

const createRateLimiter = async (options = {}) => {
  try {
    const redisClient = await redisManager.getClient();

    const defaultOptions = {
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: 100, // limit each IP to 100 requests per windowMs
      message: {
        error: 'Too many requests',
        code: ERROR_CODES.VALIDATION_ERROR,
        message: 'Too many requests from this IP, please try again later',
      },
      standardHeaders: true,
      legacyHeaders: false,
      store: new RedisStore({
        sendCommand: (...args) => redisClient.sendCommand(args),
        prefix: 'rl:',
      }),
    };

    return rateLimit({
      ...defaultOptions,
      ...options,
    });
  } catch (error) {
    console.error(
      'Failed to create rate limiter with Redis, falling back to memory:',
      error.message
    );

    // Fallback to memory store if Redis fails
    return rateLimit({
      windowMs: 15 * 60 * 1000,
      max: 100,
      message: {
        error: 'Too many requests',
        code: ERROR_CODES.VALIDATION_ERROR,
        message: 'Too many requests from this IP, please try again later',
      },
      standardHeaders: true,
      legacyHeaders: false,
    });
  }
};

const initializeRateLimiters = async () => {
  if (rateLimitersInitialized) return;

  try {
    generalRateLimit = await createRateLimiter();

    authRateLimit = await createRateLimiter({
      max: 10,
      message: {
        error: 'Too many authentication attempts',
        code: ERROR_CODES.AUTHENTICATION_ERROR,
        message: 'Too many login attempts, please try again later',
      },
    });

    strictRateLimit = await createRateLimiter({
      windowMs: 60 * 1000,
      max: 5,
      message: {
        error: 'Rate limit exceeded',
        code: ERROR_CODES.VALIDATION_ERROR,
        message: 'Please slow down your requests',
      },
    });

    rateLimitersInitialized = true;
    console.log('✅ Rate limiters initialized successfully');
  } catch (error) {
    console.error('❌ Failed to initialize rate limiters:', error.message);
    // Even if rate limiting fails, we should not crash the app
    rateLimitersInitialized = true;
  }
};

const getGeneralRateLimit = () => {
  if (!rateLimitersInitialized) {
    return (req, res, next) => next();
  }
  return generalRateLimit;
};

const getAuthRateLimit = () => {
  if (!rateLimitersInitialized) {
    return (req, res, next) => next();
  }
  return authRateLimit;
};

const getStrictRateLimit = () => {
  if (!rateLimitersInitialized) {
    return (req, res, next) => next();
  }
  return strictRateLimit;
};

module.exports = {
  initializeRateLimiters,
  getGeneralRateLimit,
  getAuthRateLimit,
  getStrictRateLimit,
  createRateLimiter,
};
