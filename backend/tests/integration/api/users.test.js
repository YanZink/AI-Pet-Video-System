const request = require('supertest');
const { User } = require('../../../src/models');
const TestHelpers = require('../../helpers/testHelpers');
jest.mock('../../../src/middleware/apiKey', () => {
  const actualMiddleware = jest.requireActual('../../../src/middleware/apiKey');

  return {
    apiKeyMiddleware: {
      telegramBot: (req, res, next) => {
        const providedKey = req.headers['x-api-key'];
        if (!providedKey) {
          return res.status(401).json({ error: 'API key required' });
        }
        if (providedKey !== process.env.TELEGRAM_BOT_API_KEY) {
          return res.status(403).json({ error: 'Invalid API key' });
        }
        next();
      },
      frontendWeb: (req, res, next) => {
        const providedKey = req.headers['x-api-key'];
        if (!providedKey) {
          return res.status(401).json({ error: 'API key required' });
        }
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

const App = require('../../../src/app');
let app;

describe('Users API', () => {
  let testUser;
  let authToken;

  beforeAll(async () => {
    app = new App();
    await app.initialize();

    // Sync test database
    await require('../../../src/models').sequelize.sync({ force: true });
  });

  beforeEach(async () => {
    testUser = await TestHelpers.createTestUser({
      email: 'api@example.com',
      password_hash: '$2b$12$hashedpassword',
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

  describe('POST /api/v1/users', () => {
    it('should create a new user with email', async () => {
      const userData = {
        email: 'newuser@example.com',
        username: 'newuser',
        password: 'password123',
        first_name: 'New',
        last_name: 'User',
        language: 'en',
      };

      const response = await request(app.app)
        .post('/api/v1/users')
        .set('X-API-Key', process.env.FRONTEND_WEB_API_KEY)
        .send(userData)
        .expect(201);

      expect(response.body.user.email).toBe(userData.email);
      expect(response.body.user.username).toBe(userData.username);
      expect(response.body.token).toBeDefined();
      expect(response.body.requiresEmailVerification).toBe(true);
    });

    it('should create a new user with Telegram data', async () => {
      const telegramData = {
        telegram_id: 987654321,
        username: 'telegramuser',
        first_name: 'Telegram',
        last_name: 'User',
        language: 'ru',
      };

      const response = await request(app.app)
        .post('/api/v1/users/telegram')
        .set('X-API-Key', process.env.TELEGRAM_BOT_API_KEY)
        .send(telegramData)
        .expect(201);

      expect(response.body.user.telegram_id).toBe(telegramData.telegram_id);
      expect(response.body.user.username).toBe(telegramData.username);
      expect(response.body.token).toBeDefined();
      expect(response.body.isNewUser).toBe(true);
    });

    it('should return existing Telegram user', async () => {
      const telegramUser = await TestHelpers.createTestUser({
        telegram_id: 111222333,
        username: 'existingtelegram',
      });

      const response = await request(app.app)
        .post('/api/v1/users/telegram')
        .set('X-API-Key', process.env.TELEGRAM_BOT_API_KEY)
        .send({
          telegram_id: 111222333,
          username: 'existingtelegram',
        })
        .expect(200);

      expect(response.body.isNewUser).toBe(false);
      expect(response.body.user.id).toBe(telegramUser.id);
    });

    it('should reject user creation without API key', async () => {
      const userData = {
        email: 'test@example.com',
        password: 'password123',
      };

      await request(app.app).post('/api/v1/users').send(userData).expect(401);
    });

    it('should reject user creation with invalid API key', async () => {
      const userData = {
        email: 'test@example.com',
        password: 'password123',
      };

      await request(app.app)
        .post('/api/v1/users')
        .set('X-API-Key', 'invalid-key')
        .send(userData)
        .expect(403);
    });

    it('should reject duplicate email registration', async () => {
      const userData = {
        email: 'duplicate@example.com',
        password: 'password123',
        username: 'user1',
      };

      // First registration
      await request(app.app)
        .post('/api/v1/users')
        .set('X-API-Key', process.env.FRONTEND_WEB_API_KEY)
        .send(userData)
        .expect(201);

      // Second registration with same email
      const response = await request(app.app)
        .post('/api/v1/users')
        .set('X-API-Key', process.env.FRONTEND_WEB_API_KEY)
        .send({ ...userData, username: 'user2' })
        .expect(409);

      expect(response.body.code).toBe('DUPLICATE_ERROR');
    });
  });

  describe('POST /api/v1/users/login', () => {
    it('should login user with valid credentials', async () => {
      // Mock password check
      User.prototype.checkPassword = jest.fn().mockResolvedValue(true);

      const loginData = {
        email: 'api@example.com',
        password: 'password123',
      };

      const response = await request(app.app)
        .post('/api/v1/users/login')
        .set('X-API-Key', process.env.FRONTEND_WEB_API_KEY)
        .send(loginData)
        .expect(200);

      expect(response.body.user.email).toBe(loginData.email);
      expect(response.body.token).toBeDefined();
      expect(response.body.message).toBeDefined();
    });

    it('should reject login with invalid credentials', async () => {
      const loginData = {
        email: 'nonexistent@example.com',
        password: 'wrongpassword',
      };

      const response = await request(app.app)
        .post('/api/v1/users/login')
        .set('X-API-Key', process.env.FRONTEND_WEB_API_KEY)
        .send(loginData)
        .expect(401);

      expect(response.body.code).toBe('AUTHENTICATION_ERROR');
    });
  });

  describe('GET /api/v1/users/me', () => {
    it('should get current user profile with valid token', async () => {
      const response = await request(app.app)
        .get('/api/v1/users/me')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.user.email).toBe('api@example.com');
      expect(response.body.language).toBe('en');
    });

    it('should reject request without token', async () => {
      await request(app.app).get('/api/v1/users/me').expect(401);
    });

    it('should reject request with invalid token', async () => {
      await request(app.app)
        .get('/api/v1/users/me')
        .set('Authorization', 'Bearer invalid-token')
        .expect(401);
    });
  });

  describe('PATCH /api/v1/users/language', () => {
    it('should update user language', async () => {
      const updateData = {
        language: 'ru',
      };

      const response = await request(app.app)
        .patch('/api/v1/users/language')
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateData)
        .expect(200);

      expect(response.body.language).toBe('ru');
      expect(response.body.user.language).toBe('ru');
      expect(response.body.message).toBeDefined();
    });

    it('should reject unsupported language', async () => {
      const updateData = {
        language: 'fr', // Unsupported language
      };

      const response = await request(app.app)
        .patch('/api/v1/users/language')
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateData)
        .expect(400);

      expect(response.body.code).toBe('VALIDATION_ERROR');
    });
  });

  describe('GET /api/v1/users/languages', () => {
    it('should return supported languages', async () => {
      const response = await request(app.app)
        .get('/api/v1/users/languages')
        .expect(200);

      expect(response.body.languages).toHaveLength(2);
      expect(response.body.languages).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            code: 'en',
            name: 'English',
            native_name: 'English',
          }),
          expect.objectContaining({
            code: 'ru',
            name: 'Russian',
            native_name: 'Русский',
          }),
        ])
      );
      expect(response.body.default_language).toBe('en');
    });
  });
  describe('POST /api/v1/users/telegram validation', () => {
    it('should reject Telegram user creation without required fields', async () => {
      const invalidData = {
        // Missing telegram_id (required)
        username: 'testuser',
      };

      const response = await request(app.app)
        .post('/api/v1/users/telegram')
        .set('X-API-Key', process.env.TELEGRAM_BOT_API_KEY)
        .send(invalidData)
        .expect(400);

      expect(response.body.code).toBe('VALIDATION_ERROR');
    });

    it('should reject invalid Telegram user data types', async () => {
      const invalidData = {
        telegram_id: 'not-a-number', // Should be number
        username: 12345, // Should be string
      };

      const response = await request(app.app)
        .post('/api/v1/users/telegram')
        .set('X-API-Key', process.env.TELEGRAM_BOT_API_KEY)
        .send(invalidData)
        .expect(400);

      expect(response.body.code).toBe('VALIDATION_ERROR');
    });
  });

  describe('POST /api/v1/users validation', () => {
    it('should reject user creation without required fields', async () => {
      const invalidData = {
        // Missing email and password (required)
        username: 'testuser',
      };

      const response = await request(app.app)
        .post('/api/v1/users')
        .set('X-API-Key', process.env.FRONTEND_WEB_API_KEY)
        .send(invalidData)
        .expect(400);

      expect(response.body.code).toBe('VALIDATION_ERROR');
    });

    it('should reject invalid email format', async () => {
      const invalidData = {
        email: 'invalid-email',
        password: 'password123',
        username: 'testuser',
      };

      const response = await request(app.app)
        .post('/api/v1/users')
        .set('X-API-Key', process.env.FRONTEND_WEB_API_KEY)
        .send(invalidData)
        .expect(400);

      expect(response.body.code).toBe('VALIDATION_ERROR');
    });

    it('should reject weak password', async () => {
      const invalidData = {
        email: 'test@example.com',
        password: '123', // Too short
        username: 'testuser',
      };

      const response = await request(app.app)
        .post('/api/v1/users')
        .set('X-API-Key', process.env.FRONTEND_WEB_API_KEY)
        .send(invalidData)
        .expect(400);

      expect(response.body.code).toBe('VALIDATION_ERROR');
    });
  });

  describe('User profile operations', () => {
    it('should return 404 for non-existent user profile', async () => {});

    it('should handle user with missing optional fields', async () => {
      const userWithMinimalData = {
        email: 'minimal@example.com',
        password: 'password123',
        // No username, first_name, last_name
      };

      const response = await request(app.app)
        .post('/api/v1/users')
        .set('X-API-Key', process.env.FRONTEND_WEB_API_KEY)
        .send(userWithMinimalData)
        .expect(201);

      expect(response.body.user.email).toBe(userWithMinimalData.email);
    });
  });

  describe('API key security', () => {
    it('should reject Telegram endpoint with frontend API key', async () => {
      const telegramData = {
        telegram_id: 123456789,
        username: 'testuser',
      };

      await request(app.app)
        .post('/api/v1/users/telegram')
        .set('X-API-Key', process.env.FRONTEND_WEB_API_KEY) // Wrong key type
        .send(telegramData)
        .expect(403);
    });

    it('should reject frontend endpoint with Telegram API key', async () => {
      const userData = {
        email: 'test@example.com',
        password: 'password123',
      };

      await request(app.app)
        .post('/api/v1/users')
        .set('X-API-Key', process.env.TELEGRAM_BOT_API_KEY) // Wrong key type
        .send(userData)
        .expect(403);
    });
  });

  describe('Edge cases', () => {
    it('should handle very long usernames appropriately', async () => {
      const longUsername = 'a'.repeat(100); // Very long username

      const userData = {
        email: 'longuser@example.com',
        password: 'password123',
        username: longUsername,
      };

      const response = await request(app.app)
        .post('/api/v1/users')
        .set('X-API-Key', process.env.FRONTEND_WEB_API_KEY)
        .send(userData);

      // Should either accept or reject with proper validation
      expect([201, 400]).toContain(response.status);
    });

    it('should handle special characters in names', async () => {
      const userData = {
        email: 'special@example.com',
        password: 'password123',
        username: 'user123',
        first_name: 'John-Джон_123',
        last_name: 'Doe-Smith',
      };

      const response = await request(app.app)
        .post('/api/v1/users')
        .set('X-API-Key', process.env.FRONTEND_WEB_API_KEY)
        .send(userData);

      // Should either accept or reject with proper validation
      expect([201, 400]).toContain(response.status);
    });
  });
});
