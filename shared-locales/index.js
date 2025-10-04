const fs = require('fs');
const path = require('path');

/**
 * Unified Locale Manager for both backend and bot
 * Follows the structure from the article with namespaces
 */
class LocaleManager {
  constructor() {
    this.locales = new Map();
    this.defaultLanguage = 'en';
    this.loadLocales();
  }

  /**
   * Load all locale files from namespace directories
   */
  loadLocales() {
    try {
      const localesDir = __dirname;

      // Get all language directories
      const languages = fs.readdirSync(localesDir).filter((item) => {
        const itemPath = path.join(localesDir, item);
        return fs.statSync(itemPath).isDirectory();
      });

      languages.forEach((language) => {
        const languageDir = path.join(localesDir, language);
        const translations = {};

        // Load all JSON files in the language directory
        const files = fs.readdirSync(languageDir);
        files.forEach((file) => {
          if (file.endsWith('.json')) {
            const namespace = path.basename(file, '.json');
            const filePath = path.join(languageDir, file);

            try {
              const content = fs.readFileSync(filePath, 'utf8');
              translations[namespace] = JSON.parse(content);
            } catch (error) {
              console.error(`Failed to load locale file ${filePath}:`, error);
            }
          }
        });

        this.locales.set(language, translations);
        console.log(`✅ Loaded locale: ${language}`, {
          namespaces: Object.keys(translations),
        });
      });
    } catch (error) {
      console.error('Failed to load locales:', error);
    }
  }

  /**
   * Translate a key with variables
   * @param {string} key - Format: "namespace.key" or "namespace.nested.key"
   * @param {string} language - Language code
   * @param {object} variables - Variables to replace
   * @returns {string} Translated text
   */
  translate(key, language = 'en', variables = {}) {
    // Split key into namespace and the rest
    const [namespace, ...keyParts] = key.split('.');
    const fullKey = keyParts.join('.');

    if (!namespace || !fullKey) {
      return this.fallbackTranslation(key, variables);
    }

    // Get locale for requested language or fallback to default
    const locale =
      this.locales.get(language) || this.locales.get(this.defaultLanguage);
    if (!locale || !locale[namespace]) {
      return this.fallbackTranslation(key, variables);
    }

    // Navigate through nested keys
    let value = locale[namespace];
    const keys = fullKey.split('.');

    for (const k of keys) {
      if (value && typeof value === 'object' && k in value) {
        value = value[k];
      } else {
        // Key not found, try fallback to default language
        if (language !== this.defaultLanguage) {
          return this.translate(key, this.defaultLanguage, variables);
        }
        return this.fallbackTranslation(key, variables);
      }
    }

    if (typeof value === 'string') {
      return this.replaceVariables(value, variables);
    }

    return this.fallbackTranslation(key, variables);
  }

  /**
   * Replace variables in text like {variable}
   */
  replaceVariables(text, variables) {
    let result = text;
    for (const [key, value] of Object.entries(variables)) {
      const placeholder = `{${key}}`;
      result = result.replace(new RegExp(placeholder, 'g'), String(value));
    }
    return result;
  }

  /**
   * Fallback when translation not found
   */
  fallbackTranslation(key, variables) {
    console.warn(`Translation not found for key: ${key}`);
    return this.replaceVariables(key, variables);
  }

  /**
   * Check if language is supported
   */
  isLanguageSupported(language) {
    return this.locales.has(language);
  }

  /**
   * Get list of supported languages
   */
  getSupportedLanguages() {
    return Array.from(this.locales.keys());
  }

  /**
   * Get all translations for a language (for debugging)
   */
  getLocale(language) {
    return this.locales.get(language) || {};
  }

  /**
   * Reload locales (for development)
   */
  reloadLocales() {
    this.locales.clear();
    this.loadLocales();
  }
}

// Create singleton instance
const localeManager = new LocaleManager();

module.exports = localeManager;
