const { sequelize } = require('../src/config/database');
const logger = require('../src/utils/logger');
const fs = require('fs').promises;
const path = require('path');

// Table for keeping track of executed migrations
const MIGRATIONS_TABLE = `
CREATE TABLE IF NOT EXISTS _migrations (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL UNIQUE,
  executed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
`;

class MigrationManager {
  constructor() {
    this.migrationsDir = path.join(__dirname, '../migrations');
  }

  async init() {
    // Create migrations table
    await sequelize.query(MIGRATIONS_TABLE);
    logger.info('Migrations table initialized');
  }

  async getExecutedMigrations() {
    const [results] = await sequelize.query(
      'SELECT name FROM _migrations ORDER BY executed_at'
    );
    return results.map((row) => row.name);
  }

  async markMigrationExecuted(name) {
    await sequelize.query('INSERT INTO _migrations (name) VALUES (?)', {
      replacements: [name],
    });
  }

  async getPendingMigrations() {
    const allFiles = await fs.readdir(this.migrationsDir);
    const migrationFiles = allFiles
      .filter((file) => file.endsWith('.sql'))
      .sort();

    const executed = await this.getExecutedMigrations();
    return migrationFiles.filter((file) => !executed.includes(file));
  }

  async executeMigration(fileName) {
    const filePath = path.join(this.migrationsDir, fileName);
    const sql = await fs.readFile(filePath, 'utf8');

    logger.info(`Executing migration: ${fileName}`);
    await sequelize.query(sql);
    await this.markMigrationExecuted(fileName);

    logger.info(`✓ Migration ${fileName} completed`);
  }

  async runMigrations() {
    try {
      logger.info('Starting database migrations...');

      await sequelize.authenticate();
      logger.info('Database connection established');

      await this.init();

      const pendingMigrations = await this.getPendingMigrations();

      if (pendingMigrations.length === 0) {
        logger.info('No pending migrations');
        return;
      }

      logger.info(`Found ${pendingMigrations.length} pending migrations`);

      for (const migrationFile of pendingMigrations) {
        await this.executeMigration(migrationFile);
      }

      logger.info('All migrations completed successfully');
    } catch (error) {
      logger.error('Migration failed:', error);
      throw error;
    }
  }
}

// Run migrations
if (require.main === module) {
  const manager = new MigrationManager();
  manager
    .runMigrations()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}

module.exports = MigrationManager;
