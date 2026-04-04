import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { randomBytes } from 'crypto';

// POST - Verify OTP and return reset token
export async function POST(request: NextRequest) {
  try {
    const { email, otp } = await request.json();

    if (!email || !otp) {
      return NextResponse.json(
        { success: false, error: 'البريد الإلكتروني ورمز التحقق مطلوبان' },
        { status: 400 }
      );
    }

    // Find user by email
    const user = await db.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'رمز التحقق غير صحيح' },
        { status: 400 }
      );
    }

    // Check if OTP matches
    if (user.passwordResetOtp !== otp) {
      return NextResponse.json(
        { success: false, error: 'رمز التحقق غير صحيح' },
        { status: 400 }
      );
    }

    // Check if OTP expired
    if (!user.passwordResetExpiry || new Date() > user.passwordResetExpiry) {
      return NextResponse.json(
        { success: false, error: 'رمز التحقق منتهي الصلاحية' },
        { status: 400 }
      );
    }

    // Generate reset token (valid for 15 minutes)
    const resetToken = randomBytes(32).toString('hex');
    const resetTokenExpiry = new Date(Date.now() + 15 * 60 * 1000);

    // Store reset token (we'll use the passwordResetOtp field temporarily)
    await db.user.update({
      where: { id: user.id },
      data: {
        passwordResetOtp: `RESET_${resetToken}`, // Prefix to distinguish from OTP
        passwordResetExpiry: resetTokenExpiry,
      },
    });

    return NextResponse.json({
      success: true,
      resetToken,
    });
  } catch (error) {
    console.error('Error verifying OTP:', error);
    return NextResponse.json(
      { success: false, error: 'حدث خطأ أثناء التحقق من الرمز' },
      { status: 500 }
    );
  }
}
