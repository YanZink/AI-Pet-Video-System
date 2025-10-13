const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const logger = require('../utils/logger');

class StripeService {
  constructor() {
    this.stripe = stripe;
  }

  /**
   * Create Stripe Checkout Session
   * @param {Object} options
   * @param {string} options.requestId - Request ID
   * @param {string} options.customerEmail - Customer email
   * @param {number} options.amount - Amount in dollars
   * @param {string} options.currency - Currency code
   * @param {string} options.successUrl - Success redirect URL
   * @param {string} options.cancelUrl - Cancel redirect URL
   * @returns {Promise<Object>} Checkout session
   */
  async createCheckoutSession({
    requestId,
    customerEmail,
    amount,
    currency = 'usd',
    successUrl,
    cancelUrl,
  }) {
    try {
      // Convert dollars to cents (Stripe uses smallest currency unit)
      const amountInCents = Math.round(amount * 100);

      const session = await this.stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        mode: 'payment',
        customer_email: customerEmail,
        line_items: [
          {
            price_data: {
              currency: currency,
              product_data: {
                name: 'AI Pet Video',
                description: 'Custom AI-generated video from your pet photos',
              },
              unit_amount: amountInCents,
            },
            quantity: 1,
          },
        ],
        metadata: {
          request_id: requestId,
          type: 'video_creation',
        },
        success_url: successUrl,
        cancel_url: cancelUrl,
        expires_at: Math.floor(Date.now() / 1000) + 30 * 60, // 30 minutes
      });

      logger.info('Stripe checkout session created', {
        requestId,
        sessionId: session.id,
        amount,
        currency,
      });

      return {
        success: true,
        sessionId: session.id,
        url: session.url,
        expiresAt: new Date(session.expires_at * 1000),
      };
    } catch (error) {
      logger.error('Failed to create Stripe checkout session:', error);
      throw new Error(`Stripe checkout creation failed: ${error.message}`);
    }
  }

  /**
   * Retrieve checkout session
   * @param {string} sessionId - Stripe session ID
   * @returns {Promise<Object>} Session data
   */
  async retrieveCheckoutSession(sessionId) {
    try {
      const session = await this.stripe.checkout.sessions.retrieve(sessionId, {
        expand: ['payment_intent'],
      });

      return {
        id: session.id,
        status: session.status,
        paymentStatus: session.payment_status,
        amountTotal: session.amount_total / 100, // Convert back to dollars
        currency: session.currency,
        customerEmail: session.customer_email,
        metadata: session.metadata,
        paymentIntent: session.payment_intent,
      };
    } catch (error) {
      logger.error('Failed to retrieve Stripe checkout session:', error);
      throw new Error(`Stripe session retrieval failed: ${error.message}`);
    }
  }

  /**
   * Handle Stripe webhook event
   * @param {string} payload - Raw webhook payload
   * @param {string} signature - Stripe signature
   * @param {string} webhookSecret - Webhook secret
   * @returns {Promise<Object>} Webhook event
   */
  async handleWebhook(payload, signature, webhookSecret) {
    try {
      const event = this.stripe.webhooks.constructEvent(
        payload,
        signature,
        webhookSecret
      );

      logger.info('Stripe webhook received', {
        type: event.type,
        id: event.id,
      });

      return event;
    } catch (error) {
      logger.error('Stripe webhook signature verification failed:', error);
      throw new Error(
        `Webhook signature verification failed: ${error.message}`
      );
    }
  }

  /**
   * Get payment intent details
   * @param {string} paymentIntentId - Stripe payment intent ID
   * @returns {Promise<Object>} Payment intent data
   */
  async retrievePaymentIntent(paymentIntentId) {
    try {
      const paymentIntent = await this.stripe.paymentIntents.retrieve(
        paymentIntentId
      );

      return {
        id: paymentIntent.id,
        status: paymentIntent.status,
        amount: paymentIntent.amount / 100,
        currency: paymentIntent.currency,
        metadata: paymentIntent.metadata,
        customer: paymentIntent.customer,
      };
    } catch (error) {
      logger.error('Failed to retrieve payment intent:', error);
      throw new Error(`Payment intent retrieval failed: ${error.message}`);
    }
  }
}

// Create singleton instance
const stripeService = new StripeService();

module.exports = stripeService;
