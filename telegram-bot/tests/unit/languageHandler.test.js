const LanguageHandler = require('../../src/handlers/language');
const TelegramI18n = require('../../src/config/i18n');
const Keyboards = require('../../src/utils/keyboards');
const sessionService = require('../../src/services/sessionService');

// Mock dependencies
jest.mock('../../src/config/i18n');
jest.mock('../../src/utils/keyboards');
jest.mock('../../src/services/sessionService');

describe('LanguageHandler', () => {
  let languageHandler;
  let mockBot;

  beforeEach(() => {
    mockBot = {};
    languageHandler = new LanguageHandler(mockBot);
    jest.clearAllMocks();
  });

  describe('handleLanguageMenu', () => {
    test('should show language selection menu', async () => {
      const mockCtx = {
        from: { id: 123456 },
        reply: jest.fn(),
      };

      const mockSession = {
        user: { id: 'user-123' },
        language: 'en',
      };

      sessionService.getSession.mockResolvedValue(mockSession);

      // Mock the translation function properly
      const mockT = jest.fn((key) => {
        const translations = {
          'language.choose': '🌍 Choose your language:',
          'errors.something_wrong': 'Something went wrong',
        };
        return translations[key] || key;
      });
      TelegramI18n.getT.mockReturnValue(mockT);

      Keyboards.languageKeyboard.mockReturnValue({ inline_keyboard: [] });

      await languageHandler.handleLanguageMenu(mockCtx);

      expect(mockCtx.reply).toHaveBeenCalledWith('🌍 Choose your language:', {
        reply_markup: { inline_keyboard: [] },
      });
    });

    test('should handle missing session', async () => {
      const mockCtx = {
        from: { id: 123456 },
        reply: jest.fn(),
      };

      sessionService.getSession.mockResolvedValue(null);

      const mockT = jest.fn((key) => {
        if (key === 'errors.something_wrong') return 'Something went wrong';
        return key;
      });
      TelegramI18n.getT.mockReturnValue(mockT);

      await languageHandler.handleLanguageMenu(mockCtx);

      expect(mockCtx.reply).toHaveBeenCalledWith('Something went wrong');
    });
  });

  describe('handleLanguageSelection', () => {
    test('should update language for existing session', async () => {
      const mockCtx = {
        from: { id: 123456 },
        callbackQuery: { data: 'lang_ru' },
        reply: jest.fn(),
        telegram: { sendMessage: jest.fn() },
      };

      const mockSession = {
        user: { id: 'user-123' },
        language: 'en',
        state: 'menu',
      };

      sessionService.getSession.mockResolvedValue(mockSession);
      sessionService.saveSession.mockResolvedValue(true);

      const mockT = jest.fn((key, vars = {}) => {
        const translations = {
          'language.selected': '✅ Language changed to Russian',
          welcome_back: `Welcome back, ${vars.name || 'User'}!`,
          'errors.something_wrong': 'Something went wrong',
        };
        return translations[key] || key;
      });
      TelegramI18n.getT.mockReturnValue(mockT);

      Keyboards.mainMenu.mockReturnValue({ keyboard: [] });

      await languageHandler.handleLanguageSelection(mockCtx);

      expect(sessionService.saveSession).toHaveBeenCalledWith(123456, {
        ...mockSession,
        language: 'ru',
        state: 'menu',
      });
      expect(mockCtx.reply).toHaveBeenCalledWith(
        '✅ Language changed to Russian'
      );
    });

    test('should handle missing session', async () => {
      const mockCtx = {
        from: { id: 123456 },
        callbackQuery: { data: 'lang_en' },
        reply: jest.fn(),
      };

      sessionService.getSession.mockResolvedValue(null);

      const mockT = jest.fn((key) => {
        if (key === 'errors.something_wrong') return 'Something went wrong';
        return key;
      });
      TelegramI18n.getT.mockReturnValue(mockT);

      await languageHandler.handleLanguageSelection(mockCtx);

      expect(mockCtx.reply).toHaveBeenCalledWith('Something went wrong');
    });
  });
});
