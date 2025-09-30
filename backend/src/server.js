require('dotenv').config();
const App = require('./app');
const logger = require('./utils/logger');

const PORT = process.env.PORT || 3000;

async function startServer() {
  try {
    logger.info('Starting AI Pet Video Backend Server...');
    logger.info(`Environment: ${process.env.NODE_ENV || 'development'}`);

    // Create and initialize app
    const appInstance = new App();
    const app = await appInstance.initialize();

    // Start server
    const server = app.listen(PORT, () => {
      logger.info(`✅ Server is running on port ${PORT}`);
      logger.info(`📚 API Documentation: http://localhost:${PORT}/api/v1`);
      logger.info(`❤️ Health check: http://localhost:${PORT}/health`);
    });

    // Graceful shutdown
    const gracefulShutdown = async (signal) => {
      logger.info(`\n📩 Received ${signal}. Starting graceful shutdown...`);

      server.close(async (err) => {
        if (err) {
          logger.error('Error during server close:', err);
          process.exit(1);
        }

        try {
          await appInstance.close();
          logger.info('✅ Graceful shutdown completed');
          process.exit(0);
        } catch (error) {
          logger.error('Error during application cleanup:', error);
          process.exit(1);
        }
      });

      // Force close after 10 seconds
      setTimeout(() => {
        logger.error(
          '❌ Could not close connections in time, forcefully shutting down'
        );
        process.exit(1);
      }, 10000);
    };

    // Handle different shutdown signals
    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));
  } catch (error) {
    logger.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

// Start the server
startServer();
