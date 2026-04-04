import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { db } from '@/lib/db';

// GET - Get user's trip history
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'غير مسجل الدخول' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const filter = searchParams.get('filter') || 'all';
    const timeFilter = searchParams.get('time') || 'month';

    // Build where clause
    const where: {
      creatorId: string;
      status?: string;
      startedAt?: { gte?: Date };
    } = {
      creatorId: user.userId,
    };

    // Status filter
    if (filter !== 'all') {
      where.status = filter;
    }

    // Time filter
    const now = new Date();
    if (timeFilter === 'week') {
      const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      where.startedAt = { gte: weekAgo };
    } else if (timeFilter === 'month') {
      const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      where.startedAt = { gte: monthAgo };
    }

    // Get sessions/trips
    const trips = await db.session.findMany({
      where,
      include: {
        allowedUsers: true,
        locations: {
          orderBy: { timestamp: 'asc' },
          take: 1
        }
      },
      orderBy: { startedAt: 'desc' }
    });

    // Get user info for allowed users
    const allowedUserIds = trips.flatMap(t => 
      t.allowedUsers.filter(a => a.userId).map(a => a.userId as string)
    );
    const users = await db.user.findMany({
      where: { id: { in: allowedUserIds } },
      select: { id: true, name: true }
    });
    const userMap = new Map(users.map(u => [u.id, u]));

    // Format trips for response
    const formattedTrips = trips.map(trip => ({
      id: trip.id,
      destination: trip.destName || 'وجهة غير محددة',
      origin: trip.locations[0] ? 'موقع البداية' : 'غير محدد',
      startTime: trip.startedAt,
      endTime: trip.completedAt,
      distance: trip.totalDistance,
      duration: Math.round(trip.totalDuration / 60), // Convert to minutes
      status: trip.status,
      sharedWith: trip.allowedUsers
        .filter(au => au.userId)
        .map(au => userMap.get(au.userId!)?.name)
        .filter((name): name is string => !!name),
      transportMode: 'car', // Default
      locationType: 'other', // Default
    }));

    // Calculate stats
    const completedTrips = trips.filter(t => t.status === 'completed');
    const stats = {
      totalDistance: completedTrips.reduce((acc, t) => acc + t.totalDistance, 0),
      totalTrips: completedTrips.length,
      totalTime: Math.round(completedTrips.reduce((acc, t) => acc + t.totalDuration, 0) / 60), // Hours
      avgSpeed: completedTrips.length > 0
        ? completedTrips.reduce((acc, t) => acc + (t.totalDistance / Math.max(t.totalDuration / 3600, 1)), 0) / completedTrips.length
        : 0,
    };

    return NextResponse.json({
      success: true,
      trips: formattedTrips,
      stats,
    });
  } catch (error) {
    console.error('Error getting trips:', error);
    return NextResponse.json(
      { success: false, error: 'حدث خطأ' },
      { status: 500 }
    );
  }
}
