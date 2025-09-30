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
        const t = await Keyboards.getLocale('en');
        const errorMessage = await t('errors.network');
        await ctx.reply(errorMessage);
        return;
      }

      const lang = ctx.callbackQuery.data === 'lang_ru' ? 'ru' : 'en';

      // Update session language
      session.language = lang;
      session.state = 'menu';
      await sessionService.saveSession(userId, session);

      const t = await Keyboards.getLocale(lang);
      const selectedMessage = await t('language.selected');

      await ctx.reply(selectedMessage);

      // Show main menu
      setTimeout(async () => {
        const name = ctx.from.first_name || ctx.from.username || 'User';
        const welcomeBack = await t('system.welcome_back', { name });
        const mainMenu = await Keyboards.mainMenu(lang);

        await ctx.reply(welcomeBack, {
          reply_markup: mainMenu,
        });
      }, 1000);
    } catch (error) {
      console.error('Language handler error:', error);
      const t = await Keyboards.getLocale('en');
      const errorMessage = await t('errors.network');
      await ctx.reply(errorMessage);
    }
  }

  async handleLanguageMenu(ctx) {
    try {
      const userId = ctx.from.id;
      const session = await sessionService.getSession(userId);

      if (!session) {
        const t = await Keyboards.getLocale('en');
        const errorMessage = await t('errors.network');
        await ctx.reply(errorMessage);
        return;
      }

      const t = await Keyboards.getLocale(session.language);
      const chooseMessage = await t('language.choose');

      await ctx.reply(chooseMessage, {
        reply_markup: Keyboards.languageKeyboard(),
      });
    } catch (error) {
      console.error('Language menu error:', error);
      const t = await Keyboards.getLocale('en');
      const errorMessage = await t('errors.network');
      await ctx.reply(errorMessage);
    }
  }
}

module.exports = LanguageHandler;
