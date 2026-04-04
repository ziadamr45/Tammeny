import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

// GET - List all contacts for a user
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'غير مصرح - يجب تسجيل الدخول' },
        { status: 401 }
      );
    }

    const contacts = await db.contact.findMany({
      where: { userId: user.userId },
      orderBy: [
        { isFavorite: 'desc' },
        { createdAt: 'desc' },
      ],
    });

    return NextResponse.json({
      success: true,
      contacts: contacts.map((c) => ({
        id: c.id,
        name: c.name,
        phone: c.phone,
        email: c.email,
        relation: c.relation,
        isFavorite: c.isFavorite,
        isEmergencyContact: c.isEmergencyContact,
        notifyOnArrival: c.notifyOnArrival,
        notifyOnEmergency: c.notifyOnEmergency,
        createdAt: c.createdAt,
      })),
    });
  } catch (error) {
    console.error('Error fetching contacts:', error);
    return NextResponse.json(
      { success: false, error: 'فشل في جلب جهات الاتصال' },
      { status: 500 }
    );
  }
}

// POST - Create a new contact
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'غير مصرح - يجب تسجيل الدخول' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { name, phone, email, relation, isFavorite, isEmergencyContact, notifyOnArrival, notifyOnEmergency } = body;

    if (!name) {
      return NextResponse.json(
        { success: false, error: 'الاسم مطلوب' },
        { status: 400 }
      );
    }

    const contact = await db.contact.create({
      data: {
        userId: user.userId,
        name,
        phone: phone || null,
        email: email || null,
        relation: relation || null,
        isFavorite: isFavorite || false,
        isEmergencyContact: isEmergencyContact || false,
        notifyOnArrival: notifyOnArrival || false,
        notifyOnEmergency: notifyOnEmergency ?? true,
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
    console.error('Error creating contact:', error);
    return NextResponse.json(
      { success: false, error: 'فشل في إنشاء جهة الاتصال' },
      { status: 500 }
    );
  }
}
