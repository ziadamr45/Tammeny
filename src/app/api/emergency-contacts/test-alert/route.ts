import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { db } from '@/lib/db';
import { sendBulkSMSAlerts } from '@/lib/sms';

// POST - Send test alert to all emergency contacts
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'غير مسجل الدخول' },
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

    // Get user info
    const userInfo = await db.user.findUnique({
      where: { id: user.userId },
      select: { name: true },
    });

    // إنشاء رابط تجريبي
    const shareLink = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/test-alert/${user.userId}`;

    // إرسال SMS حقيقي لجهات الاتصال
    const contactsForSMS = contacts.map(contact => ({
      name: contact.name,
      phone: contact.phone,
    }));

    console.log(`[TestAlert] 📤 إرسال تنبيه تجريبي إلى ${contactsForSMS.length} جهة اتصال`);

    // إرسال الرسائل
    const smsResults = await sendBulkSMSAlerts(
      contactsForSMS,
      userInfo?.name || 'مستخدم طمنّي',
      null, // لا يوجد موقع للرسالة التجريبية
      shareLink,
      'test'
    );

    console.log(`[TestAlert] 📊 نتيجة الإرسال: ${smsResults.sentCount} نجح، ${smsResults.failedCount} فشل`);

    // إنشاء سجل إشعار لكل جهة اتصال
    for (const contact of contacts) {
      try {
        await db.notification.create({
          data: {
            userId: user.userId,
            type: 'test_alert',
            title: 'تنبيه تجريبي',
            message: `تم إرسال تنبيه تجريبي إلى ${contact.name}`,
            data: JSON.stringify({
              contactId: contact.id,
              contactName: contact.name,
              contactPhone: contact.phone,
            }),
          },
        });
      } catch {
        console.error(`[TestAlert] فشل في إنشاء إشعار لجهة الاتصال ${contact.id}`);
      }
    }

    // تحضير التحذيرات في حالة الفشل
    const warnings: string[] = [];
    
    if (smsResults.failedCount > 0) {
      warnings.push(`فشل إرسال ${smsResults.failedCount} رسالة من أصل ${contacts.length}`);
      
      // إضافة تفاصيل الأخطاء
      smsResults.errors.forEach(error => {
        console.warn(`[TestAlert] ⚠️ فشل الإرسال إلى ${error.contact}: ${error.error}`);
      });
    }

    // إذا لم تكن خدمة SMS مُعدة، أضف تحذيراً واضحاً
    if (smsResults.sentCount === 0 && smsResults.errors.length > 0) {
      const isSmsNotConfigured = smsResults.errors.some(e => 
        e.error === 'SMS service not configured'
      );
      
      if (isSmsNotConfigured) {
        warnings.push('⚠️ خدمة SMS غير مُعدة. يرجى إعداد Twilio لإرسال الرسائل الفعلية.');
        warnings.push('أضف المتغيرات التالية في ملف .env:');
        warnings.push('- TWILIO_ACCOUNT_SID');
        warnings.push('- TWILIO_AUTH_TOKEN');
        warnings.push('- TWILIO_PHONE_NUMBER');
      }
    }

    return NextResponse.json({
      success: smsResults.sentCount > 0 || smsResults.failedCount === contacts.length,
      sentCount: smsResults.sentCount,
      failedCount: smsResults.failedCount,
      totalContacts: contacts.length,
      message: smsResults.sentCount > 0 
        ? `تم إرسال تنبيه تجريبي إلى ${smsResults.sentCount} جهة اتصال بنجاح`
        : 'تم تسجيل محاولة الإرسال (راجع التحذيرات)',
      warnings: warnings.length > 0 ? warnings : undefined,
      details: {
        contacts: contacts.map(c => ({
          name: c.name,
          phone: c.phone,
          relation: c.relation,
        })),
        smsResults: {
          sent: smsResults.sentCount,
          failed: smsResults.failedCount,
          errors: smsResults.errors,
        },
      },
    });
  } catch (error) {
    console.error('Error sending test alert:', error);
    return NextResponse.json(
      { success: false, error: 'فشل في إرسال التنبيه التجريبي' },
      { status: 500 }
    );
  }
}
