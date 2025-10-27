// Mock Stripe before importing the service
const mockStripe = {
  checkout: {
    sessions: {
      create: jest.fn().mockResolvedValue({
        id: 'cs_test_mock',
        url: 'https://checkout.stripe.com/mock',
        expires_at: Math.floor(Date.now() / 1000) + 1800,
      }),
      retrieve: jest.fn().mockResolvedValue({
        id: 'cs_test_mock',
        status: 'complete',
        payment_status: 'paid',
        amount_total: 999,
        currency: 'usd',
        customer_email: 'test@example.com',
        metadata: { request_id: 'mock-request-id' },
        payment_intent: 'pi_mock',
      }),
    },
  },
  paymentIntents: {
    retrieve: jest.fn().mockResolvedValue({
      id: 'pi_mock',
      status: 'succeeded',
      amount: 999,
      currency: 'usd',
      metadata: {},
    }),
  },
  webhooks: {
    constructEvent: jest
      .fn()
      .mockImplementation((payload, signature, secret) => ({
        type: 'checkout.session.completed',
        data: {
          object: {
            id: 'cs_test_mock',
            metadata: { request_id: 'mock-request-id' },
            amount_total: 999,
            currency: 'usd',
            payment_intent: 'pi_mock',
            customer: 'cus_mock',
          },
        },
      })),
  },
};

jest.mock('stripe', () => {
  return jest.fn().mockImplementation(() => mockStripe);
});

const stripeService = require('../../../src/services/stripeService');

describe('Stripe Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('createCheckoutSession', () => {
    it('should create checkout session successfully', async () => {
      const options = {
        requestId: '123e4567-e89b-12d3-a456-426614174000',
        customerEmail: 'test@example.com',
        amount: 9.99,
        currency: 'usd',
        successUrl: 'http://localhost:3001/success',
        cancelUrl: 'http://localhost:3001/cancel',
      };

      const result = await stripeService.createCheckoutSession(options);

      expect(result.success).toBe(true);
      expect(result.sessionId).toBe('cs_test_mock');
      expect(result.url).toBe('https://checkout.stripe.com/mock');
      expect(result.expiresAt).toBeInstanceOf(Date);

      expect(mockStripe.checkout.sessions.create).toHaveBeenCalledWith(
        expect.objectContaining({
          payment_method_types: ['card'],
          mode: 'payment',
          customer_email: options.customerEmail,
          line_items: [
            {
              price_data: {
                currency: options.currency,
                product_data: {
                  name: 'AI Pet Video',
                  description: 'Custom AI-generated video from your pet photos',
                },
                unit_amount: 999, // 9.99 * 100
              },
              quantity: 1,
            },
          ],
          metadata: {
            request_id: options.requestId,
            type: 'video_creation',
          },
          success_url: options.successUrl,
          cancel_url: options.cancelUrl,
        })
      );
    });

    it('should handle checkout session creation error', async () => {
      mockStripe.checkout.sessions.create.mockRejectedValueOnce(
        new Error('Stripe API error')
      );

      const options = {
        requestId: '123e4567-e89b-12d3-a456-426614174000',
        customerEmail: 'test@example.com',
        amount: 9.99,
      };

      await expect(
        stripeService.createCheckoutSession(options)
      ).rejects.toThrow('Stripe checkout creation failed: Stripe API error');
    });
  });

  describe('retrieveCheckoutSession', () => {
    it('should retrieve checkout session successfully', async () => {
      const sessionId = 'cs_test_123';

      const result = await stripeService.retrieveCheckoutSession(sessionId);

      expect(result.id).toBe('cs_test_mock');
      expect(result.status).toBe('complete');
      expect(result.paymentStatus).toBe('paid');
      expect(result.amountTotal).toBe(9.99); // 999 cents = 9.99 dollars
      expect(result.currency).toBe('usd');
      expect(result.customerEmail).toBe('test@example.com');
      expect(result.metadata.request_id).toBe('mock-request-id');
      expect(result.paymentIntent).toBe('pi_mock');

      expect(mockStripe.checkout.sessions.retrieve).toHaveBeenCalledWith(
        sessionId,
        { expand: ['payment_intent'] }
      );
    });

    it('should handle session retrieval error', async () => {
      mockStripe.checkout.sessions.retrieve.mockRejectedValueOnce(
        new Error('Session not found')
      );

      await expect(
        stripeService.retrieveCheckoutSession('invalid_session')
      ).rejects.toThrow('Stripe session retrieval failed: Session not found');
    });
  });

  describe('handleWebhook', () => {
    it('should handle webhook event successfully', async () => {
      const payload = 'test-payload';
      const signature = 'test-signature';
      const webhookSecret = 'whsec_test';

      const event = await stripeService.handleWebhook(
        payload,
        signature,
        webhookSecret
      );

      expect(event.type).toBe('checkout.session.completed');
      expect(event.data.object.id).toBe('cs_test_mock');
      expect(mockStripe.webhooks.constructEvent).toHaveBeenCalledWith(
        payload,
        signature,
        webhookSecret
      );
    });

    it('should handle webhook signature verification failure', async () => {
      mockStripe.webhooks.constructEvent.mockImplementationOnce(() => {
        throw new Error('Invalid signature');
      });

      const payload = 'test-payload';
      const signature = 'invalid-signature';
      const webhookSecret = 'whsec_test';

      await expect(
        stripeService.handleWebhook(payload, signature, webhookSecret)
      ).rejects.toThrow(
        'Webhook signature verification failed: Invalid signature'
      );
    });
  });

  describe('retrievePaymentIntent', () => {
    it('should retrieve payment intent successfully', async () => {
      const paymentIntentId = 'pi_123';

      const result = await stripeService.retrievePaymentIntent(paymentIntentId);

      expect(result.id).toBe('pi_mock');
      expect(result.status).toBe('succeeded');
      expect(result.amount).toBe(9.99); // 999 cents = 9.99 dollars
      expect(result.currency).toBe('usd');

      expect(mockStripe.paymentIntents.retrieve).toHaveBeenCalledWith(
        paymentIntentId
      );
    });

    it('should handle payment intent retrieval error', async () => {
      mockStripe.paymentIntents.retrieve.mockRejectedValueOnce(
        new Error('Payment intent not found')
      );

      await expect(
        stripeService.retrievePaymentIntent('invalid_pi')
      ).rejects.toThrow(
        'Payment intent retrieval failed: Payment intent not found'
      );
    });
  });
});
