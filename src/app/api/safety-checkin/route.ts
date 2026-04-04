import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import { db } from '@/lib/db';

// POST - Create a new safety check-in
export async function POST(request: NextRequest) {
  try {
    // Get token from cookies
    const token = request.cookies.get('auth-token')?.value;

    if (!token) {
      return NextResponse.json(
        { success: false, error: 'غير مصرح' },
        { status: 401 }
      );
    }

    // Verify token
    const decoded = await verifyToken(token);
    if (!decoded || !decoded.userId) {
      return NextResponse.json(
        { success: false, error: 'جلسة غير صالحة' },
        { status: 401 }
      );
    }

    const userId = decoded.userId;
    const body = await request.json();
    
    const { latitude, longitude, locationName, sessionId } = body;

    // Create arrived safe record (safety check-in)
    const checkIn = await db.arrivedSafe.create({
      data: {
        userId,
        sessionId: sessionId || null,
        latitude: latitude || 0,
        longitude: longitude || 0,
        locationName: locationName || 'تحقق أمان',
      },
    });

    // Create notification for emergency contacts
    const emergencyContacts = await db.emergencyContact.findMany({
      where: { userId },
      take: 3,
    });

    // Notify emergency contacts (create notifications)
    for (const contact of emergencyContacts) {
      await db.notification.create({
        data: {
          userId,
          type: 'safe_zone',
          title: 'تأكيد أمان',
          message: `تم تأكيد أمان المستخدم`,
          data: JSON.stringify({ checkInId: checkIn.id }),
        },
      });
    }

    return NextResponse.json({
      success: true,
      checkIn: {
        id: checkIn.id,
        createdAt: checkIn.createdAt,
      },
    });
  } catch (error) {
    console.error('Error creating safety check-in:', error);
    return NextResponse.json(
      { success: false, error: 'فشل في إنشاء تحقق الأمان' },
      { status: 500 }
    );
  }
}

// GET - Get user's safety check-in history
export async function GET(request: NextRequest) {
  try {
    // Get token from cookies
    const token = request.cookies.get('auth-token')?.value;

    if (!token) {
      return NextResponse.json(
        { success: false, error: 'غير مصرح' },
        { status: 401 }
      );
    }

    // Verify token
    const decoded = await verifyToken(token);
    if (!decoded || !decoded.userId) {
      return NextResponse.json(
        { success: false, error: 'جلسة غير صالحة' },
        { status: 401 }
      );
    }

    const userId = decoded.userId;
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '10');

    const checkIns = await db.arrivedSafe.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });

    return NextResponse.json({
      success: true,
      checkIns,
      total: await db.arrivedSafe.count({ where: { userId } }),
    });
  } catch (error) {
    console.error('Error getting safety check-ins:', error);
    return NextResponse.json(
      { success: false, error: 'فشل في الحصول على تحققات الأمان' },
      { status: 500 }
    );
  }
}
