import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { markInAppNotificationAsRead } from '@/db/queries/inAppNotifications';

export async function PATCH(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: { code: 'UNAUTHORIZED', message: '인증이 필요합니다' } },
        { status: 401 },
      );
    }

    const { id } = await params;
    const notificationId = parseInt(id, 10);
    if (isNaN(notificationId)) {
      return NextResponse.json(
        { error: { code: 'VALIDATION_ERROR', message: '유효하지 않은 알림 ID입니다' } },
        { status: 400 },
      );
    }

    const updated = await markInAppNotificationAsRead(notificationId, session.user.id);
    if (!updated) {
      return NextResponse.json(
        { error: { code: 'NOT_FOUND', message: '알림을 찾을 수 없습니다' } },
        { status: 404 },
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('PATCH /api/notifications/in-app/:id/read error:', error);
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: '서버 오류가 발생했습니다' } },
      { status: 500 },
    );
  }
}
