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

// User routes (protected)
requestRouter.post(
  '/',
  getGeneralRateLimit(),
  authMiddleware,
  apiKeyMiddleware.frontendWeb,
  validateScriptBody, // VALIDATION FIRST - block dangerous content
  sanitizeRequestBody, // SANITIZATION AFTER - clean safe content
  validateBody(requestSchemas.createRequest),
  requestController.createRequest
);

requestRouter.get(
  '/my',
  getGeneralRateLimit(),
  authMiddleware,
  apiKeyMiddleware.frontendWeb,
  requestController.getUserRequests
);

requestRouter.post(
  '/upload-urls',
  getGeneralRateLimit(),
  authMiddleware,
  apiKeyMiddleware.frontendWeb,
  requestController.generateUploadUrls
);

module.exports = requestRouter;
