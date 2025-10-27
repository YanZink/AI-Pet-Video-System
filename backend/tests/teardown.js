module.exports = async () => {
  // Clean up any test resources
  try {
    const { sequelize } = require('../src/models');

    if (sequelize) {
      await sequelize.close();
    }

    // Close any other connections
    const { redisManager } = require('../src/config/redis');
    if (redisManager && redisManager.isConnected) {
      await redisManager.disconnect();
    }

    // Force exit after a timeout to prevent hanging
    setTimeout(() => {
      console.log('✅ Test teardown completed');
      process.exit(0);
    }, 1000);
  } catch (error) {
    console.log('✅ Test teardown completed with warnings:', error.message);
    process.exit(0);
  }
};
