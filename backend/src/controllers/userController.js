const { User } = require('../models');
const { generateToken } = require('../middleware/auth');
const { ERROR_CODES } = require('../utils/constants');
const { createError, asyncHandler } = require('../middleware/errorHandler');
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
        'User already exists',
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
    });

    res.status(201).json({
      message: 'User created successfully',
      user: user.getPublicData(),
      token,
    });
  });

  loginUser = asyncHandler(async (req, res) => {
    const { email, password } = req.validatedBody;

    const user = await User.findByEmail(email);
    if (!user) {
      throw createError(
        'Invalid credentials',
        401,
        ERROR_CODES.AUTHENTICATION_ERROR
      );
    }

    const isValidPassword = await user.checkPassword(password);
    if (!isValidPassword) {
      throw createError(
        'Invalid credentials',
        401,
        ERROR_CODES.AUTHENTICATION_ERROR
      );
    }

    const token = generateToken(user);

    logger.info('User logged in', {
      userId: user.id,
      email: user.email,
    });

    res.json({
      message: 'Login successful',
      user: user.getPublicData(),
      token,
    });
  });

  getCurrentUser = asyncHandler(async (req, res) => {
    res.json({
      user: req.user.getPublicData(),
    });
  });

  createFromTelegram = asyncHandler(async (req, res) => {
    const telegramData = req.validatedBody;

    const existingUser = await User.findByTelegramId(telegramData.telegram_id);
    if (existingUser) {
      const token = generateToken(existingUser);

      return res.json({
        message: 'User already exists',
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
    });

    res.status(201).json({
      message: 'User created from Telegram',
      user: user.getPublicData(),
      token,
      isNewUser: true,
    });
  });
}

module.exports = new UserController();
