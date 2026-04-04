import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { extractSessionId } from "@/lib/encryption";
import { haversineDistance, calculateETA } from "@/lib/geo";

// Update location for a session
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { encryptedId, lat, lng, speed, accuracy } = body;

    if (!encryptedId || !lat || !lng) {
      return NextResponse.json(
        { error: "البيانات غير مكتملة" },
        { status: 400 }
      );
    }

    // Extract session ID
    const sessionId = extractSessionId(encryptedId);
    if (!sessionId) {
      return NextResponse.json(
        { error: "رابط غير صالح" },
        { status: 400 }
      );
    }

    // Get session
    const session = await db.session.findUnique({
      where: { id: sessionId },
    });

    if (!session || session.status !== "active") {
      return NextResponse.json(
        { error: "الجلسة غير نشطة" },
        { status: 400 }
      );
    }

    // Calculate distance traveled
    const lastLat = session.currentLat || session.startLat;
    const lastLng = session.currentLng || session.startLng;
    const distanceIncrement = haversineDistance(lastLat, lastLng, lat, lng);

    // Update session
    const updatedSession = await db.session.update({
      where: { id: sessionId },
      data: {
        currentLat: lat,
        currentLng: lng,
        lastUpdatedAt: new Date(),
        totalDistance: session.totalDistance + distanceIncrement,
        totalDuration: session.totalDuration + 5, // Assuming 5-second intervals
      },
    });

    // Save location point
    await db.locationPoint.create({
      data: {
        sessionId,
        lat,
        lng,
        speed: speed || null,
        accuracy: accuracy || null,
      },
    });

    // Calculate ETA if destination exists
    let eta: number | null = null;
    if (session.destLat && session.destLng) {
      const distance = haversineDistance(lat, lng, session.destLat, session.destLng);
      eta = calculateETA(distance, speed ? speed * 3.6 : 30); // Convert m/s to km/h

      // Check if arrived
      if (distance < 0.1) { // Within 100 meters
        await db.session.update({
          where: { id: sessionId },
          data: {
            status: "completed",
            completedAt: new Date(),
          },
        });
      }
    }

    return NextResponse.json({
      success: true,
      eta,
      totalDistance: updatedSession.totalDistance,
    });
  } catch (error) {
    console.error("Update location error:", error);
    return NextResponse.json(
      { error: "حدث خطأ أثناء تحديث الموقع" },
      { status: 500 }
    );
  }
}

// Get current location for a session (for viewer)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const encryptedId = searchParams.get("id");

    if (!encryptedId) {
      return NextResponse.json(
        { error: "معرف الجلسة مطلوب" },
        { status: 400 }
      );
    }

    // Extract session ID
    const sessionId = extractSessionId(encryptedId);
    if (!sessionId) {
      return NextResponse.json(
        { error: "رابط غير صالح" },
        { status: 400 }
      );
    }

    // Get session
    const session = await db.session.findUnique({
      where: { id: sessionId },
      include: {
        creator: {
          select: {
            name: true,
            avatar: true,
          },
        },
      },
    });

    if (!session) {
      return NextResponse.json(
        { error: "الجلسة غير موجودة" },
        { status: 404 }
      );
    }

    // Check if session is expired
    if (session.expiresAt && new Date() > session.expiresAt) {
      await db.session.update({
        where: { id: sessionId },
        data: { status: "expired" },
      });
      return NextResponse.json({
        ...session,
        status: "expired",
      });
    }

    // Calculate current distance and ETA
    let distance = 0;
    let eta: number | null = null;
    
    if (session.destLat && session.destLng && session.currentLat && session.currentLng) {
      distance = haversineDistance(
        session.currentLat,
        session.currentLng,
        session.destLat,
        session.destLng
      );
      eta = calculateETA(distance);
    }

    return NextResponse.json({
      session: {
        id: session.id,
        encryptedId: session.encryptedId,
        status: session.status,
        creatorName: session.creator.name,
        creatorAvatar: session.creator.avatar,
        currentLat: session.currentLat 
          ? (session.isGhostMode 
            ? Math.round(session.currentLat * 100) / 100 
            : session.currentLat)
          : null,
        currentLng: session.currentLng 
          ? (session.isGhostMode 
            ? Math.round(session.currentLng * 100) / 100 
            : session.currentLng)
          : null,
        destLat: session.destLat,
        destLng: session.destLng,
        destName: session.destName,
        distance,
        eta,
        isGhostMode: session.isGhostMode,
        startedAt: session.startedAt,
        expiresAt: session.expiresAt,
      },
    });
  } catch (error) {
    console.error("Get location error:", error);
    return NextResponse.json(
      { error: "حدث خطأ أثناء جلب الموقع" },
      { status: 500 }
    );
  }
}
