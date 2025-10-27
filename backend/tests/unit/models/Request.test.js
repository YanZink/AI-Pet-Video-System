const { Request, User } = require('../../../src/models');
const {
  REQUEST_STATUS,
  PAYMENT_STATUS,
} = require('../../../src/utils/constants');
const TestHelpers = require('../../helpers/testHelpers');

describe('Request Model', () => {
  let testUser;

  beforeAll(async () => {
    await require('../../../src/models').sequelize.sync({ force: true });
  });

  beforeEach(async () => {
    testUser = await TestHelpers.createTestUser();
  });

  afterEach(async () => {
    await TestHelpers.cleanupTestData();
  });

  afterAll(async () => {
    await require('../../../src/models').sequelize.close();
  });

  describe('Request Methods', () => {
    let request;

    beforeEach(async () => {
      request = await TestHelpers.createTestRequest(testUser.id);
    });

    it('should identify Stripe payment', async () => {
      const request1 = await TestHelpers.createTestRequest(testUser.id);
      await request1.update({ stripe_session_id: 'cs_test_123' });
      expect(Boolean(request1.isStripePayment())).toBe(true);

      const request2 = await TestHelpers.createTestRequest(testUser.id);
      await request2.update({ stripe_payment_intent_id: 'pi_123' });
      expect(Boolean(request2.isStripePayment())).toBe(true);

      const request3 = await TestHelpers.createTestRequest(testUser.id);
      expect(Boolean(request3.isStripePayment())).toBe(false);
    });

    it('should identify payment provider', () => {
      request.stripe_session_id = 'cs_test_123';
      expect(request.getPaymentProvider()).toBe('stripe');

      request.stripe_session_id = null;
      request.payment_id = 'telegram_123';
      expect(request.getPaymentProvider()).toBe('telegram');

      request.payment_id = 'unknown_123';
      expect(request.getPaymentProvider()).toBe('unknown');

      request.payment_id = null;
      expect(request.getPaymentProvider()).toBe('unknown');
    });
  });

  describe('Request Hooks', () => {
    it('should set processing_started_at when status changes to in_progress', async () => {
      const request = await TestHelpers.createTestRequest(testUser.id, {
        status: REQUEST_STATUS.CREATED,
      });

      await request.update({ status: REQUEST_STATUS.IN_PROGRESS });

      expect(request.processing_started_at).toBeDefined();
      expect(request.processing_started_at).toBeInstanceOf(Date);
    });

    it('should set completed_at when status changes to completed', async () => {
      const request = await TestHelpers.createTestRequest(testUser.id, {
        status: REQUEST_STATUS.IN_PROGRESS,
      });

      await request.update({ status: REQUEST_STATUS.COMPLETED });

      expect(request.completed_at).toBeDefined();
      expect(request.completed_at).toBeInstanceOf(Date);
    });

    it('should set cancelled_at when status changes to cancelled', async () => {
      const request = await TestHelpers.createTestRequest(testUser.id, {
        status: REQUEST_STATUS.CREATED,
      });

      await request.update({ status: REQUEST_STATUS.CANCELLED });

      expect(request.cancelled_at).toBeDefined();
      expect(request.cancelled_at).toBeInstanceOf(Date);
    });
  });

  describe('Static Methods', () => {
    beforeEach(async () => {
      // Create multiple requests for queue estimation test
      await TestHelpers.createTestRequest(testUser.id, {
        status: REQUEST_STATUS.PAID,
      });
      await TestHelpers.createTestRequest(testUser.id, {
        status: REQUEST_STATUS.IN_PROGRESS,
      });
      await TestHelpers.createTestRequest(testUser.id, {
        status: REQUEST_STATUS.COMPLETED,
      });
    });

    it('should estimate wait time based on queue size', async () => {
      const waitTime = await Request.getEstimatedWaitTime();

      expect(waitTime).toBe(20);
    });
  });
});
