import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { db } from '@/lib/db';

// GET - Get specific trip details
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'غير مسجل الدخول' },
        { status: 401 }
      );
    }

    const { id } = await params;

    // Get session/trip data
    const session = await db.session.findFirst({
      where: {
        id,
        creatorId: user.userId,
      },
      include: {
        locations: {
          orderBy: { timestamp: 'asc' },
        },
        allowedUsers: true,
      },
    });

    if (!session) {
      return NextResponse.json(
        { success: false, error: 'لم يتم العثور على الرحلة' },
        { status: 404 }
      );
    }

    // Get user info for allowed users
    const allowedUserIds = session.allowedUsers
      .filter(au => au.userId)
      .map(au => au.userId as string);

    const users = await db.user.findMany({
      where: { id: { in: allowedUserIds } },
      select: { id: true, name: true },
    });
    const userMap = new Map(users.map(u => [u.id, u]));

    // Build checkpoints from locations
    const checkpoints = session.locations.map((loc, index) => ({
      time: loc.timestamp,
      location: index === 0 ? 'نقطة البداية' : 
                index === session.locations.length - 1 ? 'نقطة الوصول' :
                `نقطة ${index + 1}`,
      coords: { lat: loc.lat, lng: loc.lng },
      type: index === 0 ? 'start' as const :
            index === session.locations.length - 1 ? 'end' as const :
            'checkpoint' as const,
    }));

    // If there's a destination, add it as final checkpoint
    if (session.destLat && session.destLng && session.destName) {
      checkpoints.push({
        time: session.completedAt || new Date(),
        location: session.destName,
        coords: { lat: session.destLat, lng: session.destLng },
        type: 'end' as const,
      });
    }

    // Build route from locations
    const route = session.locations.map(loc => ({
      lat: loc.lat,
      lng: loc.lng,
    }));

    // Calculate statistics
    const totalDistance = session.totalDistance;
    const totalDuration = session.totalDuration / 60; // Convert to minutes
    const avgSpeed = totalDuration > 0 ? totalDistance / (totalDuration / 60) : 0;
    const maxSpeed = session.locations.reduce((max, loc) => 
      Math.max(max, loc.speed || 0), 0);

    // Build response
    const trip = {
      id: session.id,
      destination: session.destName || 'وجهة غير محددة',
      origin: session.locations[0] ? 'موقع البداية' : 'غير محدد',
      startTime: session.startedAt,
      endTime: session.completedAt,
      distance: totalDistance,
      duration: Math.round(totalDuration),
      avgSpeed: Math.round(avgSpeed * 10) / 10,
      maxSpeed: Math.round(maxSpeed),
      status: session.status,
      transportMode: 'car', // Default
      sharedWith: session.allowedUsers
        .filter(au => au.userId)
        .map(au => userMap.get(au.userId!)?.name)
        .filter((name): name is string => !!name),
      safetyScore: 95, // Default - could be calculated based on various factors
      originCoords: session.locations[0] ? 
        { lat: session.locations[0].lat, lng: session.locations[0].lng, name: 'نقطة البداية' } :
        { lat: session.startLat, lng: session.startLng, name: 'نقطة البداية' },
      destinationCoords: session.destLat && session.destLng ?
        { lat: session.destLat, lng: session.destLng, name: session.destName || 'الوجهة' } :
        null,
      checkpoints,
      safetyEvents: [], // Could be populated from safety-related data
      route,
    };

    return NextResponse.json({
      success: true,
      trip,
    });
  } catch (error) {
    console.error('Error getting trip details:', error);
    return NextResponse.json(
      { success: false, error: 'حدث خطأ' },
      { status: 500 }
    );
  }
}
