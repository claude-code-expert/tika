import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { getMembersWithEmailByWorkspace } from '@/db/queries/members';
import { requireRole, isRoleError } from '@/lib/permissions';
import { TEAM_ROLE } from '@/types/index';

// GET /api/workspaces/:id/members — list members with email (RBAC: VIEWER+)
export async function GET(
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
    const check = await requireRole(userId, workspaceId, TEAM_ROLE.VIEWER);
    if (isRoleError(check)) return check;

    const members = await getMembersWithEmailByWorkspace(workspaceId);
    return NextResponse.json({ members });
  } catch (error) {
    console.error('GET /api/workspaces/:id/members error:', error);
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: '서버 오류가 발생했습니다' } },
      { status: 500 },
    );
  }
}
