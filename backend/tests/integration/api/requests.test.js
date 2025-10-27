const request = require('supertest');
const { Request, User, Template } = require('../../../src/models');
const TestHelpers = require('../../helpers/testHelpers');
const TestFactories = require('../../helpers/factories');

// Mock API key middleware
jest.mock('../../../src/middleware/apiKey', () => {
  return {
    apiKeyMiddleware: {
      telegramBot: (req, res, next) => {
        const providedKey = req.headers['x-api-key'];
        if (!providedKey)
          return res.status(401).json({ error: 'API key required' });
        if (providedKey !== process.env.TELEGRAM_BOT_API_KEY) {
          return res.status(403).json({ error: 'Invalid API key' });
        }
        next();
      },
      frontendWeb: (req, res, next) => {
        const providedKey = req.headers['x-api-key'];
        if (!providedKey)
          return res.status(401).json({ error: 'API key required' });
        if (providedKey !== process.env.FRONTEND_WEB_API_KEY) {
          return res.status(403).json({ error: 'Invalid API key' });
        }
        next();
      },
      adminPanel: (req, res, next) => next(),
      frontendOrTelegram: (req, res, next) => next(),
    },
  };
});

// Mock S3 service
jest.mock('../../../src/services/s3Service', () => ({
  generatePresignedDownloadUrl: jest.fn().mockResolvedValue({
    downloadUrl: 'https://mock-s3-url/photo.jpg',
    expires: new Date(),
  }),
  generatePresignedUploadUrl: jest.fn().mockResolvedValue({
    uploadUrl: 'https://mock-s3-upload-url/',
    key: 'photos/mock-photo.jpg',
    contentType: 'image/jpeg',
    expires: new Date(),
  }),
}));
const App = require('../../../src/app');
let app;

describe('Requests API', () => {
  let testUser;
  let authToken;
  let testTemplate;

  beforeAll(async () => {
    app = new App();
    await app.initialize();

    await require('../../../src/models').sequelize.sync({ force: true });
  });

  beforeEach(async () => {
    testUser = await TestHelpers.createTestUser({
      email: 'requests@example.com',
    });

    testTemplate = await TestHelpers.createTestTemplate();

    authToken = TestHelpers.generateAuthToken(testUser);
  });

  afterEach(async () => {
    await TestHelpers.cleanupTestData();
  });

  afterAll(async () => {
    await app.close();
    await require('../../../src/models').sequelize.close();
  });

  describe('POST /api/v1/requests', () => {
    it('should create a new request', async () => {
      const requestData = {
        photos: ['photo1.jpg', 'photo2.jpg'],
        script: 'Create a funny video with my pet',
        template_id: testTemplate.id,
      };

      const response = await request(app.app)
        .post('/api/v1/requests')
        .set('Authorization', `Bearer ${authToken}`)
        .set('X-API-Key', process.env.FRONTEND_WEB_API_KEY)
        .send(requestData)
        .expect(201);

      expect(response.body.request.user_id).toBe(testUser.id);
      expect(response.body.request.photos).toEqual(requestData.photos);
      expect(response.body.request.script).toBe(requestData.script);
      expect(response.body.request.status).toBe('created');
      expect(response.body.message).toBeDefined();
    });

    it('should create request without script', async () => {
      const requestData = {
        photos: ['photo1.jpg'],
      };

      const response = await request(app.app)
        .post('/api/v1/requests')
        .set('Authorization', `Bearer ${authToken}`)
        .set('X-API-Key', process.env.FRONTEND_WEB_API_KEY)
        .send(requestData)
        .expect(201);

      expect(response.body.request.script).toBeFalsy();
    });

    it('should reject request without photos', async () => {
      const requestData = {
        photos: [],
        script: 'Test script',
      };

      const response = await request(app.app)
        .post('/api/v1/requests')
        .set('Authorization', `Bearer ${authToken}`)
        .set('X-API-Key', process.env.FRONTEND_WEB_API_KEY)
        .send(requestData)
        .expect(400);

      expect(response.body.code).toBe('VALIDATION_ERROR');
    });

    it('should reject request with too many photos', async () => {
      const tooManyPhotos = Array.from(
        { length: 11 },
        (_, i) => `photo${i}.jpg`
      );
      const requestData = {
        photos: tooManyPhotos,
        script: 'Test script',
      };

      const response = await request(app.app)
        .post('/api/v1/requests')
        .set('Authorization', `Bearer ${authToken}`)
        .set('X-API-Key', process.env.FRONTEND_WEB_API_KEY)
        .send(requestData)
        .expect(400);

      expect(response.body.code).toBe('VALIDATION_ERROR');
    });

    it('should reject request with non-existent template', async () => {
      const requestData = {
        photos: ['photo1.jpg'],
        template_id: '123e4567-e89b-12d3-a456-426614174999', // Non-existent
      };

      const response = await request(app.app)
        .post('/api/v1/requests')
        .set('Authorization', `Bearer ${authToken}`)
        .set('X-API-Key', process.env.FRONTEND_WEB_API_KEY)
        .send(requestData)
        .expect(404);

      expect(response.body.code).toBe('NOT_FOUND_ERROR');
    });

    it('should reject request without authentication', async () => {
      const requestData = {
        photos: ['photo1.jpg'],
        script: 'Test script',
      };

      await request(app.app)
        .post('/api/v1/requests')
        .set('X-API-Key', process.env.FRONTEND_WEB_API_KEY)
        .send(requestData)
        .expect(401);
    });
  });

  describe('GET /api/v1/requests/my', () => {
    beforeEach(async () => {
      // Create test requests
      await TestHelpers.createTestRequest(testUser.id, {
        photos: ['req1_photo1.jpg', 'req1_photo2.jpg'],
        script: 'First request',
        status: 'created',
      });

      await TestHelpers.createTestRequest(testUser.id, {
        photos: ['req2_photo1.jpg'],
        script: 'Second request',
        status: 'completed',
        video_url: 'video2.mp4',
      });
    });

    it('should get user requests', async () => {
      const response = await request(app.app)
        .get('/api/v1/requests/my')
        .set('Authorization', `Bearer ${authToken}`)
        .set('X-API-Key', process.env.FRONTEND_WEB_API_KEY)
        .expect(200);

      expect(response.body.requests).toHaveLength(2);
      expect(response.body.requests[0].script).toBe('Second request');
      expect(response.body.requests[0].status).toBe('completed');
      expect(response.body.requests[1].script).toBe('First request');
      expect(response.body.requests[1].status).toBe('created');
    });

    it('should include photo URLs', async () => {
      const response = await request(app.app)
        .get('/api/v1/requests/my')
        .set('Authorization', `Bearer ${authToken}`)
        .set('X-API-Key', process.env.FRONTEND_WEB_API_KEY)
        .expect(200);

      const requestWithPhotos = response.body.requests.find(
        (r) => r.photos.length > 0
      );
      expect(requestWithPhotos.photos[0].url).toBeDefined();
      expect(requestWithPhotos.photos[0].key).toBeDefined();
    });

    it('should include video download URL for completed requests', async () => {
      const response = await request(app.app)
        .get('/api/v1/requests/my')
        .set('Authorization', `Bearer ${authToken}`)
        .set('X-API-Key', process.env.FRONTEND_WEB_API_KEY)
        .expect(200);

      const completedRequest = response.body.requests.find(
        (r) => r.status === 'completed'
      );
      expect(completedRequest).toBeDefined();

      if (completedRequest.video_url && completedRequest.video_download_url) {
        expect(completedRequest.video_download_url).toBeDefined();
      }
    });
  });

  describe('POST /api/v1/requests/upload-urls', () => {
    it('should generate upload URLs', async () => {
      const uploadData = {
        file_type: 'image/jpeg',
        file_count: 3,
      };

      const response = await request(app.app)
        .post('/api/v1/requests/upload-urls')
        .set('Authorization', `Bearer ${authToken}`)
        .set('X-API-Key', process.env.FRONTEND_WEB_API_KEY)
        .send(uploadData)
        .expect(200);

      expect(response.body.uploads).toHaveLength(3);
      expect(response.body.uploads[0].uploadUrl).toBeDefined();
      expect(response.body.uploads[0].key).toBeDefined();
      expect(response.body.uploads[0].contentType).toBe('image/jpeg');
      expect(response.body.message).toBeDefined();
    });

    it('should reject invalid file type', async () => {
      const uploadData = {
        file_type: 'application/pdf', // Not an image
        file_count: 1,
      };

      const response = await request(app.app)
        .post('/api/v1/requests/upload-urls')
        .set('Authorization', `Bearer ${authToken}`)
        .set('X-API-Key', process.env.FRONTEND_WEB_API_KEY)
        .send(uploadData)
        .expect(400);

      expect(response.body.code).toBe('VALIDATION_ERROR');
    });
  });

  describe('GET /api/v1/requests/queue/estimation', () => {
    it('should return queue estimation', async () => {
      // Create some requests in queue
      await TestHelpers.createTestRequest(testUser.id, { status: 'paid' });
      await TestHelpers.createTestRequest(testUser.id, {
        status: 'in_progress',
      });

      const response = await request(app.app)
        .get('/api/v1/requests/queue/estimation')
        .expect(200);

      expect(response.body.estimated_wait_minutes).toBe(20);
      expect(response.body.estimated_wait_hours).toBe(1);
      expect(response.body.message).toBeDefined();
    });
  });

  describe('GET /api/v1/requests/templates', () => {
    it('should return active templates', async () => {
      const response = await request(app.app)
        .get('/api/v1/requests/templates')
        .expect(200);

      expect(response.body.templates).toHaveLength(1);
      expect(response.body.templates[0].id).toBe(testTemplate.id);
      expect(response.body.templates[0].is_active).toBe(true);
      expect(response.body.language).toBe('en');
    });
  });

  describe('GET /api/v1/requests/templates/:id', () => {
    it('should return specific template', async () => {
      const response = await request(app.app)
        .get(`/api/v1/requests/templates/${testTemplate.id}`)
        .expect(200);

      expect(response.body.template.id).toBe(testTemplate.id);
      expect(response.body.template.is_active).toBe(true);
    });

    it('should return 404 for non-existent template', async () => {
      const nonExistentId = '123e4567-e89b-12d3-a456-426614174999';

      await request(app.app)
        .get(`/api/v1/requests/templates/${nonExistentId}`)
        .expect(404);
    });

    it('should return 404 for inactive template', async () => {
      const inactiveTemplate = await TestHelpers.createTestTemplate({
        is_active: false,
      });

      await request(app.app)
        .get(`/api/v1/requests/templates/${inactiveTemplate.id}`)
        .expect(404);
    });
  });
});
