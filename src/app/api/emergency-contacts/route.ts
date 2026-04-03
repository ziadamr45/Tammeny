import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { DEMO_USER_ID } from '../demo-user/route';

// GET - List all emergency contacts for a user
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId') || DEMO_USER_ID;

    const emergencyContacts = await db.emergencyContact.findMany({
      where: { userId },
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
      { success: false, error: 'Failed to fetch emergency contacts' },
      { status: 500 }
    );
  }
}

// POST - Create a new emergency contact
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, name, phone, relation, priority, contactId } = body;

    if (!name || !phone) {
      return NextResponse.json(
        { success: false, error: 'الاسم ورقم الهاتف مطلوبان' },
        { status: 400 }
      );
    }

    const emergencyContact = await db.emergencyContact.create({
      data: {
        userId: userId || DEMO_USER_ID,
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
      { success: false, error: 'Failed to create emergency contact' },
      { status: 500 }
    );
  }
}
