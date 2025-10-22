import { FarcasterWalletService } from '../wallet';
import { checkBalance, publicClient } from '../../blockchain/config';

// Mock blockchain config
jest.mock('../../blockchain/config', () => ({
  checkBalance: jest.fn(),
  publicClient: {
    getChainId: jest.fn(),
  },
}));

const mockCheckBalance = checkBalance as jest.MockedFunction<typeof checkBalance>;
const mockPublicClient = publicClient as jest.Mocked<typeof publicClient>;

describe('FarcasterWalletService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getWalletInfo', () => {
    it('should return null when no wallet is found', async () => {
      // Mock the private method to return null
      jest.spyOn(FarcasterWalletService as any, 'getFarcasterUserWallet')
        .mockResolvedValue(null);

      const result = await FarcasterWalletService.getWalletInfo('12345');

      expect(result).toBeNull();
    });

    it('should return wallet info when wallet is found', async () => {
      const mockWalletAddress = '0x1234567890123456789012345678901234567890' as `0x${string}`;
      
      jest.spyOn(FarcasterWalletService as any, 'getFarcasterUserWallet')
        .mockResolvedValue(mockWalletAddress);
      
      mockCheckBalance.mockResolvedValue({
        hasBalance: true,
        currentBalance: BigInt('100000000000000000'), // 0.1 ETH
      });

      const result = await FarcasterWalletService.getWalletInfo('12345');

      expect(result).toEqual({
        address: mockWalletAddress,
        fid: '12345',
        isConnected: true,
        balance: '0.1000',
      });
    });

    it('should handle errors gracefully', async () => {
      jest.spyOn(FarcasterWalletService as any, 'getFarcasterUserWallet')
        .mockRejectedValue(new Error('API Error'));

      const result = await FarcasterWalletService.getWalletInfo('12345');

      expect(result).toBeNull();
    });
  });

  describe('validateWalletOwnership', () => {
    it('should return true when wallet belongs to user', async () => {
      const mockWalletAddress = '0x1234567890123456789012345678901234567890' as `0x${string}`;
      
      jest.spyOn(FarcasterWalletService as any, 'getFarcasterUserWallet')
        .mockResolvedValue(mockWalletAddress);

      const result = await FarcasterWalletService.validateWalletOwnership('12345', mockWalletAddress);

      expect(result).toBe(true);
    });

    it('should return false when wallet does not belong to user', async () => {
      const userWallet = '0x1234567890123456789012345678901234567890' as `0x${string}`;
      const differentWallet = '0x0987654321098765432109876543210987654321' as `0x${string}`;
      
      jest.spyOn(FarcasterWalletService as any, 'getFarcasterUserWallet')
        .mockResolvedValue(userWallet);

      const result = await FarcasterWalletService.validateWalletOwnership('12345', differentWallet);

      expect(result).toBe(false);
    });

    it('should return false when user has no wallet', async () => {
      jest.spyOn(FarcasterWalletService as any, 'getFarcasterUserWallet')
        .mockResolvedValue(null);

      const result = await FarcasterWalletService.validateWalletOwnership(
        '12345', 
        '0x1234567890123456789012345678901234567890' as `0x${string}`
      );

      expect(result).toBe(false);
    });
  });

  describe('checkSufficientBalance', () => {
    it('should return balance info when wallet exists', async () => {
      const mockWalletAddress = '0x1234567890123456789012345678901234567890' as `0x${string}`;
      const requiredAmount = BigInt('50000000000000000'); // 0.05 ETH
      
      jest.spyOn(FarcasterWalletService, 'getWalletInfo')
        .mockResolvedValue({
          address: mockWalletAddress,
          fid: '12345',
          isConnected: true,
          balance: '0.1000',
        });

      mockCheckBalance.mockResolvedValue({
        hasBalance: true,
        currentBalance: BigInt('100000000000000000'), // 0.1 ETH
      });

      const result = await FarcasterWalletService.checkSufficientBalance('12345', requiredAmount);

      expect(result).toEqual({
        hasBalance: true,
        currentBalance: '0.1000',
        walletAddress: mockWalletAddress,
      });
    });

    it('should return insufficient balance when amount is too high', async () => {
      const mockWalletAddress = '0x1234567890123456789012345678901234567890' as `0x${string}`;
      const requiredAmount = BigInt('200000000000000000'); // 0.2 ETH
      
      jest.spyOn(FarcasterWalletService, 'getWalletInfo')
        .mockResolvedValue({
          address: mockWalletAddress,
          fid: '12345',
          isConnected: true,
          balance: '0.1000',
        });

      mockCheckBalance.mockResolvedValue({
        hasBalance: false,
        currentBalance: BigInt('100000000000000000'), // 0.1 ETH
      });

      const result = await FarcasterWalletService.checkSufficientBalance('12345', requiredAmount);

      expect(result).toEqual({
        hasBalance: false,
        currentBalance: '0.1000',
        walletAddress: mockWalletAddress,
      });
    });

    it('should return no balance when wallet not found', async () => {
      jest.spyOn(FarcasterWalletService, 'getWalletInfo')
        .mockResolvedValue(null);

      const result = await FarcasterWalletService.checkSufficientBalance('12345', BigInt('1000'));

      expect(result).toEqual({
        hasBalance: false,
        currentBalance: '0',
      });
    });
  });

  describe('getConnectionStatus', () => {
    it('should return connected status when wallet exists', async () => {
      const mockWalletAddress = '0x1234567890123456789012345678901234567890' as `0x${string}`;
      
      jest.spyOn(FarcasterWalletService, 'getWalletInfo')
        .mockResolvedValue({
          address: mockWalletAddress,
          fid: '12345',
          isConnected: true,
          balance: '0.1000',
        });

      mockPublicClient.getChainId.mockResolvedValue(8453); // Base mainnet

      const result = await FarcasterWalletService.getConnectionStatus('12345');

      expect(result).toEqual({
        isConnected: true,
        walletAddress: mockWalletAddress,
        networkValid: true,
      });
    });

    it('should return invalid network when on wrong chain', async () => {
      const mockWalletAddress = '0x1234567890123456789012345678901234567890' as `0x${string}`;
      
      jest.spyOn(FarcasterWalletService, 'getWalletInfo')
        .mockResolvedValue({
          address: mockWalletAddress,
          fid: '12345',
          isConnected: true,
          balance: '0.1000',
        });

      mockPublicClient.getChainId.mockResolvedValue(1); // Ethereum mainnet

      const result = await FarcasterWalletService.getConnectionStatus('12345');

      expect(result).toEqual({
        isConnected: true,
        walletAddress: mockWalletAddress,
        networkValid: false,
      });
    });

    it('should return not connected when no wallet', async () => {
      jest.spyOn(FarcasterWalletService, 'getWalletInfo')
        .mockResolvedValue(null);

      const result = await FarcasterWalletService.getConnectionStatus('12345');

      expect(result).toEqual({
        isConnected: false,
      });
    });
  });
});