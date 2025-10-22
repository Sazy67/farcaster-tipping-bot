import { 
  validateNetwork, 
  estimateGasForTransfer, 
  getCurrentGasPrice, 
  checkBalance,
  formatEthAmount,
  parseEthAmount,
  publicClient 
} from '../config';

// Mock viem
jest.mock('viem', () => ({
  createPublicClient: jest.fn(() => ({
    getChainId: jest.fn(),
    estimateGas: jest.fn(),
    getGasPrice: jest.fn(),
    getBalance: jest.fn(),
  })),
  createWalletClient: jest.fn(),
  http: jest.fn(),
}));

// Mock the config
jest.mock('../../config', () => ({
  config: {
    baseNetwork: {
      chainId: 8453,
      rpcUrl: 'https://mainnet.base.org',
    },
  },
}));

const mockPublicClient = publicClient as jest.Mocked<typeof publicClient>;

describe('Blockchain Config', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('validateNetwork', () => {
    it('should return true when on correct network', async () => {
      mockPublicClient.getChainId.mockResolvedValue(8453);

      const result = await validateNetwork();

      expect(result).toBe(true);
    });

    it('should return false when on wrong network', async () => {
      mockPublicClient.getChainId.mockResolvedValue(1);

      const result = await validateNetwork();

      expect(result).toBe(false);
    });

    it('should return false when network check fails', async () => {
      mockPublicClient.getChainId.mockRejectedValue(new Error('Network error'));

      const result = await validateNetwork();

      expect(result).toBe(false);
    });
  });

  describe('estimateGasForTransfer', () => {
    it('should return gas estimate with buffer', async () => {
      const mockGasEstimate = 21000n;
      mockPublicClient.estimateGas.mockResolvedValue(mockGasEstimate);

      const result = await estimateGasForTransfer(
        '0x1234567890123456789012345678901234567890' as `0x${string}`,
        '0x0987654321098765432109876543210987654321' as `0x${string}`,
        BigInt('1000000000000000000') // 1 ETH
      );

      // Should add 20% buffer: 21000 * 1.2 = 25200
      expect(result).toBe(25200n);
    });

    it('should return default gas limit when estimation fails', async () => {
      mockPublicClient.estimateGas.mockRejectedValue(new Error('Estimation failed'));

      const result = await estimateGasForTransfer(
        '0x1234567890123456789012345678901234567890' as `0x${string}`,
        '0x0987654321098765432109876543210987654321' as `0x${string}`,
        BigInt('1000000000000000000')
      );

      expect(result).toBe(21000n);
    });
  });

  describe('getCurrentGasPrice', () => {
    it('should return current gas price', async () => {
      const mockGasPrice = BigInt('20000000000'); // 20 gwei
      mockPublicClient.getGasPrice.mockResolvedValue(mockGasPrice);

      const result = await getCurrentGasPrice();

      expect(result).toBe(mockGasPrice);
    });

    it('should return default gas price when fetch fails', async () => {
      mockPublicClient.getGasPrice.mockRejectedValue(new Error('Gas price fetch failed'));

      const result = await getCurrentGasPrice();

      expect(result).toBe(20000000000n); // Default 20 gwei
    });
  });

  describe('checkBalance', () => {
    it('should return sufficient balance info', async () => {
      const mockBalance = BigInt('2000000000000000000'); // 2 ETH
      const requiredAmount = BigInt('1000000000000000000'); // 1 ETH
      
      mockPublicClient.getBalance.mockResolvedValue(mockBalance);

      const result = await checkBalance(
        '0x1234567890123456789012345678901234567890' as `0x${string}`,
        requiredAmount
      );

      expect(result).toEqual({
        hasBalance: true,
        currentBalance: mockBalance,
      });
    });

    it('should return insufficient balance info', async () => {
      const mockBalance = BigInt('500000000000000000'); // 0.5 ETH
      const requiredAmount = BigInt('1000000000000000000'); // 1 ETH
      
      mockPublicClient.getBalance.mockResolvedValue(mockBalance);

      const result = await checkBalance(
        '0x1234567890123456789012345678901234567890' as `0x${string}`,
        requiredAmount
      );

      expect(result).toEqual({
        hasBalance: false,
        currentBalance: mockBalance,
      });
    });

    it('should handle balance check errors', async () => {
      mockPublicClient.getBalance.mockRejectedValue(new Error('Balance check failed'));

      const result = await checkBalance(
        '0x1234567890123456789012345678901234567890' as `0x${string}`,
        BigInt('1000000000000000000')
      );

      expect(result).toEqual({
        hasBalance: false,
        currentBalance: 0n,
      });
    });
  });

  describe('formatEthAmount', () => {
    it('should format ETH amount correctly', () => {
      const amount = BigInt('1500000000000000000'); // 1.5 ETH
      
      const result = formatEthAmount(amount, 2);

      expect(result).toBe('1.50');
    });

    it('should use default decimals', () => {
      const amount = BigInt('1234567890000000000'); // ~1.2346 ETH
      
      const result = formatEthAmount(amount);

      expect(result).toBe('1.2346');
    });
  });

  describe('parseEthAmount', () => {
    it('should parse ETH amount correctly', () => {
      const result = parseEthAmount('1.5');

      expect(result).toBe(BigInt('1500000000000000000'));
    });

    it('should handle decimal amounts', () => {
      const result = parseEthAmount('0.001');

      expect(result).toBe(BigInt('1000000000000000'));
    });

    it('should handle whole numbers', () => {
      const result = parseEthAmount('2');

      expect(result).toBe(BigInt('2000000000000000000'));
    });
  });
});