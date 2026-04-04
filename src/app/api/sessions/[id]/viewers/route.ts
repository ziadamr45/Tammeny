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

    // Count viewers from AllowedUser table
    const viewerCount = await db.allowedUser.count({
      where: {
        sessionId: session.id,
        hasViewed: true,
      },
    });

    // Also count unique IP addresses that viewed (from location points as approximation)
    // This is a simplified approach - in production you'd track this separately
    const recentViews = await db.locationPoint.findMany({
      where: {
        sessionId: session.id,
        timestamp: {
          gte: new Date(Date.now() - 5 * 60 * 1000), // Last 5 minutes
        },
      },
      distinct: ['id'], // Simplified - in production track by IP or session
    });

    // Return the higher count
    const totalViewers = Math.max(viewerCount, recentViews.length > 0 ? 1 : 0);

    return NextResponse.json({
      success: true,
      viewerCount: totalViewers,
    });
  } catch (error) {
    console.error('Error getting viewer count:', error);
    return NextResponse.json(
      { success: false, error: 'فشل في الحصول على عدد المشاهدين' },
      { status: 500 }
    );
  }
}
