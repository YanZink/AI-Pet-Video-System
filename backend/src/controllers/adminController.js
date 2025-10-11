const { Request, User, Template } = require('../models');
const queueService = require('../services/queueService');
const { ERROR_CODES } = require('../utils/constants');
const { createError, asyncHandler } = require('../middleware/errorHandler');
const localeManager = require('../../../shared-locales');
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
            'language',
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
      const statusKey = `videos.status_${status}`;
      const statusMessage =
        localeManager.translate(statusKey, language) || status;
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

    const updateData = { status };
    if (admin_notes !== undefined) updateData.admin_notes = admin_notes;
    if (video_url !== undefined) updateData.video_url = video_url;

    await request.update(updateData);

    if (oldStatus !== status) {
      const userLanguage = request.user.language || 'en';

      await queueService.addEmailJob('status_update', {
        user: request.user.toJSON(),
        request: request.toJSON(),
        newStatus: status,
        language: userLanguage,
      });

      if (request.user.telegram_id) {
        await this.sendTelegramNotification(
          request.user.telegram_id,
          request.id,
          status,
          userLanguage
        );
      }
    }

    logger.info('Request status updated by admin', {
      requestId: request.id,
      oldStatus,
      newStatus: status,
      adminId: req.user.id,
    });

    res.json({
      message: 'Request status updated successfully',
      request: request.toJSON(),
    });
  });

  /**
   * Get dashboard statistics
   */
  getDashboardStats = asyncHandler(async (req, res) => {
    const totalRequests = await Request.count();
    const paidRequests = await Request.count({
      where: { payment_status: 'paid' },
    });
    const completedRequests = await Request.count({
      where: { status: 'completed' },
    });

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

    const conversionRate =
      totalRequests > 0 ? ((paidRequests / totalRequests) * 100).toFixed(2) : 0;

    res.json({
      summary: {
        total_requests: totalRequests,
        paid_requests: paidRequests,
        completed_requests: completedRequests,
        total_revenue: parseFloat(revenueResult?.total_revenue || 0),
        conversion_rate: conversionRate,
      },
    });
  });
}

module.exports = new AdminController();
