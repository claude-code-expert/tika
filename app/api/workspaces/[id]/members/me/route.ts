import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { getMemberByUserId, removeMember } from '@/db/queries/members';
import { TEAM_ROLE } from '@/types/index';

// DELETE /api/workspaces/:id/members/me — leave workspace (MEMBER/VIEWER only)
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json(
        { error: { code: 'UNAUTHORIZED', message: '인증이 필요합니다' } },
        { status: 401 },
      );
    }

    const { id: idStr } = await params;
    const workspaceId = Number(idStr);
    if (Number.isNaN(workspaceId)) {
      return NextResponse.json(
        { error: { code: 'VALIDATION_ERROR', message: '유효하지 않은 워크스페이스 ID입니다' } },
        { status: 400 },
      );
    }

    const userId = (session.user as Record<string, unknown>).id as string;
    const member = await getMemberByUserId(userId, workspaceId);

    if (!member) {
      return NextResponse.json(
        { error: { code: 'NOT_FOUND', message: '워크스페이스 멤버가 아닙니다' } },
        { status: 404 },
      );
    }

    if (member.role === TEAM_ROLE.OWNER) {
      return NextResponse.json(
        { error: { code: 'OWNER_CANNOT_LEAVE', message: 'OWNER는 워크스페이스를 탈퇴할 수 없습니다. 소유권을 이전하거나 워크스페이스를 삭제하세요' } },
        { status: 400 },
      );
    }

    await removeMember(member.id, workspaceId);
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error('DELETE /api/workspaces/:id/members/me error:', error);
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: '서버 오류가 발생했습니다' } },
      { status: 500 },
    );
  }
}
