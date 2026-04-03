import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { generateEncryptedId, generateAccessToken } from "@/lib/encryption";

// Create a new session
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    
    const body = await request.json();
    const {
      duration,
      sessionType,
      startLat,
      startLng,
      destLat,
      destLng,
      destName,
      isGhostMode,
      isRestricted,
      allowedEmails,
    } = body;

    // Validation
    if (!duration || !startLat || !startLng) {
      return NextResponse.json(
        { error: "المدة والموقع الحالي مطلوبان" },
        { status: 400 }
      );
    }

    // Determine expiration time
    let expiresAt: Date | null = null;
    if (duration > 0) {
      expiresAt = new Date(Date.now() + duration * 60 * 1000);
    } else {
      // Until arrival - max 24 hours
      expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
    }

    // Create session
    const session = await db.session.create({
      data: {
        creatorId: user?.userId || "demo-user",
        encryptedId: "", // Will be updated after creation
        duration,
        sessionType: sessionType || "minutes",
        startLat,
        startLng,
        currentLat: startLat,
        currentLng: startLng,
        destLat: destLat || null,
        destLng: destLng || null,
        destName: destName || null,
        isGhostMode: isGhostMode || false,
        isRestricted: isRestricted || false,
        expiresAt,
      },
    });

    // Generate encrypted ID
    const encryptedId = generateEncryptedId(session.id);
    
    // Update session with encrypted ID
    await db.session.update({
      where: { id: session.id },
      data: { encryptedId },
    });

    // If restricted, create allowed users
    if (isRestricted && allowedEmails?.length > 0) {
      await db.allowedUser.createMany({
        data: allowedEmails.map((email: string) => ({
          sessionId: session.id,
          email,
          token: generateAccessToken(),
        })),
      });
    }

    // Generate share message
    const shareUrl = `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/share/${encodeURIComponent(encryptedId)}`;
    const durationText = duration === -1 
      ? "حتى الوصول" 
      : duration >= 60 
        ? `${duration / 60} ساعة` 
        : `${duration} دقيقة`;
    
    const shareMessage = `أنا مشارك موقعي معاك لمدة ${durationText} ⏱️
تابعني لحظة بلحظة من هنا 👇
${shareUrl}
ولو الرابط فتح عندك متأخر، حمّل التطبيق عشان تشوفني مباشر 📍`;

    return NextResponse.json({
      session: {
        id: session.id,
        encryptedId,
        shareUrl,
        shareMessage,
        expiresAt,
      },
    });
  } catch (error) {
    console.error("Create session error:", error);
    return NextResponse.json(
      { error: "حدث خطأ أثناء إنشاء الجلسة" },
      { status: 500 }
    );
  }
}

// Get sessions for current user
export async function GET() {
  try {
    const user = await getCurrentUser();
    
    if (!user) {
      return NextResponse.json(
        { error: "غير مصرح" },
        { status: 401 }
      );
    }

    const sessions = await db.session.findMany({
      where: { creatorId: user.userId },
      orderBy: { startedAt: "desc" },
      take: 20,
    });

    return NextResponse.json({ sessions });
  } catch (error) {
    console.error("Get sessions error:", error);
    return NextResponse.json(
      { error: "حدث خطأ أثناء جلب الجلسات" },
      { status: 500 }
    );
  }
}
