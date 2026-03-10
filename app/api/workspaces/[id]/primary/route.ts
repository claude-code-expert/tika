import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { getMemberByUserId } from '@/db/queries/members';
import { setPrimaryWorkspace } from '@/db/queries/members';

// PATCH /api/workspaces/:id/primary — set this workspace as the user's primary (active) workspace
export async function PATCH(
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

    const userId = session.user.id as string;

    // Verify the user is a member of this workspace
    const member = await getMemberByUserId(userId, workspaceId);
    if (!member) {
      return NextResponse.json(
        { error: { code: 'FORBIDDEN', message: '해당 워크스페이스의 멤버가 아닙니다' } },
        { status: 403 },
      );
    }

    await setPrimaryWorkspace(userId, workspaceId);

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('PATCH /api/workspaces/:id/primary error:', error);
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: '서버 오류가 발생했습니다' } },
      { status: 500 },
    );
  }
}
