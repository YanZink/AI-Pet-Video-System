const { v4: uuidv4 } = require('uuid');

class TestFactories {
  static userFactory(overrides = {}) {
    const baseUser = {
      id: uuidv4(),
      telegram_id: Math.floor(Math.random() * 1000000000),
      email: `test${Math.random().toString(36).substring(7)}@example.com`,
      username: `user${Math.random().toString(36).substring(7)}`,
      first_name: 'Test',
      last_name: 'User',
      password_hash: '$2b$12$hashedpassword',
      language: 'en',
      role: 'user',
      is_active: true,
      email_verified: false,
      login_count: 0,
    };

    return { ...baseUser, ...overrides };
  }

  static requestFactory(userId, overrides = {}) {
    const baseRequest = {
      id: uuidv4(),
      user_id: userId,
      photos: [`photo_${uuidv4()}.jpg`, `photo_${uuidv4()}.jpg`],
      script: 'Test script content for video generation',
      template_id: null,
      status: 'created',
      payment_status: 'pending',
      amount: 9.99,
      currency: 'USD',
    };

    return { ...baseRequest, ...overrides };
  }

  static templateFactory(overrides = {}) {
    const baseTemplate = {
      id: uuidv4(),
      name: `Template ${Math.random().toString(36).substring(7)}`,
      description: 'Test template description',
      category: 'general',
      duration_seconds: 30,
      max_photos: 5,
      is_active: true,
      sort_order: 1,
      usage_count: 0,
    };

    return { ...baseTemplate, ...overrides };
  }

  static paymentDataFactory(requestId, overrides = {}) {
    const basePayment = {
      invoice_payload: JSON.stringify({
        requestId,
        type: 'video_creation',
        timestamp: Date.now(),
      }),
      total_amount: 1000, // 10.00 in cents/stars
      currency: 'XTR',
      telegram_payment_charge_id: `telegram_${uuidv4()}`,
      provider_payment_charge_id: `provider_${uuidv4()}`,
    };

    return { ...basePayment, ...overrides };
  }

  static stripeSessionFactory(requestId, overrides = {}) {
    const baseSession = {
      id: `cs_test_${Math.random().toString(36).substring(7)}`,
      status: 'open',
      payment_status: 'unpaid',
      amount_total: 999, // $9.99 in cents
      currency: 'usd',
      customer_email: 'test@example.com',
      metadata: { request_id: requestId, type: 'video_creation' },
      payment_intent: `pi_${Math.random().toString(36).substring(7)}`,
      url: 'https://checkout.stripe.com/test_session',
      expires_at: Math.floor(Date.now() / 1000) + 1800, // 30 minutes
    };

    return { ...baseSession, ...overrides };
  }
}

module.exports = TestFactories;
