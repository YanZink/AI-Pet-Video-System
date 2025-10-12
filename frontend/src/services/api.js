import axios from 'axios';

class ApiService {
  constructor() {
    this.client = axios.create({
      baseURL:
        process.env.REACT_APP_API_BASE_URL || 'http://localhost:3000/api/v1',
      timeout: parseInt(process.env.REACT_APP_API_TIMEOUT) || 30000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Add auth token to requests
    this.client.interceptors.request.use((config) => {
      const token = localStorage.getItem('auth_token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    });

    // Handle auth errors
    this.client.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 401) {
          localStorage.removeItem('auth_token');
          localStorage.removeItem('user_data');
          window.location.href = '/login';
        }
        return Promise.reject(error);
      }
    );
  }

  // Auth methods
  async register(userData) {
    const response = await this.client.post('/users', userData);
    return response.data;
  }

  async login(credentials) {
    const response = await this.client.post('/users/login', credentials);
    return response.data;
  }

  async getCurrentUser() {
    const response = await this.client.get('/users/me');
    return response.data;
  }

  // Request methods
  async createRequest(requestData) {
    const response = await this.client.post('/requests', requestData);
    return response.data;
  }

  async getUserRequests() {
    const response = await this.client.get('/requests/my');
    return response.data;
  }

  async generateUploadUrls(fileType, fileCount = 1) {
    const response = await this.client.post('/requests/upload-urls', {
      file_type: fileType,
      file_count: fileCount,
    });
    return response.data;
  }

  async getQueueEstimation() {
    const response = await this.client.get('/requests/queue/estimation');
    return response.data;
  }

  // Payment methods

  // Stripe Checkout
  async createStripeCheckout(requestId) {
    const response = await this.client.post('/payments/stripe/checkout', {
      request_id: requestId,
    });
    return response.data;
  }

  // Get Stripe checkout session status
  async getStripeCheckoutStatus(sessionId) {
    const response = await this.client.get(
      `/payments/stripe/checkout/${sessionId}`
    );
    return response.data;
  }

  // Get available payment methods
  async getAvailablePaymentMethods() {
    const response = await this.client.get('/payments/methods');
    return response.data;
  }

  // Get payment info for specific request
  async getPaymentInfo(requestId) {
    const response = await this.client.get(`/payments/info/${requestId}`);
    return response.data;
  }

  // Admin methods
  async getAllRequests(params = {}) {
    const response = await this.client.get('/admin/requests', { params });
    return response.data;
  }

  async updateRequestStatus(requestId, statusData) {
    const response = await this.client.patch(
      `/admin/requests/${requestId}/status`,
      statusData
    );
    return response.data;
  }

  async getDashboardStats() {
    const response = await this.client.get('/admin/dashboard/stats');
    return response.data;
  }

  // S3 upload method
  async uploadToS3(uploadUrl, file) {
    return axios.put(uploadUrl, file, {
      headers: {
        'Content-Type': file.type,
        'x-amz-acl': 'private',
      },
    });
  }
}

export default new ApiService();
