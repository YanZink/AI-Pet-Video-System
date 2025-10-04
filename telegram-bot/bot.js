const { Telegraf } = require('telegraf');
const express = require('express');
require('dotenv').config();

// Import services and handlers
const ApiService = require('./src/services/apiService');
const TelegramPaymentService = require('./src/services/telegramPayment');
const TelegramI18n = require('./src/config/i18n');
const StartHandler = require('./src/handlers/start');
const LanguageHandler = require('./src/handlers/language');
const PhotoUploadHandler = require('./src/handlers/photoUpload');
const ScriptInputHandler = require('./src/handlers/scriptInput');
const PaymentHandler = require('./src/handlers/payment');
const StatusHandler = require('./src/handlers/status');
const Keyboards = require('./src/utils/keyboards');
const { connectRedis, closeRedisConnections } = require('./src/config/redis');
const sessionService = require('./src/services/sessionService');

class AIPetVideoBot {
  constructor() {
    this.bot = new Telegraf(process.env.TELEGRAM_BOT_TOKEN);
    this.userSessions = sessionService;
    this.webhookApp = express();

    // Initialize services
    this.apiService = new ApiService();
    this.paymentService = new TelegramPaymentService(this.bot);

    // Initialize handlers
    this.startHandler = new StartHandler(
      this.bot,
      this.apiService,
      this.userSessions
    );
    this.languageHandler = new LanguageHandler(this.bot, this.userSessions);
    this.photoHandler = new PhotoUploadHandler(
      this.bot,
      this.apiService,
      this.userSessions
    );
    this.scriptHandler = new ScriptInputHandler(this.bot, this.userSessions);
    this.paymentHandler = new PaymentHandler(
      this.bot,
      this.apiService,
      this.paymentService,
      this.userSessions
    );
    this.statusHandler = new StatusHandler(
      this.bot,
      this.apiService,
      this.userSessions
    );

    this.setupHandlers();
    this.setupWebhook();
  }

  setupHandlers() {
    // Start command
    this.bot.start((ctx) => this.startHandler.handleStart(ctx));

    // Language selection callbacks
    this.bot.action(['lang_en', 'lang_ru'], (ctx) =>
      this.languageHandler.handleLanguageSelection(ctx)
    );

    // Menu text handlers
    this.bot.hears(/🎬/, (ctx) => this.photoHandler.startPhotoUpload(ctx));
    this.bot.hears(/📋/, (ctx) => this.statusHandler.handleMyVideos(ctx));
    this.bot.hears(/📊/, (ctx) => this.statusHandler.handleQueueStatus(ctx));
    this.bot.hears(/🌍/, (ctx) => this.languageHandler.handleLanguageMenu(ctx));
    this.bot.hears(/❓/, (ctx) => this.statusHandler.handleHelp(ctx));

    // Photo upload
    this.bot.on('photo', (ctx) => this.photoHandler.handlePhoto(ctx));
    this.bot.action('photos_continue', (ctx) =>
      this.photoHandler.handlePhotoContinue(ctx)
    );

    // Script input
    this.bot.action('script_skip', (ctx) =>
      this.scriptHandler.handleScriptSkip(ctx)
    );
    this.bot.action('script_input', (ctx) =>
      this.scriptHandler.handleScriptInputStart(ctx)
    );

    // Handle text messages for script input
    this.bot.on('text', async (ctx) => {
      try {
        const userId = ctx.from.id;
        const session = await sessionService.getSession(userId);

        if (
          session &&
          session.state === 'entering_script' &&
          !ctx.message.text.startsWith('/')
        ) {
          this.scriptHandler.handleScriptInput(ctx);
        }
      } catch (error) {
        console.error('Text handler error:', error);
      }
    });

    // Payment handlers
    this.bot.action('payment_confirm', (ctx) =>
      this.paymentHandler.handlePaymentConfirm(ctx)
    );
    this.bot.action('payment_cancel', (ctx) =>
      this.paymentHandler.handlePaymentCancel(ctx)
    );
    this.bot.on('successful_payment', (ctx) =>
      this.paymentHandler.handleSuccessfulPayment(ctx)
    );
    this.bot.on('pre_checkout_query', (ctx) =>
      this.paymentHandler.handlePreCheckoutQuery(ctx)
    );

    // Navigation callbacks
    this.bot.action('main_menu', async (ctx) => {
      try {
        const userId = ctx.from.id;
        const session = await sessionService.getSession(userId);

        if (session) {
          session.state = 'menu';
          await sessionService.saveSession(userId, session);
          const t = TelegramI18n.getT(session.language);

          const mainMenuText = t('main_menu');
          await ctx.reply(mainMenuText);

          setTimeout(async () => {
            const chooseOption = t('choose_option');
            const mainMenu = Keyboards.mainMenu(session.language);
            await ctx.reply(chooseOption, {
              reply_markup: mainMenu,
            });
          }, 1000);
        }
      } catch (error) {
        console.error('Main menu navigation error:', error);
        const t = TelegramI18n.getT('en');
        const errorMessage = t('errors.something_wrong');
        await ctx.reply(errorMessage);
      }
    });

    // Error handling
    this.bot.catch(async (err, ctx) => {
      console.error('Bot error:', err);
      try {
        const t = TelegramI18n.getT('en');
        const errorMessage = t('errors.something_wrong');
        await ctx.reply(errorMessage).catch(() => {});
      } catch (error) {
        console.error('Error in error handler:', error);
        await ctx
          .reply('❌ Something went wrong. Please try again.')
          .catch(() => {});
      }
    });

    // Graceful shutdown
    this.shutdown = this.shutdown.bind(this);
    process.on('SIGINT', this.shutdown);
    process.on('SIGTERM', this.shutdown);
  }

  // Setup webhook endpoint for backend notifications
  setupWebhook() {
    this.webhookApp.use(express.json());

    this.webhookApp.post('/webhook', async (req, res) => {
      try {
        const { userId, requestId, status, language = 'en' } = req.body;

        // Validate required parameters
        if (!userId || !requestId || !status) {
          return res.status(400).json({
            success: false,
            error: 'Missing required parameters: userId, requestId, status',
          });
        }

        // Validate userId is a positive number
        const numericUserId = Number(userId);
        if (!Number.isInteger(numericUserId) || numericUserId <= 0) {
          return res.status(400).json({
            success: false,
            error: 'User ID must be a positive integer',
          });
        }

        // Validate UUID format
        if (!this.isValidUUID(requestId)) {
          return res.status(400).json({
            success: false,
            error: 'Invalid request ID format',
          });
        }

        // Send notification to user
        await this.sendStatusNotification(
          numericUserId,
          requestId,
          status,
          language
        );

        res.json({
          success: true,
          message: 'Notification sent successfully',
        });
      } catch (error) {
        console.error('Webhook error:', error);
        res.status(500).json({
          success: false,
          error: 'Internal server error',
        });
      }
    });

    // Health check endpoint
    this.webhookApp.get('/health', (req, res) => {
      res.json({
        status: 'ok',
        service: 'telegram-bot-webhook',
        timestamp: new Date().toISOString(),
      });
    });
  }

  isValidUUID(uuid) {
    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    return uuidRegex.test(uuid);
  }

  // Method to send status notifications (called by backend webhook)
  async sendStatusNotification(userId, requestId, status, language = 'en') {
    try {
      const t = TelegramI18n.getT(language);

      const statusText = t(`videos.status_${status}`) || status;

      let message = `${t('notifications.update_title')}\n\n`;
      message += `${t('notifications.request_id')} #${requestId.substring(
        0,
        8
      )}\n`;
      message += `${t('notifications.status')} ${statusText}\n\n`;

      if (status === 'completed') {
        message += t('notifications.completed');
      } else if (status === 'in_progress') {
        message += t('notifications.in_progress');
      }

      await this.bot.telegram.sendMessage(userId, message);

      return { success: true };
    } catch (error) {
      // Handle Telegram API errors gracefully
      if (error.response?.error_code === 400) {
        console.warn(
          `Notification failed for user ${userId}: ${error.response.description}`
        );
        return { success: false };
      }

      console.error('Failed to send notification:', error.message);
      return { success: false };
    }
  }

  // Graceful shutdown
  async shutdown() {
    console.log('\n🛑 Shutting down bot gracefully...');

    try {
      // Stop the bot
      await this.bot.stop();
      console.log('✅ Bot stopped');

      // Stop the webhook server
      if (this.webhookServer) {
        this.webhookServer.close();
        console.log('✅ Webhook server stopped');
      }

      // Close Redis connections
      await closeRedisConnections();

      process.exit(0);
    } catch (error) {
      console.error('❌ Error during shutdown:', error);
      process.exit(1);
    }
  }

  async start() {
    console.log('🤖 Starting AI Pet Video Bot...');

    try {
      // Connect to Redis first
      const redisConnected = await connectRedis();
      if (!redisConnected) {
        console.warn('⚠️ Redis connection failed - sessions will not persist');
      }

      // Start webhook server
      const WEBHOOK_PORT = process.env.BOT_WEBHOOK_PORT || 3001;
      this.webhookServer = this.webhookApp.listen(WEBHOOK_PORT, () => {
        console.log(`🌐 Bot webhook server running on port ${WEBHOOK_PORT}`);
        console.log(`📬 Webhook URL: http://localhost:${WEBHOOK_PORT}/webhook`);
        console.log(`🏥 Health check: http://localhost:${WEBHOOK_PORT}/health`);
      });

      // Test API connection
      this.apiService
        .getQueueEstimation()
        .then((result) => {
          if (result.success) {
            console.log('✅ Backend API connection successful');
          } else {
            console.warn('⚠️ Backend API connection failed:', result.error);
          }
        })
        .catch((err) => {
          console.warn('⚠️ Backend API connection error:', err.message);
        });

      // Launch bot with error handling
      this.bot
        .launch()
        .then(() => {
          console.log('🚀 Bot is running!');

          // Get bot info
          setTimeout(() => {
            if (this.bot.botInfo && this.bot.botInfo.username) {
              console.log(`📱 Bot username: @${this.bot.botInfo.username}`);
            } else {
              console.log('❌ Could not load bot username');
            }
          }, 1000);
        })
        .catch((error) => {
          console.error('❌ Failed to start bot:', error);
          process.exit(1);
        });
    } catch (error) {
      console.error('❌ Failed to start bot services:', error);
      process.exit(1);
    }
  }
}

// Start the bot
if (require.main === module) {
  const bot = new AIPetVideoBot();
  bot.start();
}

module.exports = AIPetVideoBot;
