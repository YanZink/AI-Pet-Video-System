const jwt = require('jsonwebtoken');
const { User, Request, Template } = require('../../src/models');

class TestHelpers {
  static async createTestUser(overrides = {}) {
    const defaultUser = {
      email: `test${Date.now()}@example.com`,
      username: `testuser${Date.now()}`,
      first_name: 'Test',
      last_name: 'User',
      password_hash: '$2b$12$hashedpassword',
      language: 'en',
      role: 'user',
      is_active: true,
      ...overrides,
    };

    return await User.create(defaultUser);
  }

  static generateAuthToken(user) {
    return jwt.sign(
      {
        userId: user.id,
        email: user.email,
        telegramId: user.telegram_id,
        role: user.role,
      },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN }
    );
  }

  static async createTestRequest(userId, overrides = {}) {
    return await Request.create({
      user_id: userId,
      photos: ['photo1.jpg', 'photo2.jpg'],
      script: 'Test script for video',
      status: 'created',
      payment_status: 'pending',
      amount: 9.99,
      currency: 'USD',
      ...overrides,
    });
  }

  static async createTestTemplate(overrides = {}) {
    return await Template.create({
      name: `Test Template ${Date.now()}`,
      description: 'Test template description',
      category: 'general',
      duration_seconds: 30,
      max_photos: 5,
      is_active: true,
      sort_order: 1,
      ...overrides,
    });
  }

  static async cleanupTestData() {
    try {
      await Request.destroy({ where: {}, force: true });
      await Template.destroy({ where: {}, force: true });
      await User.destroy({ where: {}, force: true });
    } catch (error) {
      // Ignore errors during cleanup in tests
      console.warn('Cleanup warning:', error.message);
    }
  }
}

module.exports = TestHelpers;
