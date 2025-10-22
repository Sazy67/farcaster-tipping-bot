import { FrameConfig } from './metadata';

export interface FrameError {
  code: string;
  message: string;
  userMessage: string;
  recoverable: boolean;
}

export class FrameErrorHandler {
  private static readonly ERROR_MESSAGES: Record<string, FrameError> = {
    WALLET_NOT_CONNECTED: {
      code: 'WALLET_NOT_CONNECTED',
      message: 'User wallet not connected to Farcaster',
      userMessage: 'Please connect your wallet to Farcaster first',
      recoverable: true,
    },
    INSUFFICIENT_BALANCE: {
      code: 'INSUFFICIENT_BALANCE',
      message: 'Insufficient balance for transaction',
      userMessage: 'You don\'t have enough ETH for this tip',
      recoverable: true,
    },
    INVALID_AMOUNT: {
      code: 'INVALID_AMOUNT',
      message: 'Invalid tip amount provided',
      userMessage: 'Please enter a valid amount (0.001 - 0.1 ETH)',
      recoverable: true,
    },
    TRANSACTION_FAILED: {
      code: 'TRANSACTION_FAILED',
      message: 'Blockchain transaction failed',
      userMessage: 'Transaction failed. Please try again',
      recoverable: true,
    },
    RATE_LIMITED: {
      code: 'RATE_LIMITED',
      message: 'Too many requests from user',
      userMessage: 'Too many requests. Please wait a moment',
      recoverable: true,
    },
    FRAME_TIMEOUT: {
      code: 'FRAME_TIMEOUT',
      message: 'Frame action timed out',
      userMessage: 'Request timed out. Please try again',
      recoverable: true,
    },
    INVALID_SIGNATURE: {
      code: 'INVALID_SIGNATURE',
      message: 'Invalid frame signature',
      userMessage: 'Invalid request. Please refresh and try again',
      recoverable: true,
    },
    RECIPIENT_NOT_FOUND: {
      code: 'RECIPIENT_NOT_FOUND',
      message: 'Recipient wallet not found',
      userMessage: 'Recipient doesn\'t have a connected wallet',
      recoverable: false,
    },
    NETWORK_ERROR: {
      code: 'NETWORK_ERROR',
      message: 'Network connection error',
      userMessage: 'Network error. Please try again',
      recoverable: true,
    },
    UNKNOWN_ERROR: {
      code: 'UNKNOWN_ERROR',
      message: 'Unknown error occurred',
      userMessage: 'Something went wrong. Please try again',
      recoverable: true,
    },
  };

  /**
   * Get error details by code
   */
  static getError(code: string): FrameError {
    return this.ERROR_MESSAGES[code] || this.ERROR_MESSAGES.UNKNOWN_ERROR;
  }

  /**
   * Create error frame configuration
   */
  static createErrorFrame(
    error: FrameError,
    baseUrl: string,
    context?: {
      senderFid?: string;
      recipientFid?: string;
      amount?: string;
    }
  ): FrameConfig {
    const buttons = [];

    if (error.recoverable) {
      buttons.push({
        text: 'Try Again',
        action: 'post' as const,
      });
    }

    // Add help button for certain errors
    if (['WALLET_NOT_CONNECTED', 'RECIPIENT_NOT_FOUND'].includes(error.code)) {
      buttons.push({
        text: 'Help',
        action: 'link' as const,
        target: `${baseUrl}/help`,
      });
    }

    return {
      title: 'Tipping Error',
      description: error.userMessage,
      image: `${baseUrl}/api/frames/images/error?message=${encodeURIComponent(error.userMessage)}`,
      buttons,
      postUrl: `${baseUrl}/api/frame-actions`,
    };
  }

  /**
   * Handle frame timeout
   */
  static createTimeoutFrame(baseUrl: string): FrameConfig {
    const error = this.getError('FRAME_TIMEOUT');
    return this.createErrorFrame(error, baseUrl);
  }

  /**
   * Create fallback web interface URL
   */
  static createFallbackUrl(
    baseUrl: string,
    context: {
      senderFid?: string;
      recipientFid?: string;
      amount?: string;
      error?: string;
    }
  ): string {
    const params = new URLSearchParams();
    
    if (context.senderFid) params.set('sender', context.senderFid);
    if (context.recipientFid) params.set('recipient', context.recipientFid);
    if (context.amount) params.set('amount', context.amount);
    if (context.error) params.set('error', context.error);

    return `${baseUrl}/tip?${params.toString()}`;
  }

  /**
   * Log frame error for monitoring
   */
  static logError(
    error: FrameError,
    context: {
      fid?: number;
      buttonIndex?: number;
      inputText?: string;
      userAgent?: string;
      timestamp?: number;
    }
  ): void {
    console.error('Frame Error:', {
      code: error.code,
      message: error.message,
      context,
      timestamp: Date.now(),
    });

    // In production, this would send to monitoring service
    // like Sentry, DataDog, etc.
  }

  /**
   * Determine error code from exception
   */
  static classifyError(error: unknown): string {
    if (error instanceof Error) {
      const message = error.message.toLowerCase();
      
      if (message.includes('insufficient balance')) {
        return 'INSUFFICIENT_BALANCE';
      }
      
      if (message.includes('wallet not connected')) {
        return 'WALLET_NOT_CONNECTED';
      }
      
      if (message.includes('invalid amount')) {
        return 'INVALID_AMOUNT';
      }
      
      if (message.includes('transaction failed')) {
        return 'TRANSACTION_FAILED';
      }
      
      if (message.includes('rate limit')) {
        return 'RATE_LIMITED';
      }
      
      if (message.includes('timeout')) {
        return 'FRAME_TIMEOUT';
      }
      
      if (message.includes('signature')) {
        return 'INVALID_SIGNATURE';
      }
      
      if (message.includes('recipient not found')) {
        return 'RECIPIENT_NOT_FOUND';
      }
      
      if (message.includes('network')) {
        return 'NETWORK_ERROR';
      }
    }
    
    return 'UNKNOWN_ERROR';
  }
}