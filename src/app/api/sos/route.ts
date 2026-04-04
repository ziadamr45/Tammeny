import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { db } from '@/lib/db';
import { sendBulkSMSAlerts } from '@/lib/sms';

// POST - Activate SOS emergency alert
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'غير مسجل الدخول' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { latitude, longitude, locationName, batteryLevel } = body;

    // Create SOS session in database
    const sosSession = await db.sOSSession.create({
      data: {
        userId: user.userId,
        latitude: latitude || null,
        longitude: longitude || null,
        locationName: locationName || 'غير محدد',
        batteryLevel: batteryLevel || null,
        status: 'active',
      },
    });

    // Get user's emergency contacts
    const emergencyContacts = await db.contact.findMany({
      where: {
        userId: user.userId,
        isEmergencyContact: true,
      },
    });

    // Get user info for SMS
    const userInfo = await db.user.findUnique({
      where: { id: user.userId },
      select: { name: true },
    });

    // إعداد بيانات الموقع للمشاركة
    const locationData = latitude && longitude ? {
      lat: latitude,
      lng: longitude,
      name: locationName || 'غير محدد',
    } : null;

    // إنشاء رابط المشاركة
    const shareLink = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/track/${sosSession.id}`;

    // إرسال SMS لجهات الطوارئ
    let smsResults = {
      sentCount: 0,
      failedCount: 0,
      errors: [] as Array<{ contact: string; error: string }>,
    };

    if (emergencyContacts.length > 0) {
      // تحضير قائمة جهات الاتصال للإرسال
      const contactsForSMS = emergencyContacts
        .filter(contact => contact.phone) // فقط من لديهم رقم هاتف
        .map(contact => ({
          name: contact.name,
          phone: contact.phone!,
        }));

      if (contactsForSMS.length > 0) {
        console.log(`[SOS] 📤 إرسال تنبيه طوارئ إلى ${contactsForSMS.length} جهة اتصال`);

        // إرسال الرسائل
        smsResults = await sendBulkSMSAlerts(
          contactsForSMS,
          userInfo?.name || 'مستخدم طمنّي',
          locationData,
          shareLink,
          'sos'
        );

        console.log(`[SOS] 📊 نتيجة الإرسال: ${smsResults.sentCount} نجح، ${smsResults.failedCount} فشل`);
      }
    }

    // إنشاء إشعار للمستخدم
    await db.notification.create({
      data: {
        userId: user.userId,
        type: 'sos',
        title: 'تم تفعيل تنبيه الطوارئ',
        message: `تم إرسال تنبيه الطوارئ إلى ${smsResults.sentCount} جهة اتصال`,
        data: JSON.stringify({
          sosId: sosSession.id,
          smsSent: smsResults.sentCount,
          smsFailed: smsResults.failedCount,
        }),
      },
    });

    return NextResponse.json({
      success: true,
      sosSession: {
        id: sosSession.id,
        status: sosSession.status,
        createdAt: sosSession.createdAt,
      },
      contacts: emergencyContacts.map(c => ({
        id: c.id,
        name: c.name,
        phone: c.phone,
      })),
      notifiedCount: emergencyContacts.length,
      smsSent: smsResults.sentCount,
      smsFailed: smsResults.failedCount,
      smsErrors: smsResults.errors,
      shareLink,
      message: smsResults.sentCount > 0 
        ? `تم إرسال تنبيه الطوارئ بنجاح إلى ${smsResults.sentCount} جهة اتصال`
        : 'تم تفعيل تنبيه الطوارئ (لم يتم إرسال رسائل SMS)',
    });
  } catch (error) {
    console.error('Error activating SOS:', error);
    return NextResponse.json(
      { success: false, error: 'فشل في إرسال تنبيه الطوارئ' },
      { status: 500 }
    );
  }
}

// PUT - Deactivate SOS emergency alert
export async function PUT(request: NextRequest) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'غير مسجل الدخول' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { sosId } = body;

    // Update SOS session status
    const sosSession = await db.sOSSession.updateMany({
      where: {
        id: sosId,
        userId: user.userId,
        status: 'active',
      },
      data: {
        status: 'resolved',
        resolvedAt: new Date(),
      },
    });

    if (sosSession.count === 0) {
      return NextResponse.json(
        { success: false, error: 'لم يتم العثور على تنبيه نشط' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'تم إلغاء تنبيه الطوارئ',
    });
  } catch (error) {
    console.error('Error deactivating SOS:', error);
    return NextResponse.json(
      { success: false, error: 'فشل في إلغاء تنبيه الطوارئ' },
      { status: 500 }
    );
  }
}
