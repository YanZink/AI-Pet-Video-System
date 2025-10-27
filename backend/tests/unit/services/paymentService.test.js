const paymentService = require('../../../src/services/paymentService');

describe('Payment Service', () => {
  describe('validateTelegramPayment', () => {
    it('should validate valid Telegram payment', () => {
      const paymentData = {
        invoice_payload: JSON.stringify({
          requestId: '123e4567-e89b-12d3-a456-426614174000',
          type: 'video_creation',
          timestamp: Date.now(),
        }),
        total_amount: 1000,
        currency: 'XTR',
        telegram_payment_charge_id: 'telegram_charge_123',
      };

      const result = paymentService.validateTelegramPayment(paymentData);

      expect(result.valid).toBe(true);
      expect(result.requestId).toBe('123e4567-e89b-12d3-a456-426614174000');
      expect(result.type).toBe('video_creation');
      expect(result.amount).toBe(10); // 1000 cents = 10 dollars
      expect(result.currency).toBe('XTR');
      expect(result.telegramPaymentId).toBe('telegram_charge_123');
    });

    it('should reject expired payment payload', () => {
      const paymentData = {
        invoice_payload: JSON.stringify({
          requestId: '123e4567-e89b-12d3-a456-426614174000',
          type: 'video_creation',
          timestamp: Date.now() - 2 * 60 * 60 * 1000, // 2 hours ago
        }),
        total_amount: 1000,
        currency: 'XTR',
      };

      const result = paymentService.validateTelegramPayment(paymentData);

      expect(result.valid).toBe(false);
      expect(result.error).toBe('Payment payload expired');
    });

    it('should reject invalid payload structure', () => {
      const paymentData = {
        invoice_payload: JSON.stringify({
          // Missing required fields
          someField: 'value',
        }),
        total_amount: 1000,
        currency: 'XTR',
      };

      const result = paymentService.validateTelegramPayment(paymentData);

      expect(result.valid).toBe(false);
      expect(result.error).toBe('Invalid payment payload structure');
    });

    it('should handle invalid JSON in invoice_payload', () => {
      const paymentData = {
        invoice_payload: 'invalid-json',
        total_amount: 1000,
        currency: 'XTR',
      };

      const result = paymentService.validateTelegramPayment(paymentData);

      expect(result.valid).toBe(false);
      expect(result.error).toBe('Invalid payment payload');
    });
  });

  describe('getPaymentInfo', () => {
    it('should extract payment information correctly', () => {
      const paymentData = {
        total_amount: 1500, // 15.00 in cents/stars
        currency: 'XTR',
        telegram_payment_charge_id: 'telegram_charge_456',
        provider_payment_charge_id: 'provider_charge_789',
      };

      const result = paymentService.getPaymentInfo(paymentData);

      expect(result.amount).toBe(15); // 1500 cents = 15 dollars
      expect(result.currency).toBe('XTR');
      expect(result.telegramPaymentId).toBe('telegram_charge_456');
      expect(result.providerPaymentId).toBe('provider_charge_789');
    });
  });
});
