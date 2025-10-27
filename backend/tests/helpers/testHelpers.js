const jwt = require('jsonwebtoken');
const { User, Request, Template } = require('../../src/models');

class TestHelpers {
  static async createTestUser(overrides = {}) {
    const defaultUser = {
      email: 'test@example.com',
      username: 'testuser',
      first_name: 'Test',
      last_name: 'User',
      password_hash: '$2b$12$hashedpassword',
      language: 'en',
      role: 'user',
      is_active: true,
      ...overrides,
    };

    if (!overrides.email) {
      defaultUser.email = `test${Date.now()}@example.com`;
    }

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
      name: 'Test Template',
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
      const { User, Request, Template } = require('../../src/models');

      await Request.destroy({ where: {}, force: true });
      await Template.destroy({ where: {}, force: true });
      await User.destroy({ where: {}, force: true });
    } catch (error) {
      if (!error.message.includes('no such table')) {
        console.warn('Cleanup warning:', error.message);
      }
    }
  }

  static mockRequest(language = 'en', user = null, body = {}) {
    return {
      body,
      user,
      language,
      headers: {
        'accept-language': language,
      },
      t: (key, variables = {}) => {
        let result = key;
        Object.keys(variables).forEach((variable) => {
          result = result.replace(
            new RegExp(`{${variable}}`, 'g'),
            variables[variable]
          );
        });
        return result;
      },
    };
  }

  static mockResponse() {
    const res = {};
    res.status = jest.fn().mockReturnValue(res);
    res.json = jest.fn().mockReturnValue(res);
    res.send = jest.fn().mockReturnValue(res);
    res.redirect = jest.fn().mockReturnValue(res);
    return res;
  }

  static mockNext() {
    return jest.fn();
  }
}

module.exports = TestHelpers;
