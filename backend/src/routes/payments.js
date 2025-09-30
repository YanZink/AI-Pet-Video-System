const express = require('express');
const { authMiddleware } = require('../middleware/auth');
const { validateBody } = require('../middleware/validation');
const { paymentSchemas } = require('../middleware/validation');
const { getGeneralRateLimit } = require('../middleware/rateLimit');
const paymentController = require('../controllers/paymentController');

const paymentRouter = express.Router();

// Telegram Stars payment (protected)
paymentRouter.post(
  '/telegram',
  getGeneralRateLimit(),
  authMiddleware,
  validateBody(paymentSchemas.telegramPayment),
  paymentController.handleTelegramPayment
);

// Get payment info (protected)
paymentRouter.get(
  '/info/:request_id',
  getGeneralRateLimit(),
  authMiddleware,
  paymentController.getPaymentInfo
);

module.exports = paymentRouter;
