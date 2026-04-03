import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { DEMO_USER_ID } from '../demo-user/route';

// GET - List all safe zones for a user
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId') || DEMO_USER_ID;

    const safeZones = await db.safeZone.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({
      success: true,
      safeZones: safeZones.map((z) => ({
        id: z.id,
        name: z.name,
        type: z.type,
        latitude: z.latitude,
        longitude: z.longitude,
        radius: z.radius,
        color: z.color,
        notifyOnEnter: z.notifyOnEnter,
        notifyOnExit: z.notifyOnExit,
        createdAt: z.createdAt,
      })),
    });
  } catch (error) {
    console.error('Error fetching safe zones:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch safe zones' },
      { status: 500 }
    );
  }
}

// POST - Create a new safe zone
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      userId,
      name,
      type,
      latitude,
      longitude,
      radius,
      color,
      notifyOnEnter,
      notifyOnExit,
    } = body;

    if (!name || latitude === undefined || longitude === undefined) {
      return NextResponse.json(
        { success: false, error: 'الاسم والموقع مطلوبان' },
        { status: 400 }
      );
    }

    const safeZone = await db.safeZone.create({
      data: {
        userId: userId || DEMO_USER_ID,
        name,
        type: type || 'other',
        latitude,
        longitude,
        radius: radius || 200,
        color: color || 'safe',
        notifyOnEnter: notifyOnEnter ?? true,
        notifyOnExit: notifyOnExit ?? true,
      },
    });

    return NextResponse.json({
      success: true,
      safeZone: {
        id: safeZone.id,
        name: safeZone.name,
        type: safeZone.type,
        latitude: safeZone.latitude,
        longitude: safeZone.longitude,
        radius: safeZone.radius,
        color: safeZone.color,
        notifyOnEnter: safeZone.notifyOnEnter,
        notifyOnExit: safeZone.notifyOnExit,
        createdAt: safeZone.createdAt,
      },
    });
  } catch (error) {
    console.error('Error creating safe zone:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create safe zone' },
      { status: 500 }
    );
  }
}
