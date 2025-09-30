const Keyboards = require('../utils/keyboards');
const sessionService = require('../services/sessionService');

/**
 * Updated ScriptInputHandler with proper async handling
 */
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
        const t = await Keyboards.getLocale('en');
        const errorMessage = await t('errors.network');
        await ctx.editMessageText(errorMessage);
        return;
      }

      const t = await Keyboards.getLocale(session.language);
      const skippedMessage = await t('script.skipped');

      // Use uploadData structure for script
      session.uploadData.script = null;
      session.state = 'confirming_payment';
      await sessionService.saveSession(userId, session);

      await ctx.editMessageText(skippedMessage);

      // Show payment confirmation
      await this.showPaymentConfirmation(ctx, session);
    } catch (error) {
      console.error('Script skip error:', error);
      const t = await Keyboards.getLocale('en');
      const errorMessage = await t('errors.network');
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
      const t = await Keyboards.getLocale(session.language);

      if (script.length > 1000) {
        const scriptTooLong = await t('errors.script_too_long');
        await ctx.reply(scriptTooLong);
        return;
      }

      // Use uploadData structure for script
      session.uploadData.script = script;
      session.state = 'confirming_payment';
      await sessionService.saveSession(userId, session);

      const receivedMessage = await t('script.received', {
        script: script.substring(0, 100) + (script.length > 100 ? '...' : ''),
      });

      await ctx.reply(receivedMessage);

      // Show payment confirmation
      setTimeout(async () => {
        await this.showPaymentConfirmation(ctx, session);
      }, 1000);
    } catch (error) {
      console.error('Script input error:', error);
      const t = await Keyboards.getLocale('en');
      const errorMessage = await t('errors.network');
      await ctx.reply(errorMessage);
    }
  }

  async showPaymentConfirmation(ctx, session) {
    try {
      const t = await Keyboards.getLocale(session.language);
      const priceStars = process.env.VIDEO_PRICE_STARS || '714';

      const scriptText = session.uploadData.script
        ? `"${session.uploadData.script.substring(0, 50)}${
            session.uploadData.script.length > 50 ? '...' : ''
          }"`
        : await t('payment.no_script');

      const summary = await t('payment.summary', {
        photoCount: session.uploadData.photos.length,
        script: scriptText,
        price: priceStars,
      });

      const paymentConfirm = await Keyboards.paymentConfirm(
        priceStars,
        session.language
      );
      await ctx.reply(summary, {
        reply_markup: paymentConfirm,
      });
    } catch (error) {
      console.error('Payment confirmation error:', error);
      const t = await Keyboards.getLocale(session.language);
      const errorMessage = await t('errors.network');
      await ctx.reply(errorMessage);
    }
  }

  async handleScriptInputStart(ctx) {
    try {
      const userId = ctx.from.id;
      const session = await sessionService.getSession(userId);

      if (!session) {
        const t = await Keyboards.getLocale('en');
        const errorMessage = await t('errors.network');
        await ctx.editMessageText(errorMessage);
        return;
      }

      const t = await Keyboards.getLocale(session.language);
      const requestMessage = await t('script.request');

      session.state = 'entering_script';
      await sessionService.saveSession(userId, session);

      await ctx.reply(requestMessage, {
        reply_markup: { remove_keyboard: true },
      });
    } catch (error) {
      console.error('Script input start error:', error);
      const t = await Keyboards.getLocale('en');
      const errorMessage = await t('errors.network');
      await ctx.editMessageText(errorMessage);
    }
  }
}

module.exports = ScriptInputHandler;
