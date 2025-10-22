import { prisma } from '../db';
import { Notification } from '@/types';

export class NotificationModel {
  static async create(data: {
    userFid: string;
    transactionId: string;
    type: 'tip_received' | 'tip_sent';
  }): Promise<Notification> {
    const notification = await prisma.notification.create({
      data: {
        userFid: data.userFid,
        transactionId: data.transactionId,
        type: data.type,
        delivered: false,
      },
    });
    
    return notification;
  }

  static async findByUserId(
    userFid: string,
    limit: number = 50,
    offset: number = 0
  ): Promise<Notification[]> {
    const notifications = await prisma.notification.findMany({
      where: { userFid },
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: offset,
      include: {
        transaction: true,
      },
    });
    
    return notifications;
  }

  static async markAsDelivered(id: string): Promise<Notification> {
    const notification = await prisma.notification.update({
      where: { id },
      data: { delivered: true },
    });
    
    return notification;
  }

  static async getUndeliveredNotifications(): Promise<Notification[]> {
    const notifications = await prisma.notification.findMany({
      where: { delivered: false },
      include: {
        user: true,
        transaction: true,
      },
      orderBy: { createdAt: 'asc' },
    });
    
    return notifications;
  }

  static async markMultipleAsDelivered(ids: string[]): Promise<number> {
    const result = await prisma.notification.updateMany({
      where: { id: { in: ids } },
      data: { delivered: true },
    });
    
    return result.count;
  }

  static async createBulkNotifications(
    notifications: Array<{
      userFid: string;
      transactionId: string;
      type: 'tip_received' | 'tip_sent';
    }>
  ): Promise<number> {
    const result = await prisma.notification.createMany({
      data: notifications.map(notification => ({
        ...notification,
        delivered: false,
      })),
    });
    
    return result.count;
  }
}