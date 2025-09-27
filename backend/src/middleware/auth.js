const jwt = require('jsonwebtoken');
const { User } = require('../models');
const { ERROR_CODES } = require('../utils/constants');
const logger = require('../utils/logger');

const extractTokenFromHeader = (req) => {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return null;
  }

  const parts = authHeader.split(' ');
  if (parts.length !== 2 || parts[0] !== 'Bearer') {
    return null;
  }

  return parts[1];
};

const authMiddleware = async (req, res, next) => {
  try {
    const token = extractTokenFromHeader(req);

    if (!token) {
      return res.status(401).json({
        error: 'Authentication required',
        code: ERROR_CODES.AUTHENTICATION_ERROR,
        message: 'Access token is missing',
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const user = await User.findByPk(decoded.userId);
    if (!user || !user.is_active) {
      return res.status(401).json({
        error: 'Invalid token',
        code: ERROR_CODES.AUTHENTICATION_ERROR,
        message: 'User not found or inactive',
      });
    }

    req.user = user;
    req.tokenData = decoded;

    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        error: 'Invalid token',
        code: ERROR_CODES.AUTHENTICATION_ERROR,
        message: 'Token is malformed',
      });
    }

    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        error: 'Token expired',
        code: ERROR_CODES.AUTHENTICATION_ERROR,
        message: 'Token has expired',
      });
    }

    logger.error('Authentication middleware error:', error);
    res.status(500).json({
      error: 'Authentication error',
      code: ERROR_CODES.INTERNAL_SERVER_ERROR,
    });
  }
};

const adminMiddleware = (req, res, next) => {
  if (!req.user.isAdmin()) {
    return res.status(403).json({
      error: 'Admin access required',
      code: ERROR_CODES.AUTHORIZATION_ERROR,
    });
  }
  next();
};

const generateToken = (user) => {
  const payload = {
    userId: user.id,
    email: user.email,
    telegramId: user.telegram_id,
    role: user.role,
  };

  return jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });
};

module.exports = {
  authMiddleware,
  adminMiddleware,
  generateToken,
};
