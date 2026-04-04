import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import { db } from '@/lib/db';

interface PendingAction {
  id: string;
  type: 'location_update' | 'check_in' | 'share_start' | 'share_end' | 'safe_zone';
  timestamp: string;
  description: string;
  data?: {
    latitude?: number;
    longitude?: number;
    sessionId?: string;
    name?: string;
    radius?: number;
    type?: string;
  };
}

// POST - Sync pending actions from offline mode
export async function POST(request: NextRequest) {
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
    const body = await request.json();
    const { actions } = body as { actions: PendingAction[] };

    if (!actions || !Array.isArray(actions)) {
      return NextResponse.json(
        { success: false, error: 'لا توجد إجراءات للمزامنة' },
        { status: 400 }
      );
    }

    const results = {
      success: 0,
      failed: 0,
      errors: [] as string[],
    };

    // Process each action
    for (const action of actions) {
      try {
        switch (action.type) {
          case 'check_in':
            // Create safety check-in
            await db.arrivedSafe.create({
              data: {
                userId,
                latitude: action.data?.latitude || 0,
                longitude: action.data?.longitude || 0,
                locationName: action.description || 'تحقق أمان (غير متصل)',
              },
            });
            results.success++;
            break;

          case 'safe_zone':
            // Create safe zone
            if (action.data?.latitude && action.data?.longitude) {
              await db.safeZone.create({
                data: {
                  userId,
                  name: action.data.name || 'منطقة آمنة',
                  latitude: action.data.latitude,
                  longitude: action.data.longitude,
                  radius: action.data.radius || 200,
                  type: action.data.type || 'other',
                },
              });
              results.success++;
            }
            break;

          case 'share_end':
            // Update session status
            if (action.data?.sessionId) {
              await db.session.update({
                where: { id: action.data.sessionId },
                data: {
                  status: 'completed',
                  completedAt: new Date(action.timestamp),
                },
              });
              results.success++;
            }
            break;

          case 'location_update':
            // Just log location update (already handled by real-time updates)
            results.success++;
            break;

          default:
            results.failed++;
            results.errors.push(`نوع إجراء غير معروف: ${action.type}`);
        }
      } catch (error) {
        results.failed++;
        results.errors.push(`فشل في معالجة: ${action.description}`);
        console.error(`Error processing action ${action.id}:`, error);
      }
    }

    return NextResponse.json({
      success: true,
      results,
      message: `تمت مزامنة ${results.success} من ${actions.length} إجراء`,
    });
  } catch (error) {
    console.error('Error syncing pending actions:', error);
    return NextResponse.json(
      { success: false, error: 'فشل في مزامنة الإجراءات' },
      { status: 500 }
    );
  }
}
