import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { DEMO_USER_ID } from '../demo-user/route';

// GET - List all sessions/trip history for a user
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId') || DEMO_USER_ID;
    const status = searchParams.get('status'); // 'active', 'completed', 'cancelled', 'all'
    const limit = parseInt(searchParams.get('limit') || '50');

    // Get trip history
    const tripHistory = await db.tripHistory.findMany({
      where: {
        userId,
        ...(status && status !== 'all' ? { status } : {}),
      },
      orderBy: { startTime: 'desc' },
      take: limit,
    });

    // Get active sessions
    const activeSessions = await db.session.findMany({
      where: {
        creatorId: userId,
        status: 'active',
      },
      orderBy: { startedAt: 'desc' },
    });

    return NextResponse.json({
      success: true,
      tripHistory: tripHistory.map((t) => ({
        id: t.id,
        startLocation: t.startLocation,
        endLocation: t.endLocation,
        distance: t.distance,
        duration: t.duration,
        startTime: t.startTime,
        endTime: t.endTime,
        status: t.status,
        transportMode: t.transportMode,
        sharedWith: t.sharedWith ? JSON.parse(t.sharedWith) : [],
        locationType: t.locationType,
        createdAt: t.createdAt,
      })),
      activeSessions: activeSessions.map((s) => ({
        id: s.id,
        encryptedId: s.encryptedId,
        duration: s.duration,
        sessionType: s.sessionType,
        destName: s.destName,
        status: s.status,
        startedAt: s.startedAt,
        expiresAt: s.expiresAt,
        totalDistance: s.totalDistance,
        totalDuration: s.totalDuration,
      })),
    });
  } catch (error) {
    console.error('Error fetching sessions:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch sessions' },
      { status: 500 }
    );
  }
}

// POST - Create a new session or trip history
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      userId,
      startLocation,
      endLocation,
      startLat,
      startLng,
      endLat,
      endLng,
      distance,
      duration,
      transportMode,
      sharedWith,
      locationType,
      status,
    } = body;

    if (!startLocation) {
      return NextResponse.json(
        { success: false, error: 'موقع البداية مطلوب' },
        { status: 400 }
      );
    }

    const tripHistory = await db.tripHistory.create({
      data: {
        userId: userId || DEMO_USER_ID,
        startLocation,
        endLocation: endLocation || null,
        startLat: startLat || null,
        startLng: startLng || null,
        endLat: endLat || null,
        endLng: endLng || null,
        distance: distance || 0,
        duration: duration || 0,
        transportMode: transportMode || 'car',
        sharedWith: sharedWith ? JSON.stringify(sharedWith) : null,
        locationType: locationType || 'other',
        status: status || 'completed',
      },
    });

    return NextResponse.json({
      success: true,
      tripHistory: {
        id: tripHistory.id,
        startLocation: tripHistory.startLocation,
        endLocation: tripHistory.endLocation,
        distance: tripHistory.distance,
        duration: tripHistory.duration,
        startTime: tripHistory.startTime,
        endTime: tripHistory.endTime,
        status: tripHistory.status,
        transportMode: tripHistory.transportMode,
        sharedWith: tripHistory.sharedWith ? JSON.parse(tripHistory.sharedWith) : [],
        locationType: tripHistory.locationType,
        createdAt: tripHistory.createdAt,
      },
    });
  } catch (error) {
    console.error('Error creating session:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create session' },
      { status: 500 }
    );
  }
}
