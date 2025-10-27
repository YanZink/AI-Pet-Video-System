import {
  formatCurrency,
  formatDate,
  truncateText,
  getInitials,
} from '../../utils/helpers';

describe('Helpers', () => {
  describe('formatCurrency', () => {
    it('formats USD currency correctly', () => {
      expect(formatCurrency(10.5)).toBe('$10.50');
      expect(formatCurrency(1000)).toBe('$1,000.00');
    });

    it('handles zero and negative values', () => {
      expect(formatCurrency(0)).toBe('$0.00');
      expect(formatCurrency(-5.25)).toBe('-$5.25');
    });
  });

  describe('formatDate', () => {
    it('formats date correctly', () => {
      const date = '2024-01-15T10:30:00Z';
      expect(formatDate(date)).toBe('Jan 15, 2024');
    });

    it('handles different locales', () => {
      const date = '2024-01-15T10:30:00Z';
      expect(formatDate(date, 'ru-RU')).toMatch(/\d{1,2} \u0433\./); // Russian format
    });
  });

  describe('truncateText', () => {
    it('truncates long text', () => {
      const longText = 'This is a very long text that should be truncated';
      expect(truncateText(longText, 20)).toBe('This is a very long ...');
    });

    it('returns original text if within limit', () => {
      const shortText = 'Short text';
      expect(truncateText(shortText, 20)).toBe('Short text');
    });
  });

  describe('getInitials', () => {
    it('returns initials from full name', () => {
      expect(getInitials('John Doe')).toBe('JD');
      expect(getInitials('Alice')).toBe('A');
    });

    it('handles empty input', () => {
      expect(getInitials('')).toBe('?');
      expect(getInitials(null)).toBe('?');
    });
  });
});
