const Keyboards = require('../../src/utils/keyboards');

// Create a proper mock for the locale manager
jest.mock('../../../shared-locales', () => {
  // Mock translations that match your common.json structure
  const mockTranslations = {
    'common.menu.create_video': '🎬 Create Video',
    'common.menu.my_videos': '📋 My Videos',
    'common.menu.status': '📊 Status',
    'common.menu.language': '🌍 Language',
    'common.menu.help': '❓ Help',
    'common.photos.continue': 'Continue with {count} photos',
    'common.script.skip': 'Skip script',
    'common.script.continue': 'Continue',
    'common.payment.confirm': '💳 Pay {price} stars',
    'common.payment.cancel': 'Cancel',
    'common.buttons.menu': '🏠 Main Menu',
    'common.buttons.cancel': 'Cancel',
    'common.buttons.retry': '🔄 Retry',
    'common.buttons.back': '⬅️ Back',
  };

  return {
    translate: jest.fn((key, language = 'en', variables = {}) => {
      // Return mock translation or the key itself if not found
      let translation = mockTranslations[key];

      if (!translation) {
        console.warn(`Mock translation not found for key: ${key}`);
        translation = key;
      }

      // Replace variables
      if (variables && typeof variables === 'object') {
        Object.entries(variables).forEach(([varKey, varValue]) => {
          const placeholder = `{${varKey}}`;
          translation = translation.replace(
            new RegExp(placeholder, 'g'),
            String(varValue)
          );
        });
      }

      return translation;
    }),

    // Mock other methods that might be used
    isLanguageSupported: jest.fn(() => true),
    getSupportedLanguages: jest.fn(() => ['en', 'ru']),
  };
});

describe('Keyboards', () => {
  let localeManager;

  beforeEach(() => {
    // Get the mocked instance
    localeManager = require('../../../shared-locales');
    jest.clearAllMocks();
  });

  describe('progressBar', () => {
    test('should generate progress bar with correct percentage', () => {
      const result = Keyboards.progressBar(5, 10);
      expect(result).toContain('50%');
      expect(result).toContain('▓');
      expect(result).toContain('░');
    });
  });

  describe('languageKeyboard', () => {
    test('should create language selection keyboard', () => {
      const keyboard = Keyboards.languageKeyboard();

      expect(keyboard).toHaveProperty('inline_keyboard');
      expect(keyboard.inline_keyboard).toHaveLength(1);
      expect(keyboard.inline_keyboard[0]).toHaveLength(2);
      expect(keyboard.inline_keyboard[0][0].text).toBe('🇺🇸 English');
      expect(keyboard.inline_keyboard[0][1].text).toBe('🇷🇺 Русский');
    });
  });

  describe('mainMenu', () => {
    test('should create main menu keyboard with correct structure', () => {
      const keyboard = Keyboards.mainMenu('en');

      expect(keyboard).toHaveProperty('keyboard');
      expect(keyboard).toHaveProperty('resize_keyboard');
      expect(keyboard.resize_keyboard).toBe(true);

      // Verify that translate was called with correct keys
      expect(localeManager.translate).toHaveBeenCalledWith(
        'common.menu.create_video',
        'en',
        {}
      );
      expect(localeManager.translate).toHaveBeenCalledWith(
        'common.menu.my_videos',
        'en',
        {}
      );
      expect(localeManager.translate).toHaveBeenCalledWith(
        'common.menu.status',
        'en',
        {}
      );
    });

    test('should have correct keyboard structure', () => {
      const keyboard = Keyboards.mainMenu('en');

      expect(keyboard.keyboard).toHaveLength(3);
      expect(keyboard.keyboard[0]).toHaveLength(1);
      expect(keyboard.keyboard[1]).toHaveLength(2);
      expect(keyboard.keyboard[2]).toHaveLength(2);
    });
  });

  describe('photoContinue', () => {
    test('should create continue button with photo count', () => {
      const keyboard = Keyboards.photoContinue(3, 'en');

      expect(keyboard).toHaveProperty('inline_keyboard');
      expect(keyboard.inline_keyboard).toHaveLength(1);
      expect(keyboard.inline_keyboard[0]).toHaveLength(1);
      expect(keyboard.inline_keyboard[0][0].callback_data).toBe(
        'photos_continue'
      );

      // Verify translate was called correctly
      expect(localeManager.translate).toHaveBeenCalledWith(
        'common.photos.continue',
        'en',
        { count: 3 }
      );
    });
  });

  describe('scriptOptions', () => {
    test('should create script options keyboard', () => {
      const keyboard = Keyboards.scriptOptions('en');

      expect(keyboard.inline_keyboard[0][0].callback_data).toBe('script_skip');
      expect(keyboard.inline_keyboard[1][0].callback_data).toBe('script_input');

      expect(localeManager.translate).toHaveBeenCalledWith(
        'common.script.skip',
        'en'
      );
    });
  });

  describe('paymentConfirm', () => {
    test('should create payment confirmation keyboard', () => {
      const keyboard = Keyboards.paymentConfirm('100', 'en');

      expect(keyboard.inline_keyboard[0][0].callback_data).toBe(
        'payment_confirm'
      );
      expect(keyboard.inline_keyboard[1][0].callback_data).toBe(
        'payment_cancel'
      );

      expect(localeManager.translate).toHaveBeenCalledWith(
        'common.payment.confirm',
        'en',
        { price: '100' }
      );
    });
  });

  describe('navigation keyboards', () => {
    test('backToMenu should call translate with correct key', () => {
      Keyboards.backToMenu('en');
      expect(localeManager.translate).toHaveBeenCalledWith(
        'common.buttons.menu',
        'en'
      );
    });

    test('cancelButton should call translate with correct key', () => {
      Keyboards.cancelButton('en');
      expect(localeManager.translate).toHaveBeenCalledWith(
        'common.buttons.cancel',
        'en'
      );
    });
  });
});
