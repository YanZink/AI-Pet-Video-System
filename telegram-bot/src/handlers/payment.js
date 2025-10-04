const TelegramI18n = require('../config/i18n');
const Keyboards = require('../utils/keyboards');
const sessionService = require('../services/sessionService');

class PaymentHandler {
  constructor(bot, apiService, paymentService, userSessions) {
    this.bot = bot;
    this.api = apiService;
    this.payment = paymentService;
    this.sessions = userSessions;
  }

  async handlePaymentConfirm(ctx) {
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
      const processingMessage = t('payment.processing');

      // Create request using uploadData structure
      const requestResult = await this.api.createRequest(
        session.token,
        session.uploadData.uploadedPhotos,
        session.uploadData.script
      );

      if (!requestResult.success) {
        const requestFailed = t('errors.request_failed');
        await ctx.editMessageText(requestFailed);
        return;
      }

      const request = requestResult.request;
      // Store request ID in uploadData structure
      session.uploadData.currentRequestId = request.id;
      await sessionService.saveSession(userId, session);

      await ctx.editMessageText(processingMessage);

      // Send payment invoice using uploadData structure
      const invoiceResult = await this.payment.sendInvoice(
        userId,
        request.id,
        session.uploadData.photos.length,
        session.uploadData.script,
        session.language
      );

      if (!invoiceResult.success) {
        const paymentError = t('errors.payment_error');
        await ctx.reply(paymentError);
        return;
      }
    } catch (error) {
      console.error('Payment confirm error:', error);
      const t = TelegramI18n.getT('en');
      const errorMessage = t('errors.something_wrong');
      await ctx.editMessageText(errorMessage);
    }
  }

  async handlePaymentCancel(ctx) {
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
      const cancelledMessage = t('payment.cancelled');

      // Reset session using uploadData structure
      session.state = 'menu';
      session.uploadData = {
        photos: [],
        uploadedPhotos: [],
        script: null,
        currentRequestId: null,
      };
      await sessionService.saveSession(userId, session);

      await ctx.editMessageText(cancelledMessage);

      // Show main menu
      setTimeout(async () => {
        const menuText = t('buttons.menu');
        const mainMenu = Keyboards.mainMenu(session.language);
        await ctx.reply(menuText, {
          reply_markup: mainMenu,
        });
      }, 1500);
    } catch (error) {
      console.error('Payment cancel error:', error);
      const t = TelegramI18n.getT('en');
      const errorMessage = t('errors.something_wrong');
      await ctx.editMessageText(errorMessage);
    }
  }

  async handleSuccessfulPayment(ctx) {
    try {
      const userId = ctx.from.id;
      const session = await sessionService.getSession(userId);

      if (!session) {
        const t = TelegramI18n.getT('en');
        const errorMessage = t('errors.something_wrong');
        await ctx.reply(errorMessage);
        return;
      }

      const paymentData = ctx.message.successful_payment;
      const t = TelegramI18n.getT(session.language);

      // Validate payment
      const validation = this.payment.validatePayment(paymentData);

      if (!validation.valid) {
        const invalidPayment = t('errors.invalid_payment');
        await ctx.reply(invalidPayment);
        return;
      }

      // Process payment via API using uploadData structure
      const paymentResult = await this.api.processTelegramPayment(
        session.token,
        validation.requestId,
        paymentData
      );

      if (!paymentResult.success) {
        const paymentFailed = t('payment.failed');
        await ctx.reply(paymentFailed);
        return;
      }

      // Reset session using uploadData structure
      session.state = 'menu';
      session.uploadData = {
        photos: [],
        uploadedPhotos: [],
        script: null,
        currentRequestId: null,
      };
      await sessionService.saveSession(userId, session);

      // Send success message
      const successMessage = t('payment.success', {
        requestId: validation.requestId.substring(0, 8),
      });
      await ctx.reply(successMessage);

      // Show main menu
      setTimeout(async () => {
        const menuText = t('buttons.menu');
        const mainMenu = Keyboards.mainMenu(session.language);
        await ctx.reply(menuText, {
          reply_markup: mainMenu,
        });
      }, 2000);
    } catch (error) {
      console.error('Successful payment handler error:', error);
      const t = TelegramI18n.getT('en');
      const errorMessage = t('errors.something_wrong');
      await ctx.reply(errorMessage);
    }
  }

  async handlePreCheckoutQuery(ctx) {
    try {
      // Always approve pre-checkout (validation done in successful payment)
      await ctx.answerPreCheckoutQuery(true);
    } catch (error) {
      console.error('Pre-checkout query error:', error);
      const t = TelegramI18n.getT('en');
      const errorMessage = t('errors.payment_error');
      await ctx.answerPreCheckoutQuery(false, errorMessage);
    }
  }
}

module.exports = PaymentHandler;
