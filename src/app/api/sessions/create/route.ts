import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { verifyToken } from '@/lib/auth';
import { generateEncryptedId } from '@/lib/encryption';

// POST - Create a new location sharing session
export async function POST(request: NextRequest) {
  try {
    // Get token from cookies
    const token = request.cookies.get('auth-token')?.value;
    
    if (!token) {
      return NextResponse.json(
        { success: false, error: 'غير مصرح - يرجى تسجيل الدخول' },
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

    const body = await request.json();
    const {
      duration,
      startLat,
      startLng,
      destLat,
      destLng,
      destName,
      isGhostMode,
      sessionType,
      isRestricted,
      allowedEmails,
    } = body;

    // Validate required fields
    if (startLat === undefined || startLng === undefined) {
      return NextResponse.json(
        { success: false, error: 'موقع البداية مطلوب' },
        { status: 400 }
      );
    }

    if (!duration || duration < -1) {
      return NextResponse.json(
        { success: false, error: 'مدة الجلسة مطلوبة' },
        { status: 400 }
      );
    }

    // Create session in database
    const session = await db.session.create({
      data: {
        creatorId: decoded.userId,
        duration: duration,
        sessionType: sessionType || (duration === -1 ? 'until_arrival' : 'minutes'),
        startLat: startLat,
        startLng: startLng,
        currentLat: startLat,
        currentLng: startLng,
        destLat: destLat || null,
        destLng: destLng || null,
        destName: destName || null,
        status: 'active',
        isGhostMode: isGhostMode || false,
        isRestricted: isRestricted || false,
        startedAt: new Date(),
        expiresAt: duration > 0 ? new Date(Date.now() + duration * 60 * 1000) : null,
        totalDistance: 0,
        totalDuration: 0,
      },
    });

    // Generate encrypted ID for sharing URL
    const encryptedId = generateEncryptedId(session.id);

    // Update session with encrypted ID
    await db.session.update({
      where: { id: session.id },
      data: { encryptedId },
    });

    // Create AllowedUser records for restricted sessions
    if (isRestricted && allowedEmails && allowedEmails.length > 0) {
      await db.allowedUser.createMany({
        data: allowedEmails.map((email: string) => ({
          sessionId: session.id,
          email: email.toLowerCase().trim(),
          token: crypto.randomUUID(),
        })),
      });
    }

    // Create share URL
    const host = request.headers.get('host') || 'localhost:3000';
    const protocol = request.headers.get('x-forwarded-proto') || 'http';
    const shareUrl = `${protocol}://${host}/share/${encryptedId}`;

    return NextResponse.json({
      success: true,
      encryptedId,
      shareUrl,
      session: {
        id: session.id,
        duration: session.duration,
        sessionType: session.sessionType,
        status: session.status,
        startedAt: session.startedAt,
        expiresAt: session.expiresAt,
      },
    });
  } catch (error) {
    console.error('Error creating session:', error);
    return NextResponse.json(
      { success: false, error: 'فشل في إنشاء جلسة المشاركة' },
      { status: 500 }
    );
  }
}
