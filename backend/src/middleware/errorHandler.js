const { ERROR_CODES } = require('../utils/constants');
const logger = require('../utils/logger');

const errorHandler = (err, req, res, next) => {
  logger.error('Error handler:', err);

  let statusCode = err.statusCode || 500;
  let errorResponse = {
    error: 'Internal server error',
    code: ERROR_CODES.INTERNAL_SERVER_ERROR,
  };

  if (err.name === 'SequelizeValidationError') {
    statusCode = 400;
    errorResponse = {
      error: 'Validation error',
      code: ERROR_CODES.VALIDATION_ERROR,
      details: err.errors.map((e) => ({
        field: e.path,
        message: e.message,
      })),
    };
  } else if (err.name === 'SequelizeUniqueConstraintError') {
    statusCode = 409;
    errorResponse = {
      error: 'Duplicate entry',
      code: ERROR_CODES.DUPLICATE_ERROR,
      message: 'Resource already exists',
    };
  } else if (err.statusCode) {
    statusCode = err.statusCode;
    errorResponse = {
      error: err.message,
      code: err.code || ERROR_CODES.INTERNAL_SERVER_ERROR,
    };

    if (err.details) {
      errorResponse.details = err.details;
    }
  }

  res.status(statusCode).json(errorResponse);
};

const notFoundHandler = (req, res) => {
  res.status(404).json({
    error: 'Route not found',
    code: ERROR_CODES.NOT_FOUND_ERROR,
    message: `Route ${req.method} ${req.path} not found`,
  });
};

const asyncHandler = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

const createError = (
  message,
  statusCode = 500,
  code = ERROR_CODES.INTERNAL_SERVER_ERROR,
  details = null
) => {
  const error = new Error(message);
  error.statusCode = statusCode;
  error.code = code;
  if (details) {
    error.details = details;
  }
  return error;
};

const requestLogger = (req, res, next) => {
  const startTime = Date.now();

  res.on('finish', () => {
    const responseTime = Date.now() - startTime;
    logger.info('HTTP Request', {
      method: req.method,
      url: req.originalUrl,
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      statusCode: res.statusCode,
      responseTime: `${responseTime}ms`,
    });
  });

  next();
};

module.exports = {
  errorHandler,
  notFoundHandler,
  asyncHandler,
  createError,
  requestLogger,
};
