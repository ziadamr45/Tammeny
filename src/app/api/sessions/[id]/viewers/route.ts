import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET - Get viewer count for a session
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Find session by encrypted ID
    const session = await db.session.findFirst({
      where: {
        OR: [
          { encryptedId: id },
          { id: id },
        ],
      },
      include: {
        allowedUsers: true,
      },
    });

    if (!session) {
      return NextResponse.json(
        { success: false, error: 'الجلسة غير موجودة' },
        { status: 404 }
      );
    }

    // Count viewers from AllowedUser table - المشاهدون الحقيقيون
    const viewerCount = await db.allowedUser.count({
      where: {
        sessionId: session.id,
        hasViewed: true,
      },
    });

    return NextResponse.json({
      success: true,
      viewerCount,
    });
  } catch (error) {
    console.error('Error getting viewer count:', error);
    return NextResponse.json(
      { success: false, error: 'فشل في الحصول على عدد المشاهدين' },
      { status: 500 }
    );
  }
}
