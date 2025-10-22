import { GlobalErrorHandler } from '../error/global-error-handler';

export class InputValidator {
  /**
   * Sanitize string input to prevent XSS
   */
  static sanitizeString(input: string): string {
    if (typeof input !== 'string') {
      return '';
    }

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
      .substring(0, 1000); // Limit length
  }

  /**
   * Validate Farcaster FID
   */
  static validateFid(fid: string): { valid: boolean; error?: string } {
    if (!fid || typeof fid !== 'string') {
      return { valid: false, error: 'FID is required' };
    }

    const fidNumber = parseInt(fid);
    if (isNaN(fidNumber) || fidNumber <= 0) {
      return { valid: false, error: 'FID must be a positive number' };
    }

    if (fidNumber > 1000000) {
      return { valid: false, error: 'FID is too large' };
    }

    return { valid: true };
  }

  /**
   * Validate ETH amount
   */
  static validateAmount(amount: string): { valid: boolean; error?: string; value?: number } {
    if (!amount || typeof amount !== 'string') {
      return { valid: false, error: 'Amount is required' };
    }

    const sanitizedAmount = amount.trim();
    
    // Check format
    if (!/^\d+(\.\d+)?$/.test(sanitizedAmount)) {
      return { valid: false, error: 'Invalid amount format' };
    }

    const value = parseFloat(sanitizedAmount);
    
    if (isNaN(value) || value <= 0) {
      return { valid: false, error: 'Amount must be greater than 0' };
    }

    // Check minimum (0.001 ETH)
    if (value < 0.001) {
      return { valid: false, error: 'Minimum amount is 0.001 ETH' };
    }

    // Check maximum (0.1 ETH)
    if (value > 0.1) {
      return { valid: false, error: 'Maximum amount is 0.1 ETH' };
    }

    return { valid: true, value };
  }

  /**
   * Validate transaction hash
   */
  static validateTxHash(txHash: string): { valid: boolean; error?: string } {
    if (!txHash || typeof txHash !== 'string') {
      return { valid: false, error: 'Transaction hash is required' };
    }

    const sanitizedHash = txHash.trim();
    
    if (!/^0x[a-fA-F0-9]{64}$/.test(sanitizedHash)) {
      return { valid: false, error: 'Invalid transaction hash format' };
    }

    return { valid: true };
  }

  /**
   * Validate Ethereum address
   */
  static validateAddress(address: string): { valid: boolean; error?: string } {
    if (!address || typeof address !== 'string') {
      return { valid: false, error: 'Address is required' };
    }

    const sanitizedAddress = address.trim();
    
    if (!/^0x[a-fA-F0-9]{40}$/.test(sanitizedAddress)) {
      return { valid: false, error: 'Invalid Ethereum address format' };
    }

    return { valid: true };
  }

  /**
   * Validate pagination parameters
   */
  static validatePagination(
    limit?: string, 
    offset?: string
  ): { valid: boolean; error?: string; limit?: number; offset?: number } {
    let validatedLimit = 50; // default
    let validatedOffset = 0; // default

    if (limit) {
      const limitNum = parseInt(limit);
      if (isNaN(limitNum) || limitNum <= 0) {
        return { valid: false, error: 'Limit must be a positive number' };
      }
      if (limitNum > 100) {
        return { valid: false, error: 'Limit cannot exceed 100' };
      }
      validatedLimit = limitNum;
    }

    if (offset) {
      const offsetNum = parseInt(offset);
      if (isNaN(offsetNum) || offsetNum < 0) {
        return { valid: false, error: 'Offset must be a non-negative number' };
      }
      validatedOffset = offsetNum;
    }

    return { 
      valid: true, 
      limit: validatedLimit, 
      offset: validatedOffset 
    };
  }

  /**
   * Validate notification type
   */
  static validateNotificationType(
    type: string
  ): { valid: boolean; error?: string; type?: 'tip_received' | 'tip_sent' } {
    if (!type || typeof type !== 'string') {
      return { valid: false, error: 'Notification type is required' };
    }

    const validTypes = ['tip_received', 'tip_sent'];
    if (!validTypes.includes(type)) {
      return { valid: false, error: 'Invalid notification type' };
    }

    return { valid: true, type: type as 'tip_received' | 'tip_sent' };
  }

  /**
   * Validate transaction filter
   */
  static validateTransactionFilter(
    filter: string
  ): { valid: boolean; error?: string; filter?: 'all' | 'sent' | 'received' } {
    if (!filter) {
      return { valid: true, filter: 'all' };
    }

    const validFilters = ['all', 'sent', 'received'];
    if (!validFilters.includes(filter)) {
      return { valid: false, error: 'Invalid transaction filter' };
    }

    return { valid: true, filter: filter as 'all' | 'sent' | 'received' };
  }

  /**
   * Validate and sanitize frame input
   */
  static validateFrameInput(
    input: string
  ): { valid: boolean; error?: string; sanitized?: string } {
    if (!input || typeof input !== 'string') {
      return { valid: false, error: 'Input is required' };
    }

    const sanitized = this.sanitizeString(input);
    
    if (sanitized.length === 0) {
      return { valid: false, error: 'Input cannot be empty after sanitization' };
    }

    if (sanitized.length > 100) {
      return { valid: false, error: 'Input is too long' };
    }

    return { valid: true, sanitized };
  }

  /**
   * Detect potential SQL injection attempts
   */
  static detectSqlInjection(input: string): boolean {
    const sqlPatterns = [
      /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|UNION)\b)/i,
      /(--|\/\*|\*\/)/,
      /(\b(OR|AND)\b.*=.*)/i,
      /(;|\||&)/,
      /(\b(SCRIPT|JAVASCRIPT|VBSCRIPT)\b)/i,
    ];

    return sqlPatterns.some(pattern => pattern.test(input));
  }

  /**
   * Comprehensive input validation with logging
   */
  static validateInput(
    input: any,
    type: 'fid' | 'amount' | 'txHash' | 'address' | 'string',
    context?: string
  ): { valid: boolean; error?: string; value?: any } {
    try {
      // Check for potential attacks
      if (typeof input === 'string' && this.detectSqlInjection(input)) {
        GlobalErrorHandler.logWarning(
          'Potential SQL injection attempt detected',
          {
            endpoint: context || 'input-validation',
            timestamp: Date.now(),
          }
        );
        return { valid: false, error: 'Invalid input detected' };
      }

      switch (type) {
        case 'fid':
          return this.validateFid(input);
        case 'amount':
          return this.validateAmount(input);
        case 'txHash':
          return this.validateTxHash(input);
        case 'address':
          return this.validateAddress(input);
        case 'string':
          const frameResult = this.validateFrameInput(input);
          return {
            valid: frameResult.valid,
            error: frameResult.error,
            value: frameResult.sanitized,
          };
        default:
          return { valid: false, error: 'Unknown validation type' };
      }
    } catch (error) {
      GlobalErrorHandler.logError(
        'Input validation error',
        error instanceof Error ? error : new Error(String(error)),
        {
          endpoint: context || 'input-validation',
          timestamp: Date.now(),
        }
      );
      return { valid: false, error: 'Validation failed' };
    }
  }
}