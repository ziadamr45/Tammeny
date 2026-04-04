import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { db } from '@/lib/db';
import { encryptLocation, decryptLocation } from '@/lib/encryption';

// GET - Get user's last known location
export async function GET() {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'غير مسجل الدخول' },
        { status: 401 }
      );
    }

    // Get user's last location data
    const dbUser = await db.user.findUnique({
      where: { id: user.userId },
      select: {
        lastLocationData: true,
        lastLocationUpdated: true,
      },
    });

    if (!dbUser || !dbUser.lastLocationData) {
      return NextResponse.json({
        success: true,
        location: null,
        message: 'لا يوجد موقع محفوظ',
      });
    }

    // Decrypt location data
    const location = decryptLocation(dbUser.lastLocationData);

    if (!location) {
      return NextResponse.json({
        success: true,
        location: null,
        message: 'فشل في قراءة الموقع',
      });
    }

    return NextResponse.json({
      success: true,
      location: {
        lat: location.lat,
        lng: location.lng,
        name: location.name,
        timestamp: location.timestamp,
        accuracy: location.accuracy,
        updatedAt: dbUser.lastLocationUpdated,
      },
    });
  } catch (error) {
    console.error('Error getting last location:', error);
    return NextResponse.json(
      { success: false, error: 'حدث خطأ أثناء جلب الموقع' },
      { status: 500 }
    );
  }
}

// POST - Save user's current location
export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'غير مسجل الدخول' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { lat, lng, name, accuracy } = body;

    if (typeof lat !== 'number' || typeof lng !== 'number') {
      return NextResponse.json(
        { success: false, error: 'البيانات غير صحيحة' },
        { status: 400 }
      );
    }

    // Encrypt location data before storing
    const encryptedLocation = encryptLocation({
      lat,
      lng,
      name: name || 'موقعك الحالي',
      accuracy: accuracy || undefined,
      timestamp: Date.now(),
    });

    // Update user's last location
    await db.user.update({
      where: { id: user.userId },
      data: {
        lastLocationData: encryptedLocation,
        lastLocationUpdated: new Date(),
      },
    });

    return NextResponse.json({
      success: true,
      message: 'تم حفظ الموقع بنجاح',
    });
  } catch (error) {
    console.error('Error saving location:', error);
    return NextResponse.json(
      { success: false, error: 'حدث خطأ أثناء حفظ الموقع' },
      { status: 500 }
    );
  }
}
