const { ERROR_CODES } = require('../utils/constants');
const logger = require('../utils/logger');

const errorHandler = (err, req, res, next) => {
  logger.error('Error handler:', err);

  let statusCode = err.statusCode || 500;
  let errorResponse = {
    error: req.t ? req.t('errors.something_wrong') : 'Internal server error',
    code: ERROR_CODES.INTERNAL_SERVER_ERROR,
  };

  if (err.name === 'SequelizeValidationError') {
    statusCode = 400;
    errorResponse = {
      error: req.t ? req.t('errors.validation_error') : 'Validation error',
      code: ERROR_CODES.VALIDATION_ERROR,
      details: err.errors.map((e) => ({
        field: e.path,
        message: e.message,
      })),
    };
  } else if (err.name === 'SequelizeUniqueConstraintError') {
    statusCode = 409;
    errorResponse = {
      error: req.t ? req.t('errors.user_exists') : 'Duplicate entry',
      code: ERROR_CODES.DUPLICATE_ERROR,
      message: req.t ? req.t('errors.user_exists') : 'Resource already exists',
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
    error: req.t ? req.t('errors.not_found') : 'Route not found',
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

module.exports = {
  errorHandler,
  notFoundHandler,
  asyncHandler,
  createError,
};
