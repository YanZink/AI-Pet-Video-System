const request = require('supertest');
const { Request, User } = require('../../../src/models');
const TestHelpers = require('../../helpers/testHelpers');
const TestFactories = require('../../helpers/factories');

// Mock external services
jest.mock('../../../src/services/stripeService', () => ({
  createCheckoutSession: jest.fn().mockResolvedValue({
    success: true,
    sessionId: 'cs_test_mock',
    url: 'https://checkout.stripe.com/mock',
    expiresAt: new Date(),
  }),
  retrieveCheckoutSession: jest.fn().mockResolvedValue({
    id: 'cs_test_mock',
    status: 'complete',
    paymentStatus: 'paid',
    amountTotal: 9.99,
    currency: 'usd',
  }),
  handleWebhook: jest.fn().mockResolvedValue({
    type: 'checkout.session.completed',
    data: {
      object: {
        id: 'cs_test_mock',
        metadata: { request_id: 'mock-request-id' },
        amount_total: 999,
        currency: 'usd',
        payment_intent: 'pi_mock',
      },
    },
  }),
}));
jest.mock('../../../src/middleware/apiKey', () => ({
  apiKeyMiddleware: {
    telegramBot: (req, res, next) => next(),
    frontendWeb: (req, res, next) => next(),
    adminPanel: (req, res, next) => next(),
    frontendOrTelegram: (req, res, next) => next(),
  },
}));
const App = require('../../../src/app');
let app;

describe('Payments API', () => {
  let testUser;
  let authToken;
  let testRequest;

  beforeAll(async () => {
    app = new App();
    await app.initialize();

    await require('../../../src/models').sequelize.sync({ force: true });
  });

  beforeEach(async () => {
    testUser = await TestHelpers.createTestUser({
      email: 'payments@example.com',
    });

    testRequest = await TestHelpers.createTestRequest(testUser.id, {
      status: 'created',
      payment_status: 'pending',
    });

    authToken = TestHelpers.generateAuthToken(testUser);
  });

  afterEach(async () => {
    await TestHelpers.cleanupTestData();
  });

  afterAll(async () => {
    await app.close();
    await require('../../../src/models').sequelize.close();
  });

  describe('POST /api/v1/payments/telegram', () => {
    it('should process Telegram payment successfully', async () => {
      const paymentData = {
        request_id: testRequest.id,
        payment_data: {
          invoice_payload: JSON.stringify({
            requestId: testRequest.id,
            type: 'video_creation',
            timestamp: Date.now(),
          }),
          total_amount: 1000,
          currency: 'XTR',
          telegram_payment_charge_id: 'telegram_charge_123',
        },
      };

      const response = await request(app.app)
        .post('/api/v1/payments/telegram')
        .set('Authorization', `Bearer ${authToken}`)
        .set('X-API-Key', process.env.FRONTEND_WEB_API_KEY)
        .send(paymentData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBeDefined();

      // Verify request was updated
      const updatedRequest = await Request.findByPk(testRequest.id);
      expect(updatedRequest.payment_status).toBe('paid');
      expect(updatedRequest.status).toBe('paid');
      expect(updatedRequest.payment_id).toBe('telegram_charge_123');
      expect(updatedRequest.amount).toBe(10);
    });

    it('should reject payment for non-existent request', async () => {
      const paymentData = {
        request_id: '123e4567-e89b-12d3-a456-426614174999',
        payment_data: {
          invoice_payload: JSON.stringify({
            requestId: '123e4567-e89b-12d3-a456-426614174999',
            type: 'video_creation',
            timestamp: Date.now(),
          }),
          total_amount: 1000,
          currency: 'XTR',
        },
      };

      const response = await request(app.app)
        .post('/api/v1/payments/telegram')
        .set('Authorization', `Bearer ${authToken}`)
        .set('X-API-Key', process.env.FRONTEND_WEB_API_KEY)
        .send(paymentData)
        .expect(404);

      expect(response.body.code).toBe('NOT_FOUND_ERROR');
    });

    it('should reject payment for already paid request', async () => {
      const paidRequest = await TestHelpers.createTestRequest(testUser.id, {
        payment_status: 'paid',
        status: 'paid',
      });

      const paymentData = {
        request_id: paidRequest.id,
        payment_data: {
          invoice_payload: JSON.stringify({
            requestId: paidRequest.id,
            type: 'video_creation',
            timestamp: Date.now(),
          }),
          total_amount: 1000,
          currency: 'XTR',
        },
      };

      const response = await request(app.app)
        .post('/api/v1/payments/telegram')
        .set('Authorization', `Bearer ${authToken}`)
        .set('X-API-Key', process.env.FRONTEND_WEB_API_KEY)
        .send(paymentData)
        .expect(400);

      expect(response.body.code).toBe('VALIDATION_ERROR');
    });

    it('should reject invalid payment data', async () => {
      const paymentData = {
        request_id: testRequest.id,
        payment_data: {
          invoice_payload: 'invalid-json',
          total_amount: 1000,
          currency: 'XTR',
        },
      };

      const response = await request(app.app)
        .post('/api/v1/payments/telegram')
        .set('Authorization', `Bearer ${authToken}`)
        .set('X-API-Key', process.env.FRONTEND_WEB_API_KEY)
        .send(paymentData)
        .expect(400);

      expect(response.body.code).toBe('PAYMENT_ERROR');
    });
  });

  describe('POST /api/v1/payments/stripe/checkout', () => {
    it('should create Stripe checkout session', async () => {
      const checkoutData = {
        request_id: testRequest.id,
      };

      const response = await request(app.app)
        .post('/api/v1/payments/stripe/checkout')
        .set('Authorization', `Bearer ${authToken}`)
        .set('X-API-Key', process.env.FRONTEND_WEB_API_KEY)
        .send(checkoutData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.checkout_url).toBe(
        'https://checkout.stripe.com/mock'
      );
      expect(response.body.session_id).toBe('cs_test_mock');
      expect(response.body.expires_at).toBeDefined();
      expect(response.body.message).toBeDefined();

      // Verify request was updated with session ID
      const updatedRequest = await Request.findByPk(testRequest.id);
      expect(updatedRequest.stripe_session_id).toBe('cs_test_mock');
      expect(updatedRequest.amount).toBe(9.99);
    });

    it('should reject checkout for non-existent request', async () => {
      const checkoutData = {
        request_id: '123e4567-e89b-12d3-a456-426614174999',
      };

      const response = await request(app.app)
        .post('/api/v1/payments/stripe/checkout')
        .set('Authorization', `Bearer ${authToken}`)
        .set('X-API-Key', process.env.FRONTEND_WEB_API_KEY)
        .send(checkoutData)
        .expect(404);

      expect(response.body.code).toBe('NOT_FOUND_ERROR');
    });
  });

  describe('GET /api/v1/payments/stripe/checkout/:session_id', () => {
    it('should retrieve checkout session status', async () => {
      const sessionId = 'cs_test_123';

      const response = await request(app.app)
        .get(`/api/v1/payments/stripe/checkout/${sessionId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .set('X-API-Key', process.env.FRONTEND_WEB_API_KEY)
        .expect(200);

      expect(response.body.session_id).toBe('cs_test_mock');
      expect(response.body.status).toBe('complete');
      expect(response.body.payment_status).toBe('paid');
      expect(response.body.amount).toBe(9.99);
    });
  });

  describe('GET /api/v1/payments/info/:request_id', () => {
    it('should return payment information', async () => {
      const response = await request(app.app)
        .get(`/api/v1/payments/info/${testRequest.id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .set('X-API-Key', process.env.FRONTEND_WEB_API_KEY)
        .expect(200);

      expect(response.body.price_stars).toBe('1000');
      expect(response.body.price_usd).toBe('9.99');
      expect(response.body.currency).toBe('XTR');
      expect(response.body.request_status).toBe('created');
      expect(response.body.payment_status).toBe('pending');
      expect(response.body.payment_provider).toBe('unknown');
      expect(response.body.formatted_price).toBeDefined();
    });
  });

  describe('GET /api/v1/payments/methods', () => {
    it('should return available payment methods', async () => {
      const response = await request(app.app)
        .get('/api/v1/payments/methods')
        .set('Authorization', `Bearer ${authToken}`)
        .set('X-API-Key', process.env.FRONTEND_WEB_API_KEY)
        .expect(200);

      expect(response.body.methods).toHaveLength(2);

      expect(response.body.methods).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            provider: 'stripe',
            name: 'Credit Card',
            currency: 'USD',
            available: true,
          }),
          expect.objectContaining({
            provider: 'telegram',
            name: 'Telegram Stars',
            currency: 'XTR',
            available: true,
          }),
        ])
      );

      expect(response.body.methods[0].amount).toBeDefined();
      expect(response.body.methods[1].amount).toBeDefined();

      expect(response.body.methods[0].amount).toBe('9.99');
      expect(response.body.methods[1].amount).toBe('1000');
    });
  });

  describe('POST /api/v1/payments/stripe/webhook', () => {
    it('should handle Stripe webhook', async () => {
      const webhookPayload = {
        type: 'checkout.session.completed',
        data: {
          object: {
            id: 'cs_test_webhook',
            metadata: { request_id: testRequest.id },
          },
        },
      };

      const response = await request(app.app)
        .post('/api/v1/payments/stripe/webhook')
        .send(JSON.stringify(webhookPayload))
        .set('Stripe-Signature', 'test-signature')
        .set('Content-Type', 'application/json')
        .expect(200);

      expect(response.body.received).toBe(true);
    });
  });
});
