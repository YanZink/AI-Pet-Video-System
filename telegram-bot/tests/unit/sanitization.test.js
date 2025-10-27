const {
  validateMimeType,
  sanitizeText,
  validateScript,
  sanitizeFilename,
} = require('../../src/middleware/sanitization');

describe('Sanitization Middleware', () => {
  describe('validateMimeType', () => {
    test('should allow valid image MIME types', () => {
      expect(validateMimeType('image/jpeg')).toBe(true);
      expect(validateMimeType('image/jpg')).toBe(true);
      expect(validateMimeType('image/png')).toBe(true);
      expect(validateMimeType('image/webp')).toBe(true);
      expect(validateMimeType('image/gif')).toBe(true);
    });

    test('should reject invalid MIME types', () => {
      expect(validateMimeType('application/pdf')).toBe(false);
      expect(validateMimeType('text/plain')).toBe(false);
      expect(validateMimeType('video/mp4')).toBe(false);
    });
  });

  describe('sanitizeText', () => {
    test('should remove HTML tags from text', () => {
      const input = '<script>alert("xss")</script>Hello <b>World</b>';
      const result = sanitizeText(input);

      expect(result).not.toContain('<script>');
      expect(result).not.toContain('</script>');
      expect(result).not.toContain('<b>');
      expect(result).not.toContain('</b>');
      expect(result).toContain('Hello');
      expect(result).toContain('World');
    });

    test('should handle empty and non-string input', () => {
      expect(sanitizeText('')).toBe('');
      expect(sanitizeText(null)).toBe(null);
      expect(sanitizeText(undefined)).toBe(undefined);
      expect(sanitizeText(123)).toBe(123);
    });
  });

  describe('validateScript', () => {
    test('should allow safe script content', () => {
      expect(validateScript('My pet is playing in the garden')).toBe(true);
      expect(validateScript('Make a video with happy music')).toBe(true);
      expect(validateScript('')).toBe(true);
      expect(validateScript(null)).toBe(true);
    });

    test('should block XSS patterns', () => {
      expect(validateScript('<script>alert("xss")</script>')).toBe(false);
      expect(validateScript('javascript:alert("xss")')).toBe(false);
      expect(validateScript('onclick=alert("xss")')).toBe(false);
    });
  });

  describe('sanitizeFilename', () => {
    test('should sanitize dangerous filenames', () => {
      expect(sanitizeFilename('../../../etc/passwd')).toBe('etc_passwd');
      expect(sanitizeFilename('file<with>bad|chars?.jpg')).toBe(
        'filewithbadchars.jpg'
      );
      expect(sanitizeFilename('normal-file.jpg')).toBe('normal-file.jpg');
    });

    test('should handle edge cases', () => {
      expect(sanitizeFilename('')).toBe(null);
      expect(sanitizeFilename(null)).toBe(null);
    });
  });
});
