import { NextRequest, NextResponse } from 'next/server';
import { NotificationService } from '@/lib/services/notification';
import { ErrorResponse } from '@/types';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    if (!id) {
      return NextResponse.json(
        {
          error: {
            code: 'MISSING_NOTIFICATION_ID',
            message: 'Notification ID is required',
          },
          timestamp: new Date().toISOString(),
          requestId: crypto.randomUUID(),
        } as ErrorResponse,
        { status: 400 }
      );
    }

    // Mark notification as delivered
    await NotificationService.markAsDelivered(id);

    return NextResponse.json({
      message: 'Notification marked as delivered',
      notificationId: id,
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    console.error('Mark notification delivered API error:', error);
    
    return NextResponse.json(
      {
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to mark notification as delivered',
        },
        timestamp: new Date().toISOString(),
        requestId: crypto.randomUUID(),
      } as ErrorResponse,
      { status: 500 }
    );
  }
}