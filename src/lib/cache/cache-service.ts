import { redisClient } from './redis-client';
import { GlobalErrorHandler } from '../error/global-error-handler';

export class CacheService {
  private static readonly DEFAULT_TTL = 300; // 5 minutes
  private static readonly CACHE_PREFIX = 'farcaster-tip:';

  /**
   * Generate cache key with prefix
   */
  private static generateKey(key: string): string {
    return `${this.CACHE_PREFIX}${key}`;
  }

  /**
   * Cache transaction data
   */
  static async cacheTransaction(
    transactionId: string,
    data: any,
    ttl: number = this.DEFAULT_TTL
  ): Promise<boolean> {
    try {
      const key = this.generateKey(`tx:${transactionId}`);
      const value = JSON.stringify(data);
      
      return await redisClient.set(key, value, { EX: ttl });
    } catch (error) {
      GlobalErrorHandler.logError(
        'Failed to cache transaction',
        error instanceof Error ? error : new Error(String(error)),
        {
          transactionId,
          endpoint: 'cache-transaction',
          timestamp: Date.now(),
        }
      );
      return false;
    }
  }

  /**
   * Get cached transaction data
   */
  static async getCachedTransaction(transactionId: string): Promise<any | null> {
    try {
      const key = this.generateKey(`tx:${transactionId}`);
      const cached = await redisClient.get(key);
      
      return cached ? JSON.parse(cached) : null;
    } catch (error) {
      GlobalErrorHandler.logError(
        'Failed to get cached transaction',
        error instanceof Error ? error : new Error(String(error)),
        {
          transactionId,
          endpoint: 'get-cached-transaction',
          timestamp: Date.now(),
        }
      );
      return null;
    }
  }

  /**
   * Cache user wallet info
   */
  static async cacheWalletInfo(
    userFid: string,
    walletInfo: any,
    ttl: number = 60 // 1 minute for wallet info
  ): Promise<boolean> {
    try {
      const key = this.generateKey(`wallet:${userFid}`);
      const value = JSON.stringify(walletInfo);
      
      return await redisClient.set(key, value, { EX: ttl });
    } catch (error) {
      GlobalErrorHandler.logError(
        'Failed to cache wallet info',
        error instanceof Error ? error : new Error(String(error)),
        {
          userId: userFid,
          endpoint: 'cache-wallet',
          timestamp: Date.now(),
        }
      );
      return false;
    }
  }

  /**
   * Get cached wallet info
   */
  static async getCachedWalletInfo(userFid: string): Promise<any | null> {
    try {
      const key = this.generateKey(`wallet:${userFid}`);
      const cached = await redisClient.get(key);
      
      return cached ? JSON.parse(cached) : null;
    } catch (error) {
      GlobalErrorHandler.logError(
        'Failed to get cached wallet info',
        error instanceof Error ? error : new Error(String(error)),
        {
          userId: userFid,
          endpoint: 'get-cached-wallet',
          timestamp: Date.now(),
        }
      );
      return null;
    }
  }

  /**
   * Cache frame response
   */
  static async cacheFrameResponse(
    frameKey: string,
    response: string,
    ttl: number = 30 // 30 seconds for frames
  ): Promise<boolean> {
    try {
      const key = this.generateKey(`frame:${frameKey}`);
      
      return await redisClient.set(key, response, { EX: ttl });
    } catch (error) {
      GlobalErrorHandler.logError(
        'Failed to cache frame response',
        error instanceof Error ? error : new Error(String(error)),
        {
          endpoint: 'cache-frame',
          timestamp: Date.now(),
        }
      );
      return false;
    }
  }

  /**
   * Get cached frame response
   */
  static async getCachedFrameResponse(frameKey: string): Promise<string | null> {
    try {
      const key = this.generateKey(`frame:${frameKey}`);
      
      return await redisClient.get(key);
    } catch (error) {
      GlobalErrorHandler.logError(
        'Failed to get cached frame response',
        error instanceof Error ? error : new Error(String(error)),
        {
          endpoint: 'get-cached-frame',
          timestamp: Date.now(),
        }
      );
      return null;
    }
  }

  /**
   * Cache API response
   */
  static async cacheApiResponse(
    endpoint: string,
    params: string,
    response: any,
    ttl: number = this.DEFAULT_TTL
  ): Promise<boolean> {
    try {
      const key = this.generateKey(`api:${endpoint}:${params}`);
      const value = JSON.stringify(response);
      
      return await redisClient.set(key, value, { EX: ttl });
    } catch (error) {
      GlobalErrorHandler.logError(
        'Failed to cache API response',
        error instanceof Error ? error : new Error(String(error)),
        {
          endpoint: 'cache-api',
          timestamp: Date.now(),
        }
      );
      return false;
    }
  }

  /**
   * Get cached API response
   */
  static async getCachedApiResponse(
    endpoint: string,
    params: string
  ): Promise<any | null> {
    try {
      const key = this.generateKey(`api:${endpoint}:${params}`);
      const cached = await redisClient.get(key);
      
      return cached ? JSON.parse(cached) : null;
    } catch (error) {
      GlobalErrorHandler.logError(
        'Failed to get cached API response',
        error instanceof Error ? error : new Error(String(error)),
        {
          endpoint: 'get-cached-api',
          timestamp: Date.now(),
        }
      );
      return null;
    }
  }

  /**
   * Invalidate cache by pattern
   */
  static async invalidatePattern(pattern: string): Promise<boolean> {
    try {
      // Note: This is a simplified implementation
      // In production, you might want to use Redis SCAN for better performance
      const key = this.generateKey(pattern);
      
      return await redisClient.del(key);
    } catch (error) {
      GlobalErrorHandler.logError(
        'Failed to invalidate cache pattern',
        error instanceof Error ? error : new Error(String(error)),
        {
          endpoint: 'invalidate-cache',
          timestamp: Date.now(),
        }
      );
      return false;
    }
  }

  /**
   * Invalidate user-related cache
   */
  static async invalidateUserCache(userFid: string): Promise<void> {
    try {
      await Promise.all([
        this.invalidatePattern(`wallet:${userFid}`),
        this.invalidatePattern(`user:${userFid}:*`),
      ]);
    } catch (error) {
      GlobalErrorHandler.logError(
        'Failed to invalidate user cache',
        error instanceof Error ? error : new Error(String(error)),
        {
          userId: userFid,
          endpoint: 'invalidate-user-cache',
          timestamp: Date.now(),
        }
      );
    }
  }

  /**
   * Invalidate transaction-related cache
   */
  static async invalidateTransactionCache(transactionId: string): Promise<void> {
    try {
      await this.invalidatePattern(`tx:${transactionId}`);
    } catch (error) {
      GlobalErrorHandler.logError(
        'Failed to invalidate transaction cache',
        error instanceof Error ? error : new Error(String(error)),
        {
          transactionId,
          endpoint: 'invalidate-transaction-cache',
          timestamp: Date.now(),
        }
      );
    }
  }

  /**
   * Get cache statistics
   */
  static async getCacheStats(): Promise<{
    connected: boolean;
    keyCount: number;
    memoryUsage: string;
  }> {
    try {
      const isHealthy = redisClient.isHealthy();
      
      if (!isHealthy) {
        return {
          connected: false,
          keyCount: 0,
          memoryUsage: 'N/A',
        };
      }

      // Note: These would require additional Redis commands in a real implementation
      return {
        connected: true,
        keyCount: 0, // Would use DBSIZE command
        memoryUsage: 'N/A', // Would use INFO memory command
      };
    } catch (error) {
      GlobalErrorHandler.logError(
        'Failed to get cache stats',
        error instanceof Error ? error : new Error(String(error)),
        {
          endpoint: 'cache-stats',
          timestamp: Date.now(),
        }
      );
      
      return {
        connected: false,
        keyCount: 0,
        memoryUsage: 'Error',
      };
    }
  }

  /**
   * Warm up cache with frequently accessed data
   */
  static async warmUpCache(): Promise<void> {
    try {
      GlobalErrorHandler.logInfo(
        'Cache warm-up initiated',
        {
          endpoint: 'cache-warmup',
          timestamp: Date.now(),
        }
      );

      // In a real implementation, you would:
      // 1. Pre-load frequently accessed user data
      // 2. Cache common frame responses
      // 3. Pre-calculate expensive operations
      
      GlobalErrorHandler.logInfo(
        'Cache warm-up completed',
        {
          endpoint: 'cache-warmup',
          timestamp: Date.now(),
        }
      );
    } catch (error) {
      GlobalErrorHandler.logError(
        'Cache warm-up failed',
        error instanceof Error ? error : new Error(String(error)),
        {
          endpoint: 'cache-warmup',
          timestamp: Date.now(),
        }
      );
    }
  }
}