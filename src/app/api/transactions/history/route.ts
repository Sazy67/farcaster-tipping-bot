import { NextRequest, NextResponse } from 'next/server';
import { TransactionService } from '@/lib/services/transaction';
import { ErrorResponse } from '@/types';
import { z } from 'zod';

// Query parameters validation schema
const historyQuerySchema = z.object({
  userFid: z.string().min(1),
  limit: z.string().optional().transform(val => val ? parseInt(val) : 50),
  offset: z.string().optional().transform(val => val ? parseInt(val) : 0),
  type: z.enum(['sent', 'received', 'all']).optional().default('all'),
});

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
    // Validate query parameters
    const validationResult = historyQuerySchema.safeParse({
      userFid: searchParams.get('userFid'),
      limit: searchParams.get('limit'),
      offset: searchParams.get('offset'),
      type: searchParams.get('type'),
    });

    if (!validationResult.success) {
      return NextResponse.json(
        {
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid query parameters',
            details: validationResult.error.issues,
          },
          timestamp: new Date().toISOString(),
          requestId: crypto.randomUUID(),
        } as ErrorResponse,
        { status: 400 }
      );
    }

    const { userFid, limit, offset, type } = validationResult.data;

    // Mock transaction history data
    const mockTransactions = [
      {
        id: '1',
        senderFid: userFid,
        recipientFid: '5650',
        amount: '0.001',
        platformFee: '0.0002',
        recipientAmount: '0.0008',
        token: 'ETH',
        txHash: '0xabc123...',
        feeTxHash: '0xfee123...',
        status: 'completed',
        createdAt: new Date().toISOString(),
        confirmedAt: new Date().toISOString(),
        direction: 'sent',
        counterparty: 'vitalik',
      },
      {
        id: '2',
        senderFid: '3',
        recipientFid: userFid,
        amount: '0.005',
        platformFee: '0.001',
        recipientAmount: '0.004',
        token: 'ETH',
        txHash: '0xdef456...',
        feeTxHash: '0xfee456...',
        status: 'completed',
        createdAt: new Date(Date.now() - 86400000).toISOString(),
        confirmedAt: new Date(Date.now() - 86400000).toISOString(),
        direction: 'received',
        counterparty: 'dwr',
      },
    ];

    // Filter by type if specified
    let filteredTransactions = mockTransactions;
    if (type === 'sent') {
      filteredTransactions = mockTransactions.filter(tx => tx.direction === 'sent');
    } else if (type === 'received') {
      filteredTransactions = mockTransactions.filter(tx => tx.direction === 'received');
    }

    const formattedTransactions = filteredTransactions;

    return NextResponse.json({
      transactions: formattedTransactions,
      pagination: {
        limit,
        offset,
        total: formattedTransactions.length,
        hasMore: formattedTransactions.length === limit,
      },
    });

  } catch (error) {
    console.error('Transaction history API error:', error);
    
    return NextResponse.json(
      {
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to get transaction history',
        },
        timestamp: new Date().toISOString(),
        requestId: crypto.randomUUID(),
      } as ErrorResponse,
      { status: 500 }
    );
  }
}