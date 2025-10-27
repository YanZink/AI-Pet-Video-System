const axios = require('axios');
const ApiService = require('../../src/services/apiService');

describe('ApiService', () => {
  let apiService;
  let mockAxiosInstance;

  beforeEach(() => {
    // Reset environment
    process.env.API_BASE_URL = 'http://localhost:3000/api/v1';
    process.env.TELEGRAM_BOT_API_KEY = 'test-api-key';
    process.env.API_TIMEOUT = '30000';

    // Create a proper mock instance instead of using axios.create()
    mockAxiosInstance = {
      post: jest.fn(),
      get: jest.fn(),
      put: jest.fn(),
      interceptors: {
        request: { use: jest.fn() },
        response: { use: jest.fn() },
      },
    };

    // Mock axios.create to return our mock instance
    axios.create.mockReturnValue(mockAxiosInstance);

    jest.clearAllMocks();
  });

  describe('constructor', () => {
    test('should throw error if API key is missing', () => {
      delete process.env.TELEGRAM_BOT_API_KEY;

      // Mock console.error to avoid test output pollution
      const originalError = console.error;
      console.error = jest.fn();

      expect(() => new ApiService()).toThrow(
        'TELEGRAM_BOT_API_KEY environment variable is required'
      );

      console.error = originalError;
    });

    test('should initialize successfully when API key is present', () => {
      process.env.TELEGRAM_BOT_API_KEY = 'test-api-key';

      // Mock console methods to avoid output pollution
      const originalLog = console.log;
      const originalError = console.error;
      console.log = jest.fn();
      console.error = jest.fn();

      expect(() => {
        apiService = new ApiService();
      }).not.toThrow();

      // Verify instance properties
      expect(apiService.baseURL).toBe('http://localhost:3000/api/v1');
      expect(apiService.apiKey).toBe('test-api-key');
      expect(apiService.timeout).toBe(30000);

      console.log = originalLog;
      console.error = originalError;
    });
  });

  // Test individual methods by creating ApiService without constructor issues
  describe('API methods', () => {
    beforeEach(() => {
      // Create ApiService instance without triggering constructor issues
      apiService = Object.create(ApiService.prototype);
      apiService.client = mockAxiosInstance;
      apiService.baseURL = 'http://localhost:3000/api/v1';
      apiService.apiKey = 'test-api-key';
    });

    describe('registerTelegramUser', () => {
      test('should register user successfully', async () => {
        const mockUser = {
          id: 123456,
          username: 'testuser',
          first_name: 'Test',
          last_name: 'User',
          language_code: 'en',
        };

        const mockResponse = {
          data: {
            user: { id: 'user-123', telegram_id: 123456 },
            token: 'jwt-token',
            isNewUser: true,
          },
        };

        mockAxiosInstance.post.mockResolvedValue(mockResponse);

        const result = await apiService.registerTelegramUser(mockUser);

        expect(result.success).toBe(true);
        expect(result.user).toEqual(mockResponse.data.user);
        expect(result.token).toBe('jwt-token');
        expect(result.isNewUser).toBe(true);
        expect(mockAxiosInstance.post).toHaveBeenCalledWith('/users/telegram', {
          telegram_id: 123456,
          username: 'testuser',
          first_name: 'Test',
          last_name: 'User',
          language: 'en',
        });
      });

      test('should handle API errors', async () => {
        const mockUser = {
          id: 123456,
          username: 'testuser',
        };

        const mockError = {
          response: {
            data: { message: 'API error' },
          },
        };

        mockAxiosInstance.post.mockRejectedValue(mockError);

        const result = await apiService.registerTelegramUser(mockUser);

        expect(result.success).toBe(false);
        expect(result.error).toBe('API error');
      });

      test('should handle network errors without response', async () => {
        const mockUser = {
          id: 123456,
          username: 'testuser',
        };

        const mockError = {
          message: 'Network error',
        };

        mockAxiosInstance.post.mockRejectedValue(mockError);

        const result = await apiService.registerTelegramUser(mockUser);

        expect(result.success).toBe(false);
        expect(result.error).toBe('Registration failed');
      });
    });

    describe('getQueueEstimation', () => {
      test('should get queue estimation successfully', async () => {
        const mockResponse = {
          data: { estimated_wait_minutes: 15 },
        };

        mockAxiosInstance.get.mockResolvedValue(mockResponse);

        const result = await apiService.getQueueEstimation();

        expect(result.success).toBe(true);
        expect(result.estimation).toEqual(mockResponse.data);
        expect(mockAxiosInstance.get).toHaveBeenCalledWith(
          '/requests/queue/estimation'
        );
      });

      test('should handle queue estimation errors', async () => {
        const mockError = {
          response: {
            data: { message: 'Service unavailable' },
          },
        };

        mockAxiosInstance.get.mockRejectedValue(mockError);

        const result = await apiService.getQueueEstimation();

        expect(result.success).toBe(false);
        expect(result.error).toBe('Service unavailable');
      });
    });

    describe('createRequest', () => {
      test('should create request successfully', async () => {
        const token = 'test-token';
        const photos = ['photo1', 'photo2'];
        const script = 'Test script';

        const mockResponse = {
          data: {
            request: { id: 'req-123', status: 'pending' },
          },
        };

        mockAxiosInstance.post.mockResolvedValue(mockResponse);

        const result = await apiService.createRequest(token, photos, script);

        expect(result.success).toBe(true);
        expect(result.request).toEqual(mockResponse.data.request);
        expect(mockAxiosInstance.post).toHaveBeenCalledWith(
          '/requests',
          {
            photos,
            script,
            template_id: null,
          },
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
      });

      test('should handle request creation errors', async () => {
        const token = 'test-token';
        const photos = ['photo1'];

        const mockError = {
          response: {
            data: { message: 'Invalid photos' },
          },
        };

        mockAxiosInstance.post.mockRejectedValue(mockError);

        const result = await apiService.createRequest(token, photos);

        expect(result.success).toBe(false);
        expect(result.error).toBe('Invalid photos');
      });
    });

    describe('getUserRequests', () => {
      test('should get user requests successfully', async () => {
        const token = 'test-token';
        const mockResponse = {
          data: {
            requests: [{ id: 'req-1' }, { id: 'req-2' }],
          },
        };

        mockAxiosInstance.get.mockResolvedValue(mockResponse);

        const result = await apiService.getUserRequests(token);

        expect(result.success).toBe(true);
        expect(result.requests).toHaveLength(2);
        expect(mockAxiosInstance.get).toHaveBeenCalledWith('/requests/my', {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
      });
    });

    describe('generateUploadUrls', () => {
      test('should generate upload URLs successfully', async () => {
        const token = 'test-token';
        const fileType = 'image/jpeg';
        const fileCount = 3;

        const mockResponse = {
          data: {
            uploads: [
              { uploadUrl: 'url1', key: 'key1' },
              { uploadUrl: 'url2', key: 'key2' },
              { uploadUrl: 'url3', key: 'key3' },
            ],
          },
        };

        mockAxiosInstance.post.mockResolvedValue(mockResponse);

        const result = await apiService.generateUploadUrls(
          token,
          fileType,
          fileCount
        );

        expect(result.success).toBe(true);
        expect(result.uploads).toHaveLength(3);
        expect(mockAxiosInstance.post).toHaveBeenCalledWith(
          '/requests/upload-urls',
          {
            file_type: fileType,
            file_count: fileCount,
          },
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
      });
    });

    describe('uploadPhoto', () => {
      test('should upload photo successfully', async () => {
        const mockUploadUrl = 'https://s3.amazonaws.com/upload-url';
        const mockPhotoBuffer = Buffer.from('test-image');
        const mockContentType = 'image/jpeg';

        // Mock direct axios.put call
        axios.put.mockResolvedValue({ status: 200, statusText: 'OK' });

        const result = await apiService.uploadPhoto(
          mockUploadUrl,
          mockPhotoBuffer,
          mockContentType
        );

        expect(result.success).toBe(true);
        expect(result.statusCode).toBe(200);
        expect(axios.put).toHaveBeenCalledWith(mockUploadUrl, mockPhotoBuffer, {
          headers: { 'Content-Type': 'image/jpeg' },
          timeout: 60000,
        });
      });

      test('should handle upload errors', async () => {
        const mockUploadUrl = 'https://s3.amazonaws.com/upload-url';
        const mockPhotoBuffer = Buffer.from('test-image');
        const mockContentType = 'image/jpeg';

        const mockError = {
          response: {
            status: 403,
          },
          message: 'S3 upload failed',
        };

        axios.put.mockRejectedValue(mockError);

        const result = await apiService.uploadPhoto(
          mockUploadUrl,
          mockPhotoBuffer,
          mockContentType
        );

        expect(result.success).toBe(false);
        expect(result.error).toBe('Photo upload failed to S3');
        expect(result.statusCode).toBe(403);
      });
    });

    describe('processTelegramPayment', () => {
      test('should process payment successfully', async () => {
        const token = 'test-token';
        const requestId = 'req-123';
        const paymentData = { amount: 1000, currency: 'XTR' };

        const mockResponse = {
          data: {
            request: { id: 'req-123', status: 'paid' },
          },
        };

        mockAxiosInstance.post.mockResolvedValue(mockResponse);

        const result = await apiService.processTelegramPayment(
          token,
          requestId,
          paymentData
        );

        expect(result.success).toBe(true);
        expect(result.request).toEqual(mockResponse.data.request);
        expect(mockAxiosInstance.post).toHaveBeenCalledWith(
          '/payments/telegram',
          {
            request_id: requestId,
            payment_data: paymentData,
          },
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
      });
    });
  });
});
