const sessionService = require('../../src/services/sessionService');

// Mock Redis with correct method names
jest.mock('../../src/config/redis', () => ({
  redisClient: {
    setEx: jest.fn(),
    get: jest.fn(),
    del: jest.fn(),
  },
}));

const { redisClient } = require('../../src/config/redis');

describe('SessionService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getSession', () => {
    test('should get session successfully', async () => {
      const mockSession = { state: 'uploading_photos', photos: [] };
      redisClient.get.mockResolvedValue(JSON.stringify(mockSession));

      const result = await sessionService.getSession(123456);

      expect(result).toEqual(mockSession);
      expect(redisClient.get).toHaveBeenCalledWith('bot_session:123456');
    });

    test('should return null for non-existent session', async () => {
      redisClient.get.mockResolvedValue(null);

      const result = await sessionService.getSession(999999);

      expect(result).toBeNull();
    });

    test('should handle JSON parse error', async () => {
      redisClient.get.mockResolvedValue('invalid-json');

      const result = await sessionService.getSession(123456);

      expect(result).toBeNull();
    });
  });

  describe('saveSession', () => {
    test('should save session successfully', async () => {
      redisClient.setEx.mockResolvedValue('OK');

      const userId = 123456;
      const sessionData = { state: 'uploading_photos', photos: [] };

      const result = await sessionService.saveSession(userId, sessionData);

      expect(result).toBe(true);
      expect(redisClient.setEx).toHaveBeenCalledWith(
        'bot_session:123456',
        86400, // 24 hours
        JSON.stringify(sessionData)
      );
    });

    test('should handle save error', async () => {
      redisClient.setEx.mockRejectedValue(new Error('Redis error'));

      const result = await sessionService.saveSession(123456, {});

      expect(result).toBe(false);
    });
  });

  describe('deleteSession', () => {
    test('should delete session successfully', async () => {
      redisClient.del.mockResolvedValue(1);

      const result = await sessionService.deleteSession(123456);

      expect(result).toBe(true);
      expect(redisClient.del).toHaveBeenCalledWith('bot_session:123456');
    });

    test('should handle delete error', async () => {
      redisClient.del.mockRejectedValue(new Error('Redis error'));

      const result = await sessionService.deleteSession(123456);

      expect(result).toBe(false);
    });
  });

  describe('updateSession', () => {
    test('should update existing session', async () => {
      const existingSession = { state: 'uploading_photos', photos: [] };
      const updates = { state: 'entering_script' };

      redisClient.get.mockResolvedValue(JSON.stringify(existingSession));
      redisClient.setEx.mockResolvedValue('OK');

      const result = await sessionService.updateSession(123456, updates);

      expect(result).toBe(true);
      expect(redisClient.setEx).toHaveBeenCalledWith(
        'bot_session:123456',
        86400,
        JSON.stringify({ ...existingSession, ...updates })
      );
    });

    test('should return false for non-existent session', async () => {
      redisClient.get.mockResolvedValue(null);

      const result = await sessionService.updateSession(123456, {});

      expect(result).toBe(false);
    });
  });
});
