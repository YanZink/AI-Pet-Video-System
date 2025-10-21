const express = require('express');
const { authMiddleware } = require('../middleware/auth');
const { validateBody, userSchemas } = require('../middleware/validation');
const { apiKeyMiddleware } = require('../middleware/apiKey');
const { sanitizeRequestBody } = require('../middleware/sanitization');
const {
  getAuthRateLimit,
  getGeneralRateLimit,
} = require('../middleware/rateLimit');
const userController = require('../controllers/userController');

const userRouter = express.Router();

// Public routes with API key protection

// Regular user registration - protected by frontend API key
userRouter.post(
  '/',
  getAuthRateLimit(),
  apiKeyMiddleware.frontendWeb,
  sanitizeRequestBody,
  validateBody(userSchemas.createUser),
  userController.createUser
);

// Login - protected by frontend API key
userRouter.post(
  '/login',
  getAuthRateLimit(),
  apiKeyMiddleware.frontendWeb,
  sanitizeRequestBody,
  validateBody(userSchemas.loginUser),
  userController.loginUser
);

// Telegram bot registration/login - protected by telegram bot API key
userRouter.post(
  '/telegram',
  getAuthRateLimit(),
  apiKeyMiddleware.telegramBot,
  sanitizeRequestBody,
  validateBody(userSchemas.createUser),
  userController.createFromTelegram
);

// Public endpoint - no API key required
userRouter.get(
  '/languages',
  getGeneralRateLimit(),
  userController.getSupportedLanguages
);

// Email verification routes - protected by frontend API key
userRouter.post(
  '/verify-email',
  getAuthRateLimit(),
  apiKeyMiddleware.frontendWeb,
  sanitizeRequestBody,
  validateBody(userSchemas.verifyEmail),
  userController.verifyEmail
);

userRouter.post(
  '/resend-verification',
  getAuthRateLimit(),
  apiKeyMiddleware.frontendWeb,
  sanitizeRequestBody,
  validateBody(userSchemas.resendVerification),
  userController.resendVerification
);

// Protected routes (require JWT token)
userRouter.get(
  '/me',
  getGeneralRateLimit(),
  authMiddleware,
  userController.getCurrentUser
);

userRouter.patch(
  '/language',
  getGeneralRateLimit(),
  authMiddleware,
  validateBody(userSchemas.updateLanguage),
  userController.updateLanguage
);

module.exports = userRouter;
