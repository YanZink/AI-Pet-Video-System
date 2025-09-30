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
        const t = await Keyboards.getLocale('en');
        const errorMessage = await t('errors.api_error');
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

      if (result.isNewUser) {
        // New user - show language selection
        const t = await Keyboards.getLocale(lang);
        const welcomeMessage = await t('system.welcome');
        await ctx.reply(welcomeMessage, {
          reply_markup: Keyboards.languageKeyboard(),
        });
      } else {
        // Existing user - show main menu
        const t = await Keyboards.getLocale(lang);
        const name = user.first_name || user.username || 'User';
        const welcomeBack = await t('system.welcome_back', { name });
        const mainMenu = await Keyboards.mainMenu(lang);

        await ctx.reply(welcomeBack, {
          reply_markup: mainMenu,
        });
      }
    } catch (error) {
      console.error('Start handler error:', error);
      const t = await Keyboards.getLocale('en');
      const errorMessage = await t('errors.network');
      await ctx.reply(errorMessage);
    }
  }
}

module.exports = StartHandler;
