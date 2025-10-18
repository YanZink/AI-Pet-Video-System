const Joi = require('joi');
const { ERROR_CODES } = require('../utils/constants');

const commonSchemas = {
  uuid: Joi.string().uuid().required(),
  email: Joi.string().email().min(5).max(255),
  password: Joi.string().min(6).max(128),
  language: Joi.string().valid('ru', 'en').default('en'),
};

const userSchemas = {
  createUser: Joi.object({
    telegram_id: Joi.number().integer().positive().optional(),
    email: commonSchemas.email.optional(),
    username: Joi.string().min(3).max(50).optional(),
    first_name: Joi.string().min(1).max(100).optional(),
    last_name: Joi.string().min(1).max(100).optional(),
    password: commonSchemas.password.optional(),
    language: commonSchemas.language,
  }).or('telegram_id', 'email'),

  loginUser: Joi.object({
    email: commonSchemas.email.required(),
    password: commonSchemas.password.required(),
  }),

  updateLanguage: Joi.object({
    language: commonSchemas.language.required(),
  }),

  verifyEmail: Joi.object({
    token: Joi.string().required(),
  }),

  resendVerification: Joi.object({
    email: commonSchemas.email.required(),
  }),
};

const requestSchemas = {
  createRequest: Joi.object({
    photos: Joi.array()
      .items(Joi.string().min(1).max(500))
      .min(1)
      .max(10)
      .required(),
    script: Joi.string().max(1000).optional().allow('').allow(null),
    template_id: Joi.string().max(50).optional().allow(null),
  }),

  updateRequestStatus: Joi.object({
    status: Joi.string()
      .valid('created', 'paid', 'in_progress', 'completed', 'cancelled')
      .required(),
    admin_notes: Joi.string().max(2000).optional().allow(''),
    video_url: Joi.string().uri().optional(),
    cancellation_reason: Joi.string().max(500).optional(),
  }),
};

const paymentSchemas = {
  createCheckout: Joi.object({
    request_id: commonSchemas.uuid,
  }),

  telegramPayment: Joi.object({
    request_id: commonSchemas.uuid,
    payment_data: Joi.object().required(),
  }),

  createPaymentIntent: Joi.object({
    request_id: commonSchemas.uuid,
  }),
};

const validateBody = (schema) => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req.body, {
      abortEarly: false,
      stripUnknown: true,
    });

    if (error) {
      const details = error.details.map((detail) => ({
        field: detail.path.join('.'),
        message: detail.message,
      }));

      return res.status(400).json({
        error: req.t('errors.validation_error'),
        code: ERROR_CODES.VALIDATION_ERROR,
        details,
      });
    }

    req.validatedBody = value;
    next();
  };
};

const validateParams = (schema) => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req.params);

    if (error) {
      return res.status(400).json({
        error: req.t('errors.invalid_parameters'),
        code: ERROR_CODES.VALIDATION_ERROR,
        details: error.details,
      });
    }

    req.validatedParams = value;
    next();
  };
};

const validateUUIDParam = (paramName = 'id') => {
  return validateParams(
    Joi.object({
      [paramName]: commonSchemas.uuid,
    })
  );
};

module.exports = {
  validateBody,
  validateParams,
  validateUUIDParam,
  userSchemas,
  requestSchemas,
  paymentSchemas,
};
