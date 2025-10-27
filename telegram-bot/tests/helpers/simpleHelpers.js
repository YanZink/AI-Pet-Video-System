const request = require('supertest');

// Simple helper to make API calls to backend
const callBackendAPI = (
  endpoint,
  data = {},
  apiKey = process.env.TELEGRAM_BOT_API_KEY
) => {
  const baseURL = process.env.API_BASE_URL.replace('/api/v1', '');
  return request(baseURL).post(endpoint).set('X-API-Key', apiKey).send(data);
};

module.exports = { callBackendAPI };
