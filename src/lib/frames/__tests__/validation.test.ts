import { FrameValidator } from '../validation';
import { FarcasterAPI } from '../../farcaster/api';

// Mock FarcasterAPI
jest.mock('../../farcaster/api', () => ({
  FarcasterAPI: {
    validateFrameSignature: jest.fn(),
  },
}));

const mockFarcasterAPI = FarcasterAPI as jest.Mocked<typeof FarcasterAPI>;

describe('FrameValidator', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('validateFrameAction', () => {
    const mockTrustedData = { messageBytes: 'mock-message-bytes' };
    const mockUntrustedData = {
      fid: 12345,
      buttonIndex: 1,
      inputText: 'test input',
      castId: { fid: 67890, hash: 'mock-hash' },
      url: 'https://example.com',
    };

    it('should validate successful frame action', async () => {
      mockFarcasterAPI.validateFrameSignature.mockResolvedValue(true);

      const result = await FrameValidator.validateFrameAction(mockTrustedData, mockUntrustedData);

      expect(result).toEqual({
        isValid: true,
        fid: 12345,
        buttonIndex: 1,
        inputText: 'test input',
        castId: { fid: 67890, hash: 'mock-hash' },
      });
    });

    it('should reject invalid signature', async () => {
      mockFarcasterAPI.validateFrameSignature.mockResolvedValue(false);

      const result = await FrameValidator.validateFrameAction(mockTrustedData, mockUntrustedData);

      expect(result).toEqual({
        isValid: false,
        error: 'Invalid frame signature',
      });
    });

    it('should reject invalid button index', async () => {
      mockFarcasterAPI.validateFrameSignature.mockResolvedValue(true);

      const result = await FrameValidator.validateFrameAction(mockTrustedData, {
        ...mockUntrustedData,
        buttonIndex: 5, // Invalid button index
      });

      expect(result).toEqual({
        isValid: false,
        error: 'Invalid button index',
      });
    });

    it('should reject invalid FID', async () => {
      mockFarcasterAPI.validateFrameSignature.mockResolvedValue(true);

      const result = await FrameValidator.validateFrameAction(mockTrustedData, {
        ...mockUntrustedData,
        fid: 0, // Invalid FID
      });

      expect(result).toEqual({
        isValid: false,
        error: 'Invalid FID',
      });
    });

    it('should handle validation errors', async () => {
      mockFarcasterAPI.validateFrameSignature.mockRejectedValue(new Error('Validation failed'));

      const result = await FrameValidator.validateFrameAction(mockTrustedData, mockUntrustedData);

      expect(result).toEqual({
        isValid: false,
        error: 'Frame validation failed',
      });
    });
  });

  describe('validateTipAmount', () => {
    it('should validate correct amount', () => {
      const result = FrameValidator.validateTipAmount('0.05');

      expect(result).toEqual({
        isValid: true,
        amount: '0.05',
      });
    });

    it('should reject empty input', () => {
      const result = FrameValidator.validateTipAmount('');

      expect(result).toEqual({
        isValid: false,
        error: 'Amount is required',
      });
    });

    it('should reject invalid format', () => {
      const result = FrameValidator.validateTipAmount('abc');

      expect(result).toEqual({
        isValid: false,
        error: 'Invalid amount format',
      });
    });

    it('should reject amount below minimum', () => {
      const result = FrameValidator.validateTipAmount('0.0001');

      expect(result).toEqual({
        isValid: false,
        error: 'Minimum amount is 0.001 ETH',
      });
    });

    it('should reject amount above maximum', () => {
      const result = FrameValidator.validateTipAmount('1.0');

      expect(result).toEqual({
        isValid: false,
        error: 'Maximum amount is 0.1 ETH',
      });
    });

    it('should handle decimal amounts', () => {
      const result = FrameValidator.validateTipAmount('0.001');

      expect(result).toEqual({
        isValid: true,
        amount: '0.001',
      });
    });

    it('should handle whole numbers', () => {
      const result = FrameValidator.validateTipAmount('0.1');

      expect(result).toEqual({
        isValid: true,
        amount: '0.1',
      });
    });
  });

  describe('checkRateLimit', () => {
    it('should allow requests within rate limit', async () => {
      const result = await FrameValidator.checkRateLimit(12345);

      expect(result).toEqual({
        allowed: true,
        remainingRequests: 9,
        resetTime: expect.any(Number),
      });
    });
  });

  describe('sanitizeInput', () => {
    it('should sanitize HTML characters', () => {
      const input = '<script>alert("xss")</script>';
      const result = FrameValidator.sanitizeInput(input);

      expect(result).toBe('&lt;script&gt;alert(&quot;xss&quot;)&lt;/script&gt;');
    });

    it('should trim whitespace', () => {
      const input = '  test input  ';
      const result = FrameValidator.sanitizeInput(input);

      expect(result).toBe('test input');
    });

    it('should limit length', () => {
      const input = 'a'.repeat(200);
      const result = FrameValidator.sanitizeInput(input);

      expect(result).toHaveLength(100);
    });

    it('should handle special characters', () => {
      const input = 'test & "quotes" & \'apostrophes\'';
      const result = FrameValidator.sanitizeInput(input);

      expect(result).toBe('test &amp; &quot;quotes&quot; &amp; &#x27;apostrophes&#x27;');
    });
  });
});