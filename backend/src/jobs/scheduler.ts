import cron from 'node-cron';
import { emailQueue } from './queue';
import { logger } from '../utils/logger.util';

/**
 * Schedule background jobs
 */
export function startScheduler() {
  // Process email queue every 5 minutes
  cron.schedule('*/5 * * * *', async () => {
    logger.info('Running scheduled email queue processing');
    try {
      await emailQueue.add('process-emails', {}, { repeat: { cron: '*/5 * * * *' } });
    } catch (error) {
      logger.error('Failed to schedule email processing:', error);
    }
  });

  // Process sync queue every 10 minutes
  cron.schedule('*/10 * * * *', async () => {
    logger.info('Running scheduled sync queue processing');
    // This would process all pending sync items
    // Implementation depends on your sync strategy
  });

  logger.info('Background job scheduler started');
}

