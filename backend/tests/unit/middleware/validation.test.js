const {
  validateBody,
  validateUUIDParam,
  userSchemas,
  requestSchemas,
  paymentSchemas,
} = require('../../../src/middleware/validation');

describe('Validation Middleware', () => {
  let mockReq, mockRes, mockNext;

  beforeEach(() => {
    mockReq = {
      body: {},
      params: {},
      t: jest.fn((key) => key),
    };
    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    mockNext = jest.fn();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('validateBody', () => {
    it('should validate valid user creation data', () => {
      mockReq.body = {
        email: 'test@example.com',
        username: 'testuser',
        password: 'password123',
        language: 'en',
      };

      const middleware = validateBody(userSchemas.createUser);
      middleware(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalled();
      expect(mockReq.validatedBody).toEqual({
        email: 'test@example.com',
        username: 'testuser',
        password: 'password123',
        language: 'en',
      });
    });

    it('should validate valid Telegram user creation', () => {
      mockReq.body = {
        telegram_id: 123456789,
        username: 'telegram_user',
        first_name: 'John',
        last_name: 'Doe',
        language: 'ru',
      };

      const middleware = validateBody(userSchemas.createUser);
      middleware(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalled();
      expect(mockReq.validatedBody).toEqual({
        telegram_id: 123456789,
        username: 'telegram_user',
        first_name: 'John',
        last_name: 'Doe',
        language: 'ru',
      });
    });

    it('should reject user creation without email or telegram_id', () => {
      mockReq.body = {
        username: 'testuser',
        password: 'password123',
      };

      const middleware = validateBody(userSchemas.createUser);
      middleware(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: 'errors.validation_error',
        code: 'VALIDATION_ERROR',
        details: expect.arrayContaining([
          expect.objectContaining({
            field: expect.any(String),
            message: expect.any(String),
          }),
        ]),
      });
    });

    it('should validate valid request creation', () => {
      mockReq.body = {
        photos: ['photo1.jpg', 'photo2.jpg'],
        script: 'Test script for video',
        template_id: '123e4567-e89b-12d3-a456-426614174000',
      };

      const middleware = validateBody(requestSchemas.createRequest);
      middleware(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalled();
      expect(mockReq.validatedBody).toEqual({
        photos: ['photo1.jpg', 'photo2.jpg'],
        script: 'Test script for video',
        template_id: '123e4567-e89b-12d3-a456-426614174000',
      });
    });

    it('should reject request creation with too many photos', () => {
      mockReq.body = {
        photos: Array.from({ length: 11 }, (_, i) => `photo${i}.jpg`),
        script: 'Test script',
      };

      const middleware = validateBody(requestSchemas.createRequest);
      middleware(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          code: 'VALIDATION_ERROR',
        })
      );
    });

    it('should validate valid payment creation', () => {
      mockReq.body = {
        request_id: '123e4567-e89b-12d3-a456-426614174000',
        payment_data: {
          invoice_payload: 'test',
          total_amount: 1000,
        },
      };

      const middleware = validateBody(paymentSchemas.telegramPayment);
      middleware(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalled();
      expect(mockReq.validatedBody.request_id).toBe(
        '123e4567-e89b-12d3-a456-426614174000'
      );
    });
  });

  describe('validateUUIDParam', () => {
    it('should validate valid UUID parameter', () => {
      mockReq.params.id = '123e4567-e89b-12d3-a456-426614174000';

      const middleware = validateUUIDParam();
      middleware(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalled();
      expect(mockReq.validatedParams.id).toBe(
        '123e4567-e89b-12d3-a456-426614174000'
      );
    });

    it('should reject invalid UUID parameter', () => {
      mockReq.params.id = 'invalid-uuid';

      const middleware = validateUUIDParam();
      middleware(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: 'errors.invalid_parameters',
        code: 'VALIDATION_ERROR',
        details: expect.any(Array),
      });
    });

    it('should work with custom parameter name', () => {
      mockReq.params.request_id = '123e4567-e89b-12d3-a456-426614174000';

      const middleware = validateUUIDParam('request_id');
      middleware(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalled();
      expect(mockReq.validatedParams.request_id).toBe(
        '123e4567-e89b-12d3-a456-426614174000'
      );
    });
  });
});
