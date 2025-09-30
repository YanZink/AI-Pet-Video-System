const redis = require('redis');

class RedisManager {
  constructor() {
    this.client = null;
    this.isConnected = false;
  }

  async connect() {
    if (this.isConnected && this.client) {
      return this.client;
    }

    try {
      this.client = redis.createClient({
        url: process.env.REDIS_URL || 'redis://localhost:6379',
        password: process.env.REDIS_PASSWORD || undefined,
        socket: {
          connectTimeout: 10000,
          timeout: 10000,
          reconnectStrategy: (retries) => {
            if (retries > 3) {
              console.error('Redis reconnection failed after 3 attempts');
              return new Error('Redis connection failed');
            }
            return Math.min(retries * 100, 3000);
          },
        },
      });

      // Handling Redis events
      this.client.on('connect', () => {
        console.log('🔌 Redis client connecting...');
      });

      this.client.on('ready', () => {
        console.log('✅ Redis client ready and connected');
        this.isConnected = true;
      });

      this.client.on('error', (error) => {
        console.error('❌ Redis client error:', error.message);
        this.isConnected = false;
      });

      this.client.on('end', () => {
        console.log('🔌 Redis client disconnected');
        this.isConnected = false;
      });

      this.client.on('reconnecting', () => {
        console.log('🔄 Redis client reconnecting...');
      });

      // Connect to Redis
      await this.client.connect();
      return this.client;
    } catch (error) {
      console.error('❌ Failed to connect to Redis:', error.message);
      throw error;
    }
  }

  async getClient() {
    if (!this.client || !this.isConnected) {
      await this.connect();
    }
    return this.client;
  }

  async disconnect() {
    if (this.client && this.isConnected) {
      await this.client.quit();
      this.isConnected = false;
      console.log('✅ Redis connection closed');
    }
  }

  // Check Redis connection
  async ping() {
    try {
      const client = await this.getClient();
      await client.ping();
      return true;
    } catch (error) {
      console.error('Redis ping failed:', error);
      return false;
    }
  }
}

// Create singleton instance
const redisManager = new RedisManager();

module.exports = { redisManager };
