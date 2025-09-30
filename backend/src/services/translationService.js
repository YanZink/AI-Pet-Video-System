const { sequelize } = require('../config/database');
const logger = require('../utils/logger');

/**
 * Translation Service for managing multi-language content
 * Provides fallback to English and caching for better performance
 */
class TranslationService {
  constructor() {
    this.cache = new Map();
    this.cacheTtl = 5 * 60 * 1000; // 5 minutes cache
  }

  /**
   * Get translation from database with caching
   * @param {string} entityType - Entity type (template, system, email, notification)
   * @param {string} entityId - Entity ID (null for system texts)
   * @param {string} key - Translation key
   * @param {string} language - Language code
   * @returns {Promise<string|null>} Translated text or null if not found
   */
  async getTranslation(entityType, entityId, key, language = 'en') {
    const cacheKey = `${entityType}:${entityId}:${key}:${language}`;

    // Check cache first
    const cached = this.getFromCache(cacheKey);
    if (cached !== null) {
      return cached;
    }

    try {
      const [results] = await sequelize.query(
        `SELECT translation_text 
         FROM translations 
         WHERE entity_type = :entityType 
           AND (entity_id = :entityId OR (:entityId IS NULL AND entity_id IS NULL))
           AND translation_key = :key 
           AND language = :language
         LIMIT 1`,
        {
          replacements: { entityType, entityId, key, language },
          type: sequelize.QueryTypes.SELECT,
        }
      );

      let translation = results?.translation_text || null;

      // Fallback to English if translation not found and language is not English
      if (!translation && language !== 'en') {
        const [enResults] = await sequelize.query(
          `SELECT translation_text 
           FROM translations 
           WHERE entity_type = :entityType 
             AND (entity_id = :entityId OR (:entityId IS NULL AND entity_id IS NULL))
             AND translation_key = :key 
             AND language = 'en'
           LIMIT 1`,
          {
            replacements: { entityType, entityId, key },
            type: sequelize.QueryTypes.SELECT,
          }
        );

        translation = enResults?.translation_text || null;
      }

      // Cache the result
      this.setToCache(cacheKey, translation);

      return translation;
    } catch (error) {
      logger.error('Translation service error:', {
        entityType,
        entityId,
        key,
        language,
        error: error.message,
      });
      return null;
    }
  }

  /**
   * Set translation in database
   * @param {string} entityType - Entity type
   * @param {string} entityId - Entity ID
   * @param {string} key - Translation key
   * @param {string} language - Language code
   * @param {string} text - Translated text
   */
  async setTranslation(entityType, entityId, key, language, text) {
    try {
      await sequelize.query(
        `INSERT INTO translations (entity_type, entity_id, translation_key, language, translation_text)
         VALUES (:entityType, :entityId, :key, :language, :text)
         ON CONFLICT (entity_type, entity_id, translation_key, language) 
         DO UPDATE SET translation_text = EXCLUDED.translation_text, updated_at = NOW()`,
        {
          replacements: { entityType, entityId, key, language, text },
        }
      );

      // Clear cache for this translation
      const cacheKey = `${entityType}:${entityId}:${key}:${language}`;
      this.cache.delete(cacheKey);

      logger.info('Translation updated', {
        entityType,
        entityId,
        key,
        language,
      });
    } catch (error) {
      logger.error('Error setting translation:', error);
      throw new Error('Failed to set translation');
    }
  }

  /**
   * Get multiple translations at once
   * @param {string} entityType - Entity type
   * @param {string} entityId - Entity ID
   * @param {Array} keys - Array of translation keys
   * @param {string} language - Language code
   * @returns {Promise<object>} Object with key-value translations
   */
  async getTranslations(entityType, entityId, keys, language = 'en') {
    const translations = {};

    await Promise.all(
      keys.map(async (key) => {
        translations[key] = await this.getTranslation(
          entityType,
          entityId,
          key,
          language
        );
      })
    );

    return translations;
  }

  /**
   * Get system translation (entityType = 'system')
   * @param {string} key - Translation key
   * @param {string} language - Language code
   * @returns {Promise<string|null>} Translated text
   */
  async getSystemTranslation(key, language = 'en') {
    return this.getTranslation('system', null, key, language);
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
      this.cache.delete(key); // Remove expired cache
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
   * Clear entire cache (useful for testing or after bulk updates)
   */
  clearCache() {
    this.cache.clear();
  }

  /**
   * Preload common translations to cache
   * @param {string} language - Language code
   */
  async preloadCommonTranslations(language = 'en') {
    const commonKeys = ['welcome', 'welcome_back', 'menu', 'errors'];

    await Promise.all(
      commonKeys.map(async (key) => {
        await this.getSystemTranslation(key, language);
      })
    );
  }
}

// Create singleton instance
const translationService = new TranslationService();

module.exports = translationService;
