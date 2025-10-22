// User Types
export interface User {
  id: string;
  fid: string;
  walletAddress?: string;
  createdAt: Date;
  updatedAt: Date;
  notificationEnabled: boolean;
}

// Transaction Types
export interface Transaction {
  id: string;
  senderFid: string;
  recipientFid: string;
  amount: string;
  platformFee: string;
  recipientAmount: string;
  token: 'ETH' | 'USDC';
  txHash: string;
  feeTxHash?: string;
  status: TransactionStatus;
  createdAt: Date;
  confirmedAt?: Date;
}

export type TransactionStatus = 'pending' | 'confirmed' | 'failed';

// Notification Types
export interface Notification {
  id: string;
  userFid: string;
  transactionId: string;
  type: 'tip_received' | 'tip_sent';
  delivered: boolean;
  createdAt: Date;
}

// API Types
export interface TransactionRequest {
  senderFid: string;
  recipientFid: string;
  amount: string;
  token: 'ETH' | 'USDC';
  signature: string;
}

export interface TransactionResponse {
  transactionId: string;
  status: TransactionStatus;
  txHash?: string;
  estimatedConfirmation: number;
  platformFee: string;
  recipientAmount: string;
}

// Frame Types
export interface FrameActionRequest {
  trustedData: {
    messageBytes: string;
  };
  untrustedData: {
    fid: number;
    buttonIndex: number;
    inputText?: string;
  };
}

export interface TippingFrameProps {
  recipientFid: string;
  postHash: string;
  predefinedAmounts: number[];
}

// Fee Calculation
export interface FeeCalculation {
  originalAmount: string;
  platformFee: string;
  recipientAmount: string;
  feePercentage: number;
}

// Error Types
export interface ErrorResponse {
  error: {
    code: string;
    message: string;
    details?: any;
  };
  timestamp: string;
  requestId: string;
}