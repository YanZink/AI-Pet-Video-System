const { ERROR_CODES } = require('../utils/constants');
const logger = require('../utils/logger');

// API Key configuration
const API_KEYS = {
  TELEGRAM_BOT: process.env.TELEGRAM_BOT_API_KEY,
  FRONTEND_WEB: process.env.FRONTEND_WEB_API_KEY,
  ADMIN_PANEL: process.env.ADMIN_PANEL_API_KEY,
};

// IP Whitelist configuration
const IP_WHITELISTS = {
  TELEGRAM_BOT: process.env.TELEGRAM_BOT_IP_WHITELIST
    ? process.env.TELEGRAM_BOT_IP_WHITELIST.split(',').map((ip) => ip.trim())
    : [],
  ADMIN_PANEL: process.env.ADMIN_IP_WHITELIST
    ? process.env.ADMIN_IP_WHITELIST.split(',').map((ip) => ip.trim())
    : [],
};

// Extract client IP from request (handles proxies)
const getClientIP = (req) => {
  return (
    req.headers['x-forwarded-for']?.split(',')[0].trim() ||
    req.headers['x-real-ip'] ||
    req.connection.remoteAddress ||
    req.socket.remoteAddress ||
    'unknown'
  );
};

// Check if IP is in whitelist
const isIPWhitelisted = (clientIP, whitelist) => {
  if (!whitelist || whitelist.length === 0) {
    return true; // No whitelist = allow all
  }

  // Support for localhost variations
  if (
    clientIP === '::1' ||
    clientIP === '127.0.0.1' ||
    clientIP === '::ffff:127.0.0.1'
  ) {
    return whitelist.includes('localhost') || whitelist.includes('127.0.0.1');
  }

  return whitelist.includes(clientIP);
};

/**
 * Validate API Key for specific client type
 * @param {string} clientType - One of: TELEGRAM_BOT, FRONTEND_WEB, ADMIN_PANEL
 * @param {object} options - Additional options (ipWhitelist, optional)
 */
const validateApiKey = (clientType, options = {}) => {
  return (req, res, next) => {
    try {
      const expectedKey = API_KEYS[clientType];

      // Check if API key is configured
      if (!expectedKey) {
        logger.error(`API key not configured for client: ${clientType}`);
        return res.status(500).json({
          error: 'Server configuration error',
          code: ERROR_CODES.INTERNAL_SERVER_ERROR,
        });
      }

      // Extract API key from header
      const providedKey = req.headers['x-api-key'];

      if (!providedKey) {
        logger.warn('API request without API key', {
          clientType,
          ip: getClientIP(req),
          path: req.path,
        });

        return res.status(401).json({
          error: 'API key required',
          code: ERROR_CODES.AUTHENTICATION_ERROR,
          message: 'X-API-Key header is required',
        });
      }

      // Validate API key
      if (providedKey !== expectedKey) {
        logger.warn('Invalid API key attempt', {
          clientType,
          ip: getClientIP(req),
          path: req.path,
        });

        return res.status(403).json({
          error: 'Invalid API key',
          code: ERROR_CODES.AUTHORIZATION_ERROR,
          message: 'The provided API key is invalid',
        });
      }

      // Check IP whitelist if enabled
      if (options.ipWhitelist) {
        const clientIP = getClientIP(req);
        const whitelist = IP_WHITELISTS[clientType];

        if (!isIPWhitelisted(clientIP, whitelist)) {
          logger.warn('IP not whitelisted', {
            clientType,
            ip: clientIP,
            path: req.path,
          });

          return res.status(403).json({
            error: 'Access denied',
            code: ERROR_CODES.AUTHORIZATION_ERROR,
            message: 'Your IP address is not authorized',
          });
        }
      }

      // Log successful API key validation
      logger.info('API key validated', {
        clientType,
        ip: getClientIP(req),
        path: req.path,
      });

      // Attach client type to request for logging/tracking
      req.apiClient = clientType;

      next();
    } catch (error) {
      logger.error('API key validation error:', error);
      res.status(500).json({
        error: 'Authentication error',
        code: ERROR_CODES.INTERNAL_SERVER_ERROR,
      });
    }
  };
};

//Middleware to allow both frontend and telegram bot API keys
const frontendOrTelegram = (req, res, next) => {
  try {
    const providedKey = req.headers['x-api-key'];

    if (!providedKey) {
      logger.warn('API request without API key', {
        ip: getClientIP(req),
        path: req.path,
      });

      return res.status(401).json({
        error: 'API key required',
        code: ERROR_CODES.AUTHENTICATION_ERROR,
        message: 'X-API-Key header is required',
      });
    }

    // Check if key matches frontend web API key
    if (providedKey === API_KEYS.FRONTEND_WEB) {
      logger.info('API key validated', {
        clientType: 'FRONTEND_WEB',
        ip: getClientIP(req),
        path: req.path,
      });
      req.apiClient = 'FRONTEND_WEB';
      return next();
    }

    // Check if key matches telegram bot API key
    if (providedKey === API_KEYS.TELEGRAM_BOT) {
      logger.info('API key validated', {
        clientType: 'TELEGRAM_BOT',
        ip: getClientIP(req),
        path: req.path,
      });
      req.apiClient = 'TELEGRAM_BOT';
      return next();
    }

    // Invalid key
    logger.warn('Invalid API key attempt', {
      ip: getClientIP(req),
      path: req.path,
    });

    return res.status(403).json({
      error: 'Invalid API key',
      code: ERROR_CODES.AUTHORIZATION_ERROR,
      message: 'The provided API key is invalid',
    });
  } catch (error) {
    logger.error('API key validation error:', error);
    res.status(500).json({
      error: 'Authentication error',
      code: ERROR_CODES.INTERNAL_SERVER_ERROR,
    });
  }
};

// Pre-configured middleware for different client types
const apiKeyMiddleware = {
  // For Telegram bot requests
  telegramBot: validateApiKey('TELEGRAM_BOT', { ipWhitelist: true }),

  // For frontend web requests
  frontendWeb: validateApiKey('FRONTEND_WEB', { ipWhitelist: false }),

  // For admin panel requests (with IP whitelist check)
  adminPanel: validateApiKey('ADMIN_PANEL', { ipWhitelist: true }),

  // For routes accessible by both frontend and telegram bot
  frontendOrTelegram: frontendOrTelegram,
};

module.exports = {
  validateApiKey,
  apiKeyMiddleware,
  getClientIP,
};
