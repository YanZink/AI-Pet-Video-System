const jwt = require('jsonwebtoken');
const {
  authMiddleware,
  generateToken,
} = require('../../../src/middleware/auth');
const { User } = require('../../../src/models');
const TestHelpers = require('../../helpers/testHelpers');

// Mock User model
jest.mock('../../../src/models', () => ({
  User: {
    findByPk: jest.fn(),
  },
}));

describe('Auth Middleware', () => {
  let mockReq, mockRes, mockNext;

  beforeEach(() => {
    mockReq = {
      headers: {},
      t: jest.fn((key) => {
        const translations = {
          'errors.authentication_required': 'Authentication required',
          'errors.missing_token': 'Missing token',
          'errors.invalid_token': 'Invalid token',
          'errors.user_not_found': 'User not found',
          'errors.malformed_token': 'Malformed token',
          'errors.token_expired': 'Token expired',
        };
        return key;
      }),
    };
    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    mockNext = jest.fn();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('authMiddleware', () => {
    it('should authenticate user with valid token', async () => {
      const testUser = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        email: 'test@example.com',
        is_active: true,
      };

      const token = generateToken(testUser);
      mockReq.headers.authorization = `Bearer ${token}`;

      User.findByPk.mockResolvedValue(testUser);

      await authMiddleware(mockReq, mockRes, mockNext);

      expect(mockReq.user).toEqual(testUser);
      expect(mockReq.tokenData.userId).toBe(testUser.id);
      expect(mockNext).toHaveBeenCalled();
    });

    it('should reject request without authorization header', async () => {
      await authMiddleware(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: 'errors.authentication_required',
        code: 'AUTHENTICATION_ERROR',
        message: 'errors.missing_token',
      });
    });

    it('should reject request with malformed authorization header', async () => {
      mockReq.headers.authorization = 'InvalidFormat token';

      await authMiddleware(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: 'errors.authentication_required',
        code: 'AUTHENTICATION_ERROR',
        message: 'errors.missing_token',
      });
    });

    it('should reject request with invalid token', async () => {
      mockReq.headers.authorization = 'Bearer invalid-token';

      await authMiddleware(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: 'errors.invalid_token',
        code: 'AUTHENTICATION_ERROR',
        message: 'errors.malformed_token',
      });
    });

    it('should reject request with expired token', async () => {
      const expiredToken = jwt.sign({ userId: '123' }, process.env.JWT_SECRET, {
        expiresIn: '-1h',
      });

      mockReq.headers.authorization = `Bearer ${expiredToken}`;

      await authMiddleware(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: 'errors.token_expired',
        code: 'AUTHENTICATION_ERROR',
        message: 'errors.token_expired',
      });
    });

    it('should reject request for inactive user', async () => {
      const testUser = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        email: 'test@example.com',
        is_active: false,
      };

      const token = generateToken(testUser);
      mockReq.headers.authorization = `Bearer ${token}`;

      User.findByPk.mockResolvedValue(testUser);

      await authMiddleware(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: 'errors.invalid_token',
        code: 'AUTHENTICATION_ERROR',
        message: 'errors.user_not_found',
      });
    });

    it('should reject request for non-existent user', async () => {
      const token = generateToken({ userId: 'non-existent' });
      mockReq.headers.authorization = `Bearer ${token}`;

      User.findByPk.mockResolvedValue(null);

      await authMiddleware(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: 'errors.invalid_token',
        code: 'AUTHENTICATION_ERROR',
        message: 'errors.user_not_found',
      });
    });
  });

  describe('generateToken', () => {
    it('should generate valid JWT token', () => {
      const user = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        email: 'test@example.com',
        telegram_id: 123456789,
        role: 'user',
      };

      const token = generateToken(user);

      expect(token).toBeDefined();

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      expect(decoded.userId).toBe(user.id);
      expect(decoded.email).toBe(user.email);
      expect(decoded.telegramId).toBe(user.telegram_id);
      expect(decoded.role).toBe(user.role);
    });
  });
});
