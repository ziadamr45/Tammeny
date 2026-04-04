import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { verifyToken } from "@/lib/auth";
import { sendBulkSMSAlerts } from "@/lib/sms";

// GET - Get user's arrived safe history
export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get("auth-token")?.value;
    
    if (!token) {
      return NextResponse.json(
        { error: "غير مصرح بالدخول" },
        { status: 401 }
      );
    }

    const decoded = await verifyToken(token);
    if (!decoded) {
      return NextResponse.json(
        { error: "رمز غير صالح" },
        { status: 401 }
      );
    }

    const arrivedSafeHistory = await db.arrivedSafe.findMany({
      where: { userId: decoded.userId },
      orderBy: { createdAt: "desc" },
      take: 50,
    });

    return NextResponse.json({ history: arrivedSafeHistory });
  } catch (error) {
    console.error("Get arrived safe error:", error);
    return NextResponse.json(
      { error: "حدث خطأ أثناء جلب السجل" },
      { status: 500 }
    );
  }
}

// POST - Create new arrived safe check-in
export async function POST(request: NextRequest) {
  try {
    const token = request.cookies.get("auth-token")?.value;
    
    if (!token) {
      return NextResponse.json(
        { error: "غير مصرح بالدخول" },
        { status: 401 }
      );
    }

    const decoded = await verifyToken(token);
    if (!decoded) {
      return NextResponse.json(
        { error: "رمز غير صالح" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { latitude, longitude, locationName, sessionId, sendSMS, sendWhatsApp } = body;

    if (!latitude || !longitude) {
      return NextResponse.json(
        { error: "الموقع مطلوب" },
        { status: 400 }
      );
    }

    // Get user's emergency contacts
    const emergencyContacts = await db.emergencyContact.findMany({
      where: { userId: decoded.userId },
    });

    // Get user info
    const user = await db.user.findUnique({
      where: { id: decoded.userId },
    });

    // إعداد بيانات الموقع
    const locationData = {
      lat: latitude,
      lng: longitude,
      name: locationName || 'غير محدد',
    };

    // إنشاء رابط المشاركة
    const shareLink = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/track/${sessionId || 'arrived-safe'}`;

    // إرسال SMS إذا طُلب
    let smsResults = {
      sentCount: 0,
      failedCount: 0,
      errors: [] as Array<{ contact: string; error: string }>,
    };

    if (sendSMS && emergencyContacts.length > 0) {
      // تحضير قائمة جهات الاتصال للإرسال
      const contactsForSMS = emergencyContacts.map(contact => ({
        name: contact.name,
        phone: contact.phone,
      }));

      console.log(`[ArrivedSafe] 📤 إرسال إشعار وصول سالم إلى ${contactsForSMS.length} جهة اتصال`);

      // إرسال الرسائل
      smsResults = await sendBulkSMSAlerts(
        contactsForSMS,
        user?.name || 'مستخدم طمنّي',
        locationData,
        shareLink,
        'arrived'
      );

      console.log(`[ArrivedSafe] 📊 نتيجة الإرسال: ${smsResults.sentCount} نجح، ${smsResults.failedCount} فشل`);
    }

    // معالجة WhatsApp (مستقبلاً)
    let whatsappSent = false;
    if (sendWhatsApp && emergencyContacts.length > 0) {
      console.log(`[ArrivedSafe] 📱 WhatsApp: سيتم إرسال إلى ${emergencyContacts.length} جهة اتصال`);
      // TODO: دمج مع WhatsApp Business API عند التوفر
      whatsappSent = false;
    }

    // Create arrived safe record
    const arrivedSafe = await db.arrivedSafe.create({
      data: {
        userId: decoded.userId,
        sessionId: sessionId || null,
        latitude,
        longitude,
        locationName: locationName || null,
        smsSent: smsResults.sentCount > 0,
        whatsappSent,
        notifiedContacts: emergencyContacts.map(c => c.name).join(","),
      },
    });

    // إنشاء إشعار للمستخدم
    if (smsResults.sentCount > 0 || smsResults.failedCount > 0) {
      await db.notification.create({
        data: {
          userId: decoded.userId,
          type: 'arrived',
          title: 'تم تسجيل الوصول',
          message: smsResults.sentCount > 0 
            ? `تم إرسال إشعار الوصول إلى ${smsResults.sentCount} جهة اتصال`
            : 'تم تسجيل وصولك (لم يتم إرسال رسائل SMS)',
          data: JSON.stringify({
            arrivedSafeId: arrivedSafe.id,
            smsSent: smsResults.sentCount,
            smsFailed: smsResults.failedCount,
          }),
        },
      });
    }

    // Update session if provided
    if (sessionId) {
      await db.session.update({
        where: { id: sessionId },
        data: { status: "completed", completedAt: new Date() },
      });
    }

    return NextResponse.json({
      success: true,
      message: smsResults.sentCount > 0 
        ? `تم تسجيل وصولك بنجاح وإرسال إشعار إلى ${smsResults.sentCount} جهة اتصال!`
        : "تم تسجيل وصولك بنجاح!",
      arrivedSafe,
      notifiedCount: emergencyContacts.length,
      smsSent: smsResults.sentCount,
      smsFailed: smsResults.failedCount,
      smsErrors: smsResults.errors,
    });
  } catch (error) {
    console.error("Arrived safe error:", error);
    return NextResponse.json(
      { error: "حدث خطأ أثناء تسجيل الوصول" },
      { status: 500 }
    );
  }
}
