const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const logger = require('../utils/logger');

class PaymentService {
  constructor() {
    this.stripeWebhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
    this.telegramPaymentToken = process.env.TELEGRAM_PAYMENT_TOKEN;
  }

  async createStripeCheckoutSession({
    amount,
    currency,
    requestId,
    userEmail,
    successUrl,
    cancelUrl,
  }) {
    try {
      const session = await stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        line_items: [
          {
            price_data: {
              currency: currency.toLowerCase(),
              product_data: {
                name: 'AI Pet Video Creation',
                description: `Video creation for request ${requestId}`,
              },
              unit_amount: Math.round(amount * 100),
            },
            quantity: 1,
          },
        ],
        mode: 'payment',
        customer_email: userEmail,
        success_url: successUrl,
        cancel_url: cancelUrl,
        metadata: {
          requestId,
          type: 'video_creation',
        },
      });

      logger.info('Stripe checkout session created', {
        sessionId: session.id,
        requestId,
        amount,
        currency,
      });

      return {
        success: true,
        sessionId: session.id,
        checkoutUrl: session.url,
        paymentId: session.payment_intent,
      };
    } catch (error) {
      logger.error('Failed to create Stripe checkout session:', error);
      throw new Error('Failed to create payment session');
    }
  }

  validateStripeWebhook(payload, signature) {
    try {
      const event = stripe.webhooks.constructEvent(
        payload,
        signature,
        this.stripeWebhookSecret
      );

      return {
        valid: true,
        event,
      };
    } catch (error) {
      logger.error('Stripe webhook validation failed:', error);
      return {
        valid: false,
        error: error.message,
      };
    }
  }

  async handleStripeWebhook(event) {
    switch (event.type) {
      case 'checkout.session.completed':
        return {
          handled: true,
          type: 'checkout_completed',
          requestId: event.data.object.metadata.requestId,
          paymentId: event.data.object.payment_intent,
        };

      case 'payment_intent.succeeded':
        return {
          handled: true,
          type: 'payment_succeeded',
          requestId: event.data.object.metadata.requestId,
          paymentId: event.data.object.id,
          amount: event.data.object.amount / 100,
          currency: event.data.object.currency.toUpperCase(),
        };

      default:
        return { handled: false };
    }
  }

  validateTelegramPayment(paymentData) {
    try {
      const payload = JSON.parse(paymentData.invoice_payload);

      const paymentAge = Date.now() - payload.timestamp;
      if (paymentAge > 3600000) {
        return {
          valid: false,
          error: 'Payment payload expired',
        };
      }

      return {
        valid: true,
        requestId: payload.requestId,
        type: payload.type,
      };
    } catch (error) {
      return {
        valid: false,
        error: 'Invalid payment payload',
      };
    }
  }
}

const paymentService = new PaymentService();

module.exports = paymentService;
