import { prisma } from '../db';
import { Transaction, TransactionStatus } from '@/types';
import { Decimal } from '@prisma/client/runtime/library';

export class TransactionModel {
  static async create(data: {
    senderFid: string;
    recipientFid: string;
    amount: string;
    platformFee: string;
    recipientAmount: string;
    token: 'ETH' | 'USDC';
    txHash: string;
    feeTxHash?: string;
  }): Promise<Transaction> {
    const transaction = await prisma.transaction.create({
      data: {
        senderFid: data.senderFid,
        recipientFid: data.recipientFid,
        amount: new Decimal(data.amount),
        platformFee: new Decimal(data.platformFee),
        recipientAmount: new Decimal(data.recipientAmount),
        token: data.token,
        txHash: data.txHash,
        feeTxHash: data.feeTxHash,
        status: 'pending',
      },
    });
    
    return {
      ...transaction,
      amount: transaction.amount.toString(),
      platformFee: transaction.platformFee.toString(),
      recipientAmount: transaction.recipientAmount.toString(),
      feeTxHash: transaction.feeTxHash || undefined,
      confirmedAt: transaction.confirmedAt || undefined,
    };
  }

  static async findById(id: string): Promise<Transaction | null> {
    const transaction = await prisma.transaction.findUnique({
      where: { id },
    });
    
    if (!transaction) return null;
    
    return {
      ...transaction,
      amount: transaction.amount.toString(),
      platformFee: transaction.platformFee.toString(),
      recipientAmount: transaction.recipientAmount.toString(),
      feeTxHash: transaction.feeTxHash || undefined,
      confirmedAt: transaction.confirmedAt || undefined,
    };
  }

  static async findByTxHash(txHash: string): Promise<Transaction | null> {
    const transaction = await prisma.transaction.findUnique({
      where: { txHash },
    });
    
    if (!transaction) return null;
    
    return {
      ...transaction,
      amount: transaction.amount.toString(),
      platformFee: transaction.platformFee.toString(),
      recipientAmount: transaction.recipientAmount.toString(),
      feeTxHash: transaction.feeTxHash || undefined,
      confirmedAt: transaction.confirmedAt || undefined,
    };
  }

  static async updateStatus(
    id: string, 
    status: TransactionStatus, 
    confirmedAt?: Date
  ): Promise<Transaction> {
    const transaction = await prisma.transaction.update({
      where: { id },
      data: { 
        status,
        confirmedAt: status === 'confirmed' ? confirmedAt || new Date() : undefined,
      },
    });
    
    return {
      ...transaction,
      amount: transaction.amount.toString(),
      platformFee: transaction.platformFee.toString(),
      recipientAmount: transaction.recipientAmount.toString(),
      feeTxHash: transaction.feeTxHash || undefined,
      confirmedAt: transaction.confirmedAt || undefined,
    };
  }

  static async getTransactionHistory(
    userFid: string,
    limit: number = 50,
    offset: number = 0
  ): Promise<Transaction[]> {
    const transactions = await prisma.transaction.findMany({
      where: {
        OR: [
          { senderFid: userFid },
          { recipientFid: userFid },
        ],
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: offset,
    });
    
    return transactions.map((transaction: any) => ({
      ...transaction,
      amount: transaction.amount.toString(),
      platformFee: transaction.platformFee.toString(),
      recipientAmount: transaction.recipientAmount.toString(),
      feeTxHash: transaction.feeTxHash || undefined,
      confirmedAt: transaction.confirmedAt || undefined,
    }));
  }

  static async getTransactionsByStatus(status: TransactionStatus): Promise<Transaction[]> {
    const transactions = await prisma.transaction.findMany({
      where: { status },
      orderBy: { createdAt: 'desc' },
    });
    
    return transactions.map((transaction: any) => ({
      ...transaction,
      amount: transaction.amount.toString(),
      platformFee: transaction.platformFee.toString(),
      recipientAmount: transaction.recipientAmount.toString(),
      feeTxHash: transaction.feeTxHash || undefined,
      confirmedAt: transaction.confirmedAt || undefined,
    }));
  }

  static async updateFeeTxHash(id: string, feeTxHash: string): Promise<Transaction> {
    const transaction = await prisma.transaction.update({
      where: { id },
      data: { feeTxHash },
    });
    
    return {
      ...transaction,
      amount: transaction.amount.toString(),
      platformFee: transaction.platformFee.toString(),
      recipientAmount: transaction.recipientAmount.toString(),
      feeTxHash: transaction.feeTxHash || undefined,
      confirmedAt: transaction.confirmedAt || undefined,
    };
  }
}