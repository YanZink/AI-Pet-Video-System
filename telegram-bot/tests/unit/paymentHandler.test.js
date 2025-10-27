const PaymentHandler = require('../../src/handlers/payment');
const TelegramI18n = require('../../src/config/i18n');
const Keyboards = require('../../src/utils/keyboards');
const sessionService = require('../../src/services/sessionService');
const ApiService = require('../../src/services/apiService');
const TelegramPaymentService = require('../../src/services/telegramPayment');

jest.mock('../../src/config/i18n');
jest.mock('../../src/utils/keyboards');
jest.mock('../../src/services/sessionService');
jest.mock('../../src/services/apiService');
jest.mock('../../src/services/telegramPayment');

describe('PaymentHandler', () => {
  let paymentHandler;
  let mockBot;
  let mockApiService;
  let mockPaymentService;

  beforeEach(() => {
    mockBot = {};
    mockApiService = new ApiService();
    mockPaymentService = new TelegramPaymentService(mockBot);
    paymentHandler = new PaymentHandler(
      mockBot,
      mockApiService,
      mockPaymentService
    );
    jest.clearAllMocks();
  });

  describe('handlePaymentConfirm', () => {
    test('should handle API request creation failure', async () => {
      const mockCtx = {
        from: { id: 123456 },
        editMessageText: jest.fn(),
      };

      const mockSession = {
        token: 'jwt-token',
        user: { id: 'user-123', language: 'en' },
        uploadData: {
          uploadedPhotos: ['photo1', 'photo2'],
          script: 'Test script',
          currentRequestId: null,
        },
      };

      sessionService.getSession.mockResolvedValue(mockSession);
      mockApiService.createRequest.mockResolvedValue({
        success: false,
        error: 'Request creation failed',
      });

      const mockT = jest.fn((key) => {
        if (key === 'errors.request_failed') return 'Request failed';
        if (key === 'errors.something_wrong') return 'Something went wrong';
        return key;
      });
      TelegramI18n.getT.mockReturnValue(mockT);

      await paymentHandler.handlePaymentConfirm(mockCtx);

      expect(mockCtx.editMessageText).toHaveBeenCalledWith('Request failed');
    });

    test('should handle payment invoice failure', async () => {
      const mockCtx = {
        from: { id: 123456 },
        editMessageText: jest.fn(),
        reply: jest.fn(),
      };

      const mockSession = {
        token: 'jwt-token',
        user: { id: 'user-123', language: 'en' },
        uploadData: {
          uploadedPhotos: ['photo1', 'photo2'],
          photos: [{}, {}], // 2 photos
          script: 'Test script',
          currentRequestId: null,
        },
      };

      sessionService.getSession.mockResolvedValue(mockSession);
      mockApiService.createRequest.mockResolvedValue({
        success: true,
        request: { id: 'request-123' },
      });
      mockPaymentService.sendInvoice.mockResolvedValue({
        success: false,
        error: 'Invoice failed',
      });

      const mockT = jest.fn((key) => {
        if (key === 'payment.processing') return 'Processing payment...';
        if (key === 'errors.payment_error') return 'Payment error';
        return key;
      });
      TelegramI18n.getT.mockReturnValue(mockT);

      await paymentHandler.handlePaymentConfirm(mockCtx);

      expect(mockCtx.reply).toHaveBeenCalledWith('Payment error');
    });
  });

  describe('handleSuccessfulPayment', () => {
    test('should handle invalid payment validation', async () => {
      const mockCtx = {
        from: { id: 123456 },
        message: {
          successful_payment: {
            invoice_payload: JSON.stringify({
              requestId: 'request-123',
              timestamp: Date.now() - 7200000, // 2 hours ago - expired
            }),
          },
        },
        reply: jest.fn(),
      };

      const mockSession = {
        token: 'jwt-token',
        user: { id: 'user-123', language: 'en' },
        uploadData: {
          photos: [],
          uploadedPhotos: [],
          script: null,
          currentRequestId: null,
        },
      };

      sessionService.getSession.mockResolvedValue(mockSession);

      // Mock validatePayment to return invalid
      mockPaymentService.validatePayment.mockReturnValue({
        valid: false,
        error: 'Payment payload expired',
      });

      const mockT = jest.fn((key) => {
        const translations = {
          'errors.invalid_payment': 'Invalid payment',
          'errors.something_wrong': 'Something went wrong',
        };
        return translations[key] || key;
      });
      TelegramI18n.getT.mockReturnValue(mockT);

      await paymentHandler.handleSuccessfulPayment(mockCtx);

      expect(mockCtx.reply).toHaveBeenCalledWith('Invalid payment');
    });

    test('should handle payment processing failure', async () => {
      const mockCtx = {
        from: { id: 123456 },
        message: {
          successful_payment: {
            invoice_payload: JSON.stringify({
              requestId: 'request-123',
              timestamp: Date.now(),
            }),
          },
        },
        reply: jest.fn(),
      };

      const mockSession = {
        token: 'jwt-token',
        user: { id: 'user-123', language: 'en' },
        uploadData: {
          photos: [],
          uploadedPhotos: [],
          script: null,
          currentRequestId: null,
        },
      };

      sessionService.getSession.mockResolvedValue(mockSession);

      // Mock validatePayment to return valid
      mockPaymentService.validatePayment.mockReturnValue({
        valid: true,
        requestId: 'request-123',
      });

      mockApiService.processTelegramPayment.mockResolvedValue({
        success: false,
        error: 'Payment processing failed',
      });

      const mockT = jest.fn((key) => {
        const translations = {
          'payment.failed': 'Payment failed',
          'errors.something_wrong': 'Something went wrong',
        };
        return translations[key] || key;
      });
      TelegramI18n.getT.mockReturnValue(mockT);

      await paymentHandler.handleSuccessfulPayment(mockCtx);

      expect(mockCtx.reply).toHaveBeenCalledWith('Payment failed');
    });
  });
});
