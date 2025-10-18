const express = require('express');
const { authMiddleware } = require('../middleware/auth');
const { validateBody } = require('../middleware/validation');
const { userSchemas } = require('../middleware/validation');
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
  validateBody(userSchemas.createUser),
  userController.createUser
);

userRouter.post(
  '/login',
  getAuthRateLimit(),
  validateBody(userSchemas.loginUser),
  userController.loginUser
);

userRouter.post(
  '/telegram',
  getAuthRateLimit(),
  validateBody(userSchemas.createUser),
  userController.createFromTelegram
);

userRouter.get(
  '/languages',
  getGeneralRateLimit(),
  userController.getSupportedLanguages
);

// Email verification routes
userRouter.post(
  '/verify-email',
  getAuthRateLimit(),
  validateBody(userSchemas.verifyEmail),
  userController.verifyEmail
);

userRouter.post(
  '/resend-verification',
  getAuthRateLimit(),
  validateBody(userSchemas.resendVerification),
  userController.resendVerification
);

// Protected routes
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
