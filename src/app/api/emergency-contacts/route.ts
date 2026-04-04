import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

// GET - List all emergency contacts for a user
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'غير مصرح - يجب تسجيل الدخول' },
        { status: 401 }
      );
    }

    const emergencyContacts = await db.emergencyContact.findMany({
      where: { userId: user.userId },
      orderBy: [
        { priority: 'asc' },
        { createdAt: 'desc' },
      ],
    });

    return NextResponse.json({
      success: true,
      emergencyContacts: emergencyContacts.map((c) => ({
        id: c.id,
        name: c.name,
        phone: c.phone,
        relation: c.relation,
        priority: c.priority,
        createdAt: c.createdAt,
      })),
    });
  } catch (error) {
    console.error('Error fetching emergency contacts:', error);
    return NextResponse.json(
      { success: false, error: 'فشل في جلب جهات الطوارئ' },
      { status: 500 }
    );
  }
}

// POST - Create a new emergency contact
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
    const { name, phone, relation, priority, contactId } = body;

    if (!name || !phone) {
      return NextResponse.json(
        { success: false, error: 'الاسم ورقم الهاتف مطلوبان' },
        { status: 400 }
      );
    }

    const emergencyContact = await db.emergencyContact.create({
      data: {
        userId: user.userId,
        name,
        phone,
        relation: relation || null,
        priority: priority || 1,
        contactId: contactId || null,
      },
    });

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
    console.error('Error creating emergency contact:', error);
    return NextResponse.json(
      { success: false, error: 'فشل في إنشاء جهة الطوارئ' },
      { status: 500 }
    );
  }
}
