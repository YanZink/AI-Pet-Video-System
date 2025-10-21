const express = require('express');
const { authMiddleware, adminMiddleware } = require('../middleware/auth');
const { validateBody, validateUUIDParam } = require('../middleware/validation');
const { requestSchemas } = require('../middleware/validation');
const { apiKeyMiddleware } = require('../middleware/apiKey');
const adminController = require('../controllers/adminController');

const adminRouter = express.Router();

// All admin routes require authentication and admin role
adminRouter.use(authMiddleware);
adminRouter.use(adminMiddleware);

// Dashboard stats
adminRouter.get('/dashboard/stats', adminController.getDashboardStats);

// Request management
adminRouter.get('/requests', adminController.getAllRequests);

adminRouter.patch(
  '/requests/:id/status',
  validateUUIDParam(),
  validateBody(requestSchemas.updateRequestStatus),
  adminController.updateRequestStatus
);

// Telegram bot webhook endpoint for notifications
adminRouter.post(
  '/telegram/notify',
  apiKeyMiddleware.telegramBot, // Require telegram bot API key
  async (req, res) => {
    try {
      const { userId, requestId, status, language = 'en' } = req.body;

      // Validate required parameters
      if (!userId || !requestId || !status) {
        return res.status(400).json({
          error: 'Missing required parameters: userId, requestId, status',
          code: 'VALIDATION_ERROR',
        });
      }

      // Validate userId is a positive integer
      const numericUserId = Number(userId);
      if (!Number.isInteger(numericUserId) || numericUserId <= 0) {
        return res.status(400).json({
          error: 'User ID must be a positive integer',
          code: 'VALIDATION_ERROR',
        });
      }

      // Validate UUID format for requestId
      const uuidRegex =
        /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
      if (!uuidRegex.test(requestId)) {
        return res.status(400).json({
          error: 'Invalid request ID format',
          code: 'VALIDATION_ERROR',
        });
      }

      // Validate status
      const validStatuses = [
        'created',
        'paid',
        'in_progress',
        'completed',
        'cancelled',
      ];
      if (!validStatuses.includes(status)) {
        return res.status(400).json({
          error: 'Invalid status value',
          code: 'VALIDATION_ERROR',
        });
      }

      // Log the notification request
      console.log('Telegram notification request:', {
        userId: numericUserId,
        requestId,
        status,
        language,
        apiClient: req.apiClient,
      });

      // Process the notification
      res.json({
        success: true,
        message: 'Notification received successfully',
        data: { userId: numericUserId, requestId, status, language },
      });
    } catch (error) {
      console.error('Telegram webhook error:', error);
      res.status(500).json({
        error: 'Internal server error',
        code: 'SERVER_ERROR',
      });
    }
  }
);

module.exports = adminRouter;
