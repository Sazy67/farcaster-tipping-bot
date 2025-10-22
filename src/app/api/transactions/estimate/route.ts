import { NextRequest, NextResponse } from 'next/server';
import { TransactionService } from '@/lib/services/transaction';
import { FarcasterWalletService } from '@/lib/farcaster/wallet';
import { ErrorResponse } from '@/types';
import { z } from 'zod';

// Validation schema for estimation request
const estimateSchema = z.object({
  senderFid: z.string().min(1),
  recipientFid: z.string().min(1),
  amount: z.string().regex(/^\d+(\.\d+)?$/, 'Invalid amount format'),
  token: z.enum(['ETH', 'USDC']),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate request body
    const validationResult = estimateSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        {
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid request data',
            details: validationResult.error.issues,
          },
          timestamp: new Date().toISOString(),
          requestId: crypto.randomUUID(),
        } as ErrorResponse,
        { status: 400 }
      );
    }

    const { senderFid, recipientFid, amount, token } = validationResult.data;

    // Get sender wallet info
    const senderWallet = await FarcasterWalletService.getWalletInfo(senderFid);
    if (!senderWallet || !senderWallet.isConnected) {
      return NextResponse.json(
        {
          error: {
            code: 'WALLET_NOT_CONNECTED',
            message: 'Sender wallet not connected',
          },
          timestamp: new Date().toISOString(),
          requestId: crypto.randomUUID(),
        } as ErrorResponse,
        { status: 400 }
      );
    }

    // Get recipient wallet info
    const recipientWallet = await FarcasterWalletService.getWalletInfo(recipientFid);
    if (!recipientWallet || !recipientWallet.isConnected) {
      return NextResponse.json(
        {
          error: {
            code: 'RECIPIENT_WALLET_NOT_FOUND',
            message: 'Recipient wallet not found',
          },
          timestamp: new Date().toISOString(),
          requestId: crypto.randomUUID(),
        } as ErrorResponse,
        { status: 400 }
      );
    }

    // Calculate fee breakdown
    const feeCalculation = TransactionService.calculateFee(amount);

    // Estimate transaction costs
    const costEstimate = await TransactionService.estimateTransactionCost({
      senderFid,
      recipientFid,
      senderAddress: senderWallet.address,
      recipientAddress: recipientWallet.address,
      amount,
      token,
    });

    // Check if sender has sufficient balance
    const balanceCheck = await FarcasterWalletService.checkSufficientBalance(
      senderFid,
      BigInt(Math.floor(parseFloat(costEstimate.totalCost) * 1e18))
    );

    return NextResponse.json({
      amount: feeCalculation.originalAmount,
      platformFee: feeCalculation.platformFee,
      recipientAmount: feeCalculation.recipientAmount,
      feePercentage: feeCalculation.feePercentage,
      gasEstimate: costEstimate.gasEstimate,
      gasCost: costEstimate.gasCost,
      totalCost: costEstimate.totalCost,
      senderBalance: balanceCheck.currentBalance,
      hasSufficientBalance: balanceCheck.hasBalance,
      token,
    });

  } catch (error) {
    console.error('Transaction estimate API error:', error);
    
    return NextResponse.json(
      {
        error: {
          code: 'ESTIMATION_FAILED',
          message: error instanceof Error ? error.message : 'Failed to estimate transaction',
        },
        timestamp: new Date().toISOString(),
        requestId: crypto.randomUUID(),
      } as ErrorResponse,
      { status: 500 }
    );
  }
}