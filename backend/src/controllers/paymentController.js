require('dotenv').config();
const { Request, User } = require('../models');
const paymentService = require('../services/paymentService');
const stripeService = require('../services/stripeService');
const queueService = require('../services/queueService');
const { ERROR_CODES } = require('../utils/constants');
const { createError, asyncHandler } = require('../middleware/errorHandler');
const logger = require('../utils/logger');
const emailService = require('../services/emailService');

class PaymentController {
  // Handle Telegram payment
  handleTelegramPayment = asyncHandler(async (req, res) => {
    const { request_id, payment_data } = req.validatedBody;
    const userId = req.user.id;

    // Find request
    const request = await Request.findOne({
      where: {
        id: request_id,
        user_id: userId,
      },
      include: [
        {
          model: User,
          as: 'user',
        },
      ],
    });

    if (!request) {
      throw createError(
        req.t('errors.request_not_found'),
        404,
        ERROR_CODES.NOT_FOUND_ERROR
      );
    }

    // Check if request is already paid
    if (request.payment_status === 'paid') {
      throw createError(
        req.t('errors.already_paid'),
        400,
        ERROR_CODES.VALIDATION_ERROR
      );
    }

    // Validate payment
    const validation = paymentService.validateTelegramPayment(payment_data);

    if (!validation.valid) {
      throw createError(
        req.t('errors.invalid_payment', { error: validation.error }),
        400,
        ERROR_CODES.PAYMENT_ERROR
      );
    }

    // Get payment info
    const paymentInfo = paymentService.getPaymentInfo(payment_data);

    // Update request
    await request.update({
      payment_status: 'paid',
      status: 'paid',
      payment_id: validation.telegramPaymentId,
      amount: paymentInfo.amount,
      currency: paymentInfo.currency,
    });

    logger.info('Telegram Stars payment processed successfully', {
      requestId: request_id,
      userId,
      amount: paymentInfo.amount,
      currency: paymentInfo.currency,
      language: req.language,
    });

    // Send notification about status update
    await queueService.addEmailJob('status_update', {
      user: request.user.toJSON(),
      request: request.getPublicData(),
      newStatus: 'paid',
      language: request.user.language || 'en',
    });

    try {
      if (request.user && request.user.email) {
        await emailService.sendPaymentConfirmation(
          request.user,
          request,
          paymentInfo.amount
        );
      }
    } catch (emailError) {
      logger.error('Failed to send payment confirmation email:', {
        requestId: request_id,
        error: emailError.message,
      });
      // Don't fail the payment if email fails
    }

    res.json({
      success: true,
      message: req.t('payments.success'),
      request: request.getPublicData(),
    });
  });

  // Get payment info for frontend
  getPaymentInfo = asyncHandler(async (req, res) => {
    const { request_id } = req.params;
    const userId = req.user.id;

    const request = await Request.findOne({
      where: {
        id: request_id,
        user_id: userId,
      },
    });

    if (!request) {
      throw createError(
        req.t('errors.request_not_found'),
        404,
        ERROR_CODES.NOT_FOUND_ERROR
      );
    }

    const priceStars = process.env.VIDEO_PRICE_STARS || 1000;
    const priceUsd = process.env.VIDEO_PRICE || 9.99;

    res.json({
      price_stars: priceStars,
      price_usd: priceUsd,
      currency: 'XTR',
      request_status: request.status,
      payment_status: request.payment_status,
      payment_provider: request.getPaymentProvider(),
      formatted_price: req.t('payments.price_stars', {
        stars: priceStars,
        usd: priceUsd,
      }),
    });
  });

  // Create Stripe Checkout Session
  createStripeCheckout = asyncHandler(async (req, res) => {
    const { request_id } = req.validatedBody;
    const userId = req.user.id;

    // Find request with user data
    const request = await Request.findOne({
      where: {
        id: request_id,
        user_id: userId,
      },
      include: [
        {
          model: User,
          as: 'user',
        },
      ],
    });

    if (!request) {
      throw createError(
        req.t('errors.request_not_found'),
        404,
        ERROR_CODES.NOT_FOUND_ERROR
      );
    }

    // Check if request is already paid
    if (request.payment_status === 'paid') {
      throw createError(
        req.t('errors.already_paid'),
        400,
        ERROR_CODES.VALIDATION_ERROR
      );
    }

    // Get price from environment variables
    const videoPrice = parseFloat(process.env.VIDEO_PRICE) || 9.99;
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3001';

    // Create Stripe Checkout Session
    const checkoutSession = await stripeService.createCheckoutSession({
      requestId: request_id,
      customerEmail: req.user.email,
      amount: videoPrice,
      currency: 'usd',
      successUrl: `${frontendUrl}/dashboard?payment=success&session_id={CHECKOUT_SESSION_ID}`,
      cancelUrl: `${frontendUrl}/dashboard?payment=cancelled`,
    });

    // Store Stripe session ID in dedicated field
    await request.update({
      stripe_session_id: checkoutSession.sessionId,
      payment_id: checkoutSession.sessionId, // Keep for backward compatibility
      amount: videoPrice,
      currency: 'USD',
    });

    logger.info('Stripe checkout session created', {
      requestId: request_id,
      sessionId: checkoutSession.sessionId,
      userId: userId,
      amount: videoPrice,
    });

    res.json({
      success: true,
      checkout_url: checkoutSession.url,
      session_id: checkoutSession.sessionId,
      expires_at: checkoutSession.expiresAt,
      message: req.t('payments.checkout_created'),
    });
  });

  // Handle Stripe Webhook
  handleStripeWebhook = asyncHandler(async (req, res) => {
    const signature = req.headers['stripe-signature'];
    const payload = req.body;

    try {
      // Verify webhook signature and construct event
      const event = await stripeService.handleWebhook(
        payload,
        signature,
        process.env.STRIPE_WEBHOOK_SECRET
      );
      // Handle specific event types
      switch (event.type) {
        case 'checkout.session.completed':
          await this.handleCheckoutSessionCompleted(event.data.object);
          break;

        case 'payment_intent.succeeded':
          await this.handlePaymentIntentSucceeded(event.data.object);
          break;

        case 'payment_intent.payment_failed':
          await this.handlePaymentIntentFailed(event.data.object);
          break;

        default:
          logger.info('Unhandled Stripe webhook event', { type: event.type });
      }

      res.json({ received: true });
    } catch (error) {
      logger.error('Stripe webhook error:', error);
      res.status(400).json({ error: error.message });
    }
  });

  // Handle completed checkout session
  async handleCheckoutSessionCompleted(session) {
    const { request_id } = session.metadata;
    const amount = session.amount_total / 100; // Convert cents to dollars

    // Find the request
    const request = await Request.findOne({
      where: {
        id: request_id,
        stripe_session_id: session.id, // Verify session ID matches
      },
      include: [
        {
          model: User,
          as: 'user',
        },
      ],
    });

    if (!request) {
      logger.error('Request not found for completed checkout session', {
        requestId: request_id,
        sessionId: session.id,
      });
      return;
    }

    // Store additional Stripe data
    await request.update({
      payment_status: 'paid',
      status: 'paid',
      amount: amount,
      currency: session.currency,
      stripe_payment_intent_id: session.payment_intent,
      stripe_customer_id: session.customer,
    });

    // Send email notification
    await queueService.addEmailJob('status_update', {
      user: request.user.toJSON(),
      request: request.getPublicData(),
      newStatus: 'paid',
      language: request.user.language || 'en',
    });

    try {
      if (request.user && request.user.email) {
        await emailService.sendPaymentConfirmation(
          request.user,
          request,
          amount
        );
      }
    } catch (emailError) {
      logger.error('Failed to send payment confirmation email:', {
        requestId: request.id,
        error: emailError.message,
      });
      // Don't fail the payment if email fails
    }

    logger.info('Payment completed via Stripe checkout', {
      requestId: request_id,
      sessionId: session.id,
      paymentIntentId: session.payment_intent,
      amount: amount,
      userId: request.user_id,
    });
  }

  // Handle successful payment intent
  async handlePaymentIntentSucceeded(paymentIntent) {
    logger.info('Payment intent succeeded', {
      paymentIntentId: paymentIntent.id,
      amount: paymentIntent.amount / 100,
    });

    // Optional: Update request if needed for direct Payment Intents
    const request = await Request.findOne({
      where: { stripe_payment_intent_id: paymentIntent.id },
    });

    if (request && request.payment_status !== 'paid') {
      await request.update({
        payment_status: 'paid',
        status: 'paid',
      });
    }
  }

  // Handle failed payment intent
  async handlePaymentIntentFailed(paymentIntent) {
    logger.warn('Payment intent failed', {
      paymentIntentId: paymentIntent.id,
      error: paymentIntent.last_payment_error,
    });

    // Optional: Update request status for failed payments
    const request = await Request.findOne({
      where: { stripe_payment_intent_id: paymentIntent.id },
    });

    if (request) {
      await request.update({
        payment_status: 'failed',
      });
    }
  }

  // Get Stripe checkout session status
  getCheckoutSessionStatus = asyncHandler(async (req, res) => {
    const { session_id } = req.params;

    try {
      const session = await stripeService.retrieveCheckoutSession(session_id);

      // Find associated request
      const request = await Request.findOne({
        where: { stripe_session_id: session_id },
      });

      res.json({
        session_id: session.id,
        status: session.status,
        payment_status: session.paymentStatus,
        amount: session.amountTotal,
        currency: session.currency,
        request_id: request?.id,
        request_status: request?.status,
      });
    } catch (error) {
      throw createError(
        'Failed to retrieve checkout session',
        400,
        ERROR_CODES.PAYMENT_ERROR
      );
    }
  });

  // Get payment methods available for user
  getAvailablePaymentMethods = asyncHandler(async (req, res) => {
    const priceStars = process.env.VIDEO_PRICE_STARS || 1000;
    const priceUsd = process.env.VIDEO_PRICE || 9.99;

    res.json({
      methods: [
        {
          provider: 'stripe',
          name: 'Credit Card',
          currency: 'USD',
          amount: priceUsd,
          available: true,
        },
        {
          provider: 'telegram',
          name: 'Telegram Stars',
          currency: 'XTR',
          amount: priceStars,
          available: true,
        },
      ],
    });
  });
}

module.exports = new PaymentController();
