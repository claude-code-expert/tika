import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { getWorkspaceById, updateWorkspace, deleteWorkspace } from '@/db/queries/workspaces';
import { requireRole, isRoleError } from '@/lib/permissions';
import { updateWorkspaceSchema, deleteWorkspaceSchema } from '@/lib/validations';
import { TEAM_ROLE } from '@/types/index';

// PATCH /api/workspaces/:id — update workspace name/description (RBAC: OWNER)
export async function PATCH(
  request: NextRequest,
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

    const check = await requireRole(userId, workspaceId, TEAM_ROLE.OWNER);
    if (isRoleError(check)) return check;

    const body = await request.json();
    const result = updateWorkspaceSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        { error: { code: 'VALIDATION_ERROR', message: result.error.errors[0]?.message ?? '입력 오류' } },
        { status: 400 },
      );
    }

    const updated = await updateWorkspace(workspaceId, result.data);
    if (!updated) {
      return NextResponse.json(
        { error: { code: 'NOT_FOUND', message: '워크스페이스를 찾을 수 없습니다' } },
        { status: 404 },
      );
    }

    return NextResponse.json({ workspace: updated });
  } catch (error) {
    console.error('PATCH /api/workspaces/:id error:', error);
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: '서버 오류가 발생했습니다' } },
      { status: 500 },
    );
  }
}

// DELETE /api/workspaces/:id — delete workspace with name confirmation (RBAC: OWNER)
export async function DELETE(
  request: NextRequest,
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

    const check = await requireRole(userId, workspaceId, TEAM_ROLE.OWNER);
    if (isRoleError(check)) return check;

    const workspace = await getWorkspaceById(workspaceId);
    if (!workspace) {
      return NextResponse.json(
        { error: { code: 'NOT_FOUND', message: '워크스페이스를 찾을 수 없습니다' } },
        { status: 404 },
      );
    }

    const body = await request.json();
    const result = deleteWorkspaceSchema.safeParse(body);
    if (!result.success || result.data.confirmName !== workspace.name) {
      return NextResponse.json(
        { error: { code: 'NAME_MISMATCH', message: '워크스페이스 이름이 일치하지 않습니다' } },
        { status: 400 },
      );
    }

    await deleteWorkspace(workspaceId);
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error('DELETE /api/workspaces/:id error:', error);
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: '서버 오류가 발생했습니다' } },
      { status: 500 },
    );
  }
}
