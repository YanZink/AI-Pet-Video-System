describe('External Dependencies Integration', () => {
  it('should have all required environment variables', () => {
    const requiredVars = [
      'TELEGRAM_BOT_TOKEN',
      'API_BASE_URL',
      'TELEGRAM_BOT_API_KEY',
    ];

    requiredVars.forEach((varName) => {
      expect(process.env[varName]).toBeDefined();
    });
  });

  it('should have valid API timeout configuration', () => {
    const timeout = parseInt(process.env.API_TIMEOUT);
    expect(timeout).toBeGreaterThan(0);
    expect(timeout).toBeLessThanOrEqual(60000); // max 1 minute
  });
});
