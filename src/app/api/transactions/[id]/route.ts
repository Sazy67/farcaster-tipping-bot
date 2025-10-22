import { NextRequest, NextResponse } from 'next/server';
import { TransactionService } from '@/lib/services/transaction';
import { TransactionModel } from '@/lib/models/transaction';
import { ErrorResponse } from '@/types';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    if (!id) {
      return NextResponse.json(
        {
          error: {
            code: 'MISSING_TRANSACTION_ID',
            message: 'Transaction ID is required',
          },
          timestamp: new Date().toISOString(),
          requestId: crypto.randomUUID(),
        } as ErrorResponse,
        { status: 400 }
      );
    }

    // Get transaction from database
    const transaction = await TransactionModel.findById(id);
    if (!transaction) {
      return NextResponse.json(
        {
          error: {
            code: 'TRANSACTION_NOT_FOUND',
            message: 'Transaction not found',
          },
          timestamp: new Date().toISOString(),
          requestId: crypto.randomUUID(),
        } as ErrorResponse,
        { status: 404 }
      );
    }

    // Update transaction status if pending
    let currentStatus = transaction.status;
    if (transaction.status === 'pending') {
      currentStatus = await TransactionService.updateTransactionStatus(id);
    }

    // Get blockchain status for additional info
    let blockchainInfo = {};
    try {
      const statusInfo = await TransactionService.getTransactionStatus(transaction.txHash);
      blockchainInfo = {
        blockNumber: statusInfo.blockNumber,
        gasUsed: statusInfo.gasUsed,
      };
    } catch (error) {
      console.error('Failed to get blockchain info:', error);
    }

    return NextResponse.json({
      id: transaction.id,
      senderFid: transaction.senderFid,
      recipientFid: transaction.recipientFid,
      amount: transaction.amount,
      platformFee: transaction.platformFee,
      recipientAmount: transaction.recipientAmount,
      token: transaction.token,
      txHash: transaction.txHash,
      feeTxHash: transaction.feeTxHash,
      status: currentStatus,
      createdAt: transaction.createdAt,
      confirmedAt: transaction.confirmedAt,
      ...blockchainInfo,
    });

  } catch (error) {
    console.error('Get transaction API error:', error);
    
    return NextResponse.json(
      {
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to get transaction',
        },
        timestamp: new Date().toISOString(),
        requestId: crypto.randomUUID(),
      } as ErrorResponse,
      { status: 500 }
    );
  }
}