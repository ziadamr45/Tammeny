import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

// GET - Get a single group with members
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'غير مصرح - يجب تسجيل الدخول' },
        { status: 401 }
      );
    }

    const { id } = await params;

    const group = await db.group.findUnique({
      where: { id },
      include: {
        members: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                avatar: true,
              },
            },
          },
        },
      },
    });

    if (!group) {
      return NextResponse.json(
        { success: false, error: 'المجموعة غير موجودة' },
        { status: 404 }
      );
    }

    // Check if user is a member
    const isMember = group.members.some((m) => m.userId === user.userId);
    if (!isMember) {
      return NextResponse.json(
        { success: false, error: 'غير مصرح لك بالوصول لهذه المجموعة' },
        { status: 403 }
      );
    }

    return NextResponse.json({
      success: true,
      group: {
        id: group.id,
        name: group.name,
        description: group.description,
        createdBy: group.createdBy,
        createdAt: group.createdAt,
        members: group.members.map((m) => ({
          id: m.id,
          userId: m.userId,
          name: m.user.name,
          avatar: m.user.avatar,
          role: m.role,
          joinedAt: m.joinedAt,
        })),
      },
    });
  } catch (error) {
    console.error('Error fetching group:', error);
    return NextResponse.json(
      { success: false, error: 'فشل في جلب المجموعة' },
      { status: 500 }
    );
  }
}

// PUT - Update a group (add member, etc.)
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'غير مصرح - يجب تسجيل الدخول' },
        { status: 401 }
      );
    }

    const { id } = await params;
    const body = await request.json();
    const { name, description, addMemberUserId, removeMemberId } = body;

    // Check if user is admin
    const membership = await db.groupMember.findFirst({
      where: { groupId: id, userId: user.userId },
    });

    if (!membership || membership.role !== 'admin') {
      return NextResponse.json(
        { success: false, error: 'فقط المشرف يمكنه تعديل المجموعة' },
        { status: 403 }
      );
    }

    // Update group details
    if (name || description !== undefined) {
      await db.group.update({
        where: { id },
        data: {
          name: name || undefined,
          description: description || null,
        },
      });
    }

    // Add member
    if (addMemberUserId) {
      await db.groupMember.create({
        data: {
          groupId: id,
          userId: addMemberUserId,
          role: 'member',
        },
      });
    }

    // Remove member
    if (removeMemberId) {
      await db.groupMember.delete({
        where: { id: removeMemberId },
      });
    }

    const updatedGroup = await db.group.findUnique({
      where: { id },
      include: {
        members: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                avatar: true,
              },
            },
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      group: updatedGroup ? {
        id: updatedGroup.id,
        name: updatedGroup.name,
        description: updatedGroup.description,
        createdBy: updatedGroup.createdBy,
        createdAt: updatedGroup.createdAt,
        members: updatedGroup.members.map((m) => ({
          id: m.id,
          userId: m.userId,
          name: m.user.name,
          avatar: m.user.avatar,
          role: m.role,
          joinedAt: m.joinedAt,
        })),
      } : null,
    });
  } catch (error) {
    console.error('Error updating group:', error);
    return NextResponse.json(
      { success: false, error: 'فشل في تحديث المجموعة' },
      { status: 500 }
    );
  }
}

// DELETE - Delete a group or leave group
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'غير مصرح - يجب تسجيل الدخول' },
        { status: 401 }
      );
    }

    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action'); // 'leave' or 'delete'

    if (action === 'leave') {
      // Leave the group
      await db.groupMember.deleteMany({
        where: {
          groupId: id,
          userId: user.userId,
        },
      });

      return NextResponse.json({
        success: true,
        message: 'تم مغادرة المجموعة بنجاح',
      });
    }

    // Delete the group entirely (admin only)
    const group = await db.group.findUnique({
      where: { id },
    });

    if (!group) {
      return NextResponse.json(
        { success: false, error: 'المجموعة غير موجودة' },
        { status: 404 }
      );
    }

    if (group.createdBy !== user.userId) {
      return NextResponse.json(
        { success: false, error: 'فقط منشئ المجموعة يمكنه حذفها' },
        { status: 403 }
      );
    }

    await db.group.delete({
      where: { id },
    });

    return NextResponse.json({
      success: true,
      message: 'تم حذف المجموعة بنجاح',
    });
  } catch (error) {
    console.error('Error deleting group:', error);
    return NextResponse.json(
      { success: false, error: 'فشل في حذف المجموعة' },
      { status: 500 }
    );
  }
}
