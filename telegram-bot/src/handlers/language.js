const TelegramI18n = require('../config/i18n');
const Keyboards = require('../utils/keyboards');
const sessionService = require('../services/sessionService');

class LanguageHandler {
  constructor(bot, userSessions) {
    this.bot = bot;
    this.sessions = userSessions;
  }

  async handleLanguageSelection(ctx) {
    try {
      const userId = ctx.from.id;
      const session = await sessionService.getSession(userId);

      if (!session) {
        const t = TelegramI18n.getT('en');
        const errorMessage = t('errors.something_wrong');
        await ctx.reply(errorMessage);
        return;
      }

      const lang = ctx.callbackQuery.data === 'lang_ru' ? 'ru' : 'en';

      // Update session language
      session.language = lang;
      session.state = 'menu';
      await sessionService.saveSession(userId, session);

      const t = TelegramI18n.getT(lang);
      const selectedMessage = t('language.selected');

      await ctx.reply(selectedMessage);

      // Show main menu
      setTimeout(async () => {
        const name = ctx.from.first_name || ctx.from.username || 'User';
        const welcomeBack = t('welcome_back', { name });
        const mainMenu = Keyboards.mainMenu(lang);

        await ctx.reply(welcomeBack, {
          reply_markup: mainMenu,
        });
      }, 1000);
    } catch (error) {
      console.error('Language handler error:', error);
      const t = TelegramI18n.getT('en');
      const errorMessage = t('errors.something_wrong');
      await ctx.reply(errorMessage);
    }
  }

  async handleLanguageMenu(ctx) {
    try {
      const userId = ctx.from.id;
      const session = await sessionService.getSession(userId);

      if (!session) {
        const t = TelegramI18n.getT('en');
        const errorMessage = t('errors.something_wrong');
        await ctx.reply(errorMessage);
        return;
      }

      const t = TelegramI18n.getT(session.language);
      const chooseMessage = t('language.choose');

      await ctx.reply(chooseMessage, {
        reply_markup: Keyboards.languageKeyboard(),
      });
    } catch (error) {
      console.error('Language menu error:', error);
      const t = TelegramI18n.getT('en');
      const errorMessage = t('errors.something_wrong');
      await ctx.reply(errorMessage);
    }
  }
}

module.exports = LanguageHandler;
