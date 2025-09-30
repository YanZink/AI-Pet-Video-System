class Logger {
  constructor() {
    this.level = process.env.LOG_LEVEL || 'info';
  }

  info(message, context = {}) {
    console.log(`[INFO] ${new Date().toISOString()} - ${message}`, context);
  }

  error(message, context = {}) {
    console.error(`[ERROR] ${new Date().toISOString()} - ${message}`, context);
  }

  warn(message, context = {}) {
    console.warn(`[WARN] ${new Date().toISOString()} - ${message}`, context);
  }

  debug(message, context = {}) {
    if (this.level === 'debug') {
      console.log(`[DEBUG] ${new Date().toISOString()} - ${message}`, context);
    }
  }
}

// Create singleton instance
const logger = new Logger();

module.exports = logger;
