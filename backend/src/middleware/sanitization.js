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

    return sanitized.trim();
  }

  // Validate script content for suspicious patterns
  static validateScript(script) {
    if (!script) return true;

    const suspiciousPatterns = [
      /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
      /javascript:/gi,
      /on\w+\s*=/gi,
      /eval\s*\(/gi,
      /document\./gi,
      /window\./gi,
      /alert\s*\(/gi,
      /from\s+information_schema/gi,
      /union\s+select/gi,
      /drop\s+table/gi,
      /delete\s+from/gi,
    ];

    for (const pattern of suspiciousPatterns) {
      if (pattern.test(script)) {
        return false;
      }
    }

    return true;
  }

  // Middleware to sanitize request body
  static sanitizeRequestBody(req, res, next) {
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

  //  Middleware to validate script in request body
  static validateScriptBody(req, res, next) {
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
  // Middleware to sanitize and validate file uploads
  static validateFileUploads(req, res, next) {
    // Currently files are uploaded via S3 presigned URLs
    next();
  }
}

module.exports = SanitizationMiddleware;
