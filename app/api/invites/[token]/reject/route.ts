import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { getInviteByToken, rejectInvite } from '@/db/queries/invites';

// POST /api/invites/[token]/reject — requires auth; marks invite as REJECTED
export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ token: string }> },
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json(
        { error: { code: 'UNAUTHORIZED', message: '로그인이 필요합니다' } },
        { status: 401 },
      );
    }

    const { token } = await params;
    const invite = await getInviteByToken(token);

    if (!invite) {
      return NextResponse.json(
        { error: { code: 'INVITE_NOT_FOUND', message: '초대 링크를 찾을 수 없습니다' } },
        { status: 404 },
      );
    }

    if (invite.status !== 'PENDING') {
      return NextResponse.json(
        { error: { code: 'INVITE_NOT_PENDING', message: '처리 가능한 상태의 초대가 아닙니다' } },
        { status: 400 },
      );
    }

    const updated = await rejectInvite(token);
    if (!updated) {
      return NextResponse.json(
        { error: { code: 'REJECT_FAILED', message: '초대 거절에 실패했습니다' } },
        { status: 500 },
      );
    }

    return NextResponse.json({ status: 'REJECTED' });
  } catch (error) {
    console.error('POST /api/invites/[token]/reject error:', error);
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: '서버 오류가 발생했습니다' } },
      { status: 500 },
    );
  }
}
