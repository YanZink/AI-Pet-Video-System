const { Sequelize } = require('sequelize');
const logger = require('../utils/logger');
require('dotenv').config();

const sequelize = new Sequelize({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: process.env.DB_NAME,
  username: process.env.DB_USER,
  password: process.env.DB_PASS,
  dialect: 'postgres',
  logging:
    process.env.NODE_ENV === 'development'
      ? (sql) => logger.info('Database Query', { sql })
      : false,

  pool: {
    max: parseInt(process.env.DB_POOL_MAX) || 10,
    min: parseInt(process.env.DB_POOL_MIN) || 0,
    acquire: parseInt(process.env.DB_POOL_ACQUIRE) || 30000,
    idle: parseInt(process.env.DB_POOL_IDLE) || 10000,
  },

  ...(process.env.NODE_ENV === 'production' && {
    dialectOptions: {
      ssl: {
        require: true,
        rejectUnauthorized: false,
      },
    },
  }),
});

const testConnection = async () => {
  try {
    await sequelize.authenticate();
    logger.info('Database connection established successfully');
    return true;
  } catch (error) {
    logger.error('Unable to connect to database:', error);
    return false;
  }
};

const syncDatabase = async (options = {}) => {
  try {
    const syncOptions = {
      force: process.env.NODE_ENV === 'development' && options.force,
      alter: process.env.NODE_ENV === 'development' && options.alter,
      ...options,
    };

    await sequelize.sync(syncOptions);
    logger.info('Database synchronized successfully', { options: syncOptions });
    return true;
  } catch (error) {
    logger.error('Failed to sync database:', error);
    return false;
  }
};

module.exports = { sequelize, testConnection, syncDatabase };
