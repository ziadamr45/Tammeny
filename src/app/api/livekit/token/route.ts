import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { generateLiveKitToken, getLiveKitUrl, createSessionRoom } from '@/lib/livekit';

// POST - Get LiveKit token for voice/video calls
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'غير مسجل الدخول' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { sessionId, roomName } = body;

    // Use sessionId or roomName
    const room = roomName || (sessionId ? `session-${sessionId}` : `call-${Date.now()}`);

    // Create the room first
    if (sessionId) {
      await createSessionRoom(sessionId);
    }

    // Generate token for the participant
    const token = generateLiveKitToken(
      room,
      user.name,
      user.userId
    );

    if (!token) {
      return NextResponse.json(
        { success: false, error: 'فشل في إنشاء رمز الاتصال' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      token,
      room,
      url: getLiveKitUrl(),
    });
  } catch (error) {
    console.error('Error generating LiveKit token:', error);
    return NextResponse.json(
      { success: false, error: 'فشل في إنشاء رمز الاتصال' },
      { status: 500 }
    );
  }
}
