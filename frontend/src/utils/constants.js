export const REQUEST_STATUS = {
  CREATED: 'created',
  PAID: 'paid',
  IN_PROGRESS: 'in_progress',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
};

export const PAYMENT_STATUS = {
  PENDING: 'pending',
  PAID: 'paid',
  FAILED: 'failed',
  REFUNDED: 'refunded',
};

export const USER_ROLES = {
  USER: 'user',
  ADMIN: 'admin',
};

export const API_ENDPOINTS = {
  USERS: '/users',
  REQUESTS: '/requests',
  PAYMENTS: '/payments',
  ADMIN: '/admin',
};

export const APP_CONFIG = {
  MAX_PHOTOS: 10,
  MAX_FILE_SIZE: 10 * 1024 * 1024, // 10MB
  ALLOWED_IMAGE_TYPES: ['image/jpeg', 'image/png', 'image/webp'],
  VIDEO_PRICE: 10.0,
  CURRENCY: 'USD',
};
