const { Request, User } = require('../models');
const paymentService = require('../services/paymentService');
const queueService = require('../services/queueService');
const { ERROR_CODES } = require('../utils/constants');
const { createError, asyncHandler } = require('../middleware/errorHandler');
const logger = require('../utils/logger');

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
      formatted_price: req.t('payments.price_stars', {
        stars: priceStars,
        usd: priceUsd,
      }),
    });
  });

  /**
   * Create payment intent for Stripe (for future web integration)
   */
  createPaymentIntent = asyncHandler(async (req, res) => {
    const { request_id } = req.validatedBody;
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

    if (request.payment_status === 'paid') {
      throw createError(
        req.t('errors.already_paid'),
        400,
        ERROR_CODES.VALIDATION_ERROR
      );
    }

    // Mock payment intent
    const mockPaymentIntent = {
      id: `pi_mock_${Date.now()}`,
      client_secret: `cs_mock_${Date.now()}`,
      amount: 999,
      currency: 'usd',
      status: 'requires_payment_method',
    };

    res.json({
      payment_intent: mockPaymentIntent,
      message: req.t('payments.intent_created'),
    });
  });

  /**
   * Mock Stripe Checkout session creation
   */
  createStripeCheckout = asyncHandler(async (req, res) => {
    const { request_id, success_url, cancel_url } = req.validatedBody;
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

    if (request.payment_status === 'paid') {
      throw createError(
        req.t('errors.already_paid'),
        400,
        ERROR_CODES.VALIDATION_ERROR
      );
    }

    const checkoutUrl = success_url;

    res.json({
      checkout_url: checkoutUrl,
      message: req.t('payments.checkout_created'),
    });
  });
}

module.exports = new PaymentController();
