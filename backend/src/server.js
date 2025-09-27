const app = require('./app');
const { sequelize } = require('./config/database');
const {
  connectRedis,
  testRedisConnection,
  closeRedisConnections,
} = require('./config/redis');
const { testS3Connection, testSESConnection } = require('./config/aws');
const { initializeRateLimiters } = require('./middleware/rateLimit');
const logger = require('./utils/logger');

const PORT = process.env.PORT || 3000;

async function initializeServices() {
  const services = {
    database: false,
    redis: false,
    s3: false,
    ses: false,
  };

  try {
    logger.info('Testing database connection...');
    await sequelize.authenticate();
    services.database = true;

    if (process.env.NODE_ENV === 'development') {
      logger.info('Synchronizing database models...');
      await sequelize.sync({ alter: true });
    }

    logger.info('Connecting to Redis...');
    services.redis = await connectRedis();
    if (services.redis) {
      await testRedisConnection();
      // Rate limiters initialized after receiving a Redis connection
      initializeRateLimiters();
    }

    logger.info('Testing S3 connection...');
    services.s3 = await testS3Connection();

    logger.info('Testing SES connection...');
    services.ses = await testSESConnection();

    return services;
  } catch (error) {
    logger.error('Service initialization error:', error);
    return services;
  }
}

async function startServer() {
  try {
    logger.info('Starting AI Pet Video Backend Server...');
    logger.info(`Environment: ${process.env.NODE_ENV || 'development'}`);

    const services = await initializeServices();

    if (!services.database) {
      throw new Error('Database connection failed - cannot start server');
    }

    const serviceStatus = Object.entries(services)
      .map(([name, status]) => `${name}: ${status ? '✅' : '❌'}`)
      .join(', ');
    logger.info(`Service status: ${serviceStatus}`);

    if (!services.redis) {
      logger.warn('Redis connection failed - rate limiting disabled');
    }
    if (!services.s3) {
      logger.warn('S3 connection failed - file upload/download disabled');
    }
    if (!services.ses) {
      logger.warn('SES connection failed - email notifications disabled');
    }

    const server = app.listen(PORT, () => {
      logger.info(`🚀 Server started successfully!`);
      logger.info(`📡 Port: ${PORT}`);
      logger.info(`🔗 API URL: http://localhost:${PORT}/api/v1`);
      logger.info(`🏥 Health check: http://localhost:${PORT}/api/v1/health`);
      logger.info(`⚙️ Environment: ${process.env.NODE_ENV || 'development'}`);
    });

    const gracefulShutdown = async (signal) => {
      logger.info(`${signal} received, starting graceful shutdown...`);

      server.close(async () => {
        logger.info('HTTP server closed');

        try {
          await sequelize.close();
          logger.info('Database connections closed');

          await closeRedisConnections();

          logger.info('Graceful shutdown completed');
          process.exit(0);
        } catch (error) {
          logger.error('Error during shutdown:', error);
          process.exit(1);
        }
      });

      setTimeout(() => {
        logger.error('Forced shutdown due to timeout');
        process.exit(1);
      }, 30000);
    };

    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));

    process.on('unhandledRejection', (reason, promise) => {
      logger.error('Unhandled Promise Rejection:', { reason, promise });
    });

    process.on('uncaughtException', (error) => {
      logger.error('Uncaught Exception:', error);
      process.exit(1);
    });

    return server;
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  startServer();
}

module.exports = { startServer };
