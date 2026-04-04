import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { verifyToken } from '@/lib/auth';

// PUT - Update user settings
export async function PUT(request: NextRequest) {
  try {
    // Get token from cookies
    const token = request.cookies.get('auth-token')?.value;
    
    if (!token) {
      return NextResponse.json(
        { success: false, error: 'غير مصرح' },
        { status: 401 }
      );
    }

    // Verify token
    const decoded = await verifyToken(token);
    if (!decoded || !decoded.userId) {
      return NextResponse.json(
        { success: false, error: 'جلسة غير صالحة' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { stealthMode, darkMode, batterySaver, notificationsEnabled, language } = body;

    // Build update object with only provided fields
    const updateData: Record<string, boolean | string> = {};
    
    if (typeof stealthMode === 'boolean') {
      updateData.stealthMode = stealthMode;
    }
    if (typeof darkMode === 'boolean') {
      updateData.darkMode = darkMode;
    }
    if (typeof batterySaver === 'boolean') {
      updateData.batterySaver = batterySaver;
    }
    if (typeof notificationsEnabled === 'boolean') {
      updateData.notificationsEnabled = notificationsEnabled;
    }
    if (typeof language === 'string' && (language === 'ar' || language === 'en')) {
      updateData.language = language;
    }

    // Update user settings
    const updatedUser = await db.user.update({
      where: { id: decoded.userId },
      data: updateData,
      select: {
        id: true,
        language: true,
        stealthMode: true,
        darkMode: true,
        batterySaver: true,
        notificationsEnabled: true,
      },
    });

    return NextResponse.json({
      success: true,
      user: updatedUser,
    });
  } catch (error) {
    console.error('Error updating user settings:', error);
    return NextResponse.json(
      { success: false, error: 'فشل في تحديث الإعدادات' },
      { status: 500 }
    );
  }
}

// GET - Get user settings
export async function GET(request: NextRequest) {
  try {
    // Get token from cookies
    const token = request.cookies.get('auth-token')?.value;
    
    if (!token) {
      return NextResponse.json(
        { success: false, error: 'غير مصرح' },
        { status: 401 }
      );
    }

    // Verify token
    const decoded = await verifyToken(token);
    if (!decoded || !decoded.userId) {
      return NextResponse.json(
        { success: false, error: 'جلسة غير صالحة' },
        { status: 401 }
      );
    }

    // Get user settings
    const user = await db.user.findUnique({
      where: { id: decoded.userId },
      select: {
        id: true,
        language: true,
        stealthMode: true,
        darkMode: true,
        batterySaver: true,
        notificationsEnabled: true,
      },
    });

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'المستخدم غير موجود' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      settings: user,
    });
  } catch (error) {
    console.error('Error getting user settings:', error);
    return NextResponse.json(
      { success: false, error: 'فشل في الحصول على الإعدادات' },
      { status: 500 }
    );
  }
}
