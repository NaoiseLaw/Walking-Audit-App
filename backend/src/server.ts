import dotenv from 'dotenv';
dotenv.config();

import app from './app';
import { connectDatabase } from './config/database.config';
import { connectRedis } from './config/redis.config';
import { logger } from './utils/logger.util';

const PORT = process.env.PORT || 3001;
const NODE_ENV = process.env.NODE_ENV || 'development';

async function startServer() {
  try {
    // Connect to database
    await connectDatabase();
    logger.info('✅ Database connected');
    
    // Connect to Redis
    await connectRedis();
    logger.info('✅ Redis connected');
    
    // Start background job scheduler
    if (process.env.NODE_ENV !== 'test') {
      startScheduler();
      logger.info('✅ Background job scheduler started');
    }
    
    // Start server
    const server = app.listen(PORT, () => {
      logger.info(`🚀 Server running on port ${PORT} in ${NODE_ENV} mode`);
      logger.info(`📍 API URL: http://localhost:${PORT}/v1`);
    });
    
    // Graceful shutdown
    const gracefulShutdown = (signal: string) => {
      logger.info(`${signal} received, closing server gracefully...`);
      
      server.close(() => {
        logger.info('Server closed');
        process.exit(0);
      });
      
      // Force close after 10 seconds
      setTimeout(() => {
        logger.error('Forced shutdown after timeout');
        process.exit(1);
      }, 10000);
    };
    
    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));
    
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
}

startServer();

