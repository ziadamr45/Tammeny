import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { randomInt } from 'crypto';

// POST - Send OTP for password reset
export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json(
        { success: false, error: 'البريد الإلكتروني مطلوب' },
        { status: 400 }
      );
    }

    // Find user by email
    const user = await db.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (!user) {
      // Don't reveal if user exists or not
      return NextResponse.json({
        success: true,
        message: 'إذا كان البريد مسجل، ستصلك رسالة برمز التحقق',
      });
    }

    // Generate 6-digit OTP
    const otp = randomInt(100000, 999999).toString();

    // Set expiry to 10 minutes from now
    const expiry = new Date(Date.now() + 10 * 60 * 1000);

    // Save OTP to user record
    await db.user.update({
      where: { id: user.id },
      data: {
        passwordResetOtp: otp,
        passwordResetExpiry: expiry,
      },
    });

    // In development, return OTP in response
    // In production, send email via nodemailer
    const isDevelopment = process.env.NODE_ENV !== 'production';

    // Log OTP for development
    console.log(`[FORGOT PASSWORD] OTP for ${email}: ${otp}`);

    // TODO: Send email in production
    // if (!isDevelopment) {
    //   await sendEmail({
    //     to: email,
    //     subject: 'رمز إعادة تعيين كلمة المرور',
    //     body: `رمز التحقق الخاص بك هو: ${otp}`,
    //   });
    // }

    return NextResponse.json({
      success: true,
      message: 'تم إرسال رمز التحقق إلى بريدك الإلكتروني',
      ...(isDevelopment && { debug_otp: otp }),
    });
  } catch (error) {
    console.error('Error in forgot password:', error);
    return NextResponse.json(
      { success: false, error: 'حدث خطأ أثناء إرسال رمز التحقق' },
      { status: 500 }
    );
  }
}
