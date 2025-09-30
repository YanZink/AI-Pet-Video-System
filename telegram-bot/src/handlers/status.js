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
        const t = await Keyboards.getLocale('en');
        const errorMessage = await t('errors.network');
        await ctx.reply(errorMessage);
        return;
      }

      const t = await Keyboards.getLocale(session.language);

      // Get user's requests
      const requestsResult = await this.api.getUserRequests(session.token);

      if (!requestsResult.success) {
        const errorMessage = await t('errors.api_error');
        await ctx.reply(errorMessage);
        return;
      }

      const requests = requestsResult.requests;

      if (requests.length === 0) {
        const emptyMessage = await t('my_videos.empty');
        const backMenu = await Keyboards.backToMenu(session.language);
        await ctx.reply(emptyMessage, {
          reply_markup: backMenu,
        });
        return;
      }

      const title = await t('my_videos.title');
      let message = title + '\n\n';

      // get translations
      for (const request of requests.slice(0, 5)) {
        const date = new Date(request.created_at).toLocaleDateString(
          session.language === 'ru' ? 'ru-RU' : 'en-US'
        );

        // get translation for status
        const statusTranslation = await t(`status.${request.status}`);
        const status = statusTranslation || request.status;

        // get template and replace
        const itemTemplate = await t('my_videos.item');
        const item = itemTemplate
          .replace('{id}', request.id.substring(0, 8))
          .replace('{date}', date)
          .replace('{status}', status);

        message += item + '\n';
      }

      const backMenu = await Keyboards.backToMenu(session.language);
      await ctx.reply(message, {
        reply_markup: backMenu,
      });
    } catch (error) {
      console.error('My videos error:', error);
      const t = await Keyboards.getLocale('en');
      const errorMessage = await t('errors.api_error');
      await ctx.reply(errorMessage);
    }
  }

  async handleQueueStatus(ctx) {
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

      // Get queue estimation
      const queueResult = await this.api.getQueueEstimation();

      if (!queueResult.success) {
        const errorMessage = await t('errors.api_error');
        await ctx.reply(errorMessage);
        return;
      }

      const estimation = queueResult.estimation;

      const title = await t('queue.title');
      let message = title + '\n\n';

      const waitTime = await t('queue.wait_time', {
        minutes: estimation.estimated_wait_minutes,
      });
      message += waitTime;

      const backMenu = await Keyboards.backToMenu(session.language);
      await ctx.reply(message, {
        reply_markup: backMenu,
      });
    } catch (error) {
      console.error('Queue status error:', error);
      const t = await Keyboards.getLocale('en');
      const errorMessage = await t('errors.api_error');
      await ctx.reply(errorMessage);
    }
  }

  async handleHelp(ctx) {
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
      const priceStars = process.env.VIDEO_PRICE_STARS || '714';

      const helpText = await t('help', { price: priceStars });

      const backMenu = await Keyboards.backToMenu(session.language);
      await ctx.reply(helpText, {
        reply_markup: backMenu,
      });
    } catch (error) {
      console.error('Help error:', error);
      const t = await Keyboards.getLocale('en');
      const errorMessage = await t('errors.network');
      await ctx.reply(errorMessage);
    }
  }
}

module.exports = StatusHandler;
