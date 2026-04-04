import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { db } from '@/lib/db';

// GET - Search for users by email or name
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'غير مصرح - يجب تسجيل الدخول' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q')?.trim();

    if (!query || query.length < 2) {
      return NextResponse.json(
        { success: false, error: 'يرجى إدخال حرفين على الأقل للبحث' },
        { status: 400 }
      );
    }

    // Search users by email or name (case-insensitive)
    const users = await db.user.findMany({
      where: {
        OR: [
          { email: { contains: query, mode: 'insensitive' } },
          { name: { contains: query, mode: 'insensitive' } },
        ],
        NOT: {
          id: user.userId, // Exclude the current user
        },
      },
      select: {
        id: true,
        name: true,
        email: true,
        avatar: true,
      },
      take: 10, // Limit results
    });

    return NextResponse.json({
      success: true,
      users,
    });
  } catch (error) {
    console.error('Error searching users:', error);
    return NextResponse.json(
      { success: false, error: 'فشل في البحث عن المستخدمين' },
      { status: 500 }
    );
  }
}
