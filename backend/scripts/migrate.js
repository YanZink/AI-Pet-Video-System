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

  // Split SQL into individual statements
  async executeMigration(fileName) {
    const filePath = path.join(this.migrationsDir, fileName);
    const sqlContent = await fs.readFile(filePath, 'utf8');

    logger.info(`Executing migration: ${fileName}`);

    // Split SQL by semicolons but be careful with DO blocks
    const statements = this.splitSQLStatements(sqlContent);

    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i].trim();
      if (!statement) continue;

      try {
        logger.info(`Executing statement ${i + 1}/${statements.length}`);
        await sequelize.query(statement);
      } catch (error) {
        logger.error(`Failed to execute statement ${i + 1}:`, {
          statement: statement.substring(0, 200) + '...',
          error: error.message,
        });
        // Continue with next statement instead of failing completely
        if (
          error.message.includes('already exists') ||
          error.message.includes('duplicate key')
        ) {
          logger.warn('Skipping duplicate/conflict...');
          continue;
        }
        throw error;
      }
    }

    await this.markMigrationExecuted(fileName);
    logger.info(`✓ Migration ${fileName} completed`);
  }

  // Smart SQL splitting that handles DO blocks
  splitSQLStatements(sql) {
    // Simple approach: split by semicolons that are not inside quotes or dollar quotes
    const statements = [];
    let current = '';
    let inSingleQuote = false;
    let inDoubleQuote = false;
    let inDollarQuote = false;
    let dollarTag = '';

    for (let i = 0; i < sql.length; i++) {
      const char = sql[i];
      const nextChar = sql[i + 1];

      current += char;

      // Handle dollar quoting
      if (
        char === '$' &&
        nextChar === '$' &&
        !inSingleQuote &&
        !inDoubleQuote
      ) {
        if (!inDollarQuote) {
          // Start of dollar quote
          inDollarQuote = true;
          // Look for tag like $tag$
          let j = i + 2;
          while (j < sql.length && sql[j] !== '$') {
            dollarTag += sql[j];
            j++;
          }
        } else {
          // Check if it's the end of current dollar quote
          if (
            sql.substring(i + 2, i + 2 + dollarTag.length) === dollarTag &&
            sql[i + 2 + dollarTag.length] === '$'
          ) {
            // End of dollar quote
            inDollarQuote = false;
            dollarTag = '';
          }
        }
      }
      // Handle single quotes (ignore semicolons in quotes)
      else if (char === "'" && !inDoubleQuote && !inDollarQuote) {
        inSingleQuote = !inSingleQuote;
      }
      // Handle double quotes
      else if (char === '"' && !inSingleQuote && !inDollarQuote) {
        inDoubleQuote = !inDoubleQuote;
      }
      // Split on semicolons when not in quotes
      else if (
        char === ';' &&
        !inSingleQuote &&
        !inDoubleQuote &&
        !inDollarQuote
      ) {
        const statement = current.trim();
        if (statement) {
          statements.push(statement);
        }
        current = '';
      }
    }

    // Add any remaining content
    if (current.trim()) {
      statements.push(current.trim());
    }

    return statements;
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
