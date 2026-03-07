import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { requireRole, isRoleError } from '@/lib/permissions';
import { getSprintsWithTicketCount, createSprint } from '@/db/queries/sprints';
import { createSprintSchema } from '@/lib/validations';

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

    const { id } = await params;
    const workspaceId = Number(id);
    if (Number.isNaN(workspaceId)) {
      return NextResponse.json(
        { error: { code: 'VALIDATION_ERROR', message: '유효하지 않은 워크스페이스 ID입니다' } },
        { status: 400 },
      );
    }

    const userId = session.user.id as string;
    const check = await requireRole(userId, workspaceId, 'VIEWER');
    if (isRoleError(check)) return check;

    const sprints = await getSprintsWithTicketCount(workspaceId);
    return NextResponse.json({ sprints });
  } catch (error) {
    console.error('GET /api/workspaces/[id]/sprints error:', error);
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: '서버 오류가 발생했습니다' } },
      { status: 500 },
    );
  }
}

export async function POST(
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

    const { id } = await params;
    const workspaceId = Number(id);
    if (Number.isNaN(workspaceId)) {
      return NextResponse.json(
        { error: { code: 'VALIDATION_ERROR', message: '유효하지 않은 워크스페이스 ID입니다' } },
        { status: 400 },
      );
    }

    const userId = session.user.id as string;
    const check = await requireRole(userId, workspaceId, 'OWNER');
    if (isRoleError(check)) return check;

    const body = await request.json();
    const result = createSprintSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        { error: { code: 'VALIDATION_ERROR', message: result.error.errors[0]?.message ?? '입력 오류' } },
        { status: 400 },
      );
    }

    const sprint = await createSprint(workspaceId, result.data);
    return NextResponse.json({ sprint }, { status: 201 });
  } catch (error) {
    console.error('POST /api/workspaces/[id]/sprints error:', error);
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: '서버 오류가 발생했습니다' } },
      { status: 500 },
    );
  }
}
