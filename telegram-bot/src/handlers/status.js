const TelegramI18n = require('../config/i18n');
const Keyboards = require('../utils/keyboards');
const sessionService = require('../services/sessionService');

class StatusHandler {
  constructor(bot, apiService, userSessions) {
    this.bot = bot;
    this.api = apiService;
    this.sessions = userSessions;
  }

  async handleMyVideos(ctx) {
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

      // Get user's requests
      const requestsResult = await this.api.getUserRequests(session.token);

      if (!requestsResult.success) {
        const errorMessage = t('errors.api_error');
        await ctx.reply(errorMessage);
        return;
      }

      const requests = requestsResult.requests;

      if (requests.length === 0) {
        const emptyMessage = t('my_videos.empty');
        const backMenu = Keyboards.backToMenu(session.language);
        await ctx.reply(emptyMessage, {
          reply_markup: backMenu,
        });
        return;
      }

      const title = t('my_videos.title');
      let message = title + '\n\n';

      for (const request of requests.slice(0, 5)) {
        const date = new Date(request.created_at).toLocaleDateString(
          session.language === 'ru' ? 'ru-RU' : 'en-US'
        );

        // Get translation for status
        const statusTranslation = t(`status.${request.status}`);
        const status = statusTranslation || request.status;

        // Get template and replace
        const itemTemplate = t('my_videos.item');
        const item = itemTemplate
          .replace('{id}', request.id.substring(0, 8))
          .replace('{date}', date)
          .replace('{status}', status);

        message += item + '\n';
      }

      const backMenu = Keyboards.backToMenu(session.language);
      await ctx.reply(message, {
        reply_markup: backMenu,
      });
    } catch (error) {
      console.error('My videos error:', error);
      const t = TelegramI18n.getT('en');
      const errorMessage = t('errors.api_error');
      await ctx.reply(errorMessage);
    }
  }

  async handleQueueStatus(ctx) {
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

      // Get queue estimation
      const queueResult = await this.api.getQueueEstimation();

      if (!queueResult.success) {
        const errorMessage = t('errors.api_error');
        await ctx.reply(errorMessage);
        return;
      }

      const estimation = queueResult.estimation;

      const title = t('queue.title');
      let message = title + '\n\n';

      const waitTime = t('queue.wait_time', {
        minutes: estimation.estimated_wait_minutes,
      });
      message += waitTime;

      const backMenu = Keyboards.backToMenu(session.language);
      await ctx.reply(message, {
        reply_markup: backMenu,
      });
    } catch (error) {
      console.error('Queue status error:', error);
      const t = TelegramI18n.getT('en');
      const errorMessage = t('errors.api_error');
      await ctx.reply(errorMessage);
    }
  }

  async handleHelp(ctx) {
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
      const priceStars = process.env.VIDEO_PRICE_STARS || '714';

      const helpText = t('help', { price: priceStars });

      const backMenu = Keyboards.backToMenu(session.language);
      await ctx.reply(helpText, {
        reply_markup: backMenu,
      });
    } catch (error) {
      console.error('Help error:', error);
      const t = TelegramI18n.getT('en');
      const errorMessage = t('errors.something_wrong');
      await ctx.reply(errorMessage);
    }
  }
}

module.exports = StatusHandler;
