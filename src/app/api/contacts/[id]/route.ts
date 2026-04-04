import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET - Get a single contact
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const contact = await db.contact.findUnique({
      where: { id },
    });

    if (!contact) {
      return NextResponse.json(
        { success: false, error: 'جهة الاتصال غير موجودة' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      contact: {
        id: contact.id,
        name: contact.name,
        phone: contact.phone,
        email: contact.email,
        relation: contact.relation,
        isFavorite: contact.isFavorite,
        isEmergencyContact: contact.isEmergencyContact,
        notifyOnArrival: contact.notifyOnArrival,
        notifyOnEmergency: contact.notifyOnEmergency,
        createdAt: contact.createdAt,
      },
    });
  } catch (error) {
    console.error('Error fetching contact:', error);
    return NextResponse.json(
      { success: false, error: 'فشل في الحصول على جهة الاتصال' },
      { status: 500 }
    );
  }
}

// PUT - Update a contact
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { name, phone, email, relation, isFavorite, isEmergencyContact, notifyOnArrival, notifyOnEmergency } = body;

    const contact = await db.contact.update({
      where: { id },
      data: {
        name,
        phone: phone || null,
        email: email || null,
        relation: relation || null,
        isFavorite: isFavorite ?? undefined,
        isEmergencyContact: isEmergencyContact ?? undefined,
        notifyOnArrival: notifyOnArrival ?? undefined,
        notifyOnEmergency: notifyOnEmergency ?? undefined,
      },
    });

    return NextResponse.json({
      success: true,
      contact: {
        id: contact.id,
        name: contact.name,
        phone: contact.phone,
        email: contact.email,
        relation: contact.relation,
        isFavorite: contact.isFavorite,
        isEmergencyContact: contact.isEmergencyContact,
        notifyOnArrival: contact.notifyOnArrival,
        notifyOnEmergency: contact.notifyOnEmergency,
        createdAt: contact.createdAt,
      },
    });
  } catch (error) {
    console.error('Error updating contact:', error);
    return NextResponse.json(
      { success: false, error: 'فشل في تحديث جهة الاتصال' },
      { status: 500 }
    );
  }
}

// DELETE - Delete a contact
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    await db.contact.delete({
      where: { id },
    });

    return NextResponse.json({
      success: true,
      message: 'تم حذف جهة الاتصال بنجاح',
    });
  } catch (error) {
    console.error('Error deleting contact:', error);
    return NextResponse.json(
      { success: false, error: 'فشل في حذف جهة الاتصال' },
      { status: 500 }
    );
  }
}
