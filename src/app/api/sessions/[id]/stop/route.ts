import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { verifyToken } from '@/lib/auth';
import { extractSessionId } from '@/lib/encryption';

// POST - Stop an active session
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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

    const { id: encryptedId } = await params;

    // Extract session ID
    const sessionId = extractSessionId(decodeURIComponent(encryptedId));
    if (!sessionId) {
      return NextResponse.json(
        { success: false, error: 'رابط غير صالح' },
        { status: 400 }
      );
    }

    // Get session
    const session = await db.session.findUnique({
      where: { id: sessionId },
    });

    if (!session) {
      return NextResponse.json(
        { success: false, error: 'الجلسة غير موجودة' },
        { status: 404 }
      );
    }

    // Verify ownership
    if (session.creatorId !== decoded.userId) {
      return NextResponse.json(
        { success: false, error: 'غير مصرح بإيقاف هذه الجلسة' },
        { status: 403 }
      );
    }

    // Update session status
    const updatedSession = await db.session.update({
      where: { id: sessionId },
      data: {
        status: 'completed',
        completedAt: new Date(),
      },
    });

    // Create trip history record
    await db.tripHistory.create({
      data: {
        userId: session.creatorId,
        startLocation: 'موقع البداية',
        endLocation: session.destName || 'موقع النهاية',
        startLat: session.startLat,
        startLng: session.startLng,
        endLat: session.currentLat,
        endLng: session.currentLng,
        distance: session.totalDistance,
        duration: session.totalDuration,
        startTime: session.startedAt,
        endTime: new Date(),
        status: 'completed',
        transportMode: 'car',
      },
    });

    return NextResponse.json({
      success: true,
      message: 'تم إيقاف مشاركة الموقع',
      session: {
        id: updatedSession.id,
        status: updatedSession.status,
        completedAt: updatedSession.completedAt,
        totalDistance: updatedSession.totalDistance,
        totalDuration: updatedSession.totalDuration,
      },
    });
  } catch (error) {
    console.error('Error stopping session:', error);
    return NextResponse.json(
      { success: false, error: 'فشل في إيقاف الجلسة' },
      { status: 500 }
    );
  }
}
