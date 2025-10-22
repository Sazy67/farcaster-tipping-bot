import { TransactionModel } from '../transaction';
import { prisma } from '../../db';
import { Decimal } from '@prisma/client/runtime/library';

// Mock Prisma
jest.mock('../../db', () => ({
  prisma: {
    transaction: {
      create: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      findMany: jest.fn(),
    },
  },
}));

const mockPrisma = prisma as jest.Mocked<typeof prisma>;

describe('TransactionModel', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create a new transaction', async () => {
      const transactionData = {
        senderFid: '12345',
        recipientFid: '67890',
        amount: '0.1',
        platformFee: '0.001',
        recipientAmount: '0.099',
        token: 'ETH' as const,
        txHash: '0xabc123',
      };

      const mockCreatedTransaction = {
        id: 'tx1',
        senderFid: '12345',
        recipientFid: '67890',
        amount: new Decimal('0.1'),
        platformFee: new Decimal('0.001'),
        recipientAmount: new Decimal('0.099'),
        token: 'ETH',
        txHash: '0xabc123',
        feeTxHash: null,
        status: 'pending',
        createdAt: new Date(),
        confirmedAt: null,
      };

      mockPrisma.transaction.create.mockResolvedValue(mockCreatedTransaction);

      const result = await TransactionModel.create(transactionData);

      expect(mockPrisma.transaction.create).toHaveBeenCalledWith({
        data: {
          senderFid: '12345',
          recipientFid: '67890',
          amount: new Decimal('0.1'),
          platformFee: new Decimal('0.001'),
          recipientAmount: new Decimal('0.099'),
          token: 'ETH',
          txHash: '0xabc123',
          feeTxHash: undefined,
          status: 'pending',
        },
      });

      expect(result).toEqual({
        ...mockCreatedTransaction,
        amount: '0.1',
        platformFee: '0.001',
        recipientAmount: '0.099',
      });
    });
  });

  describe('findById', () => {
    it('should find transaction by id', async () => {
      const mockTransaction = {
        id: 'tx1',
        senderFid: '12345',
        recipientFid: '67890',
        amount: new Decimal('0.1'),
        platformFee: new Decimal('0.001'),
        recipientAmount: new Decimal('0.099'),
        token: 'ETH',
        txHash: '0xabc123',
        feeTxHash: null,
        status: 'confirmed',
        createdAt: new Date(),
        confirmedAt: new Date(),
      };

      mockPrisma.transaction.findUnique.mockResolvedValue(mockTransaction);

      const result = await TransactionModel.findById('tx1');

      expect(mockPrisma.transaction.findUnique).toHaveBeenCalledWith({
        where: { id: 'tx1' },
      });

      expect(result).toEqual({
        ...mockTransaction,
        amount: '0.1',
        platformFee: '0.001',
        recipientAmount: '0.099',
      });
    });

    it('should return null if transaction not found', async () => {
      mockPrisma.transaction.findUnique.mockResolvedValue(null);

      const result = await TransactionModel.findById('nonexistent');

      expect(result).toBeNull();
    });
  });

  describe('updateStatus', () => {
    it('should update transaction status to confirmed', async () => {
      const confirmedAt = new Date();
      const mockUpdatedTransaction = {
        id: 'tx1',
        senderFid: '12345',
        recipientFid: '67890',
        amount: new Decimal('0.1'),
        platformFee: new Decimal('0.001'),
        recipientAmount: new Decimal('0.099'),
        token: 'ETH',
        txHash: '0xabc123',
        feeTxHash: null,
        status: 'confirmed',
        createdAt: new Date(),
        confirmedAt,
      };

      mockPrisma.transaction.update.mockResolvedValue(mockUpdatedTransaction);

      const result = await TransactionModel.updateStatus('tx1', 'confirmed', confirmedAt);

      expect(mockPrisma.transaction.update).toHaveBeenCalledWith({
        where: { id: 'tx1' },
        data: {
          status: 'confirmed',
          confirmedAt,
        },
      });

      expect(result.status).toBe('confirmed');
      expect(result.confirmedAt).toEqual(confirmedAt);
    });

    it('should update transaction status to failed without confirmedAt', async () => {
      const mockUpdatedTransaction = {
        id: 'tx1',
        senderFid: '12345',
        recipientFid: '67890',
        amount: new Decimal('0.1'),
        platformFee: new Decimal('0.001'),
        recipientAmount: new Decimal('0.099'),
        token: 'ETH',
        txHash: '0xabc123',
        feeTxHash: null,
        status: 'failed',
        createdAt: new Date(),
        confirmedAt: null,
      };

      mockPrisma.transaction.update.mockResolvedValue(mockUpdatedTransaction);

      const result = await TransactionModel.updateStatus('tx1', 'failed');

      expect(mockPrisma.transaction.update).toHaveBeenCalledWith({
        where: { id: 'tx1' },
        data: {
          status: 'failed',
          confirmedAt: undefined,
        },
      });

      expect(result.status).toBe('failed');
    });
  });

  describe('getTransactionHistory', () => {
    it('should get transaction history for user', async () => {
      const mockTransactions = [
        {
          id: 'tx1',
          senderFid: '12345',
          recipientFid: '67890',
          amount: new Decimal('0.1'),
          platformFee: new Decimal('0.001'),
          recipientAmount: new Decimal('0.099'),
          token: 'ETH',
          txHash: '0xabc123',
          feeTxHash: null,
          status: 'confirmed',
          createdAt: new Date(),
          confirmedAt: new Date(),
        },
      ];

      mockPrisma.transaction.findMany.mockResolvedValue(mockTransactions);

      const result = await TransactionModel.getTransactionHistory('12345', 10, 0);

      expect(mockPrisma.transaction.findMany).toHaveBeenCalledWith({
        where: {
          OR: [
            { senderFid: '12345' },
            { recipientFid: '12345' },
          ],
        },
        orderBy: { createdAt: 'desc' },
        take: 10,
        skip: 0,
      });

      expect(result).toHaveLength(1);
      expect(result[0].amount).toBe('0.1');
    });
  });

  describe('getTransactionsByStatus', () => {
    it('should get transactions by status', async () => {
      const mockTransactions = [
        {
          id: 'tx1',
          senderFid: '12345',
          recipientFid: '67890',
          amount: new Decimal('0.1'),
          platformFee: new Decimal('0.001'),
          recipientAmount: new Decimal('0.099'),
          token: 'ETH',
          txHash: '0xabc123',
          feeTxHash: null,
          status: 'pending',
          createdAt: new Date(),
          confirmedAt: null,
        },
      ];

      mockPrisma.transaction.findMany.mockResolvedValue(mockTransactions);

      const result = await TransactionModel.getTransactionsByStatus('pending');

      expect(mockPrisma.transaction.findMany).toHaveBeenCalledWith({
        where: { status: 'pending' },
        orderBy: { createdAt: 'desc' },
      });

      expect(result).toHaveLength(1);
      expect(result[0].status).toBe('pending');
    });
  });
});