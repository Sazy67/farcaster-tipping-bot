import { NotificationService } from '../notification';
import { NotificationModel } from '../../models/notification';
import { UserModel } from '../../models/user';
import { TransactionModel } from '../../models/transaction';

// Mock dependencies
jest.mock('../../models/notification');
jest.mock('../../models/user');
jest.mock('../../models/transaction');

const mockNotificationModel = NotificationModel as jest.Mocked<typeof NotificationModel>;
const mockUserModel = UserModel as jest.Mocked<typeof UserModel>;
const mockTransactionModel = TransactionModel as jest.Mocked<typeof TransactionModel>;

describe('NotificationService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('createNotification', () => {
    it('should create a notification successfully', async () => {
      const payload = {
        userFid: '12345',
        transactionId: 'tx123',
        type: 'tip_received' as const,
        amount: '0.05',
        counterpartyFid: '67890',
        txHash: '0xabc123',
      };

      const mockNotification = {
        id: 'notif123',
        userFid: '12345',
        transactionId: 'tx123',
        type: 'tip_received',
        delivered: false,
        createdAt: new Date(),
      };

      mockNotificationModel.create.mockResolvedValue(mockNotification as any);

      const result = await NotificationService.createNotification(payload);

      expect(mockNotificationModel.create).toHaveBeenCalledWith({
        userFid: '12345',
        transactionId: 'tx123',
        type: 'tip_received',
      });
      expect(result).toEqual(mockNotification);
    });

    it('should handle creation errors', async () => {
      const payload = {
        userFid: '12345',
        transactionId: 'tx123',
        type: 'tip_received' as const,
        amount: '0.05',
        counterpartyFid: '67890',
        txHash: '0xabc123',
      };

      mockNotificationModel.create.mockRejectedValue(new Error('Database error'));

      await expect(NotificationService.createNotification(payload)).rejects.toThrow('Failed to create notification');
    });
  });

  describe('createTransactionNotifications', () => {
    it('should create notifications for both sender and recipient', async () => {
      const senderNotification = {
        id: 'notif1',
        userFid: '12345',
        transactionId: 'tx123',
        type: 'tip_sent',
        delivered: false,
        createdAt: new Date(),
      };

      const recipientNotification = {
        id: 'notif2',
        userFid: '67890',
        transactionId: 'tx123',
        type: 'tip_received',
        delivered: false,
        createdAt: new Date(),
      };

      mockNotificationModel.create
        .mockResolvedValueOnce(senderNotification as any)
        .mockResolvedValueOnce(recipientNotification as any);

      const result = await NotificationService.createTransactionNotifications(
        'tx123',
        '12345',
        '67890',
        '0.05',
        '0xabc123'
      );

      expect(mockNotificationModel.create).toHaveBeenCalledTimes(2);
      expect(result.senderNotification).toEqual(senderNotification);
      expect(result.recipientNotification).toEqual(recipientNotification);
    });
  });

  describe('getUserNotifications', () => {
    it('should get user notifications', async () => {
      const mockNotifications = [
        {
          id: 'notif1',
          userFid: '12345',
          transactionId: 'tx123',
          type: 'tip_received',
          delivered: true,
          createdAt: new Date(),
        },
      ];

      mockNotificationModel.findByUserId.mockResolvedValue(mockNotifications as any);

      const result = await NotificationService.getUserNotifications('12345', 10, 0);

      expect(mockNotificationModel.findByUserId).toHaveBeenCalledWith('12345', 10, 0);
      expect(result).toEqual(mockNotifications);
    });
  });

  describe('markAsDelivered', () => {
    it('should mark notification as delivered', async () => {
      const mockUpdatedNotification = {
        id: 'notif1',
        delivered: true,
      };

      mockNotificationModel.markAsDelivered.mockResolvedValue(mockUpdatedNotification as any);

      await NotificationService.markAsDelivered('notif1');

      expect(mockNotificationModel.markAsDelivered).toHaveBeenCalledWith('notif1');
    });
  });

  describe('processNotificationQueue', () => {
    it('should process notification queue successfully', async () => {
      const mockUndeliveredNotifications = [
        {
          id: 'notif1',
          userFid: '12345',
          transactionId: 'tx123',
          type: 'tip_received',
          delivered: false,
          createdAt: new Date(),
        },
        {
          id: 'notif2',
          userFid: '67890',
          transactionId: 'tx124',
          type: 'tip_sent',
          delivered: false,
          createdAt: new Date(),
        },
      ];

      const mockUser = {
        id: 'user1',
        fid: '12345',
        notificationEnabled: true,
      };

      const mockTransaction = {
        id: 'tx123',
        amount: '0.05',
        senderFid: '67890',
        recipientFid: '12345',
      };

      mockNotificationModel.getUndeliveredNotifications.mockResolvedValue(mockUndeliveredNotifications as any);
      mockUserModel.findByFid.mockResolvedValue(mockUser as any);
      mockTransactionModel.findById.mockResolvedValue(mockTransaction as any);
      mockNotificationModel.markMultipleAsDelivered.mockResolvedValue(2);

      const result = await NotificationService.processNotificationQueue();

      expect(result.processed).toBe(2);
      expect(result.delivered).toBe(2);
      expect(result.failed).toBe(0);
    });

    it('should handle empty queue', async () => {
      mockNotificationModel.getUndeliveredNotifications.mockResolvedValue([]);

      const result = await NotificationService.processNotificationQueue();

      expect(result).toEqual({
        processed: 0,
        delivered: 0,
        failed: 0,
      });
    });

    it('should handle delivery failures', async () => {
      const mockUndeliveredNotifications = [
        {
          id: 'notif1',
          userFid: '12345',
          transactionId: 'tx123',
          type: 'tip_received',
          delivered: false,
          createdAt: new Date(),
        },
      ];

      const mockUser = {
        id: 'user1',
        fid: '12345',
        notificationEnabled: true,
      };

      mockNotificationModel.getUndeliveredNotifications.mockResolvedValue(mockUndeliveredNotifications as any);
      mockUserModel.findByFid.mockResolvedValue(mockUser as any);
      mockTransactionModel.findById.mockResolvedValue(null); // Transaction not found - this causes failure

      const result = await NotificationService.processNotificationQueue();

      expect(result.processed).toBe(1);
      expect(result.delivered).toBe(0);
      expect(result.failed).toBe(1);
    });
  });

  describe('getNotificationStats', () => {
    it('should return notification statistics', async () => {
      const mockNotifications = [
        {
          id: 'notif1',
          type: 'tip_received',
          delivered: true,
        },
        {
          id: 'notif2',
          type: 'tip_sent',
          delivered: false,
        },
        {
          id: 'notif3',
          type: 'tip_received',
          delivered: true,
        },
      ];

      mockNotificationModel.findByUserId.mockResolvedValue(mockNotifications as any);

      const result = await NotificationService.getNotificationStats('12345');

      expect(result).toEqual({
        total: 3,
        delivered: 2,
        pending: 1,
        tipReceived: 2,
        tipSent: 1,
      });
    });
  });

  describe('updateNotificationPreferences', () => {
    it('should update user notification preferences', async () => {
      const mockUpdatedUser = {
        id: 'user1',
        fid: '12345',
        notificationEnabled: false,
      };

      mockUserModel.updateNotificationPreferences.mockResolvedValue(mockUpdatedUser as any);

      await NotificationService.updateNotificationPreferences('12345', false);

      expect(mockUserModel.updateNotificationPreferences).toHaveBeenCalledWith('12345', false);
    });
  });

  describe('createBulkNotifications', () => {
    it('should create bulk notifications', async () => {
      const notifications = [
        {
          userFid: '12345',
          transactionId: 'tx123',
          type: 'tip_received' as const,
        },
        {
          userFid: '67890',
          transactionId: 'tx123',
          type: 'tip_sent' as const,
        },
      ];

      mockNotificationModel.createBulkNotifications.mockResolvedValue(2);

      const result = await NotificationService.createBulkNotifications(notifications);

      expect(mockNotificationModel.createBulkNotifications).toHaveBeenCalledWith(notifications);
      expect(result).toBe(2);
    });
  });
});