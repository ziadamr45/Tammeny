import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { verifyToken } from "@/lib/auth";

// GET - Get user's arrived safe history
export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get("auth-token")?.value;
    
    if (!token) {
      return NextResponse.json(
        { error: "غير مصرح بالدخول" },
        { status: 401 }
      );
    }

    const decoded = await verifyToken(token);
    if (!decoded) {
      return NextResponse.json(
        { error: "رمز غير صالح" },
        { status: 401 }
      );
    }

    const arrivedSafeHistory = await db.arrivedSafe.findMany({
      where: { userId: decoded.userId },
      orderBy: { createdAt: "desc" },
      take: 50,
    });

    return NextResponse.json({ history: arrivedSafeHistory });
  } catch (error) {
    console.error("Get arrived safe error:", error);
    return NextResponse.json(
      { error: "حدث خطأ أثناء جلب السجل" },
      { status: 500 }
    );
  }
}

// POST - Create new arrived safe check-in
export async function POST(request: NextRequest) {
  try {
    const token = request.cookies.get("auth-token")?.value;
    
    if (!token) {
      return NextResponse.json(
        { error: "غير مصرح بالدخول" },
        { status: 401 }
      );
    }

    const decoded = await verifyToken(token);
    if (!decoded) {
      return NextResponse.json(
        { error: "رمز غير صالح" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { latitude, longitude, locationName, sessionId, sendSMS, sendWhatsApp } = body;

    if (!latitude || !longitude) {
      return NextResponse.json(
        { error: "الموقع مطلوب" },
        { status: 400 }
      );
    }

    // Get user's emergency contacts
    const emergencyContacts = await db.emergencyContact.findMany({
      where: { userId: decoded.userId },
    });

    // Get user info
    const user = await db.user.findUnique({
      where: { id: decoded.userId },
    });

    // Create arrived safe record
    const arrivedSafe = await db.arrivedSafe.create({
      data: {
        userId: decoded.userId,
        sessionId: sessionId || null,
        latitude,
        longitude,
        locationName: locationName || null,
        smsSent: sendSMS && emergencyContacts.length > 0,
        whatsappSent: sendWhatsApp && emergencyContacts.length > 0,
        notifiedContacts: emergencyContacts.map(c => c.name).join(","),
      },
    });

    // In production, integrate with SMS/WhatsApp API here
    if (sendSMS && emergencyContacts.length > 0) {
      console.log(`[SMS] Would send SMS to ${emergencyContacts.length} contacts for user ${user?.name}`);
    }

    if (sendWhatsApp && emergencyContacts.length > 0) {
      console.log(`[WhatsApp] Would send WhatsApp to ${emergencyContacts.length} contacts for user ${user?.name}`);
    }

    // Update session if provided
    if (sessionId) {
      await db.session.update({
        where: { id: sessionId },
        data: { status: "completed", completedAt: new Date() },
      });
    }

    return NextResponse.json({
      success: true,
      message: "تم تسجيل وصولك بنجاح!",
      arrivedSafe,
      notifiedCount: emergencyContacts.length,
    });
  } catch (error) {
    console.error("Arrived safe error:", error);
    return NextResponse.json(
      { error: "حدث خطأ أثناء تسجيل الوصول" },
      { status: 500 }
    );
  }
}
