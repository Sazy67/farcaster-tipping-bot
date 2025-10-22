export interface ErrorContext {
  userId?: string;
  transactionId?: string;
  endpoint?: string;
  userAgent?: string;
  timestamp: number;
  requestId?: string;
}

export interface ErrorLog {
  id: string;
  level: 'error' | 'warn' | 'info';
  message: string;
  error?: Error;
  context: ErrorContext;
  stack?: string;
  timestamp: number;
}

export class GlobalErrorHandler {
  private static logs: ErrorLog[] = [];
  private static maxLogs = 1000;

  /**
   * Log an error with context
   */
  static logError(
    message: string,
    error?: Error,
    context: Partial<ErrorContext> = {}
  ): string {
    const errorId = this.generateErrorId();
    
    const errorLog: ErrorLog = {
      id: errorId,
      level: 'error',
      message,
      error,
      context: {
        ...context,
        timestamp: Date.now(),
      },
      stack: error?.stack,
      timestamp: Date.now(),
    };

    this.addLog(errorLog);
    
    // In production, send to monitoring service
    this.sendToMonitoring(errorLog);
    
    return errorId;
  }

  /**
   * Log a warning
   */
  static logWarning(
    message: string,
    context: Partial<ErrorContext> = {}
  ): string {
    const warningId = this.generateErrorId();
    
    const warningLog: ErrorLog = {
      id: warningId,
      level: 'warn',
      message,
      context: {
        ...context,
        timestamp: Date.now(),
      },
      timestamp: Date.now(),
    };

    this.addLog(warningLog);
    
    return warningId;
  }

  /**
   * Log info message
   */
  static logInfo(
    message: string,
    context: Partial<ErrorContext> = {}
  ): string {
    const infoId = this.generateErrorId();
    
    const infoLog: ErrorLog = {
      id: infoId,
      level: 'info',
      message,
      context: {
        ...context,
        timestamp: Date.now(),
      },
      timestamp: Date.now(),
    };

    this.addLog(infoLog);
    
    return infoId;
  }

  /**
   * Get error logs
   */
  static getLogs(
    level?: 'error' | 'warn' | 'info',
    limit: number = 100
  ): ErrorLog[] {
    let filteredLogs = this.logs;
    
    if (level) {
      filteredLogs = this.logs.filter(log => log.level === level);
    }
    
    return filteredLogs
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, limit);
  }

  /**
   * Clear old logs
   */
  static clearOldLogs(): void {
    const oneWeekAgo = Date.now() - (7 * 24 * 60 * 60 * 1000);
    this.logs = this.logs.filter(log => log.timestamp > oneWeekAgo);
  }

  /**
   * Get error statistics
   */
  static getErrorStats(): {
    total: number;
    errors: number;
    warnings: number;
    info: number;
    last24Hours: number;
  } {
    const last24Hours = Date.now() - (24 * 60 * 60 * 1000);
    
    return {
      total: this.logs.length,
      errors: this.logs.filter(log => log.level === 'error').length,
      warnings: this.logs.filter(log => log.level === 'warn').length,
      info: this.logs.filter(log => log.level === 'info').length,
      last24Hours: this.logs.filter(log => log.timestamp > last24Hours).length,
    };
  }

  /**
   * Handle unhandled promise rejections
   */
  static handleUnhandledRejection(reason: any, promise: Promise<any>): void {
    this.logError(
      'Unhandled Promise Rejection',
      reason instanceof Error ? reason : new Error(String(reason)),
      {
        endpoint: 'unhandled-rejection',
        timestamp: Date.now(),
      }
    );
  }

  /**
   * Handle uncaught exceptions
   */
  static handleUncaughtException(error: Error): void {
    this.logError(
      'Uncaught Exception',
      error,
      {
        endpoint: 'uncaught-exception',
        timestamp: Date.now(),
      }
    );
  }

  /**
   * Create user-friendly error message
   */
  static createUserFriendlyMessage(error: Error): string {
    const errorMessage = error.message.toLowerCase();
    
    if (errorMessage.includes('network') || errorMessage.includes('fetch')) {
      return 'Network connection error. Please check your internet connection and try again.';
    }
    
    if (errorMessage.includes('timeout')) {
      return 'Request timed out. Please try again.';
    }
    
    if (errorMessage.includes('insufficient balance')) {
      return 'Insufficient balance to complete this transaction.';
    }
    
    if (errorMessage.includes('wallet not connected')) {
      return 'Please connect your wallet to continue.';
    }
    
    if (errorMessage.includes('transaction failed')) {
      return 'Transaction failed. Please try again or contact support.';
    }
    
    if (errorMessage.includes('rate limit')) {
      return 'Too many requests. Please wait a moment before trying again.';
    }
    
    return 'Something went wrong. Please try again or contact support if the problem persists.';
  }

  /**
   * Check system health
   */
  static getSystemHealth(): {
    status: 'healthy' | 'degraded' | 'unhealthy';
    errorRate: number;
    recentErrors: number;
    uptime: number;
  } {
    const last5Minutes = Date.now() - (5 * 60 * 1000);
    const recentErrors = this.logs.filter(
      log => log.level === 'error' && log.timestamp > last5Minutes
    ).length;
    
    const errorRate = recentErrors / 5; // errors per minute
    
    let status: 'healthy' | 'degraded' | 'unhealthy' = 'healthy';
    if (errorRate > 10) {
      status = 'unhealthy';
    } else if (errorRate > 5) {
      status = 'degraded';
    }
    
    return {
      status,
      errorRate,
      recentErrors,
      uptime: process.uptime(),
    };
  }

  private static addLog(log: ErrorLog): void {
    this.logs.push(log);
    
    // Keep only the most recent logs
    if (this.logs.length > this.maxLogs) {
      this.logs = this.logs.slice(-this.maxLogs);
    }
  }

  private static generateErrorId(): string {
    return `err_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private static sendToMonitoring(log: ErrorLog): void {
    // In production, this would send to monitoring services like:
    // - Sentry
    // - DataDog
    // - New Relic
    // - Custom logging service
    
    if (process.env.NODE_ENV === 'production') {
      console.error('Error logged:', {
        id: log.id,
        message: log.message,
        context: log.context,
        stack: log.stack,
      });
    }
  }
}