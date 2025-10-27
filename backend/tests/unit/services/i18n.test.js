const {
  i18nMiddleware,
  getUserLanguage,
  updateUserLanguage,
} = require('../../../src/middleware/i18n');
const { User } = require('../../../src/models');

// Mock User model
jest.mock('../../../src/models', () => ({
  User: {
    findByPk: jest.fn(),
  },
}));

describe('i18n Middleware', () => {
  let mockReq, mockRes, mockNext;

  beforeEach(() => {
    mockReq = {
      user: null,
      headers: {},
      query: {},
    };
    mockRes = {};
    mockNext = jest.fn();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('i18nMiddleware', () => {
    it('should set default language when no preferences', async () => {
      await i18nMiddleware(mockReq, mockRes, mockNext);

      expect(mockReq.language).toBe('en');
      expect(typeof mockReq.t).toBe('function');
      expect(mockNext).toHaveBeenCalled();
    });

    it('should use user language preference', async () => {
      mockReq.user = { language: 'ru' };

      await i18nMiddleware(mockReq, mockRes, mockNext);

      expect(mockReq.language).toBe('ru');
    });

    it('should use Accept-Language header', async () => {
      mockReq.headers['accept-language'] = 'ru-RU,ru;q=0.9';

      await i18nMiddleware(mockReq, mockRes, mockNext);

      expect(mockReq.language).toBe('ru');
    });

    it('should use query parameter', async () => {
      mockReq.query.lang = 'ru';

      await i18nMiddleware(mockReq, mockRes, mockNext);

      expect(mockReq.language).toBe('ru');
    });

    it('should fallback to English for unsupported language', async () => {
      mockReq.headers['accept-language'] = 'fr-FR,fr;q=0.9';

      await i18nMiddleware(mockReq, mockRes, mockNext);

      expect(mockReq.language).toBe('en');
    });
  });

  describe('getUserLanguage', () => {
    it('should return user language', async () => {
      const mockUser = { language: 'ru' };
      User.findByPk.mockResolvedValue(mockUser);

      const language = await getUserLanguage('user-123');

      expect(language).toBe('ru');
    });

    it('should return default language for non-existent user', async () => {
      User.findByPk.mockResolvedValue(null);

      const language = await getUserLanguage('non-existent');

      expect(language).toBe('en');
    });
  });

  describe('updateUserLanguage', () => {
    it('should update user language', async () => {
      const mockUser = {
        update: jest.fn().mockResolvedValue(true),
      };
      User.findByPk.mockResolvedValue(mockUser);

      const result = await updateUserLanguage('user-123', 'ru');

      expect(result).toBe(true);
      expect(mockUser.update).toHaveBeenCalledWith({ language: 'ru' });
    });

    it('should return false for non-existent user', async () => {
      User.findByPk.mockResolvedValue(null);

      const result = await updateUserLanguage('non-existent', 'ru');

      expect(result).toBe(false);
    });
  });
});
