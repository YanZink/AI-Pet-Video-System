const axios = require('axios');

class ApiService {
  constructor() {
    this.baseURL = process.env.API_BASE_URL || 'http://localhost:3000/api/v1';
    this.timeout = parseInt(process.env.API_TIMEOUT) || 30000;
    this.apiKey = process.env.TELEGRAM_BOT_API_KEY;

    // Validate API key is configured
    if (!this.apiKey) {
      console.error('TELEGRAM_BOT_API_KEY is not configured!');
      throw new Error('TELEGRAM_BOT_API_KEY environment variable is required');
    }

    this.client = axios.create({
      baseURL: this.baseURL,
      timeout: this.timeout,
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': this.apiKey, // Add API key to all requests
      },
    });

    // Add request interceptor for logging
    this.client.interceptors.request.use(
      (config) => {
        console.log(
          `API Request: ${config.method.toUpperCase()} ${config.url}`
        );
        return config;
      },
      (error) => {
        console.error('API Request Error:', error);
        return Promise.reject(error);
      }
    );

    // Add response interceptor for error handling
    this.client.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 401 || error.response?.status === 403) {
          console.error('API Authentication/Authorization failed!');
          console.error('Check if TELEGRAM_BOT_API_KEY is correct');
        }
        return Promise.reject(error);
      }
    );
  }

  // Register or login Telegram user
  async registerTelegramUser(telegramUser) {
    try {
      const response = await this.client.post('/users/telegram', {
        telegram_id: telegramUser.id,
        username: telegramUser.username,
        first_name: telegramUser.first_name,
        last_name: telegramUser.last_name,
        language: telegramUser.language_code,
      });

      return {
        success: true,
        user: response.data.user,
        token: response.data.token,
        isNewUser: response.data.isNewUser,
      };
    } catch (error) {
      console.error(
        'API Error - Register user:',
        error.response?.data || error.message
      );
      return {
        success: false,
        error: error.response?.data?.message || 'Registration failed',
      };
    }
  }

  // Create new video request
  async createRequest(token, photos, script = null, templateId = null) {
    try {
      const response = await this.client.post(
        '/requests',
        {
          photos,
          script,
          template_id: templateId,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      return {
        success: true,
        request: response.data.request,
      };
    } catch (error) {
      console.error(
        'API Error - Create request:',
        error.response?.data || error.message
      );
      return {
        success: false,
        error: error.response?.data?.message || 'Request creation failed',
      };
    }
  }

  // Get user's requests
  async getUserRequests(token) {
    try {
      const response = await this.client.get('/requests/my', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      return {
        success: true,
        requests: response.data.requests,
      };
    } catch (error) {
      console.error(
        'API Error - Get requests:',
        error.response?.data || error.message
      );
      return {
        success: false,
        error: error.response?.data?.message || 'Failed to get requests',
      };
    }
  }

  // Get queue estimation
  async getQueueEstimation() {
    try {
      const response = await this.client.get('/requests/queue/estimation');

      return {
        success: true,
        estimation: response.data,
      };
    } catch (error) {
      console.error(
        'API Error - Queue estimation:',
        error.response?.data || error.message
      );
      return {
        success: false,
        error: error.response?.data?.message || 'Failed to get queue status',
      };
    }
  }

  // Process Telegram Stars payment
  async processTelegramPayment(token, requestId, paymentData) {
    try {
      const response = await this.client.post(
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

      return {
        success: true,
        request: response.data.request,
      };
    } catch (error) {
      console.error(
        'API Error - Process payment:',
        error.response?.data || error.message
      );
      return {
        success: false,
        error: error.response?.data?.message || 'Payment processing failed',
      };
    }
  }

  // Generate upload URLs for photos
  async generateUploadUrls(token, fileType, fileCount = 1) {
    try {
      const response = await this.client.post(
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

      return {
        success: true,
        uploads: response.data.uploads,
      };
    } catch (error) {
      console.error(
        'API Error - Generate upload URLs:',
        error.response?.data || error.message
      );
      return {
        success: false,
        error:
          error.response?.data?.message || 'Failed to generate upload URLs',
      };
    }
  }

  // Upload photo to S3 using signed URL
  async uploadPhoto(uploadUrl, photoBuffer, contentType) {
    try {
      console.log('Uploading photo to S3...', {
        url: uploadUrl.substring(0, 50) + '...',
        contentLength: photoBuffer.length,
        contentType: contentType,
      });

      const response = await axios.put(uploadUrl, photoBuffer, {
        headers: {
          'Content-Type': contentType,
        },
        timeout: 60000,
      });

      console.log('Photo uploaded successfully to S3', {
        status: response.status,
        statusText: response.statusText,
      });

      return {
        success: true,
        statusCode: response.status,
      };
    } catch (error) {
      console.error(
        'S3 Upload Error:',
        error.response?.status || error.message
      );
      return {
        success: false,
        error: 'Photo upload failed to S3',
        statusCode: error.response?.status,
        details: error.message,
      };
    }
  }
}

module.exports = ApiService;
