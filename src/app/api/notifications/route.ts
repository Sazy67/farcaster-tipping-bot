import { NextRequest, NextResponse } from 'next/server';
import { NotificationService } from '@/lib/services/notification';
import { ErrorResponse } from '@/types';
import { z } from 'zod';

// Query parameters validation schema
const notificationsQuerySchema = z.object({
  userFid: z.string().min(1),
  limit: z.string().optional().transform(val => val ? parseInt(val) : 50),
  offset: z.string().optional().transform(val => val ? parseInt(val) : 0),
});

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
    // Validate query parameters
    const validationResult = notificationsQuerySchema.safeParse({
      userFid: searchParams.get('userFid'),
      limit: searchParams.get('limit'),
      offset: searchParams.get('offset'),
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

    const { userFid, limit, offset } = validationResult.data;

    // Get user notifications
    const notifications = await NotificationService.getUserNotifications(userFid, limit, offset);

    // Get notification statistics
    const stats = await NotificationService.getNotificationStats(userFid);

    // Format response
    const formattedNotifications = notifications.map(notification => ({
      id: notification.id,
      type: notification.type,
      delivered: notification.delivered,
      createdAt: notification.createdAt,
      transactionId: notification.transactionId,
    }));

    return NextResponse.json({
      notifications: formattedNotifications,
      stats,
      pagination: {
        limit,
        offset,
        total: formattedNotifications.length,
        hasMore: formattedNotifications.length === limit,
      },
    });

  } catch (error) {
    console.error('Notifications API error:', error);
    
    return NextResponse.json(
      {
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to get notifications',
        },
        timestamp: new Date().toISOString(),
        requestId: crypto.randomUUID(),
      } as ErrorResponse,
      { status: 500 }
    );
  }
}