import { createClient, RedisClientType } from 'redis';
import { config } from '../config';
import { GlobalErrorHandler } from '../error/global-error-handler';

class RedisClient {
  private client: RedisClientType | null = null;
  private isConnected = false;

  async connect(): Promise<void> {
    if (this.isConnected && this.client) {
      return;
    }

    try {
      this.client = createClient({
        url: config.redis.url,
        socket: {
          reconnectStrategy: (retries) => Math.min(retries * 50, 1000),
        },
      });

      this.client.on('error', (error) => {
        GlobalErrorHandler.logError(
          'Redis connection error',
          error,
          {
            endpoint: 'redis-client',
            timestamp: Date.now(),
          }
        );
      });

      this.client.on('connect', () => {
        GlobalErrorHandler.logInfo(
          'Redis connected successfully',
          {
            endpoint: 'redis-client',
            timestamp: Date.now(),
          }
        );
      });

      await this.client.connect();
      this.isConnected = true;
    } catch (error) {
      GlobalErrorHandler.logError(
        'Failed to connect to Redis',
        error instanceof Error ? error : new Error(String(error)),
        {
          endpoint: 'redis-client',
          timestamp: Date.now(),
        }
      );
      throw error;
    }
  }

  async disconnect(): Promise<void> {
    if (this.client && this.isConnected) {
      await this.client.disconnect();
      this.isConnected = false;
    }
  }

  async get(key: string): Promise<string | null> {
    if (!this.client || !this.isConnected) {
      await this.connect();
    }

    try {
      return await this.client!.get(key);
    } catch (error) {
      GlobalErrorHandler.logError(
        'Redis GET operation failed',
        error instanceof Error ? error : new Error(String(error)),
        {
          endpoint: 'redis-get',
          timestamp: Date.now(),
        }
      );
      return null;
    }
  }

  async set(
    key: string, 
    value: string, 
    options?: { EX?: number; PX?: number }
  ): Promise<boolean> {
    if (!this.client || !this.isConnected) {
      await this.connect();
    }

    try {
      await this.client!.set(key, value, options);
      return true;
    } catch (error) {
      GlobalErrorHandler.logError(
        'Redis SET operation failed',
        error instanceof Error ? error : new Error(String(error)),
        {
          endpoint: 'redis-set',
          timestamp: Date.now(),
        }
      );
      return false;
    }
  }

  async del(key: string): Promise<boolean> {
    if (!this.client || !this.isConnected) {
      await this.connect();
    }

    try {
      await this.client!.del(key);
      return true;
    } catch (error) {
      GlobalErrorHandler.logError(
        'Redis DEL operation failed',
        error instanceof Error ? error : new Error(String(error)),
        {
          endpoint: 'redis-del',
          timestamp: Date.now(),
        }
      );
      return false;
    }
  }

  async exists(key: string): Promise<boolean> {
    if (!this.client || !this.isConnected) {
      await this.connect();
    }

    try {
      const result = await this.client!.exists(key);
      return result === 1;
    } catch (error) {
      GlobalErrorHandler.logError(
        'Redis EXISTS operation failed',
        error instanceof Error ? error : new Error(String(error)),
        {
          endpoint: 'redis-exists',
          timestamp: Date.now(),
        }
      );
      return false;
    }
  }

  async incr(key: string): Promise<number> {
    if (!this.client || !this.isConnected) {
      await this.connect();
    }

    try {
      return await this.client!.incr(key);
    } catch (error) {
      GlobalErrorHandler.logError(
        'Redis INCR operation failed',
        error instanceof Error ? error : new Error(String(error)),
        {
          endpoint: 'redis-incr',
          timestamp: Date.now(),
        }
      );
      return 0;
    }
  }

  async expire(key: string, seconds: number): Promise<boolean> {
    if (!this.client || !this.isConnected) {
      await this.connect();
    }

    try {
      await this.client!.expire(key, seconds);
      return true;
    } catch (error) {
      GlobalErrorHandler.logError(
        'Redis EXPIRE operation failed',
        error instanceof Error ? error : new Error(String(error)),
        {
          endpoint: 'redis-expire',
          timestamp: Date.now(),
        }
      );
      return false;
    }
  }

  async hget(key: string, field: string): Promise<string | null> {
    if (!this.client || !this.isConnected) {
      await this.connect();
    }

    try {
      return await this.client!.hGet(key, field);
    } catch (error) {
      GlobalErrorHandler.logError(
        'Redis HGET operation failed',
        error instanceof Error ? error : new Error(String(error)),
        {
          endpoint: 'redis-hget',
          timestamp: Date.now(),
        }
      );
      return null;
    }
  }

  async hset(key: string, field: string, value: string): Promise<boolean> {
    if (!this.client || !this.isConnected) {
      await this.connect();
    }

    try {
      await this.client!.hSet(key, field, value);
      return true;
    } catch (error) {
      GlobalErrorHandler.logError(
        'Redis HSET operation failed',
        error instanceof Error ? error : new Error(String(error)),
        {
          endpoint: 'redis-hset',
          timestamp: Date.now(),
        }
      );
      return false;
    }
  }

  isHealthy(): boolean {
    return this.isConnected && this.client !== null;
  }
}

// Export singleton instance
export const redisClient = new RedisClient();