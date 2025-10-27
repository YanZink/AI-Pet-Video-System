const StartHandler = require('../../src/handlers/start');
const TelegramI18n = require('../../src/config/i18n');
const Keyboards = require('../../src/utils/keyboards');
const sessionService = require('../../src/services/sessionService');

// Mock dependencies
jest.mock('../../src/config/i18n');
jest.mock('../../src/utils/keyboards');
jest.mock('../../src/services/sessionService');

describe('StartHandler', () => {
  let startHandler;
  let mockBot;
  let mockApiService;

  beforeEach(() => {
    mockBot = {};
    mockApiService = {
      registerTelegramUser: jest.fn(),
    };

    startHandler = new StartHandler(mockBot, mockApiService);
    jest.clearAllMocks();
  });

  describe('handleStart', () => {
    test('should handle new user registration', async () => {
      const mockCtx = {
        from: {
          id: 123456,
          first_name: 'Test',
          username: 'testuser',
        },
        reply: jest.fn(),
      };

      const mockApiResponse = {
        success: true,
        user: { id: 'user-123', language: 'en' },
        token: 'jwt-token',
        isNewUser: true,
      };

      mockApiService.registerTelegramUser.mockResolvedValue(mockApiResponse);
      TelegramI18n.getT.mockReturnValue((key) => key);
      sessionService.saveSession.mockResolvedValue(true);

      await startHandler.handleStart(mockCtx);

      expect(mockApiService.registerTelegramUser).toHaveBeenCalledWith(
        mockCtx.from
      );
      expect(sessionService.saveSession).toHaveBeenCalledWith(123456, {
        token: 'jwt-token',
        user: mockApiResponse.user,
        language: 'en',
        state: 'start',
        uploadData: {
          photos: [],
          uploadedPhotos: [],
          script: null,
          currentRequestId: null,
        },
      });
      expect(mockCtx.reply).toHaveBeenCalledWith('welcome', {
        reply_markup: Keyboards.languageKeyboard(),
      });
    });

    test('should handle existing user', async () => {
      const mockCtx = {
        from: {
          id: 123456,
          first_name: 'Test',
          username: 'testuser',
        },
        reply: jest.fn(),
      };

      const mockApiResponse = {
        success: true,
        user: { id: 'user-123', language: 'en' },
        token: 'jwt-token',
        isNewUser: false,
      };

      mockApiService.registerTelegramUser.mockResolvedValue(mockApiResponse);
      TelegramI18n.getT.mockReturnValue((key, vars) =>
        key === 'welcome_back' ? `Welcome back, ${vars.name}!` : key
      );
      sessionService.saveSession.mockResolvedValue(true);

      await startHandler.handleStart(mockCtx);

      expect(mockCtx.reply).toHaveBeenCalledWith('Welcome back, Test!', {
        reply_markup: Keyboards.mainMenu('en'),
      });
    });

    test('should handle API error', async () => {
      const mockCtx = {
        from: { id: 123456 },
        reply: jest.fn(),
      };

      mockApiService.registerTelegramUser.mockResolvedValue({
        success: false,
        error: 'API error',
      });
      TelegramI18n.getT.mockReturnValue((key) => key);

      await startHandler.handleStart(mockCtx);

      expect(mockCtx.reply).toHaveBeenCalledWith('errors.something_wrong');
    });

    test('should handle unexpected errors', async () => {
      const mockCtx = {
        from: { id: 123456 },
        reply: jest.fn(),
      };

      mockApiService.registerTelegramUser.mockRejectedValue(
        new Error('Network error')
      );
      TelegramI18n.getT.mockReturnValue((key) => key);

      await startHandler.handleStart(mockCtx);

      expect(mockCtx.reply).toHaveBeenCalledWith('errors.something_wrong');
    });
  });
});
