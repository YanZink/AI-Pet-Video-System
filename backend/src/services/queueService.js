const Queue = require('bull');
const emailService = require('./emailService');
const logger = require('../utils/logger');

class QueueService {
  constructor() {
    this.emailQueue = new Queue('email processing', {
      redis: {
        host: process.env.REDIS_HOST || 'localhost',
        port: process.env.REDIS_PORT || 6379,
        password: process.env.REDIS_PASSWORD,
      },
    });

    this.setupQueueProcessors();
  }

  setupQueueProcessors() {
    this.emailQueue.process('send_email', async (job) => {
      const { type, data } = job.data;

      switch (type) {
        case 'status_update':
          return await emailService.sendRequestStatusUpdate(
            data.user,
            data.request,
            data.newStatus
          );

        default:
          throw new Error(`Unknown email type: ${type}`);
      }
    });
  }

  async addEmailJob(type, data, options = {}) {
    try {
      const job = await this.emailQueue.add(
        'send_email',
        {
          type,
          data,
        },
        {
          delay: options.delay || 0,
          ...options,
        }
      );

      logger.info('Email job added to queue', {
        jobId: job.id,
        type,
      });

      return job;
    } catch (error) {
      logger.error('Failed to add email job to queue:', error);
      throw error;
    }
  }
}

const queueService = new QueueService();

module.exports = queueService;
