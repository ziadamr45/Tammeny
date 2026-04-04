import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

// GET - List all safe zones for a user
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'غير مصرح - يجب تسجيل الدخول' },
        { status: 401 }
      );
    }

    const safeZones = await db.safeZone.findMany({
      where: { userId: user.userId },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({
      success: true,
      safeZones: safeZones.map((z) => ({
        id: z.id,
        name: z.name,
        type: z.type,
        latitude: z.latitude,
        longitude: z.longitude,
        radius: z.radius,
        color: z.color,
        notifyOnEnter: z.notifyOnEnter,
        notifyOnExit: z.notifyOnExit,
        childAlertEnabled: z.childAlertEnabled,
        childName: z.childName,
        createdAt: z.createdAt,
      })),
    });
  } catch (error) {
    console.error('Error fetching safe zones:', error);
    return NextResponse.json(
      { success: false, error: 'فشل في جلب المناطق الآمنة' },
      { status: 500 }
    );
  }
}

// POST - Create a new safe zone
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'غير مصرح - يجب تسجيل الدخول' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const {
      name,
      type,
      latitude,
      longitude,
      radius,
      color,
      notifyOnEnter,
      notifyOnExit,
      childAlertEnabled,
      childName,
    } = body;

    if (!name || latitude === undefined || longitude === undefined) {
      return NextResponse.json(
        { success: false, error: 'الاسم والموقع مطلوبان' },
        { status: 400 }
      );
    }

    const safeZone = await db.safeZone.create({
      data: {
        userId: user.userId,
        name,
        type: type || 'other',
        latitude,
        longitude,
        radius: radius || 200,
        color: color || 'safe',
        notifyOnEnter: notifyOnEnter ?? true,
        notifyOnExit: notifyOnExit ?? true,
        childAlertEnabled: childAlertEnabled ?? false,
        childName: childName || null,
      },
    });

    return NextResponse.json({
      success: true,
      safeZone: {
        id: safeZone.id,
        name: safeZone.name,
        type: safeZone.type,
        latitude: safeZone.latitude,
        longitude: safeZone.longitude,
        radius: safeZone.radius,
        color: safeZone.color,
        notifyOnEnter: safeZone.notifyOnEnter,
        notifyOnExit: safeZone.notifyOnExit,
        childAlertEnabled: safeZone.childAlertEnabled,
        childName: safeZone.childName,
        createdAt: safeZone.createdAt,
      },
    });
  } catch (error) {
    console.error('Error creating safe zone:', error);
    return NextResponse.json(
      { success: false, error: 'فشل في إنشاء المنطقة الآمنة' },
      { status: 500 }
    );
  }
}
