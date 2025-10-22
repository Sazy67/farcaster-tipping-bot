import { prisma } from '../db';
import { GlobalErrorHandler } from '../error/global-error-handler';

export class DatabaseOptimizer {
  /**
   * Optimize database queries with proper indexing
   */
  static async createOptimalIndexes(): Promise<void> {
    try {
      // These would be created via Prisma migrations in production
      const indexQueries = [
        // User table indexes
        'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_fid ON users(fid)',
        'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_wallet_address ON users(wallet_address)',
        'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_created_at ON users(created_at)',

        // Transaction table indexes
        'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_transactions_sender_fid ON transactions(sender_fid)',
        'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_transactions_recipient_fid ON transactions(recipient_fid)',
        'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_transactions_status ON transactions(status)',
        'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_transactions_created_at ON transactions(created_at)',
        'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_transactions_tx_hash ON transactions(tx_hash)',
        'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_transactions_sender_recipient ON transactions(sender_fid, recipient_fid)',
        'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_transactions_status_created ON transactions(status, created_at)',

        // Notification table indexes
        'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_notifications_user_fid ON notifications(user_fid)',
        'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_notifications_delivered ON notifications(delivered)',
        'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_notifications_created_at ON notifications(created_at)',
        'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_notifications_user_delivered ON notifications(user_fid, delivered)',
      ];

      for (const query of indexQueries) {
        try {
          await prisma.$executeRawUnsafe(query);
        } catch (error) {
          // Index might already exist, which is fine
          GlobalErrorHandler.logWarning(
            `Index creation skipped: ${query}`,
            {
              endpoint: 'database-optimizer',
              timestamp: Date.now(),
            }
          );
        }
      }

      GlobalErrorHandler.logInfo(
        'Database indexes optimization completed',
        {
          endpoint: 'database-optimizer',
          timestamp: Date.now(),
        }
      );
    } catch (error) {
      GlobalErrorHandler.logError(
        'Failed to create optimal indexes',
        error instanceof Error ? error : new Error(String(error)),
        {
          endpoint: 'database-optimizer',
          timestamp: Date.now(),
        }
      );
    }
  }

  /**
   * Analyze query performance
   */
  static async analyzeQueryPerformance(): Promise<{
    slowQueries: Array<{
      query: string;
      avgDuration: number;
      callCount: number;
    }>;
    recommendations: string[];
  }> {
    try {
      // In production, this would analyze pg_stat_statements
      const recommendations = [
        'Consider adding composite indexes for frequently queried column combinations',
        'Use LIMIT clauses for large result sets',
        'Implement pagination for transaction history queries',
        'Consider partitioning large tables by date',
        'Use connection pooling to reduce connection overhead',
      ];

      return {
        slowQueries: [], // Would be populated from actual query analysis
        recommendations,
      };
    } catch (error) {
      GlobalErrorHandler.logError(
        'Failed to analyze query performance',
        error instanceof Error ? error : new Error(String(error)),
        {
          endpoint: 'query-analysis',
          timestamp: Date.now(),
        }
      );

      return {
        slowQueries: [],
        recommendations: ['Unable to analyze queries - check database connection'],
      };
    }
  }

  /**
   * Optimize transaction queries
   */
  static async getOptimizedTransactionHistory(
    userFid: string,
    limit: number = 50,
    offset: number = 0,
    type?: 'sent' | 'received'
  ) {
    try {
      const whereClause = type === 'sent' 
        ? { senderFid: userFid }
        : type === 'received'
        ? { recipientFid: userFid }
        : {
            OR: [
              { senderFid: userFid },
              { recipientFid: userFid },
            ],
          };

      // Use optimized query with proper indexing
      const transactions = await prisma.transaction.findMany({
        where: whereClause,
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset,
        select: {
          id: true,
          senderFid: true,
          recipientFid: true,
          amount: true,
          platformFee: true,
          recipientAmount: true,
          token: true,
          txHash: true,
          status: true,
          createdAt: true,
          confirmedAt: true,
        },
      });

      return transactions;
    } catch (error) {
      GlobalErrorHandler.logError(
        'Optimized transaction history query failed',
        error instanceof Error ? error : new Error(String(error)),
        {
          userId: userFid,
          endpoint: 'optimized-transaction-history',
          timestamp: Date.now(),
        }
      );
      throw error;
    }
  }

  /**
   * Batch process pending transactions
   */
  static async batchProcessPendingTransactions(batchSize: number = 10) {
    try {
      const pendingTransactions = await prisma.transaction.findMany({
        where: { status: 'pending' },
        orderBy: { createdAt: 'asc' },
        take: batchSize,
        select: {
          id: true,
          txHash: true,
          createdAt: true,
        },
      });

      return pendingTransactions;
    } catch (error) {
      GlobalErrorHandler.logError(
        'Batch processing query failed',
        error instanceof Error ? error : new Error(String(error)),
        {
          endpoint: 'batch-process-transactions',
          timestamp: Date.now(),
        }
      );
      throw error;
    }
  }

  /**
   * Clean up old data
   */
  static async cleanupOldData(): Promise<{
    deletedTransactions: number;
    deletedNotifications: number;
  }> {
    try {
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

      // Delete old failed transactions (older than 30 days)
      const deletedTransactions = await prisma.transaction.deleteMany({
        where: {
          status: 'failed',
          createdAt: {
            lt: thirtyDaysAgo,
          },
        },
      });

      // Delete old delivered notifications (older than 7 days)
      const deletedNotifications = await prisma.notification.deleteMany({
        where: {
          delivered: true,
          createdAt: {
            lt: sevenDaysAgo,
          },
        },
      });

      GlobalErrorHandler.logInfo(
        `Cleanup completed: ${deletedTransactions.count} transactions, ${deletedNotifications.count} notifications`,
        {
          endpoint: 'database-cleanup',
          timestamp: Date.now(),
        }
      );

      return {
        deletedTransactions: deletedTransactions.count,
        deletedNotifications: deletedNotifications.count,
      };
    } catch (error) {
      GlobalErrorHandler.logError(
        'Database cleanup failed',
        error instanceof Error ? error : new Error(String(error)),
        {
          endpoint: 'database-cleanup',
          timestamp: Date.now(),
        }
      );

      return {
        deletedTransactions: 0,
        deletedNotifications: 0,
      };
    }
  }

  /**
   * Get database statistics
   */
  static async getDatabaseStats(): Promise<{
    totalUsers: number;
    totalTransactions: number;
    pendingTransactions: number;
    totalNotifications: number;
    undeliveredNotifications: number;
    databaseSize: string;
  }> {
    try {
      const [
        totalUsers,
        totalTransactions,
        pendingTransactions,
        totalNotifications,
        undeliveredNotifications,
      ] = await Promise.all([
        prisma.user.count(),
        prisma.transaction.count(),
        prisma.transaction.count({ where: { status: 'pending' } }),
        prisma.notification.count(),
        prisma.notification.count({ where: { delivered: false } }),
      ]);

      return {
        totalUsers,
        totalTransactions,
        pendingTransactions,
        totalNotifications,
        undeliveredNotifications,
        databaseSize: 'N/A', // Would require database-specific queries
      };
    } catch (error) {
      GlobalErrorHandler.logError(
        'Failed to get database stats',
        error instanceof Error ? error : new Error(String(error)),
        {
          endpoint: 'database-stats',
          timestamp: Date.now(),
        }
      );

      return {
        totalUsers: 0,
        totalTransactions: 0,
        pendingTransactions: 0,
        totalNotifications: 0,
        undeliveredNotifications: 0,
        databaseSize: 'Error',
      };
    }
  }

  /**
   * Vacuum and analyze database (PostgreSQL specific)
   */
  static async optimizeDatabase(): Promise<void> {
    try {
      // Note: VACUUM and ANALYZE should be run carefully in production
      await prisma.$executeRaw`ANALYZE`;
      
      GlobalErrorHandler.logInfo(
        'Database optimization completed',
        {
          endpoint: 'database-optimization',
          timestamp: Date.now(),
        }
      );
    } catch (error) {
      GlobalErrorHandler.logError(
        'Database optimization failed',
        error instanceof Error ? error : new Error(String(error)),
        {
          endpoint: 'database-optimization',
          timestamp: Date.now(),
        }
      );
    }
  }
}