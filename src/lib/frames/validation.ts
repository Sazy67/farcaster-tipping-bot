import { FarcasterAPI } from '../farcaster/api';

export interface FrameActionData {
  fid: number;
  buttonIndex: number;
  inputText?: string;
  castId?: {
    fid: number;
    hash: string;
  };
  url: string;
  messageBytes: string;
}

export interface ValidatedFrameAction {
  isValid: boolean;
  fid?: number;
  buttonIndex?: number;
  inputText?: string;
  castId?: {
    fid: number;
    hash: string;
  };
  error?: string;
}

export class FrameValidator {
  /**
   * Validate frame action signature and data
   */
  static async validateFrameAction(
    trustedData: { messageBytes: string },
    untrustedData: {
      fid: number;
      buttonIndex: number;
      inputText?: string;
      castId?: { fid: number; hash: string };
      url: string;
    }
  ): Promise<ValidatedFrameAction> {
    try {
      // Validate signature using Farcaster API
      const isValidSignature = await FarcasterAPI.validateFrameSignature(
        trustedData.messageBytes,
        '' // Signature would be extracted from messageBytes
      );

      if (!isValidSignature) {
        return {
          isValid: false,
          error: 'Invalid frame signature',
        };
      }

      // Validate button index
      if (untrustedData.buttonIndex < 1 || untrustedData.buttonIndex > 4) {
        return {
          isValid: false,
          error: 'Invalid button index',
        };
      }

      // Validate FID
      if (!untrustedData.fid || untrustedData.fid <= 0) {
        return {
          isValid: false,
          error: 'Invalid FID',
        };
      }

      return {
        isValid: true,
        fid: untrustedData.fid,
        buttonIndex: untrustedData.buttonIndex,
        inputText: untrustedData.inputText,
        castId: untrustedData.castId,
      };
    } catch (error) {
      console.error('Frame validation error:', error);
      return {
        isValid: false,
        error: 'Frame validation failed',
      };
    }
  }

  /**
   * Validate input text for tipping amounts
   */
  static validateTipAmount(inputText?: string): {
    isValid: boolean;
    amount?: string;
    error?: string;
  } {
    if (!inputText) {
      return {
        isValid: false,
        error: 'Amount is required',
      };
    }

    const trimmedInput = inputText.trim();
    
    // Check if it's a valid number
    const amountRegex = /^\d+(\.\d+)?$/;
    if (!amountRegex.test(trimmedInput)) {
      return {
        isValid: false,
        error: 'Invalid amount format',
      };
    }

    const amount = parseFloat(trimmedInput);
    
    // Check minimum amount (0.001 ETH)
    if (amount < 0.001) {
      return {
        isValid: false,
        error: 'Minimum amount is 0.001 ETH',
      };
    }

    // Check maximum amount (0.1 ETH)
    if (amount > 0.1) {
      return {
        isValid: false,
        error: 'Maximum amount is 0.1 ETH',
      };
    }

    return {
      isValid: true,
      amount: trimmedInput,
    };
  }

  /**
   * Rate limiting check for frame actions
   */
  static async checkRateLimit(fid: number): Promise<{
    allowed: boolean;
    remainingRequests?: number;
    resetTime?: number;
  }> {
    try {
      // This would integrate with Redis for rate limiting
      // For now, return allowed for development
      return {
        allowed: true,
        remainingRequests: 9,
        resetTime: Date.now() + 60000, // 1 minute from now
      };
    } catch (error) {
      console.error('Rate limit check failed:', error);
      return {
        allowed: false,
      };
    }
  }

  /**
   * Sanitize user input to prevent XSS
   */
  static sanitizeInput(input: string): string {
    return input
      .replace(/[<>\"'&]/g, (match) => {
        const escapeMap: { [key: string]: string } = {
          '<': '&lt;',
          '>': '&gt;',
          '"': '&quot;',
          "'": '&#x27;',
          '&': '&amp;',
        };
        return escapeMap[match];
      })
      .trim()
      .substring(0, 100); // Limit length
  }
}