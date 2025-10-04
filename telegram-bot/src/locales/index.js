const fs = require('fs');
const path = require('path');
const logger = require('../utils/logger');

/**
 * Locale Manager for Telegram Bot
 * Provides translation functionality using JSON files
 * Similar to backend implementation
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

            console.log(`Loaded locale: ${language}`, {
              keys: Object.keys(translations).length,
            });
          } catch (error) {
            console.error(`Failed to load locale file ${file}:`, error);
          }
        }
      });

      if (!this.locales.has(this.defaultLanguage)) {
        console.warn(
          `Default language ${this.defaultLanguage} not found in locales`
        );
      }
    } catch (error) {
      console.error('Failed to load locales:', error);
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
    const translation = this.getTranslationFromLocale(key, language);

    if (!translation) {
      // Fallback to English if translation not found and language is not English
      if (language !== 'en') {
        const fallbackTranslation = this.getTranslationFromLocale(key, 'en');
        if (fallbackTranslation) {
          return this.replaceVariables(fallbackTranslation, variables);
        }
      }

      // If no translation found, return the key
      return key;
    }

    return this.replaceVariables(translation, variables);
  }

  /**
   * Get translation from specific locale
   * @param {string} key - Translation key
   * @param {string} language - Language code
   * @returns {string|null} Translation or null if not found
   */
  getTranslationFromLocale(key, language) {
    const locale = this.locales.get(language);
    if (!locale) {
      return null;
    }

    const keys = key.split('.');
    let value = locale;

    for (const k of keys) {
      if (value && typeof value === 'object' && k in value) {
        value = value[k];
      } else {
        return null;
      }
    }

    return typeof value === 'string' ? value : null;
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
   * Check if language is supported
   * @param {string} language - Language code
   * @returns {boolean} True if supported
   */
  isLanguageSupported(language) {
    return this.locales.has(language);
  }

  /**
   * Get list of supported languages
   * @returns {string[]} Array of supported language codes
   */
  getSupportedLanguages() {
    return Array.from(this.locales.keys());
  }

  /**
   * Get all translations for a language
   * @param {string} language - Language code
   * @returns {object|null} All translations or null if not found
   */
  getLocale(language) {
    return this.locales.get(language) || null;
  }
}

// Create singleton instance
const localeManager = new LocaleManager();

module.exports = localeManager;
