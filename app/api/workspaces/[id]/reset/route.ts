import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { requireRole, isRoleError } from '@/lib/permissions';
import { resetWorkspaceSchema } from '@/lib/validations';
import { getWorkspaceById, resetWorkspaceData } from '@/db/queries/workspaces';
import { TEAM_ROLE } from '@/types/index';

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: { code: 'UNAUTHORIZED', message: '인증이 필요합니다' } }, { status: 401 });
    }
    const { id } = await params;
    const workspaceId = Number(id);
    if (isNaN(workspaceId)) {
      return NextResponse.json({ error: { code: 'VALIDATION_ERROR', message: '잘못된 워크스페이스 ID' } }, { status: 400 });
    }

    const roleCheck = await requireRole(session.user.id, workspaceId, TEAM_ROLE.OWNER);
    if (isRoleError(roleCheck)) return roleCheck;

    const body = await request.json();
    const parsed = resetWorkspaceSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: { code: 'VALIDATION_ERROR', message: '입력값이 올바르지 않습니다' } }, { status: 400 });
    }

    const workspace = await getWorkspaceById(workspaceId);
    if (!workspace) {
      return NextResponse.json({ error: { code: 'NOT_FOUND', message: '워크스페이스를 찾을 수 없습니다' } }, { status: 404 });
    }
    if (parsed.data.confirmName !== workspace.name) {
      return NextResponse.json({ error: { code: 'VALIDATION_ERROR', message: '워크스페이스 이름이 일치하지 않습니다' } }, { status: 400 });
    }

    await resetWorkspaceData(workspaceId);
    return new NextResponse(null, { status: 204 });
  } catch {
    return NextResponse.json({ error: { code: 'INTERNAL_ERROR', message: '서버 오류가 발생했습니다' } }, { status: 500 });
  }
}
