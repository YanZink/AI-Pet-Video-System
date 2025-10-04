const localeManager = require('../../../shared-locales');

class TelegramI18n {
  /**
   * Get translation function for specific language
   */
  static getT(language = 'en') {
    return (key, variables = {}) => {
      return localeManager.translate(key, language, variables);
    };
  }

  /**
   * Check if language is supported
   */
  static isLanguageSupported(language) {
    return localeManager.isLanguageSupported(language);
  }

  /**
   * Get all supported languages
   */
  static getSupportedLanguages() {
    return localeManager.getSupportedLanguages();
  }

  /**
   * Get translation with fallback for bot-specific keys
   */
  static translate(key, language = 'en', variables = {}) {
    // Try telegram namespace first
    let translation = localeManager.translate(
      `telegram.${key}`,
      language,
      variables
    );

    if (translation === `telegram.${key}`) {
      // Fallback to common namespace
      translation = localeManager.translate(
        `common.${key}`,
        language,
        variables
      );
    }

    if (translation === `common.${key}`) {
      // Final fallback - return key without namespace
      return this.fallbackTranslation(key, variables);
    }

    return translation;
  }

  /**
   * Simple fallback translation
   */
  static fallbackTranslation(key, variables = {}) {
    let result = key;
    Object.keys(variables).forEach((variable) => {
      result = result.replace(
        new RegExp(`{${variable}}`, 'g'),
        variables[variable]
      );
    });
    return result;
  }
}

module.exports = TelegramI18n;
