import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { db } from '@/lib/db';

// GET - Get user's conversations or messages for a specific session
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'غير مسجل الدخول' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get('sessionId');

    // If sessionId is provided, return messages for that session
    if (sessionId) {
      const session = await db.session.findFirst({
        where: {
          id: sessionId,
          OR: [
            { creatorId: user.userId },
            { allowedUsers: { some: { userId: user.userId } } }
          ]
        },
        include: {
          messages: {
            include: {
              sender: {
                select: { id: true, name: true, avatar: true }
              }
            },
            orderBy: { createdAt: 'asc' }
          }
        }
      });

      if (!session) {
        return NextResponse.json(
          { success: false, error: 'المحادثة غير موجودة' },
          { status: 404 }
        );
      }

      // Mark messages as read
      await db.message.updateMany({
        where: {
          sessionId,
          isRead: false,
          senderId: { not: user.userId }
        },
        data: { isRead: true, readAt: new Date() }
      });

      const formattedMessages = session.messages.map(msg => ({
        id: msg.id,
        sender: msg.senderId === user.userId ? 'me' : msg.sender.name,
        senderId: msg.senderId,
        text: msg.content,
        type: msg.type,
        time: formatTimeAgo(msg.createdAt),
        status: msg.isRead ? 'read' : 'sent',
        createdAt: msg.createdAt
      }));

      return NextResponse.json({
        success: true,
        messages: formattedMessages,
      });
    }

    // Get all sessions where user is creator
    const sessions = await db.session.findMany({
      where: { creatorId: user.userId },
      include: {
        messages: {
          include: {
            sender: {
              select: { id: true, name: true, avatar: true }
            }
          },
          orderBy: { createdAt: 'desc' },
          take: 1
        },
        allowedUsers: true
      },
      orderBy: { startedAt: 'desc' }
    });

    // Get user info for allowed users
    const allowedUserIds = sessions.flatMap(s => 
      s.allowedUsers.filter(a => a.userId).map(a => a.userId as string)
    );
    const users = await db.user.findMany({
      where: { id: { in: allowedUserIds } },
      select: { id: true, name: true, avatar: true }
    });
    const userMap = new Map(users.map(u => [u.id, u]));

    // Build conversations list
    const conversations: {
      id: string;
      sessionId: string;
      name: string;
      avatar: string | null;
      lastMessage: string;
      time: string;
      unread: number;
      online: boolean;
    }[] = [];

    for (const session of sessions) {
      if (session.allowedUsers.length > 0) {
        for (const allowed of session.allowedUsers) {
          if (allowed.userId) {
            const userData = userMap.get(allowed.userId);
            if (userData) {
              const lastMessage = session.messages[0];
              conversations.push({
                id: allowed.id,
                sessionId: session.id,
                name: userData.name,
                avatar: userData.avatar,
                lastMessage: lastMessage?.content || 'بدأت مشاركة الموقع',
                time: lastMessage ? formatTimeAgo(lastMessage.createdAt) : formatTimeAgo(session.startedAt),
                unread: session.messages.filter(m => !m.isRead && m.senderId !== user.userId).length,
                online: false, // Would need real-time status
              });
            }
          }
        }
      }
    }

    return NextResponse.json({
      success: true,
      conversations,
    });
  } catch (error) {
    console.error('Error getting conversations:', error);
    return NextResponse.json(
      { success: false, error: 'حدث خطأ' },
      { status: 500 }
    );
  }
}

// POST - Send a message
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'غير مسجل الدخول' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { sessionId, content, receiverId, type } = body;

    if (!sessionId || !content) {
      return NextResponse.json(
        { success: false, error: 'البيانات غير مكتملة' },
        { status: 400 }
      );
    }

    // Create message
    const message = await db.message.create({
      data: {
        sessionId,
        senderId: user.userId,
        receiverId: receiverId || null,
        content,
        type: type || 'text',
      },
      include: {
        sender: {
          select: { id: true, name: true, avatar: true }
        }
      }
    });

    return NextResponse.json({
      success: true,
      message,
    });
  } catch (error) {
    console.error('Error sending message:', error);
    return NextResponse.json(
      { success: false, error: 'حدث خطأ' },
      { status: 500 }
    );
  }
}

// Helper function to format time ago
function formatTimeAgo(date: Date): string {
  const now = new Date();
  const diff = now.getTime() - new Date(date).getTime();
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 1) return 'الآن';
  if (minutes < 60) return `منذ ${minutes} دقيقة`;
  if (hours < 24) return `منذ ${hours} ساعة`;
  if (days < 7) return `منذ ${days} يوم`;
  return new Date(date).toLocaleDateString('ar-EG');
}
