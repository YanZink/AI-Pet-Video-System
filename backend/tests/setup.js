const path = require('path');

// Set test environment
process.env.NODE_ENV = 'test';

// Load test environment variables
require('dotenv').config({ path: path.resolve(__dirname, '../.env.test') });

// Mock logger to avoid console noise during tests
jest.mock('../src/utils/logger', () => ({
  info: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
  debug: jest.fn(),
  logRequest: jest.fn(),
  logError: jest.fn(),
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
