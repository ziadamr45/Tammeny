/**
 * مكتبة إرسال رسائل SMS عبر Twilio REST API
 * تدعم إرسال تنبيهات الطوارئ ووصول المستخدم والرسائل التجريبية
 * لا تتطلب تثبيت حزمة twilio - تستخدم fetch مباشرة
 */

// نوع الموقع للمشاركة
interface LocationData {
  lat: number;
  lng: number;
  name: string;
}

// نتيجة إرسال الرسالة
interface SMSResult {
  success: boolean;
  error?: string;
  messageId?: string;
}

// أنواع الرسائل المدعومة
type MessageType = 'sos' | 'arrived' | 'test';

// التحقق من إعدادات Twilio
function isTwilioConfigured(): boolean {
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const phoneNumber = process.env.TWILIO_PHONE_NUMBER;

  return !!(accountSid && authToken && phoneNumber);
}

// إنشاء نص الرسالة حسب النوع
function generateMessageContent(
  userName: string,
  location: LocationData | null,
  shareLink: string,
  type: MessageType
): string {
  const locationText = location 
    ? `${location.name} (https://maps.google.com/?q=${location.lat},${location.lng})`
    : 'غير محدد';

  switch (type) {
    case 'sos':
      return `🚨 تنبيه طوارئ!
المستخدم: ${userName}
الموقع: ${locationText}
رابط التتبع: ${shareLink}

هذه رسالة طوارئ تلقائية من تطبيق طمنّي. يرجى التواصل فوراً.`;

    case 'arrived':
      return `✅ وصل سالماً!
المستخدم: ${userName}
الموقع: ${locationText}

تم تأكيد الوصول بأمان من تطبيق طمنّي.`;

    case 'test':
      return `📱 رسالة تجريبية
المستخدم: ${userName}

هذه رسالة تجريبية للتأكد من عمل نظام الإشعارات في تطبيق طمنّي.

رابط التتبع: ${shareLink}`;

    default:
      return `تنبيه من تطبيق طمنّي
المستخدم: ${userName}
الموقع: ${locationText}`;
  }
}

/**
 * إرسال رسالة SMS عبر Twilio REST API
 * يستخدم fetch مباشرة بدون الحاجة لحزمة twilio
 * 
 * @param phone - رقم هاتف المستلم
 * @param userName - اسم المرسل
 * @param location - بيانات الموقع (اختياري)
 * @param shareLink - رابط المشاركة
 * @param type - نوع الرسالة (sos/arrived/test)
 * @returns نتيجة الإرسال
 */
export async function sendSMSAlert(
  phone: string,
  userName: string,
  location: LocationData | null,
  shareLink: string,
  type: MessageType
): Promise<SMSResult> {
  // التحقق من إعدادات Twilio
  if (!isTwilioConfigured()) {
    console.log('[SMS] ⚠️ خدمة SMS غير مُعدة - تخطي الإرسال');
    console.log(`[SMS] كان سيُرسل إلى: ${phone}`);
    console.log(`[SMS] النوع: ${type}`);
    return { 
      success: false, 
      error: 'SMS service not configured' 
    };
  }

  try {
    const accountSid = process.env.TWILIO_ACCOUNT_SID!;
    const authToken = process.env.TWILIO_AUTH_TOKEN!;
    const fromNumber = process.env.TWILIO_PHONE_NUMBER!;

    // إنشاء محتوى الرسالة
    const messageBody = generateMessageContent(userName, location, shareLink, type);

    // تنظيف رقم الهاتف (إزالة المسافات والأحرف غير المرغوبة)
    const cleanPhone = phone.replace(/[\s\-\(\)]/g, '');
    
    // التأكد من أن الرقم يبدأ بـ +
    const formattedPhone = cleanPhone.startsWith('+') ? cleanPhone : `+${cleanPhone}`;

    console.log(`[SMS] 📤 إرسال رسالة ${type} إلى ${formattedPhone}`);

    // إنشاء Basic Auth header
    const auth = Buffer.from(`${accountSid}:${authToken}`).toString('base64');

    // إرسال الرسالة عبر Twilio REST API
    const response = await fetch(
      `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${auth}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          From: fromNumber,
          To: formattedPhone,
          Body: messageBody,
        }),
      }
    );

    const result = await response.json() as { 
      sid?: string; 
      status?: string; 
      error_message?: string;
      message?: string;
    };

    // التحقق من حالة الإرسال
    if (!response.ok) {
      console.error(`[SMS] ❌ فشل الإرسال - الحالة: ${response.status}`);
      console.error(`[SMS] خطأ: ${result.error_message || result.message}`);
      return {
        success: false,
        error: result.error_message || result.message || 'فشل في إرسال الرسالة',
      };
    }

    console.log(`[SMS] ✅ تم الإرسال بنجاح - ID: ${result.sid}`);
    
    return {
      success: true,
      messageId: result.sid,
    };
  } catch (error: unknown) {
    // معالجة الأخطاء
    const errorMessage = error instanceof Error ? error.message : 'خطأ غير معروف';
    console.error('[SMS] ❌ خطأ في الإرسال:', errorMessage);
    
    return {
      success: false,
      error: errorMessage,
    };
  }
}

/**
 * إرسال رسائل SMS لعدة جهات اتصال
 * 
 * @param contacts - قائمة جهات الاتصال
 * @param userName - اسم المرسل
 * @param location - بيانات الموقع
 * @param shareLink - رابط المشاركة
 * @param type - نوع الرسالة
 * @returns عدد الرسائل المرسلة بنجاح وقائمة الأخطاء
 */
export async function sendBulkSMSAlerts(
  contacts: Array<{ name: string; phone: string }>,
  userName: string,
  location: LocationData | null,
  shareLink: string,
  type: MessageType
): Promise<{ 
  sentCount: number; 
  failedCount: number; 
  errors: Array<{ contact: string; error: string }> 
}> {
  // إذا لم تكن الخدمة مُعدة، أرجع فشل لجميع جهات الاتصال
  if (!isTwilioConfigured()) {
    console.log(`[SMS] ⚠️ خدمة SMS غير مُعدة - تخطي إرسال ${contacts.length} رسالة`);
    return {
      sentCount: 0,
      failedCount: contacts.length,
      errors: contacts.map(c => ({
        contact: c.name,
        error: 'SMS service not configured',
      })),
    };
  }

  const results = {
    sentCount: 0,
    failedCount: 0,
    errors: [] as Array<{ contact: string; error: string }>,
  };

  // إرسال الرسائل بالتوازي
  const sendPromises = contacts.map(async (contact) => {
    const result = await sendSMSAlert(contact.phone, userName, location, shareLink, type);
    
    if (result.success) {
      results.sentCount++;
    } else {
      results.failedCount++;
      results.errors.push({
        contact: contact.name,
        error: result.error || 'خطأ غير معروف',
      });
    }

    return result;
  });

  await Promise.allSettled(sendPromises);

  console.log(`[SMS] 📊 ملخص الإرسال: ${results.sentCount} نجح، ${results.failedCount} فشل`);

  return results;
}

/**
 * التحقق من صحة رقم الهاتف
 */
export function isValidPhoneNumber(phone: string): boolean {
  // تنظيف الرقم
  const cleanPhone = phone.replace(/[\s\-\(\)]/g, '');
  
  // التحقق من أن الرقم يحتوي على أرقام فقط مع علامة + اختيارية
  const phoneRegex = /^\+?[1-9]\d{6,14}$/;
  
  return phoneRegex.test(cleanPhone);
}

/**
 * تنسيق رقم الهاتف للعرض
 */
export function formatPhoneNumber(phone: string): string {
  const cleanPhone = phone.replace(/[\s\-\(\)]/g, '');
  
  // إذا كان الرقم طويلاً بما يكفي، قم بتنسيقه
  if (cleanPhone.length >= 10) {
    const countryCode = cleanPhone.slice(0, -9);
    const number = cleanPhone.slice(-9);
    return `${countryCode} ${number.slice(0, 3)} ${number.slice(3, 6)} ${number.slice(6)}`;
  }
  
  return phone;
}

// تصدير الأنواع للاستخدام الخارجي
export type { LocationData, SMSResult, MessageType };
