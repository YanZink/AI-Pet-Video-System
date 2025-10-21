const express = require('express');
const { authMiddleware } = require('../middleware/auth');
const { validateBody } = require('../middleware/validation');
const { userSchemas } = require('../middleware/validation');
const { apiKeyMiddleware } = require('../middleware/apiKey');
const {
  getAuthRateLimit,
  getGeneralRateLimit,
} = require('../middleware/rateLimit');
const userController = require('../controllers/userController');

const userRouter = express.Router();

// Public routes
userRouter.post(
  '/',
  getAuthRateLimit(),
  apiKeyMiddleware.frontendWeb,
  validateBody(userSchemas.createUser),
  userController.createUser
);

userRouter.post(
  '/login',
  getAuthRateLimit(),
  apiKeyMiddleware.frontendWeb,
  validateBody(userSchemas.loginUser),
  userController.loginUser
);

// Telegram bot registration/login - protected by telegram bot API key
userRouter.post(
  '/telegram',
  getAuthRateLimit(),
  apiKeyMiddleware.telegramBot,
  validateBody(userSchemas.createUser),
  userController.createFromTelegram
);

// Public endpoint
userRouter.get(
  '/languages',
  getGeneralRateLimit(),
  userController.getSupportedLanguages
);

userRouter.post(
  '/verify-email',
  getAuthRateLimit(),
  apiKeyMiddleware.frontendWeb,
  validateBody(userSchemas.verifyEmail),
  userController.verifyEmail
);

userRouter.post(
  '/resend-verification',
  getAuthRateLimit(),
  apiKeyMiddleware.frontendWeb,
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
