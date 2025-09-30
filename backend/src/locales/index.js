const fs = require('fs');
const path = require('path');
const logger = require('../utils/logger');

/**
 * Locale Manager for loading and managing translation files
 * Provides file-based translations with fallback support
 */
class LocaleManager {
  constructor() {
    this.locales = new Map();
    this.defaultLanguage = 'en';
    this.loadLocales();
  }

  /**
   * Load all locale files from the locales directory
   */
  loadLocales() {
    try {
      const localesDir = __dirname;
      const files = fs.readdirSync(localesDir);

      files.forEach((file) => {
        if (file.endsWith('.json')) {
          const language = path.basename(file, '.json');
          const filePath = path.join(localesDir, file);

          try {
            const content = fs.readFileSync(filePath, 'utf8');
            const translations = JSON.parse(content);
            this.locales.set(language, translations);

            logger.info(`Loaded locale: ${language}`, {
              keys: Object.keys(translations).length,
            });
          } catch (error) {
            logger.error(`Failed to load locale file ${file}:`, error);
          }
        }
      });

      if (!this.locales.has(this.defaultLanguage)) {
        logger.warn(
          `Default language ${this.defaultLanguage} not found in locales`
        );
      }
    } catch (error) {
      logger.error('Failed to load locales:', error);
    }
  }

  /**
   * Get translation for a specific key and language
   * @param {string} key - Translation key (e.g., 'menu.create_video')
   * @param {string} language - Language code
   * @param {object} variables - Variables to replace in the translation
   * @returns {string} Translated text
   */
  translate(key, language = 'en', variables = {}) {
    // Fallback chain: requested language -> default language -> key itself
    const localesToTry = [language, this.defaultLanguage];

    for (const locale of localesToTry) {
      const translation = this.getTranslationFromLocale(key, locale);
      if (translation) {
        return this.replaceVariables(translation, variables);
      }
    }

    // If no translation found, return the key as fallback
    logger.warn(`Translation not found for key: ${key}, language: ${language}`);
    return key;
  }

  /**
   * Get translation from specific locale
   * @param {string} key - Dot notation key
   * @param {string} language - Language code
   * @returns {string|null} Translation or null if not found
   */
  getTranslationFromLocale(key, language) {
    const locale = this.locales.get(language);
    if (!locale) return null;

    const keys = key.split('.');
    let current = locale;

    for (const k of keys) {
      if (current && typeof current === 'object' && k in current) {
        current = current[k];
      } else {
        return null;
      }
    }

    return typeof current === 'string' ? current : null;
  }

  /**
   * Replace variables in translation text
   * @param {string} text - Text with variables like {name}
   * @param {object} variables - Object with variable values
   * @returns {string} Text with replaced variables
   */
  replaceVariables(text, variables) {
    return text.replace(/{(\w+)}/g, (match, variable) => {
      return variables[variable] !== undefined ? variables[variable] : match;
    });
  }

  /**
   * Get all translations for a language
   * @param {string} language - Language code
   * @returns {object} All translations for the language
   */
  getLocale(language) {
    return (
      this.locales.get(language) || this.locales.get(this.defaultLanguage) || {}
    );
  }

  /**
   * Check if a language is supported
   * @param {string} language - Language code
   * @returns {boolean} True if language is supported
   */
  isLanguageSupported(language) {
    return this.locales.has(language);
  }

  /**
   * Get list of supported languages
   * @returns {Array} Array of supported language codes
   */
  getSupportedLanguages() {
    return Array.from(this.locales.keys());
  }

  /**
   * Reload locales from files (useful for development)
   */
  reloadLocales() {
    this.locales.clear();
    this.loadLocales();
  }
}

// Create singleton instance
const localeManager = new LocaleManager();

module.exports = localeManager;
