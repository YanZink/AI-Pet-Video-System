module.exports = {
  testEnvironment: 'node',
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  collectCoverageFrom: [
    'src/**/*.js',
    '!src/server.js',
    '!src/config/database.js',
    '!src/email-templates/**',
    '!**/node_modules/**',
    '!src/config/redis.js',
  ],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html'],
  testMatch: [
    '<rootDir>/tests/unit/**/*.test.js',
    '<rootDir>/tests/integration/**/*.test.js',
  ],
  moduleNameMapper: {
    '^../../../shared-locales$': '<rootDir>/tests/mocks/shared-locales.js',
    '^../config/redis$': '<rootDir>/src/config/redis',
    '^./config/redis$': '<rootDir>/src/config/redis',
  },
  testTimeout: 10000,
};
