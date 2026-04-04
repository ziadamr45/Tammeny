import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { hash } from 'bcrypt';

// POST - Reset password with token
export async function POST(request: NextRequest) {
  try {
    const { email, resetToken, newPassword } = await request.json();

    if (!email || !resetToken || !newPassword) {
      return NextResponse.json(
        { success: false, error: 'جميع الحقول مطلوبة' },
        { status: 400 }
      );
    }

    if (newPassword.length < 8) {
      return NextResponse.json(
        { success: false, error: 'كلمة المرور يجب أن تكون 8 أحرف على الأقل' },
        { status: 400 }
      );
    }

    // Find user by email
    const user = await db.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'طلب غير صالح' },
        { status: 400 }
      );
    }

    // Verify reset token
    const expectedToken = `RESET_${resetToken}`;
    if (user.passwordResetOtp !== expectedToken) {
      return NextResponse.json(
        { success: false, error: 'رمز إعادة التعيين غير صالح' },
        { status: 400 }
      );
    }

    // Check if token expired
    if (!user.passwordResetExpiry || new Date() > user.passwordResetExpiry) {
      return NextResponse.json(
        { success: false, error: 'رمز إعادة التعيين منتهي الصلاحية' },
        { status: 400 }
      );
    }

    // Hash new password
    const hashedPassword = await hash(newPassword, 12);

    // Update password and clear reset fields
    await db.user.update({
      where: { id: user.id },
      data: {
        password: hashedPassword,
        passwordResetOtp: null,
        passwordResetExpiry: null,
      },
    });

    return NextResponse.json({
      success: true,
      message: 'تم تغيير كلمة المرور بنجاح',
    });
  } catch (error) {
    console.error('Error resetting password:', error);
    return NextResponse.json(
      { success: false, error: 'حدث خطأ أثناء تغيير كلمة المرور' },
      { status: 500 }
    );
  }
}
