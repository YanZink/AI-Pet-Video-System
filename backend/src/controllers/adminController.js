const { Request, User, Template } = require('../models');
const queueService = require('../services/queueService');
const { ERROR_CODES } = require('../utils/constants');
const { createError, asyncHandler } = require('../middleware/errorHandler');
const localeManager = require('../locales');
const logger = require('../utils/logger');
const axios = require('axios');

class AdminController {
  /**
   * Get all requests with pagination and filtering
   */
  getAllRequests = asyncHandler(async (req, res) => {
    const { page = 1, limit = 20, status, payment_status } = req.query;

    const whereCondition = {};
    if (status) whereCondition.status = status;
    if (payment_status) whereCondition.payment_status = payment_status;

    const requests = await Request.findAndCountAll({
      where: whereCondition,
      include: [
        {
          model: User,
          as: 'user',
          attributes: [
            'id',
            'username',
            'first_name',
            'last_name',
            'telegram_id',
            'email',
            'language', // Include language for localization
          ],
        },
        {
          model: Template,
          as: 'template',
          attributes: ['id', 'name', 'category'],
        },
      ],
      order: [['created_at', 'DESC']],
      limit: parseInt(limit),
      offset: (parseInt(page) - 1) * parseInt(limit),
    });

    res.json({
      requests: requests.rows,
      pagination: {
        total: requests.count,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(requests.count / parseInt(limit)),
      },
    });
  });

  /**
   * Send Telegram notification to user about status change with i18n
   */
  sendTelegramNotification = async (userId, requestId, status, language) => {
    try {
      if (!process.env.TELEGRAM_BOT_WEBHOOK_URL) {
        logger.warn('Telegram bot webhook URL not configured');
        return;
      }

      // Get localized status message
      const statusMessage =
        localeManager.translate(`status.${status}`, language) || status;
      const notificationTitle = localeManager.translate(
        'notifications.update_title',
        language
      );

      const notificationData = {
        userId,
        requestId,
        status,
        statusMessage,
        notificationTitle,
        language,
      };

      // Send notification to bot's webhook endpoint
      await axios.post(
        `${process.env.TELEGRAM_BOT_WEBHOOK_URL}/webhook`,
        notificationData,
        {
          timeout: 5000,
        }
      );

      logger.info('Telegram notification sent successfully', {
        userId,
        requestId,
        status,
        language,
      });
    } catch (error) {
      logger.warn('Failed to send Telegram notification:', error.message);
    }
  };

  /**
   * Update request status and send notifications with i18n
   */
  updateRequestStatus = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { status, admin_notes, video_url } = req.validatedBody;

    // Find request with user data
    const request = await Request.findByPk(id, {
      include: [
        {
          model: User,
          as: 'user',
        },
      ],
    });

    if (!request) {
      throw createError('Request not found', 404, ERROR_CODES.NOT_FOUND_ERROR);
    }

    const oldStatus = request.status;

    // Prepare update data
    const updateData = { status };
    if (admin_notes !== undefined) updateData.admin_notes = admin_notes;
    if (video_url !== undefined) updateData.video_url = video_url;

    // Update request
    await request.update(updateData);

    // Send notifications if status changed
    if (oldStatus !== status) {
      const userLanguage = request.user.language || 'en';

      // Send email notification with i18n
      await queueService.addEmailJob('status_update', {
        user: request.user.toJSON(),
        request: request.toJSON(),
        newStatus: status,
        language: userLanguage,
      });

      // Send Telegram notification if user has telegram_id
      if (request.user.telegram_id) {
        await this.sendTelegramNotification(
          request.user.telegram_id,
          request.id,
          status,
          userLanguage
        );
      }
    }

    // Log the action
    logger.info('Request status updated by admin', {
      requestId: request.id,
      oldStatus,
      newStatus: status,
      adminId: req.user.id,
    });

    // Return success response with localized message
    const successMessage = localeManager.translate(
      'admin.request_updated',
      req.language,
      {
        defaultValue: 'Request status updated successfully',
      }
    );

    res.json({
      message: successMessage,
      request: request.toJSON(),
    });
  });

  /**
   * Get dashboard statistics
   */
  getDashboardStats = asyncHandler(async (req, res) => {
    // Total requests count
    const totalRequests = await Request.count();

    // Paid requests count
    const paidRequests = await Request.count({
      where: { payment_status: 'paid' },
    });

    // Completed requests count
    const completedRequests = await Request.count({
      where: { status: 'completed' },
    });

    // Revenue calculation
    const revenueResult = await Request.findOne({
      where: { payment_status: 'paid' },
      attributes: [
        [
          Request.sequelize.fn('sum', Request.sequelize.col('amount')),
          'total_revenue',
        ],
      ],
      raw: true,
    });

    // Calculate conversion rate
    const conversionRate =
      totalRequests > 0 ? ((paidRequests / totalRequests) * 100).toFixed(2) : 0;

    // Get localized labels
    const labels = {
      total_requests: localeManager.translate(
        'admin.total_requests',
        req.language,
        { defaultValue: 'Total Requests' }
      ),
      paid_requests: localeManager.translate(
        'admin.paid_requests',
        req.language,
        { defaultValue: 'Paid Requests' }
      ),
      completed_requests: localeManager.translate(
        'admin.completed_requests',
        req.language,
        { defaultValue: 'Completed Requests' }
      ),
      total_revenue: localeManager.translate(
        'admin.total_revenue',
        req.language,
        { defaultValue: 'Total Revenue' }
      ),
      conversion_rate: localeManager.translate(
        'admin.conversion_rate',
        req.language,
        { defaultValue: 'Conversion Rate' }
      ),
    };

    res.json({
      summary: {
        total_requests: totalRequests,
        paid_requests: paidRequests,
        completed_requests: completedRequests,
        total_revenue: parseFloat(revenueResult?.total_revenue || 0),
        conversion_rate: conversionRate,
      },
      labels,
    });
  });

  /**
   * Get templates with localized data
   */
  getTemplates = asyncHandler(async (req, res) => {
    const { language = 'en' } = req.query;

    const templates = await Template.findLocalized(language, {
      where: { is_active: true },
    });

    res.json({
      templates,
      language,
    });
  });

  /**
   * Update template translations
   */
  updateTemplateTranslation = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { key, language, text } = req.body;

    const template = await Template.findByPk(id);
    if (!template) {
      throw createError('Template not found', 404, ERROR_CODES.NOT_FOUND_ERROR);
    }

    await template.setTranslation(key, language, text);

    logger.info('Template translation updated by admin', {
      templateId: template.id,
      key,
      language,
      adminId: req.user.id,
    });

    res.json({
      message: 'Template translation updated successfully',
      template: await template.getLocalizedData(language),
    });
  });
}

module.exports = new AdminController();
