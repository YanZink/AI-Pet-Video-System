const redis = require('redis');
const logger = require('../utils/logger');

const createRedisClient = () => {
  const client = redis.createClient({
    url: process.env.REDIS_URL || 'redis://localhost:6379',
    password: process.env.REDIS_PASSWORD || undefined,
    socket: {
      connectTimeout: 10000,
      timeout: 10000,
      reconnectStrategy: (retries) => {
        if (retries > 3) {
          logger.error('Redis reconnection failed after 3 attempts');
          return new Error('Redis connection failed');
        }
        return Math.min(retries * 100, 3000);
      },
    },
  });

  client.on('connect', () => {
    logger.info('Redis client connecting...');
  });

  client.on('ready', () => {
    logger.info('Redis client ready and connected');
  });

  client.on('error', (error) => {
    logger.error('Redis client error:', error.message);
  });

  client.on('end', () => {
    logger.info('Redis client disconnected');
  });

  client.on('reconnecting', () => {
    logger.info('Redis client reconnecting...');
  });

  return client;
};

const redisClient = createRedisClient();

const connectRedis = async () => {
  try {
    if (!redisClient.isOpen) {
      logger.info('Attempting to connect to Redis...');
      await redisClient.connect();
      // Time to let the connection settle
      await new Promise((resolve) => setTimeout(resolve, 100));
    }

    // check connection
    await redisClient.ping();
    logger.info('Redis connection established successfully');
    return true;
  } catch (error) {
    logger.error('Redis connection failed:', error.message);
    return false;
  }
};

const testRedisConnection = async () => {
  try {
    const result = await redisClient.ping();
    logger.info('Redis ping successful:', result);
    return true;
  } catch (error) {
    logger.error('Redis ping failed:', error.message);
    return false;
  }
};

const closeRedisConnections = async () => {
  try {
    if (redisClient.isOpen) {
      await redisClient.quit();
      logger.info('Redis connections closed');
    }
  } catch (error) {
    logger.error('Error closing Redis connections:', error.message);
  }
};

module.exports = {
  redisClient,
  connectRedis,
  testRedisConnection,
  closeRedisConnections,
};
