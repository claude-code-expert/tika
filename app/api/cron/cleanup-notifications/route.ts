import { NextRequest, NextResponse } from 'next/server';
import { deleteOldInAppNotifications } from '@/db/queries/inAppNotifications';

// GET /api/cron/cleanup-notifications — deletes in-app notifications older than 7 days
export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization') ?? '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : '';
  if (!token || token !== process.env.CRON_SECRET) {
    return NextResponse.json(
      { error: { code: 'UNAUTHORIZED', message: '인증이 필요합니다' } },
      { status: 401 },
    );
  }

  try {
    const deleted = await deleteOldInAppNotifications();
    console.log(`[cron/cleanup-notifications] deleted=${deleted}`);
    return NextResponse.json({ deleted });
  } catch (error) {
    console.error('[cron/cleanup-notifications] error:', error);
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: '서버 오류가 발생했습니다' } },
      { status: 500 },
    );
  }
}
