import { NextRequest, NextResponse } from 'next/server';
import { expireStaleInvites } from '@/db/queries/invites';

// GET /api/cron/expire-invites — called by Vercel Cron; expires stale PENDING invites
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
    const expired = await expireStaleInvites();
    console.log(`[cron/expire-invites] expired=${expired}`);
    return NextResponse.json({ expired });
  } catch (error) {
    console.error('[cron/expire-invites] error:', error);
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: '서버 오류가 발생했습니다' } },
      { status: 500 },
    );
  }
}
