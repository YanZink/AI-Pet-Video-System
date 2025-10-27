const { User } = require('../../../src/models');
const {
  SUPPORTED_LANGUAGES,
  USER_ROLES,
} = require('../../../src/utils/constants');
const TestHelpers = require('../../helpers/testHelpers');

describe('User Model', () => {
  beforeAll(async () => {
    await require('../../../src/models').sequelize.sync({ force: true });
  });

  afterEach(async () => {
    await TestHelpers.cleanupTestData();
  });

  afterAll(async () => {
    await require('../../../src/models').sequelize.close();
  });

  describe('User Creation', () => {
    it('should create a user with telegram_id only', async () => {
      const userData = {
        telegram_id: 123456789,
        username: 'telegramuser',
        first_name: 'Telegram',
        last_name: 'User',
        language: SUPPORTED_LANGUAGES.RU,
      };

      const user = await User.create(userData);

      expect(user.id).toBeDefined();
      expect(user.telegram_id).toBe(userData.telegram_id);
      expect(user.username).toBe(userData.username);
      expect(user.language).toBe(SUPPORTED_LANGUAGES.RU);
      expect(user.email).toBeUndefined();
    });

    it('should create a user with telegram_id only', async () => {
      const userData = {
        telegram_id: 123456789,
        username: 'telegramuser',
        first_name: 'Telegram',
        last_name: 'User',
        language: SUPPORTED_LANGUAGES.RU,
      };

      const user = await User.create(userData);

      expect(user.id).toBeDefined();
      expect(user.telegram_id).toBe(userData.telegram_id);
      expect(user.username).toBe(userData.username);
      expect(user.language).toBe(SUPPORTED_LANGUAGES.RU);
      expect(user.email).toBeUndefined();
    });
  });
});
