// tests/integration/sessionService.test.js
const sessionService = require('../../src/services/sessionService');

describe('Session Service Integration', () => {
  it('should handle session operations', async () => {
    const userId = 123456;
    const sessionData = { state: 'menu', language: 'en' };

    // Test session operations
    await expect(
      sessionService.saveSession(userId, sessionData)
    ).resolves.not.toThrow();
    await expect(sessionService.getSession(userId)).resolves.toBeDefined();
  });

  it('should handle missing sessions gracefully', async () => {
    const nonExistentUser = 999999;

    await expect(
      sessionService.getSession(nonExistentUser)
    ).resolves.toBeNull();
  });
});
