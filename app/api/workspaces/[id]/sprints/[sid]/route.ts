import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { requireRole, isRoleError } from '@/lib/permissions';
import { getSprintById, updateSprint, deleteSprint } from '@/db/queries/sprints';
import { updateSprintSchema } from '@/lib/validations';

type RouteParams = { params: Promise<{ id: string; sid: string }> };

export async function GET(_request: NextRequest, { params }: RouteParams) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json(
        { error: { code: 'UNAUTHORIZED', message: '인증이 필요합니다' } },
        { status: 401 },
      );
    }

    const { id, sid } = await params;
    const workspaceId = Number(id);
    const sprintId = Number(sid);
    if (Number.isNaN(workspaceId) || Number.isNaN(sprintId)) {
      return NextResponse.json(
        { error: { code: 'VALIDATION_ERROR', message: '유효하지 않은 ID입니다' } },
        { status: 400 },
      );
    }

    const userId = session.user.id as string;
    const check = await requireRole(userId, workspaceId, 'VIEWER');
    if (isRoleError(check)) return check;

    const sprint = await getSprintById(sprintId, workspaceId);
    if (!sprint) {
      return NextResponse.json(
        { error: { code: 'NOT_FOUND', message: '스프린트를 찾을 수 없습니다' } },
        { status: 404 },
      );
    }

    return NextResponse.json({ sprint });
  } catch (error) {
    console.error('GET /api/workspaces/[id]/sprints/[sid] error:', error);
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: '서버 오류가 발생했습니다' } },
      { status: 500 },
    );
  }
}

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json(
        { error: { code: 'UNAUTHORIZED', message: '인증이 필요합니다' } },
        { status: 401 },
      );
    }

    const { id, sid } = await params;
    const workspaceId = Number(id);
    const sprintId = Number(sid);
    if (Number.isNaN(workspaceId) || Number.isNaN(sprintId)) {
      return NextResponse.json(
        { error: { code: 'VALIDATION_ERROR', message: '유효하지 않은 ID입니다' } },
        { status: 400 },
      );
    }

    const userId = session.user.id as string;
    const check = await requireRole(userId, workspaceId, 'OWNER');
    if (isRoleError(check)) return check;

    const body = await request.json();
    const result = updateSprintSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        { error: { code: 'VALIDATION_ERROR', message: result.error.errors[0]?.message ?? '입력 오류' } },
        { status: 400 },
      );
    }

    const sprint = await updateSprint(sprintId, workspaceId, result.data);
    if (!sprint) {
      return NextResponse.json(
        { error: { code: 'NOT_FOUND', message: '스프린트를 찾을 수 없습니다' } },
        { status: 404 },
      );
    }

    return NextResponse.json({ sprint });
  } catch (error) {
    console.error('PATCH /api/workspaces/[id]/sprints/[sid] error:', error);
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: '서버 오류가 발생했습니다' } },
      { status: 500 },
    );
  }
}

export async function DELETE(_request: NextRequest, { params }: RouteParams) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json(
        { error: { code: 'UNAUTHORIZED', message: '인증이 필요합니다' } },
        { status: 401 },
      );
    }

    const { id, sid } = await params;
    const workspaceId = Number(id);
    const sprintId = Number(sid);
    if (Number.isNaN(workspaceId) || Number.isNaN(sprintId)) {
      return NextResponse.json(
        { error: { code: 'VALIDATION_ERROR', message: '유효하지 않은 ID입니다' } },
        { status: 400 },
      );
    }

    const userId = session.user.id as string;
    const check = await requireRole(userId, workspaceId, 'OWNER');
    if (isRoleError(check)) return check;

    const sprint = await getSprintById(sprintId, workspaceId);
    if (!sprint) {
      return NextResponse.json(
        { error: { code: 'NOT_FOUND', message: '스프린트를 찾을 수 없습니다' } },
        { status: 404 },
      );
    }

    if (sprint.status !== 'PLANNED') {
      return NextResponse.json(
        { error: { code: 'SPRINT_NOT_DELETABLE', message: 'PLANNED 상태의 스프린트만 삭제할 수 있습니다' } },
        { status: 400 },
      );
    }

    await deleteSprint(sprintId, workspaceId);
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error('DELETE /api/workspaces/[id]/sprints/[sid] error:', error);
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: '서버 오류가 발생했습니다' } },
      { status: 500 },
    );
  }
}
