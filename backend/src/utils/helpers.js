const crypto = require('crypto');
const { v4: uuidv4 } = require('uuid');
const { FILE_LIMITS } = require('./constants');

const stringHelpers = {
  generateRandomString: (length = 32) => {
    return crypto
      .randomBytes(Math.ceil(length / 2))
      .toString('hex')
      .slice(0, length);
  },

  cleanString: (str) => {
    return str?.toString().trim().replace(/\s+/g, ' ') || '';
  },

  isEmpty: (str) => {
    return !str || str.toString().trim().length === 0;
  },

  truncate: (str, maxLength = 100) => {
    if (!str) return '';
    return str.length > maxLength ? `${str.substring(0, maxLength)}...` : str;
  },

  sanitizeFilename: (filename) => {
    return filename.replace(/[^a-zA-Z0-9.\-_]/g, '_');
  },
};

const fileHelpers = {
  generateFileName: (originalName) => {
    const extension = originalName.split('.').pop();
    const nameWithoutExt = originalName.substring(
      0,
      originalName.lastIndexOf('.')
    );
    const sanitizedName = stringHelpers.sanitizeFilename(nameWithoutExt);
    return `${sanitizedName}_${uuidv4()}.${extension}`;
  },

  isValidImageType: (mimetype) => {
    return FILE_LIMITS.ALLOWED_IMAGE_TYPES.includes(mimetype);
  },

  isValidFileSize: (size) => {
    return size <= FILE_LIMITS.MAX_FILE_SIZE;
  },

  getFileExtension: (filename) => {
    return filename.split('.').pop().toLowerCase();
  },
};

const validationHelpers = {
  isValidEmail: (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  },

  isValidUUID: (uuid) => {
    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    return uuidRegex.test(uuid);
  },

  isValidURL: (url) => {
    try {
      new URL(url);
      return true;
    } catch (error) {
      return false;
    }
  },
};

const dateHelpers = {
  formatDate: (date) => {
    return new Date(date).toISOString();
  },

  addMinutes: (date, minutes) => {
    return new Date(date.getTime() + minutes * 60000);
  },

  isExpired: (date) => {
    return new Date(date) < new Date();
  },
};

const securityHelpers = {
  sanitizeObject: (
    obj,
    sensitiveFields = ['password', 'token', 'password_hash', 'secret']
  ) => {
    const sanitized = { ...obj };
    sensitiveFields.forEach((field) => {
      if (sanitized[field]) {
        sanitized[field] = '***HIDDEN***';
      }
    });
    return sanitized;
  },
};

module.exports = {
  stringHelpers,
  fileHelpers,
  validationHelpers,
  dateHelpers,
  securityHelpers,
};
