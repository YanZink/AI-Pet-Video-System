const TelegramI18n = require('../config/i18n');
const Keyboards = require('../utils/keyboards');
const sessionService = require('../services/sessionService');

class ScriptInputHandler {
  constructor(bot, userSessions) {
    this.bot = bot;
    this.sessions = userSessions;
  }

  async handleScriptSkip(ctx) {
    try {
      const userId = ctx.from.id;
      const session = await sessionService.getSession(userId);

      if (!session) {
        const t = TelegramI18n.getT('en');
        const errorMessage = t('errors.something_wrong');
        await ctx.editMessageText(errorMessage);
        return;
      }

      const t = TelegramI18n.getT(session.language);
      const skippedMessage = t('script.skipped');

      // Use uploadData structure for script
      session.uploadData.script = null;
      session.state = 'confirming_payment';
      await sessionService.saveSession(userId, session);

      await ctx.editMessageText(skippedMessage);

      // Show payment confirmation
      await this.showPaymentConfirmation(ctx, session);
    } catch (error) {
      console.error('Script skip error:', error);
      const t = TelegramI18n.getT('en');
      const errorMessage = t('errors.something_wrong');
      await ctx.editMessageText(errorMessage);
    }
  }

  async handleScriptInput(ctx) {
    try {
      if (!ctx.message || !ctx.message.text) {
        return;
      }

      const userId = ctx.from.id;
      const session = await sessionService.getSession(userId);

      if (!session || session.state !== 'entering_script') {
        return;
      }

      const script = ctx.message.text.trim();
      const t = TelegramI18n.getT(session.language);

      if (script.length > 1000) {
        const scriptTooLong = t('errors.script_too_long');
        await ctx.reply(scriptTooLong);
        return;
      }

      // Use uploadData structure for script
      session.uploadData.script = script;
      session.state = 'confirming_payment';
      await sessionService.saveSession(userId, session);

      const receivedMessage = t('script.received', {
        script: script.substring(0, 100) + (script.length > 100 ? '...' : ''),
      });

      await ctx.reply(receivedMessage);

      // Show payment confirmation
      setTimeout(async () => {
        await this.showPaymentConfirmation(ctx, session);
      }, 1000);
    } catch (error) {
      console.error('Script input error:', error);
      const t = TelegramI18n.getT('en');
      const errorMessage = t('errors.something_wrong');
      await ctx.reply(errorMessage);
    }
  }

  async showPaymentConfirmation(ctx, session) {
    try {
      const t = TelegramI18n.getT(session.language);
      const priceStars = process.env.VIDEO_PRICE_STARS || '714';

      const scriptText = session.uploadData.script
        ? `"${session.uploadData.script.substring(0, 50)}${
            session.uploadData.script.length > 50 ? '...' : ''
          }"`
        : t('payment.no_script');

      const summary = t('payment.summary', {
        photoCount: session.uploadData.photos.length,
        script: scriptText,
        price: priceStars,
      });

      const paymentConfirm = Keyboards.paymentConfirm(
        priceStars,
        session.language
      );
      await ctx.reply(summary, {
        reply_markup: paymentConfirm,
      });
    } catch (error) {
      console.error('Payment confirmation error:', error);
      const t = TelegramI18n.getT(session.language);
      const errorMessage = t('errors.something_wrong');
      await ctx.reply(errorMessage);
    }
  }

  async handleScriptInputStart(ctx) {
    try {
      const userId = ctx.from.id;
      const session = await sessionService.getSession(userId);

      if (!session) {
        const t = TelegramI18n.getT('en');
        const errorMessage = t('errors.something_wrong');
        await ctx.editMessageText(errorMessage);
        return;
      }

      const t = TelegramI18n.getT(session.language);
      const requestMessage = t('script.request');

      session.state = 'entering_script';
      await sessionService.saveSession(userId, session);

      await ctx.reply(requestMessage, {
        reply_markup: { remove_keyboard: true },
      });
    } catch (error) {
      console.error('Script input start error:', error);
      const t = TelegramI18n.getT('en');
      const errorMessage = t('errors.something_wrong');
      await ctx.editMessageText(errorMessage);
    }
  }
}

module.exports = ScriptInputHandler;
