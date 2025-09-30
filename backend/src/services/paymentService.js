const logger = require('../utils/logger');

class PaymentService {
  constructor() {}

  // Validate payment data
  validateTelegramPayment(paymentData) {
    try {
      const payload = JSON.parse(paymentData.invoice_payload);

      // Check if payment is not too old (1 hour)
      const paymentAge = Date.now() - payload.timestamp;
      if (paymentAge > 3600000) {
        return {
          valid: false,
          error: 'Payment payload expired',
        };
      }

      // Validate payload structure
      if (!payload.requestId || !payload.type) {
        return {
          valid: false,
          error: 'Invalid payment payload structure',
        };
      }

      return {
        valid: true,
        requestId: payload.requestId,
        type: payload.type,
        amount: paymentData.total_amount / 100, // Convert cents to dollars
        currency: paymentData.currency,
        telegramPaymentId: paymentData.telegram_payment_charge_id,
      };
    } catch (error) {
      logger.error('Telegram payment validation failed:', error);
      return {
        valid: false,
        error: 'Invalid payment payload',
      };
    }
  }

  // Take payment data and return payment info
  getPaymentInfo(paymentData) {
    return {
      amount: paymentData.total_amount / 100, // stars to dollars
      currency: paymentData.currency,
      telegramPaymentId: paymentData.telegram_payment_charge_id,
      providerPaymentId: paymentData.provider_payment_charge_id,
    };
  }
}

const paymentService = new PaymentService();

module.exports = paymentService;
