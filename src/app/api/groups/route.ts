import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { DEMO_USER_ID } from '../demo-user/route';

// GET - List all groups for a user
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId') || DEMO_USER_ID;

    // Get groups where user is a member
    const groupMemberships = await db.groupMember.findMany({
      where: { userId },
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
      })),
    }));

    return NextResponse.json({
      success: true,
      groups,
    });
  } catch (error) {
    console.error('Error fetching groups:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch groups' },
      { status: 500 }
    );
  }
}

// POST - Create a new group
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, name, description } = body;

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
        createdBy: userId || DEMO_USER_ID,
        members: {
          create: {
            userId: userId || DEMO_USER_ID,
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
      { success: false, error: 'Failed to create group' },
      { status: 500 }
    );
  }
}
