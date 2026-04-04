import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser, verifyPassword, hashPassword } from '@/lib/auth';
import { db } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ success: false, error: 'غير مسجل الدخول' }, { status: 401 });
    }

    const { currentPassword, newPassword } = await request.json();

    if (!currentPassword || !newPassword) {
      return NextResponse.json({ success: false, error: 'جميع الحقول مطلوبة' }, { status: 400 });
    }
    if (newPassword.length < 8) {
      return NextResponse.json({ success: false, error: 'كلمة المرور يجب أن تكون 8 أحرف على الأقل' }, { status: 400 });
    }

    const dbUser = await db.user.findUnique({ where: { id: user.userId } });
    if (!dbUser) {
      return NextResponse.json({ success: false, error: 'المستخدم غير موجود' }, { status: 404 });
    }

    const isValid = await verifyPassword(currentPassword, dbUser.password);
    if (!isValid) {
      return NextResponse.json({ success: false, error: 'كلمة المرور الحالية غير صحيحة' }, { status: 400 });
    }

    const hashed = await hashPassword(newPassword);
    await db.user.update({ where: { id: user.userId }, data: { password: hashed } });

    return NextResponse.json({ success: true, message: 'تم تغيير كلمة المرور بنجاح' });
  } catch (error) {
    console.error('Error changing password:', error);
    return NextResponse.json({ success: false, error: 'حدث خطأ أثناء تغيير كلمة المرور' }, { status: 500 });
  }
}
