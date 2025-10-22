import { NextRequest, NextResponse } from 'next/server';
import { NotificationService } from '@/lib/services/notification';
import { ErrorResponse } from '@/types';

export async function POST(request: NextRequest) {
  try {
    // This endpoint is for internal use to trigger notification delivery
    // In production, this would be called by a cron job or queue processor
    
    // Process notification queue
    const result = await NotificationService.processNotificationQueue();

    return NextResponse.json({
      message: 'Notification queue processed successfully',
      result: {
        processed: result.processed,
        delivered: result.delivered,
        failed: result.failed,
      },
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    console.error('Notification delivery API error:', error);
    
    return NextResponse.json(
      {
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to process notification queue',
        },
        timestamp: new Date().toISOString(),
        requestId: crypto.randomUUID(),
      } as ErrorResponse,
      { status: 500 }
    );
  }
}