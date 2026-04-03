import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { db } from '@/lib/db';

// GET - Get current authenticated user
export async function GET() {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'غير مسجل الدخول' },
        { status: 401 }
      );
    }

    // Get full user data from database
    const dbUser = await db.user.findUnique({
      where: { id: user.userId },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        avatar: true,
        gender: true,
        isVerified: true,
        createdAt: true,
      },
    });

    if (!dbUser) {
      return NextResponse.json(
        { success: false, error: 'المستخدم غير موجود' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      user: dbUser,
    });
  } catch (error) {
    console.error('Error getting current user:', error);
    return NextResponse.json(
      { success: false, error: 'حدث خطأ' },
      { status: 500 }
    );
  }
}
