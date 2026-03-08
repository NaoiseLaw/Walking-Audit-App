import Redis from 'ioredis';
import { logger } from '../utils/logger.util';

// No-op stub for environments without Redis (e.g. Vercel serverless)
const noopRedis = {
  get: async (_key: string) => null,
  set: async (..._args: any[]) => 'OK',
  setex: async (..._args: any[]) => 'OK',
  del: async (..._args: any[]) => 0,
  ping: async () => 'PONG',
  disconnect: () => {},
  on: () => noopRedis,
} as unknown as Redis;

const redisUrl = process.env.REDIS_URL;

let redisInstance: Redis;

if (redisUrl) {
  redisInstance = new Redis(redisUrl, {
    maxRetriesPerRequest: 3,
    retryStrategy: (times: number) => {
      const delay = Math.min(times * 50, 2000);
      return delay;
    },
    reconnectOnError: (err: Error) => {
      if (err.message.includes('READONLY')) return true;
      return false;
    },
  });

  redisInstance.on('connect', () => {
    logger.info('Redis connected successfully');
  });

  redisInstance.on('error', (error) => {
    logger.error('Redis connection error:', error);
  });

  redisInstance.on('close', () => {
    logger.warn('Redis connection closed');
  });
} else {
  logger.warn('REDIS_URL not set — running without cache (no-op Redis stub)');
  redisInstance = noopRedis;
}

export const redis = redisInstance;

export async function connectRedis(): Promise<void> {
  if (!redisUrl) {
    logger.warn('Skipping Redis connection — REDIS_URL not configured');
    return;
  }
  try {
    await redis.ping();
    logger.info('Redis connected successfully');
  } catch (error) {
    logger.error('Failed to connect to Redis:', error);
    throw error;
  }
}

export async function disconnectRedis(): Promise<void> {
  redis.disconnect();
}

