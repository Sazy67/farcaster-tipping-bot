import { TransactionService } from '../transaction';
import { TransactionModel } from '../../models/transaction';
import { 
  checkBalance, 
  estimateGasForTransfer, 
  getCurrentGasPrice,
  createWalletClientForAddress,
  publicClient 
} from '../../blockchain/config';

// Mock dependencies
jest.mock('../../models/transaction');
jest.mock('../../config', () => ({
  config: {
    platform: {
      feePercentage: 1,
      maxTipAmount: '0.1',
      walletAddress: '0xplatform123',
    },
    baseNetwork: {
      rpcUrl: 'https://mainnet.base.org',
      chainId: 8453,
    },
  },
}));

const mockTransactionModel = TransactionModel as jest.Mocked<typeof TransactionModel>;
const mockCheckBalance = checkBalance as jest.MockedFunction<typeof checkBalance>;
const mockEstimateGasForTransfer = estimateGasForTransfer as jest.MockedFunction<typeof estimateGasForTransfer>;
const mockGetCurrentGasPrice = getCurrentGasPrice as jest.MockedFunction<typeof getCurrentGasPrice>;
const mockCreateWalletClientForAddress = createWalletClientForAddress as jest.MockedFunction<typeof createWalletClientForAddress>;
const mockPublicClient = publicClient as jest.Mocked<typeof publicClient>;

// Mock parseEthAmount and formatEthAmount
jest.mock('../../blockchain/config', () => ({
  ...jest.requireActual('../../blockchain/config'),
  checkBalance: jest.fn(),
  estimateGasForTransfer: jest.fn(),
  getCurrentGasPrice: jest.fn(),
  createWalletClientForAddress: jest.fn(),
  publicClient: {
    getTransactionReceipt: jest.fn(),
  },
  parseEthAmount: jest.fn((amount: string) => BigInt(Math.floor(parseFloat(amount) * 1e18))),
  formatEthAmount: jest.fn((amount: bigint) => (Number(amount) / 1e18).toFixed(4)),
}));

describe('TransactionService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('calculateFee', () => {
    it('should calculate 1% platform fee correctly', () => {
      const result = TransactionService.calculateFee('1.0');

      expect(result).toEqual({
        originalAmount: '1.0',
        platformFee: '0.01000000',
        recipientAmount: '0.99000000',
        feePercentage: 1,
      });
    });

    it('should handle small amounts', () => {
      const result = TransactionService.calculateFee('0.001');

      expect(result).toEqual({
        originalAmount: '0.001',
        platformFee: '0.00001000',
        recipientAmount: '0.00099000',
        feePercentage: 1,
      });
    });
  });

  describe('validateTransaction', () => {
    const mockParams = {
      senderFid: '12345',
      recipientFid: '67890',
      senderAddress: '0xsender123' as `0x${string}`,
      recipientAddress: '0xrecipient456' as `0x${string}`,
      amount: '0.05',
      token: 'ETH' as const,
    };

    it('should validate successful transaction', async () => {
      mockEstimateGasForTransfer.mockResolvedValue(21000n);
      mockGetCurrentGasPrice.mockResolvedValue(20000000000n); // 20 gwei
      mockCheckBalance.mockResolvedValue({
        hasBalance: true,
        currentBalance: BigInt('1000000000000000000'), // 1 ETH
      });

      const result = await TransactionService.validateTransaction(mockParams);

      expect(result.isValid).toBe(true);
    });

    it('should reject zero amount', async () => {
      const result = await TransactionService.validateTransaction({
        ...mockParams,
        amount: '0',
      });

      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Amount must be greater than 0');
    });

    it('should reject amount exceeding maximum', async () => {
      const result = await TransactionService.validateTransaction({
        ...mockParams,
        amount: '1.0', // Exceeds 0.1 ETH limit
      });

      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Amount exceeds maximum limit of 0.1 ETH');
    });

    it('should reject insufficient balance', async () => {
      mockEstimateGasForTransfer.mockResolvedValue(21000n);
      mockGetCurrentGasPrice.mockResolvedValue(20000000000n);
      mockCheckBalance.mockResolvedValue({
        hasBalance: false,
        currentBalance: BigInt('10000000000000000'), // 0.01 ETH
      });

      const result = await TransactionService.validateTransaction(mockParams);

      expect(result.isValid).toBe(false);
      expect(result.error).toContain('Insufficient balance');
    });
  });

  describe('sendTip', () => {
    const mockParams = {
      senderFid: '12345',
      recipientFid: '67890',
      senderAddress: '0xsender123' as `0x${string}`,
      recipientAddress: '0xrecipient456' as `0x${string}`,
      amount: '0.05',
      token: 'ETH' as const,
    };

    it('should send tip successfully', async () => {
      // Mock validation
      mockEstimateGasForTransfer.mockResolvedValue(21000n);
      mockGetCurrentGasPrice.mockResolvedValue(20000000000n);
      mockCheckBalance.mockResolvedValue({
        hasBalance: true,
        currentBalance: BigInt('1000000000000000000'),
      });

      // Mock wallet client
      const mockWalletClient = {
        sendTransaction: jest.fn()
          .mockResolvedValueOnce('0xtxhash123') // Main transaction
          .mockResolvedValueOnce('0xfeetxhash456'), // Fee transaction
      };
      mockCreateWalletClientForAddress.mockReturnValue(mockWalletClient as any);

      // Mock database
      const mockTransaction = {
        id: 'tx123',
        senderFid: '12345',
        recipientFid: '67890',
        amount: '0.05',
        platformFee: '0.00050000',
        recipientAmount: '0.04950000',
        token: 'ETH',
        txHash: '0xtxhash123',
        feeTxHash: '0xfeetxhash456',
        status: 'pending',
        createdAt: new Date(),
        confirmedAt: null,
      };
      mockTransactionModel.create.mockResolvedValue(mockTransaction as any);

      const result = await TransactionService.sendTip(mockParams);

      expect(result).toEqual({
        transactionId: 'tx123',
        txHash: '0xtxhash123',
        feeTxHash: '0xfeetxhash456',
        status: 'pending',
        platformFee: '0.00050000',
        recipientAmount: '0.04950000',
      });

      expect(mockWalletClient.sendTransaction).toHaveBeenCalledTimes(2);
    });

    it('should handle fee transaction failure gracefully', async () => {
      // Mock validation
      mockEstimateGasForTransfer.mockResolvedValue(21000n);
      mockGetCurrentGasPrice.mockResolvedValue(20000000000n);
      mockCheckBalance.mockResolvedValue({
        hasBalance: true,
        currentBalance: BigInt('1000000000000000000'),
      });

      // Mock wallet client - fee transaction fails
      const mockWalletClient = {
        sendTransaction: jest.fn()
          .mockResolvedValueOnce('0xtxhash123') // Main transaction succeeds
          .mockRejectedValueOnce(new Error('Fee transaction failed')), // Fee transaction fails
      };
      mockCreateWalletClientForAddress.mockReturnValue(mockWalletClient as any);

      // Mock database
      const mockTransaction = {
        id: 'tx123',
        senderFid: '12345',
        recipientFid: '67890',
        amount: '0.05',
        platformFee: '0.00050000',
        recipientAmount: '0.04950000',
        token: 'ETH',
        txHash: '0xtxhash123',
        feeTxHash: undefined,
        status: 'pending',
        createdAt: new Date(),
        confirmedAt: null,
      };
      mockTransactionModel.create.mockResolvedValue(mockTransaction as any);

      const result = await TransactionService.sendTip(mockParams);

      expect(result.txHash).toBe('0xtxhash123');
      expect(result.feeTxHash).toBeUndefined();
    });
  });

  describe('getTransactionStatus', () => {
    it('should return confirmed status for successful transaction', async () => {
      const mockReceipt = {
        status: 'success' as const,
        blockNumber: 12345n,
        gasUsed: 21000n,
      };
      mockPublicClient.getTransactionReceipt.mockResolvedValue(mockReceipt);

      const result = await TransactionService.getTransactionStatus('0xtxhash123');

      expect(result).toEqual({
        status: 'confirmed',
        blockNumber: 12345,
        gasUsed: '21000',
      });
    });

    it('should return failed status for failed transaction', async () => {
      const mockReceipt = {
        status: 'reverted' as const,
        blockNumber: 12345n,
        gasUsed: 21000n,
      };
      mockPublicClient.getTransactionReceipt.mockResolvedValue(mockReceipt);

      const result = await TransactionService.getTransactionStatus('0xtxhash123');

      expect(result).toEqual({
        status: 'failed',
        blockNumber: 12345,
        gasUsed: '21000',
      });
    });

    it('should return pending status when transaction not found', async () => {
      mockPublicClient.getTransactionReceipt.mockRejectedValue(new Error('Transaction not found'));

      const result = await TransactionService.getTransactionStatus('0xtxhash123');

      expect(result).toEqual({
        status: 'pending',
      });
    });
  });

  describe('updateTransactionStatus', () => {
    it('should update transaction status from pending to confirmed', async () => {
      const mockTransaction = {
        id: 'tx123',
        txHash: '0xtxhash123',
        status: 'pending',
      };
      mockTransactionModel.findById.mockResolvedValue(mockTransaction as any);

      const mockReceipt = {
        status: 'success' as const,
        blockNumber: 12345n,
        gasUsed: 21000n,
      };
      mockPublicClient.getTransactionReceipt.mockResolvedValue(mockReceipt);

      mockTransactionModel.updateStatus.mockResolvedValue({
        ...mockTransaction,
        status: 'confirmed',
      } as any);

      const result = await TransactionService.updateTransactionStatus('tx123');

      expect(result).toBe('confirmed');
      expect(mockTransactionModel.updateStatus).toHaveBeenCalledWith(
        'tx123',
        'confirmed',
        expect.any(Date)
      );
    });

    it('should return existing status for already confirmed transaction', async () => {
      const mockTransaction = {
        id: 'tx123',
        txHash: '0xtxhash123',
        status: 'confirmed',
      };
      mockTransactionModel.findById.mockResolvedValue(mockTransaction as any);

      const result = await TransactionService.updateTransactionStatus('tx123');

      expect(result).toBe('confirmed');
      expect(mockTransactionModel.updateStatus).not.toHaveBeenCalled();
    });
  });

  describe('estimateTransactionCost', () => {
    const mockParams = {
      senderFid: '12345',
      recipientFid: '67890',
      senderAddress: '0xsender123' as `0x${string}`,
      recipientAddress: '0xrecipient456' as `0x${string}`,
      amount: '0.05',
      token: 'ETH' as const,
    };

    it('should estimate transaction cost correctly', async () => {
      mockEstimateGasForTransfer.mockResolvedValue(21000n);
      mockGetCurrentGasPrice.mockResolvedValue(20000000000n); // 20 gwei

      const result = await TransactionService.estimateTransactionCost(mockParams);

      expect(result).toEqual({
        gasEstimate: '21000',
        gasCost: '0.0004', // 21000 * 20 gwei = 0.0004 ETH
        totalCost: '0.0504', // 0.05 + 0.0004 = 0.0504 ETH
      });
    });
  });
});