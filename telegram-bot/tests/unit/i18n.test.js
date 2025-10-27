const TelegramI18n = require('../../src/config/i18n');

// Mock shared-locales with factory function
jest.mock('../../../shared-locales', () => {
  const mockTranslate = jest.fn();
  return {
    translate: mockTranslate,
  };
});

const localeManager = require('../../../shared-locales');

describe('TelegramI18n', () => {
  beforeEach(() => {
    localeManager.translate.mockClear();
  });

  describe('getT', () => {
    test('should return a translation function', () => {
      const t = TelegramI18n.getT('en');
      expect(typeof t).toBe('function');
    });

    test('should call localeManager.translate with correct parameters', () => {
      localeManager.translate.mockReturnValue('Translated text');

      const t = TelegramI18n.getT('en');
      const result = t('welcome', { name: 'Test' });

      expect(localeManager.translate).toHaveBeenCalledWith(
        'common.welcome',
        'en',
        { name: 'Test' }
      );
      expect(result).toBe('Translated text');
    });

    test('should return key when translation equals original key', () => {
      localeManager.translate.mockReturnValue('common.nonexistent.key');

      const t = TelegramI18n.getT('en');
      const result = t('nonexistent.key');

      expect(result).toBe('nonexistent.key');
    });

    test('should handle different languages', () => {
      localeManager.translate.mockReturnValue('Привет');

      const t = TelegramI18n.getT('ru');
      const result = t('welcome');

      expect(localeManager.translate).toHaveBeenCalledWith(
        'common.welcome',
        'ru',
        {}
      );
      expect(result).toBe('Привет');
    });
  });

  describe('translate', () => {
    test('should translate directly', () => {
      localeManager.translate.mockReturnValue('Direct translation');

      const result = TelegramI18n.translate('welcome', 'fr', { name: 'User' });

      expect(localeManager.translate).toHaveBeenCalledWith(
        'common.welcome',
        'fr',
        { name: 'User' }
      );
      expect(result).toBe('Direct translation');
    });

    test('should use default language when not specified', () => {
      localeManager.translate.mockReturnValue('Default translation');

      const result = TelegramI18n.translate('welcome');

      expect(localeManager.translate).toHaveBeenCalledWith(
        'common.welcome',
        'en',
        {}
      );
      expect(result).toBe('Default translation');
    });
  });
});
