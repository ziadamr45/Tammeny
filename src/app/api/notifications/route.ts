import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { DEMO_USER_ID } from '../demo-user/route';

// GET - List all notifications for a user
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId') || DEMO_USER_ID;
    const unreadOnly = searchParams.get('unreadOnly') === 'true';
    const limit = parseInt(searchParams.get('limit') || '50');

    const notifications = await db.notification.findMany({
      where: {
        userId,
        ...(unreadOnly ? { isRead: false } : {}),
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });

    const unreadCount = await db.notification.count({
      where: {
        userId,
        isRead: false,
      },
    });

    return NextResponse.json({
      success: true,
      notifications: notifications.map((n) => ({
        id: n.id,
        type: n.type,
        title: n.title,
        message: n.message,
        data: n.data ? JSON.parse(n.data) : null,
        isRead: n.isRead,
        readAt: n.readAt,
        createdAt: n.createdAt,
      })),
      unreadCount,
    });
  } catch (error) {
    console.error('Error fetching notifications:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch notifications' },
      { status: 500 }
    );
  }
}

// PUT - Mark notifications as read
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, notificationIds, markAllAsRead } = body;

    if (markAllAsRead) {
      await db.notification.updateMany({
        where: {
          userId: userId || DEMO_USER_ID,
          isRead: false,
        },
        data: {
          isRead: true,
          readAt: new Date(),
        },
      });

      return NextResponse.json({
        success: true,
        message: 'تم تحديد جميع الإشعارات كمقروءة',
      });
    }

    if (notificationIds && notificationIds.length > 0) {
      await db.notification.updateMany({
        where: {
          id: { in: notificationIds },
        },
        data: {
          isRead: true,
          readAt: new Date(),
        },
      });

      return NextResponse.json({
        success: true,
        message: 'تم تحديد الإشعارات كمقروءة',
      });
    }

    return NextResponse.json(
      { success: false, error: 'لم يتم تحديد إشعارات' },
      { status: 400 }
    );
  } catch (error) {
    console.error('Error updating notifications:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update notifications' },
      { status: 500 }
    );
  }
}

// POST - Create a new notification
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, type, title, message, data } = body;

    if (!type || !title || !message) {
      return NextResponse.json(
        { success: false, error: 'النوع والعنوان والرسالة مطلوبون' },
        { status: 400 }
      );
    }

    const notification = await db.notification.create({
      data: {
        userId: userId || DEMO_USER_ID,
        type,
        title,
        message,
        data: data ? JSON.stringify(data) : null,
      },
    });

    return NextResponse.json({
      success: true,
      notification: {
        id: notification.id,
        type: notification.type,
        title: notification.title,
        message: notification.message,
        data: notification.data ? JSON.parse(notification.data) : null,
        isRead: notification.isRead,
        createdAt: notification.createdAt,
      },
    });
  } catch (error) {
    console.error('Error creating notification:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create notification' },
      { status: 500 }
    );
  }
}
