const localeManager = require('../locales');

class I18nService {
  constructor() {
    this.cache = new Map();
    this.cacheTtl = 5 * 60 * 1000; // 5 minutes cache
  }

  /**
   * Get translation using localeManager (similar to backend)
   * @param {string} key - Translation key (e.g., 'menu.create_video')
   * @param {string} language - Language code
   * @param {object} variables - Variables to replace
   * @returns {Promise<string>} Translated text
   */
  async translate(key, language = 'en', variables = {}) {
    const cacheKey = `${key}:${language}:${JSON.stringify(variables)}`;

    // Check cache first
    const cached = this.getFromCache(cacheKey);
    if (cached) {
      return cached;
    }

    try {
      // Use localeManager similar to backend
      const translation = localeManager.translate(key, language, variables);

      // Cache the result
      this.setToCache(cacheKey, translation);

      return translation;
    } catch (error) {
      console.error('Translation error:', error);
      // Fallback: return key with variables replaced
      return this.fallbackTranslation(key, variables);
    }
  }

  /**
   * Replace variables in translation string
   * @param {string} text - Text with variables
   * @param {object} variables - Variables to replace
   * @returns {string} Text with variables replaced
   */
  replaceVariables(text, variables) {
    let result = text;

    for (const [key, value] of Object.entries(variables)) {
      const placeholder = `{${key}}`;
      result = result.replace(new RegExp(placeholder, 'g'), value);
    }

    return result;
  }

  /**
   * Fallback translation when no translation found
   * @param {string} key - Translation key
   * @param {object} variables - Variables to replace
   * @returns {string} Fallback text
   */
  fallbackTranslation(key, variables) {
    return this.replaceVariables(key, variables);
  }

  /**
   * Cache management
   */
  getFromCache(key) {
    const cached = this.cache.get(key);
    if (cached && Date.now() - cached.timestamp < this.cacheTtl) {
      return cached.value;
    }
    if (cached) {
      this.cache.delete(key);
    }
    return null;
  }

  setToCache(key, value) {
    this.cache.set(key, {
      value,
      timestamp: Date.now(),
    });
  }

  /**
   * Clear cache
   */
  clearCache() {
    this.cache.clear();
  }

  /**
   * Check if language is supported
   * @param {string} language - Language code
   * @returns {boolean} True if supported
   */
  isLanguageSupported(language) {
    return localeManager.isLanguageSupported(language);
  }

  /**
   * Get list of supported languages
   * @returns {string[]} Array of supported language codes
   */
  getSupportedLanguages() {
    return localeManager.getSupportedLanguages();
  }
}

// Create singleton instance
const i18nService = new I18nService();

module.exports = i18nService;
