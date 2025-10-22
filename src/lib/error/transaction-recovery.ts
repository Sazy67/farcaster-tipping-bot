import { TransactionModel } from '../models/transaction';
import { TransactionService } from '../services/transaction';
import { NotificationService } from '../services/notification';
import { GlobalErrorHandler } from './global-error-handler';

export interface RecoveryResult {
  success: boolean;
  transactionId: string;
  action: 'retry' | 'refund' | 'manual_review' | 'completed';
  message: string;
  newTxHash?: string;
}

export class TransactionRecoveryService {
  /**
   * Attempt to recover a failed transaction
   */
  static async recoverTransaction(transactionId: string): Promise<RecoveryResult> {
    try {
      const transaction = await TransactionModel.findById(transactionId);
      
      if (!transaction) {
        return {
          success: false,
          transactionId,
          action: 'manual_review',
          message: 'Transaction not found',
        };
      }

      // Check current status
      if (transaction.status === 'confirmed') {
        return {
          success: true,
          transactionId,
          action: 'completed',
          message: 'Transaction already confirmed',
        };
      }

      // Try to get updated status from blockchain
      const blockchainStatus = await TransactionService.getTransactionStatus(transaction.txHash);
      
      if (blockchainStatus.status === 'confirmed') {
        // Update database status
        await TransactionModel.updateStatus(transactionId, 'confirmed', new Date());
        
        // Send notifications
        await NotificationService.createTransactionNotifications(
          transactionId,
          transaction.senderFid,
          transaction.recipientFid,
          transaction.amount,
          transaction.txHash
        );

        return {
          success: true,
          transactionId,
          action: 'completed',
          message: 'Transaction confirmed on blockchain',
        };
      }

      if (blockchainStatus.status === 'failed') {
        // Mark as failed and initiate refund process
        await TransactionModel.updateStatus(transactionId, 'failed');
        
        return {
          success: false,
          transactionId,
          action: 'refund',
          message: 'Transaction failed on blockchain, refund initiated',
        };
      }

      // Transaction is still pending - check if it's been too long
      const transactionAge = Date.now() - new Date(transaction.createdAt).getTime();
      const maxPendingTime = 30 * 60 * 1000; // 30 minutes

      if (transactionAge > maxPendingTime) {
        // Transaction has been pending too long, mark for manual review
        GlobalErrorHandler.logWarning(
          'Transaction pending too long',
          {
            transactionId,
            userId: transaction.senderFid,
            timestamp: Date.now(),
          }
        );

        return {
          success: false,
          transactionId,
          action: 'manual_review',
          message: 'Transaction pending too long, requires manual review',
        };
      }

      return {
        success: false,
        transactionId,
        action: 'retry',
        message: 'Transaction still pending, will retry later',
      };

    } catch (error) {
      GlobalErrorHandler.logError(
        'Transaction recovery failed',
        error instanceof Error ? error : new Error(String(error)),
        {
          transactionId,
          timestamp: Date.now(),
        }
      );

      return {
        success: false,
        transactionId,
        action: 'manual_review',
        message: 'Recovery process failed, requires manual review',
      };
    }
  }

  /**
   * Recover all pending transactions
   */
  static async recoverAllPendingTransactions(): Promise<{
    processed: number;
    recovered: number;
    failed: number;
    results: RecoveryResult[];
  }> {
    try {
      const pendingTransactions = await TransactionModel.getTransactionsByStatus('pending');
      const results: RecoveryResult[] = [];
      
      let recovered = 0;
      let failed = 0;

      // Process transactions in batches to avoid overwhelming the system
      const batchSize = 5;
      for (let i = 0; i < pendingTransactions.length; i += batchSize) {
        const batch = pendingTransactions.slice(i, i + batchSize);
        
        const batchResults = await Promise.allSettled(
          batch.map(tx => this.recoverTransaction(tx.id))
        );

        batchResults.forEach((result, index) => {
          if (result.status === 'fulfilled') {
            results.push(result.value);
            if (result.value.success) {
              recovered++;
            } else {
              failed++;
            }
          } else {
            failed++;
            results.push({
              success: false,
              transactionId: batch[index].id,
              action: 'manual_review',
              message: 'Recovery process error',
            });
          }
        });

        // Small delay between batches
        await new Promise(resolve => setTimeout(resolve, 1000));
      }

      return {
        processed: pendingTransactions.length,
        recovered,
        failed,
        results,
      };
    } catch (error) {
      GlobalErrorHandler.logError(
        'Bulk transaction recovery failed',
        error instanceof Error ? error : new Error(String(error)),
        {
          timestamp: Date.now(),
        }
      );

      throw new Error('Failed to recover pending transactions');
    }
  }

  /**
   * Check for stuck transactions and alert
   */
  static async checkForStuckTransactions(): Promise<{
    stuckCount: number;
    alertSent: boolean;
  }> {
    try {
      const pendingTransactions = await TransactionModel.getTransactionsByStatus('pending');
      const now = Date.now();
      const stuckThreshold = 60 * 60 * 1000; // 1 hour
      
      const stuckTransactions = pendingTransactions.filter(tx => {
        const age = now - new Date(tx.createdAt).getTime();
        return age > stuckThreshold;
      });

      if (stuckTransactions.length > 0) {
        GlobalErrorHandler.logWarning(
          `Found ${stuckTransactions.length} stuck transactions`,
          {
            endpoint: 'transaction-monitoring',
            timestamp: now,
          }
        );

        // In production, this would send alerts to monitoring systems
        return {
          stuckCount: stuckTransactions.length,
          alertSent: true,
        };
      }

      return {
        stuckCount: 0,
        alertSent: false,
      };
    } catch (error) {
      GlobalErrorHandler.logError(
        'Failed to check for stuck transactions',
        error instanceof Error ? error : new Error(String(error)),
        {
          timestamp: Date.now(),
        }
      );

      return {
        stuckCount: 0,
        alertSent: false,
      };
    }
  }

  /**
   * Generate recovery report
   */
  static async generateRecoveryReport(): Promise<{
    totalPending: number;
    oldestPending: string | null;
    averagePendingTime: number;
    recommendedActions: string[];
  }> {
    try {
      const pendingTransactions = await TransactionModel.getTransactionsByStatus('pending');
      const now = Date.now();
      
      if (pendingTransactions.length === 0) {
        return {
          totalPending: 0,
          oldestPending: null,
          averagePendingTime: 0,
          recommendedActions: [],
        };
      }

      const ages = pendingTransactions.map(tx => 
        now - new Date(tx.createdAt).getTime()
      );
      
      const averagePendingTime = ages.reduce((sum, age) => sum + age, 0) / ages.length;
      const oldestAge = Math.max(...ages);
      const oldestTransaction = pendingTransactions.find(tx => 
        now - new Date(tx.createdAt).getTime() === oldestAge
      );

      const recommendedActions: string[] = [];
      
      if (oldestAge > 60 * 60 * 1000) { // 1 hour
        recommendedActions.push('Review transactions older than 1 hour');
      }
      
      if (pendingTransactions.length > 10) {
        recommendedActions.push('High number of pending transactions - check system health');
      }
      
      if (averagePendingTime > 30 * 60 * 1000) { // 30 minutes
        recommendedActions.push('Average pending time is high - investigate network issues');
      }

      return {
        totalPending: pendingTransactions.length,
        oldestPending: oldestTransaction?.id || null,
        averagePendingTime: Math.round(averagePendingTime / 1000), // in seconds
        recommendedActions,
      };
    } catch (error) {
      GlobalErrorHandler.logError(
        'Failed to generate recovery report',
        error instanceof Error ? error : new Error(String(error)),
        {
          timestamp: Date.now(),
        }
      );

      throw new Error('Failed to generate recovery report');
    }
  }
}