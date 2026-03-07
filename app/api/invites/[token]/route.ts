import { NextRequest, NextResponse } from 'next/server';
import { getInviteByToken } from '@/db/queries/invites';
import { getWorkspaceById } from '@/db/queries/workspaces';
import { getMemberById } from '@/db/queries/members';

// GET /api/invites/[token] — no auth required, returns invite preview info
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ token: string }> },
) {
  try {
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
        {
          error: {
            code: invite.status === 'EXPIRED' ? 'INVITE_EXPIRED' : 'INVITE_ALREADY_USED',
            message:
              invite.status === 'EXPIRED'
                ? '초대 링크가 만료되었습니다'
                : '이미 처리된 초대입니다',
          },
          status: invite.status,
        },
        { status: 400 },
      );
    }

    if (new Date(invite.expiresAt) < new Date()) {
      return NextResponse.json(
        { error: { code: 'INVITE_EXPIRED', message: '초대 링크가 만료되었습니다' }, status: 'EXPIRED' },
        { status: 400 },
      );
    }

    const [workspace, inviter] = await Promise.all([
      getWorkspaceById(invite.workspaceId),
      getMemberById(invite.invitedBy, invite.workspaceId),
    ]);

    return NextResponse.json({
      workspaceName: workspace?.name ?? '알 수 없는 워크스페이스',
      inviterName: inviter?.displayName ?? '알 수 없는 사용자',
      role: invite.role,
      status: invite.status,
      expiresAt: invite.expiresAt,
    });
  } catch (error) {
    console.error('GET /api/invites/[token] error:', error);
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: '서버 오류가 발생했습니다' } },
      { status: 500 },
    );
  }
}
