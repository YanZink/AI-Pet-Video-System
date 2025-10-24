const TelegramI18n = require('../config/i18n');
const Keyboards = require('../utils/keyboards');
const sessionService = require('../services/sessionService');
const { validateMimeType } = require('../middleware/sanitization');
const axios = require('axios');

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

      const mimeType = 'image/jpeg';

      if (!validateMimeType(mimeType)) {
        const invalidType = t('errors.invalid_file_type');
        await ctx.reply(invalidType);
        return;
      }

      await this.uploadPhotoToS3(ctx, session, photo, mimeType, t);
    } catch (error) {
      console.error('Handle photo error:', error);
      const t = TelegramI18n.getT('en');
      const errorMessage = t('errors.invalid_file');
      await ctx.reply(errorMessage);
    }
  }

  async handleDocument(ctx) {
    try {
      const userId = ctx.from.id;
      const session = await sessionService.getSession(userId);

      if (!session || session.state !== 'uploading_photos') {
        return;
      }

      const t = TelegramI18n.getT(session.language);

      if (session.uploadData.photos.length >= this.maxPhotos) {
        const maxReached = t('photos.max_reached');
        await ctx.reply(maxReached);
        return;
      }

      const document = ctx.message.document;

      if (!document.mime_type || !document.mime_type.startsWith('image/')) {
        const invalidType = t('errors.invalid_file_type');
        await ctx.reply(invalidType);
        return;
      }

      if (document.file_size > this.maxFileSize) {
        const fileTooLarge = t('errors.file_too_large');
        await ctx.reply(fileTooLarge);
        return;
      }

      if (!validateMimeType(document.mime_type)) {
        const invalidType = t('errors.invalid_file_type');
        await ctx.reply(invalidType);
        return;
      }

      await this.uploadPhotoToS3(ctx, session, document, document.mime_type, t);
    } catch (error) {
      console.error('Handle document error:', error);
      const t = TelegramI18n.getT('en');
      const errorMessage = t('errors.invalid_file');
      await ctx.reply(errorMessage);
    }
  }

  async uploadPhotoToS3(ctx, session, file, mimeType, t) {
    try {
      console.log('Getting upload URL from backend...', {
        mimeType,
        fileSize: file.file_size,
      });

      const uploadResult = await this.api.generateUploadUrls(
        session.token,
        mimeType,
        1
      );

      if (
        !uploadResult.success ||
        !uploadResult.uploads ||
        uploadResult.uploads.length === 0
      ) {
        console.error('Failed to get upload URL:', uploadResult.error);
        const uploadFailed = t('errors.upload_failed');
        await ctx.reply(uploadFailed);
        return;
      }

      const uploadData = uploadResult.uploads[0];
      const { uploadUrl, key } = uploadData;

      console.log('Downloading file from Telegram...', {
        fileId: file.file_id,
        fileSize: file.file_size,
        mimeType,
      });

      const fileLink = await ctx.telegram.getFileLink(file.file_id);
      const photoResponse = await axios.get(fileLink.href, {
        responseType: 'arraybuffer',
        timeout: 30000,
      });

      const photoBuffer = Buffer.from(photoResponse.data);

      console.log('Uploading to S3...', {
        s3Key: key,
        bufferSize: photoBuffer.length,
        contentType: mimeType,
      });

      const uploadS3Result = await this.api.uploadPhoto(
        uploadUrl,
        photoBuffer,
        mimeType
      );

      if (!uploadS3Result.success) {
        console.error('S3 upload failed:', uploadS3Result.error);
        const uploadFailed = t('errors.upload_failed');
        await ctx.reply(uploadFailed);
        return;
      }

      session.uploadData.photos.push({
        telegramFileId: file.file_id,
        s3Key: key,
        size: file.file_size,
        mimeType: mimeType,
        uploaded: true,
      });

      session.uploadData.uploadedPhotos.push(key);

      const current = session.uploadData.photos.length;
      const progressBar = Keyboards.progressBar(current, this.maxPhotos);
      const receivedMessage = t('photos.received', {
        current,
        max: this.maxPhotos,
      });

      await ctx.reply(
        `Photo ${current}/${this.maxPhotos}\n${progressBar}\n${receivedMessage}`,
        {
          reply_markup: Keyboards.photoContinue(current, session.language),
        }
      );

      await sessionService.saveSession(
        session.user.telegram_id || ctx.from.id,
        session
      );

      console.log('Photo uploaded successfully:', {
        s3Key: key,
        mimeType,
        size: file.file_size,
      });
    } catch (uploadError) {
      console.error('Photo upload error:', uploadError);
      const uploadFailed = t('errors.upload_failed');
      await ctx.reply(uploadFailed);
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
