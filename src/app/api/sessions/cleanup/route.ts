import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

/**
 * GET — يُشغَّل من cron job (Vercel Cron أو GitHub Actions)
 * تنظيف sessions المنتهية وحذف location points القديمة
 */
export async function GET(request: NextRequest) {
  try {
    // تحقق من secret key للمصادقة
    const authHeader = request.headers.get("authorization");
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // تحديث الـ sessions المنتهية إلى حالة expired
    const expiredSessions = await db.session.updateMany({
      where: {
        status: "active",
        expiresAt: { lt: new Date() },
      },
      data: { status: "expired" },
    });

    // حذف location points القديمة (أكثر من 30 يوم)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const deletedLocations = await db.locationPoint.deleteMany({
      where: {
        timestamp: { lt: thirtyDaysAgo },
      },
    });

    return NextResponse.json({
      success: true,
      expiredSessions: expiredSessions.count,
      deletedLocations: deletedLocations.count,
    });
  } catch (error) {
    console.error("Cleanup error:", error);
    return NextResponse.json(
      { error: "حدث خطأ أثناء التنظيف" },
      { status: 500 }
    );
  }
}
