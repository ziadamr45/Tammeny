import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import { db } from '@/lib/db';

// Safety Score calculation
interface SafetyScoreInput {
  totalTrips: number;
  emergencyContactsCount: number;
  safeZonesCount: number;
  arrivedSafeCount: number;
  profileComplete: boolean;
}

function calculateSafetyScore(input: SafetyScoreInput): number {
  let score = 0;

  // Trips: up to 30 points (3 per trip, max 10 trips counted)
  score += Math.min(30, input.totalTrips * 3);

  // Emergency contacts: up to 25 points (each contact = 8 pts, max 3)
  score += Math.min(25, input.emergencyContactsCount * 8);

  // Safe zones: up to 20 points (each zone = 5 pts, max 4)
  score += Math.min(20, input.safeZonesCount * 5);

  // Arrived safe: up to 15 points (each check-in = 3 pts, max 5)
  score += Math.min(15, input.arrivedSafeCount * 3);

  // Profile complete: 10 points
  if (input.profileComplete) score += 10;

  return Math.min(100, score);
}

// GET - Get user's safety score
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

    const userId = decoded.userId;

    // Get data for safety score calculation
    const [
      user,
      totalTrips,
      emergencyContactsCount,
      safeZonesCount,
      arrivedSafeCount,
    ] = await Promise.all([
      db.user.findUnique({
        where: { id: userId },
        select: { phone: true, name: true, gender: true },
      }),
      db.session.count({ where: { creatorId: userId, status: 'completed' } }),
      db.emergencyContact.count({ where: { userId } }),
      db.safeZone.count({ where: { userId } }),
      db.arrivedSafe.count({ where: { userId } }),
    ]);

    // Check if profile is complete
    const profileComplete = !!(user?.phone && user?.name && user?.gender);

    // Calculate safety score
    const score = calculateSafetyScore({
      totalTrips,
      emergencyContactsCount,
      safeZonesCount,
      arrivedSafeCount,
      profileComplete,
    });

    // Determine score level
    let level = 'مبتدئ';
    if (score >= 80) level = 'آمن جداً';
    else if (score >= 60) level = 'آمن';
    else if (score >= 40) level = 'متوسط';
    else if (score >= 20) level = 'يحتاج تحسين';

    return NextResponse.json({
      success: true,
      score,
      level,
      breakdown: {
        trips: Math.min(30, totalTrips * 3),
        emergencyContacts: Math.min(25, emergencyContactsCount * 8),
        safeZones: Math.min(20, safeZonesCount * 5),
        arrivedSafe: Math.min(15, arrivedSafeCount * 3),
        profileComplete: profileComplete ? 10 : 0,
      },
    });
  } catch (error) {
    console.error('Error calculating safety score:', error);
    return NextResponse.json(
      { success: false, error: 'فشل في حساب درجة الأمان' },
      { status: 500 }
    );
  }
}
