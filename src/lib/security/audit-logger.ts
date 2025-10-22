import { GlobalErrorHandler } from '../error/global-error-handler';

export interface AuditEvent {
  id: string;
  timestamp: number;
  userId?: string;
  action: string;
  resource: string;
  details: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
  success: boolean;
  riskLevel: 'low' | 'medium' | 'high';
}

export class AuditLogger {
  private static events: AuditEvent[] = [];
  private static maxEvents = 10000;

  /**
   * Log an audit event
   */
  static logEvent(
    action: string,
    resource: string,
    details: Record<string, any> = {},
    options: {
      userId?: string;
      ipAddress?: string;
      userAgent?: string;
      success?: boolean;
      riskLevel?: 'low' | 'medium' | 'high';
    } = {}
  ): string {
    const eventId = this.generateEventId();
    
    const event: AuditEvent = {
      id: eventId,
      timestamp: Date.now(),
      userId: options.userId,
      action,
      resource,
      details,
      ipAddress: options.ipAddress,
      userAgent: options.userAgent,
      success: options.success ?? true,
      riskLevel: options.riskLevel ?? 'low',
    };

    this.addEvent(event);
    
    // Log high-risk events immediately
    if (event.riskLevel === 'high') {
      GlobalErrorHandler.logWarning(
        `High-risk audit event: ${action} on ${resource}`,
        {
          userId: event.userId,
          endpoint: 'audit-logger',
          timestamp: event.timestamp,
        }
      );
    }

    return eventId;
  }

  /**
   * Log transaction attempt
   */
  static logTransactionAttempt(
    senderFid: string,
    recipientFid: string,
    amount: string,
    success: boolean,
    details: Record<string, any> = {},
    ipAddress?: string
  ): string {
    return this.logEvent(
      'transaction_attempt',
      'transaction',
      {
        senderFid,
        recipientFid,
        amount,
        ...details,
      },
      {
        userId: senderFid,
        ipAddress,
        success,
        riskLevel: parseFloat(amount) > 0.05 ? 'medium' : 'low',
      }
    );
  }

  /**
   * Log wallet connection
   */
  static logWalletConnection(
    userFid: string,
    walletAddress: string,
    success: boolean,
    ipAddress?: string,
    userAgent?: string
  ): string {
    return this.logEvent(
      'wallet_connection',
      'wallet',
      {
        walletAddress,
      },
      {
        userId: userFid,
        ipAddress,
        userAgent,
        success,
        riskLevel: 'medium',
      }
    );
  }

  /**
   * Log frame interaction
   */
  static logFrameInteraction(
    userFid: string,
    frameAction: string,
    buttonIndex: number,
    inputText?: string,
    ipAddress?: string
  ): string {
    return this.logEvent(
      'frame_interaction',
      'frame',
      {
        frameAction,
        buttonIndex,
        inputText: inputText ? 'provided' : 'none',
      },
      {
        userId: userFid,
        ipAddress,
        success: true,
        riskLevel: 'low',
      }
    );
  }

  /**
   * Log API access
   */
  static logApiAccess(
    endpoint: string,
    method: string,
    statusCode: number,
    userId?: string,
    ipAddress?: string,
    userAgent?: string,
    responseTime?: number
  ): string {
    const riskLevel = statusCode >= 400 ? 'medium' : 'low';
    
    return this.logEvent(
      'api_access',
      'api',
      {
        endpoint,
        method,
        statusCode,
        responseTime,
      },
      {
        userId,
        ipAddress,
        userAgent,
        success: statusCode < 400,
        riskLevel,
      }
    );
  }

  /**
   * Log security event
   */
  static logSecurityEvent(
    eventType: string,
    description: string,
    userId?: string,
    ipAddress?: string,
    details: Record<string, any> = {}
  ): string {
    return this.logEvent(
      eventType,
      'security',
      {
        description,
        ...details,
      },
      {
        userId,
        ipAddress,
        success: false,
        riskLevel: 'high',
      }
    );
  }

  /**
   * Log rate limit violation
   */
  static logRateLimitViolation(
    userId: string,
    endpoint: string,
    ipAddress?: string
  ): string {
    return this.logEvent(
      'rate_limit_violation',
      'rate_limiter',
      {
        endpoint,
        violationType: 'exceeded_limit',
      },
      {
        userId,
        ipAddress,
        success: false,
        riskLevel: 'medium',
      }
    );
  }

  /**
   * Get audit events with filtering
   */
  static getEvents(
    filters: {
      userId?: string;
      action?: string;
      resource?: string;
      riskLevel?: 'low' | 'medium' | 'high';
      success?: boolean;
      startTime?: number;
      endTime?: number;
    } = {},
    limit: number = 100
  ): AuditEvent[] {
    let filteredEvents = this.events;

    if (filters.userId) {
      filteredEvents = filteredEvents.filter(e => e.userId === filters.userId);
    }

    if (filters.action) {
      filteredEvents = filteredEvents.filter(e => e.action === filters.action);
    }

    if (filters.resource) {
      filteredEvents = filteredEvents.filter(e => e.resource === filters.resource);
    }

    if (filters.riskLevel) {
      filteredEvents = filteredEvents.filter(e => e.riskLevel === filters.riskLevel);
    }

    if (filters.success !== undefined) {
      filteredEvents = filteredEvents.filter(e => e.success === filters.success);
    }

    if (filters.startTime) {
      filteredEvents = filteredEvents.filter(e => e.timestamp >= filters.startTime!);
    }

    if (filters.endTime) {
      filteredEvents = filteredEvents.filter(e => e.timestamp <= filters.endTime!);
    }

    return filteredEvents
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, limit);
  }

  /**
   * Get audit statistics
   */
  static getStatistics(): {
    totalEvents: number;
    eventsByAction: Record<string, number>;
    eventsByRiskLevel: Record<string, number>;
    successRate: number;
    last24Hours: number;
    topUsers: Array<{ userId: string; eventCount: number }>;
  } {
    const last24Hours = Date.now() - (24 * 60 * 60 * 1000);
    
    const eventsByAction: Record<string, number> = {};
    const eventsByRiskLevel: Record<string, number> = {};
    const userEventCounts: Record<string, number> = {};
    
    let successfulEvents = 0;
    let recentEvents = 0;

    this.events.forEach(event => {
      // Count by action
      eventsByAction[event.action] = (eventsByAction[event.action] || 0) + 1;
      
      // Count by risk level
      eventsByRiskLevel[event.riskLevel] = (eventsByRiskLevel[event.riskLevel] || 0) + 1;
      
      // Count successful events
      if (event.success) {
        successfulEvents++;
      }
      
      // Count recent events
      if (event.timestamp > last24Hours) {
        recentEvents++;
      }
      
      // Count by user
      if (event.userId) {
        userEventCounts[event.userId] = (userEventCounts[event.userId] || 0) + 1;
      }
    });

    const topUsers = Object.entries(userEventCounts)
      .map(([userId, eventCount]) => ({ userId, eventCount }))
      .sort((a, b) => b.eventCount - a.eventCount)
      .slice(0, 10);

    return {
      totalEvents: this.events.length,
      eventsByAction,
      eventsByRiskLevel,
      successRate: this.events.length > 0 ? successfulEvents / this.events.length : 0,
      last24Hours: recentEvents,
      topUsers,
    };
  }

  /**
   * Detect suspicious patterns
   */
  static detectSuspiciousActivity(): {
    suspiciousUsers: Array<{
      userId: string;
      reason: string;
      eventCount: number;
      riskScore: number;
    }>;
    alerts: string[];
  } {
    const suspiciousUsers: Array<{
      userId: string;
      reason: string;
      eventCount: number;
      riskScore: number;
    }> = [];
    const alerts: string[] = [];

    const last1Hour = Date.now() - (60 * 60 * 1000);
    const recentEvents = this.events.filter(e => e.timestamp > last1Hour);

    // Group events by user
    const userEvents: Record<string, AuditEvent[]> = {};
    recentEvents.forEach(event => {
      if (event.userId) {
        if (!userEvents[event.userId]) {
          userEvents[event.userId] = [];
        }
        userEvents[event.userId].push(event);
      }
    });

    // Analyze each user's activity
    Object.entries(userEvents).forEach(([userId, events]) => {
      let riskScore = 0;
      const reasons: string[] = [];

      // High frequency of failed transactions
      const failedTransactions = events.filter(e => 
        e.action === 'transaction_attempt' && !e.success
      ).length;
      if (failedTransactions > 3) {
        riskScore += 30;
        reasons.push(`${failedTransactions} failed transactions`);
      }

      // High frequency of API calls
      const apiCalls = events.filter(e => e.action === 'api_access').length;
      if (apiCalls > 50) {
        riskScore += 20;
        reasons.push(`${apiCalls} API calls in 1 hour`);
      }

      // Multiple wallet connections
      const walletConnections = events.filter(e => e.action === 'wallet_connection').length;
      if (walletConnections > 5) {
        riskScore += 25;
        reasons.push(`${walletConnections} wallet connections`);
      }

      // High-risk events
      const highRiskEvents = events.filter(e => e.riskLevel === 'high').length;
      if (highRiskEvents > 0) {
        riskScore += highRiskEvents * 15;
        reasons.push(`${highRiskEvents} high-risk events`);
      }

      if (riskScore > 30) {
        suspiciousUsers.push({
          userId,
          reason: reasons.join(', '),
          eventCount: events.length,
          riskScore,
        });
      }
    });

    // Generate alerts
    if (suspiciousUsers.length > 0) {
      alerts.push(`${suspiciousUsers.length} users showing suspicious activity`);
    }

    const highRiskEvents = recentEvents.filter(e => e.riskLevel === 'high').length;
    if (highRiskEvents > 10) {
      alerts.push(`${highRiskEvents} high-risk events in the last hour`);
    }

    return { suspiciousUsers, alerts };
  }

  /**
   * Clean up old events
   */
  static cleanup(): void {
    const oneWeekAgo = Date.now() - (7 * 24 * 60 * 60 * 1000);
    const initialCount = this.events.length;
    
    this.events = this.events.filter(event => event.timestamp > oneWeekAgo);
    
    const removedCount = initialCount - this.events.length;
    if (removedCount > 0) {
      GlobalErrorHandler.logInfo(
        `Cleaned up ${removedCount} old audit events`,
        {
          endpoint: 'audit-cleanup',
          timestamp: Date.now(),
        }
      );
    }
  }

  private static addEvent(event: AuditEvent): void {
    this.events.push(event);
    
    // Keep only the most recent events
    if (this.events.length > this.maxEvents) {
      this.events = this.events.slice(-this.maxEvents);
    }
  }

  private static generateEventId(): string {
    return `audit_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}