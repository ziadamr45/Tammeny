import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import { db } from '@/lib/db';

// GET - Get location history for current user
export async function GET(request: NextRequest) {
  try {
    // Get token from cookies
    const token = request.cookies.get('auth-token')?.value;

    if (!token) {
      return NextResponse.json(
        { success: false, error: 'غير مصرح' },
        { status: 401 }
      );
    }

    // Verify token
    const decoded = await verifyToken(token);
    if (!decoded || !decoded.userId) {
      return NextResponse.json(
        { success: false, error: 'جلسة غير صالحة' },
        { status: 401 }
      );
    }

    // Get time range from query params
    const { searchParams } = new URL(request.url);
    const range = searchParams.get('range') || 'all'; // today | week | month | all

    // Calculate date filter
    let dateFilter: Date | undefined;
    const now = new Date();

    switch (range) {
      case 'today':
        dateFilter = new Date(now.setHours(0, 0, 0, 0));
        break;
      case 'week':
        dateFilter = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case 'month':
        dateFilter = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      default:
        dateFilter = undefined;
    }

    // Get user's sessions
    const sessions = await db.session.findMany({
      where: {
        creatorId: decoded.userId,
        ...(dateFilter && { startedAt: { gte: dateFilter } }),
      },
      orderBy: { startedAt: 'desc' },
      include: {
        locations: {
          orderBy: { timestamp: 'asc' },
        },
      },
    });

    // Format response
    const locations: Array<{
      id: string;
      lat: number;
      lng: number;
      sessionId: string;
      timestamp: Date;
      speed: number | null;
      accuracy: number | null;
    }> = [];

    const sessionsData = sessions.map((session) => {
      // Add locations to flat array
      session.locations.forEach((loc) => {
        locations.push({
          id: loc.id,
          lat: loc.lat,
          lng: loc.lng,
          sessionId: session.id,
          timestamp: loc.timestamp,
          speed: loc.speed,
          accuracy: loc.accuracy,
        });
      });

      return {
        id: session.id,
        startedAt: session.startedAt,
        destName: session.destName,
        totalDistance: session.totalDistance,
        status: session.status,
        locationCount: session.locations.length,
      };
    });

    return NextResponse.json({
      success: true,
      locations,
      sessions: sessionsData,
    });
  } catch (error) {
    console.error('Error getting location history:', error);
    return NextResponse.json(
      { success: false, error: 'فشل في الحصول على سجل المواقع' },
      { status: 500 }
    );
  }
}
