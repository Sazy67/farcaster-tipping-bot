import { NotificationModel } from '../models/notification';
import { UserModel } from '../models/user';
import { TransactionModel } from '../models/transaction';
import { Notification } from '@/types';

export interface NotificationPayload {
  userFid: string;
  transactionId: string;
  type: 'tip_received' | 'tip_sent';
  amount: string;
  counterpartyFid: string;
  txHash: string;
}

export interface NotificationDeliveryResult {
  success: boolean;
  notificationId?: string;
  error?: string;
}

export class NotificationService {
  /**
   * Create a notification for a user
   */
  static async createNotification(payload: NotificationPayload): Promise<Notification> {
    try {
      const notification = await NotificationModel.create({
        userFid: payload.userFid,
        transactionId: payload.transactionId,
        type: payload.type,
      });

      return notification;
    } catch (error) {
      console.error('Failed to create notification:', error);
      throw new Error('Failed to create notification');
    }
  }

  /**
   * Create notifications for both sender and recipient
   */
  static async createTransactionNotifications(
    transactionId: string,
    senderFid: string,
    recipientFid: string,
    amount: string,
    txHash: string
  ): Promise<{ senderNotification: Notification; recipientNotification: Notification }> {
    try {
      const [senderNotification, recipientNotification] = await Promise.all([
        this.createNotification({
          userFid: senderFid,
          transactionId,
          type: 'tip_sent',
          amount,
          counterpartyFid: recipientFid,
          txHash,
        }),
        this.createNotification({
          userFid: recipientFid,
          transactionId,
          type: 'tip_received',
          amount,
          counterpartyFid: senderFid,
          txHash,
        }),
      ]);

      return { senderNotification, recipientNotification };
    } catch (error) {
      console.error('Failed to create transaction notifications:', error);
      throw new Error('Failed to create transaction notifications');
    }
  }

  /**
   * Get notifications for a user
   */
  static async getUserNotifications(
    userFid: string,
    limit: number = 50,
    offset: number = 0
  ): Promise<Notification[]> {
    try {
      return await NotificationModel.findByUserId(userFid, limit, offset);
    } catch (error) {
      console.error('Failed to get user notifications:', error);
      throw new Error('Failed to get user notifications');
    }
  }

  /**
   * Mark notification as delivered
   */
  static async markAsDelivered(notificationId: string): Promise<void> {
    try {
      await NotificationModel.markAsDelivered(notificationId);
    } catch (error) {
      console.error('Failed to mark notification as delivered:', error);
      throw new Error('Failed to mark notification as delivered');
    }
  }

  /**
   * Get undelivered notifications for processing
   */
  static async getUndeliveredNotifications(): Promise<Notification[]> {
    try {
      return await NotificationModel.getUndeliveredNotifications();
    } catch (error) {
      console.error('Failed to get undelivered notifications:', error);
      throw new Error('Failed to get undelivered notifications');
    }
  }

  /**
   * Process notification queue (batch delivery)
   */
  static async processNotificationQueue(): Promise<{
    processed: number;
    delivered: number;
    failed: number;
  }> {
    try {
      const undeliveredNotifications = await this.getUndeliveredNotifications();
      
      if (undeliveredNotifications.length === 0) {
        return { processed: 0, delivered: 0, failed: 0 };
      }

      let delivered = 0;
      let failed = 0;
      const deliveredIds: string[] = [];

      // Process notifications in batches
      const batchSize = 10;
      for (let i = 0; i < undeliveredNotifications.length; i += batchSize) {
        const batch = undeliveredNotifications.slice(i, i + batchSize);
        
        const batchResults = await Promise.allSettled(
          batch.map(notification => this.deliverNotification(notification))
        );

        batchResults.forEach((result, index) => {
          const notification = batch[index];
          
          if (result.status === 'fulfilled' && result.value.success) {
            delivered++;
            deliveredIds.push(notification.id);
          } else {
            failed++;
            console.error(`Failed to deliver notification ${notification.id}:`, 
              result.status === 'rejected' ? result.reason : result.value.error
            );
          }
        });
      }

      // Mark successfully delivered notifications
      if (deliveredIds.length > 0) {
        await NotificationModel.markMultipleAsDelivered(deliveredIds);
      }

      return {
        processed: undeliveredNotifications.length,
        delivered,
        failed,
      };
    } catch (error) {
      console.error('Failed to process notification queue:', error);
      throw new Error('Failed to process notification queue');
    }
  }

  /**
   * Deliver a single notification
   */
  private static async deliverNotification(notification: any): Promise<NotificationDeliveryResult> {
    try {
      // Check if user has notifications enabled
      const user = await UserModel.findByFid(notification.userFid);
      if (!user || !user.notificationEnabled) {
        return {
          success: true, // Consider it delivered (user opted out)
          notificationId: notification.id,
        };
      }

      // Get transaction details
      const transaction = await TransactionModel.findById(notification.transactionId);
      if (!transaction) {
        return {
          success: false,
          error: 'Transaction not found',
        };
      }

      // Format notification message
      const message = this.formatNotificationMessage(notification, transaction);

      // Deliver notification (this would integrate with actual delivery service)
      const deliveryResult = await this.sendNotification(notification.userFid, message);

      return {
        success: deliveryResult.success,
        notificationId: notification.id,
        error: deliveryResult.error,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Format notification message
   */
  private static formatNotificationMessage(notification: any, transaction: any): string {
    const amount = transaction.amount;
    const counterpartyFid = notification.type === 'tip_received' 
      ? transaction.senderFid 
      : transaction.recipientFid;

    if (notification.type === 'tip_received') {
      return `You received a tip of ${amount} ETH from user ${counterpartyFid}! 🎉`;
    } else {
      return `Your tip of ${amount} ETH to user ${counterpartyFid} has been sent! ✅`;
    }
  }

  /**
   * Send notification to user (placeholder for actual delivery service)
   */
  private static async sendNotification(
    userFid: string,
    message: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      // This is a placeholder implementation
      // In production, this would integrate with:
      // - Farcaster direct messages
      // - Push notifications
      // - Email notifications
      // - Webhook notifications
      
      console.log(`Notification to user ${userFid}: ${message}`);
      
      // Simulate delivery delay
      await new Promise(resolve => setTimeout(resolve, 100));
      
      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Delivery failed',
      };
    }
  }

  /**
   * Get notification statistics for a user
   */
  static async getNotificationStats(userFid: string): Promise<{
    total: number;
    delivered: number;
    pending: number;
    tipReceived: number;
    tipSent: number;
  }> {
    try {
      const notifications = await NotificationModel.findByUserId(userFid, 1000, 0);
      
      const stats = {
        total: notifications.length,
        delivered: notifications.filter(n => n.delivered).length,
        pending: notifications.filter(n => !n.delivered).length,
        tipReceived: notifications.filter(n => n.type === 'tip_received').length,
        tipSent: notifications.filter(n => n.type === 'tip_sent').length,
      };

      return stats;
    } catch (error) {
      console.error('Failed to get notification stats:', error);
      throw new Error('Failed to get notification stats');
    }
  }

  /**
   * Update user notification preferences
   */
  static async updateNotificationPreferences(
    userFid: string,
    enabled: boolean
  ): Promise<void> {
    try {
      await UserModel.updateNotificationPreferences(userFid, enabled);
    } catch (error) {
      console.error('Failed to update notification preferences:', error);
      throw new Error('Failed to update notification preferences');
    }
  }

  /**
   * Create bulk notifications for multiple transactions
   */
  static async createBulkNotifications(
    notifications: Array<{
      userFid: string;
      transactionId: string;
      type: 'tip_received' | 'tip_sent';
    }>
  ): Promise<number> {
    try {
      return await NotificationModel.createBulkNotifications(notifications);
    } catch (error) {
      console.error('Failed to create bulk notifications:', error);
      throw new Error('Failed to create bulk notifications');
    }
  }
}