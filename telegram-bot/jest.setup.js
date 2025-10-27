process.env.NODE_ENV = 'test';
process.env.TELEGRAM_BOT_TOKEN = 'test-bot-token';
process.env.API_BASE_URL = 'http://localhost:3000/api/v1';
process.env.TELEGRAM_BOT_API_KEY = 'test-api-key';
process.env.API_TIMEOUT = '30000';
process.env.MAX_PHOTOS_PER_REQUEST = '10';
process.env.PHOTO_SIZE_LIMIT = '10485760';
process.env.VIDEO_PRICE_STARS = '1000';

// Mock shared-locales globally to prevent actual file loading
jest.mock('../shared-locales', () => ({
  translate: jest.fn((key, lang, vars = {}) => {
    let result = `[${key}]`;
    if (vars && typeof vars === 'object') {
      Object.entries(vars).forEach(([varKey, varValue]) => {
        result = result.replace(`{${varKey}}`, String(varValue));
      });
    }
    return result;
  }),
  isLanguageSupported: jest.fn(() => true),
  getSupportedLanguages: jest.fn(() => ['en', 'ru']),
}));

jest.mock('axios', () => {
  const mockAxiosInstance = {
    post: jest.fn(),
    get: jest.fn(),
    put: jest.fn(),
    interceptors: {
      request: {
        use: jest.fn(),
      },
      response: {
        use: jest.fn(),
      },
    },
  };

  return {
    create: jest.fn(() => mockAxiosInstance),
    put: jest.fn(),
  };
});

// Mock Redis globally
jest.mock('./src/config/redis', () => ({
  redisClient: {
    setEx: jest.fn(),
    get: jest.fn(),
    del: jest.fn(),
  },
  connectRedis: jest.fn(() => Promise.resolve(true)),
  closeRedisConnections: jest.fn(() => Promise.resolve()),
}));

// Mock Telegraf with proper structure
jest.mock('telegraf', () => {
  const mockContext = {
    from: { id: 123456, first_name: 'Test', username: 'testuser' },
    reply: jest.fn(),
    editMessageText: jest.fn(),
    telegram: {
      getFileLink: jest.fn(),
      sendMessage: jest.fn(),
      callApi: jest.fn(),
    },
    callbackQuery: {
      data: 'test_data',
    },
    message: {
      photo: [{ file_id: 'photo1', file_size: 1000000 }],
      document: {
        file_id: 'doc1',
        file_size: 1000000,
        mime_type: 'image/jpeg',
      },
      successful_payment: {},
    },
    answerPreCheckoutQuery: jest.fn(),
  };

  return {
    Telegraf: jest.fn().mockImplementation(() => ({
      start: jest.fn(),
      launch: jest.fn(),
      stop: jest.fn(),
      telegram: {
        getFileLink: jest.fn(() =>
          Promise.resolve({ href: 'https://example.com/file' })
        ),
        sendMessage: jest.fn(),
        callApi: jest.fn(),
      },
      on: jest.fn(),
      action: jest.fn(),
      hears: jest.fn(),
      catch: jest.fn(),
    })),
    Context: jest.fn(() => mockContext),
  };
});

// Suppress console errors in tests
global.console.error = jest.fn();
global.console.warn = jest.fn();
