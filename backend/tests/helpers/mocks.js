// Mock AWS S3
const mockS3 = {
  getSignedUrl: jest.fn().mockImplementation((operation, params) => {
    return `https://mock-s3-url/${params.Key}`;
  }),
  upload: jest.fn().mockImplementation((params) => ({
    promise: jest.fn().mockResolvedValue({
      Key: params.Key,
      Location: `https://mock-bucket.s3.amazonaws.com/${params.Key}`,
    }),
  })),
  deleteObject: jest.fn().mockImplementation(() => ({
    promise: jest.fn().mockResolvedValue({}),
  })),
  headBucket: jest.fn().mockImplementation(() => ({
    promise: jest.fn().mockResolvedValue({}),
  })),
};

// Mock AWS SES
const mockSES = {
  sendEmail: jest.fn().mockImplementation(() => ({
    promise: jest.fn().mockResolvedValue({
      MessageId: `mock-message-${Math.random().toString(36).substring(7)}`,
    }),
  })),
  getIdentityVerificationAttributes: jest.fn().mockImplementation(() => ({
    promise: jest.fn().mockResolvedValue({}),
  })),
};

// Mock Stripe
const mockStripe = {
  checkout: {
    sessions: {
      create: jest.fn().mockResolvedValue({
        id: 'cs_test_mock',
        url: 'https://checkout.stripe.com/mock',
        expires_at: Math.floor(Date.now() / 1000) + 1800,
      }),
      retrieve: jest.fn().mockResolvedValue({
        id: 'cs_test_mock',
        status: 'complete',
        payment_status: 'paid',
        amount_total: 999,
        currency: 'usd',
        customer_email: 'test@example.com',
        metadata: { request_id: 'mock-request-id' },
        payment_intent: 'pi_mock',
      }),
    },
  },
  paymentIntents: {
    retrieve: jest.fn().mockResolvedValue({
      id: 'pi_mock',
      status: 'succeeded',
      amount: 999,
      currency: 'usd',
      metadata: {},
    }),
  },
  webhooks: {
    constructEvent: jest
      .fn()
      .mockImplementation((payload, signature, secret) => ({
        type: 'checkout.session.completed',
        data: {
          object: {
            id: 'cs_test_mock',
            metadata: { request_id: 'mock-request-id' },
            amount_total: 999,
            currency: 'usd',
            payment_intent: 'pi_mock',
            customer: 'cus_mock',
          },
        },
      })),
  },
};

// Mock Redis
const mockRedis = {
  connect: jest.fn().mockResolvedValue(),
  disconnect: jest.fn().mockResolvedValue(),
  get: jest.fn().mockResolvedValue(null),
  set: jest.fn().mockResolvedValue('OK'),
  del: jest.fn().mockResolvedValue(1),
  ping: jest.fn().mockResolvedValue('PONG'),
  sendCommand: jest.fn().mockResolvedValue(null),
  on: jest.fn(),
};

// Mock Bull Queue
const mockQueue = {
  add: jest.fn().mockResolvedValue({ id: 'job-1' }),
  process: jest.fn(),
  getWaiting: jest.fn().mockResolvedValue([]),
  getActive: jest.fn().mockResolvedValue([]),
  getCompleted: jest.fn().mockResolvedValue([]),
  getFailed: jest.fn().mockResolvedValue([]),
  getDelayed: jest.fn().mockResolvedValue([]),
  clean: jest.fn().mockResolvedValue(0),
};

// Mock Axios
const mockAxios = {
  post: jest.fn().mockResolvedValue({ data: { success: true } }),
  get: jest.fn().mockResolvedValue({ data: {} }),
};

module.exports = {
  mockS3,
  mockSES,
  mockStripe,
  mockRedis,
  mockQueue,
  mockAxios,
};
