import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET - Get a single safe zone
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const safeZone = await db.safeZone.findUnique({
      where: { id },
    });

    if (!safeZone) {
      return NextResponse.json(
        { success: false, error: 'المنطقة الآمنة غير موجودة' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      safeZone: {
        id: safeZone.id,
        name: safeZone.name,
        type: safeZone.type,
        latitude: safeZone.latitude,
        longitude: safeZone.longitude,
        radius: safeZone.radius,
        color: safeZone.color,
        notifyOnEnter: safeZone.notifyOnEnter,
        notifyOnExit: safeZone.notifyOnExit,
        childAlertEnabled: safeZone.childAlertEnabled,
        childName: safeZone.childName,
        createdAt: safeZone.createdAt,
      },
    });
  } catch (error) {
    console.error('Error fetching safe zone:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch safe zone' },
      { status: 500 }
    );
  }
}

// PUT - Update a safe zone
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const {
      name,
      type,
      latitude,
      longitude,
      radius,
      color,
      notifyOnEnter,
      notifyOnExit,
      childAlertEnabled,
      childName,
    } = body;

    const safeZone = await db.safeZone.update({
      where: { id },
      data: {
        name: name || undefined,
        type: type || undefined,
        latitude: latitude ?? undefined,
        longitude: longitude ?? undefined,
        radius: radius ?? undefined,
        color: color || undefined,
        notifyOnEnter: notifyOnEnter ?? undefined,
        notifyOnExit: notifyOnExit ?? undefined,
        childAlertEnabled: childAlertEnabled ?? undefined,
        childName: childName !== undefined ? childName : undefined,
      },
    });

    return NextResponse.json({
      success: true,
      safeZone: {
        id: safeZone.id,
        name: safeZone.name,
        type: safeZone.type,
        latitude: safeZone.latitude,
        longitude: safeZone.longitude,
        radius: safeZone.radius,
        color: safeZone.color,
        notifyOnEnter: safeZone.notifyOnEnter,
        notifyOnExit: safeZone.notifyOnExit,
        childAlertEnabled: safeZone.childAlertEnabled,
        childName: safeZone.childName,
        createdAt: safeZone.createdAt,
      },
    });
  } catch (error) {
    console.error('Error updating safe zone:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update safe zone' },
      { status: 500 }
    );
  }
}

// DELETE - Delete a safe zone
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    await db.safeZone.delete({
      where: { id },
    });

    return NextResponse.json({
      success: true,
      message: 'تم حذف المنطقة الآمنة بنجاح',
    });
  } catch (error) {
    console.error('Error deleting safe zone:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete safe zone' },
      { status: 500 }
    );
  }
}
