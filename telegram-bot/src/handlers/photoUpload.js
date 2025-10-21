const TelegramI18n = require('../config/i18n');
const Keyboards = require('../utils/keyboards');
const sessionService = require('../services/sessionService');
const SanitizationMiddleware = require('../middleware/sanitization');

class PhotoUploadHandler {
  constructor(bot, apiService, userSessions) {
    this.bot = bot;
    this.api = apiService;
    this.sessions = userSessions;
    this.maxPhotos = parseInt(process.env.MAX_PHOTOS_PER_REQUEST) || 10;
    this.maxFileSize = parseInt(process.env.PHOTO_SIZE_LIMIT) || 10485760;
  }

  async startPhotoUpload(ctx) {
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
      const requestMessage = t('photos.request');

      // Initialize photo upload session
      session.state = 'uploading_photos';
      session.uploadData = {
        photos: [],
        uploadedPhotos: [],
        script: null,
        currentRequestId: null,
      };
      await sessionService.saveSession(userId, session);

      await ctx.reply(requestMessage, {
        reply_markup: { remove_keyboard: true },
      });
    } catch (error) {
      console.error('Start photo upload error:', error);
      const t = TelegramI18n.getT('en');
      const errorMessage = t('errors.something_wrong');
      await ctx.reply(errorMessage);
    }
  }

  async handlePhoto(ctx) {
    try {
      const userId = ctx.from.id;
      const session = await sessionService.getSession(userId);

      if (!session || session.state !== 'uploading_photos') {
        return;
      }

      const t = TelegramI18n.getT(session.language);

      // Check photo limit
      if (session.uploadData.photos.length >= this.maxPhotos) {
        const maxReached = t('photos.max_reached');
        await ctx.reply(maxReached);
        return;
      }

      const photo = ctx.message.photo[ctx.message.photo.length - 1];

      // Check file size
      if (photo.file_size > this.maxFileSize) {
        const fileTooLarge = t('errors.file_too_large');
        await ctx.reply(fileTooLarge);
        return;
      }

      // Validate MIME type (Telegram photos are typically JPEG)
      const mimeType = 'image/jpeg'; // Telegram compresses photos to JPEG
      if (!SanitizationMiddleware.validateMimeType(mimeType)) {
        const invalidType = t('errors.invalid_file_type');
        await ctx.reply(invalidType);
        return;
      }

      try {
        // SIMULATED UPLOAD
        const simulatedS3Key = `photos/simulated-${Date.now()}-${Math.random()
          .toString(36)
          .substring(7)}.jpg`;

        // Store photo info
        session.uploadData.photos.push({
          telegramFileId: photo.file_id,
          s3Key: simulatedS3Key,
          size: photo.file_size,
          mimeType: mimeType,
          simulated: true,
        });

        session.uploadData.uploadedPhotos.push(simulatedS3Key);

        const current = session.uploadData.photos.length;
        const progressBar = Keyboards.progressBar(current, this.maxPhotos);
        const receivedMessage = t('photos.received', {
          current,
          max: this.maxPhotos,
        });

        await ctx.reply(
          `📸 ${progressBar} (${current}/${this.maxPhotos})\n` +
            receivedMessage,
          {
            reply_markup: Keyboards.photoContinue(current, session.language),
          }
        );

        await sessionService.saveSession(userId, session);
      } catch (uploadError) {
        console.error('Photo processing error:', uploadError);
        const uploadFailed = t('errors.upload_failed');
        await ctx.reply(uploadFailed);
      }
    } catch (error) {
      console.error('Handle photo error:', error);
      const t = TelegramI18n.getT('en');
      const errorMessage = t('errors.invalid_file');
      await ctx.reply(errorMessage);
    }
  }

  async handlePhotoContinue(ctx) {
    try {
      const userId = ctx.from.id;
      const session = await sessionService.getSession(userId);

      if (
        !session ||
        !session.uploadData.photos ||
        session.uploadData.photos.length === 0
      ) {
        const t = TelegramI18n.getT('en');
        const errorMessage = t('errors.no_photos');
        await ctx.editMessageText(errorMessage);
        return;
      }

      const t = TelegramI18n.getT(session.language);

      // Move to script input
      session.state = 'entering_script';
      await sessionService.saveSession(userId, session);

      const uploadComplete = t('photos.upload_complete', {
        count: session.uploadData.photos.length,
      });

      await ctx.editMessageText(uploadComplete);

      // Show script input
      setTimeout(async () => {
        const scriptRequest = t('script.request');
        const scriptOptions = Keyboards.scriptOptions(session.language);

        await ctx.reply(scriptRequest, {
          reply_markup: scriptOptions,
        });
      }, 1000);
    } catch (error) {
      console.error('Photo continue error:', error);
      const t = TelegramI18n.getT('en');
      const errorMessage = t('errors.something_wrong');
      await ctx.editMessageText(errorMessage);
    }
  }
}

module.exports = PhotoUploadHandler;
