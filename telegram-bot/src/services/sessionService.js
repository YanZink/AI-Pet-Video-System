const { redisClient } = require('../config/redis');

class SessionService {
  constructor() {
    this.prefix = 'bot_session:';
    this.ttl = 24 * 60 * 60; // 24 hours
  }

  async getSession(userId) {
    try {
      const key = this.prefix + userId;
      const sessionData = await redisClient.get(key);

      if (sessionData) {
        return JSON.parse(sessionData);
      }
      return null;
    } catch (error) {
      console.error('❌ Error getting session from Redis:', error);
      return null;
    }
  }

  async saveSession(userId, sessionData) {
    try {
      const key = this.prefix + userId;
      await redisClient.setEx(key, this.ttl, JSON.stringify(sessionData));
      return true;
    } catch (error) {
      console.error('❌ Error saving session to Redis:', error);
      return false;
    }
  }

  async deleteSession(userId) {
    try {
      const key = this.prefix + userId;
      await redisClient.del(key);
      return true;
    } catch (error) {
      console.error('❌ Error deleting session from Redis:', error);
      return false;
    }
  }

  async updateSession(userId, updates) {
    try {
      const existingSession = await this.getSession(userId);
      if (existingSession) {
        const updatedSession = { ...existingSession, ...updates };
        return await this.saveSession(userId, updatedSession);
      }
      return false;
    } catch (error) {
      console.error('❌ Error updating session in Redis:', error);
      return false;
    }
  }
}

module.exports = new SessionService();
