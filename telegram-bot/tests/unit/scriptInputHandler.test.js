const ScriptInputHandler = require('../../src/handlers/scriptInput');
const TelegramI18n = require('../../src/config/i18n');
const Keyboards = require('../../src/utils/keyboards');
const sessionService = require('../../src/services/sessionService');

// Mock dependencies
jest.mock('../../src/config/i18n');
jest.mock('../../src/utils/keyboards');
jest.mock('../../src/services/sessionService');

describe('ScriptInputHandler', () => {
  let scriptInputHandler;
  let mockBot;

  beforeEach(() => {
    mockBot = {};
    scriptInputHandler = new ScriptInputHandler(mockBot);
    jest.clearAllMocks();
  });

  describe('handleScriptSkip', () => {
    test('should skip script and proceed to payment', async () => {
      const mockCtx = {
        from: { id: 123456 },
        editMessageText: jest.fn(),
        reply: jest.fn(),
      };

      const mockSession = {
        token: 'jwt-token',
        user: { id: 'user-123', language: 'en' },
        uploadData: {
          photos: [{ telegramFileId: 'photo1' }],
          uploadedPhotos: ['key1'],
          script: null,
        },
      };

      sessionService.getSession.mockResolvedValue(mockSession);
      sessionService.saveSession.mockResolvedValue(true);

      const mockT = jest.fn((key) => {
        if (key === 'script.skipped') return '✅ Script skipped';
        return key;
      });
      TelegramI18n.getT.mockReturnValue(mockT);

      // Mock the payment confirmation method
      scriptInputHandler.showPaymentConfirmation = jest.fn();

      await scriptInputHandler.handleScriptSkip(mockCtx);

      expect(sessionService.saveSession).toHaveBeenCalledWith(123456, {
        ...mockSession,
        state: 'confirming_payment',
        uploadData: {
          ...mockSession.uploadData,
          script: null,
        },
      });
      expect(mockCtx.editMessageText).toHaveBeenCalledWith('✅ Script skipped');
      expect(scriptInputHandler.showPaymentConfirmation).toHaveBeenCalledWith(
        mockCtx,
        mockSession
      );
    });
  });

  describe('handleScriptInputStart', () => {
    test('should start script input', async () => {
      const mockCtx = {
        from: { id: 123456 },
        editMessageText: jest.fn(),
        reply: jest.fn(), // Add reply method
      };

      const mockSession = {
        token: 'jwt-token',
        user: { id: 'user-123', language: 'en' },
      };

      sessionService.getSession.mockResolvedValue(mockSession);
      sessionService.saveSession.mockResolvedValue(true);

      const mockT = jest.fn((key) => {
        if (key === 'script.request')
          return '✍️ Describe what kind of video you want (optional)';
        if (key === 'errors.something_wrong') return 'Something went wrong';
        return key;
      });
      TelegramI18n.getT.mockReturnValue(mockT);

      await scriptInputHandler.handleScriptInputStart(mockCtx);

      expect(sessionService.saveSession).toHaveBeenCalledWith(123456, {
        ...mockSession,
        state: 'entering_script',
      });

      expect(mockCtx.reply).toHaveBeenCalledWith(
        '✍️ Describe what kind of video you want (optional)',
        {
          reply_markup: { remove_keyboard: true },
        }
      );
    });
  });
});
