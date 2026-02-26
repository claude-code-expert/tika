import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import {
  getNotificationLogs,
  getUnreadNotificationCount,
  markAllNotificationsAsRead,
} from '@/db/queries/notificationLogs';

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json(
        { error: { code: 'UNAUTHORIZED', message: '인증이 필요합니다' } },
        { status: 401 },
      );
    }

    const workspaceId = (session.user as Record<string, unknown>).workspaceId as number;
    const limitParam = new URL(request.url).searchParams.get('limit');
    const limit = limitParam ? Math.min(parseInt(limitParam, 10) || 20, 200) : 20;

    const [logs, unreadCount] = await Promise.all([
      getNotificationLogs(workspaceId, limit),
      getUnreadNotificationCount(workspaceId),
    ]);

    return NextResponse.json({ logs, unreadCount });
  } catch (error) {
    console.error('GET /api/notifications/logs error:', error);
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: '서버 오류가 발생했습니다' } },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json(
        { error: { code: 'UNAUTHORIZED', message: '인증이 필요합니다' } },
        { status: 401 },
      );
    }

    const workspaceId = (session.user as Record<string, unknown>).workspaceId as number;
    const body = (await request.json().catch(() => ({}))) as { action?: string };

    if (body.action !== 'markAllRead') {
      return NextResponse.json(
        { error: { code: 'VALIDATION_ERROR', message: '지원하지 않는 action입니다' } },
        { status: 400 },
      );
    }

    const updated = await markAllNotificationsAsRead(workspaceId);
    return NextResponse.json({ updated });
  } catch (error) {
    console.error('POST /api/notifications/logs error:', error);
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: '서버 오류가 발생했습니다' } },
      { status: 500 },
    );
  }
}
