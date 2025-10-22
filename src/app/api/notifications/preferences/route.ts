import { NextRequest, NextResponse } from 'next/server';
import { NotificationService } from '@/lib/services/notification';
import { UserModel } from '@/lib/models/user';
import { ErrorResponse } from '@/types';
import { z } from 'zod';

// Request body validation schema
const preferencesSchema = z.object({
  userFid: z.string().min(1),
  notificationEnabled: z.boolean(),
});

// Query parameters validation schema
const preferencesQuerySchema = z.object({
  userFid: z.string().min(1),
});

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
    // Validate query parameters
    const validationResult = preferencesQuerySchema.safeParse({
      userFid: searchParams.get('userFid'),
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

    const { userFid } = validationResult.data;

    // Get user preferences
    const user = await UserModel.findByFid(userFid);
    if (!user) {
      return NextResponse.json(
        {
          error: {
            code: 'USER_NOT_FOUND',
            message: 'User not found',
          },
          timestamp: new Date().toISOString(),
          requestId: crypto.randomUUID(),
        } as ErrorResponse,
        { status: 404 }
      );
    }

    return NextResponse.json({
      userFid: user.fid,
      notificationEnabled: user.notificationEnabled,
      updatedAt: user.updatedAt,
    });

  } catch (error) {
    console.error('Get notification preferences API error:', error);
    
    return NextResponse.json(
      {
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to get notification preferences',
        },
        timestamp: new Date().toISOString(),
        requestId: crypto.randomUUID(),
      } as ErrorResponse,
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate request body
    const validationResult = preferencesSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        {
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid request data',
            details: validationResult.error.issues,
          },
          timestamp: new Date().toISOString(),
          requestId: crypto.randomUUID(),
        } as ErrorResponse,
        { status: 400 }
      );
    }

    const { userFid, notificationEnabled } = validationResult.data;

    // Update notification preferences
    await NotificationService.updateNotificationPreferences(userFid, notificationEnabled);

    // Get updated user data
    const updatedUser = await UserModel.findByFid(userFid);
    if (!updatedUser) {
      return NextResponse.json(
        {
          error: {
            code: 'USER_NOT_FOUND',
            message: 'User not found after update',
          },
          timestamp: new Date().toISOString(),
          requestId: crypto.randomUUID(),
        } as ErrorResponse,
        { status: 404 }
      );
    }

    return NextResponse.json({
      userFid: updatedUser.fid,
      notificationEnabled: updatedUser.notificationEnabled,
      updatedAt: updatedUser.updatedAt,
      message: 'Notification preferences updated successfully',
    });

  } catch (error) {
    console.error('Update notification preferences API error:', error);
    
    return NextResponse.json(
      {
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to update notification preferences',
        },
        timestamp: new Date().toISOString(),
        requestId: crypto.randomUUID(),
      } as ErrorResponse,
      { status: 500 }
    );
  }
}