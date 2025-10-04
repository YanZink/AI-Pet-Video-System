const localeManager = require('../../../shared-locales');
const { User } = require('../models');
const { SUPPORTED_LANGUAGES } = require('../utils/constants');

const i18nMiddleware = async (req, res, next) => {
  try {
    let language = SUPPORTED_LANGUAGES.EN; // Default fallback

    // Priority 1: User preference from database (if authenticated)
    if (req.user && req.user.language) {
      language = req.user.language;
    }
    // Priority 2: Accept-Language header
    else if (req.headers['accept-language']) {
      const acceptLanguage = req.headers['accept-language']
        .split(',')[0]
        .split('-')[0];
      if (localeManager.isLanguageSupported(acceptLanguage)) {
        language = acceptLanguage;
      }
    }
    // Priority 3: Query parameter (for testing/override)
    else if (
      req.query.lang &&
      localeManager.isLanguageSupported(req.query.lang)
    ) {
      language = req.query.lang;
    }

    // Ensure language is supported, fallback to English
    if (!localeManager.isLanguageSupported(language)) {
      language = SUPPORTED_LANGUAGES.EN;
    }

    // Add translation function to request object
    req.t = (key, variables = {}) => {
      return localeManager.translate(key, language, variables);
    };

    // Add language to request for other middleware to use
    req.language = language;

    // Add helper to check if translation exists (simple version)
    req.hasTranslation = (key) => {
      try {
        const translation = localeManager.translate(key, language);
        return translation !== key; // If translation exists and is different from key
      } catch (error) {
        return false;
      }
    };

    next();
  } catch (error) {
    console.error('i18n middleware error:', error);

    // Fallback translation function in case of error
    req.t = (key, variables = {}) => {
      let result = key;
      Object.keys(variables).forEach((variable) => {
        result = result.replace(
          new RegExp(`{${variable}}`, 'g'),
          variables[variable]
        );
      });
      return result;
    };

    req.language = SUPPORTED_LANGUAGES.EN;
    next();
  }
};

/**
 * Get user language preference
 * @param {string} userId - User ID
 * @returns {Promise<string>} Language code
 */
const getUserLanguage = async (userId) => {
  try {
    const user = await User.findByPk(userId);
    return user?.language || SUPPORTED_LANGUAGES.EN;
  } catch (error) {
    console.error('Error getting user language:', error);
    return SUPPORTED_LANGUAGES.EN;
  }
};

/**
 * Update user language preference
 * @param {string} userId - User ID
 * @param {string} language - Language code
 * @returns {Promise<boolean>} Success status
 */
const updateUserLanguage = async (userId, language) => {
  try {
    if (!localeManager.isLanguageSupported(language)) {
      throw new Error(`Unsupported language: ${language}`);
    }

    const user = await User.findByPk(userId);
    if (user) {
      await user.update({ language });
      return true;
    }
    return false;
  } catch (error) {
    console.error('Error updating user language:', error);
    return false;
  }
};

module.exports = {
  i18nMiddleware,
  getUserLanguage,
  updateUserLanguage,
  localeManager,
};
