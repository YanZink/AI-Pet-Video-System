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

module.exports = adminRouter;
