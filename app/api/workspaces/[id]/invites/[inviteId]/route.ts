import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { revokeInvite } from '@/db/queries/invites';
import { requireRole, isRoleError } from '@/lib/permissions';
import { TEAM_ROLE } from '@/types/index';

// DELETE /api/workspaces/:id/invites/:inviteId — revoke pending invite (RBAC: OWNER)
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string; inviteId: string }> },
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json(
        { error: { code: 'UNAUTHORIZED', message: '인증이 필요합니다' } },
        { status: 401 },
      );
    }

    const { id: idStr, inviteId: inviteIdStr } = await params;
    const workspaceId = Number(idStr);
    const inviteId = Number(inviteIdStr);
    if (Number.isNaN(workspaceId) || Number.isNaN(inviteId)) {
      return NextResponse.json(
        { error: { code: 'VALIDATION_ERROR', message: '유효하지 않은 ID입니다' } },
        { status: 400 },
      );
    }

    const userId = (session.user as Record<string, unknown>).id as string;
    const check = await requireRole(userId, workspaceId, TEAM_ROLE.OWNER);
    if (isRoleError(check)) return check;

    const revoked = await revokeInvite(inviteId, workspaceId);
    if (!revoked) {
      return NextResponse.json(
        { error: { code: 'INVITE_NOT_PENDING', message: '취소할 수 있는 초대가 없습니다' } },
        { status: 400 },
      );
    }

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error('DELETE /api/workspaces/:id/invites/:inviteId error:', error);
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: '서버 오류가 발생했습니다' } },
      { status: 500 },
    );
  }
}
