import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import bcrypt from 'bcryptjs';

// Demo user ID constant for consistent reference
export const DEMO_USER_ID = 'demo-user-001';

// GET - Create demo user if not exists and return user ID
export async function GET() {
  try {
    // Check if demo user exists
    let user = await db.user.findUnique({
      where: { id: DEMO_USER_ID },
    });

    if (!user) {
      // Create demo user
      const hashedPassword = await bcrypt.hash('demo123456', 10);
      user = await db.user.create({
        data: {
          id: DEMO_USER_ID,
          email: 'demo@tamenny.app',
          password: hashedPassword,
          name: 'مستخدم تجريبي',
          phone: '+20 123 456 7890',
          gender: 'male',
          isVerified: true,
        },
      });

      // Create some demo contacts
      await db.contact.createMany({
        data: [
          {
            userId: DEMO_USER_ID,
            name: 'أحمد علي',
            phone: '+20 123 456 7891',
            email: 'ahmed@email.com',
            relation: 'أخ',
            isFavorite: true,
            isEmergencyContact: true,
            notifyOnEmergency: true,
            notifyOnArrival: true,
          },
          {
            userId: DEMO_USER_ID,
            name: 'محمد حسن',
            phone: '+20 987 654 3210',
            email: 'mohamed@email.com',
            relation: 'صديق',
            isFavorite: true,
            isEmergencyContact: false,
            notifyOnEmergency: true,
            notifyOnArrival: false,
          },
          {
            userId: DEMO_USER_ID,
            name: 'سارة أحمد',
            phone: '+20 555 123 4567',
            email: 'sara@email.com',
            relation: 'صديق',
            isFavorite: false,
            isEmergencyContact: false,
            notifyOnEmergency: true,
            notifyOnArrival: false,
          },
          {
            userId: DEMO_USER_ID,
            name: 'كريم محمد',
            phone: '+20 111 222 3333',
            email: 'karim@email.com',
            relation: 'زميل',
            isFavorite: false,
            isEmergencyContact: false,
            notifyOnEmergency: false,
            notifyOnArrival: false,
          },
          {
            userId: DEMO_USER_ID,
            name: 'ليلى سعيد',
            phone: '+20 444 555 6666',
            email: 'layla@email.com',
            relation: 'صديق',
            isFavorite: false,
            isEmergencyContact: false,
            notifyOnEmergency: true,
            notifyOnArrival: true,
          },
        ],
      });

      // Create emergency contacts
      await db.emergencyContact.createMany({
        data: [
          {
            userId: DEMO_USER_ID,
            name: 'أحمد محمد',
            phone: '+20 123 456 7890',
            relation: 'أخ',
            priority: 1,
          },
          {
            userId: DEMO_USER_ID,
            name: 'سارة أحمد',
            phone: '+20 987 654 3210',
            relation: 'زوجة',
            priority: 2,
          },
          {
            userId: DEMO_USER_ID,
            name: 'محمد علي',
            phone: '+20 555 123 4567',
            relation: 'صديق',
            priority: 3,
          },
        ],
      });

      // Create demo groups
      const group1 = await db.group.create({
        data: {
          id: 'group-001',
          name: 'رحلة العمل',
          description: 'مشاركة الموقع مع زملاء العمل',
          createdBy: DEMO_USER_ID,
        },
      });

      await db.groupMember.createMany({
        data: [
          {
            groupId: group1.id,
            userId: DEMO_USER_ID,
            role: 'admin',
          },
        ],
      });

      const group2 = await db.group.create({
        data: {
          id: 'group-002',
          name: 'العائلة',
          description: 'تواصل دائم مع العائلة',
          createdBy: DEMO_USER_ID,
        },
      });

      await db.groupMember.createMany({
        data: [
          {
            groupId: group2.id,
            userId: DEMO_USER_ID,
            role: 'admin',
          },
        ],
      });

      const group3 = await db.group.create({
        data: {
          id: 'group-003',
          name: 'أصدقاء الجامعة',
          description: 'لقاءات الأصدقاء',
          createdBy: DEMO_USER_ID,
        },
      });

      await db.groupMember.createMany({
        data: [
          {
            groupId: group3.id,
            userId: DEMO_USER_ID,
            role: 'admin',
          },
        ],
      });

      // Create demo safe zones
      await db.safeZone.createMany({
        data: [
          {
            userId: DEMO_USER_ID,
            name: 'المنزل',
            type: 'home',
            latitude: 30.0444,
            longitude: 31.2357,
            radius: 200,
            color: 'safe',
            notifyOnEnter: true,
            notifyOnExit: true,
          },
          {
            userId: DEMO_USER_ID,
            name: 'العمل',
            type: 'work',
            latitude: 30.0564,
            longitude: 31.2273,
            radius: 150,
            color: 'caution',
            notifyOnEnter: true,
            notifyOnExit: false,
          },
          {
            userId: DEMO_USER_ID,
            name: 'مدرسة الأبناء',
            type: 'school',
            latitude: 30.0334,
            longitude: 31.2427,
            radius: 100,
            color: 'safe',
            notifyOnEnter: true,
            notifyOnExit: true,
          },
        ],
      });

      // Create demo trip history
      await db.tripHistory.createMany({
        data: [
          {
            userId: DEMO_USER_ID,
            startLocation: 'المنزل',
            endLocation: 'المكتب',
            distance: 5.2,
            duration: 32,
            status: 'completed',
            transportMode: 'car',
            sharedWith: JSON.stringify(['أحمد', 'محمد']),
            locationType: 'work',
          },
          {
            userId: DEMO_USER_ID,
            startLocation: 'المنزل',
            endLocation: 'منزل الأهل',
            distance: 12.5,
            duration: 45,
            status: 'completed',
            transportMode: 'car',
            sharedWith: JSON.stringify(['سارة']),
            locationType: 'family',
          },
          {
            userId: DEMO_USER_ID,
            startLocation: 'المنزل',
            endLocation: 'الجامعة',
            distance: 8.7,
            duration: 35,
            status: 'completed',
            transportMode: 'walking',
            sharedWith: JSON.stringify(['مجموعة العائلة']),
            locationType: 'school',
          },
          {
            userId: DEMO_USER_ID,
            startLocation: 'المنزل',
            endLocation: 'المطار',
            distance: 25.3,
            duration: 55,
            status: 'cancelled',
            transportMode: 'car',
            sharedWith: JSON.stringify(['أحمد']),
            locationType: 'other',
          },
          {
            userId: DEMO_USER_ID,
            startLocation: 'المنزل',
            endLocation: 'النادي',
            distance: 3.2,
            duration: 20,
            status: 'completed',
            transportMode: 'bike',
            sharedWith: JSON.stringify(['محمد', 'خالد']),
            locationType: 'favorite',
          },
        ],
      });

      // Create demo notifications
      await db.notification.createMany({
        data: [
          {
            userId: DEMO_USER_ID,
            type: 'arrived',
            title: 'تم الوصول',
            message: 'أحمد وصل إلى العمل',
            isRead: false,
          },
          {
            userId: DEMO_USER_ID,
            type: 'session_expired',
            title: 'انتهت المشاركة',
            message: 'انتهت مدة مشاركة موقعك',
            isRead: true,
          },
          {
            userId: DEMO_USER_ID,
            type: 'safe_zone',
            title: 'منطقة آمنة',
            message: 'أحمد دخل منطقة المنزل',
            isRead: false,
          },
        ],
      });
    }

    return NextResponse.json({
      success: true,
      userId: user.id,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        avatar: user.avatar,
        gender: user.gender,
      },
    });
  } catch (error) {
    console.error('Error creating/finding demo user:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create demo user' },
      { status: 500 }
    );
  }
}
