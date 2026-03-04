import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { getInviteByToken, acceptInvite } from '@/db/queries/invites';
import { getMemberByUserId } from '@/db/queries/members';

// POST /api/invites/[token]/accept — requires auth; validates email match; creates member
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
    const userEmail = session.user.email as string | undefined;
    const userId = (session.user as Record<string, unknown>).id as string;
    const displayName = (session.user.name as string | null) ?? '사용자';

    const invite = await getInviteByToken(token);

    if (!invite) {
      return NextResponse.json(
        { error: { code: 'INVITE_NOT_FOUND', message: '초대 링크를 찾을 수 없습니다' } },
        { status: 404 },
      );
    }

    if (invite.status !== 'PENDING') {
      return NextResponse.json(
        { error: { code: 'INVITE_ALREADY_USED', message: '이미 처리된 초대입니다' } },
        { status: 400 },
      );
    }

    if (new Date(invite.expiresAt) < new Date()) {
      return NextResponse.json(
        { error: { code: 'INVITE_EXPIRED', message: '초대 링크가 만료되었습니다' } },
        { status: 400 },
      );
    }

    if (!userEmail || userEmail.toLowerCase() !== invite.email.toLowerCase()) {
      return NextResponse.json(
        {
          error: {
            code: 'EMAIL_MISMATCH',
            message: '초대받은 이메일 주소와 로그인 계정이 일치하지 않습니다',
          },
        },
        { status: 403 },
      );
    }

    // Check if user is already a member of the workspace
    const existing = await getMemberByUserId(userId, invite.workspaceId);
    if (existing) {
      return NextResponse.json(
        { error: { code: 'ALREADY_MEMBER', message: '이미 워크스페이스의 멤버입니다' } },
        { status: 409 },
      );
    }

    const result = await acceptInvite({ token, userId, displayName });
    if (!result) {
      return NextResponse.json(
        { error: { code: 'ACCEPT_FAILED', message: '초대 수락에 실패했습니다' } },
        { status: 500 },
      );
    }

    return NextResponse.json({
      workspaceId: result.member.workspaceId,
      role: result.member.role,
    });
  } catch (error) {
    console.error('POST /api/invites/[token]/accept error:', error);
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: '서버 오류가 발생했습니다' } },
      { status: 500 },
    );
  }
}
