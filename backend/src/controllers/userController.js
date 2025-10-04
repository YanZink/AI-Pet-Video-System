const { User } = require('../models');
const { generateToken } = require('../middleware/auth');
const { ERROR_CODES } = require('../utils/constants');
const { createError, asyncHandler } = require('../middleware/errorHandler');
const localeManager = require('../../../shared-locales');
const logger = require('../utils/logger');

class UserController {
  createUser = asyncHandler(async (req, res) => {
    const userData = req.validatedBody;

    let existingUser = null;

    if (userData.telegram_id) {
      existingUser = await User.findByTelegramId(userData.telegram_id);
    } else if (userData.email) {
      existingUser = await User.findByEmail(userData.email);
    }

    if (existingUser) {
      throw createError(
        req.t('auth.user_exists', { defaultValue: 'User already exists' }),
        409,
        ERROR_CODES.DUPLICATE_ERROR
      );
    }

    const user = await User.create({
      ...userData,
      password_hash: userData.password,
    });

    const token = generateToken(user);

    logger.info('New user created', {
      userId: user.id,
      method: userData.telegram_id ? 'telegram' : 'email',
      language: user.language,
    });

    res.status(201).json({
      message: req.t('auth.created_success', {
        defaultValue: 'User created successfully',
      }),
      user: user.getPublicData(),
      token,
    });
  });

  loginUser = asyncHandler(async (req, res) => {
    const { email, password } = req.validatedBody;

    const user = await User.findByEmail(email);
    if (!user) {
      throw createError(
        req.t('auth.invalid_credentials', {
          defaultValue: 'Invalid credentials',
        }),
        401,
        ERROR_CODES.AUTHENTICATION_ERROR
      );
    }

    const isValidPassword = await user.checkPassword(password);
    if (!isValidPassword) {
      throw createError(
        req.t('auth.invalid_credentials', {
          defaultValue: 'Invalid credentials',
        }),
        401,
        ERROR_CODES.AUTHENTICATION_ERROR
      );
    }

    const token = generateToken(user);

    logger.info('User logged in', {
      userId: user.id,
      email: user.email,
      language: user.language,
    });

    res.json({
      message: req.t('auth.login_success', {
        defaultValue: 'Login successful',
      }),
      user: user.getPublicData(),
      token,
    });
  });

  getCurrentUser = asyncHandler(async (req, res) => {
    res.json({
      user: req.user.getPublicData(),
      language: req.language,
    });
  });

  createFromTelegram = asyncHandler(async (req, res) => {
    const telegramData = req.validatedBody;

    const existingUser = await User.findByTelegramId(telegramData.telegram_id);
    if (existingUser) {
      const token = generateToken(existingUser);

      return res.json({
        message: req.t('auth.login_success', {
          defaultValue: 'Login successful',
        }),
        user: existingUser.getPublicData(),
        token,
        isNewUser: false,
      });
    }

    const user = await User.create({
      telegram_id: telegramData.telegram_id,
      username: telegramData.username,
      first_name: telegramData.first_name,
      last_name: telegramData.last_name,
      language: telegramData.language === 'ru' ? 'ru' : 'en',
    });

    const token = generateToken(user);

    logger.info('New Telegram user created', {
      userId: user.id,
      telegramId: user.telegram_id,
      language: user.language,
    });

    res.status(201).json({
      message: req.t('auth.telegram_created', {
        defaultValue: 'User created from Telegram',
      }),
      user: user.getPublicData(),
      token,
      isNewUser: true,
    });
  });

  /**
   * Update user language preference
   */
  updateLanguage = asyncHandler(async (req, res) => {
    const { language } = req.body;
    const userId = req.user.id;

    if (!localeManager.isLanguageSupported(language)) {
      throw createError(
        req.t('auth.unsupported_language', {
          defaultValue: 'Unsupported language',
        }),
        400,
        ERROR_CODES.VALIDATION_ERROR
      );
    }

    await req.user.update({ language });

    logger.info('User language updated', {
      userId,
      oldLanguage: req.user.language,
      newLanguage: language,
    });

    res.json({
      message: req.t('common.language_selected', {
        defaultValue: 'Language updated successfully',
      }),
      user: req.user.getPublicData(),
      language,
    });
  });

  /**
   * Get supported languages
   */
  getSupportedLanguages = asyncHandler(async (req, res) => {
    const supportedLanguages = localeManager.getSupportedLanguages();

    const languages = supportedLanguages.map((lang) => ({
      code: lang,
      name: lang === 'en' ? 'English' : 'Russian',
      native_name: lang === 'en' ? 'English' : 'Русский',
    }));

    res.json({
      languages,
      default_language: 'en',
    });
  });
}

module.exports = new UserController();
