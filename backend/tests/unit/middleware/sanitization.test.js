const {
  sanitizeText,
  validateScript,
  sanitizeRequestBody,
  validateScriptBody,
} = require('../../../src/middleware/sanitization');

describe('Sanitization Middleware', () => {
  describe('sanitizeText', () => {
    it('should sanitize HTML tags from text', () => {
      const input = '<script>alert("xss")</script>Hello World';
      const result = sanitizeText(input);

      expect(result).toBe('Hello World');
    });

    it('should remove dangerous attributes', () => {
      const input = '<div onclick="alert(\'xss\')">Content</div>';
      const result = sanitizeText(input);

      expect(result).toBe('Content');
    });

    it('should handle null or undefined input', () => {
      expect(sanitizeText(null)).toBeNull();
      expect(sanitizeText(undefined)).toBeUndefined();
      expect(sanitizeText('')).toBe('');
    });

    it('should trim whitespace', () => {
      const input = '   Hello World   ';
      const result = sanitizeText(input);

      expect(result).not.toContain('<');
      expect(result).not.toContain('>');
    });
  });

  describe('validateScript', () => {
    it('should allow safe script content', () => {
      const safeScript =
        'My pet is very cute and playful. Please make a funny video.';
      const result = validateScript(safeScript);

      expect(result).toBe(true);
    });

    it('should block XSS attempts', () => {
      const xssScripts = [
        '<script>alert("xss")</script>',
        'javascript:alert("xss")',
        'onclick="alert(\'xss\')"',
        'eval("malicious code")',
        'document.cookie',
      ];

      xssScripts.forEach((script) => {
        expect(validateScript(script)).toBe(false);
      });
    });

    it('should allow empty script', () => {
      expect(validateScript(null)).toBe(true);
      expect(validateScript('')).toBe(true);
      expect(validateScript(undefined)).toBe(true);
    });
  });

  describe('sanitizeRequestBody', () => {
    let mockReq, mockRes, mockNext;

    beforeEach(() => {
      mockReq = {
        body: {},
      };
      mockRes = {};
      mockNext = jest.fn();
    });

    it('should sanitize all string fields in request body', () => {
      mockReq.body = {
        name: '  <script>alert("xss")</script>John Doe  ',
        email: 'test@example.com',
        message: 'Hello <b>World</b>',
        number: 123,
        nested: {
          field: '<div>content</div>',
        },
      };

      sanitizeRequestBody(mockReq, mockRes, mockNext);

      expect(mockReq.body.name).toBe('John Doe');
      expect(mockReq.body.email).toBe('test@example.com');
      expect(mockReq.body.message).toBe('HelloWorld');
      expect(mockReq.body.nested.field).toBe('<div>content</div>');
      expect(mockNext).toHaveBeenCalled();
    });

    it('should handle empty request body', () => {
      mockReq.body = null;

      sanitizeRequestBody(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalled();
    });
  });

  describe('validateScriptBody', () => {
    let mockReq, mockRes, mockNext;

    beforeEach(() => {
      mockReq = {
        body: {},
      };
      mockRes = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      };
      mockNext = jest.fn();
    });

    it('should allow safe script content', () => {
      mockReq.body.script = 'Safe script content for video';

      validateScriptBody(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalled();
    });

    it('should block dangerous script content', () => {
      mockReq.body.script = '<script>alert("xss")</script>';

      validateScriptBody(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: 'Invalid script content detected',
        code: 'VALIDATION_ERROR',
        message: 'Script contains potentially dangerous content',
      });
    });

    it('should allow request without script', () => {
      mockReq.body = {};

      validateScriptBody(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalled();
    });
  });
});
