const express = require('express');
const { authMiddleware, adminMiddleware } = require('../middleware/auth');
const { validateBody, validateUUIDParam } = require('../middleware/validation');
const { requestSchemas } = require('../middleware/validation');
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

// NEW: Telegram bot webhook endpoint for notifications
adminRouter.post('/telegram/notify', async (req, res) => {
  try {
    const { userId, requestId, status, language = 'en' } = req.body;

    // Validate required parameters
    if (!userId || !requestId || !status) {
      return res.status(400).json({
        error: 'Missing required parameters: userId, requestId, status',
        code: 'VALIDATION_ERROR',
      });
    }

    // Log the notification request
    console.log('Telegram notification request:', {
      userId,
      requestId,
      status,
      language,
    });

    // In a real implementation, you would forward this to the bot service
    // For now, just acknowledge the request
    res.json({
      success: true,
      message: 'Notification received successfully',
      data: { userId, requestId, status, language },
    });
  } catch (error) {
    console.error('Telegram webhook error:', error);
    res.status(500).json({
      error: 'Internal server error',
      code: 'SERVER_ERROR',
    });
  }
});

module.exports = adminRouter;
