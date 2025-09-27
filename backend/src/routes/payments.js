const express = require('express');
const { authMiddleware } = require('../middleware/auth');
const { validateBody } = require('../middleware/validation');
const { paymentSchemas } = require('../middleware/validation');
const { getGeneralRateLimit } = require('../middleware/rateLimit');
const paymentController = require('../controllers/paymentController');

const paymentRouter = express.Router();

// Stripe checkout (protected)
paymentRouter.post(
  '/stripe/checkout',
  getGeneralRateLimit(),
  authMiddleware,
  validateBody(paymentSchemas.createCheckout),
  paymentController.createStripeCheckout
);

// Stripe webhook (no auth, protected by signature)
paymentRouter.post(
  '/stripe/webhook',
  express.raw({ type: 'application/json' }),
  paymentController.handleStripeWebhook
);

// Telegram payment (protected)
paymentRouter.post(
  '/telegram',
  getGeneralRateLimit(),
  authMiddleware,
  validateBody(paymentSchemas.telegramPayment),
  paymentController.handleTelegramPayment
);

module.exports = paymentRouter;
