const {
  stringHelpers,
  fileHelpers,
  validationHelpers,
  dateHelpers,
  securityHelpers,
} = require('../../../src/utils/helpers');

describe('Helpers', () => {
  describe('stringHelpers', () => {
    it('should generate random string', () => {
      const result = stringHelpers.generateRandomString(16);
      expect(result).toHaveLength(16);
      expect(typeof result).toBe('string');
    });

    it('should clean string', () => {
      const result = stringHelpers.cleanString('  Hello   World  ');
      expect(result).toBe('Hello World');
    });

    it('should check if string is empty', () => {
      expect(stringHelpers.isEmpty('')).toBe(true);
      expect(stringHelpers.isEmpty('   ')).toBe(true);
      expect(stringHelpers.isEmpty('Hello')).toBe(false);
    });

    it('should truncate string', () => {
      const longString = 'This is a very long string that needs truncation';
      const result = stringHelpers.truncate(longString, 10);
      expect(result).toBe('This is a ...');
    });

    it('should sanitize filename', () => {
      const result = stringHelpers.sanitizeFilename('file<name>.jpg');
      expect(result).toBe('file_name_.jpg');
    });
  });

  describe('fileHelpers', () => {
    it('should generate file name', () => {
      const result = fileHelpers.generateFileName('photo.jpg');
      expect(result).toContain('.jpg');
      expect(result).toMatch(/^[a-zA-Z0-9._-]+_[a-f0-9-]+\.jpg$/);
    });

    it('should validate image type', () => {
      expect(fileHelpers.isValidImageType('image/jpeg')).toBe(true);
      expect(fileHelpers.isValidImageType('image/png')).toBe(true);
      expect(fileHelpers.isValidImageType('application/pdf')).toBe(false);
    });

    it('should validate file size', () => {
      expect(fileHelpers.isValidFileSize(5 * 1024 * 1024)).toBe(true); // 5MB
      expect(fileHelpers.isValidFileSize(15 * 1024 * 1024)).toBe(false); // 15MB
    });

    it('should get file extension', () => {
      expect(fileHelpers.getFileExtension('photo.jpg')).toBe('jpg');
      expect(fileHelpers.getFileExtension('document.PDF')).toBe('pdf');
    });
  });

  describe('validationHelpers', () => {
    it('should validate email', () => {
      expect(validationHelpers.isValidEmail('test@example.com')).toBe(true);
      expect(validationHelpers.isValidEmail('invalid-email')).toBe(false);
    });

    it('should validate UUID', () => {
      const validUUID = '123e4567-e89b-12d3-a456-426614174000';
      expect(validationHelpers.isValidUUID(validUUID)).toBe(true);
      expect(validationHelpers.isValidUUID('invalid-uuid')).toBe(false);
    });

    it('should validate URL', () => {
      expect(validationHelpers.isValidURL('https://example.com')).toBe(true);
      expect(validationHelpers.isValidURL('not-a-url')).toBe(false);
    });
  });

  describe('dateHelpers', () => {
    it('should format date', () => {
      const date = new Date('2023-01-01');
      const result = dateHelpers.formatDate(date);
      expect(result).toBe(date.toISOString());
    });

    it('should add minutes to date', () => {
      const date = new Date('2023-01-01T00:00:00Z');
      const result = dateHelpers.addMinutes(date, 30);
      expect(result.getTime()).toBe(date.getTime() + 30 * 60000);
    });

    it('should check if date is expired', () => {
      const pastDate = new Date(Date.now() - 1000);
      const futureDate = new Date(Date.now() + 1000);

      expect(dateHelpers.isExpired(pastDate)).toBe(true);
      expect(dateHelpers.isExpired(futureDate)).toBe(false);
    });
  });

  describe('securityHelpers', () => {
    it('should sanitize object by hiding sensitive fields', () => {
      const obj = {
        username: 'john',
        password: 'secret',
        token: 'jwt-token',
        publicField: 'visible',
      };

      const sanitized = securityHelpers.sanitizeObject(obj);

      expect(sanitized.username).toBe('john');
      expect(sanitized.publicField).toBe('visible');
      expect(sanitized.password).toBe('***HIDDEN***');
      expect(sanitized.token).toBe('***HIDDEN***');
    });
  });
});
