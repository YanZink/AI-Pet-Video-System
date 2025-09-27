const rateLimit = require('express-rate-limit');
const { RedisStore } = require('rate-limit-redis');
const { redisClient } = require('../config/redis');
const { ERROR_CODES } = require('../utils/constants');

let rateLimitersInitialized = false;
let generalRateLimit = null;
let authRateLimit = null;
let strictRateLimit = null;

const createRateLimiter = (options = {}) => {
  const defaultOptions = {
    windowMs: 15 * 60 * 1000,
    max: 100,
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
};

const initializeRateLimiters = () => {
  if (rateLimitersInitialized) return;

  generalRateLimit = createRateLimiter();

  authRateLimit = createRateLimiter({
    max: 10,
    message: {
      error: 'Too many authentication attempts',
      code: ERROR_CODES.AUTHENTICATION_ERROR,
      message: 'Too many login attempts, please try again later',
    },
  });

  strictRateLimit = createRateLimiter({
    windowMs: 60 * 1000,
    max: 5,
    message: {
      error: 'Rate limit exceeded',
      code: ERROR_CODES.VALIDATION_ERROR,
      message: 'Please slow down your requests',
    },
  });

  rateLimitersInitialized = true;
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
