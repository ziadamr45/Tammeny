import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

/**
 * API لتسجيل أحداث Geofencing (دخول/خروج من المناطق الآمنة)
 * 
 * POST /api/safe-zones/event
 * 
 * يقبل:
 * - zoneId: معرف المنطقة الآمنة
 * - event: نوع الحدث ('enter' | 'exit')
 * - lat: خط العرض الحالي
 * - lng: خط الطول الحالي
 */

// POST - تسجيل حدث geofence جديد
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    
    // التحقق من تسجيل الدخول
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'غير مصرح - يجب تسجيل الدخول' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { zoneId, event, lat, lng } = body;

    // التحقق من البيانات المطلوبة
    if (!zoneId || !event || lat === undefined || lng === undefined) {
      return NextResponse.json(
        { success: false, error: 'البيانات غير مكتملة' },
        { status: 400 }
      );
    }

    // التحقق من نوع الحدث
    if (event !== 'enter' && event !== 'exit') {
      return NextResponse.json(
        { success: false, error: 'نوع الحدث غير صالح' },
        { status: 400 }
      );
    }

    // جلب المنطقة الآمنة والتحقق من ملكيتها
    const safeZone = await db.safeZone.findUnique({
      where: { id: zoneId },
    });

    if (!safeZone) {
      return NextResponse.json(
        { success: false, error: 'المنطقة الآمنة غير موجودة' },
        { status: 404 }
      );
    }

    // التحقق من أن المنطقة تخص المستخدم
    if (safeZone.userId !== user.userId) {
      return NextResponse.json(
        { success: false, error: 'غير مصرح بالوصول لهذه المنطقة' },
        { status: 403 }
      );
    }

    // التحقق من إعدادات الإشعارات
    const shouldNotify = event === 'enter' ? safeZone.notifyOnEnter : safeZone.notifyOnExit;
    
    // تحديد عنوان الإشعار
    const eventTitle = event === 'enter' ? 'دخول إلى منطقة آمنة' : 'خروج من منطقة آمنة';
    const eventMessage = event === 'enter'
      ? `لقد دخلت إلى "${safeZone.name}"`
      : `لقد غادرت "${safeZone.name}"`;

    // إنشاء إشعار للمستخدم
    if (shouldNotify) {
      await db.notification.create({
        data: {
          userId: user.userId,
          type: 'safe_zone',
          title: eventTitle,
          message: eventMessage,
          data: JSON.stringify({
            zoneId: safeZone.id,
            zoneName: safeZone.name,
            eventType: event,
            lat,
            lng,
            timestamp: new Date().toISOString(),
          }),
        },
      });
    }

    // إذا كان حدث خروج وتم تفعيل تنبيه الأطفال
    if (event === 'exit' && safeZone.childAlertEnabled && safeZone.childName) {
      // إنشاء إشعار خاص بالطفل
      await db.notification.create({
        data: {
          userId: user.userId,
          type: 'safe_zone',
          title: 'تنبيه: خروج طفل من منطقة آمنة',
          message: `الطفل "${safeZone.childName}" غادر المنطقة الآمنة "${safeZone.name}"`,
          data: JSON.stringify({
            zoneId: safeZone.id,
            zoneName: safeZone.name,
            eventType: 'child_exit',
            childName: safeZone.childName,
            lat,
            lng,
            timestamp: new Date().toISOString(),
            isChildAlert: true,
          }),
        },
      });
    }

    // إرجاع النتيجة
    return NextResponse.json({
      success: true,
      event: {
        zoneId: safeZone.id,
        zoneName: safeZone.name,
        eventType: event,
        notified: shouldNotify,
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error('Error processing geofence event:', error);
    return NextResponse.json(
      { success: false, error: 'فشل في معالجة الحدث' },
      { status: 500 }
    );
  }
}

// GET - جلب آخر الأحداث للمستخدم
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'غير مصرح - يجب تسجيل الدخول' },
        { status: 401 }
      );
    }

    // جلب آخر إشعارات المناطق الآمنة
    const notifications = await db.notification.findMany({
      where: {
        userId: user.userId,
        type: 'safe_zone',
      },
      orderBy: { createdAt: 'desc' },
      take: 20,
    });

    return NextResponse.json({
      success: true,
      events: notifications.map((n) => ({
        id: n.id,
        title: n.title,
        message: n.message,
        data: n.data ? JSON.parse(n.data) : null,
        isRead: n.isRead,
        createdAt: n.createdAt,
      })),
    });
  } catch (error) {
    console.error('Error fetching geofence events:', error);
    return NextResponse.json(
      { success: false, error: 'فشل في جلب الأحداث' },
      { status: 500 }
    );
  }
}
