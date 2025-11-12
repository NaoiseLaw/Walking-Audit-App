import Queue from 'bull';
import { redis } from '../config/redis.config';
import { logger } from '../utils/logger.util';

const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';

// Create queues
export const pdfQueue = new Queue('pdf-generation', redisUrl);
export const emailQueue = new Queue('email-sender', redisUrl);
export const syncQueue = new Queue('sync-processor', redisUrl);

// PDF Generation Queue
pdfQueue.process(async (job) => {
  logger.info(`Processing PDF generation job: ${job.id}`);
  const { reportService } = await import('../services/report.service');
  return reportService.generateReport(job.data.auditId);
});

pdfQueue.on('completed', (job) => {
  logger.info(`PDF generation job ${job.id} completed`);
});

pdfQueue.on('failed', (job, error) => {
  logger.error(`PDF generation job ${job.id} failed:`, error);
});

// Email Queue
emailQueue.process(async (job) => {
  logger.info(`Processing email job: ${job.id}`);
  const { emailService } = await import('../services/email.service');
  return emailService.processEmailQueue();
});

emailQueue.on('completed', (job) => {
  logger.info(`Email job ${job.id} completed`);
});

emailQueue.on('failed', (job, error) => {
  logger.error(`Email job ${job.id} failed:`, error);
});

// Sync Queue
syncQueue.process(async (job) => {
  logger.info(`Processing sync job: ${job.id}`);
  const { syncService } = await import('../services/sync.service');
  return syncService.processSyncQueue(job.data.userId);
});

syncQueue.on('completed', (job) => {
  logger.info(`Sync job ${job.id} completed`);
});

syncQueue.on('failed', (job, error) => {
  logger.error(`Sync job ${job.id} failed:`, error);
});

// Clean up function
export async function closeQueues() {
  await pdfQueue.close();
  await emailQueue.close();
  await syncQueue.close();
}

