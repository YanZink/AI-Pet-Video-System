const redis = require('redis');

const createRedisClient = () => {
  const client = redis.createClient({
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

  client.on('connect', () => {
    console.log('🔌 Redis client connecting...');
  });

  client.on('ready', () => {
    console.log('✅ Redis client ready and connected');
  });

  client.on('error', (error) => {
    console.error('❌ Redis client error:', error.message);
  });

  client.on('end', () => {
    console.log('🔌 Redis client disconnected');
  });

  client.on('reconnecting', () => {
    console.log('🔄 Redis client reconnecting...');
  });

  return client;
};

const redisClient = createRedisClient();

const connectRedis = async () => {
  try {
    if (!redisClient.isOpen) {
      console.log('🔌 Attempting to connect to Redis...');
      await redisClient.connect();
      await new Promise((resolve) => setTimeout(resolve, 100));
    }

    await redisClient.ping();
    console.log('✅ Redis connection established successfully');
    return true;
  } catch (error) {
    console.error('❌ Redis connection failed:', error.message);
    return false;
  }
};

const closeRedisConnections = async () => {
  try {
    if (redisClient.isOpen) {
      await redisClient.quit();
      console.log('✅ Redis connections closed');
    }
  } catch (error) {
    console.error('❌ Error closing Redis connections:', error.message);
  }
};

module.exports = {
  redisClient,
  connectRedis,
  closeRedisConnections,
};
