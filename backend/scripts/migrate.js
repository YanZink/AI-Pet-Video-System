const { sequelize } = require('../src/config/database');
const logger = require('../src/utils/logger');

async function runMigrations() {
  try {
    logger.info('Starting database migration...');

    // check connection
    await sequelize.authenticate();
    logger.info('Database connection established');

    // Sync models with database
    await sequelize.sync({
      force: false, // not delete data
      alter: true, // change data
    });

    logger.info('✅ Database migration completed successfully');
    process.exit(0);
  } catch (error) {
    logger.error('❌ Database migration failed:', error);
    process.exit(1);
  }
}

// Запускаем если файл вызван напрямую
if (require.main === module) {
  runMigrations();
}

module.exports = runMigrations;
