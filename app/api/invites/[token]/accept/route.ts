import { NextRequest, NextResponse } from 'next/server';
import { eq } from 'drizzle-orm';
import { auth } from '@/lib/auth';
import { db } from '@/db/index';
import { users } from '@/db/schema';
import { getInviteByToken, acceptInvite } from '@/db/queries/invites';
import { getMemberByUserId, getMembersByWorkspace, setPrimaryWorkspace, getTeamWorkspaceMemberCount } from '@/db/queries/members';
import { getWorkspaceById } from '@/db/queries/workspaces';
import { NOTIFICATION_TYPE } from '@/types/index';
import { sendInAppNotification, buildMemberJoinedMessage } from '@/lib/notifications';

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
    const userId = session.user.id as string;
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

    // Check if user is already a member of the workspace
    const existing = await getMemberByUserId(userId, invite.workspaceId);
    if (existing) {
      return NextResponse.json(
        { error: { code: 'ALREADY_MEMBER', message: '이미 워크스페이스의 멤버입니다' } },
        { status: 409 },
      );
    }

    // Check if user has already reached the 3 TEAM workspace limit
    const memberCount = await getTeamWorkspaceMemberCount(userId);
    if (memberCount >= 3) {
      return NextResponse.json(
        {
          error: {
            code: 'WORKSPACE_MEMBER_LIMIT_EXCEEDED',
            message: '더 이상 워크스페이스에 참여할 수 없습니다. 팀 워크스페이스는 최대 3개까지 참여할 수 있습니다.',
          },
        },
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

    // If user hasn't completed onboarding, auto-set to WORKSPACE type and switch primary
    const [dbUser] = await db
      .select({ userType: users.userType })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (!dbUser?.userType) {
      await Promise.all([
        db.update(users).set({ userType: 'WORKSPACE' }).where(eq(users.id, userId)),
        setPrimaryWorkspace(userId, invite.workspaceId),
      ]);
    }

    // Notify workspace owners that a new member joined
    const [workspace, wsMembers] = await Promise.all([
      getWorkspaceById(invite.workspaceId),
      getMembersByWorkspace(invite.workspaceId),
    ]);
    const ownerUserIds = wsMembers.filter((m) => m.role === 'OWNER').map((m) => m.userId);
    const { title, message } = buildMemberJoinedMessage(displayName, workspace?.name ?? '워크스페이스');
    sendInAppNotification({
      workspaceId: invite.workspaceId,
      type: NOTIFICATION_TYPE.MEMBER_JOINED,
      title,
      message,
      link: `/workspace/${invite.workspaceId}/members`,
      actorId: userId,
      recipientUserIds: ownerUserIds,
      refType: 'member',
      refId: result.member.id,
    }).catch((e) => console.error('Notification error (member joined):', e));

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
