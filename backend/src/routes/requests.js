const express = require('express');
const { authMiddleware } = require('../middleware/auth');
const { validateBody, validateUUIDParam } = require('../middleware/validation');
const { requestSchemas } = require('../middleware/validation');
const { getGeneralRateLimit } = require('../middleware/rateLimit');
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
  validateBody(requestSchemas.createRequest),
  requestController.createRequest
);

requestRouter.get(
  '/my',
  getGeneralRateLimit(),
  authMiddleware,
  requestController.getUserRequests
);

requestRouter.post(
  '/upload-urls',
  getGeneralRateLimit(),
  authMiddleware,
  requestController.generateUploadUrls
);

module.exports = requestRouter;
