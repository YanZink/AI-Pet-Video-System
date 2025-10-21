const sanitizeHtml = require('sanitize-html');

// Sanitize text input to prevent XSS attacks
const sanitizeText = (text) => {
  if (!text || typeof text !== 'string') {
    return text;
  }

  // Remove potentially dangerous characters and tags using sanitize-html
  const sanitized = sanitizeHtml(text, {
    allowedTags: [], // Remove all HTML tags
    allowedAttributes: {}, // Remove all attributes
    textFilter: function (text) {
      return text.trim();
    },
  });

  return sanitized;
};

// Validate script content for suspicious patterns
const validateScript = (script) => {
  if (!script) return true;

  const suspiciousPatterns = [
    // XSS patterns
    /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
    /javascript:/gi,
    /on\w+\s*=/gi,
    /eval\s*\(/gi,
    /document\./gi,
    /window\./gi,
    /alert\s*\(/gi,

    // SQL injection patterns
    /(\bDROP\s+TABLE\b|\bDELETE\s+FROM\b|\bINSERT\s+INTO\b|\bUPDATE\s+\w+\s+SET\b)/gi,
    /(\bUNION\s+SELECT\b|\bSELECT\s+\*\s+FROM\b)/gi,
    /';.*--/gi,
    /';.*#/gi,
    /'\s*OR\s*'1'='1/gi,
  ];

  for (const pattern of suspiciousPatterns) {
    if (pattern.test(script)) {
      console.log(`Blocked script with pattern: ${pattern}`);
      return false;
    }
  }

  return true;
};

// Sanitize filename to prevent path traversal
const sanitizeFilename = (filename) => {
  if (!filename) return null;

  // Remove path traversal attempts
  let sanitized = filename
    .replace(/\.\.\//g, '')
    .replace(/\.\.\\/g, '')
    .replace(/\//g, '_')
    .replace(/\\/g, '_');

  // Remove non-alphanumeric characters (except dots, hyphens, underscores)
  sanitized = sanitized.replace(/[^a-zA-Z0-9._-]/g, '');

  return sanitized;
};

// Validate MIME type for uploaded files
const validateMimeType = (mimeType) => {
  const allowedTypes = [
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/webp',
    'image/gif',
  ];

  return allowedTypes.includes(mimeType.toLowerCase());
};

module.exports = {
  sanitizeText,
  validateScript,
  sanitizeFilename,
  validateMimeType,
};
