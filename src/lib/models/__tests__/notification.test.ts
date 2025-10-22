import { NotificationModel } from '../notification';
import { prisma } from '../../db';

// Mock Prisma
jest.mock('../../db', () => ({
  prisma: {
    notification: {
      create: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
      updateMany: jest.fn(),
      createMany: jest.fn(),
    },
  },
}));

const mockPrisma = prisma as jest.Mocked<typeof prisma>;

describe('NotificationModel', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create a new notification', async () => {
      const notificationData = {
        userFid: '12345',
        transactionId: 'tx1',
        type: 'tip_received' as const,
      };

      const mockCreatedNotification = {
        id: 'notif1',
        userFid: '12345',
        transactionId: 'tx1',
        type: 'tip_received',
        delivered: false,
        createdAt: new Date(),
      };

      mockPrisma.notification.create.mockResolvedValue(mockCreatedNotification);

      const result = await NotificationModel.create(notificationData);

      expect(mockPrisma.notification.create).toHaveBeenCalledWith({
        data: {
          userFid: '12345',
          transactionId: 'tx1',
          type: 'tip_received',
          delivered: false,
        },
      });
      expect(result).toEqual(mockCreatedNotification);
    });
  });

  describe('findByUserId', () => {
    it('should find notifications by user fid', async () => {
      const mockNotifications = [
        {
          id: 'notif1',
          userFid: '12345',
          transactionId: 'tx1',
          type: 'tip_received',
          delivered: true,
          createdAt: new Date(),
          transaction: {
            id: 'tx1',
            amount: '0.1',
            senderFid: '67890',
          },
        },
      ];

      mockPrisma.notification.findMany.mockResolvedValue(mockNotifications);

      const result = await NotificationModel.findByUserId('12345', 10, 0);

      expect(mockPrisma.notification.findMany).toHaveBeenCalledWith({
        where: { userFid: '12345' },
        orderBy: { createdAt: 'desc' },
        take: 10,
        skip: 0,
        include: {
          transaction: true,
        },
      });
      expect(result).toEqual(mockNotifications);
    });
  });

  describe('markAsDelivered', () => {
    it('should mark notification as delivered', async () => {
      const mockUpdatedNotification = {
        id: 'notif1',
        userFid: '12345',
        transactionId: 'tx1',
        type: 'tip_received',
        delivered: true,
        createdAt: new Date(),
      };

      mockPrisma.notification.update.mockResolvedValue(mockUpdatedNotification);

      const result = await NotificationModel.markAsDelivered('notif1');

      expect(mockPrisma.notification.update).toHaveBeenCalledWith({
        where: { id: 'notif1' },
        data: { delivered: true },
      });
      expect(result).toEqual(mockUpdatedNotification);
    });
  });

  describe('getUndeliveredNotifications', () => {
    it('should get undelivered notifications', async () => {
      const mockNotifications = [
        {
          id: 'notif1',
          userFid: '12345',
          transactionId: 'tx1',
          type: 'tip_received',
          delivered: false,
          createdAt: new Date(),
          user: {
            id: 'user1',
            fid: '12345',
            notificationEnabled: true,
          },
          transaction: {
            id: 'tx1',
            amount: '0.1',
            senderFid: '67890',
          },
        },
      ];

      mockPrisma.notification.findMany.mockResolvedValue(mockNotifications);

      const result = await NotificationModel.getUndeliveredNotifications();

      expect(mockPrisma.notification.findMany).toHaveBeenCalledWith({
        where: { delivered: false },
        include: {
          user: true,
          transaction: true,
        },
        orderBy: { createdAt: 'asc' },
      });
      expect(result).toEqual(mockNotifications);
    });
  });

  describe('markMultipleAsDelivered', () => {
    it('should mark multiple notifications as delivered', async () => {
      const notificationIds = ['notif1', 'notif2', 'notif3'];
      
      mockPrisma.notification.updateMany.mockResolvedValue({ count: 3 });

      const result = await NotificationModel.markMultipleAsDelivered(notificationIds);

      expect(mockPrisma.notification.updateMany).toHaveBeenCalledWith({
        where: { id: { in: notificationIds } },
        data: { delivered: true },
      });
      expect(result).toBe(3);
    });
  });

  describe('createBulkNotifications', () => {
    it('should create multiple notifications', async () => {
      const notifications = [
        {
          userFid: '12345',
          transactionId: 'tx1',
          type: 'tip_received' as const,
        },
        {
          userFid: '67890',
          transactionId: 'tx1',
          type: 'tip_sent' as const,
        },
      ];

      mockPrisma.notification.createMany.mockResolvedValue({ count: 2 });

      const result = await NotificationModel.createBulkNotifications(notifications);

      expect(mockPrisma.notification.createMany).toHaveBeenCalledWith({
        data: [
          {
            userFid: '12345',
            transactionId: 'tx1',
            type: 'tip_received',
            delivered: false,
          },
          {
            userFid: '67890',
            transactionId: 'tx1',
            type: 'tip_sent',
            delivered: false,
          },
        ],
      });
      expect(result).toBe(2);
    });
  });
});