const express = require('express');
const { authMiddleware } = require('../middleware/auth');
const { validateBody } = require('../middleware/validation');
const { paymentSchemas } = require('../middleware/validation');
const { getGeneralRateLimit } = require('../middleware/rateLimit');
const { apiKeyMiddleware } = require('../middleware/apiKey');
const { sanitizeRequestBody } = require('../middleware/sanitization');
const paymentController = require('../controllers/paymentController');

const paymentRouter = express.Router();

// Telegram Stars payment (protected)
paymentRouter.post(
  '/telegram',
  getGeneralRateLimit(),
  authMiddleware,
  apiKeyMiddleware.frontendWeb,
  sanitizeRequestBody,
  validateBody(paymentSchemas.telegramPayment),
  paymentController.handleTelegramPayment
);

// Get payment info (protected)
paymentRouter.get(
  '/info/:request_id',
  getGeneralRateLimit(),
  authMiddleware,
  apiKeyMiddleware.frontendWeb,
  paymentController.getPaymentInfo
);

// Create Stripe Checkout Session
paymentRouter.post(
  '/stripe/checkout',
  getGeneralRateLimit(),
  authMiddleware,
  apiKeyMiddleware.frontendWeb,
  sanitizeRequestBody,
  validateBody(paymentSchemas.createCheckout),
  paymentController.createStripeCheckout
);

// Get Stripe Checkout Session status
paymentRouter.get(
  '/stripe/checkout/:session_id',
  getGeneralRateLimit(),
  authMiddleware,
  apiKeyMiddleware.frontendWeb,
  paymentController.getCheckoutSessionStatus
);

// Stripe Webhook - MUST be before express.json() middleware
paymentRouter.post(
  '/stripe/webhook',
  // raw body for webhooks
  express.raw({ type: 'application/json' }),
  paymentController.handleStripeWebhook
);

// Get available payment methods
paymentRouter.get(
  '/methods',
  getGeneralRateLimit(),
  authMiddleware,
  apiKeyMiddleware.frontendWeb,
  paymentController.getAvailablePaymentMethods
);

module.exports = paymentRouter;
