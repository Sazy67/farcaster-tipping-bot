import { 
  publicClient, 
  createWalletClientForAddress, 
  estimateGasForTransfer, 
  getCurrentGasPrice, 
  checkBalance,
  parseEthAmount,
  formatEthAmount 
} from '../blockchain/config';
import { TransactionModel } from '../models/transaction';
import { FeeCalculation, TransactionStatus } from '@/types';
import { config } from '../config';

export interface TipParams {
  senderFid: string;
  recipientFid: string;
  senderAddress: `0x${string}`;
  recipientAddress: `0x${string}`;
  amount: string;
  token: 'ETH' | 'USDC';
}

export interface TransactionResult {
  transactionId: string;
  txHash: string;
  feeTxHash?: string;
  status: TransactionStatus;
  platformFee: string;
  recipientAmount: string;
  gasUsed?: string;
}

export class TransactionService {
  /**
   * Calculate platform fee for a tip amount
   */
  static calculateFee(amount: string): FeeCalculation {
    const originalAmount = parseFloat(amount);
    const feePercentage = config.platform.feePercentage;
    const platformFee = originalAmount * (feePercentage / 100);
    const recipientAmount = originalAmount - platformFee;

    return {
      originalAmount: amount,
      platformFee: platformFee.toFixed(8),
      recipientAmount: recipientAmount.toFixed(8),
      feePercentage,
    };
  }

  /**
   * Validate transaction parameters
   */
  static async validateTransaction(params: TipParams): Promise<{
    isValid: boolean;
    error?: string;
  }> {
    try {
      // Check if amount is within limits
      const amount = parseFloat(params.amount);
      const maxAmount = parseFloat(config.platform.maxTipAmount);
      
      if (amount <= 0) {
        return { isValid: false, error: 'Amount must be greater than 0' };
      }
      
      if (amount > maxAmount) {
        return { isValid: false, error: `Amount exceeds maximum limit of ${maxAmount} ETH` };
      }

      // Check sender balance
      const amountBigInt = parseEthAmount(params.amount);
      const gasEstimate = await estimateGasForTransfer(
        params.senderAddress,
        params.recipientAddress,
        amountBigInt
      );
      const gasPrice = await getCurrentGasPrice();
      const gasCost = gasEstimate * gasPrice;
      const totalRequired = amountBigInt + gasCost;

      const balanceCheck = await checkBalance(params.senderAddress, totalRequired);
      
      if (!balanceCheck.hasBalance) {
        const currentBalance = formatEthAmount(balanceCheck.currentBalance);
        const requiredAmount = formatEthAmount(totalRequired);
        return { 
          isValid: false, 
          error: `Insufficient balance. Required: ${requiredAmount} ETH, Available: ${currentBalance} ETH` 
        };
      }

      return { isValid: true };
    } catch (error) {
      console.error('Transaction validation failed:', error);
      return { isValid: false, error: 'Transaction validation failed' };
    }
  }

  /**
   * Send a tip transaction
   */
  static async sendTip(params: TipParams): Promise<TransactionResult> {
    try {
      // Validate transaction
      const validation = await this.validateTransaction(params);
      if (!validation.isValid) {
        throw new Error(validation.error);
      }

      // Calculate fees
      const feeCalculation = this.calculateFee(params.amount);
      
      // Create wallet client for sender
      const walletClient = createWalletClientForAddress(params.senderAddress);
      
      // Send main transaction to recipient
      const recipientAmountBigInt = parseEthAmount(feeCalculation.recipientAmount);
      
      const txHash = await walletClient.sendTransaction({
        to: params.recipientAddress,
        value: recipientAmountBigInt,
      });

      // Send platform fee transaction
      let feeTxHash: string | undefined;
      try {
        const platformFeeAmountBigInt = parseEthAmount(feeCalculation.platformFee);
        if (platformFeeAmountBigInt > BigInt(0) && config.platform.walletAddress) {
          feeTxHash = await walletClient.sendTransaction({
            to: config.platform.walletAddress as `0x${string}`,
            value: platformFeeAmountBigInt,
          });
        }
      } catch (feeError) {
        console.error('Platform fee transaction failed:', feeError);
        // Continue with main transaction even if fee fails
      }

      // Save transaction to database
      const transaction = await TransactionModel.create({
        senderFid: params.senderFid,
        recipientFid: params.recipientFid,
        amount: params.amount,
        platformFee: feeCalculation.platformFee,
        recipientAmount: feeCalculation.recipientAmount,
        token: params.token,
        txHash,
        feeTxHash,
      });

      return {
        transactionId: transaction.id,
        txHash,
        feeTxHash,
        status: 'pending',
        platformFee: feeCalculation.platformFee,
        recipientAmount: feeCalculation.recipientAmount,
      };
    } catch (error) {
      console.error('Failed to send tip:', error);
      throw new Error(`Transaction failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get transaction status from blockchain
   */
  static async getTransactionStatus(txHash: string): Promise<{
    status: TransactionStatus;
    blockNumber?: number;
    gasUsed?: string;
  }> {
    try {
      const receipt = await publicClient.getTransactionReceipt({ hash: txHash as `0x${string}` });
      
      if (receipt) {
        return {
          status: receipt.status === 'success' ? 'confirmed' : 'failed',
          blockNumber: Number(receipt.blockNumber),
          gasUsed: receipt.gasUsed.toString(),
        };
      }

      // Transaction not yet mined
      return { status: 'pending' };
    } catch (error) {
      console.error('Failed to get transaction status:', error);
      return { status: 'pending' };
    }
  }

  /**
   * Monitor and update transaction status
   */
  static async updateTransactionStatus(transactionId: string): Promise<TransactionStatus> {
    try {
      const transaction = await TransactionModel.findById(transactionId);
      if (!transaction) {
        throw new Error('Transaction not found');
      }

      if (transaction.status === 'confirmed' || transaction.status === 'failed') {
        return transaction.status;
      }

      const statusInfo = await this.getTransactionStatus(transaction.txHash);
      
      if (statusInfo.status !== 'pending') {
        await TransactionModel.updateStatus(
          transactionId, 
          statusInfo.status,
          statusInfo.status === 'confirmed' ? new Date() : undefined
        );
      }

      return statusInfo.status;
    } catch (error) {
      console.error('Failed to update transaction status:', error);
      return 'pending';
    }
  }

  /**
   * Process platform fee for a transaction
   */
  static async processPlatformFee(
    senderAddress: `0x${string}`,
    amount: string
  ): Promise<{ success: boolean; txHash?: string; error?: string }> {
    try {
      if (!config.platform.walletAddress) {
        return { success: false, error: 'Platform wallet not configured' };
      }

      const feeCalculation = this.calculateFee(amount);
      const platformFeeAmountBigInt = parseEthAmount(feeCalculation.platformFee);
      
      if (platformFeeAmountBigInt === BigInt(0)) {
        return { success: true }; // No fee to process
      }

      const walletClient = createWalletClientForAddress(senderAddress);
      
      const txHash = await walletClient.sendTransaction({
        to: config.platform.walletAddress as `0x${string}`,
        value: platformFeeAmountBigInt,
      });

      return { success: true, txHash };
    } catch (error) {
      console.error('Platform fee processing failed:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }

  /**
   * Estimate gas cost for a tip transaction
   */
  static async estimateTransactionCost(params: TipParams): Promise<{
    gasEstimate: string;
    gasCost: string;
    totalCost: string;
  }> {
    try {
      const amountBigInt = parseEthAmount(params.amount);
      const gasEstimate = await estimateGasForTransfer(
        params.senderAddress,
        params.recipientAddress,
        amountBigInt
      );
      const gasPrice = await getCurrentGasPrice();
      const gasCost = gasEstimate * gasPrice;
      const totalCost = amountBigInt + gasCost;

      return {
        gasEstimate: gasEstimate.toString(),
        gasCost: formatEthAmount(gasCost),
        totalCost: formatEthAmount(totalCost),
      };
    } catch (error) {
      console.error('Failed to estimate transaction cost:', error);
      throw new Error('Failed to estimate transaction cost');
    }
  }

  /**
   * Get transaction history for a user
   */
  static async getTransactionHistory(
    userFid: string,
    limit: number = 50,
    offset: number = 0
  ) {
    try {
      return await TransactionModel.getTransactionHistory(userFid, limit, offset);
    } catch (error) {
      console.error('Failed to get transaction history:', error);
      throw new Error('Failed to get transaction history');
    }
  }
}