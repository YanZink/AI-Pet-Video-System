const { Request, User, Template } = require('../models');
const queueService = require('../services/queueService');
const { ERROR_CODES } = require('../utils/constants');
const { createError, asyncHandler } = require('../middleware/errorHandler');
const logger = require('../utils/logger');

class AdminController {
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
          ],
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
      await queueService.addEmailJob('status_update', {
        user: request.user.toJSON(),
        request: request.toJSON(),
        newStatus: status,
      });
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

  getDashboardStats = asyncHandler(async (req, res) => {
    const totalRequests = await Request.count();
    const paidRequests = await Request.count({
      where: { payment_status: 'paid' },
    });
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

    res.json({
      summary: {
        total_requests: totalRequests,
        paid_requests: paidRequests,
        completed_requests: completedRequests,
        total_revenue: parseFloat(revenueResult?.total_revenue || 0),
        conversion_rate:
          totalRequests > 0
            ? ((paidRequests / totalRequests) * 100).toFixed(2)
            : 0,
      },
    });
  });
}

module.exports = new AdminController();
