const Keyboards = require('../utils/keyboards');
const sessionService = require('../services/sessionService');

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
        const t = await Keyboards.getLocale('en');
        const errorMessage = await t('errors.network');
        await ctx.reply(errorMessage);
        return;
      }

      const t = await Keyboards.getLocale(session.language);
      const requestMessage = await t('photos.request');

      // Initialize photo upload session with uploadData structure
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
      const t = await Keyboards.getLocale('en');
      const errorMessage = await t('errors.network');
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

      const t = await Keyboards.getLocale(session.language);

      // Check photo limit using uploadData structure
      if (session.uploadData.photos.length >= this.maxPhotos) {
        const maxReached = await t('photos.max_reached');
        await ctx.reply(maxReached);
        return;
      }

      const photo = ctx.message.photo[ctx.message.photo.length - 1];

      if (photo.file_size > this.maxFileSize) {
        const fileTooLarge = await t('errors.file_too_large');
        await ctx.reply(fileTooLarge);
        return;
      }

      try {
        // SIMULATED UPLOAD
        const simulatedS3Key = `photos/simulated-${Date.now()}-${Math.random()
          .toString(36)
          .substring(7)}.jpg`;

        // Store photo info using uploadData structure
        session.uploadData.photos.push({
          telegramFileId: photo.file_id,
          s3Key: simulatedS3Key,
          size: photo.file_size,
          simulated: true,
        });

        session.uploadData.uploadedPhotos.push(simulatedS3Key);

        const current = session.uploadData.photos.length;
        const progressBar = Keyboards.progressBar(current, this.maxPhotos);
        const receivedMessage = await t('photos.received', {
          current,
          max: this.maxPhotos,
        });

        await ctx.reply(
          `📸 ${progressBar} (${current}/${this.maxPhotos})\n` +
            receivedMessage,
          {
            reply_markup: await Keyboards.photoContinue(
              current,
              session.language
            ),
          }
        );

        await sessionService.saveSession(userId, session);
      } catch (uploadError) {
        console.error('Photo processing error:', uploadError);
        const uploadFailed = await t('errors.upload_failed');
        await ctx.reply(uploadFailed);
      }
    } catch (error) {
      console.error('Handle photo error:', error);
      const t = await Keyboards.getLocale('en');
      const errorMessage = await t('errors.invalid_file');
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
        const t = await Keyboards.getLocale('en');
        const errorMessage = await t('errors.no_photos');
        await ctx.editMessageText(errorMessage);
        return;
      }

      const t = await Keyboards.getLocale(session.language);

      // Move to script input
      session.state = 'entering_script';
      await sessionService.saveSession(userId, session);

      const uploadComplete = await t('photos.upload_complete', {
        count: session.uploadData.photos.length,
      });

      await ctx.editMessageText(uploadComplete);

      // Show script input
      setTimeout(async () => {
        const scriptRequest = await t('script.request');
        const scriptOptions = await Keyboards.scriptOptions(session.language);

        await ctx.reply(scriptRequest, {
          reply_markup: scriptOptions,
        });
      }, 1000);
    } catch (error) {
      console.error('Photo continue error:', error);
      const t = await Keyboards.getLocale('en');
      const errorMessage = await t('errors.network');
      await ctx.editMessageText(errorMessage);
    }
  }
}

module.exports = PhotoUploadHandler;
