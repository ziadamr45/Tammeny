import { NextRequest, NextResponse } from 'next/server';
import { verifyToken, getCurrentUser } from '@/lib/auth';
import { db } from '@/lib/db';

// GET - Get current user profile
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

    // Get user data
    const user = await db.user.findUnique({
      where: { id: decoded.userId },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        avatar: true,
        gender: true,
        address: true,
        stealthMode: true,
        notificationsEnabled: true,
        createdAt: true,
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
      user,
    });
  } catch (error) {
    console.error('Error getting user profile:', error);
    return NextResponse.json(
      { success: false, error: 'فشل في الحصول على بيانات المستخدم' },
      { status: 500 }
    );
  }
}

// PUT - Update user profile
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
    const { name, email, phone, avatar, gender, address, notifications, ghostMode } = body;

    // Build update object with only provided fields
    const updateData: Record<string, string | boolean | null> = {};
    
    if (name !== undefined) {
      updateData.name = name;
    }
    if (email !== undefined) {
      updateData.email = email;
    }
    if (phone !== undefined) {
      updateData.phone = phone;
    }
    if (avatar !== undefined) {
      updateData.avatar = avatar;
    }
    if (gender !== undefined) {
      updateData.gender = gender;
    }
    if (address !== undefined) {
      updateData.address = address;
    }
    if (notifications !== undefined) {
      updateData.notificationsEnabled = notifications;
    }
    if (ghostMode !== undefined) {
      updateData.stealthMode = ghostMode;
    }

    // Update user profile
    const updatedUser = await db.user.update({
      where: { id: decoded.userId },
      data: updateData,
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        avatar: true,
        gender: true,
        address: true,
        stealthMode: true,
        notificationsEnabled: true,
      },
    });

    return NextResponse.json({
      success: true,
      user: updatedUser,
      message: 'تم حفظ التغييرات بنجاح',
    });
  } catch (error) {
    console.error('Error updating user profile:', error);
    return NextResponse.json(
      { success: false, error: 'فشل في حفظ التغييرات' },
      { status: 500 }
    );
  }
}

// DELETE - Delete user account
export async function DELETE() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ success: false, error: 'غير مسجل الدخول' }, { status: 401 });
    }
    // Cascade deletes handle related records
    await db.user.delete({ where: { id: user.userId } });
    return NextResponse.json({ success: true, message: 'تم حذف الحساب بنجاح' });
  } catch (error) {
    console.error('Error deleting account:', error);
    return NextResponse.json({ success: false, error: 'حدث خطأ أثناء حذف الحساب' }, { status: 500 });
  }
}
