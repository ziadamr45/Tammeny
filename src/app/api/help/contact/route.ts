import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// POST - Submit contact/support form
export async function POST(request: NextRequest) {
  try {
    const { name, email, message } = await request.json();

    // Validate fields
    if (!name || !email || !message) {
      return NextResponse.json(
        { success: false, error: 'جميع الحقول مطلوبة' },
        { status: 400 }
      );
    }

    if (!email.includes('@')) {
      return NextResponse.json(
        { success: false, error: 'البريد الإلكتروني غير صالح' },
        { status: 400 }
      );
    }

    if (message.length < 10) {
      return NextResponse.json(
        { success: false, error: 'الرسالة يجب أن تكون 10 أحرف على الأقل' },
        { status: 400 }
      );
    }

    // Save to database
    await db.supportTicket.create({
      data: {
        name,
        email: email.toLowerCase(),
        message,
        status: 'open',
      },
    });

    // Log for development
    console.log(`[SUPPORT TICKET] From: ${name} <${email}>: ${message}`);

    // TODO: In production, send email notification to support team

    return NextResponse.json({
      success: true,
      message: 'تم إرسال رسالتك بنجاح',
    });
  } catch (error) {
    console.error('Error submitting contact form:', error);
    return NextResponse.json(
      { success: false, error: 'حدث خطأ أثناء إرسال الرسالة' },
      { status: 500 }
    );
  }
}
