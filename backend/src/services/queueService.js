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

        case 'welcome_email':
          return await emailService.sendWelcomeEmail(data.user);

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
          attempts: options.attempts || 3,
          backoff: options.backoff || 'fixed',
          ...options,
        }
      );

      logger.info('Email job added to queue', {
        jobId: job.id,
        type,
        userId: data.user?.id,
      });

      return job;
    } catch (error) {
      logger.error('Failed to add email job to queue:', error);
      throw error;
    }
  }

  /**
   * Get queue statistics
   */
  async getQueueStats() {
    try {
      const [waiting, active, completed, failed, delayed] = await Promise.all([
        this.emailQueue.getWaiting(),
        this.emailQueue.getActive(),
        this.emailQueue.getCompleted(),
        this.emailQueue.getFailed(),
        this.emailQueue.getDelayed(),
      ]);

      return {
        waiting: waiting.length,
        active: active.length,
        completed: completed.length,
        failed: failed.length,
        delayed: delayed.length,
      };
    } catch (error) {
      logger.error('Failed to get queue stats:', error);
      return null;
    }
  }

  /**
   * Clean old completed jobs
   */
  async cleanOldJobs(olderThanHours = 24) {
    try {
      const completedCount = await this.emailQueue.clean(
        olderThanHours * 3600000,
        'completed'
      );

      const failedCount = await this.emailQueue.clean(
        olderThanHours * 3600000,
        'failed'
      );

      logger.info('Queue cleanup completed', {
        completedJobsRemoved: completedCount,
        failedJobsRemoved: failedCount,
      });

      return { completedCount, failedCount };
    } catch (error) {
      logger.error('Queue cleanup failed:', error);
      throw error;
    }
  }
}

const queueService = new QueueService();

module.exports = queueService;
