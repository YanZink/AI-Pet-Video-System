const VALIDATION_LIMITS = {
  // Script validation
  SCRIPT_MAX_LENGTH: parseInt(process.env.SCRIPT_MAX_LENGTH) || 1000,
  SCRIPT_MIN_LENGTH: parseInt(process.env.SCRIPT_MIN_LENGTH) || 0,

  // Photos validation
  PHOTOS_MIN_COUNT: parseInt(process.env.PHOTOS_MIN_COUNT) || 1,
  PHOTOS_MAX_COUNT: parseInt(process.env.PHOTOS_MAX_COUNT) || 10,

  // User validation
  USERNAME_MIN_LENGTH: parseInt(process.env.USERNAME_MIN_LENGTH) || 3,
  USERNAME_MAX_LENGTH: parseInt(process.env.USERNAME_MAX_LENGTH) || 50,
  PASSWORD_MIN_LENGTH: parseInt(process.env.PASSWORD_MIN_LENGTH) || 6,
  PASSWORD_MAX_LENGTH: parseInt(process.env.PASSWORD_MAX_LENGTH) || 128,
  EMAIL_MAX_LENGTH: parseInt(process.env.EMAIL_MAX_LENGTH) || 255,

  // Admin validation
  ADMIN_NOTES_MAX_LENGTH: parseInt(process.env.ADMIN_NOTES_MAX_LENGTH) || 2000,
};

module.exports = VALIDATION_LIMITS;
