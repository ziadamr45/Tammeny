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
      userId: string;
      status?: string;
      startTime?: { gte?: Date };
    } = {
      userId: user.userId,
    };

    // Status filter
    if (filter !== 'all') {
      where.status = filter;
    }

    // Time filter
    const now = new Date();
    if (timeFilter === 'week') {
      const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      where.startTime = { gte: weekAgo };
    } else if (timeFilter === 'month') {
      const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      where.startTime = { gte: monthAgo };
    }

    // Get trips from TripHistory
    const trips = await db.tripHistory.findMany({
      where,
      select: {
        id: true,
        startLocation: true,
        endLocation: true,
        startTime: true,
        endTime: true,
        distance: true,
        duration: true,
        status: true,
        transportMode: true,
        locationType: true,
        sharedWith: true,
      },
      orderBy: { startTime: 'desc' }
    });

    // Format trips for response
    const formattedTrips = trips.map(trip => ({
      id: trip.id,
      destination: trip.endLocation || 'وجهة غير محددة',
      origin: trip.startLocation || 'غير محدد',
      startTime: trip.startTime,
      endTime: trip.endTime,
      distance: trip.distance,
      duration: trip.duration,
      status: trip.status,
      transportMode: trip.transportMode,
      locationType: trip.locationType,
      sharedWith: trip.sharedWith ? JSON.parse(trip.sharedWith) : [],
    }));

    // Calculate stats
    const completedTrips = trips.filter(t => t.status === 'completed');
    const stats = {
      totalDistance: completedTrips.reduce((acc, t) => acc + t.distance, 0),
      totalTrips: completedTrips.length,
      totalTime: Math.round(completedTrips.reduce((acc, t) => acc + t.duration, 0)), // Already in minutes
      avgSpeed: completedTrips.length > 0
        ? completedTrips.reduce((acc, t) => acc + (t.distance / Math.max(t.duration / 60, 1)), 0) / completedTrips.length
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
