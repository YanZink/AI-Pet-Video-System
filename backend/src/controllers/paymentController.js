const { Request, User } = require('../models');
const paymentService = require('../services/paymentService');
const queueService = require('../services/queueService');
const { ERROR_CODES } = require('../utils/constants');
const { createError, asyncHandler } = require('../middleware/errorHandler');
const logger = require('../utils/logger');

class PaymentController {
  createStripeCheckout = asyncHandler(async (req, res) => {
    const { request_id, success_url, cancel_url } = req.validatedBody;
    const userId = req.user.id;

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
      throw createError('Request not found', 404, ERROR_CODES.NOT_FOUND_ERROR);
    }

    if (request.payment_status === 'paid') {
      throw createError(
        'Request is already paid',
        400,
        ERROR_CODES.VALIDATION_ERROR
      );
    }

    const amount = parseFloat(process.env.VIDEO_PRICE || 9.99);
    const currency = 'USD';

    const checkoutData = await paymentService.createStripeCheckoutSession({
      amount,
      currency,
      requestId: request.id,
      userEmail: request.user.email,
      successUrl: success_url,
      cancelUrl: cancel_url,
    });

    await request.update({
      payment_id: checkoutData.sessionId,
      amount,
      currency,
    });

    res.json({
      message: 'Checkout session created',
      checkout_url: checkoutData.checkoutUrl,
      session_id: checkoutData.sessionId,
    });
  });

  handleStripeWebhook = asyncHandler(async (req, res) => {
    const signature = req.headers['stripe-signature'];
    const payload = req.body;

    const { valid, event, error } = paymentService.validateStripeWebhook(
      payload,
      signature
    );

    if (!valid) {
      throw createError(
        'Invalid webhook signature',
        400,
        ERROR_CODES.VALIDATION_ERROR
      );
    }

    const result = await paymentService.handleStripeWebhook(event);

    if (result.handled && result.requestId) {
      const request = await Request.findByPk(result.requestId, {
        include: [{ model: User, as: 'user' }],
      });

      if (request && result.type === 'payment_succeeded') {
        await request.update({
          payment_status: 'paid',
          status: 'paid',
        });

        await queueService.addEmailJob('status_update', {
          user: request.user.toJSON(),
          request: request.toJSON(),
          newStatus: 'paid',
        });
      }
    }

    res.json({ received: true });
  });

  handleTelegramPayment = asyncHandler(async (req, res) => {
    const { request_id, payment_data } = req.validatedBody;
    const userId = req.user.id;

    const request = await Request.findOne({
      where: {
        id: request_id,
        user_id: userId,
      },
    });

    if (!request) {
      throw createError('Request not found', 404, ERROR_CODES.NOT_FOUND_ERROR);
    }

    const validation = paymentService.validateTelegramPayment(payment_data);

    if (!validation.valid) {
      throw createError('Invalid payment data', 400, ERROR_CODES.PAYMENT_ERROR);
    }

    await request.update({
      payment_status: 'paid',
      status: 'paid',
      payment_id: payment_data.telegram_payment_charge_id,
      amount: payment_data.total_amount / 100,
      currency: 'XTR',
    });

    res.json({
      message: 'Payment processed successfully',
      request: request.getPublicData(),
    });
  });
}

module.exports = new PaymentController();
