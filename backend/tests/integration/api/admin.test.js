const request = require('supertest');
const TestHelpers = require('../../helpers/testHelpers');

// Mock external services
jest.mock('../../../src/services/s3Service', () => ({
  generatePresignedDownloadUrl: jest.fn().mockResolvedValue({
    downloadUrl: 'https://mock-s3-url/photo.jpg',
    expires: new Date(),
  }),
}));

jest.mock('../../../src/services/queueService', () => ({
  addEmailJob: jest.fn().mockResolvedValue(),
}));

jest.mock('axios');

// Mock rate limiting
jest.mock('../../../src/middleware/rateLimit', () => ({
  initializeRateLimiters: jest.fn().mockResolvedValue(),
  getGeneralRateLimit: () => (req, res, next) => next(),
  getAuthRateLimit: () => (req, res, next) => next(),
  getStrictRateLimit: () => (req, res, next) => next(),
}));

const App = require('../../../src/app');
let app;

describe('Admin API', () => {
  let adminUser;
  let regularUser;
  let adminToken;
  let regularToken;
  let testRequest;
  let testTemplate;

  beforeAll(async () => {
    app = new App();
    await app.initialize();

    await require('../../../src/models').sequelize.sync({ force: true });
  });

  beforeEach(async () => {
    // Create admin user
    adminUser = await TestHelpers.createTestUser({
      email: 'admin@example.com',
      role: 'admin',
    });

    // Create regular user
    regularUser = await TestHelpers.createTestUser({
      email: 'regular@example.com',
      role: 'user',
    });

    // Create test template
    testTemplate = await TestHelpers.createTestTemplate();

    // Create test request
    testRequest = await TestHelpers.createTestRequest(regularUser.id, {
      photos: ['photo1.jpg', 'photo2.jpg'],
      script: 'Test script for admin',
      status: 'paid',
      payment_status: 'paid',
      amount: 9.99,
    });

    adminToken = TestHelpers.generateAuthToken(adminUser);
    regularToken = TestHelpers.generateAuthToken(regularUser);
  });

  afterEach(async () => {
    await TestHelpers.cleanupTestData();
  });

  afterAll(async () => {
    await app.close();
    await require('../../../src/models').sequelize.close();
  });

  describe('Authentication and Authorization', () => {
    it('should reject access without authentication', async () => {
      await request(app.app).get('/api/v1/admin/dashboard/stats').expect(401);
    });

    it('should reject access for non-admin users', async () => {
      const response = await request(app.app)
        .get('/api/v1/admin/dashboard/stats')
        .set('Authorization', `Bearer ${regularToken}`);

      // Для отладки
      console.log('Non-admin test - Status:', response.status);
      console.log('Non-admin test - Body:', response.body);

      expect(response.status).toBe(403);
    });

    it('should allow access for admin users', async () => {
      const response = await request(app.app)
        .get('/api/v1/admin/dashboard/stats')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);
    });
  });

  describe('GET /api/v1/admin/dashboard/stats', () => {
    it('should return dashboard statistics', async () => {
      const response = await request(app.app)
        .get('/api/v1/admin/dashboard/stats')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.summary).toEqual({
        total_requests: 1,
        paid_requests: 1,
        completed_requests: 0,
        total_revenue: expect.any(Number),
        conversion_rate: expect.any(String),
      });
    });
  });

  describe('GET /api/v1/admin/requests', () => {
    beforeEach(async () => {
      // Create multiple requests for testing
      await TestHelpers.createTestRequest(regularUser.id, {
        status: 'completed',
        payment_status: 'paid',
        amount: 9.99,
      });

      await TestHelpers.createTestRequest(regularUser.id, {
        status: 'created',
        payment_status: 'pending',
      });
    });

    it('should return all requests with pagination', async () => {
      const response = await request(app.app)
        .get('/api/v1/admin/requests')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.requests).toHaveLength(3);
      expect(response.body.pagination).toEqual({
        total: 3,
        page: 1,
        limit: 20,
        pages: 1,
      });
    });

    it('should filter requests by status', async () => {
      const response = await request(app.app)
        .get('/api/v1/admin/requests?status=completed')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.requests).toHaveLength(1);
      expect(response.body.requests[0].status).toBe('completed');
    });

    it('should filter requests by payment_status', async () => {
      const response = await request(app.app)
        .get('/api/v1/admin/requests?payment_status=paid')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.requests).toHaveLength(2);
      expect(response.body.requests[0].payment_status).toBe('paid');
    });

    it('should include user and template data', async () => {
      const response = await request(app.app)
        .get('/api/v1/admin/requests')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      const requestItem = response.body.requests[0];
      expect(requestItem.user).toBeDefined();
      expect(requestItem.user.email).toBe('regular@example.com');
      expect(requestItem.template).toBeDefined();
    });

    it('should include photo URLs', async () => {
      const response = await request(app.app)
        .get('/api/v1/admin/requests')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      const requestWithPhotos = response.body.requests.find(
        (r) => r.photos && r.photos.length > 0
      );
      expect(requestWithPhotos.photos[0].url).toBeDefined();
      expect(requestWithPhotos.photos[0].key).toBeDefined();
    });
  });

  describe('PATCH /api/v1/admin/requests/:id/status', () => {
    it('should update request status', async () => {
      const updateData = {
        status: 'in_progress',
        admin_notes: 'Processing started',
      };

      const response = await request(app.app)
        .patch(`/api/v1/admin/requests/${testRequest.id}/status`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send(updateData)
        .expect(200);

      expect(response.body.message).toBe('Request status updated successfully');
      expect(response.body.request.status).toBe('in_progress');
      expect(response.body.request.admin_notes).toBe('Processing started');
    });

    it('should update request with video URL', async () => {
      const updateData = {
        status: 'completed',
        video_url: 'https://example.com/processed/video123.mp4',
      };

      const response = await request(app.app)
        .patch(`/api/v1/admin/requests/${testRequest.id}/status`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send(updateData)
        .expect(200);

      expect(response.body.request.status).toBe('completed');
      expect(response.body.request.video_url).toBe(
        'https://example.com/processed/video123.mp4'
      );
    });

    it('should reject update for non-existent request', async () => {
      const nonExistentId = '123e4567-e89b-12d3-a456-426614174999';

      await request(app.app)
        .patch(`/api/v1/admin/requests/${nonExistentId}/status`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ status: 'completed' })
        .expect(404);
    });

    it('should reject invalid status', async () => {
      await request(app.app)
        .patch(`/api/v1/admin/requests/${testRequest.id}/status`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ status: 'invalid_status' })
        .expect(400);
    });

    it('should reject invalid UUID', async () => {
      await request(app.app)
        .patch('/api/v1/admin/requests/invalid-uuid/status')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ status: 'completed' })
        .expect(400);
    });
  });
  describe('POST /api/v1/admin/telegram/notify', () => {
    it('should process Telegram notification with valid data', async () => {
      const notificationData = {
        userId: 123456789,
        requestId: testRequest.id,
        status: 'completed',
        language: 'en',
      };

      const response = await request(app.app)
        .post('/api/v1/admin/telegram/notify')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(notificationData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Notification received successfully');
      expect(response.body.data).toEqual({
        userId: 123456789,
        requestId: testRequest.id,
        status: 'completed',
        language: 'en',
      });
    });

    it('should reject notification without authentication', async () => {
      const notificationData = {
        userId: 123456789,
        requestId: testRequest.id,
        status: 'completed',
      };

      await request(app.app)
        .post('/api/v1/admin/telegram/notify')
        .send(notificationData)
        .expect(401);
    });

    it('should reject notification for non-admin users', async () => {
      const notificationData = {
        userId: 123456789,
        requestId: testRequest.id,
        status: 'completed',
      };

      await request(app.app)
        .post('/api/v1/admin/telegram/notify')
        .set('Authorization', `Bearer ${regularToken}`)
        .send(notificationData)
        .expect(403);
    });

    it('should reject notification with missing required fields', async () => {
      const notificationData = {
        userId: 123456789,
        // Missing requestId and status
      };

      const response = await request(app.app)
        .post('/api/v1/admin/telegram/notify')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(notificationData)
        .expect(400);

      expect(response.body.code).toBe('VALIDATION_ERROR');
      expect(response.body.error).toContain('Missing required parameters');
    });

    it('should reject invalid user ID format', async () => {
      const notificationData = {
        userId: 'invalid',
        requestId: testRequest.id,
        status: 'completed',
      };

      const response = await request(app.app)
        .post('/api/v1/admin/telegram/notify')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(notificationData)
        .expect(400);

      expect(response.body.code).toBe('VALIDATION_ERROR');
      expect(response.body.error).toContain(
        'User ID must be a positive integer'
      );
    });

    it('should reject invalid request ID format', async () => {
      const notificationData = {
        userId: 123456789,
        requestId: 'invalid-uuid',
        status: 'completed',
      };

      const response = await request(app.app)
        .post('/api/v1/admin/telegram/notify')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(notificationData)
        .expect(400);

      expect(response.body.code).toBe('VALIDATION_ERROR');
      expect(response.body.error).toContain('Invalid request ID format');
    });

    it('should reject invalid status value', async () => {
      const notificationData = {
        userId: 123456789,
        requestId: testRequest.id,
        status: 'invalid_status',
      };

      const response = await request(app.app)
        .post('/api/v1/admin/telegram/notify')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(notificationData)
        .expect(400);

      expect(response.body.code).toBe('VALIDATION_ERROR');
      expect(response.body.error).toContain('Invalid status value');
    });

    it('should accept different valid status values', async () => {
      const validStatuses = [
        'created',
        'paid',
        'in_progress',
        'completed',
        'cancelled',
      ];

      for (const status of validStatuses) {
        const notificationData = {
          userId: 123456789,
          requestId: testRequest.id,
          status: status,
        };

        const response = await request(app.app)
          .post('/api/v1/admin/telegram/notify')
          .set('Authorization', `Bearer ${adminToken}`)
          .send(notificationData)
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.data.status).toBe(status);
      }
    });

    it('should use default language when not provided', async () => {
      const notificationData = {
        userId: 123456789,
        requestId: testRequest.id,
        status: 'completed',
        // language not provided
      };

      const response = await request(app.app)
        .post('/api/v1/admin/telegram/notify')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(notificationData)
        .expect(200);

      expect(response.body.data.language).toBe('en'); // default value
    });

    it('should accept different languages when provided', async () => {
      const notificationData = {
        userId: 123456789,
        requestId: testRequest.id,
        status: 'completed',
        language: 'ru',
      };

      const response = await request(app.app)
        .post('/api/v1/admin/telegram/notify')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(notificationData)
        .expect(200);

      expect(response.body.data.language).toBe('ru');
    });
  });
});
