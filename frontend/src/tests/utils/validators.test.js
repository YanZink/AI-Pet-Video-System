import {
  validateEmail,
  validatePassword,
  validateFileSize,
} from '../../utils/validators';

describe('Validators', () => {
  describe('validateEmail', () => {
    it('validates correct emails', () => {
      expect(validateEmail('test@example.com')).toBe(true);
      expect(validateEmail('user.name@domain.co.uk')).toBe(true);
    });

    it('rejects invalid emails', () => {
      expect(validateEmail('invalid')).toBe(false);
      expect(validateEmail('test@')).toBe(false);
      expect(validateEmail('@domain.com')).toBe(false);
    });
  });

  describe('validatePassword', () => {
    it('validates password strength', () => {
      expect(validatePassword('short')).toEqual({
        valid: false,
        errors: ['Password must be at least 6 characters'],
      });

      expect(validatePassword('longenough')).toEqual({
        valid: true,
        errors: [],
      });
    });
  });

  describe('validateFileSize', () => {
    it('validates file size', () => {
      const file = { size: 5 * 1024 * 1024 }; // 5MB
      expect(validateFileSize(file, 10)).toBe(true);

      const largeFile = { size: 15 * 1024 * 1024 }; // 15MB
      expect(validateFileSize(largeFile, 10)).toBe(false);
    });
  });
});
