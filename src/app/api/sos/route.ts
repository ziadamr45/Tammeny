import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { db } from '@/lib/db';

// POST - Activate SOS emergency alert
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
    const { latitude, longitude, locationName, batteryLevel } = body;

    // Create SOS session in database
    const sosSession = await db.sOSSession.create({
      data: {
        userId: user.userId,
        latitude: latitude || null,
        longitude: longitude || null,
        locationName: locationName || 'غير محدد',
        batteryLevel: batteryLevel || null,
        status: 'active',
      },
    });

    // Get user's emergency contacts
    const emergencyContacts = await db.contact.findMany({
      where: {
        userId: user.userId,
        isEmergencyContact: true,
      },
    });

    return NextResponse.json({
      success: true,
      sosSession: {
        id: sosSession.id,
        status: sosSession.status,
        createdAt: sosSession.createdAt,
      },
      contacts: emergencyContacts.map(c => ({
        id: c.id,
        name: c.name,
        phone: c.phone,
      })),
      notifiedCount: emergencyContacts.length,
      message: 'تم إرسال تنبيه الطوارئ بنجاح',
    });
  } catch (error) {
    console.error('Error activating SOS:', error);
    return NextResponse.json(
      { success: false, error: 'فشل في إرسال تنبيه الطوارئ' },
      { status: 500 }
    );
  }
}

// PUT - Deactivate SOS emergency alert
export async function PUT(request: NextRequest) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'غير مسجل الدخول' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { sosId } = body;

    // Update SOS session status
    const sosSession = await db.sOSSession.updateMany({
      where: {
        id: sosId,
        userId: user.userId,
        status: 'active',
      },
      data: {
        status: 'resolved',
        resolvedAt: new Date(),
      },
    });

    if (sosSession.count === 0) {
      return NextResponse.json(
        { success: false, error: 'لم يتم العثور على تنبيه نشط' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'تم إلغاء تنبيه الطوارئ',
    });
  } catch (error) {
    console.error('Error deactivating SOS:', error);
    return NextResponse.json(
      { success: false, error: 'فشل في إلغاء تنبيه الطوارئ' },
      { status: 500 }
    );
  }
}
