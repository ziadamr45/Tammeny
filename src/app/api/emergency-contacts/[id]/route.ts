import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET - Get a single emergency contact
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const emergencyContact = await db.emergencyContact.findUnique({
      where: { id },
    });

    if (!emergencyContact) {
      return NextResponse.json(
        { success: false, error: 'جهة الاتصال غير موجودة' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      emergencyContact: {
        id: emergencyContact.id,
        name: emergencyContact.name,
        phone: emergencyContact.phone,
        relation: emergencyContact.relation,
        priority: emergencyContact.priority,
        createdAt: emergencyContact.createdAt,
      },
    });
  } catch (error) {
    console.error('Error fetching emergency contact:', error);
    return NextResponse.json(
      { success: false, error: 'فشل في الحصول على جهة الاتصال' },
      { status: 500 }
    );
  }
}

// PUT - Update an emergency contact
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { name, phone, relation, priority, isFavorite, notifyOnEmergency, notifyOnArrival } = body;

    const emergencyContact = await db.emergencyContact.update({
      where: { id },
      data: {
        name,
        phone,
        relation: relation || null,
        priority: priority ?? undefined,
      },
    });

    // If isFavorite, notifyOnEmergency, or notifyOnArrival are provided, update the related contact
    if (isFavorite !== undefined || notifyOnEmergency !== undefined || notifyOnArrival !== undefined) {
      if (emergencyContact.contactId) {
        await db.contact.update({
          where: { id: emergencyContact.contactId },
          data: {
            isFavorite: isFavorite ?? undefined,
            notifyOnEmergency: notifyOnEmergency ?? undefined,
            notifyOnArrival: notifyOnArrival ?? undefined,
          },
        });
      }
    }

    return NextResponse.json({
      success: true,
      emergencyContact: {
        id: emergencyContact.id,
        name: emergencyContact.name,
        phone: emergencyContact.phone,
        relation: emergencyContact.relation,
        priority: emergencyContact.priority,
        createdAt: emergencyContact.createdAt,
      },
    });
  } catch (error) {
    console.error('Error updating emergency contact:', error);
    return NextResponse.json(
      { success: false, error: 'فشل في تحديث جهة الاتصال' },
      { status: 500 }
    );
  }
}

// DELETE - Delete an emergency contact
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    await db.emergencyContact.delete({
      where: { id },
    });

    return NextResponse.json({
      success: true,
      message: 'تم حذف جهة الاتصال بنجاح',
    });
  } catch (error) {
    console.error('Error deleting emergency contact:', error);
    return NextResponse.json(
      { success: false, error: 'فشل في حذف جهة الاتصال' },
      { status: 500 }
    );
  }
}
