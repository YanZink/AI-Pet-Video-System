const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');
const { REQUEST_STATUS, PAYMENT_STATUS } = require('../utils/constants');

const Request = sequelize.define(
  'Request',
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },

    user_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id',
      },
    },

    photos: {
      type: DataTypes.JSON,
      allowNull: false,
      validate: {
        isValidPhotosArray(value) {
          if (!Array.isArray(value) || value.length === 0) {
            throw new Error('Photos must be a non-empty array');
          }
          if (value.length > 10) {
            throw new Error('Maximum 10 photos allowed');
          }
        },
      },
    },

    script: {
      type: DataTypes.TEXT,
      allowNull: true,
    },

    template_id: {
      type: DataTypes.UUID,
      allowNull: true,
    },

    status: {
      type: DataTypes.ENUM(Object.values(REQUEST_STATUS)),
      defaultValue: REQUEST_STATUS.CREATED,
    },

    payment_status: {
      type: DataTypes.ENUM(Object.values(PAYMENT_STATUS)),
      defaultValue: PAYMENT_STATUS.PENDING,
    },

    payment_id: {
      type: DataTypes.STRING,
      allowNull: true,
      comment: 'Stores Telegram payment ID or Stripe session ID',
    },

    // Stripe-specific fields
    stripe_payment_intent_id: {
      type: DataTypes.STRING,
      allowNull: true,
      comment: 'Stripe Payment Intent ID',
    },

    stripe_session_id: {
      type: DataTypes.STRING,
      allowNull: true,
      comment: 'Stripe Checkout Session ID',
    },

    stripe_customer_id: {
      type: DataTypes.STRING,
      allowNull: true,
      comment: 'Stripe Customer ID',
    },

    amount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true,
    },

    currency: {
      type: DataTypes.STRING(3),
      defaultValue: 'USD',
    },

    video_url: {
      type: DataTypes.STRING(500),
      allowNull: true,
    },

    admin_notes: {
      type: DataTypes.TEXT,
      allowNull: true,
    },

    processing_started_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },

    completed_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },

    cancelled_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },

    cancellation_reason: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
  },
  {
    tableName: 'requests',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',

    hooks: {
      beforeUpdate: async (request) => {
        if (request.changed('status')) {
          if (
            request.status === REQUEST_STATUS.IN_PROGRESS &&
            !request.processing_started_at
          ) {
            request.processing_started_at = new Date();
          }

          if (
            request.status === REQUEST_STATUS.COMPLETED &&
            !request.completed_at
          ) {
            request.completed_at = new Date();
          }

          if (
            request.status === REQUEST_STATUS.CANCELLED &&
            !request.cancelled_at
          ) {
            request.cancelled_at = new Date();
          }
        }
      },
    },
  }
);

Request.prototype.canBeModified = function () {
  return [REQUEST_STATUS.CREATED, REQUEST_STATUS.PAID].includes(this.status);
};

Request.prototype.isPaid = function () {
  return this.payment_status === PAYMENT_STATUS.PAID;
};

Request.prototype.getPublicData = function () {
  const publicData = { ...this.toJSON() };
  delete publicData.admin_notes;
  return publicData;
};

// Check if payment is via Stripe
Request.prototype.isStripePayment = function () {
  return this.stripe_session_id || this.stripe_payment_intent_id;
};

// Get payment provider
Request.prototype.getPaymentProvider = function () {
  if (this.stripe_session_id || this.stripe_payment_intent_id) {
    return 'stripe';
  }
  if (this.payment_id && this.payment_id.startsWith('telegram_')) {
    return 'telegram';
  }
  return 'unknown';
};

Request.getEstimatedWaitTime = async function () {
  const queueSize = await this.count({
    where: {
      status: [REQUEST_STATUS.PAID, REQUEST_STATUS.IN_PROGRESS],
    },
  });

  return queueSize * 10; // 10 minutes per request
};

module.exports = Request;
