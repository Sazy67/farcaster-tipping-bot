import { NextRequest, NextResponse } from 'next/server';
import { FrameValidator } from '@/lib/frames/validation';
import { FrameStateManager, TippingFrameState } from '@/lib/frames/state';
import { FrameErrorHandler } from '@/lib/frames/error-handler';
import { TippingFrame } from '@/components/frames/TippingFrame';
import { TransactionService } from '@/lib/services/transaction';
import { FarcasterWalletService } from '@/lib/farcaster/wallet';
import { FrameActionRequest } from '@/types';

const PREDEFINED_AMOUNTS = [0.001, 0.005, 0.01, 0.05];
const BASE_URL = process.env.NEXTAUTH_URL || 'http://localhost:3000';

export async function POST(request: NextRequest) {
  try {
    const body: FrameActionRequest = await request.json();
    const { trustedData, untrustedData } = body;

    // Validate frame action
    const validation = await FrameValidator.validateFrameAction(trustedData, {
      ...untrustedData,
      url: request.url
    });
    
    if (!validation.isValid) {
      const error = FrameErrorHandler.getError('INVALID_SIGNATURE');
      const errorFrame = FrameErrorHandler.createErrorFrame(error, BASE_URL);
      return new NextResponse(TippingFrame.generateFrame({
        recipientFid: 'unknown',
        predefinedAmounts: PREDEFINED_AMOUNTS,
        baseUrl: BASE_URL,
      }), {
        headers: { 'Content-Type': 'text/html' },
      });
    }

    // Rate limiting check
    const rateLimitCheck = await FrameValidator.checkRateLimit(validation.fid!);
    if (!rateLimitCheck.allowed) {
      const error = FrameErrorHandler.getError('RATE_LIMITED');
      const errorFrame = FrameErrorHandler.createErrorFrame(error, BASE_URL);
      return new NextResponse(TippingFrame.generateFrame({
        recipientFid: 'unknown',
        predefinedAmounts: PREDEFINED_AMOUNTS,
        baseUrl: BASE_URL,
      }), {
        headers: { 'Content-Type': 'text/html' },
      });
    }

    // Extract context from URL or state
    const url = new URL(request.url);
    const recipientFid = url.searchParams.get('recipient') || 'unknown';
    const senderFid = validation.fid!.toString();

    // Generate or get state key
    let stateKey = url.searchParams.get('state');
    if (!stateKey) {
      stateKey = FrameStateManager.generateStateKey(senderFid, recipientFid);
    }

    // Get current state
    let currentState = FrameStateManager.getState(stateKey);
    if (!currentState) {
      currentState = {
        state: 'initial',
        senderFid,
        recipientFid,
        timestamp: Date.now(),
      };
      FrameStateManager.setState(stateKey, currentState);
    }

    // Process button action
    const newState = await processFrameAction(
      currentState,
      validation.buttonIndex!,
      validation.inputText,
      stateKey
    );

    // Generate response frame
    const frameHtml = TippingFrame.generateFrame({
      recipientFid,
      predefinedAmounts: PREDEFINED_AMOUNTS,
      baseUrl: BASE_URL,
      state: newState,
    });

    return new NextResponse(frameHtml, {
      headers: { 'Content-Type': 'text/html' },
    });

  } catch (error) {
    console.error('Frame action error:', error);
    
    const errorCode = FrameErrorHandler.classifyError(error);
    const frameError = FrameErrorHandler.getError(errorCode);
    
    FrameErrorHandler.logError(frameError, {
      timestamp: Date.now(),
      userAgent: request.headers.get('user-agent') || undefined,
    });

    const errorFrame = FrameErrorHandler.createErrorFrame(frameError, BASE_URL);
    const frameHtml = TippingFrame.generateFrame({
      recipientFid: 'unknown',
      predefinedAmounts: PREDEFINED_AMOUNTS,
      baseUrl: BASE_URL,
    });

    return new NextResponse(frameHtml, {
      headers: { 'Content-Type': 'text/html' },
      status: 500,
    });
  }
}

async function processFrameAction(
  currentState: TippingFrameState,
  buttonIndex: number,
  inputText?: string,
  stateKey?: string
): Promise<TippingFrameState> {
  switch (currentState.state) {
    case 'initial':
      return await handleInitialAction(currentState, buttonIndex, inputText, stateKey);
    
    case 'amount_selection':
      return await handleAmountSelection(currentState, buttonIndex, inputText, stateKey);
    
    case 'wallet_check':
      return await handleWalletCheck(currentState, buttonIndex, stateKey);
    
    case 'confirmation':
      return await handleConfirmation(currentState, buttonIndex, stateKey);
    
    case 'processing':
      return await handleProcessing(currentState, buttonIndex, stateKey);
    
    case 'success':
      return await handleSuccess(currentState, buttonIndex, stateKey);
    
    case 'error':
      return await handleError(currentState, buttonIndex, stateKey);
    
    default:
      return currentState;
  }
}

async function handleInitialAction(
  state: TippingFrameState,
  buttonIndex: number,
  inputText?: string,
  stateKey?: string
): Promise<TippingFrameState> {
  let amount: string;

  if (buttonIndex <= 3) {
    // Predefined amount selected
    amount = PREDEFINED_AMOUNTS[buttonIndex - 1].toString();
  } else if (buttonIndex === 4 && inputText) {
    // Custom amount entered
    const validation = FrameValidator.validateTipAmount(inputText);
    if (!validation.isValid) {
      return {
        ...state,
        state: 'error',
        error: validation.error,
      };
    }
    amount = validation.amount!;
  } else {
    return {
      ...state,
      state: 'amount_selection',
    };
  }

  // Calculate fees
  const feeCalculation = TransactionService.calculateFee(amount);

  const newState: TippingFrameState = {
    ...state,
    state: 'wallet_check',
    amount,
    platformFee: feeCalculation.platformFee,
    recipientAmount: feeCalculation.recipientAmount,
  };

  if (stateKey) {
    FrameStateManager.setState(stateKey, newState);
  }

  return newState;
}

async function handleAmountSelection(
  state: TippingFrameState,
  buttonIndex: number,
  inputText?: string,
  stateKey?: string
): Promise<TippingFrameState> {
  return handleInitialAction(state, buttonIndex, inputText, stateKey);
}

async function handleWalletCheck(
  state: TippingFrameState,
  buttonIndex: number,
  stateKey?: string
): Promise<TippingFrameState> {
  if (buttonIndex === 2) {
    // Cancel button
    return {
      ...state,
      state: 'initial',
      amount: undefined,
      platformFee: undefined,
      recipientAmount: undefined,
    };
  }

  // Check wallet connection and balance
  try {
    const senderWallet = await FarcasterWalletService.getWalletInfo(state.senderFid!);
    if (!senderWallet || !senderWallet.isConnected) {
      return {
        ...state,
        state: 'error',
        error: 'Wallet not connected',
      };
    }

    const recipientWallet = await FarcasterWalletService.getWalletInfo(state.recipientFid!);
    if (!recipientWallet || !recipientWallet.isConnected) {
      return {
        ...state,
        state: 'error',
        error: 'Recipient wallet not found',
      };
    }

    // Check balance
    const balanceCheck = await FarcasterWalletService.checkSufficientBalance(
      state.senderFid!,
      BigInt(Math.floor(parseFloat(state.amount!) * 1e18))
    );

    if (!balanceCheck.hasBalance) {
      return {
        ...state,
        state: 'error',
        error: `Insufficient balance. You have ${balanceCheck.currentBalance} ETH`,
      };
    }

    const newState: TippingFrameState = {
      ...state,
      state: 'confirmation',
    };

    if (stateKey) {
      FrameStateManager.setState(stateKey, newState);
    }

    return newState;
  } catch (error) {
    return {
      ...state,
      state: 'error',
      error: 'Wallet check failed',
    };
  }
}

async function handleConfirmation(
  state: TippingFrameState,
  buttonIndex: number,
  stateKey?: string
): Promise<TippingFrameState> {
  if (buttonIndex === 2) {
    // Cancel button
    return {
      ...state,
      state: 'initial',
      amount: undefined,
      platformFee: undefined,
      recipientAmount: undefined,
    };
  }

  // Send transaction
  try {
    const senderWallet = await FarcasterWalletService.getWalletInfo(state.senderFid!);
    const recipientWallet = await FarcasterWalletService.getWalletInfo(state.recipientFid!);

    if (!senderWallet || !recipientWallet) {
      return {
        ...state,
        state: 'error',
        error: 'Wallet information not available',
      };
    }

    const result = await TransactionService.sendTip({
      senderFid: state.senderFid!,
      recipientFid: state.recipientFid!,
      senderAddress: senderWallet.address,
      recipientAddress: recipientWallet.address,
      amount: state.amount!,
      token: 'ETH',
    });

    const newState: TippingFrameState = {
      ...state,
      state: 'processing',
      transactionId: result.transactionId,
      txHash: result.txHash,
    };

    if (stateKey) {
      FrameStateManager.setState(stateKey, newState);
    }

    return newState;
  } catch (error) {
    return {
      ...state,
      state: 'error',
      error: error instanceof Error ? error.message : 'Transaction failed',
    };
  }
}

async function handleProcessing(
  state: TippingFrameState,
  buttonIndex: number,
  stateKey?: string
): Promise<TippingFrameState> {
  if (buttonIndex === 1) {
    // Check status
    try {
      if (state.transactionId) {
        const status = await TransactionService.updateTransactionStatus(state.transactionId);
        
        if (status === 'confirmed') {
          const newState: TippingFrameState = {
            ...state,
            state: 'success',
          };

          if (stateKey) {
            FrameStateManager.setState(stateKey, newState);
          }

          return newState;
        } else if (status === 'failed') {
          return {
            ...state,
            state: 'error',
            error: 'Transaction failed',
          };
        }
      }
    } catch (error) {
      console.error('Status check failed:', error);
    }
  }

  return state; // Stay in processing state
}

async function handleSuccess(
  state: TippingFrameState,
  buttonIndex: number,
  stateKey?: string
): Promise<TippingFrameState> {
  if (buttonIndex === 2) {
    // Send another tip
    const newState: TippingFrameState = {
      state: 'initial',
      senderFid: state.senderFid,
      recipientFid: state.recipientFid,
      timestamp: Date.now(),
    };

    if (stateKey) {
      FrameStateManager.setState(stateKey, newState);
    }

    return newState;
  }

  return state;
}

async function handleError(
  state: TippingFrameState,
  buttonIndex: number,
  stateKey?: string
): Promise<TippingFrameState> {
  // Try again - reset to initial state
  const newState: TippingFrameState = {
    state: 'initial',
    senderFid: state.senderFid,
    recipientFid: state.recipientFid,
    timestamp: Date.now(),
  };

  if (stateKey) {
    FrameStateManager.setState(stateKey, newState);
  }

  return newState;
}