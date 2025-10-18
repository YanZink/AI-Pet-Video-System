const { User } = require('../models');
const { generateToken } = require('../middleware/auth');
const { ERROR_CODES } = require('../utils/constants');
const { createError, asyncHandler } = require('../middleware/errorHandler');
const localeManager = require('../../../shared-locales');
const logger = require('../utils/logger');
const emailService = require('../services/emailService');
const crypto = require('crypto');

class UserController {
  createUser = asyncHandler(async (req, res) => {
    console.log('=== REGISTRATION ATTEMPT ===', new Date().toISOString());
    console.log('Email:', req.body.email);

    const userData = req.validatedBody;

    logger.info('Starting user registration', {
      email: userData.email,
      hasTelegram: !!userData.telegram_id,
    });

    let existingUser = null;

    try {
      if (userData.telegram_id) {
        logger.info('Checking Telegram user');
        existingUser = await User.findByTelegramId(userData.telegram_id);
      } else if (userData.email) {
        logger.info('Checking email user', { email: userData.email });
        existingUser = await User.findByEmail(userData.email);
      }

      logger.info('User lookup completed', {
        existingUser: !!existingUser,
        email: userData.email,
      });

      if (existingUser) {
        logger.warn('User already exists', {
          email: userData.email,
          telegramId: userData.telegram_id,
        });
        throw createError(
          req.t('auth.user_exists', { defaultValue: 'User already exists' }),
          409,
          ERROR_CODES.DUPLICATE_ERROR
        );
      }

      logger.info('Creating new user in database');
      const user = await User.create({
        ...userData,
        password_hash: userData.password,
        email_verified: false,
      });

      logger.info('User created successfully', {
        userId: user.id,
        email: user.email,
      });

      // Generate verification token for email users
      if (user.email) {
        logger.info('Generating verification token for email user');

        user.generateVerificationToken();
        await user.save();

        logger.info('Sending verification email');
        await emailService.sendVerificationEmail(
          user,
          user.email_verification_token
        );
        logger.info('Verification email sent');
      }

      const token = generateToken(user);

      logger.info('User registration completed successfully', {
        userId: user.id,
        method: userData.telegram_id ? 'telegram' : 'email',
        email: user.email,
        requiresVerification: !!user.email,
      });

      res.status(201).json({
        message: req.t('auth.created_success', {
          defaultValue: 'User created successfully.',
        }),
        user: user.getPublicData(),
        token,
        requiresEmailVerification: !!user.email,
      });
    } catch (error) {
      logger.error('ERROR in user registration:', {
        error: error.message,
        stack: error.stack,
        email: userData.email,
        step: 'createUser',
      });
      throw error;
    }
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

    // CHECK EMAIL VERIFICATION
    if (!user.email_verified) {
      throw createError(
        req.t('auth.email_not_verified', {
          defaultValue: 'Please verify your email before logging in',
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
  /**
   * Verify user email
   */
  verifyEmail = asyncHandler(async (req, res) => {
    const { token } = req.body;

    if (!token) {
      throw createError(
        req.t('auth.verification_token_required', {
          defaultValue: 'Verification token is required',
        }),
        400,
        ERROR_CODES.VALIDATION_ERROR
      );
    }

    const user = await User.findByVerificationToken(token);
    if (!user) {
      throw createError(
        req.t('auth.invalid_verification_token', {
          defaultValue: 'Invalid or expired verification token',
        }),
        400,
        ERROR_CODES.VALIDATION_ERROR
      );
    }

    if (user.isVerificationTokenExpired()) {
      throw createError(
        req.t('auth.verification_token_expired', {
          defaultValue: 'Verification token has expired',
        }),
        400,
        ERROR_CODES.VALIDATION_ERROR
      );
    }

    // Mark email as verified and clear token
    await user.update({
      email_verified: true,
      email_verification_token: null,
      email_verification_sent_at: null,
    });

    logger.info('User email verified', {
      userId: user.id,
      email: user.email,
    });

    res.json({
      message: req.t('auth.email_verified_success', {
        defaultValue: 'Email verified successfully',
      }),
      user: user.getPublicData(),
    });
  });

  /**
   * Resend verification email
   */
  resendVerification = asyncHandler(async (req, res) => {
    const { email } = req.body;

    if (!email) {
      throw createError(
        req.t('auth.email_required', {
          defaultValue: 'Email is required',
        }),
        400,
        ERROR_CODES.VALIDATION_ERROR
      );
    }

    const user = await User.findByEmail(email);
    if (!user) {
      // Don't reveal if user exists or not
      return res.json({
        message: req.t('auth.verification_email_sent', {
          defaultValue:
            'If your email exists in our system, you will receive a verification email shortly',
        }),
      });
    }

    if (user.email_verified) {
      throw createError(
        req.t('auth.email_already_verified', {
          defaultValue: 'Email is already verified',
        }),
        400,
        ERROR_CODES.VALIDATION_ERROR
      );
    }

    // Generate new verification token
    user.generateVerificationToken();
    await user.save();

    // Send verification email
    await emailService.sendVerificationEmail(
      user,
      user.email_verification_token
    );

    logger.info('Verification email resent', {
      userId: user.id,
      email: user.email,
    });

    res.json({
      message: req.t('auth.verification_email_sent', {
        defaultValue:
          'If your email exists in our system, you will receive a verification email shortly',
      }),
    });
  });
}

module.exports = new UserController();
