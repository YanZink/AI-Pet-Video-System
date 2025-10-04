const { Request, Template } = require('../models');
const s3Service = require('../services/s3Service');
const { ERROR_CODES } = require('../utils/constants');
const { createError, asyncHandler } = require('../middleware/errorHandler');
const logger = require('../utils/logger');

class RequestController {
  createRequest = asyncHandler(async (req, res) => {
    const { photos, script, template_id } = req.validatedBody;
    const userId = req.user.id;

    if (template_id) {
      const template = await Template.findByPk(template_id);
      if (!template || !template.is_active) {
        throw createError(
          req.t('errors.template_not_found'),
          404,
          ERROR_CODES.NOT_FOUND_ERROR
        );
      }

      if (photos.length > template.max_photos) {
        throw createError(
          req.t('errors.max_photos_reached'),
          400,
          ERROR_CODES.VALIDATION_ERROR
        );
      }
    }

    const request = await Request.create({
      user_id: userId,
      photos,
      script,
      template_id,
      status: 'created',
      payment_status: 'pending',
    });

    if (template_id) {
      const template = await Template.findByPk(template_id);
      await template.incrementUsage();
    }

    logger.info('New request created', {
      requestId: request.id,
      userId,
      photosCount: photos.length,
      language: req.language,
    });

    res.status(201).json({
      message: req.t('common.continue'),
      request: request.getPublicData(),
    });
  });

  getUserRequests = asyncHandler(async (req, res) => {
    const userId = req.user.id;

    const requests = await Request.findAll({
      where: { user_id: userId },
      include: [
        {
          model: Template,
          as: 'template',
          attributes: ['id', 'name', 'category'],
        },
      ],
      order: [['created_at', 'DESC']],
    });

    const requestsWithUrls = await Promise.all(
      requests.map(async (request) => {
        const requestData = request.getPublicData();

        if (requestData.photos && Array.isArray(requestData.photos)) {
          requestData.photos = await Promise.all(
            requestData.photos.map(async (photoKey) => {
              try {
                const urlData =
                  s3Service.generatePresignedDownloadUrl(photoKey);
                return {
                  key: photoKey,
                  url: urlData.downloadUrl,
                  expires: urlData.expires,
                };
              } catch (error) {
                return {
                  key: photoKey,
                  url: null,
                  error: req.t('errors.upload_failed'),
                };
              }
            })
          );
        }

        if (requestData.video_url) {
          try {
            const videoUrlData = s3Service.generatePresignedDownloadUrl(
              requestData.video_url
            );
            requestData.video_download_url = videoUrlData.downloadUrl;
          } catch (error) {
            requestData.video_download_url = null;
          }
        }

        return requestData;
      })
    );

    res.json({
      requests: requestsWithUrls,
    });
  });

  generateUploadUrls = asyncHandler(async (req, res) => {
    const { file_type, file_count = 1 } = req.body;

    if (!file_type || !file_type.startsWith('image/')) {
      throw createError(
        req.t('errors.invalid_file'),
        400,
        ERROR_CODES.VALIDATION_ERROR
      );
    }

    const uploadUrls = [];
    const useMock = process.env.MOCK_UPLOADS === 'true';

    for (let i = 0; i < file_count; i++) {
      if (useMock) {
        const { v4: uuidv4 } = require('uuid');
        const ext = file_type.split('/')[1] || 'bin';
        const key = `photos/${uuidv4()}.${ext}`;
        const uploadUrl = `${req.protocol}://${req.get(
          'host'
        )}/api/v1/uploads/mock/${key}`;
        uploadUrls.push({
          uploadUrl,
          key,
          contentType: file_type,
          expires: new Date(Date.now() + 30 * 60 * 1000),
          downloadUrl: uploadUrl,
        });
      } else {
        const urlData = s3Service.generatePresignedUploadUrl(
          file_type,
          'photos'
        );
        uploadUrls.push(urlData);
      }
    }

    res.json({
      message: req.t('common.upload_urls_generated'),
      uploads: uploadUrls,
    });
  });

  getQueueEstimation = asyncHandler(async (req, res) => {
    const estimatedMinutes = await Request.getEstimatedWaitTime();

    res.json({
      estimated_wait_minutes: estimatedMinutes,
      estimated_wait_hours: Math.ceil(estimatedMinutes / 60),
      message: req.t('common.wait_time', { minutes: estimatedMinutes }),
    });
  });

  /**
   * Get templates with localized data for the current user's language
   */
  getTemplates = asyncHandler(async (req, res) => {
    const language = req.language;

    const templates = await Template.findLocalized(language, {
      where: { is_active: true },
      order: [
        ['sort_order', 'ASC'],
        ['created_at', 'DESC'],
      ],
    });

    res.json({
      templates,
      language,
    });
  });

  /**
   * Get single template with localized data
   */
  getTemplate = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const language = req.language;

    const template = await Template.findByPk(id);
    if (!template || !template.is_active) {
      throw createError(
        req.t('errors.template_not_found'),
        404,
        ERROR_CODES.NOT_FOUND_ERROR
      );
    }

    const localizedTemplate = await template.getLocalizedData(language);

    res.json({
      template: localizedTemplate,
    });
  });
}

module.exports = new RequestController();
