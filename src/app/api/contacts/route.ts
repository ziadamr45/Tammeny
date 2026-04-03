import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { DEMO_USER_ID } from '../demo-user/route';

// GET - List all contacts for a user
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId') || DEMO_USER_ID;

    const contacts = await db.contact.findMany({
      where: { userId },
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
      { success: false, error: 'Failed to fetch contacts' },
      { status: 500 }
    );
  }
}

// POST - Create a new contact
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, name, phone, email, relation, isFavorite, isEmergencyContact, notifyOnArrival, notifyOnEmergency } = body;

    if (!name) {
      return NextResponse.json(
        { success: false, error: 'الاسم مطلوب' },
        { status: 400 }
      );
    }

    const contact = await db.contact.create({
      data: {
        userId: userId || DEMO_USER_ID,
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
      { success: false, error: 'Failed to create contact' },
      { status: 500 }
    );
  }
}
