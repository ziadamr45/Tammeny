import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import { db } from '@/lib/db';

// Achievement definitions
const ACHIEVEMENTS = [
  {
    id: 'safe-traveler',
    title: 'المسافر الآمن',
    description: 'أكمل 10 رحلات بنجاح',
    icon: 'plane',
    total: 10,
  },
  {
    id: 'emergency-contact',
    title: 'جهة اتصال طوارئ',
    description: 'أضف 3 جهات اتصال للطوارئ',
    icon: 'phone',
    total: 3,
  },
  {
    id: 'explorer',
    title: 'المستكشف',
    description: 'زر 5 وجهات مختلفة',
    icon: 'compass',
    total: 5,
  },
  {
    id: 'safe-zone',
    title: 'المنطقة الآمنة',
    description: 'أنشئ 4 مناطق آمنة',
    icon: 'shield',
    total: 4,
  },
  {
    id: 'sharer',
    title: 'شارك وكسب',
    description: 'شارك موقعك 15 مرة',
    icon: 'share',
    total: 15,
  },
  {
    id: 'arrived-safe',
    title: 'وصلت سالم',
    description: 'سجل 5 وصولات سليمة',
    icon: 'check-circle',
    total: 5,
  },
];

// GET - Get user achievements
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

    // Get counts for each achievement type
    const [
      sessionsCount,
      emergencyContactsCount,
      safeZonesCount,
      arrivedSafeCount,
      distinctDestinations,
    ] = await Promise.all([
      // Completed sessions
      db.session.count({
        where: { creatorId: userId, status: 'completed' },
      }),
      // Emergency contacts
      db.emergencyContact.count({
        where: { userId },
      }),
      // Safe zones
      db.safeZone.count({
        where: { userId },
      }),
      // Arrived safe records
      db.arrivedSafe.count({
        where: { userId },
      }),
      // Distinct destinations
      db.session.findMany({
        where: { creatorId: userId, destName: { not: null } },
        select: { destName: true },
        distinct: ['destName'],
      }),
    ]);

    // Total sessions created
    const totalSessions = await db.session.count({
      where: { creatorId: userId },
    });

    // Calculate achievement progress
    const achievements = ACHIEVEMENTS.map((achievement) => {
      let progress = 0;

      switch (achievement.id) {
        case 'safe-traveler':
          progress = sessionsCount;
          break;
        case 'emergency-contact':
          progress = emergencyContactsCount;
          break;
        case 'explorer':
          progress = distinctDestinations.length;
          break;
        case 'safe-zone':
          progress = safeZonesCount;
          break;
        case 'sharer':
          progress = totalSessions;
          break;
        case 'arrived-safe':
          progress = arrivedSafeCount;
          break;
      }

      const unlocked = progress >= achievement.total;

      return {
        id: achievement.id,
        title: achievement.title,
        description: achievement.description,
        icon: achievement.icon,
        progress: Math.min(progress, achievement.total),
        total: achievement.total,
        unlocked,
      };
    });

    // Calculate total points
    const totalPoints = achievements.reduce((acc, a) => {
      return acc + (a.unlocked ? a.total * 10 : a.progress * 2);
    }, 0);

    return NextResponse.json({
      success: true,
      achievements,
      totalPoints,
    });
  } catch (error) {
    console.error('Error getting achievements:', error);
    return NextResponse.json(
      { success: false, error: 'فشل في الحصول على الإنجازات' },
      { status: 500 }
    );
  }
}
