const path = require('path');

// Set test environment
process.env.NODE_ENV = 'test';

// Load environment variables from .env.example for testing
require('dotenv').config({ path: path.resolve(__dirname, '.env.example') });

// Override with test-specific values
process.env.DB_NAME = 'ai_pet_video_test';
process.env.JWT_SECRET = 'test_jwt_secret_key_for_testing_environment_only';
process.env.JWT_EXPIRES_IN = '1h';
process.env.MOCK_UPLOADS = 'true';
process.env.TELEGRAM_BOT_API_KEY = 'test_telegram_bot_api_key';
process.env.FRONTEND_WEB_API_KEY = 'test_frontend_web_api_key';
process.env.ADMIN_PANEL_API_KEY = 'test_admin_panel_api_key';
process.env.REDIS_URL = 'redis://localhost:6379';

// Mock database connection
jest.mock('./src/config/database', () => {
  const { Sequelize } = require('sequelize');

  // Use SQLite for testing
  const testSequelize = new Sequelize({
    dialect: 'sqlite',
    storage: ':memory:',
    logging: false,
  });

  return {
    sequelize: testSequelize,
    testConnection: jest.fn().mockResolvedValue(true),
    syncDatabase: jest.fn().mockResolvedValue(true),
  };
});

// Mock Redis connection
jest.mock('./src/config/redis', () => {
  const mockClient = {
    connect: jest.fn().mockResolvedValue(),
    quit: jest.fn().mockResolvedValue(),
    ping: jest.fn().mockResolvedValue('PONG'),
    on: jest.fn(),
    sendCommand: jest.fn().mockResolvedValue(null),
  };

  return {
    redisManager: {
      connect: jest.fn().mockResolvedValue(mockClient),
      getClient: jest.fn().mockResolvedValue(mockClient),
      disconnect: jest.fn().mockResolvedValue(),
      ping: jest.fn().mockResolvedValue(true),
      isConnected: true,
      client: mockClient,
    },
  };
});

// Mock logger to avoid console noise during tests
jest.mock('./src/utils/logger', () => ({
  info: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
  debug: jest.fn(),
  logRequest: jest.fn(),
  logError: jest.fn(),
}));

// Mock rate limiter
jest.mock('./src/middleware/rateLimit', () => ({
  initializeRateLimiters: jest.fn().mockResolvedValue(),
  getGeneralRateLimit: () => (req, res, next) => next(),
  getAuthRateLimit: () => (req, res, next) => next(),
  getStrictRateLimit: () => (req, res, next) => next(),
}));

// Global test variables
global.testUser = {
  id: '123e4567-e89b-12d3-a456-426614174000',
  email: 'test@example.com',
  telegram_id: 123456789,
  username: 'testuser',
  first_name: 'Test',
  last_name: 'User',
  language: 'en',
  role: 'user',
};

global.adminUser = {
  id: '123e4567-e89b-12d3-a456-426614174001',
  email: 'admin@example.com',
  telegram_id: 987654321,
  username: 'adminuser',
  first_name: 'Admin',
  last_name: 'User',
  language: 'en',
  role: 'admin',
};

// Global test timeout
jest.setTimeout(10000);
