const TelegramPaymentService = require('../../src/services/telegramPayment');
const TelegramI18n = require('../../src/config/i18n');

jest.mock('../../src/config/i18n');

describe('TelegramPaymentService', () => {
  let telegramPaymentService;
  let mockBot;

  beforeEach(() => {
    mockBot = {
      telegram: {
        callApi: jest.fn(),
      },
    };
    telegramPaymentService = new TelegramPaymentService(mockBot);
    jest.clearAllMocks();
  });

  describe('createPaymentInvoice', () => {
    test('should create payment invoice with correct structure', () => {
      const mockT = jest.fn((key, vars = {}) => {
        if (key === 'payment.invoice_title') return 'AI Pet Video Creation';
        if (key === 'payment.invoice_description')
          return `Create video from ${vars.photoCount} photos`;
        return key;
      });
      TelegramI18n.getT.mockReturnValue(mockT);

      process.env.VIDEO_PRICE_STARS = '1000';

      const invoice = telegramPaymentService.createPaymentInvoice(
        'request-123',
        3,
        'Test script',
        'en'
      );

      expect(invoice).toEqual({
        title: 'AI Pet Video Creation',
        description: 'Create video from 3 photos',
        payload: expect.any(String),
        currency: 'XTR',
        prices: [
          {
            label: 'Video Creation',
            amount: 1000,
          },
        ],
      });

      // Verify payload can be parsed
      const payload = JSON.parse(invoice.payload);
      expect(payload.requestId).toBe('request-123');
      expect(payload.type).toBe('video_creation');
      expect(payload.timestamp).toBeGreaterThan(0);
    });
  });

  describe('sendInvoice', () => {
    test('should send invoice successfully', async () => {
      const mockT = jest.fn((key) => {
        if (key === 'payment.invoice_title') return 'AI Pet Video';
        if (key === 'payment.invoice_description')
          return 'Create video from photos';
        return key;
      });
      TelegramI18n.getT.mockReturnValue(mockT);

      mockBot.telegram.callApi.mockResolvedValue({ message_id: 123 });

      const result = await telegramPaymentService.sendInvoice(
        123456,
        'request-123',
        2,
        'Test script',
        'en'
      );

      expect(result.success).toBe(true);
      expect(mockBot.telegram.callApi).toHaveBeenCalledWith('sendInvoice', {
        chat_id: 123456,
        title: 'AI Pet Video',
        description: 'Create video from photos',
        payload: expect.any(String),
        provider_token: '',
        currency: 'XTR',
        prices: [{ label: 'Video Creation', amount: 1000 }],
        photo_url:
          'https://via.placeholder.com/300/4A90E2/FFFFFF?text=AI+Pet+Video',
        need_name: false,
        need_phone_number: false,
        need_email: false,
        need_shipping_address: false,
        is_flexible: false,
      });
    });

    test('should handle missing title', async () => {
      const mockT = jest.fn(() => undefined); // Return undefined for title
      TelegramI18n.getT.mockReturnValue(mockT);

      const result = await telegramPaymentService.sendInvoice(
        123456,
        'request-123',
        2,
        'Test script',
        'en'
      );

      expect(result.success).toBe(false);
      expect(result.error).toContain('Invoice title is required');
    });

    test('should handle API error', async () => {
      const mockT = jest.fn((key) => {
        if (key === 'payment.invoice_title') return 'AI Pet Video';
        if (key === 'payment.invoice_description') return 'Create video';
        return key;
      });
      TelegramI18n.getT.mockReturnValue(mockT);

      mockBot.telegram.callApi.mockRejectedValue(
        new Error('Telegram API error')
      );

      const result = await telegramPaymentService.sendInvoice(
        123456,
        'request-123',
        2,
        'Test script',
        'en'
      );

      expect(result.success).toBe(false);
      expect(result.error).toBe('Telegram API error');
    });
  });

  describe('validatePayment', () => {
    test('should validate correct payment data', () => {
      const paymentData = {
        invoice_payload: JSON.stringify({
          requestId: 'request-123',
          type: 'video_creation',
          timestamp: Date.now(),
        }),
      };

      const result = telegramPaymentService.validatePayment(paymentData);

      expect(result.valid).toBe(true);
      expect(result.requestId).toBe('request-123');
    });

    test('should reject expired payment', () => {
      const paymentData = {
        invoice_payload: JSON.stringify({
          requestId: 'request-123',
          type: 'video_creation',
          timestamp: Date.now() - 7200000, // 2 hours ago
        }),
      };

      const result = telegramPaymentService.validatePayment(paymentData);

      expect(result.valid).toBe(false);
      expect(result.error).toContain('expired');
    });

    test('should handle invalid JSON payload', () => {
      const paymentData = {
        invoice_payload: 'invalid-json',
      };

      const result = telegramPaymentService.validatePayment(paymentData);

      expect(result.valid).toBe(false);
      expect(result.error).toContain('Invalid payment payload');
    });
  });
});
