const axios = require('axios');

class ApiService {
  constructor() {
    this.baseURL = process.env.API_BASE_URL || 'http://localhost:3000/api/v1';
    this.timeout = parseInt(process.env.API_TIMEOUT) || 30000;

    this.client = axios.create({
      baseURL: this.baseURL,
      timeout: this.timeout,
      headers: {
        'Content-Type': 'application/json',
      },
    });
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
      // SIMULATED UPLOAD - для тестирования без реального S3
      console.log('📸 Simulating S3 upload...');

      // Вместо реальной загрузки, просто возвращаем успех
      // В реальном продакшене здесь будет axios.put
      await new Promise((resolve) => setTimeout(resolve, 500));

      console.log('✅ Photo upload simulated successfully');
      return {
        success: true,
        statusCode: 200,
        simulated: true, // Добавляем флаг что это симуляция
      };

      /* Реальный код (закомментирован для тестирования):
    const response = await axios.put(uploadUrl, photoBuffer, {
      headers: {
        'Content-Type': contentType
      },
      timeout: 60000
    });

    return {
      success: true,
      statusCode: response.status
    };
    */
    } catch (error) {
      console.error(
        'S3 Upload Error:',
        error.response?.status || error.message
      );
      return {
        success: false,
        error: 'Photo upload failed',
      };
    }
  }
}

module.exports = ApiService;
