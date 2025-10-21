const DOMPurify = require('isomorphic-dompurify');

class SanitizationMiddleware {
  // Sanitize text input to prevent XSS attacks
  static sanitizeText(text) {
    if (!text || typeof text !== 'string') {
      return text;
    }

    // Remove potentially dangerous characters and tags
    const sanitized = DOMPurify.sanitize(text, {
      ALLOWED_TAGS: [], // Remove all HTML tags
      ALLOWED_ATTR: [], // Remove all attributes
      KEEP_CONTENT: true, // Keep text content
    });

    // Trim and limit length
    return sanitized.trim().substring(0, 1000);
  }

  // Validate script content for suspicious patterns

  static validateScript(script) {
    if (!script) return true;

    const suspiciousPatterns = [
      /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, // Script tags
      /javascript:/gi, // JavaScript protocol
      /on\w+\s*=/gi, // Event handlers
      /eval\s*\(/gi, // eval function
      /document\./gi, // Document object
      /window\./gi, // Window object
      /alert\s*\(/gi, // Alert function
      /from\s+information_schema/gi, // SQL injection
      /union\s+select/gi, // SQL injection
      /drop\s+table/gi, // SQL injection
      /delete\s+from/gi, // SQL injection
    ];

    for (const pattern of suspiciousPatterns) {
      if (pattern.test(script)) {
        return false;
      }
    }

    return true;
  }

  // Sanitize filename to prevent path traversal

  static sanitizeFilename(filename) {
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
  }

  // Validate MIME type for uploaded files
  static validateMimeType(mimeType) {
    const allowedTypes = [
      'image/jpeg',
      'image/jpg',
      'image/png',
      'image/webp',
      'image/gif',
    ];

    return allowedTypes.includes(mimeType.toLowerCase());
  }

  // Middleware to sanitize all text inputs
  static sanitizeInput(req, res, next) {
    if (req.body && typeof req.body === 'object') {
      // Sanitize all string fields in request body
      for (const key in req.body) {
        if (typeof req.body[key] === 'string') {
          req.body[key] = this.sanitizeText(req.body[key]);
        }
      }
    }

    next();
  }

  // Middleware to validate script content
  static validateScriptInput(req, res, next) {
    const { script } = req.body;

    if (script && !this.validateScript(script)) {
      return res.status(400).json({
        error: 'Invalid script content detected',
        code: 'VALIDATION_ERROR',
        message: 'Script contains potentially dangerous content',
      });
    }

    next();
  }
}

module.exports = SanitizationMiddleware;
