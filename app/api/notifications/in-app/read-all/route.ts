import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { markAllInAppNotificationsAsRead } from '@/db/queries/inAppNotifications';

export async function PATCH() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: { code: 'UNAUTHORIZED', message: '인증이 필요합니다' } },
        { status: 401 },
      );
    }

    const updatedCount = await markAllInAppNotificationsAsRead(session.user.id);
    return NextResponse.json({ updatedCount });
  } catch (error) {
    console.error('PATCH /api/notifications/in-app/read-all error:', error);
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: '서버 오류가 발생했습니다' } },
      { status: 500 },
    );
  }
}
