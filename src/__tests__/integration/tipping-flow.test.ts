/**
 * Integration test for the complete tipping flow
 * Tests the end-to-end process from frame interaction to transaction completion
 */

import { TransactionService } from '../../lib/services/transaction';
import { NotificationService } from '../../lib/services/notification';
import { FarcasterWalletService } from '../../lib/farcaster/wallet';
import { FrameValidator } from '../../lib/frames/validation';
import { TransactionModel } from '../../lib/models/transaction';
import { UserModel } from '../../lib/models/user';

// Mock external dependencies
jest.mock('../../lib/farcaster/wallet');
jest.mock('../../lib/models/transaction');
jest.mock('../../lib/models/user');
jest.mock('../../lib/models/notification');

const mockFarcasterWalletService = FarcasterWalletService as jest.Mocked<typeof FarcasterWalletService>;
const mockTransactionModel = TransactionModel as jest.Mocked<typeof TransactionModel>;
const mockUserModel = UserModel as jest.Mocked<typeof UserModel>;

describe('Tipping Flow Integration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Complete Tipping Flow', () => {
    it('should complete a successful tip from frame to notification', async () => {
      // Setup mock data
      const senderFid = '12345';
      const recipientFid = '67890';
      const amount = '0.05';
      const senderWallet = {
        address: '0x1234567890123456789012345678901234567890' as `0x${string}`,
        fid: senderFid,
        isConnected: true,
        balance: '1.0000',
      };
      const recipientWallet = {
        address: '0x0987654321098765432109876543210987654321' as `0x${string}`,
        fid: recipientFid,
        isConnected: true,
        balance: '0.5000',
      };

      // Mock wallet service
      mockFarcasterWalletService.getWalletInfo
        .mockResolvedValueOnce(senderWallet)
        .mockResolvedValueOnce(recipientWallet);
      
      mockFarcasterWalletService.checkSufficientBalance.mockResolvedValue({
        hasBalance: true,
        currentBalance: '1.0000',
        walletAddress: senderWallet.address,
      });

      // Mock transaction creation
      const mockTransaction = {
        id: 'tx123',
        senderFid,
        recipientFid,
        amount,
        platformFee: '0.0005',
        recipientAmount: '0.0495',
        token: 'ETH',
        txHash: '0xabc123',
        feeTxHash: '0xfee456',
        status: 'pending',
        createdAt: new Date(),
        confirmedAt: null,
      };

      mockTransactionModel.create.mockResolvedValue(mockTransaction as any);

      // Step 1: Validate frame input
      const amountValidation = FrameValidator.validateTipAmount(amount);
      expect(amountValidation.isValid).toBe(true);
      expect(amountValidation.amount).toBe(amount);

      // Step 2: Check wallet connections
      const senderWalletInfo = await FarcasterWalletService.getWalletInfo(senderFid);
      const recipientWalletInfo = await FarcasterWalletService.getWalletInfo(recipientFid);
      
      expect(senderWalletInfo?.isConnected).toBe(true);
      expect(recipientWalletInfo?.isConnected).toBe(true);

      // Step 3: Check balance
      const balanceCheck = await FarcasterWalletService.checkSufficientBalance(
        senderFid,
        BigInt(Math.floor(parseFloat(amount) * 1e18))
      );
      expect(balanceCheck.hasBalance).toBe(true);

      // Step 4: Send transaction
      const transactionResult = await TransactionService.sendTip({
        senderFid,
        recipientFid,
        senderAddress: senderWallet.address,
        recipientAddress: recipientWallet.address,
        amount,
        token: 'ETH',
      });

      expect(transactionResult.transactionId).toBe('tx123');
      expect(transactionResult.status).toBe('pending');
      expect(transactionResult.platformFee).toBe('0.0005');
      expect(transactionResult.recipientAmount).toBe('0.0495');

      // Step 5: Create notifications
      const notifications = await NotificationService.createTransactionNotifications(
        transactionResult.transactionId,
        senderFid,
        recipientFid,
        amount,
        transactionResult.txHash!
      );

      expect(notifications.senderNotification).toBeDefined();
      expect(notifications.recipientNotification).toBeDefined();

      // Verify all mocks were called correctly
      expect(mockFarcasterWalletService.getWalletInfo).toHaveBeenCalledTimes(2);
      expect(mockFarcasterWalletService.checkSufficientBalance).toHaveBeenCalledWith(
        senderFid,
        expect.any(BigInt)
      );
      expect(mockTransactionModel.create).toHaveBeenCalledWith({
        senderFid,
        recipientFid,
        amount,
        platformFee: '0.0005',
        recipientAmount: '0.0495',
        token: 'ETH',
        txHash: expect.any(String),
        feeTxHash: expect.any(String),
      });
    });

    it('should handle insufficient balance gracefully', async () => {
      const senderFid = '12345';
      const recipientFid = '67890';
      const amount = '0.05';

      // Mock insufficient balance
      mockFarcasterWalletService.checkSufficientBalance.mockResolvedValue({
        hasBalance: false,
        currentBalance: '0.01',
      });

      const balanceCheck = await FarcasterWalletService.checkSufficientBalance(
        senderFid,
        BigInt(Math.floor(parseFloat(amount) * 1e18))
      );

      expect(balanceCheck.hasBalance).toBe(false);
      expect(balanceCheck.currentBalance).toBe('0.01');

      // Transaction should not be created
      expect(mockTransactionModel.create).not.toHaveBeenCalled();
    });

    it('should handle wallet not connected', async () => {
      const senderFid = '12345';

      // Mock wallet not connected
      mockFarcasterWalletService.getWalletInfo.mockResolvedValue(null);

      const walletInfo = await FarcasterWalletService.getWalletInfo(senderFid);
      expect(walletInfo).toBeNull();

      // Transaction should not proceed
      expect(mockTransactionModel.create).not.toHaveBeenCalled();
    });
  });

  describe('Transaction Status Updates', () => {
    it('should update transaction status from pending to confirmed', async () => {
      const transactionId = 'tx123';
      const mockTransaction = {
        id: transactionId,
        txHash: '0xabc123',
        status: 'pending',
        senderFid: '12345',
        recipientFid: '67890',
        amount: '0.05',
      };

      mockTransactionModel.findById.mockResolvedValue(mockTransaction as any);
      mockTransactionModel.updateStatus.mockResolvedValue({
        ...mockTransaction,
        status: 'confirmed',
        confirmedAt: new Date(),
      } as any);

      // Mock blockchain confirmation
      jest.spyOn(TransactionService, 'getTransactionStatus').mockResolvedValue({
        status: 'confirmed',
        blockNumber: 12345,
        gasUsed: '21000',
      });

      const updatedStatus = await TransactionService.updateTransactionStatus(transactionId);
      
      expect(updatedStatus).toBe('confirmed');
      expect(mockTransactionModel.updateStatus).toHaveBeenCalledWith(
        transactionId,
        'confirmed',
        expect.any(Date)
      );
    });
  });

  describe('Error Handling', () => {
    it('should handle transaction service errors', async () => {
      const senderFid = '12345';
      const recipientFid = '67890';
      const amount = '0.05';

      // Mock wallet info
      mockFarcasterWalletService.getWalletInfo.mockResolvedValue({
        address: '0x1234567890123456789012345678901234567890' as `0x${string}`,
        fid: senderFid,
        isConnected: true,
        balance: '1.0000',
      });

      // Mock transaction creation failure
      mockTransactionModel.create.mockRejectedValue(new Error('Database error'));

      await expect(TransactionService.sendTip({
        senderFid,
        recipientFid,
        senderAddress: '0x1234567890123456789012345678901234567890' as `0x${string}`,
        recipientAddress: '0x0987654321098765432109876543210987654321' as `0x${string}`,
        amount,
        token: 'ETH',
      })).rejects.toThrow('Transaction failed');
    });

    it('should handle notification service errors', async () => {
      const transactionId = 'tx123';
      const senderFid = '12345';
      const recipientFid = '67890';
      const amount = '0.05';
      const txHash = '0xabc123';

      // Mock notification creation failure
      jest.spyOn(NotificationService, 'createTransactionNotifications')
        .mockRejectedValue(new Error('Notification service error'));

      await expect(NotificationService.createTransactionNotifications(
        transactionId,
        senderFid,
        recipientFid,
        amount,
        txHash
      )).rejects.toThrow('Failed to create transaction notifications');
    });
  });

  describe('Fee Calculation Integration', () => {
    it('should correctly calculate and apply platform fees', async () => {
      const amount = '0.1'; // 0.1 ETH
      const expectedFee = '0.02'; // 20% of 0.1 ETH
      const expectedRecipientAmount = '0.08'; // 0.1 - 0.02

      const feeCalculation = TransactionService.calculateFee(amount);

      expect(feeCalculation.originalAmount).toBe(amount);
      expect(feeCalculation.platformFee).toBe(expectedFee);
      expect(feeCalculation.recipientAmount).toBe(expectedRecipientAmount);
      expect(feeCalculation.feePercentage).toBe(20);
    });

    it('should handle small amounts correctly', async () => {
      const amount = '0.001'; // Minimum amount
      const feeCalculation = TransactionService.calculateFee(amount);

      expect(parseFloat(feeCalculation.platformFee)).toBeGreaterThan(0);
      expect(parseFloat(feeCalculation.recipientAmount)).toBeLessThan(parseFloat(amount));
      expect(
        parseFloat(feeCalculation.platformFee) + parseFloat(feeCalculation.recipientAmount)
      ).toBeCloseTo(parseFloat(amount), 8);
    });
  });
});