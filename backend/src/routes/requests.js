const express = require('express');
const { authMiddleware } = require('../middleware/auth');
const { validateBody, validateUUIDParam } = require('../middleware/validation');
const { requestSchemas } = require('../middleware/validation');
const { getGeneralRateLimit } = require('../middleware/rateLimit');
const { apiKeyMiddleware } = require('../middleware/apiKey');
const {
  sanitizeRequestBody,
  validateScriptBody,
} = require('../middleware/sanitization');
const requestController = require('../controllers/requestController');

const requestRouter = express.Router();

// Public routes
requestRouter.get(
  '/queue/estimation',
  getGeneralRateLimit(),
  requestController.getQueueEstimation
);

requestRouter.get(
  '/templates',
  getGeneralRateLimit(),
  requestController.getTemplates
);

requestRouter.get(
  '/templates/:id',
  getGeneralRateLimit(),
  validateUUIDParam(),
  requestController.getTemplate
);

// User routes (protected) - allow both frontend and telegram bot
requestRouter.post(
  '/',
  getGeneralRateLimit(),
  authMiddleware,
  apiKeyMiddleware.frontendOrTelegram,
  validateScriptBody,
  sanitizeRequestBody,
  validateBody(requestSchemas.createRequest),
  requestController.createRequest
);

requestRouter.get(
  '/my',
  getGeneralRateLimit(),
  authMiddleware,
  apiKeyMiddleware.frontendOrTelegram,
  requestController.getUserRequests
);

requestRouter.post(
  '/upload-urls',
  getGeneralRateLimit(),
  authMiddleware,
  apiKeyMiddleware.frontendOrTelegram,
  requestController.generateUploadUrls
);

module.exports = requestRouter;
