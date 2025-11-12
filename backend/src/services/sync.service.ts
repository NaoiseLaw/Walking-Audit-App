import { prisma } from '../config/database.config';
import { redis } from '../config/redis.config';
import { logger } from '../utils/logger.util';
import { ApiError } from '../middleware/error.middleware';
import { auditService } from './audit.service';
import { issueService } from './issue.service';
import { photoService } from './photo.service';
import { recommendationService } from './recommendation.service';

export class SyncService {
  /**
   * Process sync queue
   */
  async processSyncQueue(userId: string) {
    // Get pending sync items
    const syncItems = await prisma.syncQueue.findMany({
      where: {
        userId,
        status: 'pending',
      },
      orderBy: [
        { priority: 'desc' },
        { createdAt: 'asc' },
      ],
      take: 50,
    });

    const results = [];

    for (const item of syncItems) {
      try {
        await this.processSyncItem(item);
        results.push({
          id: item.id,
          status: 'success',
        });
      } catch (error) {
        logger.error(`Sync failed for item ${item.id}:`, error);
        
        // Update item with error
        await prisma.syncQueue.update({
          where: { id: item.id },
          data: {
            status: item.attempts >= item.maxAttempts ? 'failed' : 'pending',
            attempts: {
              increment: 1,
            },
            lastError: error instanceof Error ? error.message : 'Unknown error',
            lastAttemptAt: new Date(),
          },
        });

        results.push({
          id: item.id,
          status: 'failed',
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }

    return results;
  }

  /**
   * Process a single sync item
   */
  private async processSyncItem(item: any) {
    const { entityType, entityId, operation, payload } = item;

    switch (entityType) {
      case 'audit':
        await this.syncAudit(operation, payload);
        break;
      case 'issue':
        await this.syncIssue(operation, payload);
        break;
      case 'photo':
        await this.syncPhoto(operation, payload);
        break;
      case 'recommendation':
        await this.syncRecommendation(operation, payload);
        break;
      default:
        throw new Error(`Unknown entity type: ${entityType}`);
    }

    // Mark as completed
    await prisma.syncQueue.update({
      where: { id: item.id },
      data: {
        status: 'completed',
        completedAt: new Date(),
        processedAt: new Date(),
      },
    });
  }

  /**
   * Sync audit
   */
  private async syncAudit(operation: string, payload: any) {
    if (operation === 'create') {
      await auditService.create(payload.userId, payload.data);
    } else if (operation === 'update') {
      await auditService.update(payload.auditId, payload.userId, payload.data);
    }
  }

  /**
   * Sync issue
   */
  private async syncIssue(operation: string, payload: any) {
    if (operation === 'create') {
      await issueService.create(payload.userId, payload.data);
    } else if (operation === 'update') {
      await issueService.update(payload.issueId, payload.userId, payload.data);
    }
  }

  /**
   * Sync photo
   */
  private async syncPhoto(operation: string, payload: any) {
    if (operation === 'create') {
      // Photo upload would need file data, which should be handled separately
      // This is a placeholder
      logger.warn('Photo sync not fully implemented');
    }
  }

  /**
   * Sync recommendation
   */
  private async syncRecommendation(operation: string, payload: any) {
    if (operation === 'create') {
      await recommendationService.create(payload.userId, payload.data);
    } else if (operation === 'update') {
      await recommendationService.update(payload.recommendationId, payload.userId, payload.data);
    }
  }

  /**
   * Add item to sync queue
   */
  async addToSyncQueue(userId: string, entityType: string, entityId: string, operation: string, payload: any, priority: string = 'normal') {
    return prisma.syncQueue.create({
      data: {
        userId,
        entityType,
        entityId,
        operation,
        payload,
        priority,
        status: 'pending',
      },
    });
  }

  /**
   * Get sync queue status
   */
  async getSyncQueueStatus(userId: string) {
    const [pending, failed, completed] = await Promise.all([
      prisma.syncQueue.count({
        where: {
          userId,
          status: 'pending',
        },
      }),
      prisma.syncQueue.count({
        where: {
          userId,
          status: 'failed',
        },
      }),
      prisma.syncQueue.count({
        where: {
          userId,
          status: 'completed',
          completedAt: {
            gte: new Date(Date.now() - 24 * 60 * 60 * 1000), // Last 24 hours
          },
        },
      }),
    ]);

    return {
      pending,
      failed,
      completed,
    };
  }
}

export const syncService = new SyncService();

