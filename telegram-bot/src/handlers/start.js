const TelegramI18n = require('../config/i18n');
const Keyboards = require('../utils/keyboards');
const sessionService = require('../services/sessionService');

class StartHandler {
  constructor(bot, apiService, userSessions) {
    this.bot = bot;
    this.api = apiService;
    this.sessions = userSessions;
  }

  async handleStart(ctx) {
    try {
      const user = ctx.from;
      console.log(`New user started bot: ${user.id} (${user.first_name})`);

      // Register or login user via API
      const result = await this.api.registerTelegramUser(user);

      if (!result.success) {
        const t = TelegramI18n.getT('en');
        const errorMessage = t('errors.something_wrong');
        await ctx.reply(errorMessage);
        return;
      }

      const session = {
        token: result.token,
        user: result.user,
        language: result.user.language || 'en',
        state: 'start',
        uploadData: {
          photos: [],
          uploadedPhotos: [],
          script: null,
          currentRequestId: null,
        },
      };

      await sessionService.saveSession(user.id, session);

      const lang = result.user.language || 'en';
      const t = TelegramI18n.getT(lang);

      if (result.isNewUser) {
        // New user - show language selection
        const welcomeMessage = t('welcome');
        await ctx.reply(welcomeMessage, {
          reply_markup: Keyboards.languageKeyboard(),
        });
      } else {
        // Existing user - show main menu
        const name = user.first_name || user.username || 'User';
        const welcomeBack = t('welcome_back', { name });
        const mainMenu = Keyboards.mainMenu(lang);

        await ctx.reply(welcomeBack, {
          reply_markup: mainMenu,
        });
      }
    } catch (error) {
      console.error('Start handler error:', error);
      const t = TelegramI18n.getT('en');
      const errorMessage = t('errors.something_wrong');
      await ctx.reply(errorMessage);
    }
  }
}

module.exports = StartHandler;
