import { GlobalErrorHandler } from '../error/global-error-handler';

interface RateLimitConfig {
  windowMs: number; // Time window in milliseconds
  maxRequests: number; // Maximum requests per window
  keyGenerator?: (identifier: string) => string;
}

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

export class RateLimiter {
  private static store = new Map<string, RateLimitEntry>();
  private static cleanupInterval: NodeJS.Timeout | null = null;

  /**
   * Check if request is within rate limit
   */
  static checkRateLimit(
    identifier: string,
    config: RateLimitConfig
  ): {
    allowed: boolean;
    remaining: number;
    resetTime: number;
    retryAfter?: number;
  } {
    const key = config.keyGenerator ? config.keyGenerator(identifier) : identifier;
    const now = Date.now();
    const windowStart = now - config.windowMs;

    // Get or create entry
    let entry = this.store.get(key);
    
    if (!entry || entry.resetTime <= now) {
      // Create new window
      entry = {
        count: 0,
        resetTime: now + config.windowMs,
      };
      this.store.set(key, entry);
    }

    // Check if within limit
    if (entry.count >= config.maxRequests) {
      const retryAfter = Math.ceil((entry.resetTime - now) / 1000);
      
      GlobalErrorHandler.logWarning(
        `Rate limit exceeded for ${identifier}`,
        {
          userId: identifier,
          endpoint: 'rate-limiter',
          timestamp: now,
        }
      );

      return {
        allowed: false,
        remaining: 0,
        resetTime: entry.resetTime,
        retryAfter,
      };
    }

    // Increment counter
    entry.count++;
    this.store.set(key, entry);

    return {
      allowed: true,
      remaining: config.maxRequests - entry.count,
      resetTime: entry.resetTime,
    };
  }

  /**
   * Rate limit for API endpoints (10 requests per minute)
   */
  static checkApiRateLimit(identifier: string) {
    return this.checkRateLimit(identifier, {
      windowMs: 60 * 1000, // 1 minute
      maxRequests: 10,
      keyGenerator: (id) => `api:${id}`,
    });
  }

  /**
   * Rate limit for frame actions (5 requests per minute)
   */
  static checkFrameRateLimit(identifier: string) {
    return this.checkRateLimit(identifier, {
      windowMs: 60 * 1000, // 1 minute
      maxRequests: 5,
      keyGenerator: (id) => `frame:${id}`,
    });
  }

  /**
   * Rate limit for transactions (3 per minute)
   */
  static checkTransactionRateLimit(identifier: string) {
    return this.checkRateLimit(identifier, {
      windowMs: 60 * 1000, // 1 minute
      maxRequests: 3,
      keyGenerator: (id) => `tx:${id}`,
    });
  }

  /**
   * Rate limit for notifications (20 per minute)
   */
  static checkNotificationRateLimit(identifier: string) {
    return this.checkRateLimit(identifier, {
      windowMs: 60 * 1000, // 1 minute
      maxRequests: 20,
      keyGenerator: (id) => `notif:${id}`,
    });
  }

  /**
   * Start cleanup process for expired entries
   */
  static startCleanup(): void {
    if (this.cleanupInterval) {
      return;
    }

    this.cleanupInterval = setInterval(() => {
      this.cleanup();
    }, 5 * 60 * 1000); // Cleanup every 5 minutes
  }

  /**
   * Stop cleanup process
   */
  static stopCleanup(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
  }

  /**
   * Clean up expired entries
   */
  static cleanup(): void {
    const now = Date.now();
    const expiredKeys: string[] = [];

    for (const [key, entry] of this.store.entries()) {
      if (entry.resetTime <= now) {
        expiredKeys.push(key);
      }
    }

    expiredKeys.forEach(key => this.store.delete(key));

    if (expiredKeys.length > 0) {
      GlobalErrorHandler.logInfo(
        `Cleaned up ${expiredKeys.length} expired rate limit entries`,
        {
          endpoint: 'rate-limiter-cleanup',
          timestamp: now,
        }
      );
    }
  }

  /**
   * Get rate limit statistics
   */
  static getStats(): {
    totalEntries: number;
    activeWindows: number;
    topUsers: Array<{ identifier: string; count: number; resetTime: number }>;
  } {
    const now = Date.now();
    const activeEntries = Array.from(this.store.entries())
      .filter(([_, entry]) => entry.resetTime > now)
      .map(([key, entry]) => ({
        identifier: key,
        count: entry.count,
        resetTime: entry.resetTime,
      }))
      .sort((a, b) => b.count - a.count);

    return {
      totalEntries: this.store.size,
      activeWindows: activeEntries.length,
      topUsers: activeEntries.slice(0, 10),
    };
  }

  /**
   * Reset rate limit for specific identifier
   */
  static resetRateLimit(identifier: string, type?: string): void {
    const patterns = type ? [`${type}:${identifier}`] : [
      `api:${identifier}`,
      `frame:${identifier}`,
      `tx:${identifier}`,
      `notif:${identifier}`,
    ];

    patterns.forEach(pattern => {
      this.store.delete(pattern);
    });

    GlobalErrorHandler.logInfo(
      `Rate limit reset for ${identifier}`,
      {
        userId: identifier,
        endpoint: 'rate-limiter-reset',
        timestamp: Date.now(),
      }
    );
  }

  /**
   * Block identifier temporarily
   */
  static blockIdentifier(
    identifier: string,
    durationMs: number,
    reason: string
  ): void {
    const blockKey = `block:${identifier}`;
    const resetTime = Date.now() + durationMs;

    this.store.set(blockKey, {
      count: Number.MAX_SAFE_INTEGER,
      resetTime,
    });

    GlobalErrorHandler.logWarning(
      `Identifier blocked: ${identifier} for ${durationMs}ms - ${reason}`,
      {
        userId: identifier,
        endpoint: 'rate-limiter-block',
        timestamp: Date.now(),
      }
    );
  }

  /**
   * Check if identifier is blocked
   */
  static isBlocked(identifier: string): {
    blocked: boolean;
    reason?: string;
    unblockTime?: number;
  } {
    const blockKey = `block:${identifier}`;
    const entry = this.store.get(blockKey);

    if (!entry) {
      return { blocked: false };
    }

    const now = Date.now();
    if (entry.resetTime <= now) {
      this.store.delete(blockKey);
      return { blocked: false };
    }

    return {
      blocked: true,
      reason: 'Temporarily blocked due to rate limit violations',
      unblockTime: entry.resetTime,
    };
  }
}