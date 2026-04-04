import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { getAblyTokenRequest } from '@/lib/ably';

// GET - Get Ably token for real-time communication
export async function GET() {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'غير مسجل الدخول' },
        { status: 401 }
      );
    }

    const tokenRequest = await getAblyTokenRequest(user.userId);

    // Return the token request object that Ably client can use directly
    return NextResponse.json({
      success: true,
      token: tokenRequest,
      clientId: user.userId,
    });
  } catch (error) {
    console.error('Error generating Ably token:', error);
    return NextResponse.json(
      { success: false, error: 'فشل في إنشاء رمز الاتصال' },
      { status: 500 }
    );
  }
}
