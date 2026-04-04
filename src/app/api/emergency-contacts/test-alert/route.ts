import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { db } from '@/lib/db';

// POST - Send test alert to all emergency contacts
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'لا توجد جهات اتصال للإرسال إليها' },
        { status: 401 }
      );
    }

    // Get all emergency contacts for the user
    const contacts = await db.emergencyContact.findMany({
      where: { userId: user.userId },
      orderBy: { priority: 'asc' },
    });

    if (contacts.length === 0) {
      return NextResponse.json(
        { success: false, error: 'لا توجد جهات اتصال للإرسال إليها' },
        { status: 400 }
      );
    }

    // In a real app, this would send SMS/Push notifications
    // For now, we'll just log and create notification records
    let sentCount = 0;
    
    for (const contact of contacts) {
      // Create a notification record for testing
      try {
        await db.notification.create({
          data: {
            userId: user.userId,
            type: 'test_alert',
            title: 'تنبيه تجريبي',
            message: `تم إرسال تنبيه تجريبي إلى ${contact.name}`,
          },
        });
        sentCount++;
      } catch {
        // Continue even if one fails
        console.error(`Failed to create notification for contact ${contact.id}`);
      }
    }

    return NextResponse.json({
      success: true,
      sentCount,
      message: `تم إرسال تنبيه تجريبي إلى ${sentCount} جهة اتصال`,
    });
  } catch (error) {
    console.error('Error sending test alert:', error);
    return NextResponse.json(
      { success: false, error: 'فشل في إرسال التنبيه التجريبي' },
      { status: 500 }
    );
  }
}
