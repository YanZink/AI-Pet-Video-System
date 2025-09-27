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

// Protected routes
userRouter.get(
  '/me',
  getGeneralRateLimit(),
  authMiddleware,
  userController.getCurrentUser
);

module.exports = userRouter;
