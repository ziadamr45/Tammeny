import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

// GET - List all groups for a user
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'غير مصرح - يجب تسجيل الدخول' },
        { status: 401 }
      );
    }

    // Get groups where user is a member
    const groupMemberships = await db.groupMember.findMany({
      where: { userId: user.userId },
      include: {
        group: {
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
        },
      },
    });

    // Get active sessions to determine online status
    const activeSessions = await db.session.findMany({
      where: {
        status: 'active',
        creatorId: { in: groupMemberships.flatMap(gm => gm.group.members.map(m => m.userId)) }
      },
      select: { creatorId: true }
    });
    const onlineUserIds = new Set(activeSessions.map(s => s.creatorId));

    const groups = groupMemberships.map((gm) => ({
      id: gm.group.id,
      name: gm.group.name,
      description: gm.group.description,
      createdBy: gm.group.createdBy,
      createdAt: gm.group.createdAt,
      userRole: gm.role,
      members: gm.group.members.map((m) => ({
        id: m.id,
        userId: m.userId,
        name: m.user.name,
        avatar: m.user.avatar,
        role: m.role,
        joinedAt: m.joinedAt,
        isOnline: onlineUserIds.has(m.userId),
      })),
      onlineCount: gm.group.members.filter(m => onlineUserIds.has(m.userId)).length,
    }));

    return NextResponse.json({
      success: true,
      groups,
    });
  } catch (error) {
    console.error('Error fetching groups:', error);
    return NextResponse.json(
      { success: false, error: 'فشل في جلب المجموعات' },
      { status: 500 }
    );
  }
}

// POST - Create a new group
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
    const { name, description } = body;

    if (!name) {
      return NextResponse.json(
        { success: false, error: 'اسم المجموعة مطلوب' },
        { status: 400 }
      );
    }

    const group = await db.group.create({
      data: {
        name,
        description: description || null,
        createdBy: user.userId,
        members: {
          create: {
            userId: user.userId,
            role: 'admin',
          },
        },
      },
      include: {
        members: true,
      },
    });

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
          role: m.role,
          joinedAt: m.joinedAt,
        })),
      },
    });
  } catch (error) {
    console.error('Error creating group:', error);
    return NextResponse.json(
      { success: false, error: 'فشل في إنشاء المجموعة' },
      { status: 500 }
    );
  }
}
