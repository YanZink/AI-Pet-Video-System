const TelegramI18n = require('../config/i18n');
const Keyboards = require('../utils/keyboards');
const sessionService = require('../services/sessionService');

class StartHandler {
  constructor(bot, apiService) {
    this.bot = bot;
    this.api = apiService;
  }

  async handleStart(ctx) {
    try {
      const user = ctx.from;
      console.log(`New user started bot: ${user.id} (${user.first_name})`);

      const result = await this.api.registerTelegramUser(user);
      if (!result.success) {
        const t = TelegramI18n.getT('en');
        await ctx.reply(t('errors.something_wrong'));
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

      const lang = session.language;
      const t = TelegramI18n.getT(lang);

      if (result.isNewUser) {
        await ctx.reply(t('welcome'), {
          reply_markup: Keyboards.languageKeyboard(),
        });
      } else {
        const name = user.first_name || user.username || 'User';
        await ctx.reply(t('welcome_back', { name }), {
          reply_markup: Keyboards.mainMenu(lang),
        });
      }
    } catch (error) {
      console.error('Start handler error:', error);
      const t = TelegramI18n.getT('en');
      await ctx.reply(t('errors.something_wrong'));
    }
  }
}

module.exports = StartHandler;
