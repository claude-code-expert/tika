import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { requireRole, isRoleError } from '@/lib/permissions';
import { getSprintById, completeSprint } from '@/db/queries/sprints';
import { updateTicket } from '@/db/queries/tickets';
import { completeSprintSchema } from '@/lib/validations';

type RouteParams = { params: Promise<{ id: string; sid: string }> };

// POST /api/workspaces/[id]/sprints/[sid]/complete — ACTIVE → COMPLETED + move tickets
export async function POST(request: NextRequest, { params }: RouteParams) {
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

    if (sprint.status !== 'ACTIVE') {
      return NextResponse.json(
        { error: { code: 'SPRINT_NOT_ACTIVE', message: 'ACTIVE 상태의 스프린트만 완료할 수 있습니다' } },
        { status: 400 },
      );
    }

    const body = await request.json();
    const result = completeSprintSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        { error: { code: 'VALIDATION_ERROR', message: result.error.errors[0]?.message ?? '입력 오류' } },
        { status: 400 },
      );
    }

    // Move tickets
    let movedCount = 0;
    for (const move of result.data.ticketMoves) {
      if (move.destination === 'backlog') {
        await updateTicket(move.ticketId, workspaceId, { sprintId: null });
      } else if (move.destination === 'sprint' && move.targetSprintId) {
        await updateTicket(move.ticketId, workspaceId, { sprintId: move.targetSprintId });
      }
      movedCount++;
    }

    const completed = await completeSprint(sprintId, workspaceId);
    if (!completed) {
      return NextResponse.json(
        { error: { code: 'COMPLETE_FAILED', message: '스프린트 완료에 실패했습니다' } },
        { status: 500 },
      );
    }

    return NextResponse.json({ sprint: completed, movedCount });
  } catch (error) {
    console.error('POST /api/workspaces/[id]/sprints/[sid]/complete error:', error);
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: '서버 오류가 발생했습니다' } },
      { status: 500 },
    );
  }
}
